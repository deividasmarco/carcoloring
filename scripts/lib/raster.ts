/**
 * Small raster toolkit for preparing traced vehicle artwork offline:
 * decoding, ink coverage, connected components, distance-ordered labelling,
 * and PNG output for visual review. Pure typed-array code plus Skia (CanvasKit)
 * for image decode/encode.
 */
import { readFileSync, writeFileSync } from 'fs';
import type { SkiaApiType } from './headlessSkia';

export interface Gray {
  w: number;
  h: number;
  /** Luminance 0..1 per pixel, composited over white. */
  lum: Float32Array;
  /** Alpha 0..1 per pixel, or null when the image is fully opaque. */
  alpha: Float32Array | null;
}

export function loadGray(Skia: SkiaApiType, path: string): Gray {
  const img = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(new Uint8Array(readFileSync(path))));
  if (!img) throw new Error(`Cannot decode ${path}`);
  const w = img.width();
  const h = img.height();
  const px = img.readPixels(0, 0, { width: w, height: h, colorType: 4, alphaType: 3 } as never) as Uint8Array;
  const lum = new Float32Array(w * h);
  const alpha = new Float32Array(w * h);
  let transparent = false;
  for (let i = 0; i < w * h; i++) {
    const a = px[i * 4 + 3] / 255;
    alpha[i] = a;
    if (a < 1) transparent = true;
    // Composite over white, then Rec. 709 luminance.
    const r = (px[i * 4] / 255) * a + (1 - a);
    const g = (px[i * 4 + 1] / 255) * a + (1 - a);
    const b = (px[i * 4 + 2] / 255) * a + (1 - a);
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return { w, h, lum, alpha: transparent ? alpha : null };
}

/** Ink coverage 0..1 from luminance (paper white → 0, line black → 1). */
export function inkCoverage(g: Gray, white: number, black: number): Float32Array {
  const c = new Float32Array(g.w * g.h);
  for (let i = 0; i < c.length; i++) c[i] = Math.min(1, Math.max(0, (white - g.lum[i]) / (white - black)));
  return c;
}

/** Draws an anti-aliased thick segment into a coverage buffer (max-combined, or erased). */
export function strokeSegment(
  cov: Float32Array,
  w: number,
  h: number,
  a: readonly [number, number],
  b: readonly [number, number],
  width: number,
  mode: 'add' | 'erase',
) {
  const r = width / 2;
  const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0]) - r - 2));
  const x1 = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0]) + r + 2));
  const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1]) - r - 2));
  const y1 = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1]) + r + 2));
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
      const d = Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
      const k = Math.max(0, Math.min(1, r + 0.5 - d));
      const i = y * w + x;
      if (mode === 'add') cov[i] = Math.max(cov[i], k);
      else cov[i] = Math.min(cov[i], 1 - k);
    }
  }
}

export interface Components {
  labels: Int32Array; // -1 for pixels outside the mask
  count: number;
  area: number[];
  bbox: [number, number, number, number][];
  sumX: number[];
  sumY: number[];
}

/** 4-connected components of pixels where mask[i] is true. */
export function components(mask: Uint8Array, w: number, h: number): Components {
  const labels = new Int32Array(w * h).fill(-1);
  const area: number[] = [];
  const bbox: [number, number, number, number][] = [];
  const sumX: number[] = [];
  const sumY: number[] = [];
  const stack = new Int32Array(w * h);
  let count = 0;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || labels[s] !== -1) continue;
    const id = count++;
    let sp = 0;
    stack[sp++] = s;
    labels[s] = id;
    let a = 0;
    let sx = 0;
    let sy = 0;
    let bx0 = w;
    let by0 = h;
    let bx1 = -1;
    let by1 = -1;
    while (sp > 0) {
      const i = stack[--sp];
      const x = i % w;
      const y = (i - x) / w;
      a++;
      sx += x;
      sy += y;
      if (x < bx0) bx0 = x;
      if (y < by0) by0 = y;
      if (x > bx1) bx1 = x;
      if (y > by1) by1 = y;
      if (x > 0 && mask[i - 1] && labels[i - 1] === -1) (labels[i - 1] = id), (stack[sp++] = i - 1);
      if (x < w - 1 && mask[i + 1] && labels[i + 1] === -1) (labels[i + 1] = id), (stack[sp++] = i + 1);
      if (y > 0 && mask[i - w] && labels[i - w] === -1) (labels[i - w] = id), (stack[sp++] = i - w);
      if (y < h - 1 && mask[i + w] && labels[i + w] === -1) (labels[i + w] = id), (stack[sp++] = i + w);
    }
    area.push(a);
    bbox.push([bx0, by0, bx1, by1]);
    sumX.push(sx);
    sumY.push(sy);
  }
  return { labels, count, area, bbox, sumX, sumY };
}

/**
 * Grows labels into unlabelled pixels (label -1) in order of distance, so each
 * unlabelled pixel takes the label of the nearest labelled pixel (8-connected
 * Dijkstra with Euclidean-ish step costs). Pixels where `blocked` is set are
 * never entered.
 */
