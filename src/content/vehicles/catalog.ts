import type { ImageSourcePropType } from 'react-native';
import type { VehicleDefinition } from '../../engine/vehicle/vehicleRuntime';

export type VehicleKind = 'car' | 'superbike';

/** A vehicle as listed in the garage registry. */
export interface CatalogVehicle extends VehicleDefinition {
  kind: VehicleKind;
  /** Outline picture built with the masks, for lists outside the garage. */
  thumbnail: ImageSourcePropType;
}
