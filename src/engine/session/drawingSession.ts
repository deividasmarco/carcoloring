/**
 * One open drawing: input → region lock → stroke → raster, plus history and
 * view transform. Framework-agnostic; the studio component wires its outputs
 * to Skia shared values so the React tree does not re-render while drawing.
 */
import { Skia, type SkImage, type SkPicture } from '@shopify/react-native-skia';
import type { SceneDefinition } from '../../content/scenes/types';
import { StrokeHistory } from '../history/strokeHistory';
import { StrokeGestureMachine, type GestureSink, type TouchPoint } from '../input/strokeGestureMachine';
import type { SavedDrawing } from '../persistence/drawingStore';
import { resolveStartRegion, type StartRegionResult } from '../regions/hitMap';
import { getBrushTextures, type BrushTextures } from '../render/brushTextures';
import { composeArtwork } from '../render/compose';
import { drawStroke, strokeGeometry } from '../render/drawStroke';
import { PaintRaster } from '../render/paintRaster';
import { recordPicture } from '../render/picture';
import { DEFAULT_PRESSURE, MAX_POINTS_PER_STROKE, type SizeIndex, type Stroke, type ToolId } from '../stroke/types';
import {
  clampTransform,
  fitTransform,
  pinchTransform,
  refit,
  screenToArtworkLength,
  toArtwork,
  type Size,
  type ViewTransform,
} from '../view/viewTransform';
import type { VehicleRuntime } from '../vehicle/vehicleRuntime';

/** Screen-space tolerance for strokes that start on an outline. */
export const OUTLINE_TOLERANCE_DP = 10;
/** Screen-space margin a nearby region must win by to be chosen. */
export const AMBIGUITY_MARGIN_DP = 1.5;
/** Undoable strokes kept in memory; older ones are flattened. */
export const HISTORY_LIMIT = 40;
/** Paint raster resolution, pixels per artwork unit. */
export const RASTER_SCALE = 2;
/** Raw samples closer than this (artwork units) are skipped. */
const MIN_SAMPLE_DISTANCE = 0.8;

export interface SessionListener {
  paintImage(image: SkImage): void;
  liveStroke(picture: SkPicture | null): void;
  transform(t: ViewTransform): void;
  history(state: HistoryState): void;
  /** Persistable content changed (debounce saves on this). */
  changed(): void;
  strokeStarted?(regionId: string): void;
  /** 'locked': the drawing is view-only (e.g. premium access ended). */
  strokeRejected?(reason: StartRegionResult['reason'] | 'locked'): void;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  hasPaint: boolean;
}

export interface SessionOptions {
  /** Defers live-stroke re-recording to the next frame (requestAnimationFrame). */
  schedule?: (cb: () => void) => void;
  rasterScale?: number;
  now?: () => number;
}

export class DrawingSession implements GestureSink {
  readonly machine: StrokeGestureMachine;
  private readonly history = new StrokeHistory(HISTORY_LIMIT);
  private readonly raster: PaintRaster;
  private readonly textures: BrushTextures;
  private readonly schedule: (cb: () => void) => void;
  private readonly now: () => number;

  private view: Size = { width: 0, height: 0 };
  private fit: ViewTransform = { scale: 1, tx: 0, ty: 0 };
  private t: ViewTransform = { scale: 1, tx: 0, ty: 0 };
  private pinchStart: { t: ViewTransform; a: TouchPoint; b: TouchPoint } | null = null;

  private live: Stroke | null = null;
  private liveDirty = false;
  /** Set by dispose(): the paint surfaces are gone, so late calls do nothing. */
  private disposed = false;
  private seq = 0;
  private baseDirty = false;
  private baseCleared = false;
  private editable = true;

  tool: ToolId = 'crayon';
  color = '#E5322D';
  size: SizeIndex = 1;
  /** Latest stylus pressure (0..1) or null for finger input. */
  pressure: number | null = null;

  constructor(
    readonly vehicle: VehicleRuntime,
    private readonly listener: SessionListener,
    opts: SessionOptions = {},
  ) {
    this.textures = getBrushTextures();
    this.schedule = opts.schedule ?? ((cb) => cb());
    this.now = opts.now ?? (() => Date.now());
    this.raster = new PaintRaster(
      vehicle.layout.paintRect,
      opts.rasterScale ?? RASTER_SCALE,
      (id) => vehicle.regionById.get(id)?.path,
      this.textures,
    );
    this.machine = new StrokeGestureMachine(this);
  }

