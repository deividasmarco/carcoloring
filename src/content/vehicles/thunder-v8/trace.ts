/**
 * "Thunder V8" — colourable parts of assets/source/08-ford-mustang.png
 * (a fastback muscle coupe; fictional name, no badges in the drawing).
 * The roof and rear quarter are one surface in the drawing.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only thunder-v8 --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const THUNDER_V8_TRACE: TracedVehicleSpec = {
  id: 'thunder-v8',
  assetVersion: 1,
  source: 'assets/source/08-ford-mustang.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[469, 400]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[816, 453]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[668, 688]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', allowPieces: true, seeds: [[154, 555]], within: [{ polygon: [[38, 466], [140, 466], [140, 548], [38, 548]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[784, 517]], within: [{ polygon: [[585, 482], [812, 482], [812, 546], [585, 546]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', seeds: [[310, 544], [514, 567], [130, 550], [99, 559], [494, 526]] },
    { id: 'fog-light', name: 'Fog light', material: 'light', seeds: [[718, 616], [599, 625], [730, 647]] },
    { id: 'left-vent', name: 'Left bumper vent', material: 'trim', seeds: [], within: [{ polygon: [[30, 590], [80, 590], [80, 668], [30, 668]] }] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[146, 678], [175, 663]] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [[269, 686]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[484, 695]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[545, 728]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[495, 753]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[127, 759], [203, 766]], allowPieces: true },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[942, 270]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[424, 311]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[558, 234]] },
    { id: 'roof', name: 'Roof and rear fender', material: 'body', seeds: [[1384, 382]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1130, 204], [1235, 228]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1149, 254]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1282, 295]] },
    { id: 'spoiler', name: 'Spoiler', material: 'body', seeds: [[1407, 317]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1492, 610]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1125, 321]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[980, 360], [1005, 359]] },
    { id: 'upper-door', name: 'Upper door', material: 'body', seeds: [[1218, 376]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1137, 502]] },
    { id: 'door-sill', name: 'Door sill', material: 'body', seeds: [[1255, 579]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1232, 627], [1322, 608], [1033, 632], [1297, 575]] },
    { id: 'skirt-trim', name: 'Skirt trim', material: 'trim', seeds: [[1275, 674], [1024, 698]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[853, 809], [766, 787], [926, 490]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[952, 625]], within: [{ ellipse: [890, 660, 86, 136] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1422, 469], [1348, 703], [1442, 454]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [], within: [{ ellipse: [1420, 595, 48, 128] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
