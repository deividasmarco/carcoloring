/**
 * End-to-end behaviour through the screen-space input path:
 * touch → gesture machine → region lock → stroke → raster.
 */
import type { TouchPoint } from '../src/engine/input/strokeGestureMachine';
import { CELL_EMPTY, CELL_LINE } from '../src/engine/regions/hitMap';
import { DrawingSession, HISTORY_LIMIT } from '../src/engine/session/drawingSession';
import { MAX_POINTS_PER_STROKE } from '../src/engine/stroke/types';
import { toScreen, type Size } from '../src/engine/view/viewTransform';
import { cellCode, interiorPoint, paintInRegion, pixels, premulDiff, RecordingListener, runtime, seamPoint } from './helpers';

const rt = runtime();
const rect = rt.layout.paintRect;
const code = (id: string) => rt.regionById.get(id)!.code;
const SCALE = 1;

function session(view: Size = { width: 1000, height: 400 }, livePreview = true) {
  const listener = new RecordingListener();
  let clock = 0;
  // Without live preview, the per-sample preview render is skipped (commits still happen).
  const schedule = livePreview ? undefined : () => {};
  const s = new DrawingSession(rt, listener, { rasterScale: SCALE, now: () => (clock += 16), schedule });
  s.setViewSize(view);
  return { s, listener };
}

/** Touch sequence given in ARTWORK coordinates, converted with the session's transform. */
function drag(s: DrawingSession, art: { x: number; y: number }[], id = 1, t0 = 0) {
  const scr = (p: { x: number; y: number }): TouchPoint => ({ id, ...toScreen(s.transform, p) });
  s.machine.down([scr(art[0])], t0);
  for (const p of art.slice(1)) s.machine.move([scr(p)]);
  s.machine.up([scr(art[art.length - 1])]);
}

const paintOf = (l: RecordingListener) => (l.image ? pixels(l.image) : new Uint8Array(0));
const sumAlpha = (px: Uint8Array) => px.reduce((a, v, i) => (i % 4 === 3 ? a + v : a), 0);

describe('region lock through touch input', () => {
  it('crossing into another region does not switch, and re-entry keeps painting', () => {
    const { s, listener } = session();
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    const scoop = interiorPoint(rt.hitMap, code('side-scoop'), 8);
    const reentry = { x: door.x - 20, y: door.y + 25 };
    expect(cellCode(rt.hitMap, reentry.x, reentry.y)).toBe(code('door'));
    // door → across the line into the side scoop → back into the door elsewhere.
    drag(s, [door, scoop, { x: scoop.x, y: scoop.y + 20 }, reentry]);
    expect(listener.started).toEqual(['door']);
    const px = paintOf(listener);
    expect(paintInRegion(px, rect, SCALE, rt.hitMap, code('side-scoop'))).toBe(0);
    // Paint exists both near the start and near the re-entry point.
    const alphaAt = (p: { x: number; y: number }) => px[(Math.floor(p.y - rect.y) * Math.ceil(rect.width) + Math.floor(p.x - rect.x)) * 4 + 3];
    expect(alphaAt(door)).toBeGreaterThan(0);
    expect(alphaAt(reentry)).toBeGreaterThan(0);
  });

  it('a new stroke can select a different region', () => {
    const { s, listener } = session();
    const hood = interiorPoint(rt.hitMap, code('hood'), 6);
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    drag(s, [door, { x: door.x + 30, y: door.y }]);
    drag(s, [hood, { x: hood.x + 30, y: hood.y }], 2, 1000);
    expect(listener.started).toEqual(['door', 'hood']);
  });

  it('starting on the background does not paint, even when dragging over the car', () => {
    const { s, listener } = session();
    const sb = rt.layout.silhouetteBounds;
    const wall = { x: sb.x + sb.width / 2, y: sb.y - 15 }; // just above the roof
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    expect(cellCode(rt.hitMap, wall.x, wall.y)).toBe(CELL_EMPTY);
    drag(s, [wall, door, { x: door.x + 40, y: door.y }]);
    expect(listener.started).toEqual([]);
    expect(listener.rejected).toEqual(['outside']);
    expect(listener.image).toBeNull();
  });

  it('starting exactly on a seam is ambiguous and does not paint', () => {
    const { s, listener } = session();
    // Halfway down the door, where door and scoop meet along a single line.
    const b = rt.regionById.get('door')!.bounds;
    const p = seamPoint(rt.hitMap, code('door'), code('side-scoop'), 6, b.y + b.height / 2);
    drag(s, [p, { x: p.x - 40, y: p.y }]);
    expect(listener.rejected).toEqual(['ambiguous']);
    expect(listener.started).toEqual([]);
  });

  it('starting on the outer outline selects the only nearby region', () => {
    const { s, listener } = session();
    // Walk down from above the roof to the first outline cell, and note the
    // part right below that outline.
    const x = 900;
    let y = rt.hitMap.y;
    while (cellCode(rt.hitMap, x, y) === CELL_EMPTY) y++;
    expect(cellCode(rt.hitMap, x, y)).toBe(CELL_LINE);
    let below = y;
    while (cellCode(rt.hitMap, x, below) === CELL_LINE) below++;
    const expected = rt.regionByCode.get(cellCode(rt.hitMap, x, below))!.id;
    drag(s, [{ x: x + 0.5, y: y + 0.5 }, { x: x + 20, y: y + 10 }]);
    expect(listener.started).toEqual([expected]);
  });

  it('a second finger mid-stroke ends the stroke without painting toward it', () => {
    const { s, listener } = session();
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    const scr = (p: { x: number; y: number }, id: number) => ({ id, ...toScreen(s.transform, p) });
    s.machine.down([scr(door, 1)], 0);
    s.machine.move([scr({ x: door.x + 40, y: door.y }, 1)]);
    s.machine.move([scr({ x: door.x + 80, y: door.y }, 1)]);
    const far = interiorPoint(rt.hitMap, code('hood'), 10); // second finger on the hood
    s.machine.down([scr(far, 2)], 5000);
    s.machine.move([scr({ x: door.x + 100, y: door.y }, 1), scr({ x: far.x + 5, y: far.y }, 2)]);
    s.machine.up([scr(far, 2)]);
    s.machine.up([scr(door, 1)]);
    const px = paintOf(listener);
    const w = Math.ceil(rect.width);
    const alphaAt = (p: { x: number; y: number }) => px[(Math.floor(p.y - rect.y) * w + Math.floor(p.x - rect.x)) * 4 + 3];
    expect(alphaAt({ x: door.x + 40, y: door.y })).toBeGreaterThan(0);
    expect(alphaAt(far)).toBe(0);
    expect(alphaAt({ x: door.x + 100, y: door.y })).toBe(0);
  });
});

