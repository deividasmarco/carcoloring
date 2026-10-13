import { StrokeGestureMachine, type GestureSink, type TouchPoint } from '../src/engine/input/strokeGestureMachine';

type Call = [string, ...unknown[]];

function setup(canStart: (p: TouchPoint) => boolean = () => true) {
  const calls: Call[] = [];
  const sink: GestureSink = {
    beginStroke: (p) => {
      calls.push(['begin', p.id, p.x, p.y]);
      return canStart(p);
    },
    extendStroke: (p) => void calls.push(['extend', p.id, p.x, p.y]),
    endStroke: () => void calls.push(['end']),
    cancelStroke: () => void calls.push(['cancel']),
    beginTransform: (a, b) => void calls.push(['tBegin', a.id, b.id]),
    updateTransform: (a, b) => void calls.push(['tUpdate', a.id, b.id]),
    endTransform: () => void calls.push(['tEnd']),
  };
  const m = new StrokeGestureMachine(sink, { pinchGraceMs: 200, pinchGraceTravel: 20 });
  return { m, calls, names: () => calls.map((c) => c[0]) };
}

const t = (id: number, x: number, y: number): TouchPoint => ({ id, x, y });

describe('StrokeGestureMachine', () => {
  it('draws a single-finger stroke and commits on lift', () => {
    const { m, names } = setup();
    m.down([t(1, 10, 10)], 0);
    m.move([t(1, 20, 10)]);
    m.move([t(1, 30, 12)]);
    m.up([t(1, 30, 12)]);
    expect(names()).toEqual(['begin', 'extend', 'extend', 'end']);
    expect(m.mode).toBe('idle');
  });

  it('does not start a stroke outside a region, and never paints from that touch', () => {
    const { m, names } = setup(() => false);
    m.down([t(1, 10, 10)], 0);
    m.move([t(1, 200, 200)]);
    m.up([t(1, 200, 200)]);
    expect(names()).toEqual(['begin']);
  });

  it('turns a quick second finger into a pinch and discards the young stroke', () => {
    const { m, names } = setup();
    m.down([t(1, 10, 10)], 0);
    m.move([t(1, 14, 10)]);
    m.down([t(2, 200, 100)], 80);
    m.move([t(1, 0, 10), t(2, 220, 100)]);
    expect(names()).toEqual(['begin', 'extend', 'cancel', 'tBegin', 'tUpdate']);
  });

  it('ends a mature stroke when a second finger lands, with no connecting line', () => {
    const { m, calls, names } = setup();
    m.down([t(1, 10, 10)], 0);
    m.move([t(1, 60, 10)]);
    m.down([t(2, 400, 300)], 900);
    // Further movement of either finger must not paint.
    m.move([t(1, 80, 10), t(2, 420, 300)]);
    m.up([t(2, 420, 300)]);
    m.move([t(1, 90, 10)]);
    m.up([t(1, 90, 10)]);
    expect(names()).toEqual(['begin', 'extend', 'end']);
    // No extension ever reached the second finger's position.
    expect(calls.some((c) => c[0] === 'extend' && c[1] === 2)).toBe(false);
  });

  it('a finger that remains after a pinch cannot start a stroke', () => {
    const { m, names } = setup();
    m.down([t(1, 10, 10), t(2, 100, 10)], 0);
    m.move([t(1, 5, 10), t(2, 120, 10)]);
    m.up([t(2, 120, 10)]);
    m.move([t(1, 60, 60)]);
    m.up([t(1, 60, 60)]);
    expect(names()).toEqual(['tBegin', 'tUpdate', 'tEnd']);
    // A fresh touch afterwards draws normally.
    m.down([t(3, 10, 10)], 5000);
    expect(names().at(-1)).toBe('begin');
  });

  it('ignores moves of pointers it is not tracking', () => {
    const { m, calls } = setup();
    m.down([t(1, 10, 10)], 0);
    m.move([t(7, 999, 999)]);
    m.move([t(1, 12, 10)]);
    expect(calls.filter((c) => c[0] === 'extend')).toEqual([['extend', 1, 12, 10]]);
  });

  it('a cancelled gesture ends the stroke cleanly (or discards a brand-new one)', () => {
    const a = setup();
    a.m.down([t(1, 10, 10)], 0);
    a.m.move([t(1, 80, 10)]);
    a.m.cancel(1000);
    expect(a.names()).toEqual(['begin', 'extend', 'end']);
    expect(a.m.mode).toBe('idle');
    a.m.move([t(1, 90, 10)]);
    expect(a.names()).toHaveLength(3);

    const b = setup();
    b.m.down([t(1, 10, 10)], 0);
    b.m.cancel(50);
    expect(b.names()).toEqual(['begin', 'cancel']);
  });

  it('a cancelled pinch ends the transform and resets', () => {
    const { m, names } = setup();
    m.down([t(1, 0, 0), t(2, 10, 0)], 0);
    m.cancel(10);
    expect(names()).toEqual(['tBegin', 'tEnd']);
    m.down([t(3, 5, 5)], 20);
    expect(names().at(-1)).toBe('begin');
  });

  it('a new stroke can lock to a different region', () => {
    const regions: string[] = [];
    const { m } = setup((p) => {
      regions.push(p.x < 50 ? 'door' : 'hood');
      return true;
    });
    m.down([t(1, 10, 10)], 0);
    m.up([t(1, 10, 10)]);
    m.down([t(2, 90, 10)], 100);
    m.up([t(2, 90, 10)]);
    expect(regions).toEqual(['door', 'hood']);
  });
});
