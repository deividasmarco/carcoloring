/**
 * "Basecamp 4x4" — colourable parts of assets/source/06-land-rover-defender.png
 * (a squared-off off-roader; fictional name, no badges or lettering in the
 * drawing). The hood and right front fender are one surface in the drawing.
 * Knobbly tyre treads and mesh grilles are many tiny drawn cells; lassos
 * gather them into one tyre or one grille each.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only basecamp-4x4 --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const BASECAMP_4X4_TRACE: TracedVehicleSpec = {
  id: 'basecamp-4x4',
  assetVersion: 1,
  source: 'assets/source/06-land-rover-defender.png',
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
    { id: 'hood', name: 'Hood and fender', material: 'body', seeds: [[654, 576]] },
    { id: 'grille-top', name: 'Grille top', material: 'body', seeds: [[166, 432]] },
    { id: 'upper-grille', name: 'Upper grille', material: 'trim', allowPieces: true, seeds: [[193, 473], [167, 548], [171, 487]] },
    { id: 'front-panel', name: 'Front panel', material: 'body', seeds: [[462, 567]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[52, 436], [148, 436], [148, 528], [52, 528]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[477, 482]], within: [{ polygon: [[495, 444], [664, 444], [664, 534], [495, 534]] }] },
    { id: 'left-fender', name: 'Left fender', material: 'body', allowPieces: true, seeds: [[116, 419], [178, 388]] },
    { id: 'left-corner', name: 'Left bumper corner', material: 'body', seeds: [[90, 554], [41, 567]] },
    { id: 'left-lower-corner', name: 'Left lower corner', material: 'body', allowPieces: true, seeds: [[58, 692], [91, 697]] },
    { id: 'left-fog', name: 'Left fog light', material: 'light', allowPieces: true, seeds: [[107, 656], [62, 638]] },
    { id: 'right-fog', name: 'Right fog light', material: 'light', allowPieces: true, seeds: [[503, 672], [580, 627]] },
    { id: 'right-corner', name: 'Right bumper corner', material: 'body', seeds: [[562, 566]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[448, 672]] },
    { id: 'bumper-side', name: 'Bumper side', material: 'body', seeds: [[606, 723]] },
    { id: 'mesh-grille', name: 'Mesh grilles', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[145, 588], [445, 588], [445, 652], [145, 652]] }, { polygon: [[150, 676], [436, 676], [436, 730], [150, 730]] }] },
    { id: 'skid-plate', name: 'Skid plate', material: 'trim', allowPieces: true, seeds: [[473, 764], [229, 761], [316, 766], [406, 769]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', allowPieces: true, seeds: [[196, 844], [205, 803]], within: [{ polygon: [[28, 728], [300, 728], [300, 872], [28, 872]] }] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[783, 257]] },
    { id: 'cowl', name: 'Wipers and vents', material: 'trim', allowPieces: true, seeds: [[700, 349], [849, 358], [929, 359], [883, 360], [715, 377], [418, 339]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[412, 274], [362, 294], [368, 350]] },
    { id: 'roof', name: 'Roof', material: 'body', allowPieces: true, seeds: [[847, 139], [1029, 142], [1104, 144], [1242, 145], [1254, 118]] },
    { id: 'pillar', name: 'Window pillars', material: 'trim', allowPieces: true, seeds: [[745, 161], [940, 320], [905, 320]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1012, 227]] },
    { id: 'middle-pillar', name: 'Middle pillar', material: 'trim', allowPieces: true, seeds: [[1115, 332], [1134, 323]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', allowPieces: true, seeds: [[1185, 283], [1268, 307]] },
    { id: 'rear-pillar', name: 'Rear pillar', material: 'body', seeds: [[1298, 276]] },
    { id: 'back-window', name: 'Back window', material: 'glass', seeds: [[1387, 241]] },
    { id: 'roof-windows', name: 'Roof windows', material: 'glass', allowPieces: true, seeds: [[1310, 193], [1424, 188]] },
    { id: 'window-trim', name: 'Window trim', material: 'trim', allowPieces: true, seeds: [[1360, 345], [944, 345], [1167, 351]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1019, 309], [1059, 289]] },
    { id: 'side-vent', name: 'Side vent', material: 'trim', allowPieces: true, seeds: [[928, 416]], within: [{ polygon: [[896, 392], [944, 392], [944, 548], [896, 548]] }] },
    { id: 'front-flare', name: 'Front wheel flare', material: 'body', allowPieces: true, seeds: [[816, 485], [786, 515]] },
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', allowPieces: true, seeds: [[849, 548], [785, 635], [903, 637]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1033, 519]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1233, 502]] },
    { id: 'door-handles', name: 'Door handles', material: 'trim', allowPieces: true, seeds: [[1116, 431], [1307, 422]] },
    { id: 'belt', name: 'Window belt', material: 'body', allowPieces: true, seeds: [[1182, 377], [1417, 367]] },
    { id: 'rear-quarter', name: 'Rear quarter', material: 'body', seeds: [[1446, 419]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1469, 357]] },
    { id: 'door-sill', name: 'Door sill', material: 'body', allowPieces: true, seeds: [[1010, 632], [1171, 618]] },
    { id: 'lower-side', name: 'Lower side', material: 'body', allowPieces: true, seeds: [[1029, 696], [1278, 668], [926, 696]] },
    { id: 'side-step', name: 'Side step', material: 'trim', allowPieces: true, seeds: [[1068, 727], [1232, 730]] },
    { id: 'rear-flare', name: 'Rear wheel flare', material: 'body', allowPieces: true, seeds: [[1406, 462], [1386, 489], [1347, 475]] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', allowPieces: true, seeds: [[1433, 520], [1351, 503], [1357, 537]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', allowPieces: true, seeds: [[1493, 549], [1492, 582]] },

    // ── Wheels (rims first: their lassos win over the tyres') ───────────────
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[852, 698], [765, 672]], within: [{ ellipse: [806, 732, 74, 126] }] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1434, 651]], within: [{ ellipse: [1398, 681, 56, 112] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', allowPieces: true, seeds: [[790, 877]], within: [{ polygon: [[612, 552], [905, 552], [930, 905], [612, 905]] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', allowPieces: true, seeds: [[1388, 809]], within: [{ polygon: [[1236, 540], [1478, 540], [1478, 838], [1236, 838]] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
