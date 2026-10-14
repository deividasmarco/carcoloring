/**
 * Shared helpers for the browser end-to-end checks (Expo web + React Native
 * Skia on CanvasKit). Results are read from the development-only probes
 * (window.__neonBay, __neonBayGarage, __neonBayPremium, __neonBayTestStore)
 * and from screenshot pixels decoded with CanvasKit.
 */
import { fileURLToPath } from 'url';
import CanvasKitInit from 'canvaskit-wasm';
import { chromium } from 'playwright';

export const CK = await CanvasKitInit({ locateFile: (f) => fileURLToPath(new URL(`../node_modules/canvaskit-wasm/bin/${f}`, import.meta.url)) });

/** The garage lineup, in display order: [permanent id, display name]. */
export const VEHICLES = [
  ['apex-gt', 'Apex GT'],
  ['blaze-gt', 'Blaze GT'],
  ['storm-sedan', 'Storm Sedan'],
  ['ember-gt', 'Ember GT'],
  ['zenith-gt', 'Zenith GT'],
  ['dragon-gt', 'Dragon GT'],
  ['circuit-coupe', 'Circuit Coupe'],
  ['orbit-gt', 'Orbit GT'],
  ['sprint-coupe', 'Sprint Coupe'],
  ['drift-coupe', 'Drift Coupe'],
  ['halo-coupe', 'Halo Coupe'],
  ['flux-coupe', 'Flux Coupe'],
  ['vector-coupe', 'Vector Coupe'],
  ['thunder-v8', 'Thunder V8'],
  ['rumble-v8', 'Rumble V8'],
  ['breeze-roadster', 'Breeze Roadster'],
  ['volt-sedan', 'Volt Sedan'],
  ['turbo-wagon', 'Turbo Wagon'],
  ['zip-hatch', 'Zip Hatch'],
  ['pulse-hatch', 'Pulse Hatch'],
  ['ridge-suv', 'Ridge SUV'],
  ['nova-suv', 'Nova SUV'],
  ['boulder-4x4', 'Boulder 4x4'],
  ['basecamp-4x4', 'Basecamp 4x4'],
  ['fortress-4x4', 'Fortress 4x4'],
  ['comet-superbike', 'Comet Superbike'],
  ['arrow-superbike', 'Arrow Superbike'],
];
export const FREE_IDS = ['apex-gt', 'blaze-gt', 'storm-sedan'];
export const isFree = (id) => FREE_IDS.includes(id);
export const pad2 = (n) => String(n).padStart(2, '0');
export const indexOf = (id) => VEHICLES.findIndex((v) => v[0] === id);

export function reporter() {
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
    return ok;
  };
  const finish = () => {
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    if (failed.length) for (const f of failed) console.log(`  failed: ${f.name}${f.detail ? `  (${f.detail})` : ''}`);
    process.exit(failed.length ? 1 : 0);
  };
  return { check, finish, results };
}

export const launchBrowser = () => chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

/** Collects uncaught page errors and console errors. */
export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    if (process.env.SHOW_ERRORS) console.log('PAGE ERROR', e.message.slice(0, 600), (e.stack ?? '').slice(0, 900));
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    errors.push(m.text());
    if (process.env.SHOW_ERRORS) console.log('CONSOLE ERROR', m.text().slice(0, 600));
  });
  return errors;
}

/** Decodes a PNG screenshot to RGBA. */
export function decode(buf) {
  const img = CK.MakeImageFromEncoded(buf);
  const w = img.width();
  const h = img.height();
  const px = img.readPixels(0, 0, { width: w, height: h, colorType: CK.ColorType.RGBA_8888, alphaType: CK.AlphaType.Unpremul, colorSpace: CK.ColorSpace.SRGB });
  img.delete();
  return { w, h, px, buf };
}

/** Fraction of pixels that differ visibly between two same-sized shots. */
export function shotDiff(a, b) {
  if (a.w !== b.w || a.h !== b.h) return 1;
  let n = 0;
  for (let i = 0; i < a.px.length; i += 4) {
    if (Math.abs(a.px[i] - b.px[i]) > 40 || Math.abs(a.px[i + 1] - b.px[i + 1]) > 40 || Math.abs(a.px[i + 2] - b.px[i + 2]) > 40) n++;
  }
  return n / (a.w * a.h);
}

/**
 * Columns containing anything but the plain backdrop; returns the runs of empty
 * columns between drawn ones (with `edges`, also runs reaching the left or right edge).
 */
