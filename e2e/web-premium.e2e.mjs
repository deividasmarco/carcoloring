/**
 * Browser end-to-end checks of premium access: the parental gate, the parent
 * area, every purchase outcome, restore, offline behaviour, expiry (also in
 * the middle of a stroke) and refunds, and that saved artwork survives all of
 * them. Requires `npx expo start --web --port 8081` (or `npm run web`). Then:
 *   node e2e/web-premium.e2e.mjs [baseUrl] [screenshotDir]
 *
 * Purchases here go through the development test store (web development
 * builds only). It exercises the app's own handling of each outcome; it does
 * not and cannot verify App Store / Google Play billing or RevenueCat, which
 * need a development build with store sandbox accounts.
 */
import { mkdirSync } from 'fs';
import {
  controlsOk,
  gateAnswer,
  gatePrompt,
  garageKit,
  indexOf,
  launchBrowser,
  passGate,
  premiumState,
  reporter,
  studioKit,
  testStore,
  trackErrors,
  typeGateAnswer,
  VEHICLES,
  waitForEntitled,
} from './lib.mjs';

const BASE = process.argv[2] ?? 'http://localhost:8081';
const SHOTS = process.argv[3] ?? '.scratch/e2e-premium';
mkdirSync(SHOTS, { recursive: true });

const { check, finish } = reporter();
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true });
const page = await context.newPage();
const errors = trackErrors(page);
const G = garageKit(page, BASE, { check });
const S = studioKit(page);
const { openGarage, backToGarage, goTo, action } = G;
const EMBER = indexOf('ember-gt');
const ZENITH = indexOf('zenith-gt');
const DRAGON = indexOf('dragon-gt');
const PREMIUM = VEHICLES.length - 3;

const text = (testId) => page.getByTestId(testId).textContent();
const bodyText = () => page.evaluate(() => document.body.innerText);
const continueKey = () => page.getByRole('button', { name: 'Continue', exact: true });
async function openParents() {
  await page.getByLabel('Parent area (for grown-ups)').click();
  await page.getByTestId('gate-prompt').waitFor({ timeout: 30000 });
}
async function leaveParents() {
  await page.getByLabel('Back to the garage').click();
  await page.waitForFunction(() => !!globalThis.__neonBayGarage, null, { timeout: 60000 });
  await page.waitForTimeout(600);
}
/** Taps Subscribe and returns the outcome message (waits for it to replace any earlier one). */
async function subscribeTap() {
  const old = (await page.getByTestId('premium-message').count()) ? await text('premium-message') : null;
  await page.getByLabel(/^Subscribe for .+ per month$/).click();
  await page.waitForFunction(
    (o) => {
      const el = document.querySelector('[data-testid="premium-message"]');
      return !!el && el.textContent !== o;
    },
    old,
    { timeout: 15000 },
  );
  return text('premium-message');
}
const actionOf = async (i) => {
  await goTo(i);
  return (await action())?.kind;
};

// ── Fresh install ───────────────────────────────────────────────────────────
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 240000 });
await page.evaluate(() => localStorage.clear());
await openGarage();
check('fresh install: premium inactive', (await premiumState(page))?.entitled === false);

// ── P1. The parent area is behind the gate, from every entrance ─────────────
await openParents();
{
  const prompt = await gatePrompt(page);
  check('the Parents button opens the parental gate, not the parent area', page.url().endsWith('/parents') && (await page.getByTestId('premium-status').count()) === 0);
  check('the gate asks a multiplication written only in words', gateAnswer(prompt) !== null && !/\d/.test(prompt), prompt);
  const leaks = (await page.getByText(/subscribe|restore purchases|per month|privacy policy|terms of use/i).count()) + (await page.getByTestId('premium-price').count());
  check('nothing to buy, restore or open is reachable before the gate', leaks === 0, `${leaks} elements`);
  await page.screenshot({ path: `${SHOTS}/01-gate.png` });
  await controlsOk(page, 'gate 844×390', check);
  await page.getByLabel('Back to the garage').click();
  await page.waitForFunction(() => !!globalThis.__neonBayGarage, null, { timeout: 60000 });
  check('the gate has an obvious way back to the garage', !page.url().includes('/parents'));
}
await page.goto(`${BASE}/parents`, { waitUntil: 'networkidle', timeout: 240000 });
await page.getByTestId('gate-prompt').waitFor({ timeout: 60000 });
check('a direct link to the parent area shows the gate', (await page.getByTestId('premium-status').count()) === 0);
await openGarage();