  /** Brush used by the next stroke (the stroke in progress keeps its own). */
  setBrush(tool: ToolId, color: string, size: SizeIndex) {
    this.tool = tool;
    this.color = color;
    this.size = size;
  }

  /** Stylus pressure for upcoming samples, or null for finger input. */
  setPressure(p: number | null) {
    this.pressure = p;
  }

  /**
   * View-only mode: new strokes, undo, redo and washing are refused, but a
   * stroke already in progress still finishes and is kept, so losing edit
   * access never cuts a stroke short or drops unsaved work.
   */
  setEditable(editable: boolean) {
    this.editable = editable;
  }

  get canEdit() {
    return this.editable;
  }

  // ── View ────────────────────────────────────────────────────────────────

  get transform() {
    return this.t;
  }

  get fitTransform() {
    return this.fit;
  }

  setViewSize(size: Size) {
    if (size.width <= 0 || size.height <= 0) return;
    if (size.width === this.view.width && size.height === this.view.height) return;
    const rect = this.vehicle.layout.focusRect;
    if (this.view.width === 0) {
      this.fit = fitTransform(size, rect);
      this.t = this.fit;
    } else {
      const next = refit(this.t, this.view, this.fit, size, rect);
      this.fit = next.fit;
      this.t = next.transform;
    }
    this.view = size;
    this.listener.transform(this.t);
  }

  resetView() {
    this.t = this.fit;
    this.listener.transform(this.t);
  }

  // ── Region lock ─────────────────────────────────────────────────────────

  /** Which region a touch at this screen point would lock to. */
  regionAtScreen(p: { x: number; y: number }): StartRegionResult {
    const a = toArtwork(this.t, p);
    return resolveStartRegion(this.vehicle.hitMap, a.x, a.y, {
      searchRadius: screenToArtworkLength(this.t, OUTLINE_TOLERANCE_DP),
      ambiguityMargin: Math.max(1, screenToArtworkLength(this.t, AMBIGUITY_MARGIN_DP)),
    });
  }

  // ── GestureSink ─────────────────────────────────────────────────────────

  beginStroke(p: TouchPoint): boolean {
    if (this.disposed) return false;
    if (!this.editable) {
      this.listener.strokeRejected?.('locked');
      return false;
    }
    const res = this.regionAtScreen(p);
    const region = res.code === null ? undefined : this.vehicle.regionByCode.get(res.code);
    if (!region) {
      this.listener.strokeRejected?.(res.reason);
      return false;
    }
    const a = toArtwork(this.t, p);
    this.live = {
      id: `${this.now().toString(36)}-${(this.seq++).toString(36)}`,
      tool: this.tool,
      color: this.color,
      size: this.size,
      regionId: region.id,
      points: [{ x: a.x, y: a.y, p: this.pressure ?? DEFAULT_PRESSURE }],
    };
    this.listener.strokeStarted?.(region.id);
    this.requestLiveRender();
    return true;
  }

  extendStroke(p: TouchPoint) {
    const live = this.live;
    if (!live) return;
    const a = toArtwork(this.t, p);
    const last = live.points[live.points.length - 1];
    if (Math.hypot(a.x - last.x, a.y - last.y) < MIN_SAMPLE_DISTANCE) return;
    live.points.push({ x: a.x, y: a.y, p: this.pressure ?? DEFAULT_PRESSURE });
    if (live.points.length >= MAX_POINTS_PER_STROKE) {
      // Very long scribble: commit and continue seamlessly in the same region.
      const tail = live.points[live.points.length - 1];
      this.commitLive();
      this.live = { ...live, id: `${live.id}+`, points: [tail] };
    }
    this.requestLiveRender();
  }

  endStroke() {
    this.commitLive();
  }

  cancelStroke() {
    this.live = null;
    this.listener.liveStroke(null);
  }

  beginTransform(a: TouchPoint, b: TouchPoint) {
    this.pinchStart = { t: this.t, a, b };
  }

  updateTransform(a: TouchPoint, b: TouchPoint) {
    const s = this.pinchStart;
    if (!s) return;
    const next = pinchTransform(s.t, s.a, s.b, a, b);
    this.t = clampTransform(next, this.view, this.vehicle.layout.focusRect, this.fit);
    this.listener.transform(this.t);
  }

