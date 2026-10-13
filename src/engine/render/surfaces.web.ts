import { Skia, type SkSurface } from '@shopify/react-native-skia';

/**
 * Web: a CPU raster surface. Skia's web `MakeOffscreen` creates a WebGL
 * context for every surface and never releases it, so each studio visit used
 * to leak two contexts until the browser's limit (about 16) began dropping
 * live canvases.
 */
export function makeOffscreenSurface(width: number, height: number): SkSurface | null {
  return Skia.Surface.Make(width, height);
}
