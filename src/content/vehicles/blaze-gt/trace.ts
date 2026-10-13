/**
 * "Blaze GT" — colourable parts of assets/source/01-lamborghini-huracan.png
 * (a wedge-shaped supercar; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only blaze-gt --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const BLAZE_GT_TRACE: TracedVehicleSpec = {
  id: 'blaze-gt',
  assetVersion: 1,
  source: 'assets/source/01-lamborghini-huracan.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  strictBackground: true,
  absorbBelow: 300,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    // ── Front ───────────────────────────────────────────────────────────────
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[393, 486]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[147, 465]] },
    { id: 'nose', name: 'Nose', material: 'body', seeds: [[178, 600]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[753, 661]] },
    { id: 'fender-stripe', name: 'Fender stripe', material: 'body', seeds: [[758, 463]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[70, 455], [150, 455], [150, 560], [70, 560]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[530, 505], [770, 505], [770, 585], [530, 585]] }] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [[368, 703], [147, 696]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[562, 688], [467, 731], [531, 754], [658, 726]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[68, 648]], within: [{ polygon: [[30, 575], [130, 575], [130, 700], [30, 700]] }] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[168, 730], [67, 706]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[621, 327]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[310, 368]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[992, 241]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[956, 326]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1058, 306]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1188, 322]] },
    { id: 'rear-window-frame', name: 'Rear window frame', material: 'trim', seeds: [[1225, 302], [1195, 267], [1251, 296]] },
    { id: 'rear-vent', name: 'Rear air vent', material: 'trim', seeds: [[1269, 344]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'door-corner', name: 'Door corner', material: 'body', seeds: [[950, 384]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1068, 376], [1139, 396]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1052, 427]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1095, 556]] },
    { id: 'door-handle', name: 'Door handle', material: 'trim', seeds: [[1257, 427]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1337, 435]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1199, 606]] },
    { id: 'side-scoop', name: 'Side air scoop', material: 'body', seeds: [[1355, 587]] },
    { id: 'scoop-grille', name: 'Scoop grille', material: 'trim', seeds: [[1325, 598], [1258, 594], [1270, 610]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    // The tread above the rim and the sidewall below the bumper never touch.
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[905, 488], [825, 786]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[976, 613]], within: [{ ellipse: [900, 645, 100, 140] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1384, 660]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [[1478, 519]], within: [{ ellipse: [1450, 555, 65, 110] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
