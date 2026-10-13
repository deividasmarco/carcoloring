/**
 * Browser end-to-end checks of the real app (Expo web + React Native Skia on
 * CanvasKit). Requires the dev server:  npx expo start --web --port 8081
 * Then:  node e2e/web-studio.e2e.mjs [baseUrl] [screenshotDir]
 *
 * Input is real: mouse drags and multi-touch (Chrome DevTools Protocol) on the
 * drawing surface. Results are read back from the committed paint raster via
 * the development-only probe (src/dev/webProbe.ts).
 */
import { mkdirSync } from 'fs';
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:8081';
const SHOTS = process.argv[3] ?? '.scratch/e2e';
mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const cdp = await context.newCDPSession(page);

async function openStudio() {
  await page.goto(`${BASE}/studio/apex-gt`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForFunction(() => !!globalThis.__neonBay, null, { timeout: 60000 });
  await page.waitForTimeout(1200);
}

/** A point deep inside a region (all probes within r units agree). */
const interior = (id, r = 14, prefer = 'centre') =>
  page.evaluate(
    ({ id, r, prefer }) => {
      const nb = globalThis.__neonBay;
      const reg = nb.regions.find((x) => x.id === id);
      const b = reg.bounds;
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      let best = null;
      for (let y = b.y + r; y < b.y + b.height - r; y += 3) {
        for (let x = b.x + r; x < b.x + b.width - r; x += 3) {
          if (nb.regionAt(x, y) !== id) continue;
          let ok = true;
          for (let a = 0; a < 8 && ok; a++) {
            if (nb.regionAt(x + r * Math.cos((a * Math.PI) / 4), y + r * Math.sin((a * Math.PI) / 4)) !== id) ok = false;
          }
          if (!ok) continue;
          const d = prefer === 'left' ? x : prefer === 'right' ? -x : Math.hypot(x - cx, y - cy);
          if (!best || d < best.d) best = { x, y, d };
        }
      }
      return best && { x: best.x, y: best.y };
    },
    { id, r, prefer },
  );

async function toPage(p) {
  const box = await page.getByTestId('drawing-surface').boundingBox();
  const s = await page.evaluate(({ x, y }) => globalThis.__neonBay.toScreen(x, y), p);
  return { x: box.x + s.x, y: box.y + s.y };
}
const alphaAt = (p) => page.evaluate(({ x, y }) => globalThis.__neonBay.paintAlphaAt(x, y), p);
const regionAt = (p) => page.evaluate(({ x, y }) => globalThis.__neonBay.regionAt(x, y), p);

async function mouseStroke(artPoints, steps = 8) {
  const pts = [];
  for (const p of artPoints) pts.push(await toPage(p));
  await page.mouse.move(pts[0].x, pts[0].y);
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) {
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      await page.mouse.move(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t);
    }
  }
  await page.mouse.up();
  await page.waitForTimeout(250);
}

const touch = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// ── Studio, fresh state ────────────────────────────────────────────────────
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 180000 });
await page.evaluate(() => localStorage.clear());
await openStudio();

const door = await interior('door', 24);
const doorLeft = await interior('door', 24, 'left');
const fender = await interior('side-scoop', 10);
const hood = await interior('hood', 8);
const roof = await interior('roof', 8);
const quarter = await interior('rear-fender', 20);
const trunk = await interior('engine-cover', 8);

// 1. Cross from the door into the side scoop and back into the door.
const reentry = { x: doorLeft.x, y: doorLeft.y + 10 };
await mouseStroke([door, fender, { x: fender.x, y: fender.y + 20 }, reentry]);
const fenderSamples = [];
for (let t = 0.15; t < 1; t += 0.1) {
  const p = lerp(fender, { x: fender.x, y: fender.y + 20 }, t);
  if ((await regionAt(p)) === 'side-scoop') fenderSamples.push(await alphaAt(p));
}
fenderSamples.push(await alphaAt(fender));
check('stroke locks to the starting region (door painted)', (await alphaAt(door)) > 0, `door alpha ${await alphaAt(door)}`);
check('re-entering the locked region paints again', (await alphaAt(reentry)) > 0, `re-entry alpha ${await alphaAt(reentry)}`);
check('crossing into the side scoop never paints it', fenderSamples.every((a) => a === 0), `fender alphas ${fenderSamples.join(',')}`);
await page.screenshot({ path: `${SHOTS}/01-cross-reenter.png` });

