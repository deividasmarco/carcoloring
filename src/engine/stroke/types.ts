export type ToolId = 'crayon' | 'pencil' | 'eraser';
export type SizeIndex = 0 | 1 | 2;

/** A sampled input point in artwork coordinates. `p` is pressure 0..1. */
export interface StrokePoint {
  x: number;
  y: number;
  p: number;
}

export interface Stroke {
  id: string;
  tool: ToolId;
  /** Hex colour; ignored by the eraser. */
  color: string;
  size: SizeIndex;
  /** Region the stroke is locked to for its whole lifetime. */
  regionId: string;
  points: StrokePoint[];
}

export interface ToolDefinition {
  id: ToolId;
  /** Brush diameter in artwork units for the small / medium / large sizes. */
  widths: readonly [number, number, number];
  /** Layer opacity of one stroke; repeated strokes build up pigment. */
  opacity: number;
  /** Soft edge (blur sigma, artwork units) applied to the stroke coverage. */
  softness: number;
  grain: 'wax' | 'pencil' | null;
  /** How strongly stylus pressure modulates width (0 = not at all). */
  pressureWidth: number;
}

export const TOOLS: Record<ToolId, ToolDefinition> = {
  crayon: { id: 'crayon', widths: [16, 32, 60], opacity: 0.9, softness: 0.9, grain: 'wax', pressureWidth: 0.55 },
  pencil: { id: 'pencil', widths: [6, 13, 24], opacity: 0.72, softness: 0.35, grain: 'pencil', pressureWidth: 0.7 },
  eraser: { id: 'eraser', widths: [20, 40, 72], opacity: 1, softness: 1.2, grain: null, pressureWidth: 0.3 },
};

/** Neutral pressure used for finger input, where no pressure is reported. */
export const DEFAULT_PRESSURE = 0.5;

/** Width of a stroke at a given pressure. Finger input (0.5) yields the nominal width. */
export function widthAt(tool: ToolDefinition, size: SizeIndex, pressure: number): number {
  const base = tool.widths[size];
  const k = 1 + tool.pressureWidth * (pressure - DEFAULT_PRESSURE) * 2;
  return Math.max(1, base * Math.min(1.6, Math.max(0.35, k)));
}

/**
 * Upper bound on raw points per stroke. Longer scribbles are committed and
 * continue seamlessly as a new stroke in the same region, which keeps live
 * re-rendering cheap and history memory bounded.
 */
export const MAX_POINTS_PER_STROKE = 1500;
