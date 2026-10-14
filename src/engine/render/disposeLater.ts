/**
 * Frees a replaced Skia object a little later, once no frame being drawn can
 * still use it. Needed on the web, where Skia objects are never garbage
 * collected; harmless on native, where it only releases memory sooner.
 */
export function disposeLater(obj: { dispose(): void } | null | undefined, ms = 1500) {
  if (obj) setTimeout(() => obj.dispose(), ms);
}
