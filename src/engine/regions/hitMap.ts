/**
 * Region hit-test map.
 *
 * One byte per artwork unit, rasterised offline (no anti-aliasing) from the
 * final region paths, then outline bands stamped on top:
 *
 *   0          → empty: background, outside the vehicle
 *   1..N       → colourable region (GeneratedRegion.code)
 *   CELL_DECOR → non-colourable vehicle part (trim, wheel gaps, …)
 *   CELL_LINE  → inside a drawn outline band
 *
 * The map is only used to decide which region a stroke locks to. Rendering
 * uses the anti-aliased vector region paths as clip masks.
 */

export const CELL_EMPTY = 0;
export const CELL_DECOR = 254;
export const CELL_LINE = 255;

export interface HitMapData {
  x: number;
  y: number;
  width: number;
  height: number;
  cells: Uint8Array;
}

// ── RLE + base64 codec ─────────────────────────────────────────────────────

/** Encodes cells as (value:u8, runLength:LEB128) pairs. */
export function encodeRle(cells: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < cells.length) {
    const v = cells[i];
    let run = 1;
    while (i + run < cells.length && cells[i + run] === v) run++;
    out.push(v);
    let n = run;
    do {
      let byte = n & 0x7f;
      n >>>= 7;
      if (n > 0) byte |= 0x80;
      out.push(byte);
    } while (n > 0);
    i += run;
  }
  return Uint8Array.from(out);
}

export function decodeRle(bytes: Uint8Array, expectedLength: number): Uint8Array {
  const cells = new Uint8Array(expectedLength);
  let o = 0;
  let i = 0;
  while (i < bytes.length) {
    const v = bytes[i++];
    let n = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = bytes[i++];
      n |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    if (o + n > expectedLength) throw new Error('Hit map RLE overflows its declared size');
    cells.fill(v, o, o + n);
    o += n;
  }
  if (o !== expectedLength) throw new Error(`Hit map RLE decoded ${o} cells, expected ${expectedLength}`);
  return cells;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    s += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    s += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return s;
}

export function fromBase64(s: string): Uint8Array {
  const lookup = new Uint8Array(128);
  for (let i = 0; i < B64.length; i++) lookup[B64.charCodeAt(i)] = i;
  const clean = s.replace(/[^A-Za-z0-9+/=]/g, '');
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const out = new Uint8Array((clean.length / 4) * 3 - pad);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (lookup[clean.charCodeAt(i)] << 18) |
      (lookup[clean.charCodeAt(i + 1)] << 12) |
      (lookup[clean.charCodeAt(i + 2)] << 6) |
      lookup[clean.charCodeAt(i + 3)];
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}

export function decodeHitMap(g: { x: number; y: number; width: number; height: number; rle: string }): HitMapData {
  return {
    x: g.x,
    y: g.y,
    width: g.width,
    height: g.height,
    cells: decodeRle(fromBase64(g.rle), g.width * g.height),
  };
}

// ── Lookup ─────────────────────────────────────────────────────────────────

/** Cell value at an artwork-space point; outside the map counts as empty. */
export function cellAt(map: HitMapData, ax: number, ay: number): number {
  const cx = Math.floor(ax - map.x);
  const cy = Math.floor(ay - map.y);
  if (cx < 0 || cy < 0 || cx >= map.width || cy >= map.height) return CELL_EMPTY;
  return map.cells[cy * map.width + cx];
}

export const isRegionCell = (v: number) => v !== CELL_EMPTY && v !== CELL_DECOR && v !== CELL_LINE;

export interface StartRegionOptions {
  /** Search radius (artwork units) used only when the touch lands on an outline. */
  searchRadius: number;
  /**
   * A nearby region is accepted only if it is closer than every other region
   * by at least this much (artwork units). Otherwise the touch is ambiguous
   * (e.g. exactly on the seam between two panels) and nothing is painted.
   */
  ambiguityMargin: number;
}

export type StartRegionResult =
  | { code: number; reason: 'inside' | 'near-outline' }
  | { code: null; reason: 'outside' | 'decor' | 'ambiguous' | 'nothing-near' };

/**
 * Decides which region a new stroke locks to.
 *
 * - Inside a region → that region.
 * - Background or a non-colourable part → nothing (no paint).
 * - On an outline band → the unique closest region within `searchRadius`,
 *   or nothing when two regions are (nearly) equally close.
 */
export function resolveStartRegion(
  map: HitMapData,
  ax: number,
  ay: number,
  opts: StartRegionOptions,
): StartRegionResult {
  const v = cellAt(map, ax, ay);
  if (isRegionCell(v)) return { code: v, reason: 'inside' };
  if (v === CELL_EMPTY) return { code: null, reason: 'outside' };
  if (v === CELL_DECOR) return { code: null, reason: 'decor' };

  const r = Math.max(1, opts.searchRadius);
  const best = new Map<number, number>();
  const x0 = Math.floor(ax - r);
  const x1 = Math.ceil(ax + r);
  const y0 = Math.floor(ay - r);
  const y1 = Math.ceil(ay + r);
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      // Distance from the touch point to the centre of the cell.
      const dx = x + 0.5 - ax;
      const dy = y + 0.5 - ay;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const c = cellAt(map, x + 0.5, y + 0.5);
      if (!isRegionCell(c)) continue;
      const prev = best.get(c);
      if (prev === undefined || d2 < prev) best.set(c, d2);
    }
  }
  if (best.size === 0) return { code: null, reason: 'nothing-near' };
  const ranked = [...best.entries()].map(([code, d2]) => ({ code, d: Math.sqrt(d2) })).sort((a, b) => a.d - b.d);
  if (ranked.length === 1 || ranked[1].d - ranked[0].d >= opts.ambiguityMargin) {
    return { code: ranked[0].code, reason: 'near-outline' };
  }
  return { code: null, reason: 'ambiguous' };
}
