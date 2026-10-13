import {
  MAX_ZOOM,
  clampTransform,
  fitTransform,
  pinchTransform,
  refit,
  toArtwork,
  toScreen,
  zoomLevel,
} from '../src/engine/view/viewTransform';

const focus = { x: 110, y: 370, width: 1390, height: 440 };

const close = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('fitTransform', () => {
  it('aspect-fits and centres the focus rect in landscape', () => {
    const view = { width: 844, height: 390 };
    const t = fitTransform(view, focus);
    const tl = toScreen(t, { x: focus.x, y: focus.y });
    const br = toScreen(t, { x: focus.x + focus.width, y: focus.y + focus.height });
    // Width-limited: fills horizontally, centred vertically.
    close(tl.x, 0);
    close(br.x, view.width);
    close(tl.y, view.height - br.y);
  });

  it('aspect-fits in portrait (small phone)', () => {
    const view = { width: 320, height: 420 };
    const t = fitTransform(view, focus);
    const tl = toScreen(t, { x: focus.x, y: focus.y });
    const br = toScreen(t, { x: focus.x + focus.width, y: focus.y + focus.height });
    close(br.x - tl.x, 320);
    expect(br.y - tl.y).toBeLessThanOrEqual(420);
    close(tl.y, 420 - br.y);
  });

  it('maps screen ↔ artwork exactly', () => {
    const t = fitTransform({ width: 700, height: 500 }, focus, 12);
    for (const p of [{ x: 0, y: 0 }, { x: 345.25, y: 211.5 }, { x: 700, y: 500 }]) {
      const back = toScreen(t, toArtwork(t, p));
      close(back.x, p.x);
      close(back.y, p.y);
    }
  });
});

describe('pinchTransform', () => {
  it('keeps the artwork point under the fingers fixed while zooming', () => {
    const start = fitTransform({ width: 800, height: 400 }, focus);
    const a0 = { x: 300, y: 200 };
    const b0 = { x: 500, y: 200 };
    const anchor = toArtwork(start, { x: 400, y: 200 });
    const t = pinchTransform(start, a0, b0, { x: 250, y: 220 }, { x: 650, y: 220 });
    close(t.scale / start.scale, 2);
    const moved = toScreen(t, anchor);
    close(moved.x, 450);
    close(moved.y, 220);
  });
});

describe('clampTransform', () => {
  const view = { width: 800, height: 400 };
  const fit = fitTransform(view, focus);

  it('limits zoom to [1, MAX_ZOOM]', () => {
    expect(zoomLevel(clampTransform({ ...fit, scale: fit.scale * 0.2 }, view, focus, fit), fit)).toBeCloseTo(1);
    expect(zoomLevel(clampTransform({ ...fit, scale: fit.scale * 50 }, view, focus, fit), fit)).toBeCloseTo(MAX_ZOOM);
  });

  it('keeps the zoomed artwork covering the view', () => {
    const t = clampTransform({ scale: fit.scale * 2, tx: 5000, ty: -5000 }, view, focus, fit);
    const tl = toScreen(t, { x: focus.x, y: focus.y });
    const br = toScreen(t, { x: focus.x + focus.width, y: focus.y + focus.height });
    expect(tl.x).toBeLessThanOrEqual(0.0001);
    expect(br.x).toBeGreaterThanOrEqual(view.width - 0.0001);
    expect(tl.y).toBeLessThanOrEqual(0.0001);
    expect(br.y).toBeGreaterThanOrEqual(view.height - 0.0001);
  });
});

describe('refit after resize / rotation', () => {
  it('keeps relative zoom and the artwork point at the view centre', () => {
    const landscape = { width: 844, height: 390 };
    const fit = fitTransform(landscape, focus);
    const zoomed = clampTransform(
      pinchTransform(fit, { x: 300, y: 195 }, { x: 400, y: 195 }, { x: 250, y: 195 }, { x: 450, y: 195 }),
      landscape,
      focus,
      fit,
    );
    const centre = toArtwork(zoomed, { x: 422, y: 195 });
    const portrait = { width: 390, height: 600 };
    const { transform, fit: fit2 } = refit(zoomed, landscape, fit, portrait, focus);
    expect(zoomLevel(transform, fit2)).toBeCloseTo(zoomLevel(zoomed, fit), 5);
    const c2 = toArtwork(transform, { x: 195, y: 300 });
    // Same centre unless clamping had to move it (it may only move toward the content).
    expect(Math.abs(c2.x - centre.x)).toBeLessThan(focus.width);
    expect(Math.abs(c2.y - centre.y)).toBeLessThan(focus.height);
  });

  it('returns the plain fit when not zoomed', () => {
    const a = { width: 844, height: 390 };
    const fit = fitTransform(a, focus);
    const { transform } = refit(fit, a, fit, { width: 390, height: 844 }, focus);
    expect(transform).toEqual(fitTransform({ width: 390, height: 844 }, focus));
  });
});
