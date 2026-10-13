/**
 * "Zip Hatch" — colourable parts of assets/source/07-volkswagen-golf-gti.png
 * (a sporty five-door hatchback; fictional name, no badges in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only zip-hatch --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const ZIP_HATCH_TRACE: TracedVehicleSpec = {
  id: 'zip-hatch',
  assetVersion: 1,
  source: 'assets/source/07-volkswagen-golf-gti.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[384, 435]] },
    { id: 'fender-top', name: 'Fender top', material: 'body', seeds: [[657, 480]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[725, 621]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [[105, 474]], within: [{ polygon: [[45, 466], [140, 466], [140, 562], [45, 562]] }] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[626, 564]], within: [{ polygon: [[480, 494], [792, 494], [792, 586], [480, 586]] }] },
    { id: 'grille-bar', name: 'Grille light bar', material: 'trim', allowPieces: true, seeds: [[186, 521], [236, 543]] },
    { id: 'grille-frame', name: 'Grille frame', material: 'trim', seeds: [[687, 736]] },
    { id: 'lower-grille', name: 'Honeycomb grille', material: 'trim', allowPieces: true, seeds: [], within: [{ polygon: [[26, 626], [730, 626], [730, 772], [26, 772]] }] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[139, 789], [205, 794]], allowPieces: true },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[767, 271]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[345, 325]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[497, 233]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[971, 165]] },
    { id: 'spoiler', name: 'Roof spoiler', material: 'body', seeds: [[1368, 201]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1091, 261]] },
    { id: 'middle-pillar', name: 'Middle pillar', material: 'trim', seeds: [[1182, 340], [1191, 307]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1250, 281]] },
    { id: 'quarter-window', name: 'Back window', material: 'glass', seeds: [[1340, 296]] },
    { id: 'window-trim', name: 'Window trim', material: 'trim', allowPieces: true, seeds: [[1368, 300], [1037, 212], [908, 345], [1110, 365]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1040, 344]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', seeds: [[970, 366], [1023, 386], [1009, 398]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[933, 454]] },
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[901, 538]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1089, 531]] },
    { id: 'front-handle', name: 'Front door handle', material: 'trim', seeds: [[1175, 421]] },
    { id: 'lower-front-door', name: 'Lower front door', material: 'body', seeds: [[1204, 663]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1306, 469]] },
    { id: 'rear-handle', name: 'Rear door handle', material: 'trim', seeds: [[1353, 389]] },
    { id: 'lower-rear-door', name: 'Lower rear door', material: 'body', seeds: [[1255, 613], [1309, 640]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1339, 663]] },
    { id: 'rear-quarter', name: 'Rear quarter', material: 'body', seeds: [[1437, 405]] },
    { id: 'rear-corner', name: 'Rear corner', material: 'body', seeds: [[1487, 462]] },
    { id: 'tail-light', name: 'Tail light', material: 'light', seeds: [[1480, 385]] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1442, 485]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[836, 846], [760, 828]], allowPieces: true },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[919, 664], [810, 678]], within: [{ ellipse: [865, 710, 82, 142] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1416, 744], [1348, 714]], allowPieces: true },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1461, 594]], within: [{ ellipse: [1430, 630, 50, 116] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
