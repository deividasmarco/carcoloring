/**
 * "Neon bay" night garage — original procedural artwork.
 *
 * Drawn in artwork units for a 1600×1000 frame, with the wall and floor
 * extended far beyond it so any screen aspect ratio is filled without
 * letterboxing. Static; animated light lives in `effects.tsx`.
 */
import {
  BlendMode,
  BlurStyle,
  ClipOp,
  PaintStyle,
  Skia,
  StrokeCap,
  TileMode,
  type SkCanvas,
  type SkPaint,
} from '@shopify/react-native-skia';
import { SCENE_COLORS as C, SCENE_LAYOUT as L } from './layout';

const pt = (x: number, y: number) => Skia.Point(x, y);
const cols = (...c: string[]) => c.map((x) => Skia.Color(x));

function paint(color: string, alpha = 1, blur = 0, blend?: BlendMode): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  p.setAlphaf(alpha);
  if (blur > 0) p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
  if (blend !== undefined) p.setBlendMode(blend);
  return p;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawWall(canvas: SkCanvas) {
  const { bleed, floorY } = L;
  const wall = Skia.Paint();
  wall.setShader(
    Skia.Shader.MakeLinearGradient(pt(0, -200), pt(0, floorY), cols(C.wallTop, C.wallMid, C.wallBottom), [0, 0.55, 1], TileMode.Clamp),
  );
  canvas.drawRect(Skia.XYWHRect(bleed.x, bleed.y, bleed.width, floorY - bleed.y), wall);

  // Vertical wall panels.
  const seam = paint('#1A2438', 0.55);
  seam.setStyle(PaintStyle.Stroke);
  seam.setStrokeWidth(2);
  for (let x = 0; x > bleed.x; x -= 160) canvas.drawLine(x, bleed.y, x, floorY, seam);
  for (let x = 160; x < bleed.x + bleed.width; x += 160) canvas.drawLine(x, bleed.y, x, floorY, seam);

  // Skirting light where the wall meets the floor.
  canvas.drawRect(Skia.XYWHRect(bleed.x, floorY - 3, bleed.width, 3), paint('#22304A', 0.9));
}

function drawWindow(canvas: SkCanvas) {
  const w = L.window;
  const r = rng(42);
  const glass = Skia.PathBuilder.Make().addRect(Skia.XYWHRect(w.x, w.y, w.width, w.height)).build();

  canvas.save();
  canvas.clipPath(glass, ClipOp.Intersect, true);
  // Night sky and haze.
  const sky = Skia.Paint();
  sky.setShader(Skia.Shader.MakeLinearGradient(pt(0, w.y), pt(0, w.y + w.height), cols(C.skyTop, C.skyBottom), null, TileMode.Clamp));
  canvas.drawRect(Skia.XYWHRect(w.x, w.y, w.width, w.height), sky);

  // Distant city lights (bokeh), mostly cool with a few warm and magenta.
  const bokehColors = [C.cyan, C.cyan, '#7FA8FF', C.amber, C.magenta, '#A9C4FF'];
  for (let i = 0; i < 26; i++) {
    const x = w.x + r() * w.width;
    const y = w.y + w.height * (0.35 + r() * 0.5);
    const rad = 6 + r() * 16;
    canvas.drawCircle(x, y, rad, paint(bokehColors[i % bokehColors.length], 0.12 + r() * 0.2, rad * 0.45));
  }
  // Skyline silhouettes with a few lit windows.
  let x = w.x - 20;
  while (x < w.x + w.width) {
    const bw = 50 + r() * 90;
    const bh = 90 + r() * 170;
    const top = w.y + w.height - bh;
    canvas.drawRect(Skia.XYWHRect(x, top, bw, bh), paint(C.skyline));
    for (let i = 0; i < 6; i++) {
      if (r() < 0.45) continue;
      const lx = x + 8 + r() * (bw - 20);
      const ly = top + 12 + r() * (bh - 30);
      canvas.drawRect(Skia.XYWHRect(lx, ly, 6, 9), paint(r() < 0.7 ? C.amber : C.cyan, 0.5 + r() * 0.3));
    }
    x += bw + 6 + r() * 14;
  }
  // Wet-glass sheen.
  const sheen = Skia.Paint();
  sheen.setBlendMode(BlendMode.Screen);
  sheen.setShader(
    Skia.Shader.MakeLinearGradient(pt(w.x, w.y), pt(w.x + w.width, w.y + w.height), cols('#FFFFFF14', '#00000000', '#FFFFFF0A'), [0, 0.5, 1], TileMode.Clamp),
  );
  canvas.drawRect(Skia.XYWHRect(w.x, w.y, w.width, w.height), sheen);
  canvas.restore();

  // Steel frame and mullions.
  const frame = paint(C.steel);
  frame.setStyle(PaintStyle.Stroke);
  frame.setStrokeWidth(14);
  canvas.drawRect(Skia.XYWHRect(w.x, w.y, w.width, w.height), frame);
  frame.setStrokeWidth(8);
  for (let i = 1; i < 3; i++) canvas.drawLine(w.x + (w.width * i) / 3, w.y, w.x + (w.width * i) / 3, w.y + w.height, frame);
  canvas.drawLine(w.x, w.y + w.height / 2, w.x + w.width, w.y + w.height / 2, frame);
  const rim = paint('#3A4763', 0.8);
  rim.setStyle(PaintStyle.Stroke);
  rim.setStrokeWidth(2);
  canvas.drawRect(Skia.XYWHRect(w.x - 7, w.y - 7, w.width + 14, w.height + 14), rim);
}

