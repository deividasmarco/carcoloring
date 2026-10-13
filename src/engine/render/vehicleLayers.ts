/**
 * Static vehicle layers for traced line-art vehicles.
 *
 * Base (below paint):    soft ground shadows → light primer per part
 * Overlay (above paint): the drawing's own outlines (vector line art)
 *
 * Surfaces stay light and unshaded, like a colouring page; the outlines are
 * drawn last and are never touched by paint or erasing.
 */
import { BlurStyle, Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';
import type { DecorFinish, Material } from '../../content/vehicles/types';
import type { VehicleGeometry } from '../vehicle/vehicleRuntime';

/** Near-white primer, with a faint tint so glass and tyres read as such. */
export const PRIMER: Record<Material, string> = {
  body: '#FAFBFC',
  glass: '#E9F0F7',
  light: '#FFFFFF',
  tire: '#E8EAEE',
  rim: '#F6F7F9',
  trim: '#F1F2F5',
};

const DECOR: Record<DecorFinish, string> = {
  trim: '#15171D',
  void: '#090A0E',
  metal: '#7D848E',
};

export const INK = '#0A0C11';

const fill = (color: string): SkPaint => {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  return p;
};

export function drawContactShadow(canvas: SkCanvas, g: VehicleGeometry) {
  for (const s of g.layout.shadows) {
    const p = fill('#000000');
    p.setAlphaf(s.opacity);
    p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, Math.max(4, s.ry * 0.6), true));
    canvas.drawOval(Skia.XYWHRect(s.cx - s.rx, s.cy - s.ry, s.rx * 2, s.ry * 2), p);
  }
}

export function drawVehicleBase(canvas: SkCanvas, g: VehicleGeometry) {
  drawContactShadow(canvas, g);
  for (const r of g.regions) canvas.drawPath(r.path, fill(PRIMER[r.material]));
  for (const d of g.decor) canvas.drawPath(d.path, fill(DECOR[d.finish]));
}

export function drawVehicleOverlay(canvas: SkCanvas, g: VehicleGeometry) {
  canvas.drawPath(g.lineArt, fill(INK));
}
