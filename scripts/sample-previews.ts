/**
 * Renders the example colourings shown in the parent area
 * (assets/samples/<id>.png): a few premium vehicles with their own parts
 * filled in flat colours under their own line art. They are labelled as
 * examples in the app and never presented as a child's work.
 *
 *   npx tsx scripts/sample-previews.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { parseGeneratedPath } from '../src/engine/geometry/generatedPath';
import { loadSkia } from './lib/headlessSkia';

const ROOT = resolve(__dirname, '..');
const OUT_WIDTH = 480;

/** Vehicle → body colour (from the crayon box), and the colours for the other materials. */
const SAMPLES: { id: string; body: string }[] = [
  { id: 'ember-gt', body: '#E5322D' }, // Racing red
  { id: 'comet-superbike', body: '#1FC3E8' }, // Electric blue
];
const MATERIAL: Record<string, string> = {
  glass: '#BFE3F2',
  light: '#FFF3C4',
  tire: '#2B2E36',
  rim: '#C6CBD3',
  trim: '#3C4250',
};
const PAPER = '#FBFBF8';

interface Generated {
  regions: { id: string; material: string; path: string }[];
  silhouette: string;
  lineArt: string;
  layout: { silhouetteBounds: { x: number; y: number; width: number; height: number } };
}

async function main() {
  const Skia = await loadSkia();
  mkdirSync(join(ROOT, 'assets/samples'), { recursive: true });
  for (const { id, body } of SAMPLES) {
    const g = JSON.parse(readFileSync(join(ROOT, `src/content/vehicles/${id}/regions.generated.json`), 'utf8')) as Generated;
    const b = g.layout.silhouetteBounds;
    const pad = 8;
    const scale = OUT_WIDTH / (b.width + pad * 2);
    const outH = Math.round((b.height + pad * 2) * scale);
    const surface = Skia.Surface.Make(OUT_WIDTH, outH)!;
    const c = surface.getCanvas();
    c.clear(Skia.Color('transparent'));
    c.scale(scale, scale);
    c.translate(pad - b.x, pad - b.y);
    const fill = (d: string, color: string) => {
      const p = Skia.Paint();
      p.setAntiAlias(true);
      p.setColor(Skia.Color(color));
      c.drawPath(parseGeneratedPath(Skia, d), p);
    };
    fill(g.silhouette, PAPER);
    for (const r of g.regions) fill(r.path, r.material === 'body' ? body : MATERIAL[r.material] ?? PAPER);
    fill(g.lineArt, '#101217');
    surface.flush();
    const png = surface.makeImageSnapshot().encodeToBytes();
    writeFileSync(join(ROOT, `assets/samples/${id}.png`), png);
    console.log(`✔ assets/samples/${id}.png ${OUT_WIDTH}×${outH}`);
  }
}

main();
