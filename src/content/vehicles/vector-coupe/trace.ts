/**
 * "Vector Coupe" — colourable parts of assets/source/02-vector-coupe.png.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only vector-coupe --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const VECTOR_COUPE_TRACE: TracedVehicleSpec = {
  id: 'vector-coupe',
  assetVersion: 1,
  source: 'assets/source/02-vector-coupe.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  absorbBelow: 900,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[460, 380]] },
    { id: 'nose', name: 'Nose', material: 'body', seeds: [[232, 548]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[664, 760], [37, 769]] },
    { id: 'left-fender', name: 'Left fender', material: 'body', seeds: [[100, 464]] },
    { id: 'lower-grille', name: 'Grille', material: 'trim', seeds: [[460, 744], [128, 776]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [[76, 512]] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[772, 536], [818, 536], [683, 554]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [], within: [{ polygon: [[25, 595], [80, 600], [80, 690], [25, 690]] }] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[724, 692]] },
    { id: 'splitter', name: 'Front splitter', material: 'trim', seeds: [[748, 852]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[468, 280]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[872, 244]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1076, 152]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[485, 299]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1372, 266]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[1020, 424]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1180, 524]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1212, 224]] },
    { id: 'rear-window', name: 'Rear side window', material: 'glass', seeds: [[1316, 260]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1176, 296]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1392, 392]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1140, 640], [1332, 624], [1376, 596]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[972, 843]], within: [{ ellipse: [962, 692, 84, 150] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[864, 864]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1462, 542, 36, 108] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1412, 652]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