// ── P2. Wrong answers: a new question each time, then a pause that survives reopening ──
await openParents();
{
  const p1 = await gatePrompt(page);
  await typeGateAnswer(page, gateAnswer(p1) + 1);
  await page.waitForTimeout(200);
  const p2 = await gatePrompt(page);
  check('a wrong answer asks a new question and stays closed', p2 !== p1 && (await page.getByText('That’s not right. Here’s a new question.').count()) === 1 && (await page.getByTestId('premium-status').count()) === 0);
  await typeGateAnswer(page, gateAnswer(p2) + 1);
  await page.waitForTimeout(200);
  await typeGateAnswer(page, gateAnswer(await gatePrompt(page)) + 1);
  await page.waitForTimeout(200);
  check('three wrong answers pause the gate', (await continueKey().isDisabled()) && (await page.getByText('Please wait a little, then try a new question.').count()) === 1);
  await page.screenshot({ path: `${SHOTS}/02-gate-paused.png` });
  // Closing and reopening does not skip the pause.
  await page.getByLabel('Back to the garage').click();
  await page.waitForFunction(() => !!globalThis.__neonBayGarage, null, { timeout: 60000 });
  await openParents();
  check('reopening the gate does not skip the pause', await continueKey().isDisabled());
  await page.getByRole('button', { name: '7', exact: true }).click({ force: true });
  check('the keypad ignores taps while paused', (await page.getByLabel('Answer: empty').count()) === 1);
  const t0 = Date.now();
  while ((await continueKey().isDisabled()) && Date.now() - t0 < 40000) await page.waitForTimeout(500);
  check('the pause ends by itself (about 30 s)', !(await continueKey().isDisabled()), `${((Date.now() - t0) / 1000).toFixed(0)} s after reopening`);
}

// ── P3. The parent area ─────────────────────────────────────────────────────
await passGate(page);
{
  check('the right answer opens the parent area', page.url().endsWith('/parents'));
  check('status: premium not active', (await text('premium-status')).includes('Premium garage is not active'));
  await page.getByTestId('premium-price').waitFor({ timeout: 15000 });
  const price = (await text('premium-price')).replace(/\s*per month\s*$/, '').trim();
  check('the price comes from the store, localised (test store: EUR 2.99)', /2[.,]99/.test(price) && price.includes('€'), price);
  check('Subscribe names the price and period', (await page.getByLabel(`Subscribe for ${price} per month`).count()) === 1);
  const body = await bodyText();
  check('test-store builds say so plainly', body.includes('Test store (development build only). No real payment is made.'));
  check(`explains what premium unlocks (${PREMIUM - 2} cars and 2 superbikes)`, body.includes(`Unlocks ${PREMIUM - 2} premium cars and 2 superbikes`));
  const missing = VEHICLES.slice(3).filter(([, n]) => !body.includes(n)).map(([, n]) => n);
  check('shows every premium vehicle', missing.length === 0 && (await page.getByLabel(`${PREMIUM} premium vehicles`).count()) === 1, missing.join(', '));
  check('explains renewal and cancellation', /renews automatically every month/.test(body) && /cancel at any time/.test(body) && /cancelled at least 24 hours before the end of the current period/.test(body));
  check('says nothing is deleted when premium ends', body.includes('If premium ends, nothing is deleted'));
  check('no promise of monthly new vehicles', !/(new|more) (cars|vehicles|bikes)[^.]*(every|each) month|monthly (drops|additions|updates)|added every month/i.test(body));
  check('no ads, tracking or accounts', body.includes('no ads, no tracking and no accounts'));
  check('Restore purchases is offered', (await page.getByRole('button', { name: 'Restore purchases' }).count()) === 1);
  const legal = (await page.getByRole('link', { name: 'Privacy policy' }).count()) + (await page.getByRole('link', { name: 'Terms of use' }).count());
  const legalMissing = body.includes('Privacy policy link not configured') || body.includes('Terms of use link not configured');
  check('privacy policy and terms: links, or a visible "not configured" warning', legal === 2 || legalMissing, legal === 2 ? 'both links' : 'NOT CONFIGURED: set extra.legal in app.json before release');
  await page.screenshot({ path: `${SHOTS}/03-parents.png`, fullPage: true });
}
// Leaving closes the gate again.
await leaveParents();
await openParents();
check('after leaving, the parent area needs the gate again', (await page.getByTestId('premium-status').count()) === 0);
await passGate(page);

