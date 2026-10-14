/**
 * The garage carousel's selection logic (JS side). Regression for a crash
 * where a snap carried a position the registry doesn't have and the garage
 * read `.vehicle` of undefined: positions from the gesture worklets are now
 * checked, and the selection is a permanent vehicle id.
 */
import { GARAGE, getGarageEntry } from '../src/content/registry';
import { createCarouselFlow, type Range } from '../src/features/garage/carouselFlow';

const ids = GARAGE.map((e) => e.vehicle.id);

function harness(initialId = ids[0]) {
  let range: Range = { lo: 0, hi: 1 };
  let selectedId = initialId;
  let inUpdater = false;
  const calls = { selected: [] as string[], snaps: [] as number[], jumps: [] as number[], problems: [] as string[] };
  const sideEffect = (what: string) => {
    if (inUpdater) throw new Error(`${what} ran inside a state updater`);
  };
  const flow = createCarouselFlow(
    {
      ids,
      setRange: (update) => {
        // Like React: updaters may run more than once and must be pure.
        inUpdater = true;
        const a = update(range);
        const b = update(range);
        inUpdater = false;
        expect(b).toEqual(a);
        range = a;
      },
      setSelectedId: (id) => {
        sideEffect('setSelectedId');
        selectedId = id;
      },
      onSelect: (id) => {
        sideEffect('onSelect');
        calls.selected.push(id);
      },
      startSnap: (t) => calls.snaps.push(t),
      jump: (t) => calls.jumps.push(t),
      report: (p) => calls.problems.push(p),
    },
    initialId,
  );
  return { flow, calls, range: () => range, selectedId: () => selectedId };
}

describe('garage carousel selection', () => {
  it('selects by id when a snap starts, with side effects once and outside state updaters', () => {
    const h = harness();
    h.flow.events.engage(0);
    h.flow.events.snap(5, 1);
    expect(h.selectedId()).toBe(ids[5]);
    expect(h.flow.selectedId()).toBe(ids[5]);
    expect(h.calls.selected).toEqual([ids[5]]);
    expect(h.range()).toEqual({ lo: 0, hi: 6 }); // everything the snap passes stays mounted
    h.flow.events.release();
    h.flow.events.settled(5, 1);
    expect(h.range()).toEqual({ lo: 4, hi: 6 }); // at rest: the vehicle and its hidden neighbours
  });

  it('ignores positions the registry does not have instead of reading past it', () => {
    const h = harness(ids[3]);
    for (const bad of [NaN, -1, ids.length, 2.5, Infinity, undefined as unknown as number]) {
      expect(() => h.flow.events.snap(bad, 7)).not.toThrow();
      expect(() => h.flow.events.engage(bad)).not.toThrow();
      expect(() => h.flow.events.settled(bad, 7)).not.toThrow();
    }
    expect(h.selectedId()).toBe(ids[3]); // nothing else was swapped in
    expect(h.calls.selected).toEqual([]);
    expect(h.calls.problems.length).toBeGreaterThanOrEqual(12);
  });

  it('after rapid swipes, the selection is the vehicle of the latest snap (what Paint opens)', () => {
    const h = harness();
    h.flow.events.engage(0);
    h.flow.events.snap(1, 1);
    h.flow.events.release();
    h.flow.events.engage(1);
    h.flow.events.snap(2, 2);
    h.flow.events.release();
    h.flow.events.settled(1, 1); // the interrupted first snap reports late: ignored
    h.flow.events.settled(2, 2);
    expect(h.selectedId()).toBe(ids[2]);
    expect(getGarageEntry(h.selectedId())!.vehicle.id).toBe(ids[2]);
    expect(h.range()).toEqual({ lo: 1, hi: 3 });
  });

  it('adds up quick arrow taps and stops at the ends', () => {
    const h = harness();
    for (let k = 0; k < 4; k++) h.flow.go(1, false);
    expect(h.calls.snaps).toEqual([1, 2, 3, 4]);
    const end = harness(ids[ids.length - 1]);
    end.flow.go(1, false);
    expect(end.calls.snaps).toEqual([ids.length - 1]);
  });

  it('jumps to a vehicle by id, and refuses unknown ids without changing anything', () => {
    const h = harness();
    expect(h.flow.select('arrow-superbike')).toBe(true);
    expect(h.selectedId()).toBe('arrow-superbike');
    expect(h.calls.jumps).toEqual([ids.indexOf('arrow-superbike')]);
    expect(h.flow.select('retired-vehicle')).toBe(false);
    expect(h.selectedId()).toBe('arrow-superbike');
    expect(h.calls.problems).toEqual(['ignored a selection of unknown vehicle "retired-vehicle"']);
  });

  it('refuses to start with no vehicles or an unknown vehicle', () => {
    const deps = { setRange: () => {}, setSelectedId: () => {}, onSelect: () => {}, startSnap: () => {}, jump: () => {} };
    expect(() => createCarouselFlow({ ...deps, ids: [] }, 'apex-gt')).toThrow('no vehicles');
    expect(() => createCarouselFlow({ ...deps, ids }, 'retired-vehicle')).toThrow('Unknown vehicle');
  });
});
