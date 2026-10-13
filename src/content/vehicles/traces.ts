/**
 * Every traced vehicle's authoring spec, for scripts/build-traced-vehicle.ts.
 * (The app itself loads the generated assets through src/content/registry.ts.)
 */
import { APEX_GT_TRACE } from './apex-gt/trace';
import { BLAZE_GT_TRACE } from './blaze-gt/trace';
import { STORM_SEDAN_TRACE } from './storm-sedan/trace';
import { NOVA_SUV_TRACE } from './nova-suv/trace';
import { ORBIT_GT_TRACE } from './orbit-gt/trace';
import { PULSE_HATCH_TRACE } from './pulse-hatch/trace';
import { DRIFT_COUPE_TRACE } from './drift-coupe/trace';
import { EMBER_GT_TRACE } from './ember-gt/trace';
import { ZENITH_GT_TRACE } from './zenith-gt/trace';
import { DRAGON_GT_TRACE } from './dragon-gt/trace';
import { CIRCUIT_COUPE_TRACE } from './circuit-coupe/trace';
import { SPRINT_COUPE_TRACE } from './sprint-coupe/trace';
import { HALO_COUPE_TRACE } from './halo-coupe/trace';
import { FLUX_COUPE_TRACE } from './flux-coupe/trace';
import { THUNDER_V8_TRACE } from './thunder-v8/trace';
import { RUMBLE_V8_TRACE } from './rumble-v8/trace';
import { BREEZE_ROADSTER_TRACE } from './breeze-roadster/trace';
import { TURBO_WAGON_TRACE } from './turbo-wagon/trace';
import { ZIP_HATCH_TRACE } from './zip-hatch/trace';
import { RIDGE_SUV_TRACE } from './ridge-suv/trace';
import { BOULDER_4X4_TRACE } from './boulder-4x4/trace';
import { BASECAMP_4X4_TRACE } from './basecamp-4x4/trace';
import { FORTRESS_4X4_TRACE } from './fortress-4x4/trace';
import { COMET_SUPERBIKE_TRACE } from './comet-superbike/trace';
import { ARROW_SUPERBIKE_TRACE } from './arrow-superbike/trace';
import type { TracedVehicleSpec } from './traceTypes';
import { VECTOR_COUPE_TRACE } from './vector-coupe/trace';
import { VOLT_SEDAN_TRACE } from './volt-sedan/trace';

export const TRACED_VEHICLES: TracedVehicleSpec[] = [
  APEX_GT_TRACE,
  VOLT_SEDAN_TRACE,
  VECTOR_COUPE_TRACE,
  ORBIT_GT_TRACE,
  NOVA_SUV_TRACE,
  DRIFT_COUPE_TRACE,
  PULSE_HATCH_TRACE,
  BLAZE_GT_TRACE,
  STORM_SEDAN_TRACE,
  EMBER_GT_TRACE,
  ZENITH_GT_TRACE,
  DRAGON_GT_TRACE,
  CIRCUIT_COUPE_TRACE,
  SPRINT_COUPE_TRACE,
  HALO_COUPE_TRACE,
  FLUX_COUPE_TRACE,
  THUNDER_V8_TRACE,
  RUMBLE_V8_TRACE,
  BREEZE_ROADSTER_TRACE,
  TURBO_WAGON_TRACE,
  ZIP_HATCH_TRACE,
  RIDGE_SUV_TRACE,
  BOULDER_4X4_TRACE,
  BASECAMP_4X4_TRACE,
  FORTRESS_4X4_TRACE,
  COMET_SUPERBIKE_TRACE,
  ARROW_SUPERBIKE_TRACE,
];
