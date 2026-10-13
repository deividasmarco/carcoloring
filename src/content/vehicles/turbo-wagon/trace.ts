/**
 * "Turbo Wagon" — colourable parts of assets/source/06-audi-rs6-c8.png
 * (a fast estate car; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only turbo-wagon --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const TURBO_WAGON_TRACE: TracedVehicleSpec = {
  id: 'turbo-wagon',
  assetVersion: 1,
  source: 'assets/source/06-audi-rs6-c8.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[407, 449]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[760, 614]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[38, 452], [165, 452], [165, 548], [38, 548]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[611, 542], [785, 503]], within: [{ polygon: [[528, 495], [792, 495], [792, 575], [528, 575]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [[177, 524]], within: [{ polygon: [[100, 535], [548, 535], [548, 738], [100, 738]] }] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[53, 685], [27, 645]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[645, 706], [701, 669], [723, 695]] },
    { id: 'fog-light', name: 'Fog light', material: 'light', allowPieces: true, seeds: [[687, 588], [663, 603]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', allowPieces: true, seeds: [[408, 772], [182, 773], [468, 761], [483, 762], [66, 764], [513, 788]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[130, 794]] },

    // ── Glass, cabin and roof ───────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[562, 304], [640, 325], [693, 306], [797, 242], [883, 259], [827, 223], [839, 224], [979, 217]] },
    { id: 'inside-mirror', name: 'Inside mirror', material: 'trim', seeds: [[726, 223]] },
    { id: 'seats', name: 'Seats', material: 'trim', allowPieces: true, seeds: [[753, 313], [915, 321], [1028, 295], [1199, 318], [1085, 307]] },
    { id: 'dashboard', name: 'Dashboard', material: 'trim', allowPieces: true, seeds: [[837, 350], [604, 332], [702, 342], [668, 342]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[475, 272]] },
    { id: 'windshield-frame', name: 'Windshield frame', material: 'trim', allowPieces: true, seeds: [[633, 175], [949, 321]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[363, 337]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[988, 182]] },
    { id: 'roof-rails', name: 'Roof rails', material: 'trim', allowPieces: true, seeds: [[1050, 170], [1128, 193], [1109, 194]] },
    { id: 'window-surround', name: 'Window surround', material: 'body', seeds: [[1438, 326]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1060, 242]] },
    { id: 'middle-pillar', name: 'Middle pillar', material: 'trim', seeds: [[1118, 304]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1195, 246]] },
    { id: 'rear-pillar', name: 'Rear pillar', material: 'trim', seeds: [[1302, 322]] },
    { id: 'quarter-window', name: 'Back window', material: 'glass', seeds: [[1340, 294]] },
    { id: 'window-trim', name: 'Window trim', material: 'trim', allowPieces: true, seeds: [[1151, 338], [1168, 338], [1416, 324], [1318, 335], [1117, 362]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1044, 342]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', allowPieces: true, seeds: [[1088, 375], [1025, 390]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[943, 452]] },
    { id: 'front-flare', name: 'Front wheel flare', material: 'body', seeds: [[898, 489]] },
    { id: 'upper-front-door', name: 'Upper front door', material: 'body', seeds: [[1072, 419]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1088, 538]] },
    { id: 'front-handle', name: 'Front door handle', material: 'trim', seeds: [[1150, 434]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1277, 501]] },
    { id: 'rear-handle', name: 'Rear door handle', material: 'trim', seeds: [[1320, 411]] },
    { id: 'door-sill', name: 'Door sill', material: 'body', seeds: [[1167, 627], [1177, 662]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1005, 736], [1322, 653]] },
    { id: 'skirt-trim', name: 'Skirt trim', material: 'trim', allowPieces: true, seeds: [[1231, 701], [1265, 706]] },
    { id: 'rear-quarter', name: 'Rear quarter', material: 'body', seeds: [[1440, 398]] },
    { id: 'rear-flare', name: 'Rear wheel flare', material: 'body', seeds: [[1426, 444]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1508, 547]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1478, 370]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[857, 843], [909, 518], [780, 824]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [], within: [{ ellipse: [880, 694, 92, 140] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1399, 756], [1330, 732], [1431, 467]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1455, 661], [1397, 584], [1386, 651]], within: [{ ellipse: [1422, 625, 52, 115] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
