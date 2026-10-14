/**
 * Browser end-to-end checks of the garage: the 27-vehicle lineup (three free
 * vehicles first, the rest locked until premium is active), the carousel,
 * every vehicle's own artwork, parts and saves. Requires
 * `npx expo start --web --port 8081` (or `npm run web`). Then:
 *   node e2e/web-garage.e2e.mjs [baseUrl] [screenshotDir]
 *
 * Real mouse drags and clicks; results are read from the development-only
 * probes and from screenshot pixels (see lib.mjs). Premium is switched on and
 * off with the development test store (web development builds only); the
 * purchase screens themselves are checked in web-premium.e2e.mjs.
 */
import { mkdirSync } from 'fs';
import {
  controlBoxes,
  controlsOk,
  emptyGaps,
  garageKit,
  isFree,
  launchBrowser,
  overlap,
  pad2,
  premiumState,
  reporter,
  shotDiff,
  studioKit,
  testStore,
  textBoxes,
  trackErrors,
  vehiclePixelsUnder,
  VEHICLES,
  waitForEntitled,
} from './lib.mjs';

const BASE = process.argv[2] ?? 'http://localhost:8081';
const SHOTS = process.argv[3] ?? '.scratch/e2e-garage';
mkdirSync(SHOTS, { recursive: true });
const N = VEHICLES.length;

const { check, finish } = reporter();
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true });
const page = await context.newPage();
const errors = trackErrors(page);
let dialogs = 0;
page.on('dialog', async (d) => {
  dialogs++;
  await d.dismiss();
});
const G = garageKit(page, BASE, { check });
const S = studioKit(page);
const { garage, openGarage, backToGarage, settle, swipe, goTo, action, expectShown, carsOnly } = G;
/** Expected action at rest without premium and without saved paint. */
const lockedOrStart = (i) => (isFree(VEHICLES[i][0]) ? 'start' : 'locked');

// ── A. A fresh install: the lineup and who is free ──────────────────────────
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 240000 });
await page.evaluate(() => localStorage.clear());
await openGarage();
{
  const ids = await page.evaluate(() => globalThis.__neonBayGarage.vehicleIds);
  check(`${N} vehicles in the garage, in order`, JSON.stringify(ids) === JSON.stringify(VEHICLES.map((v) => v[0])), ids.join(','));
  const st = await premiumState(page);
  check('premium starts inactive (development test store, nothing bought)', st?.clientKind === 'dev-test-store' && st.phase === 'ready' && !st.entitled, JSON.stringify(st));
  check('garage starts on the Apex GT, free to paint', (await garage()).sel === 0 && (await action())?.kind === 'start');
}

// ── A1. Carousel mechanics ──────────────────────────────────────────────────
{
  const box = await page.getByTestId('garage-carousel').boundingBox();
  const y = box.y + box.height * 0.45;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, y, { steps: 4 });
  await page.waitForTimeout(100);
  const mid = (await garage()).pos;
  check('finger tracking moves the carousel immediately', mid > 0.05 && mid < 0.9, `position ${mid.toFixed(3)} while dragging`);
  await page.screenshot({ path: `${SHOTS}/01-dragging.png` });
  await page.mouse.move(box.x + box.width * 0.3, y, { steps: 6 });
  const t0 = Date.now();
  await page.mouse.up();
  const ms = await settle(1, t0);
  check('release snaps to the next vehicle with a spring', (await garage()).sel === 1 && Number.isFinite(ms), `settled in ${ms} ms (headless software renderer)`);
  const a = await action();
  check('name and action follow the selection', a?.name === 'Blaze GT' && a.kind === 'start');
}
{
  const t0 = await swipe(-420);
  let max = 0;
  for (let i = 0; i < 40; i++) {
    max = Math.max(max, (await garage()).pos);
    await page.waitForTimeout(10);
  }
  await settle(2, t0);
  check('spring does not visibly overshoot', max < 2.06, `peak position ${max.toFixed(3)} for target 2`);
}
{
  for (let i = 0; i < 3; i++) await swipe(-300, { steps: 3 });
  await settle(5, Date.now());
  const { sel } = await garage();
  check('fast swipes move one vehicle per swipe, no skips', sel === 5, `selected ${sel}`);
  const a = await action();
  check('labels are not stale after fast swipes', a?.name === VEHICLES[5][1] && a.kind === 'locked', JSON.stringify(a));
  await page.screenshot({ path: `${SHOTS}/02-after-fast-swipes.png` });
}
{
  await goTo(N - 1);
  await swipe(-400);
  await page.waitForTimeout(700);
  check('cannot swipe past the last vehicle', (await garage()).sel === N - 1);
  check('next button is disabled at the end', await page.getByLabel('Next car').isDisabled());
  await goTo(0);
  check('previous button is disabled at the start', await page.getByLabel('Previous car').isDisabled());
}
{
  const btn = await page.getByLabel('Start painting the Apex GT').boundingBox();
  await page.mouse.move(btn.x + btn.width / 2 + 200, btn.y + btn.height / 2);
  await page.mouse.down();
  await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  check('a swipe released over the button does not open a vehicle', !page.url().includes('/studio/'));
  await goTo(0);
}

