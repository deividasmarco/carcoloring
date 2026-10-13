/**
 * Export composition. Draws exactly the layers the studio shows, in the same
 * order, into one offscreen image:
 *
 *   scene background → ambient lighting (frozen)      (scene units)
 *   → car base → paint → overlay                       (vehicle units, placed)
 *
 * The scene is drawn in scene units; the vehicle layers are drawn under the
 * vehicle's placement, the same mapping the garage and studio use.
 */
import { Skia, type SkCanvas, type SkImage } from '@shopify/react-native-skia';
import type { SceneDefinition } from '../../content/scenes/types';
import type { Rect } from '../../content/vehicles/types';
import type { VehicleRuntime } from '../vehicle/vehicleRuntime';
import { cpuSnapshot } from './snapshot';
import { makeOffscreenSurface } from './surfaces';

export interface ComposeInput {
  scene: SceneDefinition;
  vehicle: VehicleRuntime;
  paint: SkImage | null;
  /** Vehicle units. */
  paintRect: Rect;
  /** Output pixels per artwork unit. */
  scale: number;
  /** Region of the scene to export (scene units); defaults to the scene frame. */
  crop?: Rect;
}

export function drawComposition(canvas: SkCanvas, input: Omit<ComposeInput, 'scale' | 'crop'>) {
  const { scene, vehicle, paint, paintRect } = input;
  scene.drawBackground(canvas);
  scene.drawStaticLighting(canvas);
  const p = vehicle.placement;
  canvas.save();
  canvas.translate(p.x, p.y);
  canvas.scale(p.scale, p.scale);
  canvas.drawPicture(vehicle.basePicture);
  if (paint) {
    canvas.drawImageRect(
      paint,
      Skia.XYWHRect(0, 0, paint.width(), paint.height()),
      Skia.XYWHRect(paintRect.x, paintRect.y, paintRect.width, paintRect.height),
      Skia.Paint(),
    );
  }
  canvas.drawPicture(vehicle.overlayPicture);
  canvas.restore();
}

export function composeArtwork(input: ComposeInput): SkImage {
  const crop = input.crop ?? { x: 0, y: 0, ...input.scene.frame };
  const w = Math.round(crop.width * input.scale);
  const h = Math.round(crop.height * input.scale);
  const surface = makeOffscreenSurface(w, h);
  if (!surface) throw new Error('Could not allocate export surface');
  const canvas = surface.getCanvas();
  canvas.save();
  canvas.scale(input.scale, input.scale);
  canvas.translate(-crop.x, -crop.y);
  drawComposition(canvas, input);
  canvas.restore();
  surface.flush();
  const img = cpuSnapshot(surface);
  surface.dispose();
  return img;
}
