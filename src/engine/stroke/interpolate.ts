import type { StrokePoint } from './types';

/**
 * Densifies raw touch samples with a centripetal-free (uniform) Catmull-Rom
 * spline so fast finger movement produces smooth curves instead of polygons.
 * Output spacing is at most `spacing` artwork units; pressure is interpolated.
 */
export function densify(points: readonly StrokePoint[], spacing: number): StrokePoint[] {
  if (points.length < 2) return points.slice();
  const out: StrokePoint[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    // The epsilon keeps the step count stable under float noise, so identical
    // strokes replay identically regardless of the screen transform they came through.
    const steps = Math.max(1, Math.ceil(len / spacing - 1e-6));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push({ x, y, p: p1.p + (p2.p - p1.p) * t });
    }
  }
  return out;
}

/** Axis-aligned bounds of a point list, grown by `pad`. */
export function pointBounds(points: readonly StrokePoint[], pad: number) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: x0 - pad, y: y0 - pad, width: x1 - x0 + pad * 2, height: y1 - y0 + pad * 2 };
}

/** Drops samples closer than `minDistance` to the previous kept one (keeps the last). */
export function thin(points: readonly StrokePoint[], minDistance: number): StrokePoint[] {
  if (points.length <= 2) return points.slice();
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const last = out[out.length - 1];
    if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= minDistance) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}
