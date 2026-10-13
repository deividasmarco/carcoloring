/**
 * Loads the same Skia engine the app uses (CanvasKit build of Skia, wrapped by
 * React Native Skia's JSI-compatible API) for offline asset generation.
 */
// @ts-ignore - CanvasKit ships without types for this entry point.
import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit';
import { JsiSkApi } from '@shopify/react-native-skia/lib/commonjs/skia/web';
import type { Skia as SkiaApi } from '@shopify/react-native-skia';

export type SkiaApiType = typeof SkiaApi;

let cached: SkiaApiType | null = null;

export async function loadSkia(): Promise<SkiaApiType> {
  if (cached) return cached;
  const CanvasKit = await CanvasKitInit({});
  (globalThis as any).CanvasKit = CanvasKit;
  cached = JsiSkApi(CanvasKit) as unknown as SkiaApiType;
  return cached;
}
