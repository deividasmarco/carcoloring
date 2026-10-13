/**
 * "Circuit Coupe" — colourable parts of assets/source/03-porsche-911-992.png
 * (a rear-engine sports coupe; fictional name, no badges in the drawing).
 * The hood and the right front fender are one surface in the drawing.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only circuit-coupe --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const CIRCUIT_COUPE_TRACE: TracedVehicleSpec = {
  id: 'circuit-coupe',
  assetVersion: 1,
  source: 'assets/source/03-porsche-911-992.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[400, 461]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[238, 403]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ circle: [152, 462, 62] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[651, 537]], within: [{ ellipse: [733, 487, 92, 70] }] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[784, 619]] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[475, 729]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [], within: [{ polygon: [[30, 595], [135, 595], [135, 712], [30, 712]] }] },
    { id: 'center-grille', name: 'Centre grille', material: 'trim', seeds: [], within: [{ polygon: [[138, 645], [462, 645], [462, 745], [138, 745]] }] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [], within: [{ polygon: [[495, 628], [748, 628], [748, 748], [495, 748]] }] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[675, 775]] },
    { id: 'side-marker', name: 'Side light', material: 'light', seeds: [[814, 545]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[793, 284]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[459, 317], [445, 345]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[600, 233]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1011, 189]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1130, 266]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1258, 301]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1198, 230]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1138, 337]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1158, 516]] },
    { id: 'door-handle', name: 'Door handle', material: 'trim', seeds: [[1276, 432]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1345, 390]] },
    { id: 'rear-corner', name: 'Rear corner', material: 'body', seeds: [[1482, 429]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1341, 668], [1363, 690]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[994, 618], [836, 802], [961, 480]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [], within: [{ ellipse: [937, 650, 92, 172] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1412, 694], [1443, 417]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [[1400, 548]], within: [{ ellipse: [1430, 570, 58, 132] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
