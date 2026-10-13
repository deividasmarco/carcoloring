/**
 * Coloring studio: the car fills the screen; tools sit at the edges.
 *
 * Portrait:  top bar · stage · tool tray (tools + sizes, two rows of crayons)
 * Landscape: left rail (navigation/history) · stage · right rail (tools, crayons)
 *
 * View-only: a premium vehicle without premium access can still be looked at
 * (saved artwork is never hidden or deleted) but not painted. If access ends
 * while the studio is open, the stroke in progress finishes and is saved;
 * only new strokes, undo, redo and washing are refused.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GarageEntry } from '../../content/registry';
import type { SizeIndex, ToolId } from '../../engine/stroke/types';
import { EXPORT_SCALE, handOffArtwork } from '../../state/artworkHandoff';
import { canPaint, useVehicleAccess } from '../../state/premium';
import { setSettings, useReduceMotion, useSettings } from '../../state/settings';
import { CrayonRack } from '../../ui/components/CrayonRack';
import { IconButton } from '../../ui/components/IconButton';
import { Icon } from '../../ui/icons';
import { SizePicker, ToolPicker } from '../../ui/components/ToolPicker';
import { colors, fonts, PALETTE } from '../../ui/theme';
import { Stage } from '../stage/Stage';
import { DrawingSurface } from './DrawingSurface';
import { useDrawingSession } from './useDrawingSession';
import { WashDialog } from './WashDialog';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Smallest touch target any control may have (points). */
const MIN_TOUCH = 44;

