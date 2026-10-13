/**
 * "Zenith GT" — colourable parts of assets/source/03-chevrolet-corvette-c8.png
 * (a mid-engine sports car; fictional name, no badges in the drawing).
 * The hood and nose are one surface in the drawing (no line between them).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only zenith-gt --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const ZENITH_GT_TRACE: TracedVehicleSpec = {
  id: 'zenith-gt',
  assetVersion: 1,
  source: 'assets/source/03-chevrolet-corvette-c8.png',
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
    { id: 'hood', name: 'Hood and nose', material: 'body', seeds: [[414, 461]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [[94, 480], [142, 436]] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[495, 450], [820, 450], [820, 560], [495, 560]] }] },
    { id: 'center-grille', name: 'Centre grille', material: 'trim', seeds: [[345, 660], [396, 690], [401, 708], [453, 669], [439, 719]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[20, 550], [138, 550], [138, 700], [20, 700]] }] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[715, 700]], within: [{ polygon: [[490, 595], [745, 595], [745, 738], [490, 738]] }] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[78, 688]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[197, 706]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[137, 728], [106, 728], [437, 756]] },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[690, 323]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[383, 330], [409, 362]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[970, 235]] },
    { id: 'pillar', name: 'Window pillar', material: 'body', seeds: [[934, 381]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1044, 299]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1155, 303]] },
    { id: 'rear-pillar', name: 'Rear pillar', material: 'body', seeds: [[1214, 328]] },
    { id: 'spoiler', name: 'Spoiler', material: 'body', seeds: [[1448, 304]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1485, 357]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1063, 364], [1090, 389]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[964, 387]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1034, 550]] },
    { id: 'door-vent', name: 'Door vent', material: 'trim', seeds: [[1165, 413]] },
    { id: 'side-intake', name: 'Side air intake', material: 'trim', seeds: [[1301, 507]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1370, 372]] },
    { id: 'fuel-cap', name: 'Fuel cap', material: 'trim', seeds: [[1292, 383]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[832, 801], [775, 796], [743, 781]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[835, 707]], within: [{ ellipse: [866, 660, 88, 150] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1356, 696]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [[1447, 559]], within: [{ ellipse: [1420, 575, 62, 125] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
