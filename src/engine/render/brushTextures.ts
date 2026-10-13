/**
 * Paper-grain textures for the wax crayon and the coloured pencil.
 *
 * Each is rendered once from Skia's tileable Perlin fractal noise into a small
 * CPU image, then contrast-mapped to an alpha mask with a colour matrix. The
 * shaders are anchored in artwork space, so grain is fixed to the "paper"
 * (like a real drawing) and identical in the live preview, the committed
 * raster and the export.
 */
import { FilterMode, MipmapMode, Skia, TileMode, type SkImage, type SkShader } from '@shopify/react-native-skia';
import { cpuSnapshot } from './snapshot';

const SIZE = 256;

interface GrainRecipe {
  /** Perlin base frequencies (per texel); x < y gives horizontal streaks. */
  fx: number;
  fy: number;
  octaves: number;
  seed: number;
  /** Alpha = floor + (1 - floor) × clamp(gain × noise − cut). */
  floor: number;
  gain: number;
  cut: number;
}

const RECIPES: Record<'wax' | 'pencil', GrainRecipe> = {
  // Broad paper tooth: wax catches the peaks, valleys stay as paper specks
  // until another layer fills them in.
  wax: { fx: 0.16, fy: 0.3, octaves: 3, seed: 7, floor: 0.12, gain: 8, cut: 2.65 },
  // Finer, softer tooth for the pencil.
  pencil: { fx: 0.32, fy: 0.42, octaves: 2, seed: 19, floor: 0.4, gain: 4.2, cut: 1.55 },
};

function makeGrainImage(r: GrainRecipe): SkImage {
  const surface = Skia.Surface.Make(SIZE, SIZE);
  if (!surface) throw new Error('Could not allocate brush texture surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(`rgba(255,255,255,${r.floor})`));
  const paint = Skia.Paint();
  paint.setShader(Skia.Shader.MakeFractalNoise(r.fx, r.fy, r.octaves, r.seed, SIZE, SIZE));
  // White, with alpha driven by the noise's red channel.
  // prettier-ignore
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix([
    0, 0, 0, 0, 1,
    0, 0, 0, 0, 1,
    0, 0, 0, 0, 1,
    r.gain, 0, 0, 0, -r.cut,
  ]));
  canvas.drawRect(Skia.XYWHRect(0, 0, SIZE, SIZE), paint);
  surface.flush();
  const img = cpuSnapshot(surface);
  surface.dispose();
  return img;
}

export interface BrushTextures {
  wax: SkShader;
  pencil: SkShader;
}

let textures: BrushTextures | null = null;

export function getBrushTextures(): BrushTextures {
  if (textures) return textures;
  const shader = (kind: 'wax' | 'pencil', scale: number) =>
    makeGrainImage(RECIPES[kind]).makeShaderOptions(
      TileMode.Repeat,
      TileMode.Repeat,
      FilterMode.Linear,
      MipmapMode.None,
      Skia.Matrix().scale(scale, scale),
    );
  textures = { wax: shader('wax', 0.75), pencil: shader('pencil', 0.6) };
  return textures;
}
