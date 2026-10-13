/** Shared layout constants for the neon garage scene (artwork units, 1600×1000 frame). */
export const SCENE_COLORS = {
  wallTop: '#04060B',
  wallMid: '#0A0F1C',
  wallBottom: '#111829',
  floorFar: '#0D1220',
  floorNear: '#05070C',
  skyTop: '#0A1328',
  skyBottom: '#1A2950',
  skyline: '#060A15',
  steel: '#1A2131',
  cyan: '#22E4FF',
  magenta: '#FF3D9A',
  amber: '#FFB23E',
} as const;

export const SCENE_LAYOUT = {
  frame: { width: 1600, height: 1000 },
  /** Area the background is drawn into, far beyond the frame. */
  bleed: { x: -2600, y: -2600, width: 6800, height: 6800 },
  floorY: 600,
  window: { x: 70, y: 140, width: 640, height: 400 },
  ceiling: { x: 260, y: 44, width: 1080 },
  tubes: [
    { x: 1150, y1: 150, y2: 560 },
    { x: 1500, y1: 150, y2: 560 },
  ],
  emblem: { x: 1330, y: 280, s: 1 },
  turntable: { cx: 800, cy: 852, rx: 790, ry: 112 },
  underglow: { cx: 780, cy: 866, rx: 640, ry: 52 },
  /**
   * Where cars stand (scene units). Vehicles with placement 'stage' are scaled
   * to fit maxWidth × maxHeight and centred on centerX, tyres on groundY.
   */
  carStage: { centerX: 800, groundY: 906, maxWidth: 1450, maxHeight: 700 },
} as const;
