/**
 * The vehicle registry: every bundled vehicle, in garage display order.
 *
 * - Ids are permanent: saved drawings, undo history and the last selection
 *   are keyed by them. Never rename or reuse one.
 * - Free or premium comes from FREE_VEHICLE_IDS (content/collection), never
 *   from a vehicle's position, so reordering this list changes nothing but
 *   the order. Free vehicles are listed first.
 *
 * To add a vehicle from line art: put the image in assets/source/, author
 * `vehicles/<id>/trace.ts`, add it to vehicles/traces.ts, run
 * `npm run build:regions -- --only <id> --preview`, add `vehicles/<id>/index.ts`
 * and list it below.
 */
import type { ImageSourcePropType } from 'react-native';
import { tierOf, type VehicleTier } from './collection';
import { neonGarage } from './scenes/neon-garage';
import type { SceneDefinition } from './scenes/types';
import type { CatalogVehicle, VehicleKind } from './vehicles/catalog';
import { apexGt } from './vehicles/apex-gt';
import { arrowSuperbike } from './vehicles/arrow-superbike';
import { basecamp4x4 } from './vehicles/basecamp-4x4';
import { blazeGt } from './vehicles/blaze-gt';
import { boulder4x4 } from './vehicles/boulder-4x4';
import { breezeRoadster } from './vehicles/breeze-roadster';
import { circuitCoupe } from './vehicles/circuit-coupe';
import { cometSuperbike } from './vehicles/comet-superbike';
import { dragonGt } from './vehicles/dragon-gt';
import { driftCoupe } from './vehicles/drift-coupe';
import { emberGt } from './vehicles/ember-gt';
import { fluxCoupe } from './vehicles/flux-coupe';
import { fortress4x4 } from './vehicles/fortress-4x4';
import { haloCoupe } from './vehicles/halo-coupe';
import { novaSuv } from './vehicles/nova-suv';
import { orbitGt } from './vehicles/orbit-gt';
import { pulseHatch } from './vehicles/pulse-hatch';
import { ridgeSuv } from './vehicles/ridge-suv';
import { rumbleV8 } from './vehicles/rumble-v8';
import { sprintCoupe } from './vehicles/sprint-coupe';
import { stormSedan } from './vehicles/storm-sedan';
import { thunderV8 } from './vehicles/thunder-v8';
import { turboWagon } from './vehicles/turbo-wagon';
import { vectorCoupe } from './vehicles/vector-coupe';
import { voltSedan } from './vehicles/volt-sedan';
import { zenithGt } from './vehicles/zenith-gt';
import { zipHatch } from './vehicles/zip-hatch';

export interface GarageEntry {
  vehicle: CatalogVehicle;
  scene: SceneDefinition;
  tier: VehicleTier;
  kind: VehicleKind;
  thumbnail: ImageSourcePropType;
}

/** Display order. Free vehicles first (checked by the registry tests). */
const ORDER: CatalogVehicle[] = [
  // Free (FREE_VEHICLE_IDS)
  apexGt,
  blazeGt,
  stormSedan,
  // Premium: supercars, sports coupes, muscle cars, roadster, saloons and
  // hatchbacks, SUVs and off-roaders, superbikes
  emberGt,
  zenithGt,
  dragonGt,
  circuitCoupe,
  orbitGt,
  sprintCoupe,
  driftCoupe,
  haloCoupe,
  fluxCoupe,
  vectorCoupe,
  thunderV8,
  rumbleV8,
  breezeRoadster,
  voltSedan,
  turboWagon,
  zipHatch,
  pulseHatch,
  ridgeSuv,
  novaSuv,
  boulder4x4,
  basecamp4x4,
  fortress4x4,
  cometSuperbike,
  arrowSuperbike,
];

export const GARAGE: GarageEntry[] = ORDER.map((vehicle) => ({
  vehicle,
  scene: neonGarage,
  tier: tierOf(vehicle.id),
  kind: vehicle.kind,
  thumbnail: vehicle.thumbnail,
}));

export function getGarageEntry(vehicleId: string): GarageEntry | undefined {
  return GARAGE.find((e) => e.vehicle.id === vehicleId);
}

export function garageIndexOf(vehicleId: string | null | undefined): number {
  const i = GARAGE.findIndex((e) => e.vehicle.id === vehicleId);
  return i < 0 ? 0 : i;
}
