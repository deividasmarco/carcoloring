/**
 * Skia object lifecycles differ by platform: native React Native Skia objects
 * are freed by garbage collection and some (mask filters) have no dispose()
 * at all, while on the web nothing is collected and everything must be
 * released explicitly. These tests run the real stroke path with native-like
 * mask filters, and check that a closed drawing session ignores late work.
 */
import { Skia } from '@shopify/react-native-skia';
import type { TouchPoint } from '../src/engine/input/strokeGestureMachine';
import { DrawingSession } from '../src/engine/session/drawingSession';
import type { ToolId } from '../src/engine/stroke/types';
import { toScreen } from '../src/engine/view/viewTransform';
import { interiorPoint, pixels, RecordingListener, runtime } from './helpers';

const rt = runtime();
const door = interiorPoint(rt.hitMap, rt.regionById.get('door')!.code, 20);

function session(schedule?: (cb: () => void) => void) {
  const listener = new RecordingListener();
  let clock = 0;
  const s = new DrawingSession(rt, listener, { rasterScale: 1, now: () => (clock += 16), schedule });
  s.setViewSize({ width: 1000, height: 400 });
  return { s, listener };
}

const at = (s: DrawingSession, p: { x: number; y: number }): TouchPoint => ({ id: 1, ...toScreen(s.transform, p) });

describe('stroke rendering with native-like Skia objects', () => {
  it('draws every tool without disposing shared mask filters, creating one per softness', () => {
    // Like JsiSkMaskFilter on iOS and Android (react-native-skia 2.6): no dispose().
    // Installed before anything in this file draws, so the blur cache starts empty.
    const makeBlur = Skia.MaskFilter.MakeBlur.bind(Skia.MaskFilter);
    const spy = jest.spyOn(Skia.MaskFilter, 'MakeBlur').mockImplementation((...args: Parameters<typeof makeBlur>) => {
      const filter = makeBlur(...args);
      Object.defineProperty(filter, 'dispose', { value: undefined });
      return filter;
    });
    try {
      const { s, listener } = session(); // live preview rendered at once, as each frame would
      for (let k = 0; k < 20; k++) {
        for (const tool of ['crayon', 'pencil', 'eraser'] as ToolId[]) {
          s.setBrush(tool, '#E5322D', 1);
          s.machine.down([at(s, door)], k * 100);
          for (let i = 1; i <= 6; i++) s.machine.move([at(s, { x: door.x + i * 8, y: door.y + (i % 2) * 6 })]);
          s.machine.up([at(s, { x: door.x + 48, y: door.y })]);
        }
      }
      expect(listener.live).toBeGreaterThan(100); // live preview pictures were recorded
      expect(s.strokeCount).toBeGreaterThan(0);
      // Crayon, pencil and eraser each have their own softness: three filters in all.
      expect(spy).toHaveBeenCalledTimes(3);
      // The last strokes (eraser) leave the door clean; paint a crayon stroke and check it lands.
      s.setBrush('crayon', '#2F5BEA', 2);
      s.machine.down([at(s, door)], 9000);
      s.machine.move([at(s, { x: door.x + 30, y: door.y })]);
      s.machine.up([at(s, { x: door.x + 30, y: door.y })]);
      expect(pixels(listener.image!).some((v, i) => i % 4 === 3 && v > 0)).toBe(true);
      s.dispose();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('a closed drawing session', () => {
  it('ignores frames scheduled before it closed, and any later input', () => {
    const queued: (() => void)[] = [];
    const { s, listener } = session((cb) => queued.push(cb));
    s.machine.down([at(s, door)], 0);
    s.machine.move([at(s, { x: door.x + 20, y: door.y })]);
    expect(queued.length).toBeGreaterThan(0); // a live frame is waiting
    s.dispose();
    const live = listener.live;
    const changes = listener.changes;
    expect(() => queued.splice(0).forEach((cb) => cb())).not.toThrow();
    expect(() => {
      s.machine.move([at(s, { x: door.x + 40, y: door.y })]);
      s.machine.up([at(s, { x: door.x + 40, y: door.y })]);
      expect(s.beginStroke(at(s, door))).toBe(false);
      s.undo();
      s.redo();
      s.clear();
      s.restore({ strokes: [], redo: [], hasBase: false }, null);
      s.dispose(); // twice is fine
    }).not.toThrow();
    expect(listener.live).toBe(live);
    expect(listener.changes).toBe(changes);
  });
});
