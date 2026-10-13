import { Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import type { Rect } from '../../content/vehicles/types';

/** Records drawing commands once so static layers replay cheaply every frame. */
export function recordPicture(bounds: Rect, draw: (canvas: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(bounds.x, bounds.y, bounds.width, bounds.height));
  draw(canvas);
  return recorder.finishRecordingAsPicture();
}
