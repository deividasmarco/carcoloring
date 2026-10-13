import { DrawingSession } from '../src/engine/session/drawingSession';
import { toScreen } from '../src/engine/view/viewTransform';
import { interiorPoint, RecordingListener, runtime } from './helpers';

describe('view-only drawing (premium access ended)', () => {
  it('finishes the stroke in progress, then refuses new strokes, undo, redo and washing', () => {
    const rt = runtime('apex-gt');
    const l = new RecordingListener();
    const s = new DrawingSession(rt, l, { rasterScale: 0.5 });
    s.setViewSize({ width: 1000, height: 400 });
    const door = rt.regionById.get('door')!;
    const p = interiorPoint(rt.hitMap, door.code, 12);
    const a = toScreen(s.transform, p);
    const b = toScreen(s.transform, { x: p.x + 30, y: p.y + 4 });

    s.machine.down([{ id: 1, ...a }], 0);
    s.machine.move([{ id: 1, ...b }]);
    // Access ends mid-stroke: the stroke is neither cut short nor lost.
    s.setEditable(false);
    s.machine.move([{ id: 1, x: b.x + 10, y: b.y }]);
    s.machine.up([{ id: 1, x: b.x + 10, y: b.y }]);
    expect(s.strokeCount).toBe(1);
    expect(l.historyState.hasPaint).toBe(true);
    expect(s.snapshotForSave().drawing.strokes).toHaveLength(1);

    // New strokes are refused, and nothing edits the picture.
    s.machine.down([{ id: 2, ...a }], 5000);
    s.machine.move([{ id: 2, ...b }]);
    s.machine.up([{ id: 2, ...b }]);
    expect(l.rejected).toContain('locked');
    expect(s.strokeCount).toBe(1);
    s.undo();
    expect(s.strokeCount).toBe(1);
    s.clear();
    expect(l.historyState.hasPaint).toBe(true);
    expect(s.canEdit).toBe(false);

    // Access back: editing works again.
    s.setEditable(true);
    s.undo();
    expect(s.strokeCount).toBe(0);
    s.redo();
    expect(s.strokeCount).toBe(1);

    l.image?.dispose();
    s.dispose();
  });
});