// 2. Starting outside the car does not paint, even when dragging over it.
const wall = { x: roof.x, y: roof.y - 90 };
await mouseStroke([wall, roof, { x: roof.x + 60, y: roof.y + 2 }]);
check('a stroke starting on the wall paints nothing', (await alphaAt(roof)) === 0, `roof alpha ${await alphaAt(roof)}`);
check('re-entry point lies inside the door', (await regionAt(reentry)) === 'door');

// 2b. Thick scribbles that start in one part and sweep across its neighbours.
/** Up to `n` points well inside a part (every probe within r units agrees). */
const samples = (id, n = 12, r = 4) =>
  page.evaluate(
    ({ id, n, r }) => {
      const nb = globalThis.__neonBay;
      const b = nb.regions.find((x) => x.id === id).bounds;
      const out = [];
      let s = 12345;
      for (let k = 0; k < 4000 && out.length < n; k++) {
        s = (s * 1103515245 + 12345) % 2147483648;
        const x = b.x + (s / 2147483648) * b.width;
        s = (s * 1103515245 + 12345) % 2147483648;
        const y = b.y + (s / 2147483648) * b.height;
        const ok = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => nb.regionAt(x + dx, y + dy) === id);
        if (ok) out.push({ x, y });
      }
      return out;
    },
    { id, n, r },
  );
const bounds = (id) => page.evaluate((id) => globalThis.__neonBay.regions.find((x) => x.id === id).bounds, id);
async function scribbleFrom(id, pad) {
  const start = (await samples(id, 1, 6))[0];
  const b = await bounds(id);
  const pts = [start];
  const rows = Math.max(4, Math.round((b.height + pad * 2) / 16));
  for (let i = 0; i <= rows; i++) {
    const y = b.y - pad + ((b.height + pad * 2) * i) / rows;
    pts.push({ x: i % 2 ? b.x + b.width + pad : b.x - pad, y });
  }
  await mouseStroke(pts, 5);
}
async function paintedSamples(id) {
  const pts = await samples(id);
  let painted = 0;
  for (const p of pts) if ((await alphaAt(p)) > 0) painted++;
  return { painted, of: pts.length };
}
await page.getByLabel('Thick').click();
for (const [id, neighbours] of [
  ['front-tire', ['front-wheel', 'front-arch', 'front-arch-top', 'front-body']],
  ['rear-wheel', ['rear-tire', 'rear-fender', 'rear-skirt']],
  ['hood', ['windshield', 'windshield-frame', 'front-body', 'left-headlight', 'left-mirror']],
  ['door', ['upper-door', 'lower-door', 'side-scoop', 'side-skirt', 'front-arch']],
  // The wing sits at the top-right corner of the stage: nothing may cover it.
  ['rear-wing', ['engine-cover', 'rear-pillar', 'rear-fender']],
]) {
  await scribbleFrom(id, 40);
  const own = await paintedSamples(id);
  check(`scribble starting in ${id} paints it`, own.painted > 0, `${own.painted}/${own.of} samples`);
  for (const n of neighbours) {
    const s = await paintedSamples(n);
    check(`  …and leaves ${n} untouched`, s.of > 0 && s.painted === 0, `${s.painted}/${s.of} samples painted`);
  }
}
await page.screenshot({ path: `${SHOTS}/01b-edge-scribbles.png` });
await page.getByLabel('Medium').click();

