/**
 * Browser checks of All cars, My Creations and the move of older saves into
 * My Creations. Requires `npx expo start --web --port 8081` (or `npm run web`).
 *   node e2e/web-creations.e2e.mjs [baseUrl] [screenshotDir]
 */
import { mkdirSync } from 'fs';
import { garageKit, indexOf, isFree, launchBrowser, reporter, shotDiff, studioKit, testStore, trackErrors, VEHICLES, waitForEntitled } from './lib.mjs';

const BASE = process.argv[2] ?? 'http://localhost:8081';
const SHOTS = process.argv[3] ?? '.scratch/e2e-creations';
mkdirSync(SHOTS, { recursive: true });
const N = VEHICLES.length;

const { check, finish } = reporter();
const browser = await launchBrowser();

async function fresh(viewport = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage();
  const errors = trackErrors(page);
  let dialogs = 0;
  page.on('dialog', async (d) => {
    dialogs++;
    await d.dismiss();
  });
  const G = garageKit(page, BASE, { check });
  const S = studioKit(page);
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 240000 });
  await page.evaluate(() => localStorage.clear());
  await G.openGarage();
  return { ctx, page, errors, G, S, dialogs: () => dialogs };
}
const index = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('neon-bay/creations/index.json') ?? '{"creations":[]}'));
const cards = (page) => page.locator('[data-testid^="creation-"]');

