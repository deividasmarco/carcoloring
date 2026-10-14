/**
 * Passes the freshly composed artwork from the studio to the finished screen
 * without a round trip through storage, keyed by creation. If it is missing
 * (e.g. after a restart), the finished screen re-composes it from the saved
 * creation.
 */
import type { SkImage } from '@shopify/react-native-skia';
import type { GarageEntry } from '../content/registry';
import { blobStore } from '../engine/persistence/blobStore';
import { loadDrawing, type DrawingKey } from '../engine/persistence/drawingStore';
import { DrawingSession } from '../engine/session/drawingSession';
import { getVehicleRuntime } from '../engine/vehicle/vehicleRuntime';

const artworks = new Map<string, SkImage>();

export const EXPORT_SCALE = 1.25;

export function handOffArtwork(creationId: string, image: SkImage) {
  artworks.get(creationId)?.dispose();
  artworks.set(creationId, image);
}

export async function getArtwork(entry: GarageEntry, key: DrawingKey): Promise<SkImage> {
  const id = key.creationId ?? entry.vehicle.id;
  const ready = artworks.get(id);
  if (ready) return ready;
  const rt = getVehicleRuntime(entry.vehicle);
  const noop = () => {};
  const session = new DrawingSession(rt, { paintImage: noop, liveStroke: noop, transform: noop, history: noop, changed: noop });
  try {
    const saved = await loadDrawing(blobStore, key, new Set(rt.regions.map((r) => r.id)));
    if (saved) session.restore(saved.drawing, saved.basePng);
    const img = session.exportImage(entry.scene, EXPORT_SCALE);
    artworks.set(id, img);
    return img;
  } finally {
    session.dispose();
  }
}
