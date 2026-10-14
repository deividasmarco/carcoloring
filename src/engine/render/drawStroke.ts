/**
 * Renders one stroke, clipped to its locked region.
 *
 * Used for the live preview, committing into the paint raster, replay after
 * undo/restore and export, so all of them look identical.
 *
 *   save → clip(region path, anti-aliased)
 *     saveLayer(opacity | DstOut for the eraser)
 *       coverage: opaque round-capped stroke (soft edge for wax)
 *       grain:    DstIn with the paper texture (wax / pencil)
 *     restore
 *   restore
 *
 * The clip is applied to the composited layer, so the complete footprint —
 * width, soft edge, texture — is masked, not just the brush centre.
 */
import {
  BlendMode,
  BlurStyle,
  ClipOp,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkCanvas,
  type SkMaskFilter,
  type SkPath,
} from '@shopify/react-native-skia';
import type { BrushTextures } from './brushTextures';
import { densify, pointBounds } from '../stroke/interpolate';
import { TOOLS, widthAt, type Stroke, type StrokePoint } from '../stroke/types';

/** Max spacing between interpolated samples, artwork units. */
const SPACING = 2.5;

/**
 * Soft-edge blur filters, one per tool softness, created once and kept for the
 * app's lifetime (like the brush textures). They are immutable and shared by
 * every stroke, so nothing is created or released per stroke: native mask
 * filters have no dispose() (they are freed by garbage collection), and on the
 * web nothing is garbage collected, so one per stroke would leak.
 */
const blurs = new Map<number, SkMaskFilter>();
function blurFor(softness: number): SkMaskFilter {
  let f = blurs.get(softness);
  if (!f) {
    f = Skia.MaskFilter.MakeBlur(BlurStyle.Normal, softness, true);
    blurs.set(softness, f);
  }
  return f;
}

export function strokeGeometry(stroke: Pick<Stroke, 'points' | 'tool' | 'size'>) {
  const tool = TOOLS[stroke.tool];
  const pts = densify(stroke.points, SPACING);
  const maxW = pts.reduce((m, p) => Math.max(m, widthAt(tool, stroke.size, p.p)), 0);
  return { tool, pts, maxW, bounds: pointBounds(pts, maxW / 2 + tool.softness * 3 + 2) };
}

function uniformPressure(pts: readonly StrokePoint[]) {
  const p0 = pts[0]?.p ?? 0.5;
  return pts.every((p) => Math.abs(p.p - p0) < 0.02);
}

export function drawStroke(canvas: SkCanvas, stroke: Stroke, clip: SkPath, textures: BrushTextures) {
  if (stroke.points.length === 0) return;
  const { tool, pts, bounds } = strokeGeometry(stroke);
  const clipBounds = clip.computeTightBounds();
  const x0 = Math.max(bounds.x, clipBounds.x - 2);
  const y0 = Math.max(bounds.y, clipBounds.y - 2);
  const x1 = Math.min(bounds.x + bounds.width, clipBounds.x + clipBounds.width + 2);
  const y1 = Math.min(bounds.y + bounds.height, clipBounds.y + clipBounds.height + 2);
  if (x1 <= x0 || y1 <= y0) return;
  const layerRect = Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0);

  canvas.save();
  canvas.clipPath(clip, ClipOp.Intersect, true);

  const layer = Skia.Paint();
  layer.setAlphaf(tool.opacity);
  if (tool.id === 'eraser') layer.setBlendMode(BlendMode.DstOut);
  canvas.saveLayer(layer, layerRect);

  const ink = Skia.Paint();
  ink.setAntiAlias(true);
  ink.setStyle(PaintStyle.Stroke);
  ink.setStrokeCap(StrokeCap.Round);
  ink.setStrokeJoin(StrokeJoin.Round);
  ink.setColor(Skia.Color(tool.id === 'eraser' ? '#000000' : stroke.color));
  if (tool.softness > 0) ink.setMaskFilter(blurFor(tool.softness));

  if (pts.length === 1) {
    const dot = ink.copy();
    dot.setStyle(PaintStyle.Fill);
    canvas.drawCircle(pts[0].x, pts[0].y, widthAt(tool, stroke.size, pts[0].p) / 2, dot);
    dot.dispose();
  } else if (uniformPressure(pts)) {
    ink.setStrokeWidth(widthAt(tool, stroke.size, pts[0].p));
    const b = Skia.PathBuilder.Make().moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) b.lineTo(pts[i].x, pts[i].y);
    const path = b.build();
    canvas.drawPath(path, ink);
    path.dispose();
    b.dispose();
  } else {
    // Variable width (stylus pressure): round-capped segments unioned inside
    // the opaque layer, so overlaps never double the opacity.
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      ink.setStrokeWidth(widthAt(tool, stroke.size, (a.p + b.p) / 2));
      canvas.drawLine(a.x, a.y, b.x, b.y, ink);
    }
  }

  if (tool.grain) {
    const grain = Skia.Paint();
    grain.setShader(textures[tool.grain]);
    grain.setBlendMode(BlendMode.DstIn);
    canvas.drawRect(layerRect, grain);
    grain.dispose();
  }

  canvas.restore();
  canvas.restore();
  // The canvas (or picture being recorded) keeps its own copies of paints
  // and paths, so the per-stroke objects can go now. Only types whose native
  // host objects export dispose() are released here (Paint, Path,
  // PathBuilder); the shared blur filters and brush shaders are never released.
  ink.dispose();
  layer.dispose();
}
