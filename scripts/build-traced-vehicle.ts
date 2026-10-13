/**
 * Builds a colourable vehicle from line art:
 *
 *   npx tsx scripts/build-traced-vehicle.ts [--preview]
 *
 *  1. Ink coverage from the image (+ authored gap closures / cuts).
 *  2. Enclosed white areas = connected components of non-ink pixels.
 *  3. Regions select their areas by seed points. Scenery is every area
 *     reachable from the image border without crossing a car area; enclosed,
 *     unassigned areas must be tiny (absorbed into the line) or the build fails.
 *     With `strictBackground` (plain white pages), only areas touching the
 *     border, or declared see-through, are outside the car.
 *  4. Every ink pixel inside the car goes to its nearest area, so neighbouring
 *     regions meet in the middle of the drawn line (hidden under the outline).
 *  5. Region masks → vector paths (marching squares); the car's own ink →
 *     vector line art; per-pixel hit map with outline cells marked.
 * Everything shares one coordinate space: source pixels + spec.offset.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { loadSkia } from './lib/headlessSkia';
import { isoContours, loopsToSvg, loopsVertexCount, simplifyLoop, type Loop } from './lib/contours';
import {
  components,
  distanceTransform,
  growLabels,
  hashColor,
  inkCoverage,
  loadGray,
  savePng,
  saveScaledPng,
  strokeSegment,
} from './lib/raster';
import { CELL_EMPTY, CELL_LINE, encodeRle, toBase64 } from '../src/engine/regions/hitMap';
import type { GeneratedVehicle, Material, Rect } from '../src/content/vehicles/types';
import type { Placement, Shadow, TracedVehicleSpec } from '../src/content/vehicles/traceTypes';
import { SCENE_LAYOUT } from '../src/content/scenes/neon-garage/layout';
import { TRACED_VEHICLES } from '../src/content/vehicles/traces';

const ROOT = resolve(__dirname, '..');
const VEHICLES = TRACED_VEHICLES.map((spec) => ({
  spec,
  out: `src/content/vehicles/${spec.id}/regions.generated.json`,
  source: `src/content/vehicles/${spec.id}/trace.ts`,
}));

const EXTERIOR = -2;

function bboxOf(mask: (i: number) => boolean, w: number, h: number) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask(y * w + x)) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** Review image: each part in its own colour with the source ink on top. */
function writePartPreview(Skia: Awaited<ReturnType<typeof loadSkia>>, id: string, part: Int32Array, cov: Float32Array, w: number, h: number) {
  const dir = join(ROOT, '.scratch');
  mkdirSync(dir, { recursive: true });
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const p = part[i];
    const c = p >= 0 ? hashColor(p * 7 + 3) : p === -3 ? [255, 0, 0] : [24, 30, 44];
    const k = cov[i];
    rgba.set([c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k), 255], i * 4);
  }
  savePng(Skia, join(dir, `${id}-regions.png`), rgba, w, h);
}

/**
 * Review image for lassos: areas a lasso claimed in their part's colour, every
 * other area grey, lasso shapes outlined in white. Over-reaching lassos show
 * up as coloured areas that belong to a different panel.
 */
function writeLassoAudit(
  Skia: Awaited<ReturnType<typeof loadSkia>>,
  spec: TracedVehicleSpec,
  labels: Int32Array,
  claimed: Uint8Array,
  compRegion: Int32Array,
  cov: Float32Array,
  w: number,
  h: number,
  inLasso: (x: number, y: number, l: NonNullable<TracedVehicleSpec['regions'][number]['within']>[number]) => boolean,
) {
  const lassos = spec.regions.flatMap((r) => r.within ?? []);
  if (!lassos.length) return;
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const l = labels[i];
    let c = [90, 96, 110];
    if (l >= 0 && claimed[l]) c = hashColor(compRegion[l] * 7 + 3);
    else if (l < 0) c = [90, 96, 110];
    const k = cov[i];
    rgba.set([c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k), 255], i * 4);
  }
  // Lasso outlines: pixels inside a lasso whose right or lower neighbour is outside.
  for (const lasso of lassos) {
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w - 1; x++) {
        const a = inLasso(x, y, lasso);
        if (a !== inLasso(x + 1, y, lasso) || a !== inLasso(x, y + 1, lasso)) rgba.set([255, 255, 255, 255], (y * w + x) * 4);
      }
    }
  }
  const dir = join(ROOT, '.scratch');
  mkdirSync(dir, { recursive: true });
  savePng(Skia, join(dir, `${spec.id}-lassos.png`), rgba, w, h);
}

