/**
 * Vehicle names are shown in full (regression: "STORM SEDA…" on phones):
 * fitted from Michroma's real glyph widths, never wider than the room, at most
 * two lines, never below a readable size, and with every letter kept.
 */
import { GARAGE } from '../src/content/registry';
import { fitNamesUniformly, fitTitleSize, fitVehicleName, michromaWidth } from '../src/ui/fitName';

const NAMES = GARAGE.map((e) => e.vehicle.name);

describe('vehicle name fitting', () => {
  // Garage nameplate widths: small and large phones, portrait and landscape, tablets.
  it.each([250, 280, 300, 330, 349, 350, 420])('every name fits a %i dp nameplate in full', (width) => {
    for (const name of NAMES) {
      const fit = fitVehicleName(name, width, { max: 30, minOneLine: 20, minTwoLines: 16 });
      expect(fit.lines.length).toBeLessThanOrEqual(2);
      expect(fit.fontSize).toBeGreaterThanOrEqual(16);
      expect(fit.lines.join(' ')).toBe(name.toUpperCase());
      for (const line of fit.lines) expect(michromaWidth(line, fit.fontSize, fit.letterSpacing)).toBeLessThanOrEqual(width);
    }
  });

  it('measures Michroma as it renders: the old per-letter estimate was too small', () => {
    // At 30 dp with 3 dp spacing the old estimate allowed 347 dp; the real width is ~374 dp.
    expect(michromaWidth('STORM SEDAN', 30, 3)).toBeGreaterThan(11 * (30 * 0.95 + 3));
  });

  it('uses one readable size across a grid of cards', () => {
    for (const width of [146, 160, 190]) {
      const fitFor = fitNamesUniformly(NAMES, width, { max: 15, min: 10 });
      const sizes = new Set(NAMES.map((n) => fitFor(n).fontSize));
      expect(sizes.size).toBe(1);
      for (const name of NAMES) {
        const fit = fitFor(name);
        expect(fit.lines.length).toBeLessThanOrEqual(2);
        expect(fit.lines.join(' ')).toBe(name.toUpperCase());
        for (const line of fit.lines) expect(michromaWidth(line, fit.fontSize)).toBeLessThanOrEqual(width);
      }
    }
  });

  it('sizes screen titles to fit one line', () => {
    expect(michromaWidth('MY CREATIONS', fitTitleSize('MY CREATIONS', 230))).toBeLessThanOrEqual(230);
    expect(fitTitleSize('PARENTS', 400)).toBe(18);
  });
});