// ── P4. Purchase outcomes ───────────────────────────────────────────────────
await page.getByTestId('premium-price').waitFor({ timeout: 15000 });
await testStore(page, (s) => (s.nextPurchase = 'cancel'));
check('cancelled purchase: says nothing was charged', (await subscribeTap()) === 'The purchase was cancelled. Nothing was charged.');
check('cancelled purchase: premium stays inactive', (await premiumState(page)).entitled === false && (await text('premium-status')).includes('not active'));
await testStore(page, (s) => (s.nextPurchase = 'network-error'));
check('failed purchase: a clear message', (await subscribeTap()).includes('could not be reached'));
await testStore(page, (s) => (s.nextPurchase = 'pending'));
check('pending purchase (Ask to Buy): waiting for approval', (await subscribeTap()).includes('waiting for approval'));
check('pending purchase: status shows it, premium stays locked', (await text('premium-status')).includes('Waiting for approval') && (await premiumState(page)).entitled === false);
await page.screenshot({ path: `${SHOTS}/04-pending.png` });
await leaveParents();
check('while pending, premium vehicles stay locked', (await actionOf(EMBER)) === 'locked');
await testStore(page, (s) => s.approvePending());
await waitForEntitled(page, true);
await page.waitForTimeout(400);
check('approval unlocks premium vehicles straight away, no restart', (await action())?.kind === 'start');
await G.expectShown(EMBER, 'after approval', { button: 'start' });
await openParents();
await passGate(page);
check('parent area: premium active, with its renewal date', /Premium garage is active[\s\S]*Renews automatically on/.test(await text('premium-status')));
check('parent area: no Subscribe while active; Manage subscription offered', (await page.getByLabel(/^Subscribe for/).count()) === 0 && (await page.getByRole('button', { name: 'Manage subscription' }).count()) === 1);
await page.getByRole('button', { name: 'Manage subscription' }).click();
await page.waitForTimeout(300);
check('Manage subscription runs without an error', (await page.getByTestId('premium-message').count()) === 0);
await page.screenshot({ path: `${SHOTS}/05-active.png`, fullPage: true });
await leaveParents();

// ── P5. Paint two premium vehicles ──────────────────────────────────────────
const marks = {};
for (const i of [EMBER, ZENITH]) {
  const [id, name] = VEHICLES[i];
  await goTo(i);
  await page.getByLabel(`Start painting the ${name}`).click();
  await S.waitForStudio(id);
  const [big] = await S.bodyParts();
  const pts = await S.samples(big.id, 2, 10);
  await page.getByLabel('Thick').click();
  await S.mouseStroke(pts);
  marks[id] = pts;
  check(`${name}: paints while premium is active`, (await S.alphaAt(pts[0])) > 0);
  await page.waitForTimeout(1200);
  await backToGarage();
}

