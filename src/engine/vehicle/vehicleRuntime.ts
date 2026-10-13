import { Skia, type SkPath, type SkPicture } from '@shopify/react-native-skia';
import type { DecorFinish, GeneratedVehicle, Material, Rect } from '../../content/vehicles/types';
import type { Placement, TracedVehicleLayout, TracedVehicleSpec } from '../../content/vehicles/traceTypes';
import { parseGeneratedPath } from '../geometry/generatedPath';
import { decodeHitMap, type HitMapData } from '../regions/hitMap';
import { recordPicture } from '../render/picture';
import { drawVehicleBase, drawVehicleOverlay } from '../render/vehicleLayers';

export interface VehicleDefinition {
  /** Stable id; saved drawings are keyed by it. Never rename. */
  id: string;
  /** Display name on the garage nameplate (fictional). */
  name: string;
  /** One-line description for accessibility labels. */
  description: string;
  /** Platform glow colour in the garage. */
  accent: string;
  /** Built by scripts/build-traced-vehicle.ts from `trace`. */
  generated: GeneratedVehicle;
  trace: TracedVehicleSpec;
}

export interface RuntimeRegion {
  id: string;
  name: string;
  code: number;
  material: Material;
  path: SkPath;
  bounds: Rect;
}

export interface VehicleRuntime {
  def: VehicleDefinition;
  layout: TracedVehicleLayout;
  regions: RuntimeRegion[];
  regionById: Map<string, RuntimeRegion>;
  regionByCode: Map<number, RuntimeRegion>;
  decor: { id: string; finish: DecorFinish; path: SkPath }[];
  silhouette: SkPath;
  materials: Partial<Record<Material, SkPath>>;
  /** The drawing's own outlines, vectorised; always drawn above the paint. */
  lineArt: SkPath;
  /** Region-ID map, decoded on first use (not needed by the garage). */
  readonly hitMap: HitMapData;
  /** Local (vehicle) units → scene units. */
  placement: Placement;
  /** Version of the traced geometry; saves are keyed by it. */
  assetVersion: number;
  /** Uncoloured car: ground shadows and white primer under the paint. */
  basePicture: SkPicture;
  /** Line art — always above the paint. */
  overlayPicture: SkPicture;
}

const svg = (d: string): SkPath => parseGeneratedPath(Skia, d);

export const IDENTITY_PLACEMENT: Placement = { scale: 1, x: 0, y: 0 };

const cache = new Map<string, VehicleRuntime>();

/**
 * Builds (once) the Skia objects for a vehicle. Must only be called after
 * Skia is available (on web, after CanvasKit has loaded).
 */
export function getVehicleRuntime(def: VehicleDefinition): VehicleRuntime {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const g = def.generated;
  if (!g.layout || !g.lineArt) throw new Error(`${def.id}: generated asset lacks layout or line art — run npm run build:regions`);

  const regions: RuntimeRegion[] = g.regions.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    material: r.material,
    path: svg(r.path),
    bounds: r.bounds,
  }));
  const materials: Partial<Record<Material, SkPath>> = {};
  for (const [k, d] of Object.entries(g.materials)) if (d) materials[k as Material] = svg(d);

  const partial = {
    def,
    layout: g.layout,
    regions,
    regionById: new Map(regions.map((r) => [r.id, r])),
    regionByCode: new Map(regions.map((r) => [r.code, r])),
    decor: g.decor.map((d) => ({ id: d.id, finish: d.finish, path: svg(d.path) })),
    silhouette: svg(g.silhouette),
    materials,
    lineArt: svg(g.lineArt),
    placement: g.layout.placement ?? IDENTITY_PLACEMENT,
    assetVersion: g.assetVersion ?? 1,
  };
  const b = g.layout.focusRect;
  const bounds = { x: b.x - 200, y: b.y - 200, width: b.width + 400, height: b.height + 400 };
  let hitMap: HitMapData | null = null;
  const runtime: VehicleRuntime = {
    ...partial,
    get hitMap() {
      hitMap ??= decodeHitMap(g.hitMap);
      return hitMap;
    },
    basePicture: recordPicture(bounds, (c) => drawVehicleBase(c, partial)),
    overlayPicture: recordPicture(bounds, (c) => drawVehicleOverlay(c, partial)),
  };
  cache.set(def.id, runtime);
  return runtime;
}

export type VehicleGeometry = Omit<VehicleRuntime, 'basePicture' | 'overlayPicture' | 'hitMap'>;