// ── A2. Exactly one vehicle at rest, in both directions ─────────────────────
const restShots = [];
{
  await expectShown(0, 'at start', { button: 'start' });
  restShots[0] = await carsOnly();
  for (let i = 1; i < N; i++) {
    await page.getByLabel('Next car').click();
    await settle(i, Date.now());
    await page.waitForTimeout(500); // the snap's settle callback unmounts far vehicles
    await expectShown(i, `next arrow → ${pad2(i + 1)}`, { button: lockedOrStart(i) });
    restShots[i] = await carsOnly();
    await page.screenshot({ path: `${SHOTS}/rest-fwd-${pad2(i + 1)}-${VEHICLES[i][0]}.png` });
  }
  const same = restShots.map((s, i) => (i === 0 ? 1 : shotDiff(s, restShots[i - 1]))).map((d, i) => [i, d]).filter(([, d]) => d <= 0.02);
  check('every vehicle looks different from its neighbour at rest (the shots are meaningful)', same.length === 0, same.map(([i, d]) => `${VEHICLES[i][0]} ${(d * 100).toFixed(2)}%`).join(', '));
  for (let i = N - 2; i >= 0; i--) {
    await swipe(320);
    await settle(i, Date.now());
    await page.waitForTimeout(500);
    await expectShown(i, `swipe back → ${pad2(i + 1)}`, { button: lockedOrStart(i) });
    const d = shotDiff(await carsOnly(), restShots[i]);
    check(`swipe back → ${pad2(i + 1)}: the picture is the ${VEHICLES[i][1]} alone, as when arriving forwards`, d < 0.004, `${(d * 100).toFixed(2)}% of pixels differ`);
  }
  // Mid-swipe: outgoing and incoming vehicles sit side by side, never on top of each other.
  for (const frac of [0.25, 0.5, 0.75]) {
    const box = await page.getByTestId('garage-carousel').boundingBox();
    const y = box.y + box.height * 0.3; // above the side arrows
    const x0 = box.x + box.width * 0.95;
    await page.mouse.move(x0, y);
    await page.mouse.down();
    await page.mouse.move(x0 - 12 - frac * (box.width + 56), y, { steps: 10 });
    await page.waitForTimeout(150);
    const { pos } = await garage();
    const { slideW } = await page.evaluate(() => globalThis.__neonBayGarage.stage());
    const shot = await carsOnly(page, -4);
    const xc = box.width + 16 + 12 - pos * slideW;
    // Early in a swipe the incoming vehicle may not be on screen yet: the empty run then reaches the edge.
    const gap = emptyGaps(shot, { edges: true }).find((g) => g.x1 - g.x0 >= 12 && g.x0 <= xc && xc <= g.x1);
    check(`mid-swipe at ${pos.toFixed(2)}: an empty gap separates the outgoing and incoming vehicles`, !!gap, gap ? `columns ${gap.x0}–${gap.x1}` : `no empty columns around x=${xc.toFixed(0)}`);
    if (frac === 0.5) await page.screenshot({ path: `${SHOTS}/mid-swipe.png` });
    await page.mouse.move(x0, y, { steps: 4 });
    await page.mouse.up();
    await settle(0, Date.now());
  }
  await page.waitForTimeout(500);
  await expectShown(0, 'after letting go mid-swipe', { button: 'start' });
  // Rapid scrolling: quick taps add up, rapid swipes neither skip nor lose vehicles, labels keep up.
  for (let k = 0; k < 4; k++) await page.getByLabel('Next car').click({ delay: 5 });
  await settle(4, Date.now());
  await page.waitForTimeout(500);
  await expectShown(4, 'four quick arrow taps', { button: 'locked' });
  for (let k = 0; k < 12; k++) await page.getByLabel('Next car').click({ delay: 5 });
  await settle(16, Date.now());
  await page.waitForTimeout(500);
  await expectShown(16, 'twelve more quick arrow taps', { button: 'locked' });
  /** Eight back swipes in quick succession; the position after each one (for diagnosis). */
  const rapidBack = async () => {
    const trail = [];
    for (let k = 0; k < 8; k++) {
      await swipe(320, { steps: 3 });
      await page.waitForTimeout(30);
      trail.push((await garage()).pos.toFixed(2));
    }
    return trail.join(' ');
  };
  let trail = await rapidBack();
  await settle(8, Date.now());
  await page.waitForTimeout(500);
  if (!(await expectShown(8, 'eight rapid swipes back', { button: 'locked' }))) console.log(`  positions after each swipe: ${trail}`);
  trail = await rapidBack();
  await settle(0, Date.now());
  await page.waitForTimeout(500);
  if (!(await expectShown(0, 'eight more rapid swipes back', { button: 'start' }))) console.log(`  positions after each swipe: ${trail}`);
}