// 3. A second finger landing mid-stroke ends the stroke, with no connecting line.
{
  const h0 = await toPage(hood);
  const h1 = await toPage({ x: hood.x + 60, y: hood.y + 6 });
  const farArt = { x: quarter.x, y: quarter.y };
  const far = await toPage(farArt);
  await touch('touchStart', [{ x: h0.x, y: h0.y, id: 1 }]);
  for (let k = 1; k <= 6; k++) await touch('touchMove', [{ ...lerp(h0, h1, k / 6), id: 1 }]);
  await page.waitForTimeout(450);
  await touch('touchStart', [{ ...h1, id: 1 }, { x: far.x, y: far.y, id: 2 }]);
  for (let k = 1; k <= 5; k++) await touch('touchMove', [{ x: h1.x + k * 6, y: h1.y, id: 1 }, { x: far.x + k * 8, y: far.y, id: 2 }]);
  await touch('touchEnd', []);
  await page.waitForTimeout(300);
  check('first finger painted the hood', (await alphaAt(hood)) > 0);
  check('second finger did not paint', (await alphaAt(farArt)) === 0, `rear fender alpha ${await alphaAt(farArt)}`);
}

// 4. Pinch to zoom, then paint while zoomed: mapping must stay exact.
{
  const box = await page.getByTestId('drawing-surface').boundingBox();
  const c = { x: box.x + box.width * 0.45, y: box.y + box.height * 0.55 };
  const strokesBefore = await page.evaluate(() => globalThis.__neonBay.strokeCount());
  await touch('touchStart', [{ x: c.x - 40, y: c.y, id: 11 }, { x: c.x + 40, y: c.y, id: 12 }]);
  for (let k = 1; k <= 10; k++) await touch('touchMove', [{ x: c.x - 40 - k * 9, y: c.y, id: 11 }, { x: c.x + 40 + k * 9, y: c.y, id: 12 }]);
  await touch('touchEnd', []);
  await page.waitForTimeout(300);
  const zoom = await page.evaluate(() => globalThis.__neonBay.zoom());
  check('two-finger pinch zooms in', zoom > 1.6, `zoom ${zoom.toFixed(2)}`);
  const strokesAfter = await page.evaluate(() => globalThis.__neonBay.strokeCount());
  check('pinching adds no stroke', strokesAfter === strokesBefore, `strokes ${strokesBefore} → ${strokesAfter}`);
  const target = await interior('door', 10);
  const visible = { x: target.x + 30, y: target.y + 15 };
  await mouseStroke([visible, { x: visible.x + 25, y: visible.y }], 4);
  check('painting while zoomed lands on the touched artwork point', (await alphaAt(visible)) > 0);
  await page.screenshot({ path: `${SHOTS}/02-zoomed.png` });
  await page.getByLabel('Show the whole car').click();
  await page.waitForTimeout(200);
  const z2 = await page.evaluate(() => globalThis.__neonBay.zoom());
  check('fit button resets the zoom', Math.abs(z2 - 1) < 0.01, `zoom ${z2.toFixed(2)}`);
}

// 5. Rotate to portrait and paint: masks remain aligned.
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
{
  const p = { x: trunk.x, y: trunk.y };
  await mouseStroke([p, { x: p.x + 40, y: p.y + 1 }], 4);
  check('after rotation, a stroke on the engine cover paints it', (await alphaAt(p)) > 0);
  check('after rotation, the roof is still untouched', (await alphaAt(roof)) === 0);
  await page.screenshot({ path: `${SHOTS}/03-portrait.png` });
}

// 6. Undo / redo.
{
  const p = { x: trunk.x, y: trunk.y };
  await page.getByLabel('Undo').click();
  await page.waitForTimeout(250);
  check('undo removes the last stroke', (await alphaAt(p)) === 0);
  await page.getByLabel('Redo').click();
  await page.waitForTimeout(250);
  check('redo restores it', (await alphaAt(p)) > 0);
}

// 7. Eraser obeys boundaries: erase the door starting inside it and sweeping over the scoop.
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(600);
{
  await page.getByLabel('Crayon', { exact: true }).click();
  const fenderPainted = { x: fender.x, y: fender.y };
  await mouseStroke([fenderPainted, { x: fenderPainted.x + 30, y: fenderPainted.y }], 4);
  const before = await alphaAt(fenderPainted);
  await page.getByLabel('Thick').click();
  await page.getByLabel('Eraser').click();
  await mouseStroke([door, fender, { x: fender.x + 30, y: fender.y }, door], 10);
  const after = await alphaAt(fenderPainted);
  check('eraser clears inside its region', (await alphaAt(door)) === 0, `door alpha ${await alphaAt(door)}`);
  check('eraser leaves the neighbouring panel untouched', before > 0 && after === before, `fender ${before} → ${after}`);
  await page.getByLabel('Crayon', { exact: true }).click();
}

