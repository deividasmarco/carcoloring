/**
 * My Creations storage: several pictures per vehicle, and the one-time copy of
 * the earlier one-drawing-per-vehicle saves into it, which must never lose,
 * duplicate or resurrect artwork.
 */
import type { BlobStore } from '../src/engine/persistence/blobStore';
import {
  creationFiles,
  deleteCreationFiles,
  migrateToCreations,
  newCreationId,
  readCreationIndex,
  writeCreationIndex,
  type CreationIndex,
} from '../src/engine/persistence/creationStore';
import { drawingKeys, loadDrawing, saveDrawing, serializeDrawing, type DrawingKey } from '../src/engine/persistence/drawingStore';
import type { Stroke } from '../src/engine/stroke/types';

function memoryStore(): BlobStore & { data: Map<string, string | Uint8Array>; failOn?: (key: string) => boolean } {
  const data = new Map<string, string | Uint8Array>();
  const store = {
    data,
    failOn: undefined as ((key: string) => boolean) | undefined,
    readText: async (k: string) => (data.get(k) as string) ?? null,
    writeText: async (k: string, v: string) => {
      if (store.failOn?.(k)) throw new Error(`write failed: ${k}`);
      data.set(k, v);
    },
    readBytes: async (k: string) => (data.get(k) as Uint8Array) ?? null,
    writeBytes: async (k: string, v: Uint8Array) => {
      if (store.failOn?.(k)) throw new Error(`write failed: ${k}`);
      data.set(k, v);
    },
    remove: async (k: string) => void data.delete(k),
  };
  return store;
}

const stroke = (id: string, regionId = 'door'): Stroke => ({ id, tool: 'crayon', color: '#E5322D', size: 1, regionId, points: [{ x: 10, y: 20, p: 0.5 }, { x: 30, y: 25, p: 0.5 }] });
const REGIONS = new Set(['door', 'hood']);
const empty = (): CreationIndex => ({ schema: 1, creations: [], migrated: [] });
const VEHICLES = [
  { id: 'apex-gt', assetVersion: 1 },
  { id: 'blaze-gt', assetVersion: 1 },
  { id: 'storm-sedan', assetVersion: 1 },
];

/** An old app's save: drawings/<id>/v1/… (or the Apex GT's pre-version drawings/<id>/…). */
function legacySave(store: ReturnType<typeof memoryStore>, vehicleId: string, strokes: Stroke[], { preVersion = false, savedAt = 1_700_000_000_000 } = {}) {
  const k: DrawingKey = { vehicleId, assetVersion: 1 };
  const json = serializeDrawing(k, { strokes, redo: [], hasBase: false }, savedAt);
  const dir = preVersion ? `drawings/${vehicleId}` : `drawings/${vehicleId}/v1`;
  store.data.set(`${dir}/state.json`, preVersion ? JSON.stringify({ ...JSON.parse(json), assetVersion: undefined }) : json);
  store.data.set(`${dir}/thumb.png`, new Uint8Array([1, 2, 3]));
}

