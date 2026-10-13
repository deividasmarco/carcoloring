/**
 * Generated vehicle asset model (see traceTypes.ts for the authoring side).
 *
 * `scripts/build-traced-vehicle.ts` turns a line-art image plus seed points
 * into `regions.generated.json` (`GeneratedVehicle`), which the app loads.
 *
 * Layers, bottom to top:
 *   scene background → ground shadows → primer fills per part
 *   → user paint (clipped per part) → the drawing's line art
 */
import type { TracedVehicleLayout } from './traceTypes';

export type Rect = { x: number; y: number; width: number; height: number };

/** Surface kind; sets the faint primer tint of the uncoloured part. */
export type Material = 'body' | 'glass' | 'light' | 'tire' | 'rim' | 'trim';

/** Non-colourable decorative parts drawn in the base layer. */
export type DecorFinish = 'trim' | 'void' | 'metal';

export interface GeneratedRegion {
  id: string;
  name: string;
  material: Material;
  /** Final, non-overlapping region path (artwork units, even-odd fill). */
  path: string;
  bounds: Rect;
  /** 1-based code used in the hit-test map. */
  code: number;
}

export interface GeneratedDecor {
  id: string;
  finish: DecorFinish;
  path: string;
}

export interface GeneratedHitMap {
  /** Artwork-space origin and size of the map; one cell per artwork unit. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Run-length encoded bytes, base64 (see engine/regions/hitMap.ts). */
  rle: string;
}

export interface GeneratedVehicle {
  id: string;
  /** Version of the traced geometry; saved drawings are keyed by it. */
  assetVersion?: number;
  generatedFrom: string;
  regions: GeneratedRegion[];
  decor: GeneratedDecor[];
  /** Union of every part. */
  silhouette: string;
  /** Per-material union paths ('' when unused). */
  materials: Record<Material, string>;
  hitMap: GeneratedHitMap;
  /** Vector line art (even-odd fill), drawn above the paint. */
  lineArt?: string;
  /** Framing rectangles and ground shadows. */
  layout?: TracedVehicleLayout;
}
