/**
 * Saved drawing format. Each creation (one picture of one vehicle) has its own
 * folder, named by its permanent creation id (see creationStore.ts):
 *
 *   creations/<creationId>/state.json  undoable strokes + redo stack
 *   creations/<creationId>/base.png    strokes flattened out of the undo window
 *   creations/<creationId>/thumb.png   paint layer only (garage preview)
 *
 * Before creations, each vehicle had one drawing per asset version, in
 * drawings/<vehicleId>/v<assetVersion>/ (same files). Those are copied into
 * creations once and left in place.
 *
 * Strokes are stored as region ids + vehicle-space points, so a saved drawing
 * is independent of screen size and re-renders identically after restore.
 * Keying by asset version means re-traced artwork never receives strokes that
 * were painted on different geometry.
 *
 * Before versioned keys, drawings lived in drawings/<vehicleId>/ directly.
 * Those files belong to asset version 1 and are moved on first load.
 */
import type { BlobStore } from './blobStore';
import type { SizeIndex, Stroke, ToolId } from '../stroke/types';

export const DRAWING_FORMAT_VERSION = 1;

export interface SavedDrawing {
  strokes: Stroke[];
  redo: Stroke[];
  hasBase: boolean;
}

/** Which drawing: a creation (when `creationId` is set) or a vehicle's pre-creations drawing. */
export interface DrawingKey {
  vehicleId: string;
  /** The vehicle geometry it was painted on. */
  assetVersion: number;
  creationId?: string;
}

interface StoredStroke {
  i: string;
  t: ToolId;
  c: string;
  s: SizeIndex;
  r: string;
  /** Flat [x, y, pressure×100, …] rounded to 0.1 units. */
  p: number[];
}

