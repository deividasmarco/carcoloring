/**
 * Creations: every picture a child paints, several per vehicle if they like.
 *
 *   creations/index.json          the list below (small, rewritten on each save)
 *   creations/<id>/state.json     strokes (drawingStore format)
 *   creations/<id>/base.png       flattened strokes
 *   creations/<id>/thumb.png      paint layer (garage preview)
 *   creations/<id>/<picture>.png  small composed picture for My Creations
 *
 * Ids are permanent. A creation is listed once it has been saved with paint.
 * Nothing here deletes artwork except an explicit `deleteCreation`.
 */
import type { BlobStore } from './blobStore';
import { drawingKeys, migrateLegacyDrawing } from './drawingStore';

export const CREATIONS_SCHEMA = 1;
const INDEX = 'creations/index.json';

export interface CreationMeta {
  /** Permanent id ("c-…" for new pictures, "m-<vehicle>-v<n>" for migrated ones). */
  id: string;
  vehicleId: string;
  /** Vehicle geometry the strokes belong to. */
  assetVersion: number;
  createdAt: number;
  updatedAt: number;
  hasPaint: boolean;
  /** File name of the composed picture (changes on every save, so images never show a stale copy). */
  picture?: string;
}

export interface CreationIndex {
  schema: number;
  creations: CreationMeta[];
  /** Pre-creations drawings already copied (`<vehicle>@v<n>`); never copied twice, even after a deletion. */
  migrated: string[];
}

const EMPTY = (): CreationIndex => ({ schema: CREATIONS_SCHEMA, creations: [], migrated: [] });

export const creationFiles = (id: string, picture?: string) => {
  const k = drawingKeys({ vehicleId: '', assetVersion: 0, creationId: id });
  return { ...k, picture: picture ? `creations/${id}/${picture}` : null };
};

/** A new permanent creation id. */
export function newCreationId(now = Date.now(), random = Math.random) {
  return `c-${now.toString(36)}-${Math.floor(random() * 36 ** 6)
    .toString(36)
    .padStart(6, '0')}`;
}

export async function readCreationIndex(store: BlobStore): Promise<CreationIndex> {
  const json = await store.readText(INDEX);
  if (!json) return EMPTY();
  try {
    const raw = JSON.parse(json) as Partial<CreationIndex>;
    if (raw.schema !== CREATIONS_SCHEMA || !Array.isArray(raw.creations)) throw new Error('unknown index');
    return { schema: CREATIONS_SCHEMA, creations: raw.creations.filter(isMeta), migrated: Array.isArray(raw.migrated) ? raw.migrated : [] };
  } catch {
    // Keep the unreadable file for recovery instead of overwriting it, and start a fresh list.
    await store.writeText(`creations/index.unreadable-${Date.now()}.json`, json);
    return EMPTY();
  }
}

function isMeta(m: unknown): m is CreationMeta {
  const c = m as CreationMeta;
  return !!c && typeof c.id === 'string' && typeof c.vehicleId === 'string' && typeof c.updatedAt === 'number';
}

export async function writeCreationIndex(store: BlobStore, index: CreationIndex) {
  await store.writeText(INDEX, JSON.stringify(index));
}

const migratedKey = (vehicleId: string, assetVersion: number) => `${vehicleId}@v${assetVersion}`;

/**
 * Copies each vehicle's pre-creations drawing (current asset version) into a
 * creation. Safe to run again: copied drawings are remembered, the old files
 * are left where they were, and an interrupted run simply copies again.
 * Returns the index with the migrated creations added.
 */
export async function migrateToCreations(store: BlobStore, vehicles: { id: string; assetVersion: number }[], index: CreationIndex): Promise<CreationIndex> {
  const next: CreationIndex = { ...index, creations: [...index.creations], migrated: [...index.migrated] };
  let changed = false;
  for (const v of vehicles) {
    const mk = migratedKey(v.id, v.assetVersion);
    if (next.migrated.includes(mk)) continue;
    const legacy = { vehicleId: v.id, assetVersion: v.assetVersion };
    await migrateLegacyDrawing(store, legacy); // the Apex GT's pre-version save first
    const from = drawingKeys(legacy);
    const json = await store.readText(from.state);
    const info = json ? summarize(json, v.id, v.assetVersion) : null;
    if (info?.hasPaint) {
      const id = `m-${v.id}-v${v.assetVersion}`;
      if (!next.creations.some((c) => c.id === id)) {
        const to = creationFiles(id);
        const base = await store.readBytes(from.base);
        const thumb = await store.readBytes(from.thumb);
        if (base) await store.writeBytes(to.base, base);
        if (thumb) await store.writeBytes(to.thumb, thumb);
        await store.writeText(to.state, json!);
        next.creations.push({ id, vehicleId: v.id, assetVersion: v.assetVersion, createdAt: info.savedAt, updatedAt: info.savedAt, hasPaint: true });
      }
    }
    next.migrated.push(mk);
    changed = true;
  }
  if (changed) await writeCreationIndex(store, next);
  return next;
}

function summarize(json: string, vehicleId: string, assetVersion: number): { hasPaint: boolean; savedAt: number } | null {
  try {
    const raw = JSON.parse(json) as { vehicle?: string; assetVersion?: number; savedAt?: number; strokes?: unknown[]; hasBase?: boolean };
    if (raw.vehicle !== vehicleId || (raw.assetVersion ?? 1) !== assetVersion) return null;
    return { hasPaint: (raw.strokes?.length ?? 0) > 0 || !!raw.hasBase, savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : 0 };
  } catch {
    return null;
  }
}

/** Removes one creation's files (an explicit, confirmed request only). The caller updates the index. */
export async function deleteCreationFiles(store: BlobStore, meta: CreationMeta) {
  const f = creationFiles(meta.id, meta.picture);
  await Promise.all([store.remove(f.state), store.remove(f.base), store.remove(f.thumb), f.picture ? store.remove(f.picture) : Promise.resolve()]);
}
