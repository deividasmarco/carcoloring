/**
 * Garage: a swipeable carousel of cars on the neon-garage turntable.
 *
 * - At rest exactly one car is visible: the selected one. Its direct
 *   neighbours stay mounted (so a swipe starts without delay) but hidden.
 *   Cars further away mount only while a snap passes them, and unmount when
 *   the latest snap settles.
 * - Visibility is done by clipping, never by a Skia Group's opacity: Skia does
 *   not apply Group opacity to <Picture> children, which is how every mounted
 *   car once piled up on one spot. Each car is clipped to its own frame (the
 *   screen plus a margin), frames are spaced further apart than they are
 *   wide, so outgoing and incoming cars never overlap, and a hidden car's clip
 *   is empty.
 * - Finger tracking is immediate (UI-thread pan); release snaps to one car with
 *   a well-damped spring (~390 ms settle, no visible bounce). One car per swipe.
 * - Every snap carries a token. Only the latest snap may report that it
 *   settled, so callbacks from interrupted snaps are ignored during rapid
 *   navigation.
 * - Cars move at full speed with a slight scale change; the garage wall moves
 *   more slowly (parallax). Each car's turntable glows in its accent colour.
 * - Reduced motion: cars swap in place halfway through a swipe (never both at
 *   once); no parallax.
 * - The car drawn, its name, bay number, counter, saved paint, access badge,
 *   action button and studio route all come from the same GARAGE entry.
 * - Premium vehicles stay visible with a small lock badge. A locked vehicle's
 *   button never offers a purchase: it shows one calm line saying a grown-up
 *   can unlock it in the parent area, or "Look at it" when the child already
 *   painted it (view-only).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, Group, Image, Oval, Picture, type SkPicture } from '@shopify/react-native-skia';
import { GARAGE, garageIndexOf, type GarageEntry } from '../../content/registry';
import { drawGarageBackground, drawTurntable } from '../../content/scenes/neon-garage/background';
import { GarageAmbience } from '../../content/scenes/neon-garage/effects';
import { SCENE_LAYOUT } from '../../content/scenes/neon-garage/layout';
import { recordPicture } from '../../engine/render/picture';
import { installGarageProbe } from '../../dev/webProbe';
import { getVehicleRuntime } from '../../engine/vehicle/vehicleRuntime';
import { drawingKeyOf } from '../../state/drawingKey';
import { preloadPaintPreview, usePaintPreview } from '../../state/paintPreview';
import { accessOf, canPaint, premiumStore, usePremium } from '../../state/premium';
import { setSettings, useReduceMotion, useSettings, useSettingsReady } from '../../state/settings';
import { tick } from '../../ui/haptics';
import { Icon } from '../../ui/icons';
import { colors, fonts } from '../../ui/theme';
import { swipeRelease } from './swipeRelease';

const COUNT = GARAGE.length;
const STAGE = SCENE_LAYOUT.carStage;
/** Scene-unit box every car fits in (see SCENE_LAYOUT.carStage). */
const CAR_BOX = { x: STAGE.centerX - STAGE.maxWidth / 2, y: STAGE.groundY - STAGE.maxHeight, width: STAGE.maxWidth, height: STAGE.maxHeight };
const FLOOR_BELOW = 40; // scene units of floor kept visible under the wheels
const PARALLAX_DP = 36; // background shift per car
const NEIGHBOUR_SCALE = 0.88;
/** Each car's frame reaches this far past the screen edges, so its turntable ring is never cut. */
const SLIDE_MARGIN = 16;
/** Space between neighbouring frames. */
const SLIDE_GAP = 24;
const SPRING = { duration: 260, dampingRatio: 0.9 } as const; // ≈390 ms to settle
const REDUCED_SNAP_MS = 200;
const BLEED = { x: -2600, y: -2600, width: 6800, height: 6800 };
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Used inside worklets (UI thread), so it must be a worklet itself. */
function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

interface View2D {
  scale: number;
  tx: number;
  ty: number;
}

/** Geometry shared by every car's frame. */
interface SlideFrame {
  view: View2D;
  /** The frame (the screen plus SLIDE_MARGIN on each side) in scene units: each car is clipped to it. */
  clip: { x: number; y: number; width: number; height: number };
  /** Distance between neighbouring cars; larger than the frame, so frames never overlap. */
  slideW: number;
  /** The car's ground point on screen (cars scale about it, staying on the floor). */
  gx: number;
  gy: number;
}

