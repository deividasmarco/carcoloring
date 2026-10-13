/**
 * Screen ↔ artwork mapping.
 *
 *   screen = artwork * scale + (tx, ty)
 *
 * Rendering, hit testing, clipping and stroke storage all happen in artwork
 * units; only touch input is converted, through `toArtwork`. Because the whole
 * scene is drawn under one matrix built from the same transform, masks stay
 * aligned regardless of view size, orientation or zoom.
 */
import type { Rect } from '../../content/vehicles/types';

export interface Size {
  width: number;
  height: number;
}

export interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}

export interface Point {
  x: number;
  y: number;
}

export const IDENTITY: ViewTransform = { scale: 1, tx: 0, ty: 0 };
export const MAX_ZOOM = 4;

export const toArtwork = (t: ViewTransform, p: Point): Point => ({
  x: (p.x - t.tx) / t.scale,
  y: (p.y - t.ty) / t.scale,
});

export const toScreen = (t: ViewTransform, p: Point): Point => ({
  x: p.x * t.scale + t.tx,
  y: p.y * t.scale + t.ty,
});

/** Aspect-fits `rect` into the view, centred, with `padding` screen units. */
export function fitTransform(view: Size, rect: Rect, padding = 0): ViewTransform {
  const w = Math.max(1, view.width - padding * 2);
  const h = Math.max(1, view.height - padding * 2);
  const scale = Math.min(w / rect.width, h / rect.height);
  return {
    scale,
    tx: (view.width - rect.width * scale) / 2 - rect.x * scale,
    ty: (view.height - rect.height * scale) / 2 - rect.y * scale,
  };
}

/** Keeps zoom within [fit, fit × MAX_ZOOM] and the focus rect on screen. */
export function clampTransform(t: ViewTransform, view: Size, rect: Rect, fit: ViewTransform): ViewTransform {
  const scale = Math.min(fit.scale * MAX_ZOOM, Math.max(fit.scale, t.scale));
  const clampAxis = (offset: number, viewLen: number, start: number, len: number, fitOffset: number, fitScale: number) => {
    const contentLen = len * scale;
    if (contentLen <= viewLen + 1e-6) {
      // Content smaller than the view on this axis: keep it centred as in the fit.
      const centreArt = start + len / 2;
      const fitCentreScreen = centreArt * fitScale + fitOffset;
      return fitCentreScreen - centreArt * scale;
    }
    const max = -start * scale;
    const min = viewLen - (start + len) * scale;
    return Math.min(max, Math.max(min, offset));
  };
  return {
    scale,
    tx: clampAxis(t.tx, view.width, rect.x, rect.width, fit.tx, fit.scale),
    ty: clampAxis(t.ty, view.height, rect.y, rect.height, fit.ty, fit.scale),
  };
}

/**
 * Two-finger pinch/pan: the artwork point under the starting centroid stays
 * under the current centroid while the distance ratio scales the view.
 */
export function pinchTransform(
  start: ViewTransform,
  a0: Point,
  b0: Point,
  a1: Point,
  b1: Point,
): ViewTransform {
  const d0 = Math.max(1, Math.hypot(b0.x - a0.x, b0.y - a0.y));
  const d1 = Math.max(1, Math.hypot(b1.x - a1.x, b1.y - a1.y));
  const c0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const c1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  const anchor = toArtwork(start, c0);
  const scale = start.scale * (d1 / d0);
  return { scale, tx: c1.x - anchor.x * scale, ty: c1.y - anchor.y * scale };
}

/** Relative zoom (1 = fitted). */
export const zoomLevel = (t: ViewTransform, fit: ViewTransform) => t.scale / fit.scale;

/**
 * Re-targets a transform after the view was resized or rotated, keeping the
 * same relative zoom and the same artwork point at the view centre.
 */
export function refit(prev: ViewTransform, prevView: Size, prevFit: ViewTransform, view: Size, rect: Rect): {
  transform: ViewTransform;
  fit: ViewTransform;
} {
  const fit = fitTransform(view, rect);
  const zoom = zoomLevel(prev, prevFit);
  if (prevView.width <= 0 || prevView.height <= 0 || Math.abs(zoom - 1) < 1e-3) {
    return { transform: fit, fit };
  }
  const centre = toArtwork(prev, { x: prevView.width / 2, y: prevView.height / 2 });
  const scale = fit.scale * zoom;
  const next = { scale, tx: view.width / 2 - centre.x * scale, ty: view.height / 2 - centre.y * scale };
  return { transform: clampTransform(next, view, rect, fit), fit };
}

/** Converts a screen-space distance (dp) to artwork units. */
export const screenToArtworkLength = (t: ViewTransform, dp: number) => dp / t.scale;

/** 3×3 matrix (row-major, Skia order) for drawing artwork under this transform. */
export const toMatrix3 = (t: ViewTransform): number[] => [t.scale, 0, t.tx, 0, t.scale, t.ty, 0, 0, 1];