export function emptyGaps(s, { edges = false } = {}) {
  const bgc = [s.px[0], s.px[1], s.px[2]];
  const drawn = [];
  for (let x = 0; x < s.w; x++) {
    let any = false;
    for (let y = 0; y < s.h && !any; y++) {
      const i = (y * s.w + x) * 4;
      if (Math.abs(s.px[i] - bgc[0]) > 12 || Math.abs(s.px[i + 1] - bgc[1]) > 12 || Math.abs(s.px[i + 2] - bgc[2]) > 12) any = true;
    }
    drawn.push(any);
  }
  const gaps = [];
  for (let x = 0; x < s.w; ) {
    if (drawn[x]) {
      x++;
      continue;
    }
    const x0 = x;
    while (x < s.w && !drawn[x]) x++;
    if (edges || (x0 > 0 && x < s.w)) gaps.push({ x0, x1: x });
  }
  return gaps;
}

// ── Parental gate ───────────────────────────────────────────────────────────
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
/** The answer to "What is seven times eight?" (null if the prompt has another form). */
export function gateAnswer(prompt) {
  const m = /^What is ([a-z]+) times ([a-z]+)\?$/.exec(prompt.trim());
  if (!m || !WORDS.includes(m[1]) || !WORDS.includes(m[2])) return null;
  return WORDS.indexOf(m[1]) * WORDS.indexOf(m[2]);
}
export const gatePrompt = (page) => page.getByTestId('gate-prompt').textContent();
/** Types an answer on the gate's keypad and presses Continue. */
export async function typeGateAnswer(page, answer) {
  for (const d of String(answer)) await page.getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
/** Answers the gate correctly; resolves once the parent area is showing. */
export async function passGate(page) {
  await page.getByTestId('gate-prompt').waitFor({ timeout: 60000 });
  await typeGateAnswer(page, gateAnswer(await gatePrompt(page)));
  await page.getByTestId('premium-status').waitFor({ timeout: 20000 });
}

// ── Probes ──────────────────────────────────────────────────────────────────
export const premiumState = (page) => page.evaluate(() => globalThis.__neonBayPremium?.state() ?? null);
/** Runs a scripted test-store event in the page, e.g. testStore(page, (s) => s.refund()). */
export const testStore = (page, fn, arg) => page.evaluate(([src, a]) => new Function('s', 'a', `return (${src})(s, a);`)(globalThis.__neonBayTestStore, a), [fn.toString(), arg]);
export async function waitForEntitled(page, entitled, timeout = 15000) {
  await page.waitForFunction((e) => globalThis.__neonBayPremium?.state().phase === 'ready' && globalThis.__neonBayPremium.state().entitled === e, entitled, { timeout });
}

// ── Garage ──────────────────────────────────────────────────────────────────
const BUTTONS = [
  [/^Start painting the (.+)$/, 'start'],
  [/^Keep painting the (.+)$/, 'keep'],
  [/^Look at your painting of the (.+)$/, 'look'],
  [/^The (.+) is locked\. A grown-up can unlock it in the parent area\.$/, 'locked'],
  [/^Checking the (.+)$/, 'checking'],
];
export function parseAction(label) {
  for (const [re, kind] of BUTTONS) {
    const m = re.exec(label ?? '');
    if (m) return { kind, name: m[1] };
  }
  return null;
}

export function garageKit(page, base, { check }) {
  const garage = (p = page) => p.evaluate(() => ({ pos: globalThis.__neonBayGarage.position(), sel: globalThis.__neonBayGarage.selected() }));
  async function openGarage(p = page, url = base) {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 240000 });
    await p.waitForFunction(() => !!globalThis.__neonBayGarage && globalThis.__neonBayPremium?.state().phase === 'ready', null, { timeout: 60000 });
    await p.waitForTimeout(1200);
  }
  async function backToGarage(p = page) {
    // Screens further down the stack keep their own (hidden) back buttons: use the top one.
    await p.getByLabel('Back to the garage').last().click();
    await p.waitForFunction(() => !!globalThis.__neonBayGarage, null, { timeout: 60000 });
    await p.waitForTimeout(600);
  }
  /** Waits until the carousel settles on `target`; returns elapsed ms. */
  async function settle(target, t0, p = page) {
    for (;;) {
      const { pos } = await garage(p);
      if (Math.abs(pos - target) < 0.002) return Date.now() - t0;
      if (Date.now() - t0 > 4000) return Infinity;
      await p.waitForTimeout(8);
    }
  }
  async function swipe(dx, { steps = 8, hold = 0, p = page } = {}) {
    const box = await p.getByTestId('garage-carousel').boundingBox();
    const y = box.y + box.height * 0.45;
    const x0 = box.x + box.width / 2 - dx / 2;
    await p.mouse.move(x0, y);
    await p.mouse.down();
    for (let k = 1; k <= steps; k++) await p.mouse.move(x0 + (dx * k) / steps, y);
    if (hold) await p.waitForTimeout(hold);
    await p.mouse.up();
    return Date.now();
  }
  /** Taps the arrows as often as needed (quick taps add up), then waits for the carousel to settle. */
  async function goTo(index, p = page) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { sel } = await garage(p);
      if (sel === index) break;
      for (let k = 0; k < Math.abs(index - sel); k++) await p.getByLabel(sel < index ? 'Next car' : 'Previous car').click();
      await settle(index, Date.now(), p);
      await p.waitForTimeout(150);
    }
    await settle(index, Date.now(), p);
    await p.waitForTimeout(250);
  }
  /** The selected vehicle's action button: { kind, name } (see BUTTONS). */
  const action = async (p = page) => {
    const labels = await p.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((el) => el.getAttribute('aria-label') ?? ''));
    return labels.map(parseAction).filter(Boolean)[0] ?? null;
  };
  /**
   * What the garage shows in words: the readable name, bay number, counter
   * and lock badge, the action button(s), and the vehicles mounted at all.
   */
  const restState = (p = page) =>
    p
      .evaluate(() => {
        const opacity = (el) => {
          let o = 1;
          for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
          return o;
        };
        const onScreen = (r) => r.right > 1 && r.left < innerWidth - 1 && r.bottom > 0 && r.top < innerHeight;
        const texts = [...document.querySelectorAll('div')]
          .filter((el) => el.children.length === 0 && opacity(el) > 0.5 && onScreen(el.getBoundingClientRect()))
          .map((el) => el.textContent.trim());
        return {
          texts,
          buttons: [...document.querySelectorAll('[role="button"]')].map((el) => el.getAttribute('aria-label') ?? ''),
          counterLabel: [...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')).find((l) => /^All cars\. Car \d+ of \d+$/.test(l)) ?? null,
          mounted: globalThis.__neonBayGarage.mounted(),
        };
      })
      .then((s) => ({
        ...s,
        bay: s.texts.filter((t) => /^BAY \d\d$/.test(t)),
        counter: s.texts.filter((t) => /^\d\d$/.test(t)),
        badges: s.texts.filter((t) => t === 'PREMIUM').length,
        actions: s.buttons.map(parseAction).filter(Boolean),
      }));
  /**
   * Checks that everything the garage says belongs to vehicle `i`: name, bay,
   * counter, lock badge and action button, and that only it and its
   * neighbours are mounted. `button`: the expected action kind(s).
   */
  async function expectShown(i, label, { button, p = page } = {}) {
    const [id, name] = VEHICLES[i];
    const s = await restState(p);
    const one = (xs, x) => xs.length === 1 && xs[0] === x;
    const act = s.actions.length === 1 ? s.actions[0] : null;
    const kinds = button ? [button].flat() : null;
    const lockedShown = act && (act.kind === 'look' || act.kind === 'locked');
    const problems = [];
    if (s.texts.filter((t) => VEHICLES.some((v) => v[1].toUpperCase() === t)).join() !== name.toUpperCase()) problems.push('name');
    if (!one(s.bay, `BAY ${pad2(i + 1)}`)) problems.push('bay');
    if (!one(s.counter, pad2(i + 1)) || s.counterLabel !== `All cars. Car ${i + 1} of ${VEHICLES.length}`) problems.push('counter');
    if (!act || act.name !== name) problems.push('button');
    if (kinds && (!act || !kinds.includes(act.kind))) problems.push(`button kind ${act?.kind}`);
    if (isFree(id) && lockedShown) problems.push('free vehicle shown locked');
    if (s.badges !== (lockedShown ? 1 : 0)) problems.push(`lock badges ${s.badges}`);
    if (!s.mounted.includes(id) || !s.mounted.every((m) => Math.abs(indexOf(m) - i) <= 1)) problems.push('mounted');
    const ok = problems.length === 0;
    check(
      `${label}: ${name} with its own name, bay, counter, ${lockedShown ? 'lock badge' : 'no lock badge'} and ${act?.kind ?? '?'} button; only it and its neighbours mounted`,
      ok,
      ok ? '' : `${problems.join(', ')} ${JSON.stringify({ bay: s.bay, counter: s.counter, counterLabel: s.counterLabel, actions: s.actions, badges: s.badges, mounted: s.mounted })}`,
    );
    return ok;
  }
  /**
   * Screenshot of the car area (top of the stage to the floor + `below`)
   * showing only the cars' canvas: the garage background and every control
   * or label are hidden, so the picture is the vehicles alone on the plain
   * backdrop. Decoded to RGBA.
   */
  async function carsOnly(p = page, below = 20) {
    const st = await p.evaluate(() => globalThis.__neonBayGarage.stage());
    await p.evaluate(() => {
      const cars = document.querySelectorAll('[data-testid="garage-carousel"] canvas')[1];
      const keep = new Set();
      for (let e = cars; e; e = e.parentElement) keep.add(e);
      globalThis.__carsOnlyHidden = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (keep.has(el)) continue;
        globalThis.__carsOnlyHidden.push([el, el.style.visibility]);
        el.style.visibility = 'hidden';
      }
    });
    await p.waitForTimeout(120);
    const vp = p.viewportSize();
    const top = Math.max(0, Math.floor(st.top - 6));
    const bottom = Math.min(vp.height, Math.ceil(st.ground + below));
    const buf = await p.screenshot({ clip: { x: 0, y: top, width: vp.width, height: bottom - top } });
    await p.evaluate(() => {
      for (const [el, v] of globalThis.__carsOnlyHidden) el.style.visibility = v;
    });
    return decode(buf);
  }
  return { garage, openGarage, backToGarage, settle, swipe, goTo, action, restState, expectShown, carsOnly };
}

