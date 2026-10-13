/**
 * "Pulse Hatch" — colourable parts of assets/source/06-pulse-hatch.png.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only pulse-hatch --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const PULSE_HATCH_TRACE: TracedVehicleSpec = {
  id: 'pulse-hatch',
  assetVersion: 1,
  source: 'assets/source/06-pulse-hatch.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  absorbBelow: 900,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[369, 465]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[833, 260]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[355, 292]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[45, 455], [160, 470], [160, 610], [40, 610]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[500, 540], [830, 540], [830, 650], [500, 650]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', seeds: [[178, 573], [290, 612]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[280, 647], [607, 713], [850, 565]] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [], within: [{ polygon: [[95, 675], [560, 700], [560, 865], [100, 855]] }] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [], within: [{ polygon: [[10, 620], [95, 640], [100, 830], [10, 830]] }] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [], within: [{ polygon: [[565, 720], [810, 720], [810, 880], [565, 880]] }] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[467, 886]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1011, 110]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[376, 314]] },
    { id: 'right-pillar', name: 'Right window pillar', material: 'trim', seeds: [[1029, 353]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1148, 132], [1231, 281], [1215, 283]] },
    { id: 'spoiler', name: 'Spoiler', material: 'body', seeds: [[1385, 110], [1343, 96]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1128, 241]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1282, 222]] },
    { id: 'quarter-window', name: 'Small window', material: 'glass', seeds: [[1366, 222]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1100, 339]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1059, 392]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1156, 535], [1217, 367]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1338, 428], [1376, 306]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1418, 260], [1441, 362], [1464, 404]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[964, 451], [941, 535]] },
    { id: 'lower-door', name: 'Lower door', material: 'body', seeds: [[1235, 638]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1319, 671]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[940, 903]], within: [{ ellipse: [940, 750, 100, 145] }] },
    // Tread ring and the sidewall left of the rim never touch in the drawing.
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[954, 602], [805, 839]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1460, 582, 46, 103] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1399, 685]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
