/**
 * "Arrow Superbike" — colourable parts of assets/source/10-yamaha-yzf-r1.png
 * (a full-fairing sports motorcycle; fictional name, no badges or lettering
 * in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only arrow-superbike --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const ARROW_SUPERBIKE_TRACE: TracedVehicleSpec = {
  id: 'arrow-superbike',
  assetVersion: 1,
  source: 'assets/source/10-yamaha-yzf-r1.png',
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
    { id: 'fairing', name: 'Fairing', material: 'body', seeds: [[713, 628]] },
    { id: 'nose', name: 'Nose', material: 'body', seeds: [[344, 274]] },
    { id: 'side-panel', name: 'Side panel', material: 'body', seeds: [[810, 480]] },
    { id: 'side-panel-trim', name: 'Side panel trim', material: 'trim', allowPieces: true, seeds: [[693, 453], [726, 483], [760, 571]] },
    { id: 'radiator', name: 'Radiator', material: 'trim', allowPieces: true, seeds: [[563, 522], [560, 590], [535, 492]] }, // [535, 492]: a sliver walled in by ink at its tip
    { id: 'windscreen', name: 'Windscreen', material: 'glass', seeds: [[542, 82]] },
    { id: 'screen-trim', name: 'Screen trim', material: 'trim', seeds: [[550, 173]] },
    { id: 'headlights', name: 'Headlights', material: 'light', allowPieces: true, seeds: [[532, 322]], within: [{ polygon: [[238, 288], [532, 288], [532, 382], [238, 382]] }] },
    { id: 'air-intake', name: 'Air intakes', material: 'trim', allowPieces: true, seeds: [[293, 423], [397, 400], [385, 433], [457, 452], [346, 439]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[283, 97], [274, 133]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[697, 145]] },
    { id: 'tank-cover', name: 'Tank cover', material: 'body', seeds: [[745, 178]] },
    { id: 'tank', name: 'Fuel tank', material: 'body', seeds: [[846, 286]] },
    { id: 'tank-side', name: 'Tank side', material: 'body', seeds: [[925, 273]] },
    { id: 'seat', name: 'Seat', material: 'trim', seeds: [[1104, 278]] },
    { id: 'back-seat', name: 'Back seat cover', material: 'body', seeds: [[1171, 219]] },
    { id: 'tail', name: 'Tail', material: 'body', allowPieces: true, seeds: [[1288, 258], [1270, 182], [1106, 232], [1246, 248], [1248, 202], [1349, 209]] },
    { id: 'plate-holder', name: 'Number plate holder', material: 'trim', allowPieces: true, seeds: [[1320, 292], [1338, 328], [1328, 266]] },
    { id: 'rear-hugger', name: 'Rear mudguard', material: 'body', allowPieces: true, seeds: [[1288, 512], [1253, 460], [1239, 442]] },
    { id: 'under-seat', name: 'Under-seat panel', material: 'body', allowPieces: true, seeds: [[957, 373], [1029, 430], [1109, 497]] },
    { id: 'lower-panel', name: 'Lower fairing', material: 'body', allowPieces: true, seeds: [[586, 655], [638, 671], [562, 808]] },
    { id: 'handlebars', name: 'Handlebars', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[592, 160], [770, 160], [770, 335], [592, 335]] }] },

    // ── Frame and running gear ──────────────────────────────────────────────
    { id: 'frame', name: 'Frame', material: 'trim', seeds: [[961, 470]] },
    { id: 'rear-frame', name: 'Rear frame', material: 'trim', allowPieces: true, seeds: [[1163, 347], [1148, 378], [1173, 408], [1057, 374], [1128, 441], [1164, 515], [1193, 362]] },
    { id: 'engine', name: 'Engine', material: 'trim', allowPieces: true, seeds: [[943, 545], [969, 560], [918, 492], [928, 663]] },
    { id: 'footrest', name: 'Footrest', material: 'trim', allowPieces: true, seeds: [[1063, 611], [1046, 654]] },
    { id: 'swingarm', name: 'Swingarm', material: 'trim', seeds: [[1221, 671]] },
    { id: 'chain', name: 'Chain and guard', material: 'trim', allowPieces: true, seeds: [[1044, 539], [1031, 573], [1123, 581], [1159, 604], [1062, 688], [1116, 704], [1145, 702], [1172, 720], [1114, 729], [1088, 659], [1230, 562], [999, 710], [987, 734]] },
    { id: 'exhaust', name: 'Exhaust', material: 'trim', seeds: [[1009, 780]] },
    { id: 'stand', name: 'Stand', material: 'trim', allowPieces: true, seeds: [[966, 799], [921, 806], [963, 769], [1020, 946]] },
    { id: 'front-mudguard', name: 'Front mudguard', material: 'body', allowPieces: true, seeds: [[427, 564], [446, 514], [369, 536]] },
    { id: 'fork', name: 'Front fork', material: 'trim', allowPieces: true, seeds: [[467, 617], [442, 687], [508, 487], [523, 571], [526, 528], [541, 541], [543, 553], [550, 566], [556, 579]] },

    // ── Wheels (rims first: their lassos win over the tyres') ───────────────
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[330, 935], [357, 842], [419, 867], [500, 774]], within: [{ ellipse: [380, 745, 150, 200] }] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1343, 578], [1284, 753], [1215, 796], [1384, 596]], within: [{ ellipse: [1300, 686, 100, 168] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[202, 727]] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1119, 773]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
