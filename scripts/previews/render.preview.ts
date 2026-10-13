/**
 * Renders the real app layers with CanvasKit and writes PNGs to .scratch/ for
 * visual review:  npm run previews
 *
 * Every listed part gets a thick crayon zig-zag locked to it that overshoots
 * the part's bounds by 30 units on all sides, so any mask misalignment shows
 * up as colour outside the drawn outlines.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ImageFormat } from '@shopify/react-native-skia';
import { GARAGE } from '../../src/content/registry';
import { getBrushTextures } from '../../src/engine/render/brushTextures';
import { composeArtwork } from '../../src/engine/render/compose';
import { PaintRaster } from '../../src/engine/render/paintRaster';
import type { Stroke, StrokePoint } from '../../src/engine/stroke/types';
import { getVehicleRuntime } from '../../src/engine/vehicle/vehicleRuntime';

const OUT = join(__dirname, '..', '..', '.scratch');

const COLORS: Record<string, string> = {
  hood: '#E5322D',
  'front-body': '#E5322D',
  'front-bumper': '#1D1F25',
  'front-splitter': '#1D1F25',
  'left-intake': '#1D1F25',
  'right-intake': '#1D1F25',
  'left-headlight': '#FFD21F',
  'right-headlight': '#FFD21F',
  windshield: '#1FC3E8',
  'side-window': '#1FC3E8',
  'rear-side-window': '#1FC3E8',
  roof: '#1D1F25',
  'windshield-frame': '#1D1F25',
  'front-seat': '#FF7A1A',
  'side-seat': '#FF7A1A',
  dashboard: '#9AA3AF',
  door: '#E5322D',
  'upper-door': '#E5322D',
  'lower-door': '#1D1F25',
  'side-scoop': '#1D1F25',
  'lower-scoop': '#E5322D',
  'rear-fender': '#E5322D',
  'rear-pillar': '#E5322D',
  'engine-cover': '#E5322D',
  'rear-wing': '#1D1F25',
  'side-skirt': '#1D1F25',
  'rear-skirt': '#1D1F25',
  'left-mirror': '#E5322D',
  'right-mirror': '#E5322D',
  'front-tire': '#1D1F25',
  'rear-tire': '#1D1F25',
  'front-wheel': '#9AA3AF',
  'rear-wheel': '#9AA3AF',
  'front-arch': '#7B4BD8',
  'rear-arch': '#7B4BD8',
};

function overshootZigzag(b: { x: number; y: number; width: number; height: number }, pad = 30): StrokePoint[] {
  const rows = Math.max(4, Math.round((b.height + pad * 2) / 18));
  const pts: StrokePoint[] = [];
  for (let i = 0; i <= rows; i++) {
    const y = b.y - pad + ((b.height + pad * 2) * i) / rows;
    pts.push({ x: i % 2 ? b.x + b.width + pad : b.x - pad, y, p: 0.5 });
  }
  return pts;
}

test('render previews', () => {
  mkdirSync(OUT, { recursive: true });
  const { vehicle: def, scene } = GARAGE[0];
  const rt = getVehicleRuntime(def);
  const rect = rt.layout.paintRect;
  const raster = new PaintRaster(rect, 1.5, (id) => rt.regionById.get(id)?.path, getBrushTextures());

  const strokes: Stroke[] = rt.regions
    .filter((r) => COLORS[r.id])
    .flatMap((r, i) => [0, 1].map((k) => ({
      id: `${r.id}-${k}`,
      tool: 'crayon' as const,
      color: COLORS[r.id],
      size: 2 as const,
      regionId: r.id,
      points: overshootZigzag(r.bounds).map((p) => ({ ...p, y: p.y + k * 7 + (i % 3) })),
    })));
  raster.commit(strokes);
  const paint = raster.snapshot();

  const save = (name: string, opts: { paint: boolean; scale: number; crop?: { x: number; y: number; width: number; height: number } }) =>
    writeFileSync(
      join(OUT, name),
      composeArtwork({ scene, vehicle: rt, paint: opts.paint ? paint : null, paintRect: rect, scale: opts.scale, crop: opts.crop }).encodeToBytes(ImageFormat.PNG, 100),
    );

  save('compose-blank.png', { paint: false, scale: 1 });
  save('compose-full.png', { paint: true, scale: 1 });
  // Close-ups where boundaries are densest.
  save('close-front-wheel.png', { paint: true, scale: 3, crop: { x: 800, y: 560, width: 260, height: 300 } });
  save('close-door-scoop.png', { paint: true, scale: 3, crop: { x: 1040, y: 470, width: 300, height: 300 } });
  save('close-nose.png', { paint: true, scale: 3, crop: { x: 75, y: 560, width: 330, height: 300 } });
  save('close-cabin.png', { paint: true, scale: 3, crop: { x: 640, y: 360, width: 340, height: 230 } });
  save('close-rear-wheel.png', { paint: true, scale: 3, crop: { x: 1320, y: 420, width: 210, height: 420 } });
});
