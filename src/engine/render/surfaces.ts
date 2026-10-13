import { Skia, type SkSurface } from '@shopify/react-native-skia';

/** An offscreen surface: GPU-backed where available (native), otherwise a CPU raster. */
export function makeOffscreenSurface(width: number, height: number): SkSurface | null {
  return Skia.Surface.MakeOffscreen(width, height) ?? Skia.Surface.Make(width, height);
}
