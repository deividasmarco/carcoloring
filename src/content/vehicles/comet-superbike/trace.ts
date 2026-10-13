/**
 * "Comet Superbike" — colourable parts of assets/source/09-ducati-panigale-v4.png
 * (a full-fairing sports motorcycle; fictional name, no badges or lettering
 * in the drawing). The fairing is one surface in the drawing.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only comet-superbike --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const COMET_SUPERBIKE_TRACE: TracedVehicleSpec = {
  id: 'comet-superbike',
  assetVersion: 1,
  source: 'assets/source/09-ducati-panigale-v4.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  strictBackground: true,
  absorbBelow: 300,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    // ── Body ────────────────────────────────────────────────────────────────
    { id: 'fairing', name: 'Fairing', material: 'body', seeds: [[664, 478]] },
    { id: 'windscreen', name: 'Windscreen', material: 'glass', seeds: [[550, 88], [434, 132]] },
    { id: 'screen-trim', name: 'Screen trim', material: 'trim', seeds: [[502, 209]] },
    { id: 'headlights', name: 'Headlights', material: 'light', allowPieces: true, seeds: [], within: [{ polygon: [[252, 318], [522, 318], [522, 458], [252, 458]] }] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[334, 75], [298, 86], [377, 154]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[713, 104], [713, 140]] },
    { id: 'tank', name: 'Fuel tank', material: 'body', seeds: [[935, 261]] },
    { id: 'seat', name: 'Seat', material: 'trim', allowPieces: true, seeds: [[1099, 267], [1039, 207], [1066, 215]] },
    { id: 'pillion-seat', name: 'Back seat cover', material: 'body', seeds: [[1149, 188]] },
    { id: 'tail', name: 'Tail', material: 'body', allowPieces: true, seeds: [[1255, 191], [1207, 151], [1190, 234], [1217, 228]] },
    { id: 'plate-holder', name: 'Number plate holder', material: 'trim', allowPieces: true, seeds: [[1356, 265], [1367, 218], [1378, 326]] },
    { id: 'tail-side', name: 'Tail side', material: 'body', seeds: [[1031, 399]] },
    { id: 'side-vent', name: 'Fairing vents', material: 'trim', allowPieces: true, seeds: [[863, 376], [815, 512], [812, 559], [874, 668]] },
    { id: 'lower-vent', name: 'Lower vent', material: 'trim', seeds: [[803, 744]] },
    { id: 'radiator', name: 'Radiator', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[526, 512], [642, 512], [642, 728], [526, 728]] }] },
    { id: 'lower-panel', name: 'Lower panel', material: 'body', allowPieces: true, seeds: [[588, 740], [571, 827]] },
    { id: 'handlebars', name: 'Handlebars', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[578, 160], [868, 160], [868, 342], [578, 342]] }] },

    // ── Frame and running gear ──────────────────────────────────────────────
    { id: 'frame', name: 'Frame', material: 'trim', allowPieces: true, seeds: [[982, 423], [1084, 441], [1098, 408], [906, 349], [928, 379], [1113, 393], [1215, 416], [1220, 449]] },
    { id: 'engine', name: 'Engine', material: 'trim', allowPieces: true, seeds: [[1030, 477], [983, 483], [1003, 490], [1013, 536], [1042, 551], [1028, 584]] },
    { id: 'footrest', name: 'Footrest', material: 'trim', allowPieces: true, seeds: [[1110, 605], [1088, 653], [1052, 639], [1072, 631], [1119, 651], [1077, 693]] },
    { id: 'under-seat', name: 'Under-seat panel', material: 'body', seeds: [[1151, 501]] },
    { id: 'shock', name: 'Rear shock', material: 'trim', seeds: [[980, 525]] },
    { id: 'swingarm', name: 'Swingarm', material: 'trim', seeds: [[1209, 632]] },
    { id: 'chain-guard', name: 'Chain guard', material: 'trim', seeds: [[1100, 571]] },
    { id: 'exhaust', name: 'Exhaust', material: 'trim', allowPieces: true, seeds: [[1016, 785], [1081, 797], [879, 821]] },
    { id: 'stand', name: 'Stand', material: 'trim', seeds: [[902, 793]] },
    { id: 'front-mudguard', name: 'Front mudguard', material: 'body', seeds: [[411, 586]] },
    { id: 'fork', name: 'Front fork', material: 'trim', allowPieces: true, seeds: [[493, 728], [435, 707], [458, 649], [380, 452], [449, 472], [510, 503], [459, 534]] },
    { id: 'front-brake', name: 'Front brake', material: 'trim', allowPieces: true, seeds: [[361, 864], [449, 866]] },

    // ── Wheels (rims first: their lassos win over the tyres') ───────────────
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[319, 937]], within: [{ ellipse: [382, 757, 150, 190] }] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1365, 721], [1235, 767], [1268, 548]], within: [{ ellipse: [1288, 665, 116, 168] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[209, 676]] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1185, 850]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
