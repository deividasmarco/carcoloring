/**
 * "Sprint Coupe" — colourable parts of assets/source/05-porsche-718-cayman.png
 * (a mid-engine sports coupe; fictional name, no badges in the drawing).
 * Bumper, fenders, roof and rear quarter are one surface in the drawing (no
 * lines between them), so they form one "Body" part.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only sprint-coupe --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const SPRINT_COUPE_TRACE: TracedVehicleSpec = {
  id: 'sprint-coupe',
  assetVersion: 1,
  source: 'assets/source/05-porsche-718-cayman.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  strictBackground: true,
  absorbBelow: 300,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'body', name: 'Body', material: 'body', seeds: [[745, 582]] },
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[432, 442]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[60, 398], [162, 398], [162, 528], [60, 528]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[571, 529]], within: [{ ellipse: [690, 475, 118, 66] }] },
    { id: 'left-indicator', name: 'Left indicator', material: 'light', seeds: [[61, 596]] },
    { id: 'right-indicator', name: 'Right indicator', material: 'light', seeds: [[645, 618]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[120, 638], [67, 656], [93, 687]] },
    { id: 'center-grille', name: 'Centre grille', material: 'trim', seeds: [[297, 686]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[471, 656], [636, 684], [618, 713], [463, 669]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[169, 759]] },

    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[802, 273]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[407, 320]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[574, 219]] },
    { id: 'pillar', name: 'Window pillar', material: 'trim', seeds: [[967, 361]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1108, 206]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1146, 263], [1024, 354]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1245, 295]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1104, 332], [1058, 379]] },

    { id: 'door', name: 'Door', material: 'body', seeds: [[1110, 548]] },
    { id: 'side-panel', name: 'Side panel', material: 'body', seeds: [[1321, 623]] },
    { id: 'side-intake', name: 'Side air intake', material: 'trim', seeds: [], within: [{ polygon: [[1248, 438], [1338, 438], [1338, 602], [1248, 602]] }] },

    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[807, 793], [925, 480]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [[949, 615]], within: [{ ellipse: [893, 653, 76, 138] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1365, 704], [1449, 430]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [[1396, 558]], within: [{ ellipse: [1435, 580, 60, 130] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
