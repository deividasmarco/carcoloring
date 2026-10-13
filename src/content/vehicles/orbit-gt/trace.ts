/**
 * "Orbit GT" — colourable parts of assets/source/03-orbit-gt.png.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only orbit-gt --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const ORBIT_GT_TRACE: TracedVehicleSpec = {
  id: 'orbit-gt',
  assetVersion: 1,
  source: 'assets/source/03-orbit-gt.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  absorbBelow: 900,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[414, 553], [574, 372]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[254, 420]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ ellipse: [135, 491, 85, 95] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[768, 494]], within: [{ ellipse: [690, 560, 95, 90] }] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[246, 684]] },
    { id: 'left-indicator', name: 'Left indicator light', material: 'light', seeds: [[53, 655]] },
    { id: 'left-fog-light', name: 'Left fog light', material: 'light', seeds: [[94, 745], [35, 701]] },
    { id: 'right-indicator', name: 'Right indicator light', material: 'light', seeds: [[574, 725], [697, 717], [736, 703]] },
    { id: 'air-intake', name: 'Air intake', material: 'trim', seeds: [[369, 790]] },
    { id: 'center-intake', name: 'Small air intake', material: 'trim', seeds: [], within: [{ polygon: [[455, 760], [630, 760], [630, 840], [455, 840]] }] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[246, 831]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[492, 299]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[908, 262]] },
    // The drawing has no line between roof and rear fender: one part.
    { id: 'roof', name: 'Roof and rear fender', material: 'body', seeds: [[1150, 143]] },
    { id: 'windshield-frame', name: 'Windshield frame', material: 'trim', seeds: [[1061, 201], [948, 383]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1266, 315]] },
    { id: 'right-fender', name: 'Right fender', material: 'body', seeds: [[847, 491]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1191, 508]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1183, 245]] },
    { id: 'vent-window', name: 'Small front window', material: 'glass', seeds: [[1101, 307]] },
    { id: 'rear-window', name: 'Rear side window', material: 'glass', seeds: [[1297, 282]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1150, 352], [1105, 397]] },
    { id: 'spoiler', name: 'Spoiler', material: 'body', seeds: [[1416, 290]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1502, 454]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1342, 606], [1368, 668], [1336, 648]] },
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[976, 502]] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1452, 444]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [], within: [{ ellipse: [949, 720, 102, 152] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[892, 893], [825, 884]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1437, 552, 41, 98] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1392, 639]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