describe('migrating one-drawing-per-vehicle saves into creations', () => {
  it('copies each painted vehicle into its own creation and keeps the original files', async () => {
    const store = memoryStore();
    legacySave(store, 'apex-gt', [stroke('a1'), stroke('a2')], { preVersion: true, savedAt: 1000 });
    legacySave(store, 'blaze-gt', [stroke('b1')], { savedAt: 2000 });
    const before = new Map(store.data);
    const index = await migrateToCreations(store, VEHICLES, empty());

    expect(index.creations.map((c) => c.id).sort()).toEqual(['m-apex-gt-v1', 'm-blaze-gt-v1']);
    const apex = index.creations.find((c) => c.vehicleId === 'apex-gt')!;
    expect(apex).toMatchObject({ assetVersion: 1, createdAt: 1000, updatedAt: 1000, hasPaint: true });
    // The strokes load from the creation, unchanged.
    const loaded = await loadDrawing(store, { vehicleId: 'apex-gt', assetVersion: 1, creationId: apex.id }, REGIONS);
    expect(loaded?.drawing.strokes.map((s) => s.id)).toEqual(['a1', 'a2']);
    expect(store.data.get(creationFiles(apex.id).thumb)).toEqual(new Uint8Array([1, 2, 3]));
    // Nothing was deleted: the Blaze GT's original is untouched, and the Apex GT's
    // pre-version save still exists in its versioned folder.
    for (const [k, v] of before) if (!k.startsWith('drawings/apex-gt/state') && !k.startsWith('drawings/apex-gt/thumb')) expect(store.data.get(k)).toEqual(v);
    expect(store.data.has(drawingKeys({ vehicleId: 'apex-gt', assetVersion: 1 }).state)).toBe(true);
    // The list was written.
    expect((await readCreationIndex(store)).creations).toHaveLength(2);
  });

  it('records vehicles without paint and makes no empty creations', async () => {
    const store = memoryStore();
    legacySave(store, 'storm-sedan', []);
    const index = await migrateToCreations(store, VEHICLES, empty());
    expect(index.creations).toEqual([]);
    expect(index.migrated.sort()).toEqual(['apex-gt@v1', 'blaze-gt@v1', 'storm-sedan@v1']);
  });

  it('is safe to run again: no duplicates, and a deleted creation does not come back', async () => {
    const store = memoryStore();
    legacySave(store, 'blaze-gt', [stroke('b1')]);
    const first = await migrateToCreations(store, VEHICLES, empty());
    const again = await migrateToCreations(store, VEHICLES, await readCreationIndex(store));
    expect(again.creations).toHaveLength(1);

    // The child deletes it (explicitly); a later run must not resurrect it from the old files.
    const meta = first.creations[0];
    await deleteCreationFiles(store, meta);
    const after: CreationIndex = { ...again, creations: [] };
    await writeCreationIndex(store, after);
    const third = await migrateToCreations(store, VEHICLES, await readCreationIndex(store));
    expect(third.creations).toEqual([]);
  });

  it('finishes after an interruption without losing or duplicating the picture', async () => {
    const store = memoryStore();
    legacySave(store, 'blaze-gt', [stroke('b1')]);
    store.failOn = (k) => k === 'creations/index.json';
    await expect(migrateToCreations(store, VEHICLES, empty())).rejects.toThrow('write failed');
    store.failOn = undefined;
    const index = await migrateToCreations(store, VEHICLES, await readCreationIndex(store));
    expect(index.creations.map((c) => c.id)).toEqual(['m-blaze-gt-v1']);
    const loaded = await loadDrawing(store, { vehicleId: 'blaze-gt', assetVersion: 1, creationId: 'm-blaze-gt-v1' }, REGIONS);
    expect(loaded?.drawing.strokes.map((s) => s.id)).toEqual(['b1']);
  });

  it('keeps an unreadable list for recovery instead of overwriting it', async () => {
    const store = memoryStore();
    store.data.set('creations/index.json', '{ not json');
    const index = await readCreationIndex(store);
    expect(index.creations).toEqual([]);
    const backups = [...store.data.keys()].filter((k) => k.startsWith('creations/index.unreadable-'));
    expect(backups).toHaveLength(1);
    expect(store.data.get(backups[0])).toBe('{ not json');
  });
});

describe('several creations of one vehicle', () => {
  it('saves and loads each picture separately, by its permanent id', async () => {
    const store = memoryStore();
    const a: DrawingKey = { vehicleId: 'apex-gt', assetVersion: 1, creationId: newCreationId(1, () => 0.1) };
    const b: DrawingKey = { vehicleId: 'apex-gt', assetVersion: 1, creationId: newCreationId(2, () => 0.2) };
    expect(a.creationId).not.toBe(b.creationId);
    await saveDrawing(store, a, { strokes: [stroke('first')], redo: [], hasBase: false }, undefined);
    await saveDrawing(store, b, { strokes: [stroke('second', 'hood')], redo: [stroke('undone')], hasBase: false }, undefined);
    expect((await loadDrawing(store, a, REGIONS))?.drawing.strokes.map((s) => s.id)).toEqual(['first']);
    const second = await loadDrawing(store, b, REGIONS);
    expect(second?.drawing.strokes.map((s) => s.id)).toEqual(['second']);
    expect(second?.drawing.redo.map((s) => s.id)).toEqual(['undone']);
    // A new picture never writes over the vehicle's older save location.
    expect([...store.data.keys()].every((k) => k.startsWith('creations/'))).toBe(true);
  });

  it('refuses a creation saved for different vehicle artwork', async () => {
    const store = memoryStore();
    const k: DrawingKey = { vehicleId: 'apex-gt', assetVersion: 1, creationId: 'c-x' };
    await saveDrawing(store, k, { strokes: [stroke('s')], redo: [], hasBase: false }, undefined);
    expect(await loadDrawing(store, { ...k, assetVersion: 2 }, REGIONS)).toBeNull();
  });
});