// ── A. All cars ─────────────────────────────────────────────────────────────
{
  const { ctx, page, errors, G, dialogs } = await fresh();
  await page.getByLabel(/^All cars\. Car 1 of 27$/).click();
  await page.waitForURL(/\/vehicles$/);
  const labels = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="vehicle-"]')].map((b) => b.getAttribute('aria-label') ?? ''));
  const names = labels.map((l) => l.replace(/, (locked|selected)(, selected)?$/, ''));
  check(`All cars lists all ${N} vehicles, in garage order`, JSON.stringify(names) === JSON.stringify(VEHICLES.map((v) => v[1])), names.slice(0, 5).join(', '));
  check('the three free vehicles come first and are not locked', labels.slice(0, 3).every((l) => !l.includes('locked')) && labels.slice(3).every((l) => l.includes('locked')));
  check('the current vehicle is marked selected', labels[0].endsWith('selected'));
  await page.screenshot({ path: `${SHOTS}/01-all-cars.png` });
  for (const [label, count] of [['Free, 3', 3], ['Bikes, 2', 2], ['All, 27', N]]) {
    await page.getByRole('tab', { name: label }).click();
    await page.waitForTimeout(300);
    const n = await page.evaluate(() => document.querySelectorAll('[data-testid^="vehicle-"]').length);
    check(`filter ${label.split(',')[0]} shows ${count}`, n === count, `${n}`);
  }
  // A locked vehicle: shown in the garage, locked, never a purchase screen.
  await page.getByRole('tab', { name: 'Bikes, 2' }).click();
  await page.getByLabel('Comet Superbike, locked').click();
  await page.waitForFunction(() => !!globalThis.__neonBayGarage && !location.pathname.includes('vehicles'), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const comet = indexOf('comet-superbike');
  check('choosing a locked vehicle shows it in the garage', (await G.garage()).sel === comet);
  await G.expectShown(comet, 'locked vehicle from All cars', { button: 'locked' });
  const purchase = (await page.getByTestId('gate-prompt').count()) + (await page.getByTestId('premium-price').count()) + (await page.getByText(/subscribe|per month/i).count());
  check('…with no purchase screen, price or dialog', purchase === 0 && dialogs() === 0 && !page.url().includes('parents'));
  // Back to the free vehicles from anywhere in the collection.
  await page.getByLabel(/^All cars\. /).click();
  await page.getByRole('tab', { name: 'Free, 3' }).click();
  await page.getByLabel(/^Storm Sedan/).click();
  await page.waitForFunction(() => !!globalThis.__neonBayGarage && !location.pathname.includes('vehicles'), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  check('the Free filter leads back to a free vehicle, ready to paint', (await G.garage()).sel === 2);
  await G.expectShown(2, 'free vehicle from All cars', { button: 'start' });
  check('All cars: no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

// ── A2. Choosing in All cars shows that vehicle's picture, not the previous one ──
// (Regression: the name and counter changed but the old car stayed on screen.)
{
  const { ctx, page, errors, G, S } = await fresh();
  const ref = {};
  const ids = ['apex-gt', 'blaze-gt', 'storm-sedan', 'zenith-gt', 'volt-sedan', 'comet-superbike', 'arrow-superbike', 'turbo-wagon', 'pulse-hatch'];
  for (const id of ids) {
    await G.goTo(indexOf(id));
    await page.waitForTimeout(400);
    ref[id] = await G.carsOnly();
  }
  const nameOf = (id) => VEHICLES[indexOf(id)][1];
  const redraws = () => page.evaluate(() => globalThis.__neonBayGarage.redraws());
  async function pick(id) {
    await page.getByLabel(/^All cars\. /).click();
    await page.waitForURL(/\/vehicles$/);
    await page.getByLabel(new RegExp(`^${nameOf(id)}(,|$)`)).click();
    await page.waitForFunction(() => !location.pathname.includes('vehicles') && !!globalThis.__neonBayGarage, null, { timeout: 30000 });
  }
  async function expectPicture(id, label) {
    await page.waitForTimeout(500);
    const i = indexOf(id);
    const d = shotDiff(await G.carsOnly(), ref[id]);
    check(`${label}: the picture is the ${nameOf(id)}`, d < 0.004, `${(d * 100).toFixed(2)}% of pixels differ`);
    await G.expectShown(i, label, { button: isFree(id) ? ['start', 'keep'] : 'locked' });
  }
  for (const [from, to] of [
    ['volt-sedan', 'zenith-gt'],
    ['volt-sedan', 'storm-sedan'],
    ['apex-gt', 'arrow-superbike'],
    ['arrow-superbike', 'apex-gt'],
    ['pulse-hatch', 'comet-superbike'],
    ['storm-sedan', 'blaze-gt'],
    ['zenith-gt', 'volt-sedan'],
  ]) {
    await G.goTo(indexOf(from));
    await page.waitForTimeout(300);
    const before = await redraws();
    await pick(to);
    await expectPicture(to, `All cars, ${nameOf(from)} → ${nameOf(to)}`);
    check(`All cars, ${nameOf(from)} → ${nameOf(to)}: the garage redrew its canvases on return`, (await redraws()) > before);
  }
  // Several picks in a row, as fast as the screens allow.
  for (const id of ['turbo-wagon', 'apex-gt', 'comet-superbike', 'storm-sedan']) await pick(id);
  await expectPicture('storm-sedan', 'four quick picks in a row');
  // Mixed with arrows and swipes.
  await pick('zenith-gt');
  await page.getByLabel('Next car').click();
  await G.settle(indexOf('zenith-gt') + 1, Date.now());
  await page.waitForTimeout(400);
  await G.swipe(320);
  await G.settle(indexOf('zenith-gt'), Date.now());
  await expectPicture('zenith-gt', 'All cars, then an arrow, then a swipe back');
  await pick('volt-sedan');
  await G.swipe(-320);
  await G.settle(indexOf('volt-sedan') + 1, Date.now());
  await G.swipe(320);
  await G.settle(indexOf('volt-sedan'), Date.now());
  await expectPicture('volt-sedan', 'All cars, then swipes both ways');
  // Paint opens the vehicle that is shown.
  for (const id of ['storm-sedan', 'blaze-gt']) {
    await pick(id);
    await expectPicture(id, `before painting the ${nameOf(id)}`);
    await page.getByLabel(new RegExp(`^(Start|Keep) painting the ${nameOf(id)}$`)).click();
    await S.waitForStudio(id);
    check(`All cars → ${nameOf(id)} → Paint opens the ${nameOf(id)}`, (await S.nb(() => globalThis.__neonBay.vehicleId)) === id);
    await G.backToGarage();
    await expectPicture(id, `back from painting the ${nameOf(id)}`);
  }
  check('All cars selection: no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

// ── B. My Creations: several pictures of one vehicle ────────────────────────
{
  const { ctx, page, errors, G, S } = await fresh();
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  check('My Creations starts empty, with a way to choose a car', (await page.getByText('No pictures yet').count()) === 1 && (await page.getByLabel('Choose a car').count()) === 1);
  await page.screenshot({ path: `${SHOTS}/02-empty.png` });
  await page.getByLabel('Choose a car').click();
  await page.waitForURL(/\/vehicles$/);
  await page.getByLabel(/^Blaze GT/).click();
  await page.waitForFunction(() => !!globalThis.__neonBayGarage && !location.pathname.includes('vehicles'), null, { timeout: 30000 });
  await page.waitForTimeout(600);

  // First picture: red on the largest body part.
  await page.getByLabel('Start painting the Blaze GT').click();
  await S.waitForStudio('blaze-gt');
  const [big, second] = await S.bodyParts();
  const red = await S.samples(big.id, 3, 10);
  const blue = await S.samples(second.id, 3, 8);
  await page.getByLabel('Thick').click();
  await S.mouseStroke(red);
  await page.waitForTimeout(1200);
  await G.backToGarage();
  check('a painted picture is listed', (await index(page)).creations.length === 1);
  check('the garage now offers to keep painting', (await G.action())?.kind === 'keep');

  // Make another: a separate, blank picture; the first one is kept.
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  await page.getByLabel('Make another Blaze GT picture').click();
  await S.waitForStudio('blaze-gt');
  check('Make another opens a blank picture', (await S.nb(() => globalThis.__neonBay.strokeCount())) === 0 && (await S.alphaAt(red[0])) === 0);
  await page.getByLabel('Royal blue').click();
  await S.mouseStroke(blue);
  await page.waitForTimeout(1200);
  await G.backToGarage();
  const idx = await index(page);
  check('two pictures of the same vehicle, each with its own id', idx.creations.length === 2 && idx.creations[0].id !== idx.creations[1].id && idx.creations.every((c) => c.vehicleId === 'blaze-gt'));
  check('the studio button returns to the garage, on the vehicle just painted', !page.url().includes('creations') && (await G.garage()).sel === 1);

  // Keep painting opens the most recently edited picture.
  await page.getByLabel('Keep painting the Blaze GT').click();
  await S.waitForStudio('blaze-gt');
  check('Keep painting opens the latest picture', (await S.alphaAt(blue[0])) > 0 && (await S.alphaAt(red[0])) === 0);
  await G.backToGarage();

  // The gallery: the child's own pictures, newest first; each opens itself.
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  await page.waitForTimeout(1500);
  check('My Creations shows both pictures', (await cards(page).count()) === 2);
  const order = await cards(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
  const byTime = [...idx.creations].sort((a, b) => b.updatedAt - a.updatedAt).map((c) => `creation-${c.id}`);
  check('newest first', JSON.stringify(order) === JSON.stringify(byTime), order.join(', '));
  const pictures = await page.locator('[data-testid^="creation-"] img').evaluateAll((imgs) => imgs.filter((i) => i.src.startsWith('data:image/png')).length);
  check('each card shows its own saved picture', pictures === 2, `${pictures} pictures`);
  await page.screenshot({ path: `${SHOTS}/03-two-pictures.png` });
  await page.getByLabel(/^Keep painting your Blaze GT picture/).last().click();
  await S.waitForStudio('blaze-gt');
  check('the older picture opens with its own paint only', (await S.alphaAt(red[0])) > 0 && (await S.alphaAt(blue[0])) === 0);
  await G.backToGarage();

  // Deleting needs a confirmation; keeping is the default choice.
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  await page.getByLabel('Delete this Blaze GT picture').first().click();
  await page.getByText('Delete this picture?').waitFor();
  await page.screenshot({ path: `${SHOTS}/04-confirm-delete.png` });
  await page.getByLabel('Keep it').click();
  await page.waitForTimeout(400);
  check('"Keep it" keeps the picture', (await cards(page).count()) === 2 && (await index(page)).creations.length === 2);
  await page.getByLabel('Delete this Blaze GT picture').first().click();
  await page.getByLabel('Delete the picture').click();
  await page.waitForTimeout(600);
  check('confirmed deletion removes just that picture', (await cards(page).count()) === 1 && (await index(page)).creations.length === 1);

  // Leaving the app (backgrounding) saves at once, without waiting for the pause.
  await page.getByLabel('Back to the garage').last().click();
  await page.waitForTimeout(500);
  await page.getByLabel('Keep painting the Blaze GT').click();
  await S.waitForStudio('blaze-gt');
  const extra = (await S.samples(big.id, 12, 6)).filter(Boolean);
  const before = (await index(page)).creations[0].updatedAt;
  await S.mouseStroke(extra.slice(4, 6));
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  check('going to the background saves straight away', (await index(page)).creations[0].updatedAt > before);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // Restart: the remaining picture and its paint come back.
  await G.openGarage();
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  await page.waitForTimeout(1000);
  check('after a restart the picture is still in My Creations', (await cards(page).count()) === 1);
  check('My Creations: no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

// ── C. Older saves move into My Creations ───────────────────────────────────
{
  // Paint with the app, then rewrite the result as the previous app versions stored it.
  const { ctx, page, G, S } = await fresh();
  const strokes = {};
  for (const [i, id] of [[0, 'apex-gt'], [1, 'blaze-gt']]) {
    await G.goTo(i);
    await page.getByLabel(`Start painting the ${VEHICLES[i][1]}`).click();
    await S.waitForStudio(id);
    const [big] = await S.bodyParts();
    strokes[id] = await S.samples(big.id, 3, 10);
    await S.mouseStroke(strokes[id]);
    await page.waitForTimeout(1200);
    await G.backToGarage();
  }
  const seeded = await page.evaluate(() => {
    const P = 'neon-bay/';
    const idx = JSON.parse(localStorage.getItem(`${P}creations/index.json`));
    for (const c of idx.creations) {
      const state = localStorage.getItem(`${P}creations/${c.id}/state.json`);
      const thumb = localStorage.getItem(`${P}creations/${c.id}/thumb.png`);
      // The Apex GT as the first version kept it (no version folder or field); the Blaze GT in its v1 folder.
      const dir = c.vehicleId === 'apex-gt' ? `${P}drawings/apex-gt/` : `${P}drawings/${c.vehicleId}/v1/`;
      const json = c.vehicleId === 'apex-gt' ? JSON.stringify({ ...JSON.parse(state), assetVersion: undefined }) : state;
      localStorage.setItem(`${dir}state.json`, json);
      if (thumb) localStorage.setItem(`${dir}thumb.png`, thumb);
    }
    for (const k of Object.keys(localStorage)) if (k.startsWith(`${P}creations/`)) localStorage.removeItem(k);
    return idx.creations.length;
  });
  check('two older saves prepared (no My Creations yet)', seeded === 2 && (await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('creations/')).length)) === 0);
  await G.openGarage(); // restart: the migration runs
  const idx = await index(page);
  check('older saves became creations', JSON.stringify(idx.creations.map((c) => c.id).sort()) === JSON.stringify(['m-apex-gt-v1', 'm-blaze-gt-v1']));
  check('the original files are kept', await page.evaluate(() => !!localStorage.getItem('neon-bay/drawings/apex-gt/v1/state.json') && !!localStorage.getItem('neon-bay/drawings/blaze-gt/v1/state.json')));
  for (const [i, id] of [[0, 'apex-gt'], [1, 'blaze-gt']]) {
    await G.goTo(i);
    check(`${VEHICLES[i][1]}: the garage offers to keep painting the moved picture`, (await G.action())?.kind === 'keep');
    await page.getByLabel(`Keep painting the ${VEHICLES[i][1]}`).click();
    await S.waitForStudio(id);
    check(`${VEHICLES[i][1]}: its paint is there`, (await S.alphaAt(strokes[id][0])) > 0);
    await G.backToGarage();
  }
  await G.openGarage(); // and again: nothing doubles
  check('running again adds nothing', (await index(page)).creations.length === 2);
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  await page.waitForTimeout(2500);
  const pics = await page.locator('[data-testid^="creation-"] img').evaluateAll((imgs) => imgs.filter((i) => i.src.startsWith('data:image/png')).length);
  check('moved pictures get their gallery pictures', pics === 2, `${pics}`);
  await page.screenshot({ path: `${SHOTS}/05-migrated.png` });
  await ctx.close();
}

// ── D. When premium ends, pictures stay ─────────────────────────────────────
{
  const { ctx, page, G, S, dialogs } = await fresh();
  await testStore(page, (s) => {
    s.nextPurchase = 'success';
    return s.purchase();
  });
  await waitForEntitled(page, true);
  const ember = indexOf('ember-gt');
  await G.goTo(ember);
  await page.getByLabel('Start painting the Ember GT').click();
  await S.waitForStudio('ember-gt');
  const [big] = await S.bodyParts();
  const pts = await S.samples(big.id, 2, 10);
  await S.mouseStroke(pts);
  await page.waitForTimeout(1200);
  await G.backToGarage();
  await testStore(page, (s) => s.refund());
  await waitForEntitled(page, false);
  await page.getByLabel('My Creations').click();
  await page.waitForURL(/\/creations$/);
  await page.waitForTimeout(1000);
  check('after premium ends, the premium picture is still in My Creations', (await cards(page).count()) === 1);
  await page.getByLabel('Make another Ember GT picture').click();
  await page.waitForTimeout(400);
  check('Make another on a locked vehicle asks for a grown-up, no purchase screen', (await page.getByText('Ask a grown-up to unlock this one in the parent area.').count()) === 1 && page.url().endsWith('/creations') && dialogs() === 0);
  await page.getByLabel(/^Look at your Ember GT picture/).click();
  await S.waitForStudio('ember-gt');
  check('it opens to look at, with its paint', (await page.getByTestId('view-only').count()) === 1 && (await S.alphaAt(pts[0])) > 0);
  await ctx.close();
}

await browser.close();
finish();
