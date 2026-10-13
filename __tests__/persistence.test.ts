import type { BlobStore } from '../src/engine/persistence/blobStore';
import {
  deleteDrawing,
  drawingKeys,
  hasSavedPaint,
  loadDrawing,
  loadThumbnail,
  packStroke,
  saveDrawing,
  saveThumbnail,
  serializeDrawing,
  unpackStroke,
  type DrawingKey,
} from '../src/engine/persistence/drawingStore';
import { DrawingSession, HISTORY_LIMIT } from '../src/engine/session/drawingSession';
import type { VehicleRuntime } from '../src/engine/vehicle/vehicleRuntime';
import { toScreen } from '../src/engine/view/viewTransform';
import { ALL_VEHICLE_IDS, interiorPoint, pixels, premulDiff, RecordingListener, runtime } from './helpers';

function memoryStore(): BlobStore & { data: Map<string, string | Uint8Array> } {
  const data = new Map<string, string | Uint8Array>();
  return {
    data,
    readText: async (k) => (data.get(k) as string) ?? null,
    writeText: async (k, v) => void data.set(k, v),
    readBytes: async (k) => (data.get(k) as Uint8Array) ?? null,
    writeBytes: async (k, v) => void data.set(k, v),
    remove: async (k) => void data.delete(k),
  };
}

const keyOf = (rt: VehicleRuntime): DrawingKey => ({ vehicleId: rt.def.id, assetVersion: rt.assetVersion });
const idsOf = (rt: VehicleRuntime) => new Set(rt.regions.map((r) => r.id));

// Paint surfaces live in CanvasKit's WebAssembly heap: free them after each test.
const live: { dispose(): void }[] = [];
afterEach(() => {
  while (live.length) live.pop()!.dispose();
});
const track = <T extends { dispose(): void }>(x: T) => (live.push(x), x);

function newSession(rt: VehicleRuntime) {
  const listener = new RecordingListener();
  let clock = 0;
  // Half-resolution rasters keep 7 vehicles × 50+ strokes within the WASM heap;
  // restore is still compared pixel for pixel.
  const s = track(new DrawingSession(rt, listener, { rasterScale: 0.5, now: () => (clock += 16) }));
  s.setViewSize({ width: 1000, height: 400 });
  return { s, listener };
}

/** Strokes on the two largest body parts of any vehicle. */
function drawSome(rt: VehicleRuntime, s: DrawingSession, n: number) {
  const parts = rt.regions
    .filter((r) => r.material === 'body')
    .sort((a, b) => b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height)
    .slice(0, 2)
    .map((r) => interiorPoint(rt.hitMap, r.code, 12));
  for (let i = 0; i < n; i++) {
    const p = parts[i % 2];
    s.color = i % 3 ? '#2F5BEA' : '#FFD21F';
    const a = toScreen(s.transform, { x: p.x - 20 + (i % 7), y: p.y + (i % 5) });
    const b = toScreen(s.transform, { x: p.x + 40, y: p.y - 3 });
    s.machine.down([{ id: i + 1, ...a }], i * 1000);
    s.machine.move([{ id: i + 1, ...b }]);
    s.machine.up([{ id: i + 1, ...b }]);
  }
}

async function saveSession(store: BlobStore, rt: VehicleRuntime, s: DrawingSession) {
  const snap = s.snapshotForSave();
  await saveDrawing(store, keyOf(rt), snap.drawing, snap.basePng);
}

describe('stroke packing', () => {
  it('round-trips with 0.1-unit precision', () => {
    const s = { id: 'x', tool: 'pencil' as const, color: '#123456', size: 0 as const, regionId: 'door', points: [{ x: 1.234, y: 5.678, p: 0.4321 }] };
    const back = unpackStroke(packStroke(s));
    expect(back.points[0].x).toBeCloseTo(1.2, 5);
    expect(back.points[0].y).toBeCloseTo(5.7, 5);
    expect(back.points[0].p).toBeCloseTo(0.43, 5);
    expect({ ...back, points: [] }).toEqual({ ...s, points: [] });
  });
});

describe.each(ALL_VEHICLE_IDS)('%s: progress survives a restart', (vehicleId) => {
  const rt = runtime(vehicleId);
  it.each([5, HISTORY_LIMIT + 12])('restores %i strokes (incl. flattened base) pixel-for-pixel', async (n) => {
    const store = memoryStore();
    const a = newSession(rt);
    drawSome(rt, a.s, n);
    a.s.undo(); // keep a redo entry around too
    await saveSession(store, rt, a.s);
    const before = pixels(a.listener.image!);

    // "Restart": a brand-new session reading only from storage.
    const loaded = await loadDrawing(store, keyOf(rt), idsOf(rt));
    expect(loaded).not.toBeNull();
    const b = newSession(rt);
    b.s.restore(loaded!.drawing, loaded!.basePng);
    expect(premulDiff(before, pixels(b.listener.image!))).toBeLessThanOrEqual(1);
    expect(b.listener.historyState.canRedo).toBe(true);
  });
});

