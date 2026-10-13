/**
 * "Fortress 4x4" — colourable parts of assets/source/07-mercedes-g63.png
 * (a boxy luxury off-roader; fictional name). The round disc in the grille is
 * drawn empty (no emblem) and is its own part.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only fortress-4x4 --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const FORTRESS_4X4_TRACE: TracedVehicleSpec = {
  id: 'fortress-4x4',
  assetVersion: 1,
  source: 'assets/source/07-mercedes-g63.png',
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
    { id: 'hood', name: 'Hood', material: 'body', allowPieces: true, seeds: [[451, 372], [214, 389]] },
    { id: 'indicators', name: 'Indicator lights', material: 'light', allowPieces: true, seeds: [[127, 404], [704, 406]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[71, 568]] },
    { id: 'right-fender', name: 'Right fender', material: 'body', seeds: [[928, 433]] },
    { id: 'grille-surround', name: 'Grille surround', material: 'body', seeds: [[492, 582]] },
    { id: 'grille-disc', name: 'Grille disc', material: 'trim', seeds: [[298, 512]] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[132, 446], [498, 446], [498, 572], [132, 572]] }] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [[91, 478], [88, 544]], within: [{ polygon: [[55, 455], [122, 455], [122, 560], [55, 560]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[538, 475], [598, 480]], within: [{ polygon: [[520, 452], [660, 452], [660, 566], [520, 566]] }] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[741, 627], [452, 642], [107, 632]] },
    { id: 'bumper-insert', name: 'Bumper insert', material: 'trim', allowPieces: true, seeds: [[257, 671], [146, 618], [55, 614], [146, 696]] },
    { id: 'left-vent', name: 'Left bumper vent', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[16, 625], [88, 625], [88, 730], [16, 730]] }] },
    { id: 'right-vent', name: 'Right bumper vent', material: 'trim', allowPieces: true, seeds: [[661, 686]], within: [{ polygon: [[495, 650], [676, 650], [676, 746], [495, 746]] }] },
    { id: 'skid-plate', name: 'Skid plate', material: 'trim', allowPieces: true, seeds: [[469, 745], [334, 762], [131, 757], [238, 761], [392, 768]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', allowPieces: true, seeds: [[198, 869], [214, 800]], within: [{ polygon: [[38, 748], [345, 748], [345, 895], [38, 895]] }] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[887, 227]] },
    { id: 'windshield-frame', name: 'Windshield frame', material: 'body', seeds: [[958, 336]] },
    { id: 'inside-mirror', name: 'Inside mirror', material: 'trim', seeds: [[729, 162]] },
    { id: 'cowl', name: 'Wipers', material: 'trim', allowPieces: true, seeds: [[800, 332], [833, 324]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[374, 311]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[437, 234]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1081, 101]] },
    { id: 'roof-rail', name: 'Roof edge', material: 'trim', seeds: [[1019, 117]] },
    { id: 'front-window-frame', name: 'Front window frame', material: 'body', allowPieces: true, seeds: [[1163, 380], [1156, 354]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1088, 229]] },
    { id: 'middle-pillar', name: 'Middle pillar', material: 'trim', seeds: [[1164, 141]] },
    { id: 'rear-window-frame', name: 'Rear window frame', material: 'body', allowPieces: true, seeds: [[1318, 383], [1311, 358], [1467, 304]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1251, 289]] },
    { id: 'back-window', name: 'Back window', material: 'glass', seeds: [[1395, 280]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', allowPieces: true, seeds: [[1052, 306], [1116, 347], [1030, 379], [1012, 356], [1027, 352]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1064, 519]] },
    { id: 'lower-front-door', name: 'Lower front door', material: 'body', seeds: [[1096, 611]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', allowPieces: true, seeds: [[1252, 603], [1192, 407]] },
    { id: 'rear-quarter', name: 'Rear quarter', material: 'body', seeds: [[1373, 433]] },
    { id: 'side-moulding', name: 'Side moulding', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[718, 456], [1492, 456], [1492, 484], [718, 484]] }] },
    { id: 'side-step', name: 'Side step', material: 'trim', allowPieces: true, seeds: [[1150, 721], [1164, 707], [1080, 739], [1238, 681], [1103, 683], [1033, 705], [986, 732], [985, 702]] },
    { id: 'front-flare', name: 'Front wheel flare', material: 'body', allowPieces: true, seeds: [[757, 573], [911, 552]] },
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', allowPieces: true, seeds: [[922, 514], [812, 579]] },
    { id: 'rear-flare', name: 'Rear wheel flare', material: 'body', seeds: [[1479, 582]] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1441, 538]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1501, 616]] },

    // ── Wheels (rims first: their lassos win over the tyres') ───────────────
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[787, 725], [881, 624]], within: [{ ellipse: [856, 746, 90, 126] }] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1386, 682]], within: [{ ellipse: [1420, 705, 52, 116] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', allowPieces: true, seeds: [[812, 908], [709, 788], [686, 799], [664, 797]], within: [{ polygon: [[640, 580], [978, 580], [978, 936], [640, 936]] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', allowPieces: true, seeds: [[1403, 834], [1334, 750], [1289, 738], [1311, 741], [1271, 742]], within: [{ polygon: [[1272, 560], [1486, 560], [1486, 852], [1272, 852]] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
