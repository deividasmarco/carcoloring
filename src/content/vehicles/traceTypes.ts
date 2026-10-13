/**
 * Authoring model for vehicles prepared from line-art images.
 *
 * The artwork's own enclosed white areas define the colourable parts: each
 * region selects the white areas belonging to it with seed points and/or
 * lassos (source-image pixels). `scripts/build-traced-vehicle.ts` turns this
 * into vector region masks, a hit-test map and vector line art, all in the
 * car's local coordinate space (source pixels shifted by `offset`). A
 * separate placement maps local space into the shared garage scene.
 */
import type { Material, Rect } from './types';

export type Pt = readonly [number, number];

/** Claims every enclosed area whose pole (point farthest from any line) lies inside. */
export type Lasso =
  | { circle: readonly [number, number, number] }
  /** [cx, cy, rx, ry] — wheels seen in perspective. */
  | { ellipse: readonly [number, number, number, number] }
  | { polygon: readonly Pt[] };

export interface TracedRegionSpec {
  /** Stable identifier; persisted strokes reference it. Never rename. */
  id: string;
  name: string;
  material: Material;
  /**
   * One point inside each white area that belongs to this part. A point that
   * lands on a line snaps to the nearest white area within 8 px, but only if
   * that area is unambiguous.
   */
  seeds: Pt[];
  /** Areas not claimed by any seed whose pole lies inside one of these shapes. */
  within?: Lasso[];
  /**
   * The part is deliberately made of separate pieces (e.g. a tyre's tread and
   * sidewall split by the rim). Without this, a split part fails the build.
   */
  allowPieces?: boolean;
}

export interface Shadow {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
}

export interface TracedVehicleSpec {
  id: string;
  /**
   * Version of the traced geometry. Saved drawings are keyed by it, so bump it
   * whenever regions change in a way that would misplace existing strokes.
   */
  assetVersion: number;
  /** Line-art source image (project-relative). */
  source: string;
  /** Luminance mapped to ink coverage: ≥ white → paper, ≤ black → full ink. */
  ink: { white: number; black: number };
  /** Source pixel → local artwork unit translation (scale is 1). */
  offset: { x: number; y: number };
  /**
   * Local → garage-scene mapping. 'identity': local units are scene units.
   * 'stage': scale and centre the car into the scene's car stage, standing on
   * its ground line (normalises apparent size across the garage).
   */
  placement: 'identity' | 'stage';
  /** Enclosed, unassigned white areas smaller than this join the part around them. */
  absorbBelow: number;
  /** Short strokes that close gaps in the drawing (source pixels). Drawn as ink. */
  addLines: { from: Pt; to: Pt; width: number }[];
  /** Strokes that erase scenery ink touching the car (source pixels). */
  cuts: { from: Pt; to: Pt; width: number }[];
  /** Background visible through gaps inside the car (stays transparent). */
  seeThrough: Pt[];
  /** See-through areas selected by lasso (their pole lies inside), e.g. gaps in a bike frame. */
  seeThroughWithin?: Lasso[];
  /**
   * Plain-background artwork (a white page, no scenery): only white areas
   * touching the image border are background. Every other area must belong to
   * a region, be tiny (absorbed), or be declared see-through, so a forgotten
   * part fails the build instead of silently turning transparent.
   */
  strictBackground?: boolean;
  regions: TracedRegionSpec[];
  /**
   * Soft ground shadows (source pixels), or 'auto' to place one under each
   * tyre region and a broad one under the body.
   */
  shadows: Shadow[] | 'auto';
  /** Margin (artwork units) around the car for the studio's fitted view. */
  focusMargin: { x: number; top: number; bottom: number };
}

export interface Placement {
  /** scene = local × scale + (x, y) */
  scale: number;
  x: number;
  y: number;
}

export interface TracedVehicleLayout {
  focusRect: Rect;
  paintRect: Rect;
  silhouetteBounds: Rect;
  shadows: Shadow[];
  /** Local → scene mapping (identity for vehicles authored in scene units). */
  placement?: Placement;
}
