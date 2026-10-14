import { FREE_VEHICLE_IDS, tierOf } from '../src/content/collection';
import { GARAGE, garageIndexOf } from '../src/content/registry';
import { TRACED_VEHICLES } from '../src/content/vehicles/traces';
import { drawingKeys } from '../src/engine/persistence/drawingStore';

describe('vehicle registry', () => {
  it('lists exactly the three free vehicles first: Apex GT, Blaze GT, Storm Sedan', () => {
    expect(GARAGE.slice(0, 3).map((e) => e.vehicle.id)).toEqual(['apex-gt', 'blaze-gt', 'storm-sedan']);
    expect(GARAGE.filter((e) => e.tier === 'free')).toHaveLength(3);
    expect(GARAGE.slice(3).every((e) => e.tier === 'premium')).toBe(true);
    for (const id of FREE_VEHICLE_IDS) expect(GARAGE.some((e) => e.vehicle.id === id)).toBe(true);
  });

  it('decides access by id, so reordering changes nothing', () => {
    const reversed = [...GARAGE].reverse();
    for (const e of reversed) expect(tierOf(e.vehicle.id)).toBe(e.tier);
  });

  it('keys saves and the remembered selection by id, never by position', () => {
    for (const [i, e] of GARAGE.entries()) {
      // Older saves are found by vehicle id and artwork version; new pictures by their own creation id.
      const version = e.vehicle.generated.assetVersion ?? 1;
      expect(drawingKeys({ vehicleId: e.vehicle.id, assetVersion: version }).state).toBe(`drawings/${e.vehicle.id}/v${version}/state.json`);
      expect(drawingKeys({ vehicleId: e.vehicle.id, assetVersion: version, creationId: 'c-1' }).state).toBe('creations/c-1/state.json');
      // The last selection is stored as an id and found again wherever the vehicle now sits.
      expect(garageIndexOf(e.vehicle.id)).toBe(i);
    }
    // A selection whose vehicle no longer exists falls back to the first, free vehicle.
    expect(garageIndexOf('retired-vehicle')).toBe(0);
  });

  it('gives every vehicle a unique permanent id, its own artwork, masks and thumbnail', () => {
    const ids = GARAGE.map((e) => e.vehicle.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sources = new Set<string>();
    const hitMaps = new Set<string>();
    for (const e of GARAGE) {
      const v = e.vehicle;
      expect(v.generated.id).toBe(v.id);
      expect(v.trace.id).toBe(v.id);
      expect(TRACED_VEHICLES.some((t) => t.id === v.id)).toBe(true);
      expect(sources.has(v.trace.source)).toBe(false);
      sources.add(v.trace.source);
      expect(hitMaps.has(v.generated.hitMap!.rle)).toBe(false);
      hitMaps.add(v.generated.hitMap!.rle);
      expect(e.thumbnail).toBeTruthy();
      expect(v.name).toMatch(/^[A-Z][A-Za-z0-9 ]+$/);
    }
  });

  it('keeps the original Apex GT with its existing geometry', () => {
    const apex = GARAGE[0].vehicle;
    expect(apex.id).toBe('apex-gt');
    expect(apex.trace.source).toBe('assets/source/alpine-simple.png');
    expect(apex.trace.assetVersion).toBe(1);
    expect(apex.trace.placement).toBe('identity');
  });
});
