/**
 * "Dragon GT" — colourable parts of assets/source/09-nissan-gt-r.png
 * (a grand-touring sports coupe; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only dragon-gt --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const DRAGON_GT_TRACE: TracedVehicleSpec = {
  id: 'dragon-gt',
  assetVersion: 1,
  source: 'assets/source/09-nissan-gt-r.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[485, 418]] },
    { id: 'hood-vents', name: 'Hood vents', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[330, 355], [440, 355], [440, 395], [330, 395]] }, { polygon: [[620, 362], [735, 362], [735, 402], [620, 402]] }] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[938, 435]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[602, 733]] },
    { id: 'bumper-corner', name: 'Bumper corner', material: 'body', seeds: [[680, 690]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[30, 400], [185, 400], [185, 530], [30, 530]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[600, 440], [855, 440], [855, 570], [600, 570]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', seeds: [[280, 554], [209, 581], [151, 584], [168, 554], [488, 572]] },
    { id: 'grille-surround', name: 'Grille surround', material: 'body', seeds: [[492, 646]] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [[316, 710]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[123, 702], [157, 667], [126, 736]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[509, 710], [468, 689]] },
    { id: 'left-vent', name: 'Left bumper vent', material: 'trim', seeds: [[42, 627], [42, 598]] },
    { id: 'right-vent', name: 'Right bumper vent', material: 'trim', seeds: [[638, 635], [693, 642]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[690, 800], [17, 752]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[914, 264]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[440, 290]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[445, 316]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[921, 164]] },
    { id: 'pillar', name: 'Window pillar', material: 'body', seeds: [[1013, 325]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1161, 247]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1262, 277]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1231, 294]] },
    { id: 'spoiler', name: 'Rear wing', material: 'body', allowPieces: true, seeds: [[1436, 270], [1362, 262], [1403, 239], [1413, 247], [1398, 284]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1117, 307], [1090, 371], [1133, 347]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1044, 335]] },
    { id: 'side-marker', name: 'Side light', material: 'light', seeds: [[828, 557]] },
    { id: 'fender-vent', name: 'Fender vent', material: 'trim', seeds: [[1032, 481], [1036, 455]] },
    { id: 'wheel-arch', name: 'Front wheel arch', material: 'body', seeds: [[763, 609], [748, 791]], allowPieces: true },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1166, 517]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1354, 400]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1488, 571]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1465, 478]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1199, 687], [1320, 700]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[869, 842], [812, 842], [930, 513], [971, 553]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[927, 663]], within: [{ ellipse: [898, 700, 92, 158] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1367, 697]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [[1432, 550]], within: [{ ellipse: [1420, 575, 58, 128] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