function drawTubes(canvas: SkCanvas) {
  for (const t of L.tubes) {
    // Wall wash, halo, then the bright core.
    canvas.drawRect(Skia.XYWHRect(t.x - 70, t.y1 - 40, 140, t.y2 - t.y1 + 80), paint(C.cyan, 0.08, 40));
    canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(t.x - 9, t.y1, 18, t.y2 - t.y1), 9, 9), paint(C.cyan, 0.55, 10));
    canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(t.x - 4, t.y1, 8, t.y2 - t.y1), 4, 4), paint('#E9FDFF', 1));
  }
}

/** The bay's emblem: a crayon tip crossed with a lightning stroke, in magenta neon. */
export function emblemPath() {
  const { x, y, s } = L.emblem;
  return (
    Skia.PathBuilder.Make()
      // Circle badge.
      .addCircle(x, y, 74 * s)
      // Crayon tip (chevron) and bolt.
      .moveTo(x - 30 * s, y + 34 * s)
      .lineTo(x - 30 * s, y - 6 * s)
      .lineTo(x, y - 46 * s)
      .lineTo(x + 30 * s, y - 6 * s)
      .lineTo(x + 30 * s, y + 34 * s)
      .moveTo(x + 10 * s, y - 20 * s)
      .lineTo(x - 12 * s, y + 8 * s)
      .lineTo(x + 8 * s, y + 8 * s)
      .lineTo(x - 10 * s, y + 40 * s)
      .build()
  );
}

function drawEmblem(canvas: SkCanvas) {
  const p = emblemPath();
  const halo = paint(C.magenta, 0.45, 14);
  halo.setStyle(PaintStyle.Stroke);
  halo.setStrokeWidth(18);
  halo.setStrokeCap(StrokeCap.Round);
  canvas.drawPath(p, halo);
  const tube = paint(C.magenta, 1);
  tube.setStyle(PaintStyle.Stroke);
  tube.setStrokeWidth(7);
  tube.setStrokeCap(StrokeCap.Round);
  canvas.drawPath(p, tube);
  const core = paint('#FFE3F1', 0.9);
  core.setStyle(PaintStyle.Stroke);
  core.setStrokeWidth(2.5);
  core.setStrokeCap(StrokeCap.Round);
  canvas.drawPath(p, core);
}

function drawCeilingLight(canvas: SkCanvas) {
  const c = L.ceiling;
  canvas.drawRect(Skia.XYWHRect(c.x - 40, c.y - 30, c.width + 80, 90), paint('#BFEFFF', 0.1, 36));
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(c.x, c.y, c.width, 14), 7, 7), paint('#F4FBFF', 0.95));
  canvas.drawRect(Skia.XYWHRect(c.x, c.y + 14, c.width, 5), paint('#26324A'));
}