// ── L. Locked vehicles: visible, calm, never a purchase sheet ───────────────
{
  await goTo(3);
  await expectShown(3, 'first premium vehicle', { button: 'locked' });
  const url = page.url();
  for (let k = 0; k < 3; k++) await page.getByLabel(/^The Ember GT is locked/).click();
  await page.waitForTimeout(400);
  const hint = page.getByText('Ask a grown-up to unlock it in the parent area.');
  check('tapping a locked vehicle shows a short "ask a grown-up" line', (await hint.count()) === 1 && (await hint.isVisible()));
  const hb = await hint.boundingBox();
  const vp = page.viewportSize();
  check('…fully on screen', !!hb && hb.x >= 0 && hb.y >= 0 && hb.x + hb.width <= vp.width && hb.y + hb.height <= vp.height, hb ? `${hb.x.toFixed(0)},${hb.y.toFixed(0)} ${hb.width.toFixed(0)}×${hb.height.toFixed(0)}` : 'none');
  const sheet = (await page.getByTestId('gate-prompt').count()) + (await page.getByTestId('premium-price').count()) + (await page.getByText(/subscribe|per month|€|\$/i).count());
  check('…and never a purchase sheet, price, parent gate or dialog', page.url() === url && sheet === 0 && dialogs === 0, `url ${page.url()}, purchase elements ${sheet}, dialogs ${dialogs}`);
  await page.screenshot({ path: `${SHOTS}/03-locked-hint.png` });
  await page.waitForTimeout(4800);
  check('the line goes away by itself', (await hint.count()) === 0);
  // The studio enforces access too: a link to a locked vehicle without paint goes back to the garage.
  await page.goto(`${BASE}/studio/ember-gt`, { waitUntil: 'networkidle', timeout: 240000 });
  await page.waitForFunction(() => !!globalThis.__neonBayGarage, null, { timeout: 60000 });
  await page.waitForTimeout(800);
  const studioOpened = await page.evaluate(() => !!globalThis.__neonBay);
  check('a direct link to a locked vehicle\'s studio returns to the garage', !studioOpened && !page.url().includes('/studio/'), page.url());
  // Free vehicles open without premium.
  for (let i = 0; i < 3; i++) {
    const [id, name] = VEHICLES[i];
    await goTo(i);
    await page.getByLabel(`Start painting the ${name}`).click();
    await S.waitForStudio(id);
    check(`free ${name} opens without premium`, page.url().includes(`/studio/${id}`) && (await page.getByTestId('view-only').count()) === 0);
    await backToGarage();
    await expectShown(i, `${name}: back from the studio`, { button: 'start' });
  }
}

// ── Premium on (as if bought in the parent area; see web-premium.e2e.mjs) ───
await testStore(page, (s) => {
  s.nextPurchase = 'success';
  return s.purchase();
});
await waitForEntitled(page, true);
await goTo(3);
await expectShown(3, 'premium active: the first premium vehicle', { button: 'start' });

