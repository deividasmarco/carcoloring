/**
 * "Rumble V8" — colourable parts of assets/source/04-dodge-challenger.png
 * (a widebody muscle coupe; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only rumble-v8 --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const RUMBLE_V8_TRACE: TracedVehicleSpec = {
  id: 'rumble-v8',
  assetVersion: 1,
  source: 'assets/source/04-dodge-challenger.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[725, 409]] },
    { id: 'hood-scoop', name: 'Hood scoop', material: 'trim', seeds: [[316, 392]], within: [{ polygon: [[300, 368], [560, 368], [560, 408], [300, 408]] }] },
    { id: 'front', name: 'Front', material: 'body', seeds: [[756, 615]] },
    { id: 'left-headlights', name: 'Left headlights', material: 'light', seeds: [], within: [{ polygon: [[45, 460], [192, 460], [192, 528], [45, 528]] }] },
    { id: 'right-headlights', name: 'Right headlights', material: 'light', seeds: [], within: [{ polygon: [[594, 476], [762, 476], [762, 548], [594, 548]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[193, 468], [592, 468], [592, 540], [193, 540]] }] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[60, 622], [735, 622], [735, 728], [60, 728]] }] },
    { id: 'side-marker', name: 'Side light', material: 'light', seeds: [[824, 504]] },
    { id: 'bumper-corner', name: 'Bumper corner', material: 'body', seeds: [[828, 681]] },
    { id: 'front-lip', name: 'Front lip', material: 'trim', seeds: [[823, 763]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[70, 721]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[172, 771], [248, 775]], allowPieces: true },

    // ── Glass, cabin and roof ───────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[651, 268], [893, 260], [788, 207]] },
    { id: 'inside-mirror', name: 'Inside mirror', material: 'trim', seeds: [[821, 229]] },
    { id: 'seats', name: 'Seats', material: 'trim', allowPieces: true, seeds: [[791, 295], [1001, 309], [1105, 317]] },
    { id: 'dashboard', name: 'Dashboard', material: 'trim', seeds: [[936, 322]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[447, 298]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[616, 196]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[1012, 176]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', seeds: [[1159, 204], [1203, 204]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1160, 253]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1269, 283]] },
    { id: 'rear-quarter', name: 'Rear quarter', material: 'body', seeds: [[1333, 337]] },
    { id: 'fuel-cap', name: 'Fuel cap', material: 'trim', seeds: [[1399, 323]] },
    { id: 'spoiler', name: 'Spoiler', material: 'body', seeds: [[1438, 286]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1162, 315]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[1127, 366]] },
    { id: 'front-flare', name: 'Front wheel flare', material: 'body', seeds: [[938, 444]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[1059, 462]] },
    { id: 'upper-door', name: 'Upper door', material: 'body', seeds: [[1224, 382]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1187, 532]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1093, 695], [1315, 640]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1334, 422]] },
    { id: 'rear-flare', name: 'Rear wheel flare', material: 'body', seeds: [[1418, 388]] },
    { id: 'rear-corner', name: 'Rear corner', material: 'body', seeds: [[1482, 379]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[965, 521], [846, 802], [1033, 547]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[974, 746], [1014, 696]], within: [{ ellipse: [950, 673, 78, 130] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1427, 459], [1359, 677], [1463, 458]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1432, 564], [1446, 510]], within: [{ ellipse: [1431, 578, 36, 100] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
