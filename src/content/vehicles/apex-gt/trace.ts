/**
 * "Apex GT" — colourable parts of assets/source/alpine-simple.png.
 *
 * Every region lists one seed point (source-image pixel) inside each white
 * area of the drawing that belongs to it. Areas not listed are scenery
 * (removed) unless they are enclosed by the car; enclosed, unlisted areas fail
 * the build unless tiny. Run `npm run build:regions -- --preview` after edits.
 */
import type { TracedVehicleSpec } from '../traceTypes';

export const APEX_GT_TRACE: TracedVehicleSpec = {
  id: 'apex-gt',
  // Version 1 = the geometry existing saved drawings were painted on.
  assetVersion: 1,
  source: 'assets/source/alpine-simple.png',
  ink: { white: 0.92, black: 0.3 },
  offset: { x: 28, y: -60 },
  // Authored directly in scene units (its saved strokes use them).
  placement: 'identity',
  absorbBelow: 420,
  // Close two small gaps where the windshield frame band (A-pillars + header)
  // meets the hood, so the frame is its own part instead of part of the hood.
  addLines: [
    { from: [400, 558.5], to: [401, 566.5], width: 3 },
    { from: [935, 560], to: [949.5, 560], width: 3 },
  ],
  cuts: [],
  seeThrough: [],
  regions: [
    // ── Front ───────────────────────────────────────────────────────────────
    { id: 'hood', name: 'Hood', material: 'body', seeds: [[387, 670], [332, 600]] },
    { id: 'front-body', name: 'Front body', material: 'body', seeds: [[753, 861]] },
    { id: 'front-bumper', name: 'Front bumper', material: 'body', seeds: [[370, 882]] },
    { id: 'front-splitter', name: 'Front splitter', material: 'trim', seeds: [[543, 930]] },
    { id: 'left-intake', name: 'Left air intake', material: 'trim', seeds: [[117, 854], [174, 881], [70, 881]] },
    { id: 'right-intake', name: 'Right air intake', material: 'trim', seeds: [[500, 873], [622, 893]] },
    { id: 'left-headlight', name: 'Left headlight', material: 'light', seeds: [[152, 646], [140, 686], [127, 710], [112, 740]] },
    { id: 'right-headlight', name: 'Right headlight', material: 'light', seeds: [[708, 770], [773, 684], [637, 721], [754, 727]] },
    { id: 'left-mirror', name: 'Left mirror', material: 'body', seeds: [[414, 518], [415, 549]] },

    // ── Glass and cabin ─────────────────────────────────────────────────────
    {
      id: 'windshield',
      name: 'Windshield',
      material: 'glass',
      // Glass, the drawn glare shape and the cabin seen through it.
      seeds: [[500, 546], [704, 483], [769, 482], [767, 537], [881, 457], [924, 516], [769, 445]],
    },
    { id: 'windshield-frame', name: 'Windshield frame', material: 'body', seeds: [[942, 555]] },
    { id: 'dashboard', name: 'Dashboard', material: 'trim', seeds: [[834, 562], [879, 533]] },
    { id: 'front-seat', name: 'Seat', material: 'trim', seeds: [[817, 490]] },
    { id: 'side-seat', name: 'Far seat', material: 'trim', seeds: [[1036, 497]] },
    { id: 'roof', name: 'Roof', material: 'body', seeds: [[990, 408]] },
    { id: 'window-frame', name: 'Window frame', material: 'body', seeds: [[1054, 427]] },
    { id: 'side-window', name: 'Side window', material: 'glass', seeds: [[1100, 469], [1017, 549]] },
    { id: 'rear-side-window', name: 'Rear side window', material: 'glass', seeds: [[1179, 493], [1218, 494]] },
    { id: 'right-mirror', name: 'Right mirror', material: 'body', seeds: [[1106, 526], [1086, 599]] },

    // ── Side and rear ───────────────────────────────────────────────────────
    { id: 'rear-pillar', name: 'Rear pillar', material: 'body', seeds: [[1246, 501]] },
    { id: 'engine-cover', name: 'Engine cover', material: 'body', seeds: [[1389, 542]] },
    { id: 'rear-wing', name: 'Rear wing', material: 'body', seeds: [[1434, 476], [1365, 493]] },
    { id: 'upper-door', name: 'Upper door', material: 'body', seeds: [[1235, 563], [1191, 534], [1051, 572]] },
    { id: 'door', name: 'Door', material: 'body', seeds: [[1137, 688]] },
    { id: 'lower-door', name: 'Lower door', material: 'body', seeds: [[1164, 769]] },
    { id: 'side-scoop', name: 'Side air scoop', material: 'trim', seeds: [[1292, 645]] },
    { id: 'lower-scoop', name: 'Lower scoop', material: 'body', seeds: [[1285, 791], [1249, 832]] },
    { id: 'rear-fender', name: 'Rear fender', material: 'body', seeds: [[1367, 624]] },
    { id: 'rear-skirt', name: 'Rear side skirt', material: 'body', seeds: [[1348, 763]] },
    { id: 'side-skirt', name: 'Side skirt', material: 'body', seeds: [[1088, 820]] },

    // ── Wheels ──────────────────────────────────────────────────────────────
    { id: 'front-arch', name: 'Front wheel arch', material: 'trim', seeds: [[841, 824], [882, 693], [869, 723], [816, 824]] },
    { id: 'front-arch-top', name: 'Upper wheel arch', material: 'trim', seeds: [[978, 641]] },
    { id: 'front-tire', name: 'Front tire', material: 'tire', seeds: [[912, 948]] },
    {
      id: 'front-wheel',
      name: 'Front wheel',
      material: 'rim',
      seeds: [[877, 834], [931, 795], [932, 703], [977, 772], [971, 841], [901, 871], [883, 770], [925, 928], [1003, 766], [1001, 840]],
    },
    { id: 'rear-arch', name: 'Rear wheel arch', material: 'trim', seeds: [[1453, 560]] },
    { id: 'rear-tire', name: 'Rear tire', material: 'tire', seeds: [[1447, 590], [1396, 824]] },
    {
      id: 'rear-wheel',
      name: 'Rear wheel',
      material: 'rim',
      seeds: [[1456, 622], [1466, 683], [1450, 657], [1480, 698], [1459, 721], [1455, 758], [1441, 789]],
    },
  ],
  // Soft contact shadows: tyres, front splitter and side skirt (source pixels).
  shadows: [
    { cx: 935, cy: 962, rx: 82, ry: 13, opacity: 0.6 },
    { cx: 1432, cy: 858, rx: 60, ry: 10, opacity: 0.55 },
    { cx: 330, cy: 922, rx: 280, ry: 22, opacity: 0.4 },
    { cx: 700, cy: 950, rx: 190, ry: 18, opacity: 0.4 },
    { cx: 1180, cy: 900, rx: 300, ry: 22, opacity: 0.35 },
  ],
  focusMargin: { x: 16, top: 14, bottom: 20 },
};