/** Clip of a hidden car: nothing is drawn. */
const HIDDEN = { x: 0, y: 0, width: 0, height: 0 };

let backgroundPicture: SkPicture | null = null;
const turntables = new Map<string, SkPicture>();
const garageBackground = () => (backgroundPicture ??= recordPicture(BLEED, (c) => drawGarageBackground(c, { turntable: false })));
function turntablePicture(accent: string) {
  let p = turntables.get(accent);
  if (!p) {
    p = recordPicture(BLEED, (c) => drawTurntable(c, accent));
    turntables.set(accent, p);
  }
  return p;
}

// ── Gesture and navigation (module level: worklets share state via shared values) ─

/** Whether a finger is on the carousel; when it last lifted, and how that release was read (for the development probe). */
interface DragState {
  active: boolean;
  endedAt: number;
  release?: { travel: number; velocity: number; dir: number };
}

interface Nav {
  position: SharedValue<number>;
  /** Car the carousel is settled on or snapping to. */
  target: SharedValue<number>;
  /** Raised by every snap; only the latest snap may report that it settled. */
  token: SharedValue<number>;
  /** Car the current swipe started from, and the position the finger grabbed. */
  startIndex: SharedValue<number>;
  anchor: SharedValue<number>;
  /** Time the last swipe ended (a press right after a swipe is not a tap on the button). */
  drag: SharedValue<DragState>;
}

interface NavEvents {
  /** A finger is down on the carousel; `from` is the car it starts from. */
  engage(from: number): void;
  /** The finger lifted (whether or not it swiped). */
  release(): void;
  /** A snap to `target` started. */
  snap(target: number, token: number): void;
  /** The snap with `token` finished at `target`. */
  settled(target: number, token: number): void;
}

/** Animates the carousel to `target`. Runs on the UI thread. */
function snapTo(nav: Nav, target: number, reduce: boolean, velocity: number, ev: NavEvents) {
  'worklet';
  const token = nav.token.value + 1;
  nav.token.value = token;
  nav.target.value = target;
  // Report the snap before starting it: with the system's reduce-motion setting
  // on, Reanimated finishes animations at once and `done` runs immediately.
  runOnJS(ev.snap)(target, token);
  const done = (finished?: boolean) => {
    'worklet';
    // Interrupted (finger down, newer snap) or superseded snaps report nothing.
    if (finished && nav.token.value === token) runOnJS(ev.settled)(target, token);
  };
  nav.position.value = reduce
    ? withTiming(target, { duration: REDUCED_SNAP_MS }, done)
    : withSpring(target, { ...SPRING, velocity }, done);
}

function createCarouselPan(nav: Nav, slideW: number, reduce: boolean, ev: NavEvents) {
  return Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-28, 28])
    .onBegin(() => {
      // Mount the neighbours before the finger starts moving.
      runOnJS(ev.engage)(nav.target.value);
    })
    .onStart(() => {
      // A swipe during a snap continues from where the cars are and counts
      // from the car being snapped to, so quick repeated swipes never get lost.
      nav.startIndex.value = nav.target.value;
      nav.anchor.value = nav.position.value;
      nav.drag.value = { active: true, endedAt: 0 };
    })
    .onUpdate((e) => {
      const start = nav.startIndex.value;
      let next = clamp(nav.anchor.value - e.translationX / slideW, start - 1, start + 1); // one car per swipe
      if (next < 0) next *= 0.3; // rubber band at the ends
      if (next > COUNT - 1) next = COUNT - 1 + (next - (COUNT - 1)) * 0.3;
      nav.position.value = next;
    })
    .onEnd((e) => {
      const start = nav.startIndex.value;
      const { dir, velocity } = swipeRelease(e.translationX, e.velocityX, slideW);
      nav.drag.value = { active: false, endedAt: Date.now(), release: { travel: -e.translationX, velocity: -e.velocityX / slideW, dir } };
      snapTo(nav, clamp(start + dir, 0, COUNT - 1), reduce, velocity, ev);
    })
    .onFinalize(() => {
      if (nav.drag.value.active) {
        // Cancelled after it started moving, without an end: go back to where it started.
        nav.drag.value = { active: false, endedAt: Date.now() };
        snapTo(nav, nav.startIndex.value, reduce, 0, ev);
      }
      runOnJS(ev.release)();
    });
}

