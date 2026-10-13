/**
 * Web startup. React Native Skia needs CanvasKit (WebAssembly) loaded before
 * any module that touches Skia is evaluated, so the router is required only
 * after it has loaded. `canvaskit.wasm` is served from public/ (npm run setup:web).
 */
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-router/entry');
});
