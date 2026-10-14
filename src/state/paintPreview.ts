/**
 * Per-vehicle garage preview: the small paint-layer PNG saved with each
 * drawing, and whether the vehicle has saved strokes. Loaded on demand (the
 * garage asks for the selected car and its neighbours) and cached in memory.
 * Every entry is keyed by vehicle id + asset version, so a car can never show
 * another car's paint.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { Skia, type SkImage } from '@shopify/react-native-skia';
import { blobStore } from '../engine/persistence/blobStore';
import { disposeLater } from '../engine/render/disposeLater';
import { hasSavedPaint, loadThumbnail, saveThumbnail, type DrawingKey } from '../engine/persistence/drawingStore';

export interface PaintPreview {
  /** Paint layer only, aligned to the vehicle's paintRect; null when unpainted. */
  image: SkImage | null;
  hasPaint: boolean;
  loaded: boolean;
}

const EMPTY: PaintPreview = { image: null, hasPaint: false, loaded: false };
const cache = new Map<string, PaintPreview>();
const loading = new Set<string>();
const listeners = new Set<() => void>();
const id = (k: DrawingKey) => `${k.vehicleId}@${k.assetVersion}`;

function set(k: DrawingKey, v: PaintPreview) {
  const prev = cache.get(id(k));
  cache.set(id(k), v);
  listeners.forEach((l) => l());
  // Every save replaces the preview; free the old image once the garage has moved on.
  if (prev?.image && prev.image !== v.image) disposeLater(prev.image);
}

function decode(bytes: Uint8Array | null): SkImage | null {
  if (!bytes) return null;
  const data = Skia.Data.fromBytes(bytes);
  const image = Skia.Image.MakeImageFromEncoded(data);
  data.dispose(); // the image keeps what it needs
  return image;
}

export async function savePaintPreview(k: DrawingKey, png: Uint8Array, hasPaint: boolean) {
  set(k, { image: hasPaint ? decode(png) : null, hasPaint, loaded: true });
  await saveThumbnail(blobStore, k, png);
}

/** Starts loading a vehicle's preview if it is not cached yet. */
export function preloadPaintPreview(k: DrawingKey) {
  const key = id(k);
  if (cache.has(key) || loading.has(key)) return;
  loading.add(key);
  Promise.all([hasSavedPaint(blobStore, k), loadThumbnail(blobStore, k)])
    .then(([hasPaint, bytes]) => {
      // A save that finished meanwhile is newer than what was read from disk.
      if (!cache.get(key)?.loaded) set(k, { image: hasPaint ? decode(bytes) : null, hasPaint, loaded: true });
    })
    .catch(() => set(k, { image: null, hasPaint: false, loaded: true }))
    .finally(() => loading.delete(key));
}

export function getPaintPreview(k: DrawingKey): PaintPreview {
  return cache.get(id(k)) ?? EMPTY;
}

/** Re-renders when any preview changes; loads this vehicle's preview when `load` is true. */
export function usePaintPreview(k: DrawingKey, load = true): PaintPreview {
  useEffect(() => {
    if (load) preloadPaintPreview(k);
  }, [k.vehicleId, k.assetVersion, load]); // eslint-disable-line react-hooks/exhaustive-deps
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => getPaintPreview(k),
    () => getPaintPreview(k),
  );
}

