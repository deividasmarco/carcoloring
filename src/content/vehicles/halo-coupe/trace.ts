/**
 * "Halo Coupe" — colourable parts of assets/source/10-toyota-supra.png
 * (a curvy sports coupe; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only halo-coupe --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const HALO_COUPE_TRACE: TracedVehicleSpec = {
  id: 'halo-coupe',
  assetVersion: 1,
  source: 'assets/source/10-toyota-supra.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[472, 411]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[188, 426]] },
    { id: 'right-fender', name: 'Right fender', material: 'body', seeds: [[836, 433]] },
    { id: 'nose', name: 'Nose', material: 'body', seeds: [[279, 528]] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[508, 683]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[48, 452], [208, 452], [208, 552], [48, 552]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[540, 468], [805, 468], [805, 548], [540, 548]] }] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[95, 619], [132, 670], [144, 713], [46, 690]] },
    { id: 'center-grille', name: 'Centre grille', material: 'trim', seeds: [[261, 663]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[586, 636]] },
    { id: 'side-vent', name: 'Side vent', material: 'trim', seeds: [[742, 594]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[128, 767], [203, 772]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[909, 278]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[447, 317], [416, 340]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[475, 335]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1037, 197]] },
    { id: 'pillar', name: 'Window pillar', material: 'body', seeds: [[1036, 330]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1100, 205], [1106, 231]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1231, 287]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1291, 306]] },
    { id: 'spoiler', name: 'Spoiler', material: 'body', seeds: [[1399, 341]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1137, 321], [1170, 356], [1189, 369]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1092, 366], [1069, 340]] },
    { id: 'fender-side', name: 'Front fender side', material: 'body', seeds: [[1035, 493]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1164, 522]] },
    { id: 'door-handle', name: 'Door handle', material: 'trim', seeds: [[1285, 427]] },
    { id: 'door-scoop', name: 'Door scoop', material: 'body', seeds: [[1183, 629], [1289, 522]] },
    { id: 'lower-side', name: 'Lower side', material: 'body', seeds: [[1291, 657]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1345, 683]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1399, 404]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1514, 585]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[933, 466], [861, 524]], allowPieces: true },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1495, 455], [1458, 459]], allowPieces: true },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[877, 822], [796, 806], [945, 489]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[981, 631]], within: [{ ellipse: [914, 670, 88, 138] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1382, 728]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [[1448, 587]], within: [{ ellipse: [1445, 611, 48, 120] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
