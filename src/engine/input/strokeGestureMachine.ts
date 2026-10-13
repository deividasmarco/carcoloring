/**
 * Touch arbitration for the drawing surface (pure, platform independent).
 *
 * - One finger draws. The stroke follows only the pointer that started it, so
 *   other fingers can never extend it or produce long connecting lines.
 * - A second finger shortly after the first (a pinch that began slightly
 *   staggered) discards the young stroke and starts zoom/pan instead.
 * - A second finger later in a stroke ends the stroke where it was and the
 *   surface ignores input until every finger is lifted.
 * - When a zoom/pan ends with fingers still down, input is ignored until all
 *   fingers lift, so the remaining finger cannot start an accidental stroke.
 * - A system cancel ends the stroke cleanly (or discards it if it is still
 *   too young to be intentional) and resets all tracking.
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export interface GestureSink {
  /** Return false when the touch did not start on a colourable region. */
  beginStroke(p: TouchPoint): boolean;
  extendStroke(p: TouchPoint): void;
  /** Commit the stroke drawn so far. */
  endStroke(): void;
  /** Discard the stroke drawn so far. */
  cancelStroke(): void;
  beginTransform(a: TouchPoint, b: TouchPoint): void;
  updateTransform(a: TouchPoint, b: TouchPoint): void;
  endTransform(): void;
}

export interface GestureOptions {
  /** A second finger within this time of the first turns the touch into a pinch. */
  pinchGraceMs: number;
  /** …provided the stroke has not travelled further than this (screen units). */
  pinchGraceTravel: number;
}

export const DEFAULT_GESTURE_OPTIONS: GestureOptions = { pinchGraceMs: 220, pinchGraceTravel: 28 };

type State =
  | { kind: 'idle' }
  | { kind: 'drawing'; pointer: number; startedAt: number; travel: number; last: TouchPoint }
  | { kind: 'pending'; pointer: number }
  | { kind: 'transform'; a: number; b: number }
  | { kind: 'blocked' };

export class StrokeGestureMachine {
  private state: State = { kind: 'idle' };
  private readonly active = new Map<number, TouchPoint>();

  constructor(
    private readonly sink: GestureSink,
    private readonly opts: GestureOptions = DEFAULT_GESTURE_OPTIONS,
  ) {}

  get mode(): State['kind'] {
    return this.state.kind;
  }

  get activePointers(): number {
    return this.active.size;
  }

  down(touches: readonly TouchPoint[], now: number) {
    for (const t of touches) this.active.set(t.id, t);
    const s = this.state;
    switch (s.kind) {
      case 'idle': {
        if (this.active.size >= 2) {
          this.startTransform();
          return;
        }
        const first = touches[0];
        if (!first) return;
        if (this.sink.beginStroke(first)) {
          this.state = { kind: 'drawing', pointer: first.id, startedAt: now, travel: 0, last: first };
        } else {
          this.state = { kind: 'pending', pointer: first.id };
        }
        return;
      }
      case 'drawing': {
        if (this.active.size < 2) return;
        const young = now - s.startedAt <= this.opts.pinchGraceMs && s.travel <= this.opts.pinchGraceTravel;
        if (young) {
          this.sink.cancelStroke();
          this.startTransform();
        } else {
          this.sink.endStroke();
          this.state = { kind: 'blocked' };
        }
        return;
      }
      case 'pending':
        if (this.active.size >= 2) this.startTransform();
        return;
      case 'transform':
      case 'blocked':
        return;
    }
  }

  move(touches: readonly TouchPoint[]) {
    for (const t of touches) if (this.active.has(t.id)) this.active.set(t.id, t);
    const s = this.state;
    if (s.kind === 'drawing') {
      const p = this.active.get(s.pointer);
      if (!p || (p.x === s.last.x && p.y === s.last.y)) return;
      s.travel += Math.hypot(p.x - s.last.x, p.y - s.last.y);
      s.last = p;
      this.sink.extendStroke(p);
    } else if (s.kind === 'transform') {
      const a = this.active.get(s.a);
      const b = this.active.get(s.b);
      if (a && b) this.sink.updateTransform(a, b);
    }
  }

  up(touches: readonly TouchPoint[]) {
    const s = this.state;
    const ids = new Set(touches.map((t) => t.id));
    if (s.kind === 'drawing' && ids.has(s.pointer)) {
      const last = touches.find((t) => t.id === s.pointer);
      if (last && (last.x !== s.last.x || last.y !== s.last.y)) this.sink.extendStroke(last);
      this.sink.endStroke();
      this.state = { kind: 'blocked' };
    } else if (s.kind === 'transform' && (ids.has(s.a) || ids.has(s.b))) {
      this.sink.endTransform();
      this.state = { kind: 'blocked' };
    } else if (s.kind === 'pending' && ids.has(s.pointer)) {
      this.state = { kind: 'blocked' };
    }
    for (const id of ids) this.active.delete(id);
    if (this.active.size === 0) this.state = { kind: 'idle' };
  }

  /** The platform cancelled the gesture (system gesture, interruption, unmount). */
  cancel(now: number) {
    const s = this.state;
    if (s.kind === 'drawing') {
      const young = now - s.startedAt <= this.opts.pinchGraceMs && s.travel <= this.opts.pinchGraceTravel;
      if (young) this.sink.cancelStroke();
      else this.sink.endStroke();
    } else if (s.kind === 'transform') {
      this.sink.endTransform();
    }
    this.active.clear();
    this.state = { kind: 'idle' };
  }

  private startTransform() {
    const [a, b] = [...this.active.values()];
    this.state = { kind: 'transform', a: a.id, b: b.id };
    this.sink.beginTransform(a, b);
  }
}
