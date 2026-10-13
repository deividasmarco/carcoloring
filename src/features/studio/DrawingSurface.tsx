/**
 * Touch input for the studio. Raw touches go to the session's gesture state
 * machine (one finger draws, two fingers zoom/pan, extra fingers never paint).
 * A simultaneous pan gesture only samples stylus pressure; finger input works
 * fully without it.
 */
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, PointerType, type TouchData } from 'react-native-gesture-handler';
import type { DrawingSession } from '../../engine/session/drawingSession';

const points = (touches: TouchData[]) => touches.map((t) => ({ id: t.id, x: t.x, y: t.y }));

/** Builds the drawing gesture; callbacks run on the JS thread, never during render. */
function createDrawingGesture(session: DrawingSession) {
  const touches = Gesture.Manual()
    .runOnJS(true)
    .onTouchesDown((e, manager) => {
      manager.activate();
      if (e.pointerType !== PointerType.STYLUS) session.setPressure(null);
      session.machine.down(points(e.changedTouches), Date.now());
    })
    .onTouchesMove((e) => {
      session.machine.move(points(e.allTouches));
    })
    .onTouchesUp((e, manager) => {
      session.machine.up(points(e.changedTouches));
      if (session.machine.activePointers === 0) manager.end();
    })
    .onTouchesCancelled((_e, manager) => {
      session.machine.cancel(Date.now());
      manager.end();
    });

  const stylus = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      if (e.pointerType === PointerType.STYLUS) session.setPressure(e.stylusData?.pressure ?? null);
    })
    .onUpdate((e) => {
      if (e.pointerType === PointerType.STYLUS) session.setPressure(e.stylusData?.pressure ?? null);
    });

  return Gesture.Simultaneous(touches, stylus);
}

export function DrawingSurface({ session, children }: { session: DrawingSession; children: ReactNode }) {
  const gesture = useMemo(() => createDrawingGesture(session), [session]);
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.fill}
        testID="drawing-surface"
        collapsable={false}
        accessibilityLabel="Car to colour. Draw with one finger; pinch with two fingers to zoom."
        onLayout={(e) => session.setViewSize(e.nativeEvent.layout)}
      >
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
});
