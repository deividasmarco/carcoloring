/**
 * Pixel-level checks of region locking with every real vehicle asset and the
 * real Skia renderer (CanvasKit).
 */
import { Skia } from '@shopify/react-native-skia';
import { CELL_EMPTY, CELL_LINE } from '../src/engine/regions/hitMap';
import { getBrushTextures } from '../src/engine/render/brushTextures';
import { drawStroke } from '../src/engine/render/drawStroke';
import { PaintRaster } from '../src/engine/render/paintRaster';
import type { Stroke, StrokePoint } from '../src/engine/stroke/types';
import type { VehicleRuntime } from '../src/engine/vehicle/vehicleRuntime';
import { ALL_VEHICLE_IDS, cellCode, erodedInterior, interiorPoint, paintInRegion, pixels, regionMask, runtime, seamPoint } from './helpers';

const SCALE = 1;
/**
 * Paint alpha a child can actually see (not hidden under the drawn outline).
 * Anti-aliased edges may tint a pixel beside a thin line by a few percent;
 * anything above 12% visible counts as a leak.
 */
const VISIBLE = 0.12 * 255;

const stroke = (regionId: string, points: StrokePoint[], extra: Partial<Stroke> = {}): Stroke => ({
  id: `${regionId}-${points.length}`,
  tool: 'crayon',
  color: '#E5322D',
  size: 2,
  regionId,
  points,
  ...extra,
});

/** Shared per-vehicle fixtures (part interiors, outline coverage, hit cells), built once. */
function fixture(rt: VehicleRuntime) {
  const rect = rt.layout.paintRect;
  const W = Math.ceil(rect.width * SCALE);
  const H = Math.ceil(rect.height * SCALE);
  const lookup = (id: string) => rt.regionById.get(id)?.path;
  const interiors = new Map(rt.regions.map((r) => [r.id, erodedInterior(regionMask(r.path, rect, SCALE), W, H)]));
  const line = regionMask(rt.lineArt, rect, SCALE);
  const lineA = new Uint8Array(W * H);
  for (let i = 0; i < lineA.length; i++) lineA[i] = line[i * 4 + 3];
  const cells = new Uint8Array(W * H);
  for (let i = 0; i < cells.length; i++) cells[i] = cellCode(rt.hitMap, rect.x + (i % W) + 0.5, rect.y + Math.floor(i / W) + 0.5);
  const code = (id: string) => rt.regionById.get(id)!.code;
  const visible = (px: Uint8Array, i: number) => px[i * 4 + 3] * (1 - lineA[i] / 255);
  function rasterWith(strokes: Stroke[]) {
    const r = new PaintRaster(rect, SCALE, lookup, getBrushTextures());
    r.commit(strokes);
    const img = r.snapshot();
    const px = pixels(img);
    img.dispose();
    r.dispose();
    return px;
  }
  /** A zig-zag over a part's bounds, overshooting them by `pad` on every side. */
  function overshoot(id: string, pad = 40): StrokePoint[] {
    const b = rt.regionById.get(id)!.bounds;
    const rows = Math.max(4, Math.round((b.height + pad * 2) / 14));
    const pts: StrokePoint[] = [];
    for (let i = 0; i <= rows; i++) {
      const y = b.y - pad + ((b.height + pad * 2) * i) / rows;
      pts.push({ x: i % 2 ? b.x + b.width + pad : b.x - pad, y, p: 0.5 });
    }
    return pts;
  }
  return { rect, W, H, lookup, interiors, cells, code, visible, rasterWith, overshoot };
}

/**
 * A vehicle's fixture, built when its tests start and dropped after them, so
 * only one vehicle's buffers are alive at a time (holding every vehicle's at
 * once exhausts memory and the CanvasKit heap can no longer grow).
 */
function lazyFixture(rt: VehicleRuntime) {
  let fx: ReturnType<typeof fixture> | null = null;
  beforeAll(() => {
    fx = fixture(rt);
  });
  afterAll(() => {
    fx = null;
  });
  return () => fx!;
}