// Every vehicle opens its own studio, and returning shows it again.
for (let i = 0; i < N; i++) {
  const [id, name] = VEHICLES[i];
  await goTo(i);
  await page.getByLabel(`Start painting the ${name}`).click();
  await page.waitForFunction(() => !!globalThis.__neonBay?.vehicleId, null, { timeout: 60000 });
  const opened = await S.nb(() => globalThis.__neonBay.vehicleId);
  check(`${name}: START PAINTING opens the ${name}`, opened === id && page.url().includes(`/studio/${id}`), `opened ${opened}`);
  await backToGarage();
  await expectShown(i, `${name}: back from the studio`, { button: 'start' });
}
await goTo(0);

// ── B. Every vehicle except the Apex GT: paint, cross a boundary, undo/redo ──
for (let i = 1; i < N; i++) {
  const [id, name] = VEHICLES[i];
  await goTo(i);
  await page.getByLabel(`Start painting the ${name}`).click();
  await S.waitForStudio(id);
  const [big, next] = await S.bodyParts();
  const start = (await S.samples(big.id, 1, 10))[0];
  const into = (await S.samples(next.id, 1, 10))[0];
  await page.getByLabel('Thick').click();
  await S.mouseStroke([start, into, { x: into.x + 30, y: into.y + 10 }, start]);
  const own = await S.paintedCount(big.id);
  const other = await S.paintedCount(next.id);
  check(`${name}: stroke paints the part it started in (${big.id})`, own.n > 0, `${own.n}/${own.of}`);
  check(`${name}: dragging across into ${next.id} never paints it`, other.n === 0, `${other.n}/${other.of}`);
  const t = (await S.samples('front-tire', 1, 3))[0];
  const w = (await S.samples('front-wheel', 1, 3))[0];
  await S.mouseStroke([t, w, { x: w.x + 15, y: w.y - 15 }]);
  check(`${name}: a stroke from the tyre across the wheel stays on the tyre`, (await S.alphaAt(t)) > 0 && (await S.paintedCount('front-wheel')).n === 0);
  await page.getByLabel('Undo').click();
  await page.waitForTimeout(250);
  check(`${name}: undo removes the tyre stroke`, (await S.alphaAt(t)) === 0);
  await page.getByLabel('Redo').click();
  await page.waitForTimeout(250);
  check(`${name}: redo restores it`, (await S.alphaAt(t)) > 0);
  // The whole vehicle is on screen, clear of every control.
  const vr = await S.vehicleRect();
  const surface = await page.getByTestId('drawing-surface').boundingBox();
  const hits = (await controlBoxes(page)).filter((b) => overlap({ x: vr.x, y: vr.y, w: vr.w, h: vr.h }, b)).map((b) => b.name);
  const inside = vr.x >= surface.x - 1 && vr.y >= surface.y - 1 && vr.x + vr.w <= surface.x + surface.width + 1 && vr.y + vr.h <= surface.y + surface.height + 1;
  check(`${name}: fits the studio, clear of the controls (844×390)`, inside && hits.length === 0, `${vr.w.toFixed(0)}×${vr.h.toFixed(0)} at ${vr.x.toFixed(0)},${vr.y.toFixed(0)}${hits.length ? `; overlaps ${hits.join(', ')}` : ''}`);
  if (i === 1 || id.endsWith('superbike')) await page.screenshot({ path: `${SHOTS}/04-${id}-studio.png` });
  await page.waitForTimeout(900); // autosave debounce
  await backToGarage();
  check(`${name}: garage keeps the selection after returning`, (await garage()).sel === i);
  check(`${name}: action now reads KEEP PAINTING`, (await action())?.kind === 'keep');
}
await page.screenshot({ path: `${SHOTS}/05-garage-painted.png` });
await goTo(0);
check('the unpainted Apex GT still offers START PAINTING', (await action())?.kind === 'start');