interface Range {
  lo: number;
  hi: number;
}

/**
 * JS side of the carousel: which car is selected and which cars are mounted.
 * At rest: the selected car and its direct neighbours (hidden). A snap mounts
 * the cars it passes; once the latest snap settles and no finger is down,
 * everything further than one car away unmounts.
 */
function createCarouselFlow(nav: Nav, initial: number, setRange: (update: (r: Range) => Range) => void, setSelected: (i: number) => void) {
  const f = { engaged: false, animating: false, token: 0, target: initial, selected: initial };
  const expand = (a: number, b: number) =>
    setRange((r) => {
      const lo = clamp(Math.min(r.lo, a), 0, COUNT - 1);
      const hi = clamp(Math.max(r.hi, b), 0, COUNT - 1);
      return lo === r.lo && hi === r.hi ? r : { lo, hi };
    });
  const focus = (i: number) =>
    setRange((r) => {
      const lo = clamp(i - 1, 0, COUNT - 1);
      const hi = clamp(i + 1, 0, COUNT - 1);
      return r.lo === lo && r.hi === hi ? r : { lo, hi };
    });
  const choose = (i: number) => {
    if (i === f.selected) return;
    f.selected = i;
    setSelected(i);
    tick();
    setSettings({ lastVehicle: GARAGE[i].vehicle.id });
  };
  const events: NavEvents = {
    engage: (from) => {
      f.engaged = true;
      expand(from - 1, from + 1);
    },
    release: () => {
      f.engaged = false;
      if (!f.animating) focus(f.target);
    },
    snap: (t, tok) => {
      f.token = tok;
      f.animating = true;
      f.target = t;
      expand(t - 1, t + 1);
      choose(t);
    },
    settled: (t, tok) => {
      if (tok !== f.token) return; // a newer snap has started since
      f.animating = false;
      if (!f.engaged) focus(t);
    },
  };
  return {
    nav,
    events,
    /** One car back or forward, counted from the car being snapped to, so quick repeated taps add up. */
    go(dir: -1 | 1, reduce: boolean) {
      const t = clamp(f.target + dir, 0, COUNT - 1);
      f.target = t;
      expand(t - 1, t + 1);
      runOnUI(snapTo)(nav, t, reduce, 0, events);
    },
    /** Jumps to `i` without animation (restoring the saved selection). */
    restore(i: number) {
      Object.assign(f, { animating: false, target: i, selected: i });
      setSelected(i);
      focus(i);
      nav.token.value += 1; // ignore any snap still running
      nav.position.value = i;
      nav.target.value = i;
    },
  };
}

function openStudio(router: ReturnType<typeof useRouter>, entry: GarageEntry, drag: SharedValue<DragState>) {
  const d = drag.value;
  if (d.active || Date.now() - d.endedAt < 300) return;
  tick();
  setSettings({ lastVehicle: entry.vehicle.id });
  router.push({ pathname: '/studio/[vehicleId]', params: { vehicleId: entry.vehicle.id } });
}

// ── One car on its turntable ────────────────────────────────────────────────