describe.each(ALL_VEHICLE_IDS)('%s', (vehicleId) => {
  const rt = runtime(vehicleId);
  const fx = lazyFixture(rt);

  it.each(rt.regions.map((r) => r.id))('every part clips the full brush footprint: %s', (id) => {
    const px = fx().rasterWith([stroke(id, fx().overshoot(id))]);
    const mask = regionMask(rt.regionById.get(id)!.path, fx().rect, SCALE);
    let inside = 0;
    let worstLeak = 0;
    let visibleOffPart = 0;
    const own = fx().code(id);
    for (let i = 0; i < fx().W * fx().H; i++) {
      const a = px[i * 4 + 3];
      if (a === 0) continue;
      worstLeak = Math.max(worstLeak, a - mask[i * 4 + 3]);
      if (mask[i * 4 + 3] === 255) inside += a;
      if (fx().visible(px, i) > VISIBLE && fx().cells[i] !== own && fx().cells[i] !== CELL_LINE) visibleOffPart++;
    }
    // The anti-aliased clip never exceeds the part's own anti-aliased mask.
    expect(worstLeak).toBeLessThanOrEqual(2);
    expect(inside).toBeGreaterThan(0);
    // Visible colour only on this part's paper (or under its outline).
    expect(visibleOffPart).toBe(0);
    // No other part's interior receives any paint.
    for (const other of rt.regions) {
      if (other.id === id) continue;
      const interior = fx().interiors.get(other.id)!;
      let painted = 0;
      for (let i = 0; i < interior.length; i++) if (interior[i] && px[i * 4 + 3] > 0) painted++;
      expect({ other: other.id, painted }).toEqual({ other: other.id, painted: 0 });
    }
  });

  it('strokes around and across the wheels stay in the tyre or wheel they started in', () => {
    const wheelish = rt.regions.filter((r) => r.material === 'tire' || r.material === 'rim');
    expect(wheelish.length).toBeGreaterThanOrEqual(4);
    for (const r of wheelish) {
      const px = fx().rasterWith([stroke(r.id, fx().overshoot(r.id, 30))]);
      let leaks = 0;
      for (let i = 0; i < fx().W * fx().H; i++) {
        const c = fx().cells[i];
        if (c !== fx().code(r.id) && c !== CELL_LINE && fx().visible(px, i) > VISIBLE) leaks++;
      }
      expect({ id: r.id, leaks }).toEqual({ id: r.id, leaks: 0 });
    }
  });

  it('the eraser obeys the same boundaries', () => {
    const body = rt.regions
      .filter((r) => r.material === 'body')
      .sort((a, b) => b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height);
    const [a, b] = body;
    const r = new PaintRaster(fx().rect, SCALE, fx().lookup, getBrushTextures());
    r.commit([stroke(a.id, fx().overshoot(a.id)), stroke(b.id, fx().overshoot(b.id), { color: '#2F5BEA' })]);
    const before = pixels(r.snapshot());
    r.commit([stroke(a.id, fx().overshoot(a.id), { tool: 'eraser' })]);
    const after = pixels(r.snapshot());
    const ia = fx().interiors.get(a.id)!;
    const ib = fx().interiors.get(b.id)!;
    let bChanged = 0;
    let aRemaining = 0;
    for (let i = 0; i < ia.length; i++) {
      if (ib[i]) for (let k = 0; k < 4; k++) if (before[i * 4 + k] !== after[i * 4 + k]) bChanged++;
      if (ia[i]) aRemaining += after[i * 4 + 3];
    }
    expect(bChanged).toBe(0);
    expect(aRemaining).toBe(0);
    r.dispose();
  });

  it('no visible paint lands outside the car, even with every part over-scribbled', () => {
    const px = fx().rasterWith(rt.regions.map((r) => stroke(r.id, fx().overshoot(r.id))));
    let visibleOutside = 0;
    for (let i = 0; i < fx().W * fx().H; i++) if (fx().cells[i] === CELL_EMPTY && fx().visible(px, i) > VISIBLE) visibleOutside++;
    expect(visibleOutside).toBe(0);
  });
});

describe('Apex GT specifics (unchanged behaviour)', () => {
  const rt = runtime('apex-gt');
  const fx = lazyFixture(rt);

  it('a thick stroke running along the door/scoop line never touches the scoop', () => {
    const pts: StrokePoint[] = [];
    const b = rt.regionById.get('door')!.bounds;
    for (let y = Math.ceil(b.y + 8); y < b.y + b.height - 8; y += 6) {
      try {
        const s = seamPoint(rt.hitMap, fx().code('door'), fx().code('side-scoop'), 6, y);
        pts.push({ x: s.x, y: s.y, p: 0.5 });
      } catch {
        // The two parts do not meet on this row.
      }
    }
    expect(pts.length).toBeGreaterThan(8);
    const px = fx().rasterWith([stroke('door', pts)]);
    expect(paintInRegion(px, fx().rect, SCALE, rt.hitMap, fx().code('side-scoop'))).toBe(0);
    expect(paintInRegion(px, fx().rect, SCALE, rt.hitMap, fx().code('door'))).toBeGreaterThan(0);
  });

  it('handles one-point taps and builds up pigment with repeated strokes', () => {
    const surface = Skia.Surface.Make(64, 64)!;
    const p = interiorPoint(rt.hitMap, fx().code('door'), 30);
    drawStroke(surface.getCanvas(), stroke('door', [{ ...p, p: 0.5 }]), rt.regionById.get('door')!.path, getBrushTextures());
    surface.dispose();
    expect(paintInRegion(fx().rasterWith([stroke('door', [{ ...p, p: 0.5 }])]), fx().rect, SCALE, rt.hitMap, fx().code('door'))).toBeGreaterThan(0);
    const line = [{ x: p.x - 25, y: p.y, p: 0.5 }, { x: p.x + 25, y: p.y, p: 0.5 }];
    const one = paintInRegion(fx().rasterWith([stroke('door', line)]), fx().rect, SCALE, rt.hitMap, fx().code('door'));
    const three = paintInRegion(
      fx().rasterWith([stroke('door', line), stroke('door', line), stroke('door', line)]),
      fx().rect,
      SCALE,
      rt.hitMap,
      fx().code('door'),
    );
    expect(three).toBeGreaterThan(one * 1.1);
  });
});
