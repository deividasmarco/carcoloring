/**
 * "Ember GT" — colourable parts of assets/source/02-ferrari-488.png
 * (a mid-engine supercar; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only ember-gt --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const EMBER_GT_TRACE: TracedVehicleSpec = {
  id: 'ember-gt',
  assetVersion: 1,
  source: 'assets/source/02-ferrari-488.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[428, 453]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[213, 420]] },
    { id: 'right-fender', name: 'Right fender', material: 'body', seeds: [[737, 459]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[802, 670]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[50, 400], [175, 400], [175, 560], [50, 560]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[580, 440], [860, 440], [860, 610], [580, 610]] }] },
    { id: 'grille-frame', name: 'Grille frame', material: 'trim', seeds: [[377, 697]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[85, 666]] },
    { id: 'center-grille', name: 'Centre grille', material: 'trim', seeds: [[268, 709]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[619, 707], [740, 761]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[185, 748], [27, 716], [228, 723]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[841, 302]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[383, 326], [392, 354]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1029, 211]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1069, 221]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1107, 290]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1224, 285]] },
    { id: 'rear-pillar', name: 'Rear pillar', material: 'body', seeds: [[1290, 287]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1153, 362], [1171, 393]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1033, 387]] },
    { id: 'wheel-arch', name: 'Front wheel arch', material: 'body', seeds: [[935, 423]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1159, 562]] },
    { id: 'door-scoop', name: 'Door scoop', material: 'body', seeds: [[1230, 443]] },
    { id: 'side-intake', name: 'Side air intake', material: 'trim', seeds: [[1273, 359], [1308, 336], [1314, 371], [1374, 309]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1358, 495]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1354, 576]] },
    { id: 'sill', name: 'Door sill', material: 'trim', seeds: [[1087, 696]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[934, 803], [939, 477], [878, 788], [853, 794]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[959, 643]], within: [{ ellipse: [975, 648, 85, 150] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1416, 650], [1378, 656], [1354, 659]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [], within: [{ ellipse: [1452, 530, 58, 135] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
