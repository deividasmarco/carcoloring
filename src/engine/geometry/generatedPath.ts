/**
 * Generated region geometry comes from Skia path ops, whose results use the
 * even-odd fill rule. SVG path strings do not carry a fill rule, so every
 * generated path must be parsed with this helper (app, build script, tests).
 */
import type { SkPath } from '@shopify/react-native-skia';

/** FillType.EvenOdd */
const EVEN_ODD = 1;

interface PathApi {
  Path: { MakeFromSVGString(d: string): SkPath | null };
  PathBuilder: { MakeFromPath(p: SkPath): { setFillType(f: number): { build(): SkPath } } };
}

export function parseGeneratedPath(skia: PathApi, d: string): SkPath {
  const p = skia.Path.MakeFromSVGString(d);
  if (!p) throw new Error(`Invalid generated path: ${d.slice(0, 40)}…`);
  return skia.PathBuilder.MakeFromPath(p).setFillType(EVEN_ODD).build();
}
