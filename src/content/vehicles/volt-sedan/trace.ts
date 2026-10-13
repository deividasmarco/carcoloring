/**
 * "Volt Sedan" — colourable parts of assets/source/01-volt-sedan.png.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only volt-sedan --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const VOLT_SEDAN_TRACE: TracedVehicleSpec = {
  id: 'volt-sedan',
  assetVersion: 1,
  source: 'assets/source/01-volt-sedan.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  absorbBelow: 900,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[350, 420]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[750, 250], [915, 283]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1012, 160], [1040, 190]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[445, 307]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[175, 635], [750, 660]] },
    { id: 'grille', name: 'Grille', material: 'trim', seeds: [], within: [{ polygon: [[115, 500], [505, 525], [490, 625], [130, 610]] }] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[30, 465], [118, 490], [118, 560], [30, 560]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[495, 530], [790, 515], [790, 600], [495, 600]] }] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [[470, 775]], within: [{ polygon: [[110, 665], [450, 680], [470, 810], [110, 790]] }] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [], within: [{ polygon: [[10, 600], [110, 640], [110, 770], [10, 770]] }] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [], within: [{ polygon: [[500, 660], [745, 660], [745, 810], [500, 810]] }] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[830, 492]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1137, 540], [1131, 401]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1323, 470], [1317, 372]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1433, 333], [1497, 453]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1140, 265]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1275, 292]] },
    { id: 'quarter-window', name: 'Small window', material: 'glass', seeds: [[1350, 285]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1102, 333]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1230, 620], [1191, 682], [1141, 671], [1380, 669]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[536, 269]] },
    { id: 'right-pillar', name: 'Right window pillar', material: 'trim', seeds: [[1022, 286]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1198, 283], [1213, 284], [1116, 200]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [], within: [{ ellipse: [890, 712, 100, 158] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[794, 855], [886, 549], [803, 836]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1436, 572, 60, 120] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1420, 695]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