function traceMask(mask: (x: number, y: number) => boolean, b: { x0: number; y0: number; x1: number; y1: number }, tol: number): Loop[] {
  return isoContours((x, y) => (mask(x, y) ? 1 : 0), b.x0, b.y0, b.x1, b.y1).map((l) => simplifyLoop(l, tol));
}

async function build(spec: TracedVehicleSpec, sourceFile: string, preview: boolean): Promise<GeneratedVehicle> {
  const Skia = await loadSkia();
  const g = loadGray(Skia, join(ROOT, spec.source));
  const { w, h } = g;
  const N = w * h;
  const cov = inkCoverage(g, spec.ink.white, spec.ink.black);
  for (const c of spec.cuts) strokeSegment(cov, w, h, c.from, c.to, c.width, 'erase');
  for (const l of spec.addLines) strokeSegment(cov, w, h, l.from, l.to, l.width, 'add');
  const ink = new Uint8Array(N);
  for (let i = 0; i < N; i++) ink[i] = cov[i] >= 0.5 ? 1 : 0;
  const free = new Uint8Array(N);
  for (let i = 0; i < N; i++) free[i] = 1 - ink[i];
  const comps = components(free, w, h);

  // Images with an alpha channel: areas that are mostly transparent are
  // outside the car, whatever lines surround them.
  const transparentComp = new Uint8Array(comps.count);
  if (g.alpha) {
    const alphaSum = new Float64Array(comps.count);
    for (let i = 0; i < N; i++) if (comps.labels[i] >= 0) alphaSum[comps.labels[i]] += g.alpha[i];
    for (let c = 0; c < comps.count; c++) transparentComp[c] = alphaSum[c] / comps.area[c] < 0.5 ? 1 : 0;
  }

  // Pole of each area: its pixel farthest from any line (used by lassos).
  const inkDist = distanceTransform(ink, w, h);
  const pole = new Int32Array(comps.count).fill(-1);
  for (let i = 0; i < N; i++) {
    const l = comps.labels[i];
    if (l >= 0 && (pole[l] < 0 || inkDist[i] > inkDist[pole[l]])) pole[l] = i;
  }

  // ── Seeds and lassos → regions ───────────────────────────────────────────
  const compRegion = new Int32Array(comps.count).fill(-1);
  const problems: string[] = [];
  /** The area under a seed, snapping off a line to the nearest unambiguous area. */
  const areaAt = (sx: number, sy: number): number | string => {
    const here = comps.labels[sy * w + sx];
    if (here >= 0) return here;
    let best = -1;
    let bestD = Infinity;
    const near = new Map<number, number>();
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        const x = sx + dx;
        const y = sy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const l = comps.labels[y * w + x];
        if (l < 0) continue;
        const d = Math.hypot(dx, dy);
        near.set(l, Math.min(near.get(l) ?? Infinity, d));
        if (d < bestD) (bestD = d), (best = l);
      }
    }
    if (best < 0) return 'is on a line with no white area within 8 px';
    const second = [...near.entries()].filter(([l]) => l !== best).sort((a, b) => a[1] - b[1])[0];
    if (second && second[1] - bestD < 2) return 'is on a line between two areas — move it into one';
    return best;
  };
  spec.regions.forEach((r, ri) => {
    for (const [sx, sy] of r.seeds) {
      const l = areaAt(sx, sy);
      if (typeof l === 'string') {
        problems.push(`${r.id}: seed (${sx},${sy}) ${l}`);
        continue;
      }
      if (transparentComp[l]) {
        problems.push(`${r.id}: seed (${sx},${sy}) is outside the car (transparent)`);
        continue;
      }
      if (compRegion[l] >= 0 && compRegion[l] !== ri) {
        problems.push(`${r.id}: seed (${sx},${sy}) is in the same area as ${spec.regions[compRegion[l]].id} — close the gap with addLines`);
      }
      compRegion[l] = ri;
    }
  });
  const inLasso = (x: number, y: number, lasso: NonNullable<TracedVehicleSpec['regions'][number]['within']>[number]) => {
    if ('circle' in lasso) return Math.hypot(x - lasso.circle[0], y - lasso.circle[1]) <= lasso.circle[2];
    if ('ellipse' in lasso) {
      const [cx, cy, rx, ry] = lasso.ellipse;
      return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    }
    let inside = false;
    const p = lasso.polygon;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if (p[i][1] > y !== p[j][1] > y && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) inside = !inside;
    }
    return inside;
  };
  const lassoClaimed = new Uint8Array(comps.count);
  for (let c = 0; c < comps.count; c++) {
    if (compRegion[c] >= 0 || transparentComp[c]) continue;
    const px = pole[c] % w;
    const py = Math.floor(pole[c] / w);
    const ri = spec.regions.findIndex((r) => r.within?.some((l) => inLasso(px, py, l)));
    if (ri >= 0) (compRegion[c] = ri), (lassoClaimed[c] = 1);
  }
  if (preview) writeLassoAudit(Skia, spec, comps.labels, lassoClaimed, compRegion, cov, w, h, inLasso);

  // ── Scenery: reachable from the border without crossing the car ─────────
  const grownAll = growLabels(comps.labels, w, h);
  const adjacency: Set<number>[] = Array.from({ length: comps.count }, () => new Set());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = grownAll[y * w + x];
      if (x + 1 < w) {
        const b = grownAll[y * w + x + 1];
        if (a !== b) adjacency[a].add(b), adjacency[b].add(a);
      }
      if (y + 1 < h) {
        const b = grownAll[(y + 1) * w + x];
        if (a !== b) adjacency[a].add(b), adjacency[b].add(a);
      }
    }
  }
  const exterior = new Uint8Array(comps.count);
  const queue: number[] = [];
  const markExterior = (c: number) => {
    if (exterior[c] || compRegion[c] >= 0) return;
    // With alpha, only transparent areas can be outside: an opaque white area
    // is car paper even when it touches the background.
    if (g.alpha && !transparentComp[c]) return;
    exterior[c] = 1;
    queue.push(c);
  };
  for (let c = 0; c < comps.count; c++) {
    const [bx0, by0, bx1, by1] = comps.bbox[c];
    if (bx0 === 0 || by0 === 0 || bx1 === w - 1 || by1 === h - 1 || transparentComp[c]) markExterior(c);
  }
  for (const [sx, sy] of spec.seeThrough) {
    const l = comps.labels[sy * w + sx];
    if (l < 0) problems.push(`seeThrough (${sx},${sy}) is on a line`);
    else if (compRegion[l] >= 0) problems.push(`seeThrough (${sx},${sy}) is inside region ${spec.regions[compRegion[l]].id}`);
    else markExterior(l);
  }
  if (spec.seeThroughWithin?.length) {
    for (let c = 0; c < comps.count; c++) {
      if (compRegion[c] >= 0 || exterior[c]) continue;
      const px = pole[c] % w;
      const py = Math.floor(pole[c] / w);
      if (spec.seeThroughWithin.some((l) => inLasso(px, py, l))) markExterior(c);
    }
  }
  if (spec.strictBackground) {
    // Plain page: nothing but the border-touching background and declared
    // see-through areas is outside the car.
    queue.length = 0;
  }
  while (queue.length) {
    const c = queue.pop()!;
    for (const n of adjacency[c]) markExterior(n);
  }
  const absorbed = new Uint8Array(comps.count);
  for (let c = 0; c < comps.count; c++) {
    if (compRegion[c] >= 0 || exterior[c]) continue;
    if (comps.area[c] < spec.absorbBelow) absorbed[c] = 1;
    else {
      // Report the pole: a point well inside the area, usable as a seed.
      const px = pole[c] % w;
      const py = Math.floor(pole[c] / w);
      problems.push(`unassigned area inside the car: ${comps.area[c]} px, seed [${px}, ${py}]`);
    }
  }
  if (problems.length) {
    if (preview) {
      // Assigned areas in their part colour; unassigned areas bright red.
      const p = new Int32Array(N).fill(-2);
      for (let i = 0; i < N; i++) {
        const l = comps.labels[i];
        if (l < 0 || exterior[l]) continue;
        p[i] = compRegion[l] >= 0 ? compRegion[l] : absorbed[l] ? -2 : -3;
      }
      writePartPreview(Skia, spec.id, p, cov, w, h);
    }
    throw new Error(`${spec.id}:\n  - ${problems.join('\n  - ')}`);
  }

  // ── Small enclosed gaps join, whole, the part whose paper surrounds them ──
  // (votes from region paper within a few pixels of the gap), so a gap never
  // ends up split or attached to a part across a line.
  const absorbedTo = new Int32Array(comps.count).fill(EXTERIOR);
  {
    const R = 8;
    for (let c = 0; c < comps.count; c++) {
      if (!absorbed[c]) continue;
      const [bx0, by0, bx1, by1] = comps.bbox[c];
      const x0 = Math.max(0, bx0 - R);
      const y0 = Math.max(0, by0 - R);
      const x1 = Math.min(w - 1, bx1 + R);
      const y1 = Math.min(h - 1, by1 + R);
      const lw = x1 - x0 + 1;
      const lh = y1 - y0 + 1;
      const local = new Uint8Array(lw * lh);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) local[(y - y0) * lw + (x - x0)] = comps.labels[y * w + x] === c ? 1 : 0;
      const d = distanceTransform(local, lw, lh);
      const votes = new Map<number, number>();
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const l = comps.labels[y * w + x];
          if (l < 0 || compRegion[l] < 0) continue;
          const dist = d[(y - y0) * lw + (x - x0)];
          if (dist > R) continue;
          votes.set(compRegion[l], (votes.get(compRegion[l]) ?? 0) + (R + 1 - dist));
        }
      }
      let best = EXTERIOR;
      let bestV = 0;
      for (const [r, v] of votes) if (v > bestV) (best = r), (bestV = v);
      absorbedTo[c] = best;
    }
  }

  // ── Partition: every pixel to its nearest region area or to scenery ─────
  const seedLabels = new Int32Array(N).fill(-1);
  for (let i = 0; i < N; i++) {
    const l = comps.labels[i];
    if (l < 0) continue;
    seedLabels[i] = absorbed[l] ? absorbedTo[l] : compRegion[l] >= 0 ? compRegion[l] : EXTERIOR;
  }
  // growLabels treats negatives as unlabelled, so offset labels by +2.
  const shifted = new Int32Array(N);
  for (let i = 0; i < N; i++) shifted[i] = seedLabels[i] === -1 ? -1 : seedLabels[i] + 2;
  const grown = growLabels(shifted, w, h);
  const part = new Int32Array(N);
  for (let i = 0; i < N; i++) part[i] = grown[i] - 2; // -2 = scenery, ≥0 region index
  const inCar = (i: number) => part[i] >= 0;

  // Every part must be one connected piece (paper + its share of the lines).
  // Slivers under SLIVER px that ended up detached (e.g. a tiny gap voted to a
  // part across a line) join the neighbouring part they share most border with.
  const SLIVER = 400;
  spec.regions.forEach((r, ri) => {
    const mask = new Uint8Array(N);
    for (let i = 0; i < N; i++) mask[i] = part[i] === ri ? 1 : 0;
    const pieces = components(mask, w, h);
    if (pieces.count <= 1) return;
    const main = pieces.area.indexOf(Math.max(...pieces.area));
    const extra: string[] = [];
    for (let k = 0; k < pieces.count; k++) {
      if (k === main) continue;
      if (pieces.area[k] >= SLIVER) {
        extra.push(`${pieces.area[k]}px@${Math.round(pieces.sumX[k] / pieces.area[k])},${Math.round(pieces.sumY[k] / pieces.area[k])}`);
        continue;
      }
      const border = new Map<number, number>();
      const [bx0, by0, bx1, by1] = pieces.bbox[k];
      for (let y = Math.max(0, by0 - 1); y <= Math.min(h - 1, by1 + 1); y++) {
        for (let x = Math.max(0, bx0 - 1); x <= Math.min(w - 1, bx1 + 1); x++) {
          const i = y * w + x;
          if (pieces.labels[i] !== k) continue;
          for (const n of [i - 1, i + 1, i - w, i + w]) {
            if (n < 0 || n >= N || pieces.labels[n] === k) continue;
            const p = part[n];
            if (p !== ri) border.set(p, (border.get(p) ?? 0) + 1);
          }
        }
      }
      const to = [...border.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (to === undefined) continue;
      for (let i = 0; i < N; i++) if (pieces.labels[i] === k) part[i] = to;
    }
    if (extra.length && !r.allowPieces) problems.push(`${r.id} has ${extra.length + 1} separate pieces; extra: ${extra.join(', ')}`);
  });
  if (problems.length) {
    if (preview) writePartPreview(Skia, spec.id, part, cov, w, h);
    throw new Error(`${spec.id}:\n  - ${problems.join('\n  - ')}`);
  }

  // ── Line art: the car's ink, plus the outer half of its silhouette line ──
  const carWhite = new Uint8Array(N);
  for (let i = 0; i < N; i++) carWhite[i] = inCar(i) && !ink[i] ? 1 : 0;
  const halfWidth = distanceTransform(carWhite, w, h); // inside the line: distance to car paper
  const carMask = new Uint8Array(N);
  for (let i = 0; i < N; i++) carMask[i] = inCar(i) ? 1 : 0;
  const distToCar = distanceTransform(carMask, w, h);
  const nearestCarIdx = new Int32Array(N).fill(-1);
  for (let i = 0; i < N; i++) if (carMask[i]) nearestCarIdx[i] = i;
  const nearest = growLabels(nearestCarIdx, w, h);
  const lineCov = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (cov[i] <= 0) continue;
    if (carMask[i]) lineCov[i] = cov[i];
    else if (distToCar[i] <= 10) {
      // Mirror the inner half-width of the silhouette line to its outer side,
      // which keeps the full outline but trims scenery lines touching it flush.
      const reach = halfWidth[nearest[i]] + 1;
      if (distToCar[i] <= reach) lineCov[i] = cov[i];
    }
  }
  const art = bboxOf((i) => lineCov[i] > 0, w, h);
  const lineLoops = isoContours((x, y) => lineCov[y * w + x], art.x0, art.y0, art.x1, art.y1).map((l) => simplifyLoop(l, 0.3));

  // ── Region and material vector masks ─────────────────────────────────────
  const ox = spec.offset.x;
  const oy = spec.offset.y;
  const regionsOut = spec.regions.map((r, ri) => {
    const b = bboxOf((i) => part[i] === ri, w, h);
    if (b.x1 < 0) throw new Error(`${r.id}: empty region`);
    const loops = traceMask((x, y) => part[y * w + x] === ri, b, 0.25);
    return {
      id: r.id,
      name: r.name,
      material: r.material,
      path: loopsToSvg(loops, ox, oy),
      bounds: { x: b.x0 + ox, y: b.y0 + oy, width: b.x1 - b.x0, height: b.y1 - b.y0 },
      code: ri + 1,
      vertices: loopsVertexCount(loops),
    };
  });
  const car = bboxOf((i) => carMask[i] === 1, w, h);
  const materials = {} as Record<Material, string>;
  for (const m of ['body', 'glass', 'light', 'tire', 'rim', 'trim'] as Material[]) {
    const idx = new Set(spec.regions.map((r, ri) => (r.material === m ? ri : -1)).filter((x) => x >= 0));
    materials[m] = idx.size ? loopsToSvg(traceMask((x, y) => idx.has(part[y * w + x]), car, 0.25), ox, oy) : '';
  }
  const silhouette = loopsToSvg(traceMask((x, y) => carMask[y * w + x] === 1, car, 0.25), ox, oy);

  // ── Hit map: region paper → code, car line → LINE, scenery → EMPTY ───────
  // Cropped to the car (plus its outline and a margin); outside reads EMPTY.
  const M = 16;
  const hx0 = Math.max(0, car.x0 - M);
  const hy0 = Math.max(0, car.y0 - M);
  const hx1 = Math.min(w, car.x1 + M);
  const hy1 = Math.min(h, car.y1 + M);
  const hw = hx1 - hx0;
  const hh = hy1 - hy0;
  const cells = new Uint8Array(hw * hh);
  for (let y = hy0; y < hy1; y++) {
    for (let x = hx0; x < hx1; x++) {
      const i = y * w + x;
      const o = (y - hy0) * hw + (x - hx0);
      if (!inCar(i)) cells[o] = CELL_EMPTY;
      else if (ink[i] || comps.labels[i] < 0) cells[o] = CELL_LINE;
      else cells[o] = part[i] + 1;
    }
  }

  const sb: Rect = { x: car.x0 + ox, y: car.y0 + oy, width: car.x1 - car.x0, height: car.y1 - car.y0 };
  const m = spec.focusMargin;

  // Ground shadows: authored, or one under each tyre plus a broad body shadow.
  let shadows: Shadow[];
  if (spec.shadows === 'auto') {
    shadows = [];
    for (const r of regionsOut) {
      if (r.material !== 'tire') continue;
      const b = r.bounds;
      shadows.push({ cx: b.x + b.width / 2, cy: b.y + b.height - 3, rx: b.width * 0.62, ry: Math.max(8, b.width * 0.11), opacity: 0.6 });
    }
    shadows.push({ cx: sb.x + sb.width / 2, cy: sb.y + sb.height - 14, rx: sb.width * 0.46, ry: sb.height * 0.045, opacity: 0.4 });
  } else {
    shadows = spec.shadows.map((s) => ({ ...s, cx: s.cx + ox, cy: s.cy + oy }));
  }

  // Local → scene placement.
  let placement: Placement = { scale: 1, x: 0, y: 0 };
  if (spec.placement === 'stage') {
    const st = SCENE_LAYOUT.carStage;
    const scale = Math.min(st.maxWidth / sb.width, st.maxHeight / sb.height);
    placement = {
      scale: Math.round(scale * 10000) / 10000,
      x: Math.round((st.centerX - (sb.x + sb.width / 2) * scale) * 100) / 100,
      y: Math.round((st.groundY - (sb.y + sb.height) * scale) * 100) / 100,
    };
  }

  const generated: GeneratedVehicle = {
    id: spec.id,
    assetVersion: spec.assetVersion,
    generatedFrom: sourceFile,
    regions: regionsOut.map(({ vertices: _v, ...r }) => r),
    decor: [],
    silhouette,
    materials,
    lineArt: loopsToSvg(lineLoops, ox, oy),
    layout: {
      silhouetteBounds: sb,
      focusRect: { x: sb.x - m.x, y: sb.y - m.top, width: sb.width + m.x * 2, height: sb.height + m.top + m.bottom },
      paintRect: { x: sb.x - 2, y: sb.y - 2, width: sb.width + 4, height: sb.height + 4 },
      shadows,
      placement,
    },
    hitMap: { x: hx0 + ox, y: hy0 + oy, width: hw, height: hh, rle: toBase64(encodeRle(cells)) },
  };

  // ── Thumbnail: the car's own paper and outline, transparent outside ──────
  {
    const rgba = new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) {
      const k = lineCov[i];
      if (inCar(i)) {
        const v = Math.round(250 * (1 - 0.92 * k));
        rgba.set([v, v, v + 2 > 255 ? 255 : v + 2, 255], i * 4);
      } else if (k > 0) {
        rgba.set([14, 16, 22, Math.round(255 * k)], i * 4);
      }
    }
    const pad = 6;
    const crop = { x: Math.max(0, car.x0 - pad), y: Math.max(0, car.y0 - pad), width: 0, height: 0 };
    crop.width = Math.min(w, car.x1 + pad) - crop.x;
    crop.height = Math.min(h, car.y1 + pad) - crop.y;
    saveScaledPng(Skia, join(ROOT, `src/content/vehicles/${spec.id}/thumbnail.png`), rgba, w, crop, 360);
  }

  console.log(`✔ ${spec.id}: ${regionsOut.length} regions, ${comps.count} areas (${absorbed.reduce((a, b) => a + b, 0)} absorbed), line art ${loopsVertexCount(lineLoops)} vertices`);
  console.log(`   car bounds (artwork units) x ${sb.x}–${sb.x + sb.width}, y ${sb.y}–${sb.y + sb.height}`);
  console.log(`   placement scale ${placement.scale} → scene x ${placement.x}, y ${placement.y}`);
  if (!process.argv.includes('--quiet')) for (const r of regionsOut) console.log(`   ${String(r.code).padStart(2)} ${r.id.padEnd(18)} ${r.name.padEnd(18)} ${r.vertices} vertices`);

  if (preview) {
    const dir = join(ROOT, '.scratch');
    mkdirSync(dir, { recursive: true });
    // Region map with the traced line art's source ink on top.
    const rgba = new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) {
      const p = part[i];
      let c: [number, number, number] = p >= 0 ? hashColor(p * 7 + 3) : [24, 30, 44];
      const k = lineCov[i];
      c = [c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)] as [number, number, number];
      if (p < 0 && cov[i] > 0 && !lineCov[i]) c = [70, 76, 92]; // removed scenery ink
      rgba.set([c[0], c[1], c[2], 255], i * 4);
    }
    savePng(Skia, join(dir, `${spec.id}-regions.png`), rgba, w, h);
    // Hit map.
    const hm = new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) {
      const v = cells[i];
      const c = v === CELL_EMPTY ? [0, 0, 0] : v === CELL_LINE ? [255, 255, 255] : hashColor((v - 1) * 7 + 3);
      hm.set([c[0], c[1], c[2], 255], i * 4);
    }
    savePng(Skia, join(dir, `${spec.id}-hitmap.png`), hm, w, h);
  }
  return generated;
}

async function main() {
  const preview = process.argv.includes('--preview');
  const only = process.argv.indexOf('--only');
  const pick = only >= 0 ? process.argv[only + 1] : null;
  for (const v of VEHICLES) {
    if (pick && v.spec.id !== pick) continue;
    const g = await build(v.spec, v.source, preview);
    const out = join(ROOT, v.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(g) + '\n');
    console.log(`   ${(JSON.stringify(g).length / 1024).toFixed(0)} KB → ${v.out}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