// ── P6. Offline ─────────────────────────────────────────────────────────────
await testStore(page, (s) => (s.offline = true));
await openGarage();
check('offline restart: the subscriber keeps premium (the SDK\'s device cache)', (await premiumState(page))?.entitled === true && (await actionOf(EMBER)) === 'keep');
await goTo(0);
await page.getByLabel('Start painting the Apex GT').click();
await S.waitForStudio('apex-gt');
check('offline: free vehicles open as always', page.url().includes('/studio/apex-gt'));
await backToGarage();
await testStore(page, (s) => s.forgetCache());
await page.evaluate(() => globalThis.__neonBayPremium.refresh());
{
  const st = await premiumState(page);
  check('a refresh that fails does not eject the subscriber (status marked stale)', st.entitled === true && st.stale === true, JSON.stringify(st));
  check('…and premium vehicles stay paintable', (await actionOf(EMBER)) === 'keep');
}
await testStore(page, (s) => (s.offline = false));
await page.evaluate(() => globalThis.__neonBayPremium.refresh());
check('back online: status is fresh again', (await premiumState(page)).stale === false);
// A first launch with no connection and no cache: free vehicles still work; nothing premium unlocks.
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('neon-bay/dev-test-store.json', JSON.stringify({ subscribed: true, expiresAt: Date.now() + 864e5, willRenew: true, pending: false, offline: true, cache: null }));
  });
  const p = await ctx.newPage();
  const G2 = garageKit(p, BASE, { check });
  await G2.openGarage(p);
  const st = await p.evaluate(() => globalThis.__neonBayPremium.state());
  check('offline first launch: no answer from the store, so premium stays locked', st.entitled === false && st.stale === true, JSON.stringify(st));
  check('offline first launch: the free vehicles are paintable', (await G2.action(p))?.kind === 'start');
  await G2.goTo(EMBER, p);
  check('offline first launch: premium vehicles show as locked, calmly', (await G2.action(p))?.kind === 'locked');
  await ctx.close();
}

// ── P7. The period ends while the app is open ───────────────────────────────
await testStore(page, (s) => s.expireIn(2500));
await page.waitForTimeout(500);
check('before the period ends, premium is still active', (await premiumState(page)).entitled === true);
await page.waitForFunction(() => globalThis.__neonBayPremium.state().entitled === false, null, { timeout: 20000 });
check('when the period ends, the app notices by itself (refresh at expiry)', true);
check('expired: painted premium vehicles can still be looked at', (await actionOf(EMBER)) === 'look');
await G.expectShown(EMBER, 'expired, with saved paint', { button: 'look' });
check('expired: unpainted premium vehicles are locked', (await actionOf(DRAGON)) === 'locked');
check('expired: free vehicles are unaffected', (await actionOf(0)) === 'start');
await page.screenshot({ path: `${SHOTS}/06-expired-garage.png` });
{
  await goTo(EMBER);
  await page.getByLabel('Look at your painting of the Ember GT').click();
  await S.waitForStudio('ember-gt');
  check('expired: the saved picture opens to look at, intact', (await page.getByTestId('view-only').count()) === 1 && (await S.alphaAt(marks['ember-gt'][0])) > 0);
  const before = await S.nb(() => globalThis.__neonBay.strokeCount());
  const [, second] = await S.bodyParts();
  const q = await S.samples(second.id, 2, 8);
  await S.mouseStroke(q);
  check('expired: new strokes are not painted', (await S.alphaAt(q[0])) === 0 && (await S.nb(() => globalThis.__neonBay.strokeCount())) === before);
  check('expired: undo and wash are disabled', (await page.getByLabel('Undo').isDisabled()) && (await page.getByLabel('Wash the car', { exact: true }).isDisabled()));
  await page.screenshot({ path: `${SHOTS}/07-view-only.png` });
  await backToGarage();
}
await page.goto(`${BASE}/studio/zenith-gt`, { waitUntil: 'networkidle', timeout: 240000 });
await S.waitForStudio('zenith-gt');
check('expired: a direct link to a painted premium vehicle opens it to look at only', (await page.getByTestId('view-only').count()) === 1 && (await S.alphaAt(marks['zenith-gt'][0])) > 0);
await page.goto(`${BASE}/studio/dragon-gt`, { waitUntil: 'networkidle', timeout: 240000 });
await page.waitForFunction(() => !!globalThis.__neonBayGarage, null, { timeout: 60000 });
check('expired: a direct link to an unpainted premium vehicle returns to the garage', !(await page.evaluate(() => !!globalThis.__neonBay)));
await openGarage();