// 8. Progress survives a reload.
await page.waitForTimeout(1200); // autosave debounce
const histBefore = await page.evaluate(() => globalThis.__neonBay.history());
await openStudio();
const histAfter = await page.evaluate(() => globalThis.__neonBay.history());
check('paint is restored after reload', (await alphaAt(hood)) > 0 && (await alphaAt(reentry)) > 0);
check('undo history is restored after reload', histAfter.canUndo === histBefore.canUndo && histAfter.hasPaint, JSON.stringify(histAfter));
await page.screenshot({ path: `${SHOTS}/04-restored.png` });

// 9. Effects toggle: animation runs when on and freezes when off.
async function stageFramesDiffer(p = page) {
  const box = await p.getByTestId('drawing-surface').boundingBox();
  const clip = { x: box.x, y: box.y, width: box.width * 0.6, height: box.height * 0.6 };
  const a = await p.screenshot({ clip });
  await p.waitForTimeout(700);
  const b = await p.screenshot({ clip });
  return !a.equals(b);
}
check('ambient effects animate when enabled', await stageFramesDiffer());
await page.getByLabel('Turn garage lights effects off').click();
await page.waitForTimeout(400);
check('turning effects off freezes the scene', !(await stageFramesDiffer()));
await page.getByLabel('Turn garage lights effects on').click();

// 10. Garage offers to continue the saved drawing.
await page.getByLabel('Back to the garage').click();
await page.waitForTimeout(1500);
check('garage offers to keep painting', (await page.getByLabel('Keep painting the Apex GT').count()) === 1);
await page.screenshot({ path: `${SHOTS}/05-garage-continue.png` });
await page.getByLabel('Keep painting the Apex GT').click();
await page.waitForFunction(() => !!globalThis.__neonBay, null, { timeout: 60000 });
await page.waitForTimeout(800);

// 11. Done → finished artwork with celebration, then back to painting.
await page.getByLabel('Done').click();
await page.waitForTimeout(3500);
check('finished screen shows the artwork', (await page.locator('canvas').count()) >= 1 && page.url().includes('/finished/'));
await page.screenshot({ path: `${SHOTS}/06-finished.png` });
await page.getByLabel('Paint', { exact: true }).click();
await page.waitForFunction(() => !!globalThis.__neonBay, null, { timeout: 60000 });
await page.waitForTimeout(800);

// 12. Wash (reset) with confirmation.
await page.getByLabel('Wash the car', { exact: true }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/07-wash-dialog.png` });
await page.getByLabel('Keep my paint').click();
await page.waitForTimeout(200);
check('choosing "Keep" leaves the paint', (await alphaAt(hood)) > 0);
await page.getByLabel('Wash the car', { exact: true }).click();
await page.getByLabel('Wash the car clean').click();
await page.waitForTimeout(300);
const washed = await page.evaluate(() => globalThis.__neonBay.history());
check('washing removes all paint', (await alphaAt(hood)) === 0 && !washed.hasPaint, JSON.stringify(washed));

check('no uncaught errors in the page', errors.length === 0, errors.slice(0, 3).join(' | '));

// 13. Reduced motion (system setting): the scene is still, even with effects on.
{
  const ctx2 = await browser.newContext({ viewport: { width: 844, height: 390 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/studio/apex-gt`, { waitUntil: 'networkidle', timeout: 180000 });
  await p2.waitForFunction(() => !!globalThis.__neonBay, null, { timeout: 60000 });
  await p2.waitForTimeout(1000);
  check('reduced motion keeps the scene still', !(await stageFramesDiffer(p2)));
  await ctx2.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