// ── C. Restart: selection, premium and every vehicle's progress survive ─────
await goTo(4);
await page.waitForTimeout(400);
await openGarage();
check('after a restart the last selected vehicle is shown', (await garage()).sel === 4, `selected ${(await garage()).sel}`);
check('after a restart premium is still active (from the store, not an app flag)', (await premiumState(page))?.entitled === true);
await expectShown(4, 'after a restart', { button: 'keep' });
{
  const lost = [];
  for (let i = 1; i < N; i++) {
    await goTo(i);
    if ((await action())?.kind !== 'keep') lost.push(VEHICLES[i][0]);
  }
  check(`after a restart all ${N - 1} painted vehicles read KEEP PAINTING`, lost.length === 0, lost.join(', '));
}
await page.screenshot({ path: `${SHOTS}/06-after-restart.png` });

// ── D. Washing one vehicle leaves the others alone ──────────────────────────
await goTo(2);
await page.getByLabel('Keep painting the Storm Sedan').click();
await S.waitForStudio('storm-sedan');
check('reopening the Storm Sedan restores its paint', (await S.nb(() => globalThis.__neonBay.history())).hasPaint);
await page.getByLabel('Wash the car', { exact: true }).click();
await page.getByLabel('Wash the car clean').click();
await page.waitForTimeout(1200);
await backToGarage();
check('washed vehicle reads START PAINTING again', (await action())?.kind === 'start');
await goTo(3);
check('the next vehicle still has its paint', (await action())?.kind === 'keep');

// ── F. Sizes: controls ≥ 44 pt, nothing overlapping, every vehicle clear ────
await goTo(0);
await page.getByLabel(/^(Start|Keep) painting the Apex GT$/).click();
await S.waitForStudio('apex-gt');
const SIZES = [
  [844, 390, 'phone landscape'],
  [390, 844, 'phone portrait'],
  [667, 375, 'iPhone 8 landscape'],
  [568, 320, 'small phone landscape'],
  [320, 568, 'small phone portrait'],
  [1024, 768, 'tablet landscape'],
  [768, 1024, 'tablet portrait'],
];
for (const [w, h, n] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(900);
  await controlsOk(page, `studio ${n} ${w}×${h}`, check);
  await page.screenshot({ path: `${SHOTS}/07-studio-${w}x${h}.png` });
}
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(500);
await backToGarage();
for (const [w, h, n] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(900);
  await controlsOk(page, `garage ${n} ${w}×${h}`, check);
  // Each vehicle at rest: wholly on screen, a comfortable size, and none of
  // its drawing under a control or label (measured on the vehicles' own pixels).
  const problems = [];
  let smallest = 1;
  let seen = Infinity;
  for (let i = 0; i < N; i++) {
    await goTo(i);
    const r = await page.evaluate(() => globalThis.__neonBayGarage.carRect());
    const car = { name: 'vehicle', x: r.x, y: r.y, w: r.width, h: r.height };
    const fill = Math.max(car.w / w, car.h / h);
    smallest = Math.min(smallest, fill);
    const near = [...(await controlBoxes(page)), ...(await textBoxes(page))].filter((b) => overlap(car, b));
    const [own, ...under] = await vehiclePixelsUnder(page, [car, ...near]);
    seen = Math.min(seen, own.n); // the measurement sees the vehicle itself
    const hits = under.filter((u) => u.n > 0).map((u) => `${u.name} (${u.n} px)`);
    if (car.x < 0 || car.y < 0 || car.x + car.w > w || car.y + car.h > h) problems.push(`${VEHICLES[i][0]} off screen`);
    if (hits.length) problems.push(`${VEHICLES[i][0]} under ${hits.join('/')}`);
    if (fill < 0.4) problems.push(`${VEHICLES[i][0]} small (${(fill * 100).toFixed(0)}%)`);
  }
  check(`garage ${n} ${w}×${h}: every vehicle on screen, ≥ 40% of the screen, none of it under a control or label`, problems.length === 0 && seen > 1000, problems.length ? problems.slice(0, 6).join('; ') : `smallest fills ${(smallest * 100).toFixed(0)}%; ≥ ${seen} vehicle px seen`);
  await page.screenshot({ path: `${SHOTS}/08-garage-${w}x${h}.png` });
  await goTo(0);
}
// Every vehicle in the studio in portrait too (landscape was checked while painting).
await page.setViewportSize({ width: 390, height: 844 });
{
  const problems = [];
  for (let i = 0; i < N; i++) {
    const [id, name] = VEHICLES[i];
    await page.goto(`${BASE}/studio/${id}`, { waitUntil: 'networkidle', timeout: 240000 });
    await S.waitForStudio(id);
    const vr = await S.vehicleRect();
    const surface = await page.getByTestId('drawing-surface').boundingBox();
    const hits = (await controlBoxes(page)).filter((b) => overlap({ x: vr.x, y: vr.y, w: vr.w, h: vr.h }, b)).map((b) => b.name);
    const inside = vr.x >= surface.x - 1 && vr.y >= surface.y - 1 && vr.x + vr.w <= surface.x + surface.width + 1 && vr.y + vr.h <= surface.y + surface.height + 1;
    if (!inside || hits.length) problems.push(`${name}${hits.length ? ` under ${hits.join('/')}` : ' not inside the drawing area'}`);
    if (id.endsWith('superbike')) await page.screenshot({ path: `${SHOTS}/09-studio-portrait-${id}.png` });
  }
  check('studio portrait 390×844: every vehicle fits, clear of the controls', problems.length === 0, problems.join('; '));
}
await page.setViewportSize({ width: 844, height: 390 });

