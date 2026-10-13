/**
 * React Native Skia's CanvasKit test environment, plus shared typed-array
 * constructors. CanvasKit is initialised in the outer Node realm; without
 * this, Float32Arrays created by test code (e.g. colours) fail CanvasKit's
 * `instanceof` checks because they belong to Jest's VM realm.
 */
import SkiaEnvironment from '@shopify/react-native-skia/jestEnv.js';

const SHARED = [
  'ArrayBuffer',
  'DataView',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
];

// CanvasKit validates colour lists with `x instanceof Array`; array literals
// from the test realm never pass that check, so answer it realm-independently.
if (!Array[Symbol.hasInstance].__realmAgnostic) {
  const check = (value) => Array.isArray(value);
  check.__realmAgnostic = true;
  Object.defineProperty(Array, Symbol.hasInstance, { value: check, configurable: true });
}

export default class Environment extends SkiaEnvironment {
  constructor(config, context) {
    super(config, context);
    for (const name of SHARED) this.global[name] = globalThis[name];
  }
}
