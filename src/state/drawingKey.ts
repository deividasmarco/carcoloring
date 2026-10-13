import type { DrawingKey } from '../engine/persistence/drawingStore';
import type { VehicleDefinition } from '../engine/vehicle/vehicleRuntime';

const keys = new Map<string, DrawingKey>();

/** Stable storage key for a vehicle's drawing (same object for the same vehicle). */
export function drawingKeyOf(v: VehicleDefinition): DrawingKey {
  let k = keys.get(v.id);
  if (!k) {
    k = { vehicleId: v.id, assetVersion: v.generated.assetVersion ?? 1 };
    keys.set(v.id, k);
  }
  return k;
}
