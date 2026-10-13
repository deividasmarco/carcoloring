/**
 * Review atlas for preparing a line-art car (step 1 of the trace workflow):
 *
 *   npx tsx scripts/trace-atlas.ts assets/source/<image>.png [outDir]
 *
 * Numbers every enclosed white area of the drawing at its "pole" (the point
 * farthest from any line), and writes:
 *   <name>-atlas.png        whole image, areas tinted, numbers drawn
 *   <name>-tile-<r><c>.png  2×2 overlapping close-ups at 1.4× for reading numbers
 *   <name>-atlas.json       [{ k, area, seed: [x, y], r, transparent }]
 * Seeds from the JSON go into the car's trace.ts. Transparent areas (outside
 * the car in images with alpha) are drawn dark and not numbered.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import { loadSkia } from './lib/headlessSkia';
import { components, distanceTransform, drawNumber, hashColor, inkCoverage, loadGray, savePng } from './lib/raster';

const ROOT = resolve(__dirname, '..');

async function main() {
  const [src, outArg] = process.argv.slice(2);
  if (!src) throw new Error('usage: trace-atlas <image> [outDir]');
  const out = resolve(ROOT, outArg ?? '.scratch/atlas');
  mkdirSync(out, { recursive: true });
  const name = basename(src).replace(/\.png$/i, '');
  const Skia = await loadSkia();
  const g = loadGray(Skia, resolve(ROOT, src));
  const { w, h } = g;
  const cov = inkCoverage(g, 0.92, 0.3);
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < ink.length; i++) ink[i] = cov[i] >= 0.5 ? 1 : 0;
  const free = new Uint8Array(ink.length);
  for (let i = 0; i < free.length; i++) free[i] = 1 - ink[i];
  const comps = components(free, w, h);
  const dist = distanceTransform(ink, w, h);
  const pole = new Int32Array(comps.count).fill(-1);
  const alphaSum = new Float64Array(comps.count);
  for (let i = 0; i < ink.length; i++) {
    const l = comps.labels[i];
    if (l < 0) continue;
    if (pole[l] < 0 || dist[i] > dist[pole[l]]) pole[l] = i;
    alphaSum[l] += g.alpha ? g.alpha[i] : 1;
  }
  const transparent = (k: number) => alphaSum[k] / comps.area[k] < 0.5;

  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const l = comps.labels[i];
    let c: number[];
    if (l < 0) c = [0, 0, 0];
    else if (transparent(l)) c = [40, 44, 56];
    else c = hashColor(l).map((v) => Math.round(v * 0.45 + 140));
    rgba.set([c[0], c[1], c[2], 255], i * 4);
  }
  const info = [];
  for (let k = 0; k < comps.count; k++) {
    const i = pole[k];
    const x = i % w;
    const y = Math.floor(i / w);
    info.push({ k, area: comps.area[k], seed: [x, y], r: Math.round(dist[i]), transparent: transparent(k) });
    if (transparent(k) || comps.area[k] < 20) continue;
    drawNumber(rgba, w, h, String(k), x, y, Math.max(7, Math.min(16, dist[i] * 1.2)), [10, 10, 40]);
  }
  savePng(Skia, join(out, `${name}-atlas.png`), rgba, w, h);
  writeFileSync(join(out, `${name}-atlas.json`), JSON.stringify(info));

  // 2×2 overlapping close-ups for reading the numbers.
  const atlas = Skia.Image.MakeImage({ width: w, height: h, colorType: 4, alphaType: 3 } as never, Skia.Data.fromBytes(rgba), w * 4)!;
  const tw = Math.ceil(w * 0.56);
  const th = Math.ceil(h * 0.56);
  const scale = 1.4;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x0 = c === 0 ? 0 : w - tw;
      const y0 = r === 0 ? 0 : h - th;
      const s = Skia.Surface.Make(Math.round(tw * scale), Math.round(th * scale))!;
      const cv = s.getCanvas();
      cv.scale(scale, scale);
      cv.translate(-x0, -y0);
      cv.drawImage(atlas, 0, 0);
      const grid = Skia.Paint();
      grid.setColor(Skia.Color('rgba(255,0,255,0.35)'));
      grid.setStyle(1);
      grid.setStrokeWidth(1 / scale);
      for (let gx = Math.ceil(x0 / 50) * 50; gx < x0 + tw; gx += 50) cv.drawLine(gx, y0, gx, y0 + th, grid);
      for (let gy = Math.ceil(y0 / 50) * 50; gy < y0 + th; gy += 50) cv.drawLine(x0, gy, x0 + tw, gy, grid);
      s.flush();
      writeFileSync(join(out, `${name}-tile-${r}${c}.png`), s.makeImageSnapshot().encodeToBytes());
    }
  }
  const inside = info.filter((c) => !c.transparent && c.area >= 20);
  console.log(`${name}: ${comps.count} areas, ${inside.length} opaque areas ≥ 20 px → ${out}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