interface StoredDrawing {
  v: number;
  vehicle: string;
  /** Missing in drawings saved before versioned keys (= asset version 1). */
  assetVersion?: number;
  savedAt: number;
  hasBase: boolean;
  strokes: StoredStroke[];
  redo: StoredStroke[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function packStroke(s: Stroke): StoredStroke {
  const p: number[] = [];
  for (const pt of s.points) p.push(r1(pt.x), r1(pt.y), Math.round(pt.p * 100));
  return { i: s.id, t: s.tool, c: s.color, s: s.size, r: s.regionId, p };
}

export function unpackStroke(s: StoredStroke): Stroke {
  const points = [];
  for (let i = 0; i + 2 < s.p.length; i += 3) points.push({ x: s.p[i], y: s.p[i + 1], p: s.p[i + 2] / 100 });
  return { id: s.i, tool: s.t, color: s.c, size: s.s, regionId: s.r, points };
}

export const drawingKeys = (k: DrawingKey) => {
  const dir = k.creationId ? `creations/${k.creationId}` : `drawings/${k.vehicleId}/v${k.assetVersion}`;
  return { state: `${dir}/state.json`, base: `${dir}/base.png`, thumb: `${dir}/thumb.png` };
};

const legacyKeys = (vehicleId: string) => ({
  state: `drawings/${vehicleId}/state.json`,
  base: `drawings/${vehicleId}/base.png`,
  thumb: `drawings/${vehicleId}/thumb.png`,
});

export function serializeDrawing(k: DrawingKey, d: SavedDrawing, now = Date.now()): string {
  const stored: StoredDrawing = {
    v: DRAWING_FORMAT_VERSION,
    vehicle: k.vehicleId,
    assetVersion: k.assetVersion,
    savedAt: now,
    hasBase: d.hasBase,
    strokes: d.strokes.map(packStroke),
    redo: d.redo.map(packStroke),
  };
  return JSON.stringify(stored);
}

export function parseDrawing(json: string, k: DrawingKey, knownRegions: ReadonlySet<string>): SavedDrawing | null {
  try {
    const raw = JSON.parse(json) as StoredDrawing;
    if (raw.v !== DRAWING_FORMAT_VERSION || raw.vehicle !== k.vehicleId) return null;
    if ((raw.assetVersion ?? 1) !== k.assetVersion) return null;
    // Drop strokes for regions that no longer exist.
    const keep = (s: StoredStroke) => knownRegions.has(s.r);
    return {
      hasBase: !!raw.hasBase,
      strokes: raw.strokes.filter(keep).map(unpackStroke),
      redo: raw.redo.filter(keep).map(unpackStroke),
    };
  } catch {
    return null;
  }
}

const migrations = new WeakMap<BlobStore, Map<string, Promise<boolean>>>();

/**
 * Moves a pre-versioning save (drawings/<id>/…) into the version-1 folder.
 * Copies everything first and removes the old files only after the new
 * state file is written, so an interruption never loses the drawing.
 * Concurrent callers (the garage preview reads two files at once) share one
 * migration, so a slow duplicate can never write the old state over a newer save.
 */
export function migrateLegacyDrawing(store: BlobStore, k: DrawingKey): Promise<boolean> {
  if (k.assetVersion !== 1 || k.creationId) return Promise.resolve(false);
  let running = migrations.get(store);
  if (!running) {
    running = new Map();
    migrations.set(store, running);
  }
  const pending = running.get(k.vehicleId);
  if (pending) return pending;
  const run = migrateOnce(store, k).finally(() => running.delete(k.vehicleId));
  running.set(k.vehicleId, run);
  return run;
}

async function migrateOnce(store: BlobStore, k: DrawingKey): Promise<boolean> {
  const now = drawingKeys(k);
  if (await store.readText(now.state)) return false;
  const old = legacyKeys(k.vehicleId);
  const json = await store.readText(old.state);
  if (!json) return false;
  const base = await store.readBytes(old.base);
  const thumb = await store.readBytes(old.thumb);
  if (base) await store.writeBytes(now.base, base);
  if (thumb) await store.writeBytes(now.thumb, thumb);
  await store.writeText(now.state, json);
  await Promise.all([store.remove(old.state), store.remove(old.base), store.remove(old.thumb)]);
  return true;
}

export async function loadDrawing(
  store: BlobStore,
  k: DrawingKey,
  knownRegions: ReadonlySet<string>,
): Promise<{ drawing: SavedDrawing; basePng: Uint8Array | null } | null> {
  await migrateLegacyDrawing(store, k);
  const keys = drawingKeys(k);
  const json = await store.readText(keys.state);
  if (!json) return null;
  const drawing = parseDrawing(json, k, knownRegions);
  if (!drawing) return null;
  const basePng = drawing.hasBase ? await store.readBytes(keys.base) : null;
  return { drawing: { ...drawing, hasBase: !!basePng }, basePng };
}

/**
 * Saves the drawing. `basePng`: bytes to (re)write the flattened base,
 * `null` to delete it, `undefined` to leave it untouched.
 */
export async function saveDrawing(store: BlobStore, k: DrawingKey, d: SavedDrawing, basePng: Uint8Array | null | undefined) {
  const keys = drawingKeys(k);
  if (basePng) await store.writeBytes(keys.base, basePng);
  else if (basePng === null) await store.remove(keys.base);
  await store.writeText(keys.state, serializeDrawing(k, d));
}

export async function saveThumbnail(store: BlobStore, k: DrawingKey, png: Uint8Array) {
  await store.writeBytes(drawingKeys(k).thumb, png);
}

export async function loadThumbnail(store: BlobStore, k: DrawingKey) {
  await migrateLegacyDrawing(store, k);
  return store.readBytes(drawingKeys(k).thumb);
}

/** True when the vehicle has saved strokes or a flattened base. */
export async function hasSavedPaint(store: BlobStore, k: DrawingKey): Promise<boolean> {
  await migrateLegacyDrawing(store, k);
  const json = await store.readText(drawingKeys(k).state);
  if (!json) return false;
  try {
    const raw = JSON.parse(json) as StoredDrawing;
    return raw.strokes.length > 0 || raw.hasBase;
  } catch {
    return false;
  }
}

export async function deleteDrawing(store: BlobStore, k: DrawingKey) {
  const keys = drawingKeys(k);
  await Promise.all([store.remove(keys.state), store.remove(keys.base), store.remove(keys.thumb)]);
}
