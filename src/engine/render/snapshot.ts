import type { SkImage, SkSurface } from '@shopify/react-native-skia';

/**
 * CPU-backed snapshot of a surface, safe to hand to the UI thread. The
 * intermediate snapshot is freed: on the web, Skia objects are never garbage
 * collected, and `makeNonTextureImage` copies the pixels there, so keeping
 * the original would leak a full-size image per call.
 */
export function cpuSnapshot(surface: SkSurface): SkImage {
  const img = surface.makeImageSnapshot();
  const cpu = img.makeNonTextureImage();
  if (!cpu || cpu === img) return img;
  img.dispose();
  return cpu;
}