  endTransform() {
    this.pinchStart = null;
  }

  // ── Strokes ─────────────────────────────────────────────────────────────

  private requestLiveRender() {
    if (this.liveDirty) return;
    this.liveDirty = true;
    this.schedule(() => {
      this.liveDirty = false;
      // A frame scheduled before the studio closed may run after dispose().
      if (!this.disposed) this.renderLive();
    });
  }

  private renderLive() {
    const live = this.live;
    if (!live) return;
    const clip = this.vehicle.regionById.get(live.regionId)?.path;
    if (!clip) return;
    const { bounds } = strokeGeometry(live);
    this.listener.liveStroke(recordPicture(bounds, (c) => drawStroke(c, live, clip, this.textures)));
  }

  private commitLive() {
    const live = this.live;
    this.live = null;
    if (!live || this.disposed) return;
    this.raster.commit([live]);
    const overflow = this.history.push(live);
    if (overflow.length) {
      this.raster.flatten(overflow);
      this.baseDirty = true;
    }
    this.publishRaster();
    this.listener.liveStroke(null);
    this.listener.changed();
  }

  private publishRaster() {
    this.listener.paintImage(this.raster.snapshot());
    this.listener.history(this.historyState);
  }

  get historyState(): HistoryState {
    return {
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      hasPaint: this.history.strokes.length > 0 || this.raster.hasBaseContent,
    };
  }

  get isDrawing() {
    return this.live !== null;
  }

  /** Undoable strokes currently in history. */
  get strokeCount() {
    return this.history.strokes.length;
  }

  undo() {
    if (this.disposed || !this.editable || this.live || !this.history.undo()) return;
    this.raster.rebuild(this.history.strokes);
    this.publishRaster();
    this.listener.changed();
  }

  redo() {
    if (this.disposed || !this.editable || this.live) return;
    const s = this.history.redo();
    if (!s) return;
    this.raster.commit([s]);
    this.publishRaster();
    this.listener.changed();
  }

  /** Washes all paint off the car. */
  clear() {
    if (this.disposed || !this.editable) return;
    this.live = null;
    this.history.clear();
    this.raster.clearAll();
    this.baseDirty = false;
    this.baseCleared = true;
    this.listener.liveStroke(null);
    this.publishRaster();
    this.listener.changed();
  }

  // ── Persistence & export ────────────────────────────────────────────────

  restore(saved: SavedDrawing, basePng: Uint8Array | null) {
    if (this.disposed) return;
    this.live = null;
    this.raster.clearAll();
    if (basePng) {
      const data = Skia.Data.fromBytes(basePng);
      const img = Skia.Image.MakeImageFromEncoded(data);
      data.dispose();
      if (img) {
        this.raster.loadBase(img); // copied into the base surface
        img.dispose();
      }
    }
    const overflow = this.history.restore(saved.strokes, saved.redo);
    if (overflow.length) {
      this.raster.flatten(overflow);
      this.baseDirty = true;
    }
    this.raster.rebuild(this.history.strokes);
    this.publishRaster();
  }

  snapshotForSave(): { drawing: SavedDrawing; basePng: Uint8Array | null | undefined } {
    let basePng: Uint8Array | null | undefined;
    if (this.baseDirty) basePng = this.raster.encodeBasePng();
    else if (this.baseCleared) basePng = null;
    this.baseDirty = false;
    this.baseCleared = false;
    return {
      drawing: {
        strokes: [...this.history.strokes],
        redo: [...this.history.redoStack],
        hasBase: this.raster.hasBaseContent,
      },
      basePng,
    };
  }

  get paintImage(): SkImage {
    return this.raster.snapshot();
  }

  /** Small PNG of the paint layer, for the garage. */
  previewPng(): Uint8Array {
    return this.raster.encodePreviewPng(0.5);
  }

  /** Releases the paint surfaces. Call when the studio closes. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.live = null;
    this.raster.dispose();
  }

  exportImage(scene: SceneDefinition, scale = 1.5): SkImage {
    return composeArtwork({
      scene,
      vehicle: this.vehicle,
      paint: this.raster.snapshot(),
      paintRect: this.vehicle.layout.paintRect,
      scale,
    });
  }
}