function CarSlide({ entry, index, position, frame, reduce }: { entry: GarageEntry; index: number; position: SharedValue<number>; frame: SlideFrame; reduce: boolean }) {
  const rt = useMemo(() => getVehicleRuntime(entry.vehicle), [entry.vehicle]);
  const preview = usePaintPreview(drawingKeyOf(entry.vehicle));
  const p = rt.placement;
  const rect = rt.layout.paintRect;
  const u = SCENE_LAYOUT.underglow;
  const turntable = turntablePicture(entry.vehicle.accent);
  const { view, slideW, gx, gy } = frame;
  const frameClip = frame.clip;

  const transform = useDerivedValue(() => {
    const d = index - position.value;
    const s = reduce ? 1 : 1 - (1 - NEIGHBOUR_SCALE) * Math.min(1, Math.abs(d));
    const shift = reduce ? 0 : d * slideW;
    // Scale about the car's ground point so it stays on the floor.
    return [
      { translateX: gx + shift },
      { translateY: gy },
      { scale: s },
      { translateX: -gx },
      { translateY: -gy },
      { translateX: view.tx },
      { translateY: view.ty },
      { scale: view.scale },
    ];
  });
  // Shown only while it is less than a slide away (half a slide with reduced
  // motion, where cars do not move apart); otherwise nothing is drawn.
  const clip = useDerivedValue(() => {
    const ad = Math.abs(index - position.value);
    return (reduce ? ad < 0.5 : ad < 1) ? frameClip : HIDDEN;
  });
  // The glow is an Oval (drawn with paint), so Group opacity does apply to it.
  // It brightens as the car reaches the centre; with reduced motion it stays still.
  const glow = useDerivedValue(() => (reduce ? 0.85 : 0.85 * clamp(1 - Math.abs(index - position.value) * 1.3, 0, 1)));

  return (
    <Group transform={transform}>
      <Group clip={clip}>
        <Picture picture={turntable} />
        <Group opacity={glow} blendMode="screen">
          <Oval x={u.cx - u.rx} y={u.cy - u.ry} width={u.rx * 2} height={u.ry * 2} color={entry.vehicle.accent} opacity={0.5} />
        </Group>
        <Group transform={[{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }]}>
          <Picture picture={rt.basePicture} />
          {preview.image ? <Image image={preview.image} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fit="fill" /> : null}
          <Picture picture={rt.overlayPicture} />
        </Group>
      </Group>
    </Group>
  );
}

// ── Animated labels ─────────────────────────────────────────────────────────

/** Labels fade out before the next fades in (gone by 0.45 of a slide), so two never overlap. */
function labelOpacity(d: number) {
  'worklet';
  return clamp(1 - Math.abs(d) * 2.2, 0, 1);
}