check('no uncaught errors in the page', errors.length === 0, errors.slice(0, 3).join(' | '));

// ── G. Reduced motion: vehicles swap in place, one at a time ────────────────
// (This is where cars once piled up: every mounted car shares one spot here.)
{
  const ctx2 = await browser.newContext({ viewport: { width: 844, height: 390 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  const G2 = garageKit(p2, BASE, { check });
  await p2.goto(BASE, { waitUntil: 'networkidle', timeout: 240000 });
  await p2.evaluate(() => localStorage.clear());
  await G2.openGarage(p2);
  const pos2 = () => p2.evaluate(() => globalThis.__neonBayGarage.position());
  await p2.getByLabel('Next car').click();
  const t0 = Date.now();
  for (;;) {
    if (Math.abs((await pos2()) - 1) < 0.002 || Date.now() - t0 > 3000) break;
    await p2.waitForTimeout(8);
  }
  check('reduced motion: short snap to the next vehicle', Date.now() - t0 < 1500, `${Date.now() - t0} ms`);
  await p2.waitForTimeout(400);
  const alone = async (i, label) => {
    await G2.expectShown(i, label, { p: p2, button: lockedOrStart(i) });
    const d = shotDiff(await G2.carsOnly(p2), restShots[i]);
    check(`${label}: the picture is the ${VEHICLES[i][1]} alone`, d < 0.004, `${(d * 100).toFixed(2)}% of pixels differ`);
  };
  await alone(1, 'reduced motion, next arrow → 02');
  for (let i = 2; i < N; i++) {
    await p2.getByLabel('Next car').click();
    await p2.waitForTimeout(600);
    await alone(i, `reduced motion, next arrow → ${pad2(i + 1)}`);
  }
  const box = await p2.getByTestId('garage-carousel').boundingBox();
  const y = box.y + box.height * 0.45;
  for (let i = N - 2; i >= 0; i--) {
    await p2.mouse.move(box.x + box.width * 0.3, y);
    await p2.mouse.down();
    await p2.mouse.move(box.x + box.width * 0.7, y, { steps: 6 });
    await p2.mouse.up();
    await p2.waitForTimeout(600);
    await alone(i, `reduced motion, swipe back → ${pad2(i + 1)}`);
  }
  // While dragging from the Apex GT towards the Blaze GT, every frame shows exactly one of them, whole.
  const frames = [];
  await p2.mouse.move(box.x + box.width * 0.9, y);
  await p2.mouse.down();
  for (let k = 1; k <= 8; k++) {
    await p2.mouse.move(box.x + box.width * (0.9 - 0.08 * k), y);
    await p2.waitForTimeout(60);
    const shot = await G2.carsOnly(p2);
    const pos = await pos2();
    frames.push(`${pos.toFixed(2)}:${(Math.min(shotDiff(shot, restShots[0]), shotDiff(shot, restShots[1])) * 100).toFixed(2)}%`);
  }
  await p2.screenshot({ path: `${SHOTS}/10-reduced-motion.png` });
  await p2.mouse.up();
  const worstPct = Math.max(...frames.map((f) => Number(f.split(':')[1].replace('%', ''))));
  check('reduced motion: while dragging, only one whole vehicle is ever drawn', worstPct < 0.4, frames.join(' '));
  await ctx2.close();
}

await browser.close();
finish();
