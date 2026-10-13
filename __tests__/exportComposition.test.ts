/** Export composition for every vehicle: placed car, paint, outlines and scene. */
import { composeArtwork } from '../src/engine/render/compose';
import { DrawingSession } from '../src/engine/session/drawingSession';
import type { VehicleRuntime } from '../src/engine/vehicle/vehicleRuntime';
import { toScreen } from '../src/engine/view/viewTransform';
import { ALL_VEHICLE_IDS, entry, interiorPoint, pixels, RecordingListener, runtime, seamPoint } from './helpers';


// Paint surfaces live in CanvasKit's WebAssembly heap: free them after each test.
const live: { dispose(): void }[] = [];
afterEach(() => {
  while (live.length) live.pop()!.dispose();
});
const track = <T extends { dispose(): void }>(x: T) => (live.push(x), x);

function newSession(rt: VehicleRuntime) {
  const listener = new RecordingListener();
  let clock = 0;
  const s = track(new DrawingSession(rt, listener, { rasterScale: 1, now: () => (clock += 16) }));
  s.setViewSize({ width: 1000, height: 400 });
  return { s, listener };
}

/** Strokes on the two largest body parts of any vehicle. */
function drawSome(rt: VehicleRuntime, s: DrawingSession, n: number) {
  const parts = rt.regions
    .filter((r) => r.material === 'body')
    .sort((a, b) => b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height)
    .slice(0, 2)
    .map((r) => interiorPoint(rt.hitMap, r.code, 12));
  for (let i = 0; i < n; i++) {
    const p = parts[i % 2];
    s.color = i % 3 ? '#2F5BEA' : '#FFD21F';
    const a = toScreen(s.transform, { x: p.x - 20 + (i % 7), y: p.y + (i % 5) });
    const b = toScreen(s.transform, { x: p.x + 40, y: p.y - 3 });
    s.machine.down([{ id: i + 1, ...a }], i * 1000);
    s.machine.move([{ id: i + 1, ...b }]);
    s.machine.up([{ id: i + 1, ...b }]);
  }
}

describe.each(ALL_VEHICLE_IDS)('%s: export', (vehicleId) => {
  it('matches the composed layers: paint shows on the placed car, background unchanged', () => {
    const rt = runtime(vehicleId);
    const a = newSession(rt);
    drawSome(rt, a.s, 6);
    const scale = 0.5;
    const painted = pixels(track(composeArtwork({ scene: entry.scene, vehicle: rt, paint: track(a.s.paintImage), paintRect: rt.layout.paintRect, scale })));
    const blank = pixels(track(composeArtwork({ scene: entry.scene, vehicle: rt, paint: null, paintRect: rt.layout.paintRect, scale })));
    const w = entry.scene.frame.width * scale;
    const p = rt.placement;
    /** Pixel at a vehicle-space point, through the vehicle's placement. */
    const atLocal = (px: Uint8Array, q: { x: number; y: number }) => {
      const sx = (q.x * p.scale + p.x) * scale;
      const sy = (q.y * p.scale + p.y) * scale;
      const i = (Math.floor(sy) * w + Math.floor(sx)) * 4;
      return Array.from(px.slice(i, i + 3));
    };
    const body = rt.regions.filter((r) => r.material === 'body').sort((x, y) => y.bounds.width * y.bounds.height - x.bounds.width * x.bounds.height)[0];
    const q = interiorPoint(rt.hitMap, body.code, 12);
    expect(atLocal(painted, q)).not.toEqual(atLocal(blank, q));
    // Wall far above the car is identical.
    const i = (Math.floor(60 * scale) * w + Math.floor(900 * scale)) * 4;
    expect(Array.from(painted.slice(i, i + 3))).toEqual(Array.from(blank.slice(i, i + 3)));
  });
});

describe('Apex GT export', () => {
  it('keeps the seam outline dark above the paint', () => {
    const rt = runtime('apex-gt');
    const a = newSession(rt);
    const door = interiorPoint(rt.hitMap, rt.regionById.get('door')!.code, 20);
    const s1 = toScreen(a.s.transform, door);
    const s2 = toScreen(a.s.transform, { x: door.x + 300, y: door.y });
    a.s.machine.down([{ id: 1, ...s1 }], 0);
    a.s.machine.move([{ id: 1, ...s2 }]);
    a.s.machine.up([{ id: 1, ...s2 }]);
    const scale = 0.5;
    const px = pixels(track(composeArtwork({ scene: entry.scene, vehicle: rt, paint: track(a.s.paintImage), paintRect: rt.layout.paintRect, scale })));
    const seam = seamPoint(rt.hitMap, rt.regionById.get('door')!.code, rt.regionById.get('side-scoop')!.code);
    const w = entry.scene.frame.width * scale;
    const i = (Math.floor(seam.y * scale) * w + Math.floor(seam.x * scale)) * 4;
    expect(Math.max(...Array.from(px.slice(i, i + 3)))).toBeLessThan(60);
  });
});