// ── Studio (vehicle units via the studio probe) ─────────────────────────────
export function studioKit(page) {
  const nb = (fn, arg) => page.evaluate(fn, arg);
  async function waitForStudio(id) {
    await page.waitForFunction((v) => globalThis.__neonBay?.vehicleId === v, id, { timeout: 60000 });
    await page.waitForTimeout(600);
  }
  async function toPage(p) {
    const box = await page.getByTestId('drawing-surface').boundingBox();
    const s = await nb(({ x, y }) => globalThis.__neonBay.toScreen(x, y), p);
    return { x: box.x + s.x, y: box.y + s.y };
  }
  const alphaAt = (p) => nb(({ x, y }) => globalThis.__neonBay.paintAlphaAt(x, y), p);
  /** Points well inside a part (all probes within r agree). */
  const samples = (id, n = 10, r = 4) =>
    nb(
      ({ id, n, r }) => {
        const probe = globalThis.__neonBay;
        const b = probe.regions.find((x) => x.id === id).bounds;
        const out = [];
        let s = 777;
        for (let k = 0; k < 6000 && out.length < n; k++) {
          s = (s * 1103515245 + 12345) % 2147483648;
          const x = b.x + (s / 2147483648) * b.width;
          s = (s * 1103515245 + 12345) % 2147483648;
          const y = b.y + (s / 2147483648) * b.height;
          if ([[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => probe.regionAt(x + dx, y + dy) === id)) out.push({ x, y });
        }
        return out;
      },
      { id, n, r },
    );
  async function mouseStroke(points, steps = 5) {
    const pts = [];
    for (const p of points) pts.push(await toPage(p));
    await page.mouse.move(pts[0].x, pts[0].y);
    await page.mouse.down();
    for (let i = 1; i < pts.length; i++) {
      for (let k = 1; k <= steps; k++) await page.mouse.move(pts[i - 1].x + ((pts[i].x - pts[i - 1].x) * k) / steps, pts[i - 1].y + ((pts[i].y - pts[i - 1].y) * k) / steps);
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
  }
  async function paintedCount(id) {
    let n = 0;
    const pts = await samples(id);
    for (const p of pts) if ((await alphaAt(p)) > 0) n++;
    return { n, of: pts.length };
  }
  /** Body parts, largest first. */
  const bodyParts = async () =>
    (await nb(() => globalThis.__neonBay.regions))
      .filter((r) => r.material === 'body')
      .sort((a, b) => b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height);
  /** The vehicle's outline on screen (page coordinates): the union of its parts' bounds. */
  async function vehicleRect() {
    const box = await page.getByTestId('drawing-surface').boundingBox();
    return nb((b) => {
      const probe = globalThis.__neonBay;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const r of probe.regions) {
        const a = probe.toScreen(r.bounds.x, r.bounds.y);
        const c = probe.toScreen(r.bounds.x + r.bounds.width, r.bounds.y + r.bounds.height);
        x0 = Math.min(x0, a.x);
        y0 = Math.min(y0, a.y);
        x1 = Math.max(x1, c.x);
        y1 = Math.max(y1, c.y);
      }
      return { x: b.x + x0, y: b.y + y0, w: x1 - x0, h: y1 - y0 };
    }, box);
  }
  return { nb, waitForStudio, toPage, alphaAt, samples, mouseStroke, paintedCount, bodyParts, vehicleRect };
}

// ── Layout ──────────────────────────────────────────────────────────────────
/** Visible controls (buttons and links) as page boxes. */
export const controlBoxes = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[role="button"],[role="link"],button,a')]
      .filter((e) => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden')
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { name: e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30) || '?', x: r.x, y: r.y, w: r.width, h: r.height };
      })
      .filter((b) => b.w > 0 && b.h > 0),
  );
