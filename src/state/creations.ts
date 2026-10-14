/**
 * The child's creations (My Creations), loaded once at startup with the
 * migration of pre-creations drawings, and kept in memory for the garage, the
 * studio and the gallery. Index writes are serialised so a slower write can
 * never put back an older list.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { GARAGE } from '../content/registry';
import { blobStore } from '../engine/persistence/blobStore';
import {
  CREATIONS_SCHEMA,
  deleteCreationFiles,
  migrateToCreations,
  readCreationIndex,
  writeCreationIndex,
  type CreationIndex,
  type CreationMeta,
} from '../engine/persistence/creationStore';
import type { DrawingKey } from '../engine/persistence/drawingStore';

export type { CreationMeta } from '../engine/persistence/creationStore';

interface Snapshot {
  ready: boolean;
  /** Most recently edited first. */
  list: CreationMeta[];
}

let index: CreationIndex = { schema: CREATIONS_SCHEMA, creations: [], migrated: [] };
let snapshot: Snapshot = { ready: false, list: [] };
let loading: Promise<void> | null = null;
let writes: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

const currentVersion = (vehicleId: string) => GARAGE.find((e) => e.vehicle.id === vehicleId)?.vehicle.generated.assetVersion ?? 1;

function publish(next: CreationIndex, ready = true) {
  index = next;
  snapshot = { ready, list: [...next.creations].sort((a, b) => b.updatedAt - a.updatedAt) };
  listeners.forEach((l) => l());
}

/** Loads the list (once), copying pre-creations drawings into creations first. */
export function loadCreations(): Promise<void> {
  loading ??= (async () => {
    try {
      const read = await readCreationIndex(blobStore);
      const vehicles = GARAGE.map((e) => ({ id: e.vehicle.id, assetVersion: e.vehicle.generated.assetVersion ?? 1 }));
      publish(await migrateToCreations(blobStore, vehicles, read));
    } catch (e) {
      console.warn('Loading creations failed', e);
      publish(index);
    }
  })();
  return loading;
}

function persist(next: CreationIndex) {
  publish(next);
  const write = writes.then(() => writeCreationIndex(blobStore, next));
  writes = write.catch((e) => console.warn('Saving the creations list failed', e));
  return write;
}

export function getCreation(id: string): CreationMeta | undefined {
  return index.creations.find((c) => c.id === id);
}

/** The vehicle's most recently edited creation that fits its current artwork. */
export function latestCreation(vehicleId: string): CreationMeta | null {
  let best: CreationMeta | null = null;
  for (const c of index.creations) {
    if (c.vehicleId === vehicleId && c.assetVersion === currentVersion(vehicleId) && (!best || c.updatedAt > best.updatedAt)) best = c;
  }
  return best;
}

export function keyOfCreation(c: Pick<CreationMeta, 'id' | 'vehicleId' | 'assetVersion'>): DrawingKey {
  return { vehicleId: c.vehicleId, assetVersion: c.assetVersion, creationId: c.id };
}

/**
 * Lists a new creation before its first files are written (so an interrupted
 * first save can never leave saved strokes that no list knows about).
 */
export async function ensureListed(key: DrawingKey, now = Date.now()) {
  if (!key.creationId || getCreation(key.creationId)) return;
  await persist({
    ...index,
    creations: [...index.creations, { id: key.creationId, vehicleId: key.vehicleId, assetVersion: key.assetVersion, createdAt: now, updatedAt: now, hasPaint: true }],
  });
}

/** Records a finished save (after its files are written). */
export async function recordSave(creationId: string, patch: { hasPaint: boolean; picture?: string }, now = Date.now()) {
  if (!getCreation(creationId)) return;
  await persist({ ...index, creations: index.creations.map((c) => (c.id === creationId ? { ...c, ...patch, updatedAt: now } : c)) });
}

/** Deletes a creation (only after the child or parent confirmed it). */
export async function deleteCreation(id: string) {
  const meta = getCreation(id);
  if (!meta) return;
  await persist({ ...index, creations: index.creations.filter((c) => c.id !== id) });
  await deleteCreationFiles(blobStore, meta);
}

export function useCreations(): Snapshot {
  useEffect(() => {
    void loadCreations();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => snapshot,
  );
}

/** The vehicle's latest creation, kept up to date. */
export function useLatestCreation(vehicleId: string): { ready: boolean; creation: CreationMeta | null } {
  const s = useCreations();
  return { ready: s.ready, creation: s.ready ? latestCreation(vehicleId) : null };
}

/** Adds a composed picture to a creation that lacked one (no change to its edited time). */
export async function attachPicture(creationId: string, picture: string) {
  if (!getCreation(creationId)) return;
  await persist({ ...index, creations: index.creations.map((c) => (c.id === creationId ? { ...c, picture } : c)) });
}
