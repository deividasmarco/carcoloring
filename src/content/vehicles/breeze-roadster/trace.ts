/**
 * "Breeze Roadster" — colourable parts of assets/source/08-mazda-mx5.png
 * (a small open-top roadster; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only breeze-roadster --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const BREEZE_ROADSTER_TRACE: TracedVehicleSpec = {
  id: 'breeze-roadster',
  assetVersion: 1,
  source: 'assets/source/08-mazda-mx5.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[472, 422]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[702, 607]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [], within: [{ polygon: [[40, 440], [135, 440], [135, 538], [40, 538]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [], within: [{ polygon: [[535, 486], [762, 486], [762, 548], [535, 548]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', seeds: [[257, 610], [216, 652], [152, 669], [293, 703]] },
    { id: 'reflectors', name: 'Bumper lights', material: 'light', allowPieces: true, seeds: [[48, 653], [668, 683]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', allowPieces: true, seeds: [[115, 734], [479, 756], [679, 766]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[123, 770], [193, 777], [215, 755]], allowPieces: true },

    // ── Windshield and cabin ────────────────────────────────────────────────
    { id: 'windshield-frame', name: 'Windshield frame', material: 'body', seeds: [[1053, 341]] },
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[725, 274], [952, 254], [612, 254], [891, 253]] },
    { id: 'inside-mirror', name: 'Inside mirror', material: 'trim', seeds: [[840, 236]] },
    { id: 'seats', name: 'Seats', material: 'trim', allowPieces: true, seeds: [[843, 304], [891, 320], [791, 329], [946, 337], [1014, 320], [998, 341], [1129, 287]] },
    { id: 'dashboard', name: 'Dashboard', material: 'trim', seeds: [[739, 345]] },
    { id: 'roll-bar', name: 'Roll bar', material: 'trim', seeds: [[1190, 264], [1172, 291]] },
    { id: 'rear-deck', name: 'Rear deck', material: 'body', allowPieces: true, seeds: [[1265, 325], [1330, 325], [1241, 335]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[461, 322], [500, 327]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1162, 349], [1132, 395]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1086, 359], [1109, 348]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[960, 421]] },
    { id: 'side-marker', name: 'Side light', material: 'light', seeds: [[986, 476]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1187, 519]] },
    { id: 'door-handle', name: 'Door handle', material: 'trim', seeds: [[1308, 407]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1311, 649]] },
    { id: 'sill', name: 'Sill trim', material: 'trim', allowPieces: true, seeds: [[1243, 695], [1322, 701]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1383, 381]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1442, 368]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[867, 525], [739, 790]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[859, 582]], within: [{ ellipse: [867, 681, 92, 132] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1361, 702]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1427, 528], [1404, 681]], within: [{ ellipse: [1440, 600, 46, 112] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