/** Visible text (leaf elements) as page boxes. */
export const textBoxes = (page) =>
  page.evaluate(() => {
    const opacity = (el) => {
      let o = 1;
      for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
      return o;
    };
    return [...document.querySelectorAll('div,span')]
      .filter((el) => el.children.length === 0 && el.textContent.trim() && opacity(el) > 0.5)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { name: el.textContent.trim().slice(0, 30), x: r.x, y: r.y, w: r.width, h: r.height };
      })
      .filter((b) => b.w > 0 && b.h > 0 && b.x < innerWidth && b.y < innerHeight && b.x + b.w > 0 && b.y + b.h > 0);
  });
export const overlap = (a, b) => {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 1 && oy > 1;
};
/** Controls are ≥ 44 pt, on screen and not overlapping one another (with scrolls: true they may sit below the fold). */
export async function controlsOk(page, label, check, { scrolls = false } = {}) {
  const boxes = await controlBoxes(page);
  const vp = page.viewportSize();
  const small = boxes.filter((b) => b.w < 43.5 || b.h < 43.5).map((b) => `${b.name} ${b.w.toFixed(0)}×${b.h.toFixed(0)}`);
  const off = boxes.filter((b) => b.x < -0.5 || (!scrolls && b.y < -0.5) || b.x + b.w > vp.width + 0.5 || (!scrolls && b.y + b.h > vp.height + 0.5)).map((b) => b.name);
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlap(boxes[i], boxes[j])) overlaps.push(`${boxes[i].name} ∩ ${boxes[j].name}`);
  check(`${label}: every control ≥ 44 pt`, small.length === 0, small.join(', '));
  check(`${label}: no overlapping controls`, overlaps.length === 0, overlaps.slice(0, 4).join(', '));
  check(`${label}: all controls on screen${scrolls ? ' (horizontally; the page scrolls)' : ''}`, off.length === 0, off.join(', '));
  return boxes;
}