function SlidingLabel({ index, position, reduce, children }: { index: number; position: SharedValue<number>; reduce: boolean; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const d = index - position.value;
    return {
      opacity: labelOpacity(d),
      transform: [{ translateX: reduce ? 0 : d * 48 }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {children}
    </Animated.View>
  );
}

function RollingNumber({ index, position, reduce }: { index: number; position: SharedValue<number>; reduce: boolean }) {
  const style = useAnimatedStyle(() => {
    const d = index - position.value;
    return { opacity: labelOpacity(d), transform: [{ translateY: reduce ? 0 : d * 18 }] };
  });
  return <Animated.Text style={[styles.counterNow, StyleSheet.absoluteFill, style]}>{pad2(index + 1)}</Animated.Text>;
}

/** "02 / 07" with the current number rolling as the position changes. */
function Counter({ position, reduce, selected, indices }: { position: SharedValue<number>; reduce: boolean; selected: number; indices: number[] }) {
  return (
    <View style={styles.counter} accessible accessibilityLabel={`Car ${selected + 1} of ${COUNT}`}>
      <View style={styles.counterNowBox}>
        {indices.map((i) => (
          <RollingNumber key={GARAGE[i].vehicle.id} index={i} position={position} reduce={reduce} />
        ))}
      </View>
      <Text style={styles.counterTotal}> / {pad2(COUNT)}</Text>
    </View>
  );
}

function ArrowButton({ dir, disabled, onPress }: { dir: 'prev' | 'next'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir === 'prev' ? 'Previous car' : 'Next car'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Icon name={dir} size={28} color={colors.text} />
    </Pressable>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export function GarageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const settings = useSettings();
  const settingsReady = useSettingsReady();
  const reduce = useReduceMotion();
  const animate = settings.effects && !reduce;

  const [selected, setSelected] = useState(() => garageIndexOf(settings.lastVehicle));
  // Cars currently mounted: at rest, the selected one and its hidden neighbours.
  const [range, setRange] = useState<Range>(() => ({ lo: Math.max(0, selected - 1), hi: Math.min(COUNT - 1, selected + 1) }));
  const position = useSharedValue(selected);
  const target = useSharedValue(selected);
  const token = useSharedValue(0);
  const startIndex = useSharedValue(selected);
  const anchor = useSharedValue(selected);
  const drag = useSharedValue<DragState>({ active: false, endedAt: 0 });
  const [flow] = useState(() => createCarouselFlow({ position, target, token, startIndex, anchor, drag }, selected, setRange, setSelected));
  const restored = useRef(false);

  // Restore the last selected car once saved settings are known.
  useEffect(() => {
    if (!settingsReady || restored.current) return;
    restored.current = true;
    flow.restore(garageIndexOf(settings.lastVehicle));
  }, [settingsReady, settings.lastVehicle, flow]);

  const indices = useMemo(() => {
    const out = [];
    for (let i = range.lo; i <= range.hi; i++) out.push(i);
    return out;
  }, [range]);

  // Development-only probe for browser checks.
  const probeState = useRef({ selected, mounted: [] as string[], stage: { slideW: 0, top: 0, ground: 0 }, view: { scale: 1, tx: 0, ty: 0 } as View2D });
  useEffect(() => {
    Object.assign(probeState.current, { selected, mounted: indices.map((i) => GARAGE[i].vehicle.id) });
  }, [selected, indices]);
  useEffect(() => {
    installGarageProbe({
      position: () => position.value,
      selected: () => probeState.current.selected,
      mounted: () => probeState.current.mounted,
      stage: () => probeState.current.stage,
      lastRelease: () => drag.value.release ?? null,
      carRect: () => {
        // The selected vehicle's outline at rest, on screen (dp): its placement, then the stage view.
        const { view } = probeState.current;
        const rt = getVehicleRuntime(GARAGE[probeState.current.selected].vehicle);
        const b = rt.layout.silhouetteBounds;
        const p = rt.placement;
        const x = (b.x * p.scale + p.x) * view.scale + view.tx;
        const y = (b.y * p.scale + p.y) * view.scale + view.ty;
        return { x, y, width: b.width * p.scale * view.scale, height: b.height * p.scale * view.scale };
      },
      vehicleIds: GARAGE.map((e) => e.vehicle.id),
    });
    return () => installGarageProbe(null);
  }, [position, drag]);

  // Preload previews around the selection; warm the remaining cars when idle.
  useEffect(() => {
    for (let i = selected - 1; i <= selected + 1; i++) if (i >= 0 && i < COUNT) preloadPaintPreview(drawingKeyOf(GARAGE[i].vehicle));
  }, [selected]);
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i >= COUNT) return;
      getVehicleRuntime(GARAGE[i++].vehicle);
      timer = setTimeout(next, 60);
    };
    timer = setTimeout(next, 400);
    return () => clearTimeout(timer);
  }, []);

  // ── Layout ───────────────────────────────────────────────────────────────
  const landscape = width > height;
  const layout = useMemo(() => {
    let view: View2D;
    let groundY: number;
    if (landscape) {
      const side = 64 + Math.max(insets.left, insets.right);
      const top = insets.top + 44;
      const bottom = insets.bottom + 84;
      const scale = Math.min((width - side * 2) / CAR_BOX.width, (height - top - bottom) / (CAR_BOX.height + FLOOR_BELOW));
      view = { scale, tx: width / 2 - STAGE.centerX * scale, ty: top - CAR_BOX.y * scale };
      groundY = view.ty + STAGE.groundY * scale;
    } else {
      const scale = (width - 32) / CAR_BOX.width;
      const carH = CAR_BOX.height * scale;
      const group = carH + 24 + 84 + 16 + 56 + 24 + 64;
      const carTop = insets.top + Math.max(64, (height - insets.top - insets.bottom - group) / 2);
      view = { scale, tx: width / 2 - STAGE.centerX * scale, ty: carTop - CAR_BOX.y * scale };
      groundY = carTop + carH;
    }
    const frame: SlideFrame = {
      view,
      clip: { x: (-SLIDE_MARGIN - view.tx) / view.scale, y: -view.ty / view.scale, width: (width + SLIDE_MARGIN * 2) / view.scale, height: height / view.scale },
      slideW: width + SLIDE_MARGIN * 2 + SLIDE_GAP,
      gx: view.tx + STAGE.centerX * view.scale,
      gy: view.ty + STAGE.groundY * view.scale,
    };
    return { view, frame, groundY };
  }, [landscape, width, height, insets.top, insets.bottom, insets.left, insets.right]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const pan = useMemo(() => createCarouselPan(flow.nav, layout.frame.slideW, reduce, flow.events), [flow, layout.frame.slideW, reduce]);
  useEffect(() => {
    probeState.current.stage = { slideW: layout.frame.slideW, top: layout.view.ty + CAR_BOX.y * layout.view.scale, ground: layout.groundY };
    probeState.current.view = layout.view;
  }, [layout]);

  const bgTransform = useDerivedValue(() => {
    const shift = reduce ? 0 : -position.value * PARALLAX_DP;
    return [{ translateX: layout.view.tx + shift }, { translateY: layout.view.ty }, { scale: layout.view.scale }];
  }, [layout, reduce]);

  const entry = GARAGE[selected];
  const preview = usePaintPreview(drawingKeyOf(entry.vehicle));
  const premium = usePremium();
  const entitled = premiumStore().isEntitled();
  const access = accessOf(entry.vehicle.id, premium, entitled);
  const paintable = canPaint(access);
  const viewOnly = access === 'locked' && preview.hasPaint;
  const isLocked = (i: number) => accessOf(GARAGE[i].vehicle.id, premium, entitled) === 'locked';
  // Vehicle whose "ask a grown-up" line is showing (cleared by moving on).
  const [hintFor, setHintFor] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHint = hintFor === entry.vehicle.id;
  const open = () => openStudio(router, entry, drag);
  const askGrownUp = () => {
    tick();
    setHintFor(entry.vehicle.id);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintFor(null), 4500);
  };
  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );
  const action =
    access === 'checking' ? 'One moment' : paintable ? (preview.hasPaint ? 'Keep painting' : 'Start painting') : viewOnly ? 'Look at it' : 'Locked';
  const actionLabel = paintable
    ? `${action} the ${entry.vehicle.name}`
    : viewOnly
      ? `Look at your painting of the ${entry.vehicle.name}`
      : access === 'checking'
        ? `Checking the ${entry.vehicle.name}`
        : `The ${entry.vehicle.name} is locked. A grown-up can unlock it in the parent area.`;

  // Michroma is wide: size each name to the room it has instead of truncating.
  // Landscape puts the counter top-right, so the name has the room beside the button.
  const plateW = landscape ? Math.min(420, width - insets.left - insets.right - 44 - 250 - 24) : width - 40;
  // Michroma advances ≈0.95 em per capital, plus 3 pt letter spacing.
  const nameSize = (name: string) => Math.max(14, Math.min(30, Math.floor((plateW / name.length - 3) / 0.95)));
  const nameplate = (
    <View style={[styles.plate, landscape ? { width: plateW } : styles.platePortrait]}>
      {indices.map((i) => {
        const v = GARAGE[i].vehicle;
        return (
          <SlidingLabel key={v.id} index={i} position={position} reduce={reduce}>
            <View style={[styles.bayRow, !landscape && styles.bayRowCenter]}>
              <Text style={styles.bay}>BAY {pad2(i + 1)}</Text>
              {isLocked(i) ? (
                <View style={styles.lockPill} accessibilityLabel="Locked">
                  <Icon name="lock" size={12} color={colors.textDim} accent={colors.textDim} />
                  <Text style={styles.lockText}>PREMIUM</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.name, { fontSize: nameSize(v.name) }, !landscape && styles.center]} numberOfLines={1}>
              {v.name.toUpperCase()}
            </Text>
          </SlidingLabel>
        );
      })}
    </View>
  );
  const prev = <ArrowButton dir="prev" disabled={selected === 0} onPress={() => flow.go(-1, reduce)} />;
  const next = <ArrowButton dir="next" disabled={selected === COUNT - 1} onPress={() => flow.go(1, reduce)} />;
  const counter = <Counter position={position} reduce={reduce} selected={selected} indices={indices} />;
  const waiting = !preview.loaded || access === 'checking';
  const quiet = !paintable && !viewOnly;
  const button = (
    <View style={styles.goWrap}>
      {showHint ? (
        <Text style={[styles.hint, landscape ? styles.hintLandscape : styles.hintPortrait]} accessibilityLiveRegion="polite" pointerEvents="none">
          Ask a grown-up to unlock it in the parent area.
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityHint={entry.vehicle.description}
        onPress={paintable || viewOnly ? open : askGrownUp}
        disabled={waiting}
        style={({ pressed }) => [styles.go, quiet && styles.goQuiet, waiting && styles.loading, pressed && styles.pressed]}
      >
        <Icon
          name={paintable ? 'crayon' : viewOnly ? 'eye' : 'lock'}
          size={30}
          color={quiet ? colors.textDim : colors.bg}
          accent={quiet ? colors.textDim : colors.bg}
        />
        <Text style={[styles.goLabel, quiet && styles.goLabelQuiet]}>{action}</Text>
      </Pressable>
    </View>
  );
  const parents = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Parent area (for grown-ups)"
      onPress={() => router.push('/parents')}
      hitSlop={6}
      style={({ pressed }) => [styles.parents, pressed && styles.pressed]}
    >
      <Icon name="parent" size={22} color={colors.textDim} accent={colors.textDim} />
      <Text style={styles.parentsText}>Parents</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill} collapsable={false} testID="garage-carousel">
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Group transform={bgTransform}>
              <Picture picture={garageBackground()} />
              <GarageAmbience animate={animate} underglow={false} />
            </Group>
          </Canvas>
          {/* The cars' canvas is the clipped viewport: nothing draws outside it. */}
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none" testID="garage-cars">
            {indices.map((i) => (
              <CarSlide key={GARAGE[i].vehicle.id} entry={GARAGE[i]} index={i} position={position} frame={layout.frame} reduce={reduce} />
            ))}
          </Canvas>
        </View>
      </GestureDetector>

      <View style={[styles.brand, { top: insets.top + 14, left: insets.left + 22 }]} pointerEvents="none">
        <View style={styles.brandMark} />
        <Text style={styles.brandText}>NEON BAY</Text>
      </View>

      {landscape ? (
        <>
          <View style={[styles.sideArrows, { top: layout.groundY - 150, left: insets.left + 8, right: insets.right + 8 }]} pointerEvents="box-none">
            {prev}
            {next}
          </View>
          <View style={[styles.topRight, { top: insets.top + 8, right: insets.right + 14 }]}>
            {counter}
            {parents}
          </View>
          <View style={[styles.bottomLandscape, { left: insets.left + 24, right: insets.right + 20, bottom: insets.bottom + 14 }]} pointerEvents="box-none">
            {nameplate}
            {button}
          </View>
        </>
      ) : (
        <View style={[styles.topRight, { top: insets.top + 6, right: insets.right + 12 }]}>{parents}</View>
      )}
      {landscape ? null : (
        <View style={[styles.portraitColumn, { top: layout.groundY + 24 }]} pointerEvents="box-none">
          {nameplate}
          <View style={styles.counterRow}>
            {prev}
            {counter}
            {next}
          </View>
          {button}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  brand: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  brandText: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 5, color: colors.text },
  plate: { height: 84 },
  platePortrait: { alignSelf: 'stretch' },
  center: { textAlign: 'center' },
  bay: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.cyan },
  bayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, height: 20 },
  bayRowCenter: { justifyContent: 'center' },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(12, 17, 28, 0.85)',
  },
  lockText: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 2, color: colors.textDim },
  topRight: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 14 },
  parents: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(12, 17, 28, 0.7)',
  },
  parentsText: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: colors.textDim },
  goWrap: { alignItems: 'center' },
  goQuiet: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.lineStrong, shadowOpacity: 0, elevation: 0 },
  goLabelQuiet: { color: colors.textDim },
  // A small dark card, readable over the white vehicle too.
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(19, 26, 41, 0.94)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  hintPortrait: { position: 'absolute', top: 72, width: 300 },
  // The button sits at the right margin: the card grows leftwards from its right edge.
  hintLandscape: { position: 'absolute', bottom: 72, right: 0, width: 280 },
  name: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: 3,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 12,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  counter: { flexDirection: 'row', alignItems: 'center' },
  counterNowBox: { width: 34, height: 26, overflow: 'hidden' },
  counterNow: { fontFamily: fonts.labelBold, fontSize: 20, letterSpacing: 1, color: colors.text, textAlign: 'right' },
  counterTotal: { fontFamily: fonts.label, fontSize: 20, letterSpacing: 1, color: colors.textFaint },
  arrow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 26, 41, 0.82)',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  disabled: { opacity: 0.3 },
  pressed: { transform: [{ scale: 0.94 }] },
  loading: { opacity: 0.6 },
  sideArrows: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between' },
  counterTop: { position: 'absolute' },
  bottomLandscape: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  portraitColumn: { position: 'absolute', left: 20, right: 20, alignItems: 'center', gap: 16 },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 64,
    paddingLeft: 20,
    paddingRight: 26,
    borderRadius: 32,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.7,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  goLabel: { fontFamily: fonts.labelBold, fontSize: 16, letterSpacing: 2, color: colors.bg, textTransform: 'uppercase' },
});
