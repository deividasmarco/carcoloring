/**
 * For every vehicle, the hit-test map (used to choose a part) and the vector
 * region paths (used to clip paint) are generated separately; they must agree.
 * Placement must put every car on the shared garage ground line.
 */
import { getGarageEntry } from '../src/content/registry';
import { SCENE_LAYOUT } from '../src/content/scenes/neon-garage/layout';
import { CELL_EMPTY, CELL_LINE, isRegionCell } from '../src/engine/regions/hitMap';
import { ALL_VEHICLE_IDS, runtime } from './helpers';

describe.each(ALL_VEHICLE_IDS)('%s asset', (vehicleId) => {
  const rt = runtime(vehicleId);
  const map = rt.hitMap;

  it('has every authored part, with unique ids, codes and names', () => {
    const authored = rt.def.trace.regions.map((r) => r.id);
    expect(rt.regions.map((r) => r.id).sort()).toEqual([...authored].sort());
    expect(new Set(rt.regions.map((r) => r.id)).size).toBe(rt.regions.length);
    expect(new Set(rt.regions.map((r) => r.code)).size).toBe(rt.regions.length);
    for (const r of rt.regions) expect(r.name.length).toBeGreaterThan(2);
    // Practical targets for a five-year-old.
    const ids = rt.regions.map((r) => r.id).join(' ');
    const big = getGarageEntry(vehicleId)!.kind === 'superbike' ? ['fairing', 'tank', 'windscreen'] : ['hood', 'windshield'];
    for (const part of [...big, 'front-tire', 'rear-tire', 'front-wheel', 'rear-wheel']) expect(ids).toContain(part);
  });

  it('hit-map cells agree with the runtime region paths', () => {
    // Every vehicle uses its own masks: region paths come from its own asset.
    const step = vehicleId === 'apex-gt' ? 2 : 3;
    let checked = 0;
    const mismatches: string[] = [];
    for (let y = 0; y < map.height; y += step) {
      for (let x = 0; x < map.width; x += step) {
        const v = map.cells[y * map.width + x];
        const ax = map.x + x + 0.5;
        const ay = map.y + y + 0.5;
        if (isRegionCell(v)) {
          const region = rt.regionByCode.get(v)!;
          if (!region.path.contains(ax, ay)) mismatches.push(`${region.id} missing (${ax},${ay})`);
          for (const other of rt.regions) {
            if (other !== region && other.path.contains(ax, ay)) mismatches.push(`${other.id} overlaps ${region.id} at (${ax},${ay})`);
          }
          checked++;
        } else if (v === CELL_EMPTY) {
          for (const r of rt.regions) if (r.path.contains(ax, ay)) mismatches.push(`${r.id} covers empty cell (${ax},${ay})`);
        }
      }
    }
    expect(mismatches.slice(0, 10)).toEqual([]);
    expect(checked).toBeGreaterThan(20_000);
  });

  it('marks the drawn lines as non-paintable and gives every part paper', () => {
    const counts = new Map<number, number>();
    for (const v of map.cells) counts.set(v, (counts.get(v) ?? 0) + 1);
    expect(counts.get(CELL_LINE)).toBeGreaterThan(1000);
    for (const r of rt.regions) expect({ id: r.id, cells: (counts.get(r.code) ?? 0) > 50 }).toEqual({ id: r.id, cells: true });
  });

  it('stands on the shared garage ground line, centred, within the car stage', () => {
    const st = SCENE_LAYOUT.carStage;
    const sb = rt.layout.silhouetteBounds;
    const p = rt.placement;
    const left = sb.x * p.scale + p.x;
    const right = (sb.x + sb.width) * p.scale + p.x;
    const top = sb.y * p.scale + p.y;
    const bottom = (sb.y + sb.height) * p.scale + p.y;
    expect(Math.abs(bottom - st.groundY)).toBeLessThan(1);
    expect(Math.abs((left + right) / 2 - st.centerX)).toBeLessThan(1);
    expect(right - left).toBeLessThanOrEqual(st.maxWidth + 1);
    expect(bottom - top).toBeLessThanOrEqual(st.maxHeight + 1);
    // Fills the stage in at least one dimension (normalised apparent size).
    expect(Math.max((right - left) / st.maxWidth, (bottom - top) / st.maxHeight)).toBeGreaterThan(0.99);
  });
});
