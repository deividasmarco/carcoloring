import type { SkCanvas } from '@shopify/react-native-skia';

export interface SceneDefinition {
  id: string;
  /** Artwork frame used for export (artwork units). */
  frame: { width: number; height: number };
  /** Static background; also extends beyond the frame to fill any screen. */
  drawBackground(canvas: SkCanvas): void;
  /** Frozen frame of the ambient lighting (export and reduced motion). */
  drawStaticLighting(canvas: SkCanvas): void;
}
