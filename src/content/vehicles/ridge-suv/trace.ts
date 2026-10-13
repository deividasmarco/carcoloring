/**
 * "Ridge SUV" — colourable parts of assets/source/04-porsche-macan.png
 * (a sporty compact SUV; fictional name, no badges in the drawing).
 * The hood and front fenders are one surface in the drawing, and so are the
 * window surround and rear quarter.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only ridge-suv --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const RIDGE_SUV_TRACE: TracedVehicleSpec = {
  id: 'ridge-suv',
  assetVersion: 1,
  source: 'assets/source/04-porsche-macan.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[380, 426]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[567, 631]] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[779, 703]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[42, 358], [172, 358], [172, 474], [42, 474]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[588, 376], [832, 376], [832, 492], [588, 492]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[128, 512], [540, 512], [540, 628], [128, 628]] }] },
    { id: 'left-vent', name: 'Left air intake', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[18, 498], [124, 498], [124, 645], [18, 645]] }] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[542, 516], [772, 516], [772, 642], [542, 642]] }] },
    { id: 'lower-intake', name: 'Lower air intake', material: 'trim', allowPieces: true, seeds: [[225, 721], [450, 732], [134, 653], [153, 664], [45, 699], [567, 679], [695, 665]] },
    { id: 'fog-light', name: 'Fog light', material: 'light', seeds: [[710, 730]] },
    { id: 'side-marker', name: 'Side light', material: 'light', seeds: [[840, 518]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', allowPieces: true, seeds: [[427, 768], [740, 771], [770, 804]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[103, 794], [196, 824], [216, 793]], allowPieces: true },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[874, 220]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[378, 274]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[446, 236]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[997, 114]] },
    { id: 'roof-rails', name: 'Roof rails', material: 'trim', allowPieces: true, seeds: [[1035, 110], [630, 109], [668, 102], [1125, 130], [1155, 131]] },
    { id: 'window-surround', name: 'Window surround and rear', material: 'body', seeds: [[1442, 356]] },
    { id: 'pillar', name: 'Window pillar', material: 'trim', allowPieces: true, seeds: [[964, 284], [1032, 232]] },
    { id: 'window-trim', name: 'Window trim', material: 'trim', seeds: [[1170, 303]] },
    { id: 'front-window', name: 'Front window', material: 'glass', allowPieces: true, seeds: [[1104, 199], [1022, 309]] },
    { id: 'middle-pillar', name: 'Middle pillar', material: 'trim', allowPieces: true, seeds: [[1188, 306], [1204, 302]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1254, 255]] },
    { id: 'rear-pillar', name: 'Rear pillar', material: 'trim', seeds: [[1329, 287]] },
    { id: 'quarter-window', name: 'Back window', material: 'glass', seeds: [[1352, 273]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1091, 280]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1061, 341]] },
    { id: 'front-flare', name: 'Front wheel arch', material: 'body', seeds: [[939, 457]] },
    { id: 'fender-side', name: 'Front fender side', material: 'body', seeds: [[1010, 453]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1130, 494]] },
    { id: 'front-handle', name: 'Front door handle', material: 'trim', seeds: [[1186, 404]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1313, 458]] },
    { id: 'rear-handle', name: 'Rear door handle', material: 'trim', seeds: [[1363, 381]] },
    { id: 'door-trim', name: 'Door trim', material: 'trim', allowPieces: true, seeds: [[1200, 635], [1284, 618]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1326, 674], [1321, 705]] },
    { id: 'rear-flare', name: 'Rear wheel arch', material: 'body', seeds: [[1450, 459]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[879, 869], [792, 841], [949, 500], [867, 537]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[858, 672], [932, 839]], within: [{ ellipse: [920, 699, 88, 141] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1426, 770], [1350, 741]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1469, 601]], within: [{ ellipse: [1442, 628, 48, 116] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
