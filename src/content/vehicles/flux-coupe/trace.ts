/**
 * "Flux Coupe" — colourable parts of assets/source/02-bmw-m4-g82.png
 * (a two-door sports coupe; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only flux-coupe --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const FLUX_COUPE_TRACE: TracedVehicleSpec = {
  id: 'flux-coupe',
  assetVersion: 1,
  source: 'assets/source/02-bmw-m4-g82.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[707, 414]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[683, 676]] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[800, 749]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[38, 448], [135, 448], [135, 538], [38, 538]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[801, 481]], within: [{ polygon: [[505, 462], [825, 462], [825, 548], [505, 548]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[148, 495], [302, 495], [302, 728], [148, 728]] }, { polygon: [[316, 495], [468, 495], [468, 732], [316, 732]] }] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[126, 676]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[564, 689]] },
    { id: 'side-vent', name: 'Side vent', material: 'trim', seeds: [[746, 633]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[119, 775], [181, 778]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[814, 260]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[409, 295], [390, 315], [441, 312]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1006, 176]] },
    { id: 'pillar', name: 'Window pillar', material: 'trim', seeds: [[1000, 277]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1132, 243]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1261, 283]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1326, 296], [1219, 292], [1228, 337]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1076, 329], [1145, 344], [1045, 352]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1158, 546]] },
    { id: 'door-handle', name: 'Door handle', material: 'trim', seeds: [[1255, 400]] },
    { id: 'door-sill', name: 'Door sill', material: 'body', seeds: [[1224, 626]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1332, 611]] },
    { id: 'sill', name: 'Sill trim', material: 'trim', seeds: [[1269, 664], [1012, 732]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1350, 426]] },
    { id: 'rear-corner', name: 'Rear corner', material: 'body', seeds: [[1496, 468], [1505, 594]], allowPieces: true },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1476, 367]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[902, 519], [794, 799], [933, 494]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [], within: [{ ellipse: [905, 668, 85, 150] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1363, 708], [1440, 459]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1443, 578]], within: [{ ellipse: [1432, 610, 52, 118] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