/**
 * Paper-white pixels of the garage's vehicles canvas alone (everything else
 * hidden) inside each box: how much of the vehicle a control or label would
 * cover. Returns { name, n } per box.
 */
export async function vehiclePixelsUnder(page, boxes) {
  await page.evaluate(() => {
    const cars = document.querySelectorAll('[data-testid="garage-carousel"] canvas')[1];
    const keep = new Set();
    for (let e = cars; e; e = e.parentElement) keep.add(e);
    globalThis.__e2eHidden = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (keep.has(el)) continue;
      globalThis.__e2eHidden.push([el, el.style.visibility]);
      el.style.visibility = 'hidden';
    }
  });
  await page.waitForTimeout(150);
  const s = decode(await page.screenshot());
  await page.evaluate(() => {
    for (const [el, v] of globalThis.__e2eHidden) el.style.visibility = v;
  });
  return boxes.map((b) => {
    let n = 0;
    for (let y = Math.max(0, Math.floor(b.y)); y < Math.min(s.h, b.y + b.h); y++) {
      for (let x = Math.max(0, Math.floor(b.x)); x < Math.min(s.w, b.x + b.w); x++) {
        const k = (y * s.w + x) * 4;
        if (s.px[k] + s.px[k + 1] + s.px[k + 2] > 450) n++;
      }
    }
    return { name: b.name, n };
  });
}
