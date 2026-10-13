/**
 * "Boulder 4x4" — colourable parts of assets/source/05-toyota-land-cruiser.png
 * (a boxy off-road SUV; fictional name, no badges or lettering in the drawing).
 * Seeds and lassos are source-image pixels. Run
 * `npm run build:regions -- --only boulder-4x4 --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const BOULDER_4X4_TRACE: TracedVehicleSpec = {
  id: 'boulder-4x4',
  assetVersion: 1,
  source: 'assets/source/05-toyota-land-cruiser.png',
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
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[426, 379]] },
    { id: 'fender-top', name: 'Fender top', material: 'body', seeds: [[606, 384]] },
    { id: 'grille-surround', name: 'Grille surround', material: 'body', seeds: [[140, 429]] },
    { id: 'left-headlights', name: 'Left headlights', material: 'light', seeds: [], within: [{ polygon: [[36, 425], [116, 425], [116, 512], [36, 512]] }] },
    { id: 'right-headlights', name: 'Right headlights', material: 'light', seeds: [], within: [{ polygon: [[472, 422], [658, 422], [658, 522], [472, 522]] }] },
    { id: 'grille', name: 'Grille', material: 'trim', allowPieces: true, seeds: [[137, 522]], within: [{ polygon: [[117, 436], [471, 436], [471, 530], [117, 530]] }] },
    { id: 'bumper-bar', name: 'Bumper bar', material: 'body', seeds: [[317, 570]] },
    { id: 'left-corner', name: 'Left bumper corner', material: 'body', seeds: [[58, 555], [50, 673], [96, 541]] },
    { id: 'front-corner', name: 'Right bumper corner', material: 'body', seeds: [[594, 574]] },
    { id: 'bumper-side', name: 'Bumper side', material: 'body', seeds: [[621, 699], [429, 625], [472, 653]] },
    { id: 'fog-light', name: 'Side light', material: 'light', allowPieces: true, seeds: [[531, 619], [513, 614], [93, 643]] },
    { id: 'lower-grille', name: 'Lower grille', material: 'trim', allowPieces: true, seeds: [[149, 668]], within: [{ polygon: [[100, 595], [410, 595], [410, 692], [100, 692]] }] },
    { id: 'skid-plate', name: 'Skid plate', material: 'trim', allowPieces: true, seeds: [[278, 707], [232, 718], [330, 721]] },
    { id: 'lower-lip', name: 'Lower lip', material: 'trim', allowPieces: true, seeds: [[207, 753], [629, 755], [91, 742]] },
    { id: 'left-tire', name: 'Left front tire', material: 'tire', seeds: [[102, 794], [195, 839], [188, 789]], allowPieces: true },

    // ── Glass and roof ──────────────────────────────────────────────────────
    { id: 'windshield', name: 'Windshield', material: 'glass', seeds: [[813, 259]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[372, 323], [382, 301]] },
    { id: 'left-pillar', name: 'Left window pillar', material: 'trim', seeds: [[485, 220]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[870, 158]] },
    { id: 'roof-rails', name: 'Roof rails', material: 'trim', allowPieces: true, seeds: [[1002, 138], [1030, 134], [1063, 130], [1057, 141], [1324, 151], [658, 143]] },
    { id: 'window-surround', name: 'Window surround', material: 'body', seeds: [[958, 174]] },
    { id: 'pillar', name: 'Window pillar', material: 'trim', seeds: [[901, 299]] },
    { id: 'front-window', name: 'Front window', material: 'glass', seeds: [[1019, 238]] },
    { id: 'middle-pillar', name: 'Middle pillars', material: 'trim', allowPieces: true, seeds: [[1116, 346], [1129, 322], [1266, 324]] },
    { id: 'rear-window', name: 'Rear window', material: 'glass', seeds: [[1177, 246]] },
    { id: 'back-window', name: 'Back window', material: 'glass', seeds: [[1339, 285]] },
    { id: 'window-frame', name: 'Window frame', material: 'trim', allowPieces: true, seeds: [[1400, 337], [1376, 217], [1049, 362]] },
    { id: 'rear-panel', name: 'Rear side panel', material: 'body', seeds: [[1437, 345]] },

    // ── Side ────────────────────────────────────────────────────────────────
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[998, 331], [994, 297]] },
    { id: 'mirror-base', name: 'Mirror base', material: 'trim', allowPieces: true, seeds: [[1020, 391], [987, 385], [949, 392], [937, 358]] },
    { id: 'front-fender', name: 'Front fender', material: 'body', seeds: [[702, 454]] },
    { id: 'front-flare', name: 'Front wheel flare', material: 'body', seeds: [[775, 489]] },
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[862, 533]] },
    { id: 'front-door', name: 'Front door', material: 'body', seeds: [[1051, 535]] },
    { id: 'rear-door', name: 'Rear door', material: 'body', seeds: [[1224, 488]] },
    { id: 'door-handles', name: 'Door handles', material: 'trim', allowPieces: true, seeds: [[1132, 433], [1286, 428]] },
    { id: 'rear-quarter', name: 'Rear quarter', material: 'body', seeds: [[1361, 407]] },
    { id: 'fuel-cap', name: 'Fuel cap', material: 'trim', seeds: [[1412, 414]] },
    { id: 'side-cladding', name: 'Side cladding', material: 'body', seeds: [[1332, 490]] },
    { id: 'door-sill', name: 'Door sill', material: 'body', seeds: [[979, 664], [1222, 651]] },
    { id: 'side-step', name: 'Side step', material: 'trim', seeds: [[1084, 713]] },
    { id: 'rear-flare', name: 'Rear wheel flare', material: 'body', seeds: [[1368, 479]] },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', allowPieces: true, seeds: [[1405, 530], [1449, 649]] },
    { id: 'rear-bumper', name: 'Rear bumper', material: 'body', seeds: [[1492, 569]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-tire', name: 'Front tire', material: 'tire', allowPieces: true, seeds: [[686, 794], [794, 867]] },
    { id: 'front-wheel', name: 'Front wheel', material: 'rim', allowPieces: true, seeds: [[770, 709]], within: [{ ellipse: [818, 723, 70, 114] }] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', allowPieces: true, seeds: [[1266, 752], [1359, 821]] },
    { id: 'rear-wheel', name: 'Rear wheel', material: 'rim', allowPieces: true, seeds: [[1337, 686]], within: [{ ellipse: [1370, 696, 50, 96] }] },
  ],
  shadows: 'auto',
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
