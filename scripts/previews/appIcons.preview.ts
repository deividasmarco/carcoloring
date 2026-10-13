/**
 * Renders the original app icon set from the bay emblem:
 *   npx jest --testMatch "**\/scripts/previews/appIcons.preview.ts"
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { BlurStyle, ImageFormat, PaintStyle, Skia, StrokeCap, StrokeJoin, TileMode, type SkCanvas } from '@shopify/react-native-skia';

const ASSETS = join(__dirname, '..', '..', 'assets');
const MAGENTA = '#FF3D9A';
const CYAN = '#22E4FF';
const BG = '#06080E';

/** Emblem (crayon tip + lightning stroke in a ring) centred at (cx, cy) with ring radius r. */
function emblem(cx: number, cy: number, r: number) {
  const s = r / 74;
  return Skia.PathBuilder.Make()
    .addCircle(cx, cy, 74 * s)
    .moveTo(cx - 30 * s, cy + 34 * s)
    .lineTo(cx - 30 * s, cy - 6 * s)
    .lineTo(cx, cy - 46 * s)
    .lineTo(cx + 30 * s, cy - 6 * s)
    .lineTo(cx + 30 * s, cy + 34 * s)
    .moveTo(cx + 10 * s, cy - 20 * s)
    .lineTo(cx - 12 * s, cy + 8 * s)
    .lineTo(cx + 8 * s, cy + 8 * s)
    .lineTo(cx - 10 * s, cy + 40 * s)
    .build();
}

function neon(canvas: SkCanvas, cx: number, cy: number, r: number, color: string, mono = false) {
  const p = emblem(cx, cy, r);
  const stroke = (w: number, c: string, alpha: number, blur = 0) => {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeJoin(StrokeJoin.Round);
    paint.setStrokeWidth(w);
    paint.setColor(Skia.Color(c));
    paint.setAlphaf(alpha);
    if (blur) paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, false));
    canvas.drawPath(p, paint);
  };
  if (mono) {
    stroke(r * 0.13, '#FFFFFF', 1);
    return;
  }
  stroke(r * 0.32, color, 0.5, r * 0.16);
  stroke(r * 0.12, color, 1);
  stroke(r * 0.045, '#FFE6F2', 0.95);
}

function background(canvas: SkCanvas, size: number) {
  const bg = Skia.Paint();
  bg.setShader(
    Skia.Shader.MakeRadialGradient(Skia.Point(size / 2, size * 0.42), size * 0.75, [Skia.Color('#141C30'), Skia.Color(BG)], null, TileMode.Clamp),
  );
  canvas.drawRect(Skia.XYWHRect(0, 0, size, size), bg);
  // Cyan floor light under the emblem.
  const glow = Skia.Paint();
  glow.setColor(Skia.Color(CYAN));
  glow.setAlphaf(0.35);
  glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, size * 0.03, false));
  canvas.drawOval(Skia.XYWHRect(size * 0.22, size * 0.8, size * 0.56, size * 0.06), glow);
  const line = Skia.Paint();
  line.setColor(Skia.Color(CYAN));
  line.setAntiAlias(true);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(size * 0.32, size * 0.825, size * 0.36, size * 0.012), size * 0.006, size * 0.006), line);
}

function render(size: number, draw: (c: SkCanvas) => void, transparent = false) {
  const s = Skia.Surface.Make(size, size)!;
  const c = s.getCanvas();
  c.clear(Skia.Color(transparent ? 'transparent' : BG));
  draw(c);
  s.flush();
  return s.makeImageSnapshot().encodeToBytes(ImageFormat.PNG, 100);
}

test('render app icons', () => {
  writeFileSync(
    join(ASSETS, 'icon.png'),
    render(1024, (c) => {
      background(c, 1024);
      neon(c, 512, 470, 270, MAGENTA);
    }),
  );
  // Android adaptive icon: content inside the central 66% safe zone.
  writeFileSync(join(ASSETS, 'android-icon-foreground.png'), render(1024, (c) => neon(c, 512, 512, 230, MAGENTA), true));
  writeFileSync(join(ASSETS, 'android-icon-monochrome.png'), render(1024, (c) => neon(c, 512, 512, 230, MAGENTA, true), true));
  writeFileSync(join(ASSETS, 'splash-icon.png'), render(512, (c) => neon(c, 256, 256, 200, MAGENTA), true));
  writeFileSync(
    join(ASSETS, 'favicon.png'),
    render(64, (c) => {
      background(c, 64);
      neon(c, 32, 30, 20, MAGENTA);
    }),
  );
});