// ── P8. Restore ─────────────────────────────────────────────────────────────
await openParents();
await passGate(page);
await page.getByRole('button', { name: 'Restore purchases' }).click();
await page.getByTestId('premium-message').waitFor({ timeout: 15000 });
check('restore with nothing active says so', (await text('premium-message')) === 'No active subscription was found for this Test store account.');
// Bought on another device: the store knows, this app does not yet.
await testStore(page, (s) => {
  s.state = { ...s.state, subscribed: true, expiresAt: Date.now() + 30 * 864e5, willRenew: true, pending: false };
  s.save();
});
check('a purchase made elsewhere is not picked up silently by this test', (await premiumState(page)).entitled === false);
await page.getByRole('button', { name: 'Restore purchases' }).click();
await page.waitForFunction(() => document.body.innerText.includes('Purchases restored.'), null, { timeout: 15000 });
check('restore picks up an active subscription', (await premiumState(page)).entitled === true && (await text('premium-message')).startsWith('Purchases restored.'));
await leaveParents();

// ── P9. The subscription ends in the middle of a stroke ─────────────────────
await goTo(EMBER);
await page.getByLabel('Keep painting the Ember GT').click();
await S.waitForStudio('ember-gt');
{
  check('active again: the saved picture opens for painting', (await page.getByTestId('view-only').count()) === 0 && (await S.alphaAt(marks['ember-gt'][0])) > 0);
  const [, second] = await S.bodyParts();
  const pts = (await S.samples(second.id, 8, 8)).sort((a, b) => a.x - b.x);
  const before = await S.nb(() => globalThis.__neonBay.strokeCount());
  const at = [];
  for (const p of pts) at.push(await S.toPage(p));
  await page.mouse.move(at[0].x, at[0].y);
  await page.mouse.down();
  for (let i = 1; i < 4; i++) await page.mouse.move(at[i].x, at[i].y, { steps: 4 });
  await testStore(page, (s) => s.expireIn(0)); // premium ends now, finger still down
  await page.waitForFunction(() => globalThis.__neonBayPremium.state().entitled === false, null, { timeout: 10000 });
  await page.waitForTimeout(300);
  const bannerMid = await page.getByTestId('view-only').count();
  for (let i = 4; i < at.length; i++) await page.mouse.move(at[i].x, at[i].y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await S.nb(() => globalThis.__neonBay.strokeCount());
  const tail = pts.slice(5);
  let tailPainted = 0;
  for (const p of tail) if ((await S.alphaAt(p)) > 0) tailPainted++;
  check('the stroke in progress is finished, not cut off', after === before + 1 && tailPainted === tail.length, `strokes ${before}→${after}, ${tailPainted}/${tail.length} points painted after expiry`);
  check('the screen switches to look-only once premium ends', bannerMid === 1 && (await page.getByTestId('view-only').count()) === 1);
  const free = [];
  for (const p of await S.samples((await S.bodyParts())[0].id, 12, 8)) if ((await S.alphaAt(p)) === 0) free.push(p);
  if (free.length >= 2) {
    await S.mouseStroke(free.slice(0, 2));
    check('after that, a new stroke is not painted', (await S.alphaAt(free[0])) === 0 && (await S.nb(() => globalThis.__neonBay.strokeCount())) === after);
  }
  await page.screenshot({ path: `${SHOTS}/08-expired-mid-stroke.png` });
  await page.waitForTimeout(1500); // autosave
  await backToGarage();
  check('after expiry mid-stroke the garage offers to look at it', (await action())?.kind === 'look');
  // Restart: the stroke finished after expiry was saved.
  await openGarage();
  await goTo(EMBER);
  await page.getByLabel('Look at your painting of the Ember GT').click();
  await S.waitForStudio('ember-gt');
  let kept = 0;
  for (const p of tail) if ((await S.alphaAt(p)) > 0) kept++;
  check('after a restart, the stroke finished after expiry is still there', kept === tail.length && (await S.alphaAt(marks['ember-gt'][0])) > 0, `${kept}/${tail.length}`);
  await backToGarage();
}

// ── P10. Subscribe in the parent area, then a refund while painting ─────────
await openParents();
await passGate(page);
await page.getByTestId('premium-price').waitFor({ timeout: 15000 });
await testStore(page, (s) => (s.nextPurchase = 'success'));
check('successful purchase: thanks, and premium is active', (await subscribeTap()).startsWith('Thank you!') && (await premiumState(page)).entitled === true);
await leaveParents();
await goTo(EMBER);
await page.getByLabel('Keep painting the Ember GT').click();
await S.waitForStudio('ember-gt');
{
  const [big] = await S.bodyParts();
  const fresh = [];
  for (const p of await S.samples(big.id, 12, 8)) if ((await S.alphaAt(p)) === 0) fresh.push(p);
  await S.mouseStroke(fresh.slice(0, 2));
  check('subscribed again: painting continues on the same picture', (await S.alphaAt(fresh[0])) > 0 && (await S.alphaAt(marks['ember-gt'][0])) > 0);
  await page.waitForTimeout(1200);
  await testStore(page, (s) => s.refund());
  await page.getByTestId('view-only').waitFor({ timeout: 10000 });
  check('a refund or revocation locks premium at once (look only)', (await premiumState(page)).entitled === false);
  check('…and keeps every stroke', (await S.alphaAt(fresh[0])) > 0 && (await S.alphaAt(marks['ember-gt'][0])) > 0);
  await backToGarage();
}
await openGarage();
check('after a refund and a restart, painted premium vehicles can be looked at', (await actionOf(EMBER)) === 'look' && (await actionOf(ZENITH)) === 'look');
check('after a refund and a restart, free vehicles are unaffected', (await actionOf(0)) === 'start' && (await actionOf(1)) === 'start');

// ── P11. Sizes: gate and parent area ────────────────────────────────────────
for (const [w, h, n] of [
  [844, 390, 'phone landscape'],
  [390, 844, 'phone portrait'],
  [568, 320, 'small phone landscape'],
  [320, 568, 'small phone portrait'],
  [1024, 768, 'tablet landscape'],
]) {
  await page.setViewportSize({ width: w, height: h });
  await goTo(0);
  await openParents();
  await page.waitForTimeout(500);
  await controlsOk(page, `gate ${n} ${w}×${h}`, check);
  await page.screenshot({ path: `${SHOTS}/09-gate-${w}x${h}.png` });
  await passGate(page);
  await page.waitForTimeout(500);
  await controlsOk(page, `parent area ${n} ${w}×${h}`, check, { scrolls: true });
  const close = await page.getByLabel('Back to the garage').boundingBox();
  check(`parent area ${n} ${w}×${h}: the close button is on screen`, close && close.y >= 0 && close.y + close.height <= h);
  await page.screenshot({ path: `${SHOTS}/10-parents-${w}x${h}.png` });
  await leaveParents();
}

check('no uncaught errors in the page', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
finish();
