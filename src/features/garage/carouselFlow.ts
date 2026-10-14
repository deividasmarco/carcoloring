/**
 * JS side of the garage carousel (pure; no React or Reanimated here, so it
 * can be unit-tested).
 *
 * - The selection is a permanent vehicle id. Indices only describe positions
 *   in the carousel (what the gesture worklets work with), and every index
 *   coming from them is checked against the registry before it is used. An
 *   invalid one is reported and ignored: it never selects "undefined" and is
 *   never swapped for some other vehicle.
 * - Which vehicles are mounted (the range) is separate from the selection. At
 *   rest: the selected vehicle and its direct neighbours (hidden). A snap
 *   mounts the vehicles it passes; once the latest snap settles and no finger
 *   is down, everything further than one away unmounts.
 * - State updaters stay pure; side effects (haptics, remembering the
 *   selection) run in `onSelect`, outside any updater.
 */

export interface Range {
  lo: number;
  hi: number;
}

/** Events the gesture worklets send (through runOnJS). */
export interface NavEvents {
  /** A finger is down on the carousel; `from` is the index it starts from. */
  engage(from: number): void;
  /** The finger lifted (whether or not it swiped). */
  release(): void;
  /** A snap to index `target` started. */
  snap(target: number, token: number): void;
  /** The snap with this token finished (only the latest snap counts). */
  settled(target: number, token: number): void;
}

export interface CarouselFlowDeps {
  /** Vehicle ids in display order: the registry, the only authority. */
  ids: readonly string[];
  setRange(update: (r: Range) => Range): void;
  setSelectedId(id: string): void;
  /** Side effects of a new selection (haptic tick, remembering it). */
  onSelect(id: string): void;
  /** Starts the animated snap to `target` (on the UI thread). */
  startSnap(target: number, reduce: boolean, events: NavEvents): void;
  /** Places the carousel on `target` without animation, cancelling any snap. */
  jump(target: number): void;
  /** Where invalid input is reported (development diagnostics). */
  report?(problem: string): void;
}

export function createCarouselFlow(deps: CarouselFlowDeps, initialId: string) {
  const { ids } = deps;
  if (ids.length === 0) throw new Error('The garage has no vehicles to show.');
  const last = ids.length - 1;
  const report = deps.report ?? ((problem: string) => console.error(`[garage] ${problem}`));
  const valid = (i: unknown): i is number => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i <= last;
  const clampIndex = (i: number) => Math.min(last, Math.max(0, i));
  const initial = ids.indexOf(initialId);
  if (initial < 0) throw new Error(`Unknown vehicle "${initialId}" for the garage.`);

  const f = { engaged: false, animating: false, token: 0, target: initial, selectedId: initialId };

  const expand = (a: number, b: number) =>
    deps.setRange((r) => {
      const lo = clampIndex(Math.min(r.lo, a));
      const hi = clampIndex(Math.max(r.hi, b));
      return lo === r.lo && hi === r.hi ? r : { lo, hi };
    });
  const focus = (i: number) =>
    deps.setRange((r) => {
      const lo = clampIndex(i - 1);
      const hi = clampIndex(i + 1);
      return r.lo === lo && r.hi === hi ? r : { lo, hi };
    });
  const choose = (i: number) => {
    const id = ids[i];
    if (id === f.selectedId) return;
    f.selectedId = id;
    deps.setSelectedId(id);
    deps.onSelect(id);
  };

  const events: NavEvents = {
    engage: (from) => {
      if (!valid(from)) return report(`ignored a touch starting from invalid index ${String(from)}`);
      f.engaged = true;
      expand(from - 1, from + 1);
    },
    release: () => {
      f.engaged = false;
      if (!f.animating) focus(f.target);
    },
    snap: (t, tok) => {
      if (!valid(t)) return report(`ignored a snap to invalid index ${String(t)}`);
      f.token = tok;
      f.animating = true;
      f.target = t;
      expand(t - 1, t + 1);
      choose(t);
    },
    settled: (t, tok) => {
      if (tok !== f.token) return; // a newer snap has started since
      if (!valid(t)) return report(`ignored a settle on invalid index ${String(t)}`);
      f.animating = false;
      if (!f.engaged) focus(t);
    },
  };

  return {
    events,
    /** The selected vehicle's id. */
    selectedId: () => f.selectedId,
    /** One vehicle back or forward, counted from the one being snapped to, so quick repeated taps add up. */
    go(dir: -1 | 1, reduce: boolean) {
      const t = clampIndex(f.target + dir);
      f.target = t;
      expand(t - 1, t + 1);
      deps.startSnap(t, reduce, events);
    },
    /**
     * Jumps to a vehicle without animation (the remembered selection, or one
     * picked elsewhere). Returns false, changing nothing, for an unknown id.
     */
    select(id: string): boolean {
      const i = ids.indexOf(id);
      if (i < 0) {
        report(`ignored a selection of unknown vehicle "${id}"`);
        return false;
      }
      Object.assign(f, { animating: false, target: i });
      if (f.selectedId !== id) {
        f.selectedId = id;
        deps.setSelectedId(id);
      }
      focus(i);
      deps.jump(i);
      return true;
    },
  };
}

export type CarouselFlow = ReturnType<typeof createCarouselFlow>;
