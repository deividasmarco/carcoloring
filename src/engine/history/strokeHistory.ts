import type { Stroke } from '../stroke/types';

/**
 * Per-stroke undo/redo with bounded memory.
 *
 * Only the newest `limit` strokes stay undoable. Older strokes are handed back
 * from `push` so the caller can flatten them into the base paint raster, after
 * which they no longer cost history memory.
 */
export class StrokeHistory {
  private done: Stroke[] = [];
  private undone: Stroke[] = [];

  constructor(readonly limit = 40) {}

  get strokes(): readonly Stroke[] {
    return this.done;
  }

  get redoStack(): readonly Stroke[] {
    return this.undone;
  }

  get canUndo() {
    return this.done.length > 0;
  }

  get canRedo() {
    return this.undone.length > 0;
  }

  /** Records a committed stroke. Returns strokes that fell out of the undo window. */
  push(stroke: Stroke): Stroke[] {
    this.done.push(stroke);
    this.undone = [];
    const overflow = this.done.length - this.limit;
    return overflow > 0 ? this.done.splice(0, overflow) : [];
  }

  undo(): Stroke | null {
    const s = this.done.pop() ?? null;
    if (s) this.undone.push(s);
    return s;
  }

  redo(): Stroke | null {
    const s = this.undone.pop() ?? null;
    if (s) this.done.push(s);
    return s;
  }

  clear() {
    this.done = [];
    this.undone = [];
  }

  /** Restores saved history. Returns strokes beyond the undo window, to flatten. */
  restore(done: Stroke[], undone: Stroke[]): Stroke[] {
    const overflow = Math.max(0, done.length - this.limit);
    this.done = done.slice(overflow);
    this.undone = undone.slice(-this.limit);
    return done.slice(0, overflow);
  }
}
