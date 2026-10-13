/**
 * "Storm Sedan" — colourable parts of assets/source/01-bmw-m5-f90.png
 * (a performance saloon; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only storm-sedan --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const STORM_SEDAN_TRACE: TracedVehicleSpec = {
  id: 'storm-sedan',
  assetVersion: 1,
  source: 'assets/source/01-bmw-m5-f90.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[381, 441]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[719, 609]] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[132, 753]] },
    { id: 'grille-frame', name: 'Grille frame', material: 'trim', seeds: [[291, 535]] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[135, 500], [487, 500], [487, 615], [135, 615]] }] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[35, 460], [133, 460], [133, 565], [35, 565]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[495, 485], [780, 485], [780, 578], [495, 578]] }] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [[195, 682], [336, 742], [124, 711], [472, 743], [109, 704]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[52, 646], [63, 689], [72, 729], [29, 623]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[630, 639], [626, 681], [619, 725], [663, 667]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[147, 794]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[390, 319]] },

    // ── Glass, cabin and roof ───────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[748, 220], [581, 305], [644, 324], [801, 280], [890, 249], [955, 248], [977, 279]] },
    { id: 'seats', name: 'Seats', material: 'trim', allowPieces: true, seeds: [[735, 306], [920, 302], [846, 284], [1045, 296], [1208, 302], [1271, 331], [1205, 345]] },
    { id: 'dashboard', name: 'Dashboard', material: 'trim', seeds: [[873, 341], [788, 318]] },
    { id: 'inside-mirror', name: 'Inside mirror', material: 'trim', seeds: [[766, 248]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[507, 259]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[964, 184]] },
    { id: 'window-surround', name: 'Window surround', material: 'body', seeds: [[1407, 354]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1078, 245], [1086, 314]] },
    { id: 'middle-pillar', name: 'Middle pillar', material: 'trim', seeds: [[1157, 272], [1139, 316], [1113, 196], [1140, 196]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1197, 243]] },
    { id: 'quarter-window', name: 'Small window', material: 'glass', seeds: [[1314, 301]] },
    { id: 'window-trim', name: 'Window trim', material: 'trim', seeds: [[1256, 227], [1200, 362]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1036, 347], [1088, 375]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1003, 360], [1010, 378]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[880, 452]] },
    { id: 'fender-vent', name: 'Fender vent', material: 'trim', seeds: [[964, 464]] },
    { id: 'upper-front-door', name: 'Upper front door', material: 'body', seeds: [[1062, 416]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1100, 540]] },
    { id: 'front-handle', name: 'Front door handle', material: 'trim', seeds: [[1181, 425]] },
    { id: 'upper-rear-door', name: 'Upper rear door', material: 'body', seeds: [[1258, 386]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1290, 488]] },
    { id: 'rear-handle', name: 'Rear door handle', material: 'trim', seeds: [[1354, 397]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1448, 423]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1491, 486]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1488, 390]] },
    { id: 'door-sill', name: 'Door sill', material: 'body', seeds: [[1023, 675], [1223, 635]] },
    { id: 'sill-trim', name: 'Sill trim', material: 'trim', seeds: [[1000, 706], [1296, 640], [970, 712]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1314, 665]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[877, 527]] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[830, 854], [753, 835]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [], within: [{ ellipse: [845, 705, 85, 165] }] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1342, 604], [1428, 482]] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1333, 732], [1411, 502]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1415, 620, 50, 140] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
