/**
 * Gallery pictures. Each save writes one; drawings copied from before My
 * Creations have none yet, so it is composed here, once, from the saved paint
 * layer, one at a time in the background.
 */
import { Skia } from '@shopify/react-native-skia';
import { getGarageEntry } from '../../content/registry';
import { blobStore } from '../../engine/persistence/blobStore';
import { creationFiles, type CreationMeta } from '../../engine/persistence/creationStore';
import { composeVehiclePicture } from '../../engine/render/compose';
import { getVehicleRuntime } from '../../engine/vehicle/vehicleRuntime';
import { attachPicture } from '../../state/creations';

let queue: Promise<void> = Promise.resolve();
const pending = new Set<string>();

export function ensurePicture(meta: CreationMeta) {
  if (meta.picture || pending.has(meta.id)) return;
  const entry = getGarageEntry(meta.vehicleId);
  // Only for the vehicle's current artwork: the paint must line up with its outlines.
  if (!entry || (entry.vehicle.generated.assetVersion ?? 1) !== meta.assetVersion) return;
  pending.add(meta.id);
  queue = queue
    .then(async () => {
      const bytes = await blobStore.readBytes(creationFiles(meta.id).thumb);
      let paint = null;
      if (bytes) {
        const data = Skia.Data.fromBytes(bytes);
        paint = Skia.Image.MakeImageFromEncoded(data);
        data.dispose();
      }
      const png = composeVehiclePicture(getVehicleRuntime(entry.vehicle), paint);
      paint?.dispose();
      const name = `picture-${Date.now().toString(36)}.png`;
      await blobStore.writeBytes(creationFiles(meta.id, name).picture!, png);
      await attachPicture(meta.id, name);
    })
    .catch((e) => console.warn('Composing a gallery picture failed', e))
    .finally(() => pending.delete(meta.id));
}

/** Where an <Image> can load the creation's picture from (null while there is none). */
export async function pictureUri(meta: CreationMeta): Promise<string | null> {
  const f = creationFiles(meta.id, meta.picture);
  return f.picture && blobStore.imageUri ? blobStore.imageUri(f.picture) : null;
}
