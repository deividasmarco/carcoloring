import { AlphaType, ColorType, Skia, type SkImage, type SkPath } from '@shopify/react-native-skia';
import { GARAGE } from '../src/content/registry';
import { CELL_LINE, type HitMapData } from '../src/engine/regions/hitMap';
import type { SessionListener, HistoryState } from '../src/engine/session/drawingSession';
import { getVehicleRuntime, type VehicleRuntime } from '../src/engine/vehicle/vehicleRuntime';
import type { Rect } from '../src/content/vehicles/types';

export const entry = GARAGE[0];
/** The Apex GT (first garage car) unless another vehicle id is given. */
export const runtime = (vehicleId?: string): VehicleRuntime =>
  getVehicleRuntime((vehicleId ? GARAGE.find((e) => e.vehicle.id === vehicleId)! : entry).vehicle);
export const ALL_VEHICLE_IDS = GARAGE.map((e) => e.vehicle.id);

export function pixels(img: SkImage): Uint8Array {
  const px = img.readPixels(0, 0, {
    width: img.width(),
    height: img.height(),
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!px) throw new Error('readPixels failed');
  return px as Uint8Array;
}

/**
 * Largest per-channel difference between two RGBA (unpremultiplied) buffers,
 * measured on premultiplied values — what actually reaches the screen. Avoids
 * false positives from near-transparent edge pixels, whose unpremultiplied
 * colour is numerically unstable.
 */
export function premulDiff(a: Uint8Array, b: Uint8Array): number {
  let max = 0;
  for (let i = 0; i < a.length; i += 4) {
    const aa = a[i + 3];
    const ba = b[i + 3];
    max = Math.max(max, Math.abs(aa - ba));
    for (let k = 0; k < 3; k++) max = Math.max(max, Math.abs((a[i + k] * aa) / 255 - (b[i + k] * ba) / 255));
  }
  return max;
}

/** Anti-aliased coverage mask of `path`, rendered like the paint raster. */
export function regionMask(path: SkPath, rect: Rect, scale: number): Uint8Array {
  const w = Math.ceil(rect.width * scale);
  const h = Math.ceil(rect.height * scale);
  const s = Skia.Surface.Make(w, h)!;
  const c = s.getCanvas();
  c.clear(Skia.Color('transparent'));
  c.scale(scale, scale);
  c.translate(-rect.x, -rect.y);
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color('white'));
  c.drawPath(path, p);
  s.flush();
  const img = s.makeImageSnapshot();
  const px = pixels(img);
  img.dispose();
  s.dispose();
  return px;
}

export function cellCode(map: HitMapData, x: number, y: number) {
  return map.cells[(Math.floor(y) - map.y) * map.width + (Math.floor(x) - map.x)];
}

/** A point deep inside a region (all cells within `r` share its code), nearest the region's centroid. */
export function interiorPoint(map: HitMapData, code: number, r = 8): { x: number; y: number } {
  let cx = 0;
  let cy = 0;
  let n = 0;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.cells[y * map.width + x] === code) {
        cx += x;
        cy += y;
        n++;
      }
    }
  }
  if (n === 0) throw new Error(`Region code ${code} has no cells`);
  cx = map.x + cx / n;
  cy = map.y + cy / n;
  let best: { x: number; y: number; d: number } | null = null;
  for (let y = map.y + r; y < map.y + map.height - r; y += 2) {
    for (let x = map.x + r; x < map.x + map.width - r; x += 2) {
      if (cellCode(map, x, y) !== code) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (best && d >= best.d) continue;
      let ok = true;
      for (let dy = -r; dy <= r && ok; dy += 2) {
        for (let dx = -r; dx <= r && ok; dx += 2) if (cellCode(map, x + dx, y + dy) !== code) ok = false;
      }
      if (ok) best = { x: x + 0.5, y: y + 0.5, d };
    }
  }
  if (!best) throw new Error(`No interior point for region code ${code}`);
  return { x: best.x, y: best.y };
}

/** Mask pixels whose 3×3 neighbourhood is fully covered (true interior, away from AA edges). */
export function erodedInterior(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let all = true;
      for (let dy = -1; dy <= 1 && all; dy++) {
        for (let dx = -1; dx <= 1 && all; dx++) if (mask[((y + dy) * w + x + dx) * 4 + 3] !== 255) all = false;
      }
      out[y * w + x] = all ? 1 : 0;
    }
  }
  return out;
}

/**
 * A point in the middle of the drawn line separating two regions horizontally
 * (a at -x, b at +x). Searches every row, or only `row` when given.
 */
export function seamPoint(map: HitMapData, a: number, b: number, reach = 6, row?: number): { x: number; y: number } {
  const y0 = row !== undefined ? Math.floor(row) : map.y + reach;
  const y1 = row !== undefined ? Math.floor(row) + 1 : map.y + map.height - reach;
  for (let y = y0; y < y1; y++) {
    for (let x = map.x + reach; x < map.x + map.width - reach; x++) {
      if (cellCode(map, x, y) !== CELL_LINE) continue;
      if (cellCode(map, x - reach, y) === a && cellCode(map, x + reach, y) === b) {
        // Walk to the middle of the line band.
        let x0 = x;
        let x1 = x;
        while (cellCode(map, x0 - 1, y) === CELL_LINE) x0--;
        while (cellCode(map, x1 + 1, y) === CELL_LINE) x1++;
        return { x: (x0 + x1 + 1) / 2, y: y + 0.5 };
      }
    }
  }
  throw new Error(`No seam between ${a} and ${b}`);
}

export class RecordingListener implements SessionListener {
  image: SkImage | null = null;
  live = 0;
  liveCleared = 0;
  changes = 0;
  historyState: HistoryState = { canUndo: false, canRedo: false, hasPaint: false };
  started: string[] = [];
  rejected: string[] = [];
  paintImage(img: SkImage) {
    // Free the replaced snapshot (as the app does); they live in the WASM heap.
    if (this.image && this.image !== img) this.image.dispose();
    this.image = img;
  }
  liveStroke(pic: unknown) {
    if (pic) this.live++;
    else this.liveCleared++;
  }
  transform() {}
  history(h: HistoryState) {
    this.historyState = h;
  }
  changed() {
    this.changes++;
  }
  strokeStarted(id: string) {
    this.started.push(id);
  }
  strokeRejected(reason: string) {
    this.rejected.push(reason);
  }
}

/** Sum of paint alpha over the raster cells belonging to a region code (hit map). */
export function paintInRegion(px: Uint8Array, rect: Rect, scale: number, map: HitMapData, code: number) {
  const w = Math.ceil(rect.width * scale);
  const h = Math.ceil(rect.height * scale);
  let sum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ax = rect.x + (x + 0.5) / scale;
      const ay = rect.y + (y + 0.5) / scale;
      if (cellCode(map, ax, ay) === code) sum += px[(y * w + x) * 4 + 3];
    }
  }
  return sum;
}