function drawFloor(canvas: SkCanvas) {
  const { bleed, floorY } = L;
  const floor = Skia.Paint();
  floor.setShader(
    Skia.Shader.MakeLinearGradient(pt(0, floorY), pt(0, 1100), cols(C.floorFar, C.floorNear), null, TileMode.Clamp),
  );
  canvas.drawRect(Skia.XYWHRect(bleed.x, floorY, bleed.width, bleed.y + bleed.height - floorY), floor);

  // Reflections on the wet floor, stretched vertically and softened.
  const w = L.window;
  const refl = Skia.Paint();
  refl.setShader(
    Skia.Shader.MakeLinearGradient(pt(0, floorY), pt(0, floorY + 330), cols('#3550886E', '#1B2A4A26', '#00000000'), [0, 0.45, 1], TileMode.Clamp),
  );
  refl.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 10, true));
  canvas.drawRect(Skia.XYWHRect(w.x + 10, floorY + 6, w.width - 20, 330), refl);

  const e = L.emblem;
  canvas.drawOval(Skia.XYWHRect(e.x - 70, floorY + 40, 140, 260), paint(C.magenta, 0.16, 26));

}

/**
 * The turntable the car stands on. In the garage carousel it is drawn with
 * each car (so it moves with the selection); everywhere else with the floor.
 * `ring` tints the rim light.
 */
export function drawTurntable(canvas: SkCanvas, ring: string = C.cyan) {
  const t = L.turntable;
  const disk = Skia.Paint();
  disk.setAntiAlias(true);
  disk.setShader(
    Skia.Shader.MakeRadialGradient(pt(t.cx, t.cy), t.rx, cols('#121826', '#0B0F18', '#080A10'), [0, 0.7, 1], TileMode.Clamp, Skia.Matrix().translate(t.cx, t.cy).scale(1, t.ry / t.rx).translate(-t.cx, -t.cy)),
  );
  canvas.drawOval(Skia.XYWHRect(t.cx - t.rx, t.cy - t.ry, t.rx * 2, t.ry * 2), disk);
  const rim = paint(ring, 0.5, 2.5);
  rim.setStyle(PaintStyle.Stroke);
  rim.setStrokeWidth(3);
  canvas.drawOval(Skia.XYWHRect(t.cx - t.rx, t.cy - t.ry, t.rx * 2, t.ry * 2), rim);
  const inner = paint('#2B3954', 0.7);
  inner.setStyle(PaintStyle.Stroke);
  inner.setStrokeWidth(2);
  canvas.drawOval(Skia.XYWHRect(t.cx - t.rx * 0.82, t.cy - t.ry * 0.78, t.rx * 1.64, t.ry * 1.56), inner);
}

function drawVignette(canvas: SkCanvas) {
  const { bleed } = L;
  const v = Skia.Paint();
  v.setShader(
    Skia.Shader.MakeRadialGradient(pt(800, 560), 1150, cols('#00000000', '#00000000', '#000000B3'), [0, 0.55, 1], TileMode.Clamp),
  );
  canvas.drawRect(Skia.XYWHRect(bleed.x, bleed.y, bleed.width, bleed.height), v);
}

export function drawGarageBackground(canvas: SkCanvas, opts: { turntable?: boolean } = {}) {
  drawWall(canvas);
  drawWindow(canvas);
  drawCeilingLight(canvas);
  drawTubes(canvas);
  drawEmblem(canvas);
  drawFloor(canvas);
  if (opts.turntable !== false) drawTurntable(canvas);
  drawVignette(canvas);
}

/** Tube reflections are animated; this static version is used for export and reduced motion. */
export function drawStaticReflections(canvas: SkCanvas, shimmer = 0) {
  for (const t of L.tubes) {
    const refl = Skia.Paint();
    refl.setShader(
      Skia.Shader.MakeLinearGradient(pt(0, L.floorY), pt(0, L.floorY + 420), cols('#33E4FF80', '#33E4FF1F', '#00000000'), [0, 0.4, 1], TileMode.Clamp),
    );
    refl.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 9, true));
    canvas.drawRect(Skia.XYWHRect(t.x - 12 + shimmer, L.floorY + 4, 24, 420), refl);
  }
}

/** Underglow on the floor beneath the car (cyan unless another colour is given). */
export function drawUnderglow(canvas: SkCanvas, intensity: number, color: string = C.cyan) {
  const u = L.underglow;
  canvas.drawOval(Skia.XYWHRect(u.cx - u.rx, u.cy - u.ry, u.rx * 2, u.ry * 2), paint(color, 0.5 * intensity, 34, BlendMode.Screen));
  canvas.drawOval(
    Skia.XYWHRect(u.cx - u.rx * 0.85, u.cy - u.ry * 0.45, u.rx * 1.7, u.ry * 0.9),
    paint(color === C.cyan ? '#9FF4FF' : color, 0.45 * intensity, 14, BlendMode.Screen),
  );
}
