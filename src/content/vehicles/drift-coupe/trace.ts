/**
 * "Drift Coupe" — colourable parts of assets/source/05-drift-coupe.png.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only drift-coupe --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const DRIFT_COUPE_TRACE: TracedVehicleSpec = {
  id: 'drift-coupe',
  assetVersion: 1,
  source: 'assets/source/05-drift-coupe.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  absorbBelow: 900,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[444, 454], [657, 341]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[224, 398]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[75, 390], [190, 390], [190, 550], [75, 550]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[560, 490], [860, 470], [860, 600], [560, 620]] }] },
    // Bumper and right front fender are one area in the drawing (no line).
    { id: 'front-bumper', name: 'Front body', material: 'body', seeds: [[784, 706]] },
    { id: 'fog-light', name: 'Fog light', material: 'light', seeds: [[100, 678]] },
    { id: 'indicator', name: 'Indicator light', material: 'light', seeds: [[76, 610]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[356, 762]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[564, 766]] },
    { id: 'small-vent', name: 'Small air vent', material: 'trim', seeds: [[536, 694]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[876, 258]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[496, 262]] },
    // The drawing has no line between roof and rear fender: one part.
    { id: 'roof', name: 'Roof and rear fender', material: 'body', seeds: [[1404, 334]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1176, 530]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1176, 238]] },
    { id: 'rear-window', name: 'Rear side window', material: 'glass', seeds: [[1280, 246]] },
    { id: 'vent-window', name: 'Small front window', material: 'glass', seeds: [[1084, 338]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1172, 322], [1141, 367]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1135, 181]] },
    { id: 'side-scoop', name: 'Side air scoop', material: 'trim', seeds: [[1328, 474]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[1026, 672]], within: [{ ellipse: [948, 686, 70, 150] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[964, 518], [866, 720], [864, 858], [881, 595]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1452, 518, 40, 112] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1400, 630]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