describe('long scribbles', () => {
  it('split into continuation strokes locked to the same region', () => {
    const { s, listener } = session(undefined, false);
    const door = interiorPoint(rt.hitMap, code('door'), 30);
    const zig = Array.from({ length: MAX_POINTS_PER_STROKE + 400 }, (_, i) => ({
      x: door.x - 25 + (i % 2) * 50,
      y: door.y - 20 + ((i * 0.37) % 40),
    }));
    drag(s, zig);
    expect(listener.started).toEqual(['door']);
    expect(s.strokeCount).toBe(2);
    expect(s.snapshotForSave().drawing.strokes.every((st) => st.regionId === 'door')).toBe(true);
  });
});

describe('history', () => {
  it('undo and redo restore exact pixels and boundaries', () => {
    const { s, listener } = session();
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    const scoop = interiorPoint(rt.hitMap, code('side-scoop'), 8);
    drag(s, [door, scoop]);
    const one = paintOf(listener);
    s.color = '#2F5BEA';
    drag(s, [scoop, door], 2, 1000);
    const two = paintOf(listener);
    s.undo();
    expect(Buffer.from(paintOf(listener)).equals(Buffer.from(one))).toBe(true);
    s.redo();
    expect(Buffer.from(paintOf(listener)).equals(Buffer.from(two))).toBe(true);
    s.undo();
    s.undo();
    expect(sumAlpha(paintOf(listener))).toBe(0);
    expect(listener.historyState).toEqual({ canUndo: false, canRedo: true, hasPaint: false });
  });

  it('bounds memory by flattening strokes beyond the undo window', () => {
    const { s, listener } = session();
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) drag(s, [{ x: door.x, y: door.y + (i % 10) }, { x: door.x + 30, y: door.y }], i + 1, i * 1000);
    const saved = s.snapshotForSave();
    expect(saved.drawing.strokes).toHaveLength(HISTORY_LIMIT);
    expect(saved.basePng).toBeInstanceOf(Uint8Array);
    for (let i = 0; i < HISTORY_LIMIT; i++) s.undo();
    expect(listener.historyState.canUndo).toBe(false);
    // Flattened strokes remain painted.
    expect(listener.historyState.hasPaint).toBe(true);
    expect(sumAlpha(paintOf(listener))).toBeGreaterThan(0);
  });
});

describe('coordinate mapping', () => {
  it('the same artwork stroke renders identically at any view size, orientation and zoom', () => {
    const door = interiorPoint(rt.hitMap, code('door'), 20);
    const path = [door, { x: door.x + 120, y: door.y + 15 }, { x: door.x + 60, y: door.y + 40 }];
    const a = session({ width: 1000, height: 400 });
    drag(a.s, path);

    const b = session({ width: 390, height: 700 });
    // Zoom in 2.5× with a pinch, then rotate to landscape.
    b.s.machine.down([{ id: 1, x: 150, y: 350 }, { id: 2, x: 250, y: 350 }], 0);
    b.s.machine.move([{ id: 1, x: 75, y: 350 }, { id: 2, x: 325, y: 350 }]);
    b.s.machine.up([{ id: 1, x: 75, y: 350 }, { id: 2, x: 325, y: 350 }]);
    b.s.setViewSize({ width: 700, height: 390 });
    expect(b.s.transform.scale / b.s.fitTransform.scale).toBeGreaterThan(2);
    // Touch positions are converted through the zoomed transform.
    drag(b.s, path, 5, 10000);

    const pa = paintOf(a.listener);
    const pb = paintOf(b.listener);
    expect(premulDiff(pa, pb)).toBeLessThanOrEqual(1);
    expect(sumAlpha(pa)).toBeGreaterThan(0);
  });
});