export function growLabels(seedLabels: Int32Array, w: number, h: number, blocked?: Uint8Array): Int32Array {
  const out = Int32Array.from(seedLabels);
  const dist = new Float32Array(w * h).fill(Infinity);
  // Bucket queue on distance × 4 (costs 1 and √2 ≈ 1.5 → integer 4 and 6).
  const buckets: number[][] = [];
  const push = (i: number, d: number) => {
    const k = Math.round(d * 4);
    (buckets[k] ??= []).push(i);
  };
  for (let i = 0; i < out.length; i++) {
    if (out[i] >= 0) {
      dist[i] = 0;
      push(i, 0);
    }
  }
  const steps = [
    [-1, 0, 1],
    [1, 0, 1],
    [0, -1, 1],
    [0, 1, 1],
    [-1, -1, 1.5],
    [1, -1, 1.5],
    [-1, 1, 1.5],
    [1, 1, 1.5],
  ];
  for (let k = 0; k < buckets.length; k++) {
    const b = buckets[k];
    if (!b) continue;
    for (let j = 0; j < b.length; j++) {
      const i = b[j];
      const d = dist[i];
      if (Math.round(d * 4) !== k) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (const [sx, sy, c] of steps) {
        const nx = x + sx;
        const ny = y + sy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (blocked && blocked[n]) continue;
        const nd = d + c;
        if (nd < dist[n]) {
          dist[n] = nd;
          out[n] = out[i];
          push(n, nd);
        }
      }
    }
  }
  return out;
}

export function savePng(Skia: SkiaApiType, path: string, rgba: Uint8Array, w: number, h: number) {
  const img = Skia.Image.MakeImage({ width: w, height: h, colorType: 4, alphaType: 3 } as never, Skia.Data.fromBytes(rgba), w * 4);
  if (!img) throw new Error('MakeImage failed');
  writeFileSync(path, img.encodeToBytes());
}

/** Crops an RGBA buffer and saves it scaled to `outWidth` (high-quality resampling). */
export function saveScaledPng(
  Skia: SkiaApiType,
  path: string,
  rgba: Uint8Array,
  w: number,
  crop: { x: number; y: number; width: number; height: number },
  outWidth: number,
) {
  const src = Skia.Image.MakeImage({ width: w, height: rgba.length / 4 / w, colorType: 4, alphaType: 3 } as never, Skia.Data.fromBytes(rgba), w * 4);
  if (!src) throw new Error('MakeImage failed');
  const outH = Math.round((crop.height * outWidth) / crop.width);
  const surface = Skia.Surface.Make(outWidth, outH);
  if (!surface) throw new Error('Surface failed');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  canvas.drawImageRectCubic(src, Skia.XYWHRect(crop.x, crop.y, crop.width, crop.height), Skia.XYWHRect(0, 0, outWidth, outH), 1 / 3, 1 / 3, paint);
  surface.flush();
  const out = surface.makeImageSnapshot();
  writeFileSync(path, out.encodeToBytes());
}

export function hashColor(id: number): [number, number, number] {
  let h = (id * 2654435761) >>> 0;
  const hue = (h % 360) / 360;
  h = (h >>> 9) % 1000;
  const s = 0.55 + (h % 30) / 100;
  const l = 0.55 + ((h >>> 5) % 20) / 100;
  const f = (n: number) => {
    const k = (n + hue * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/** Chamfer (3-4) distance to the nearest pixel where `source` is set, in pixels. */
export function distanceTransform(source: Uint8Array, w: number, h: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = source[i] ? 0 : INF;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] === 0) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - w] + 3);
        if (x > 0) v = Math.min(v, d[i - w - 1] + 4);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + 4);
      }
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + 3);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + w - 1] + 4);
      }
      d[i] = v;
    }
  }
  for (let i = 0; i < d.length; i++) d[i] /= 3;
  return d;
}

/** Seven-segment digits for labelling review images (no font needed). */
const SEGMENTS: Record<string, string> = {
  '0': 'abcfed', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abfgcd',
};

export function drawNumber(rgba: Uint8Array, w: number, h: number, text: string, cx: number, cy: number, size: number, color: [number, number, number]) {
  const dw = size * 0.6;
  const gap = size * 0.25;
  const total = text.length * dw + (text.length - 1) * gap;
  let x0 = cx - total / 2;
  const y0 = cy - size / 2;
  const seg: Record<string, [number, number, number, number]> = {
    a: [0, 0, 1, 0], b: [1, 0, 1, 0.5], c: [1, 0.5, 1, 1], d: [0, 1, 1, 1],
    e: [0, 0.5, 0, 1], f: [0, 0, 0, 0.5], g: [0, 0.5, 1, 0.5],
  };
  const plot = (x: number, y: number) => {
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const px = Math.round(x) + ox;
      const py = Math.round(y) + oy;
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      const i = (py * w + px) * 4;
      const edge = Math.abs(ox) + Math.abs(oy) > 1;
      rgba.set(edge ? [255, 255, 255, 255] : [color[0], color[1], color[2], 255], i);
    }
  };
  for (const ch of text) {
    for (const s of SEGMENTS[ch] ?? '') {
      const [ax, ay, bx, by] = seg[s];
      const n = Math.ceil(size);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        plot(x0 + (ax + (bx - ax) * t) * dw, y0 + (ay + (by - ay) * t) * size);
      }
    }
    x0 += dw + gap;
  }
}
