/**
 * Committed paint, cached as a raster so the cost of drawing a frame does not
 * grow with the number of strokes.
 *
 * - `base`    strokes that left the undo window (flattened, persisted as PNG)
 * - `current` base + every undoable stroke; snapshotted for display
 *
 * Both rasters cover `rect` (artwork units) at `scale` pixels per unit and are
 * drawn under a transform that maps artwork → raster pixels, so strokes and
 * region clips use artwork coordinates everywhere.
 */
import { ImageFormat, Skia, type SkCanvas, type SkImage, type SkPath, type SkSurface } from '@shopify/react-native-skia';
import type { Rect } from '../../content/vehicles/types';
import type { Stroke } from '../stroke/types';
import type { BrushTextures } from './brushTextures';
import { drawStroke } from './drawStroke';
import { cpuSnapshot } from './snapshot';
import { makeOffscreenSurface } from './surfaces';

export type RegionLookup = (regionId: string) => SkPath | undefined;

function makeSurface(width: number, height: number): SkSurface {
  const s = makeOffscreenSurface(width, height);
  if (!s) throw new Error(`Could not allocate a ${width}×${height} paint surface`);
  return s;
}

export class PaintRaster {
  readonly width: number;
  readonly height: number;
  private readonly base: SkSurface;
  private readonly current: SkSurface;
  private baseHasContent = false;

  constructor(
    readonly rect: Rect,
    readonly scale: number,
    private readonly regions: RegionLookup,
    private readonly textures: BrushTextures,
  ) {
    this.width = Math.ceil(rect.width * scale);
    this.height = Math.ceil(rect.height * scale);
    this.base = makeSurface(this.width, this.height);
    this.current = makeSurface(this.width, this.height);
    this.clearAll();
  }

  private withArtworkSpace(canvas: SkCanvas, draw: () => void) {
    canvas.save();
    canvas.scale(this.scale, this.scale);
    canvas.translate(-this.rect.x, -this.rect.y);
    draw();
    canvas.restore();
  }

  private paint(surface: SkSurface, strokes: readonly Stroke[]) {
    const canvas = surface.getCanvas();
    this.withArtworkSpace(canvas, () => {
      for (const s of strokes) {
        const clip = this.regions(s.regionId);
        if (clip) drawStroke(canvas, s, clip, this.textures);
      }
    });
    surface.flush();
  }

  get hasBaseContent() {
    return this.baseHasContent;
  }

  clearAll() {
    for (const s of [this.base, this.current]) {
      s.getCanvas().clear(Skia.Color('transparent'));
      s.flush();
    }
    this.baseHasContent = false;
  }

  /** Adds strokes on top of the current raster. */
  commit(strokes: readonly Stroke[]) {
    this.paint(this.current, strokes);
  }

  /** Bakes strokes that left the undo window into the base raster. */
  flatten(strokes: readonly Stroke[]) {
    if (strokes.length === 0) return;
    this.paint(this.base, strokes);
    this.baseHasContent = true;
  }

  /** Rebuilds the current raster from the base plus the given strokes (after undo / restore). */
  rebuild(strokes: readonly Stroke[]) {
    const baseImage = this.base.makeImageSnapshot();
    const canvas = this.current.getCanvas();
    canvas.clear(Skia.Color('transparent'));
    canvas.drawImage(baseImage, 0, 0);
    this.current.flush();
    baseImage.dispose();
    this.paint(this.current, strokes);
  }

  /** Replaces the base raster with a previously saved image. */
  loadBase(image: SkImage) {
    const canvas = this.base.getCanvas();
    canvas.clear(Skia.Color('transparent'));
    const paint = Skia.Paint();
    canvas.drawImageRect(image, Skia.XYWHRect(0, 0, image.width(), image.height()), Skia.XYWHRect(0, 0, this.width, this.height), paint);
    this.base.flush();
    paint.dispose();
    this.baseHasContent = true;
  }

  /** CPU-backed snapshot that can be handed to the UI thread for display. */
  snapshot(): SkImage {
    return cpuSnapshot(this.current);
  }

  encodeBasePng(): Uint8Array {
    const img = this.base.makeImageSnapshot();
    const bytes = img.encodeToBytes(ImageFormat.PNG, 100);
    img.dispose();
    return bytes;
  }

  /** Downscaled PNG of the current paint (garage preview). */
  encodePreviewPng(factor = 0.5): Uint8Array {
    const w = Math.max(1, Math.round(this.width * factor));
    const h = Math.max(1, Math.round(this.height * factor));
    const surface = Skia.Surface.Make(w, h);
    if (!surface) throw new Error('Could not allocate preview surface');
    const img = this.current.makeImageSnapshot();
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('transparent'));
    const paint = Skia.Paint();
    canvas.drawImageRect(img, Skia.XYWHRect(0, 0, this.width, this.height), Skia.XYWHRect(0, 0, w, h), paint);
    surface.flush();
    paint.dispose();
    const out = surface.makeImageSnapshot();
    const bytes = out.encodeToBytes(ImageFormat.PNG, 100);
    out.dispose();
    img.dispose();
    surface.dispose();
    return bytes;
  }

  /** Frees the GPU/CPU surfaces; the raster is unusable afterwards. */
  dispose() {
    this.base.dispose();
    this.current.dispose();
  }
}