export function StudioScreen({ entry }: { entry: GarageEntry }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const settings = useSettings();
  const reduceMotion = useReduceMotion();
  const { session, paint, live, transform, history, zoomed, saveNow } = useDrawingSession(entry);

  const [tool, setTool] = useState<ToolId>('crayon');
  const [lastColorTool, setLastColorTool] = useState<ToolId>('crayon');
  const [color, setColor] = useState(PALETTE[0].color);
  const [size, setSize] = useState<SizeIndex>(1);
  const [washing, setWashing] = useState(false);

  useEffect(() => {
    session.setBrush(tool, color, size);
  }, [session, tool, color, size]);

  // Painting needs access; looking never does.
  const access = useVehicleAccess(entry.vehicle.id);
  const locked = !canPaint(access);
  useEffect(() => {
    session.setEditable(!locked);
  }, [session, locked]);
  const toolsProps = { pointerEvents: locked ? ('none' as const) : ('auto' as const) };

  const pickTool = (t: ToolId) => {
    setTool(t);
    if (t !== 'eraser') setLastColorTool(t);
  };
  const pickColor = (c: string) => {
    setColor(c);
    if (tool === 'eraser') setTool(lastColorTool);
  };

  const finish = async () => {
    await saveNow();
    handOffArtwork(entry.vehicle.id, session.exportImage(entry.scene, EXPORT_SCALE));
    router.push({ pathname: '/finished/[vehicleId]', params: { vehicleId: entry.vehicle.id } });
  };

  const landscape = width > height;
  const short = Math.min(width, height);
  // Landscape: crayons run along the bottom; rails hold navigation and tools.
  // Every control keeps a touch target of at least MIN_TOUCH points.
  const paletteH = Math.round(clamp(height * 0.19, 50, 84));
  const railContent = height - insets.top - insets.bottom - paletteH - 16;
  const railGap = 5;
  const btn = landscape
    ? Math.floor(clamp((railContent - 4 * railGap) / 5, MIN_TOUCH, 56))
    : Math.round(clamp(short * 0.13, MIN_TOUCH, 58));
  const animate = settings.effects && !reduceMotion;
  const dotColor = tool === 'eraser' ? colors.text : color;

  const historyButtons = (
    <>
      <IconButton icon="undo" label="Undo" size={btn} disabled={locked || !history.canUndo} onPress={() => session.undo()} />
      <IconButton icon="redo" label="Redo" size={btn} disabled={locked || !history.canRedo} onPress={() => session.redo()} />
    </>
  );
  const sceneButtons = (
    <>
      <IconButton
        icon="lights"
        label={settings.effects ? 'Turn garage lights effects off' : 'Turn garage lights effects on'}
        size={btn}
        selected={settings.effects}
        onPress={() => setSettings({ effects: !settings.effects })}
      />
      <IconButton icon="wash" label="Wash the car" size={btn} disabled={locked || !history.hasPaint} onPress={() => setWashing(true)} />
    </>
  );
  // Back when the garage is underneath; otherwise (deep link, web reload) go to it.
  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const home = <IconButton icon="garage" label="Back to the garage" size={btn} onPress={goHome} />;
  const done = <IconButton icon="flag" label="Done" size={btn} primary accent={colors.bg} onPress={finish} />;

  const stage = (
    <View style={styles.stage}>
      <DrawingSurface session={session}>
        <Stage entry={entry} vehicle={session.vehicle} transform={transform} paint={paint} live={live} animate={animate} />
      </DrawingSurface>
      {locked ? (
        <View style={styles.viewOnly} pointerEvents="none" testID="view-only">
          <Icon name="lock" size={18} color={colors.textDim} accent={colors.textDim} />
          <Text style={styles.viewOnlyText}>This {entry.kind === 'superbike' ? 'bike' : 'car'} is resting. A grown-up can unlock it in the parent area.</Text>
        </View>
      ) : null}
      {zoomed ? (
        <View style={styles.fit} pointerEvents="box-none">
          <IconButton icon="fit" label="Show the whole car" size={Math.max(MIN_TOUCH, Math.round(btn * 0.85))} onPress={() => session.resetView()} />
        </View>
      ) : null}
    </View>
  );

  const usableW = width - insets.left - insets.right;
  const normalDoneW = Math.max(MIN_TOUCH, Math.round(paletteH * 0.8)) + 16;
  const compact = landscape && ((usableW - 16 - normalDoneW) / 12 < MIN_TOUCH || (railContent - 4 * railGap) / 5 < MIN_TOUCH);

  if (compact) {
    // Small phones on their side: one rail with every action (Done last), and
    // a narrow side panel with tools, sizes and a 3 × 4 crayon box. No bottom
    // strip, so all controls keep full-size touch targets and the car keeps
    // most of the width.
    const content = height - insets.top - insets.bottom - 16;
    const cBtn = Math.floor(clamp((content - 5 * railGap) / 6, MIN_TOUCH, 56));
    const toolBtn = MIN_TOUCH;
    const slot = { width: toolBtn + 4, height: Math.floor(clamp((content - 2 * toolBtn - 5 * 6) / 4, MIN_TOUCH, 60)) };
    return (
      <View style={[styles.root, styles.row, { paddingLeft: insets.left, paddingRight: insets.right, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[styles.rail, styles.leftRail]}>
          <IconButton icon="garage" label="Back to the garage" size={cBtn} onPress={goHome} />
          <IconButton icon="undo" label="Undo" size={cBtn} disabled={locked || !history.canUndo} onPress={() => session.undo()} />
          <IconButton icon="redo" label="Redo" size={cBtn} disabled={locked || !history.canRedo} onPress={() => session.redo()} />
          <IconButton
            icon="lights"
            label={settings.effects ? 'Turn garage lights effects off' : 'Turn garage lights effects on'}
            size={cBtn}
            selected={settings.effects}
            onPress={() => setSettings({ effects: !settings.effects })}
          />
          <IconButton icon="wash" label="Wash the car" size={cBtn} disabled={locked || !history.hasPaint} onPress={() => setWashing(true)} />
          <IconButton icon="flag" label="Done" size={cBtn} primary accent={colors.bg} onPress={finish} />
        </View>
        {stage}
        <View style={[styles.rail, styles.sidePanel, locked && styles.dimmed]} {...toolsProps}>
          <ToolPicker tool={tool} color={color} onChange={pickTool} size={toolBtn} direction="row" />
          <SizePicker value={size} color={dotColor} onChange={setSize} size={toolBtn} direction="row" />
          <CrayonRack layout="tray" columns={3} slot={slot} selected={color} onSelect={pickColor} dimmed={tool === 'eraser'} />
        </View>
        <WashDialog visible={washing} onKeep={() => setWashing(false)} onWash={() => (setWashing(false), session.clear())} />
      </View>
    );
  }

  if (landscape) {
    // Tools and sizes in a slim right rail (two columns when one would not fit
    // at full touch size); the stage takes the rest. Done sits at the end of
    // the crayon strip, away from every screen corner and never over the car.
    const toolSize = Math.floor(clamp((railContent - 5 * railGap - 13) / 6, MIN_TOUCH, 54));
    const twoColumns = 6 * toolSize + 5 * railGap + 13 > railContent;
    const rightRailW = twoColumns ? toolSize * 2 + 22 : toolSize + 16;
    const doneSize = Math.max(MIN_TOUCH, Math.round(paletteH * 0.8));
    const doneW = doneSize + 16;
    const slotW = Math.floor((width - insets.left - insets.right - 16 - doneW) / 12);
    return (
      <View style={[styles.root, { paddingLeft: insets.left, paddingRight: insets.right }]}>
        <View style={[styles.row, { paddingTop: insets.top }]}>
          <View style={[styles.rail, styles.leftRail]}>
            {home}
            <View style={[styles.railGroup, { gap: railGap }]}>{historyButtons}</View>
            <View style={[styles.railGroup, { gap: railGap }]}>{sceneButtons}</View>
          </View>
          {stage}
          <View style={[styles.rail, styles.rightRail, { width: rightRailW }, twoColumns && styles.rightRailColumns, locked && styles.dimmed]} {...toolsProps}>
            <ToolPicker tool={tool} color={color} onChange={pickTool} size={toolSize} direction="column" />
            {twoColumns ? null : <View style={styles.railDivider} />}
            <SizePicker value={size} color={dotColor} onChange={setSize} size={toolSize} direction="column" />
          </View>
        </View>
        <View style={[styles.paletteStrip, { paddingBottom: insets.bottom }]}>
          <View style={locked && styles.dimmed} {...toolsProps}>
            <CrayonRack layout="tray" columns={12} slot={{ width: slotW, height: paletteH }} selected={color} onSelect={pickColor} dimmed={tool === 'eraser'} />
          </View>
          <View style={[styles.paletteDone, { width: doneW }]}>
            <IconButton icon="flag" label="Done" size={doneSize} primary accent={colors.bg} onPress={finish} />
          </View>
        </View>
        <WashDialog visible={washing} onKeep={() => setWashing(false)} onWash={() => (setWashing(false), session.clear())} />
      </View>
    );
  }

  // Portrait: the car is limited by screen width, so the stage gets the car's
  // fitted height plus room below it for Done (bottom-right of the stage, on
  // the garage floor — away from the screen corners and the top bar). The
  // rest goes to bigger crayons and tools.
  const trayW = width - insets.left - insets.right - 16;
  const slotW = Math.floor(trayW / 6);
  const toolSize = Math.floor(clamp((trayW - 1 - 2 * 6 - 4 * 6) / 6, MIN_TOUCH, 58));
  const focus = session.vehicle.layout.focusRect;
  const available = height - insets.top - insets.bottom - (btn + 16);
  const carH = (width * focus.height) / focus.width;
  const minStage = carH + 2 * (btn + 16);
  const trayMin = toolSize + 2 * 56 + 40;
  const stageH = Math.round(clamp(Math.max(minStage, available * 0.5), Math.min(minStage, available - trayMin), available - trayMin));
  const slotH = Math.round(clamp((available - stageH - toolSize - 40) / 2, 56, 128));
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        {home}
        <View style={styles.barGroup}>{historyButtons}</View>
        <View style={styles.barGroup}>{sceneButtons}</View>
      </View>
      <View style={{ height: stageH }}>
        {stage}
        <View style={styles.stageDone} pointerEvents="box-none">
          {done}
        </View>
      </View>
      <View style={[styles.tray, { paddingBottom: insets.bottom + 8 }]}>
        <View style={[styles.trayTools, locked && styles.dimmed]} {...toolsProps}>
          <ToolPicker tool={tool} color={color} onChange={pickTool} size={toolSize} direction="row" />
          <View style={styles.divider} />
          <SizePicker value={size} color={dotColor} onChange={setSize} size={toolSize} direction="row" />
        </View>
        <View style={locked && styles.dimmed} {...toolsProps}>
          <CrayonRack layout="tray" columns={6} slot={{ width: slotW, height: slotH }} selected={color} onSelect={pickColor} dimmed={tool === 'eraser'} />
        </View>
      </View>
      <WashDialog visible={washing} onKeep={() => setWashing(false)} onWash={() => (setWashing(false), session.clear())} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  row: { flex: 1, flexDirection: 'row' },
  stage: { flex: 1, backgroundColor: colors.bg },
  rail: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  leftRail: { borderRightWidth: 1 },
  rightRail: { borderLeftWidth: 1, justifyContent: 'center', gap: 5, paddingHorizontal: 0 },
  rightRailColumns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sidePanel: { borderLeftWidth: 1, justifyContent: 'center', gap: 6 },
  railGroup: { gap: 8 },
  railDivider: { width: 28, height: 1, backgroundColor: colors.line, marginVertical: 1 },
  paletteStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
  },
  paletteDone: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  barGroup: { flexDirection: 'row', gap: 6 },
  tray: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingTop: 10,
    alignItems: 'center',
    gap: 6,
  },
  trayTools: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stageDone: { position: 'absolute', right: 12, bottom: 12 },
  divider: { width: 1, height: 28, backgroundColor: colors.line },
  fit: { position: 'absolute', left: 12, bottom: 12 },
  dimmed: { opacity: 0.3 },
  viewOnly: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 17, 28, 0.88)',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  viewOnlyText: { fontFamily: fonts.body, fontSize: 14, color: colors.text, flexShrink: 1 },
});