describe('vehicles keep independent saves', () => {
  it('painting, washing and deleting one car never touches another', async () => {
    const store = memoryStore();
    const apex = runtime('apex-gt');
    const volt = runtime('volt-sedan');
    const a = newSession(apex);
    drawSome(apex, a.s, 6);
    await saveSession(store, apex, a.s);
    const apexState = store.data.get(drawingKeys(keyOf(apex)).state);

    const v = newSession(volt);
    drawSome(volt, v.s, 4);
    await saveSession(store, volt, v.s);
    expect(store.data.get(drawingKeys(keyOf(apex)).state)).toBe(apexState);

    // Wash the Volt: the Apex save is unchanged and still has paint.
    v.s.clear();
    await saveSession(store, volt, v.s);
    expect(await hasSavedPaint(store, keyOf(volt))).toBe(false);
    expect(await hasSavedPaint(store, keyOf(apex))).toBe(true);
    expect(store.data.get(drawingKeys(keyOf(apex)).state)).toBe(apexState);

    // Loading one car's save never yields another car's strokes.
    const voltLoaded = await loadDrawing(store, keyOf(volt), idsOf(volt));
    expect(voltLoaded!.drawing.strokes).toHaveLength(0);
    await deleteDrawing(store, keyOf(volt));
    expect((await loadDrawing(store, keyOf(apex), idsOf(apex)))!.drawing.strokes.length).toBeGreaterThan(0);
  });

  it('a save for another asset version or vehicle is ignored', async () => {
    const store = memoryStore();
    const apex = runtime('apex-gt');
    const k = keyOf(apex);
    await store.writeText(drawingKeys(k).state, serializeDrawing({ vehicleId: 'volt-sedan', assetVersion: 1 }, { strokes: [], redo: [], hasBase: false }));
    expect(await loadDrawing(store, k, idsOf(apex))).toBeNull();
    await store.writeText(drawingKeys(k).state, serializeDrawing({ ...k, assetVersion: 2 }, { strokes: [], redo: [], hasBase: false }));
    expect(await loadDrawing(store, k, idsOf(apex))).toBeNull();
    await store.writeText(drawingKeys(k).state, '{not json');
    expect(await loadDrawing(store, k, idsOf(apex))).toBeNull();
  });
});

describe('Apex GT saves from before versioned keys', () => {
  it('are migrated without loss and keep rendering identically', async () => {
    const store = memoryStore();
    const apex = runtime('apex-gt');
    const a = newSession(apex);
    drawSome(apex, a.s, HISTORY_LIMIT + 3); // includes a flattened base
    const snap = a.s.snapshotForSave();
    const before = pixels(a.listener.image!);
    // Write it exactly as the previous app version did: drawings/<id>/…, no assetVersion field.
    const legacy = JSON.parse(serializeDrawing(keyOf(apex), snap.drawing));
    delete legacy.assetVersion;
    await store.writeText('drawings/apex-gt/state.json', JSON.stringify(legacy));
    await store.writeBytes('drawings/apex-gt/base.png', snap.basePng!);
    await store.writeBytes('drawings/apex-gt/thumb.png', new Uint8Array([1, 2, 3]));

    expect(await hasSavedPaint(store, keyOf(apex))).toBe(true);
    const loaded = await loadDrawing(store, keyOf(apex), idsOf(apex));
    expect(loaded).not.toBeNull();
    const b = newSession(apex);
    b.s.restore(loaded!.drawing, loaded!.basePng);
    expect(premulDiff(before, pixels(b.listener.image!))).toBeLessThanOrEqual(1);
    // Files now live under v1; the old ones are gone; the thumbnail moved too.
    const k = drawingKeys(keyOf(apex));
    expect(store.data.has(k.state) && store.data.has(k.base) && store.data.has(k.thumb)).toBe(true);
    expect(store.data.has('drawings/apex-gt/state.json')).toBe(false);
    expect(Array.from((await loadThumbnail(store, keyOf(apex)))!)).toEqual([1, 2, 3]);
  });

  it('are migrated once when the garage and the studio ask at the same time', async () => {
    const mem = memoryStore();
    const apex = runtime('apex-gt');
    const k = keyOf(apex);
    const legacy = JSON.parse(serializeDrawing(k, { strokes: [], redo: [], hasBase: true }));
    delete legacy.assetVersion;
    await mem.writeText('drawings/apex-gt/state.json', JSON.stringify(legacy));
    await mem.writeBytes('drawings/apex-gt/base.png', new Uint8Array([4, 5, 6]));
    await mem.writeBytes('drawings/apex-gt/thumb.png', new Uint8Array([1, 2, 3]));
    // Every storage call takes a while, so concurrent callers interleave.
    let stateWrites = 0;
    const later = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 1));
    const store: BlobStore = {
      readText: async (key) => later(await mem.readText(key)),
      readBytes: async (key) => later(await mem.readBytes(key)),
      writeText: async (key, v) => {
        if (key === drawingKeys(k).state) stateWrites++;
        return later(await mem.writeText(key, v));
      },
      writeBytes: async (key, v) => later(await mem.writeBytes(key, v)),
      remove: async (key) => later(await mem.remove(key)),
    };
    const [has, thumb, loaded] = await Promise.all([hasSavedPaint(store, k), loadThumbnail(store, k), loadDrawing(store, k, idsOf(apex))]);
    expect(stateWrites).toBe(1);
    expect(has).toBe(true);
    expect(Array.from(thumb!)).toEqual([1, 2, 3]);
    expect(Array.from(loaded!.basePng!)).toEqual([4, 5, 6]);
    expect(mem.data.has('drawings/apex-gt/state.json')).toBe(false);
  });

  it('are not migrated over a newer versioned save', async () => {
    const store = memoryStore();
    const apex = runtime('apex-gt');
    const k = keyOf(apex);
    await store.writeText(drawingKeys(k).state, serializeDrawing(k, { strokes: [], redo: [], hasBase: false }));
    await store.writeText('drawings/apex-gt/state.json', 'legacy');
    await saveThumbnail(store, k, new Uint8Array([9]));
    await loadDrawing(store, k, idsOf(apex));
    expect(store.data.get(drawingKeys(k).state)).not.toBe('legacy');
    expect(store.data.get('drawings/apex-gt/state.json')).toBe('legacy');
  });
});

