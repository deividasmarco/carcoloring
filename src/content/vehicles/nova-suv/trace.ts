/**
 * "Nova SUV" — colourable parts of assets/source/04-nova-suv.png.
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only nova-suv --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const NOVA_SUV_TRACE: TracedVehicleSpec = {
  id: 'nova-suv',
  assetVersion: 1,
  source: 'assets/source/04-nova-suv.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 0, y: 0 },
  placement: 'stage',
  absorbBelow: 900,
  addLines: [],
  cuts: [],
  seeThrough: [],
  regions: [
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[412, 411]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[902, 218]] },
    // The drawing has no line between roof and rear fender: one part.
    { id: 'roof', name: 'Roof and rear fender', material: 'body', seeds: [[828, 95], [690, 85]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[451, 244]] },
    { id: 'right-pillar', name: 'Right window pillar', material: 'trim', seeds: [[991, 301]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1177, 118], [1221, 269], [1239, 284], [1056, 307], [1141, 318]] },
    { id: 'rear-pillar', name: 'Rear window pillar', material: 'trim', seeds: [[1344, 263]] },
    { id: 'roof-rail', name: 'Roof rail', material: 'trim', seeds: [[1095, 86]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[408, 257]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[40, 360], [160, 360], [165, 505], [40, 505]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[815, 442]], within: [{ polygon: [[545, 420], [860, 400], [860, 520], [545, 545]] }] },
    { id: 'nose', name: 'Front bumper', material: 'body', seeds: [[496, 551]] },
    { id: 'grille', name: 'Grille', material: 'trim', seeds: [], within: [{ polygon: [[95, 570], [598, 575], [598, 720], [60, 720]] }] },
    { id: 'left-vent', name: 'Left air vent', material: 'trim', seeds: [], within: [{ polygon: [[15, 520], [110, 520], [110, 690], [15, 690]] }] },
    { id: 'right-vent', name: 'Right air vent', material: 'trim', seeds: [], within: [{ polygon: [[605, 575], [800, 575], [800, 720], [605, 720]] }] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', seeds: [], within: [{ polygon: [[40, 712], [640, 722], [640, 800], [40, 800]] }] },
    { id: 'lower-bumper', name: 'Lower bumper', material: 'body', seeds: [[635, 820], [555, 811]] },
    { id: 'lower-bumper-left', name: 'Lower bumper left', material: 'body', seeds: [[443, 803]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[500, 840]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[210, 832]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[999, 389]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1139, 490]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1336, 437], [1284, 525]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1301, 617], [1253, 635], [1354, 639], [1256, 614], [1246, 659]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1143, 192]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1288, 235]] },
    { id: 'quarter-window', name: 'Small window', material: 'glass', seeds: [[1372, 240]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1126, 275]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1095, 336]] },
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[972, 485]] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1459, 367], [1459, 393]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', seeds: [], within: [{ ellipse: [942, 727, 88, 145] }] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[915, 906], [930, 884], [840, 863], [815, 871], [785, 872], [1015, 645]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', seeds: [], within: [{ ellipse: [1459, 565, 44, 128] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1446, 709], [1397, 659], [1378, 658], [1359, 666]] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
