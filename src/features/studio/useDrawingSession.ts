/**
 * Owns a DrawingSession for the studio: restores the creation being painted,
 * autosaves it (strokes, garage preview and its My Creations picture), and
 * exposes Skia shared values so drawing never re-renders React.
 */
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { SkImage, SkPicture } from '@shopify/react-native-skia';
import type { GarageEntry } from '../../content/registry';
import { installWebProbe } from '../../dev/webProbe';
import { blobStore } from '../../engine/persistence/blobStore';
import { creationFiles } from '../../engine/persistence/creationStore';
import { loadDrawing, saveDrawing, type DrawingKey } from '../../engine/persistence/drawingStore';
import { composeVehiclePicture } from '../../engine/render/compose';
import { disposeLater } from '../../engine/render/disposeLater';
import { DrawingSession, type HistoryState } from '../../engine/session/drawingSession';
import { getVehicleRuntime, type VehicleDefinition } from '../../engine/vehicle/vehicleRuntime';
import type { ViewTransform } from '../../engine/view/viewTransform';
import { ensureListed, getCreation, recordSave } from '../../state/creations';
import { savePaintPreview } from '../../state/paintPreview';

const SAVE_DEBOUNCE_MS = 700;


interface Outputs {
  paint: SharedValue<SkImage | null>;
  live: SharedValue<SkPicture | null>;
  transform: SharedValue<ViewTransform>;
}

interface Handlers {
  history(h: HistoryState): void;
  zoomed(z: boolean): void;
  changed(): void;
}

/** Fan-out for session events; React subscribes from effects. */
class SessionEvents implements Handlers {
  private handlers: Partial<Handlers> = {};
  connect(h: Handlers) {
    this.handlers = h;
    return () => {
      this.handlers = {};
    };
  }
  history(h: HistoryState) {
    this.handlers.history?.(h);
  }
  zoomed(z: boolean) {
    this.handlers.zoomed?.(z);
  }
  changed() {
    this.handlers.changed?.();
  }
}

function createStudioSession(vehicle: VehicleDefinition, out: Outputs, events: SessionEvents): DrawingSession {
  const s: DrawingSession = new DrawingSession(
    getVehicleRuntime(vehicle),
    {
      paintImage(img) {
        const prev = out.paint.value;
        out.paint.value = img;
        disposeLater(prev);
      },
      liveStroke(pic) {
        const prev = out.live.value;
        out.live.value = pic;
        disposeLater(prev);
      },
      transform(t) {
        out.transform.value = t;
        events.zoomed(t.scale / s.fitTransform.scale > 1.02);
      },
      history: (h) => events.history(h),
      changed: () => events.changed(),
    },
    { schedule: (cb) => requestAnimationFrame(cb) },
  );
  return s;
}

/** Serialised, debounced saving of one session. */
class Autosaver {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly session: DrawingSession,
    private readonly key: DrawingKey,
  ) {}

  get pending() {
    return this.timer !== null;
  }

  schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.saveNow(), SAVE_DEBOUNCE_MS);
  }

  saveNow(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const key = this.key;
    const id = key.creationId!;
    const hasPaint = this.session.historyState.hasPaint;
    // A new picture is only kept once something has been painted on it.
    if (!hasPaint && !getCreation(id)) return this.chain;
    const snap = this.session.snapshotForSave();
    const preview = this.session.previewPng();
    const paint = this.session.paintImage;
    let picture: Uint8Array | null = null;
    try {
      picture = composeVehiclePicture(this.session.vehicle, hasPaint ? paint : null);
    } catch (e) {
      console.warn('Composing the picture failed', e);
    } finally {
      paint.dispose();
    }
    const pictureName = `picture-${Date.now().toString(36)}.png`;
    // Serialise writes so an older save can never overwrite a newer one.
    this.chain = this.chain
      .then(async () => {
        await ensureListed(key);
        await saveDrawing(blobStore, key, snap.drawing, snap.basePng);
        await savePaintPreview(key, preview, hasPaint);
        const previous = getCreation(id)?.picture;
        if (picture) await blobStore.writeBytes(creationFiles(id, pictureName).picture!, picture);
        await recordSave(id, { hasPaint, picture: picture ? pictureName : previous });
        if (picture && previous && previous !== pictureName) await blobStore.remove(creationFiles(id, previous).picture!);
      })
      .catch((e) => console.warn('Saving the drawing failed', e));
    return this.chain;
  }

  /** Resolves once every queued write has finished. */
  settled() {
    return this.chain;
  }
}

/** `key` names the creation being painted (a new id for a new picture). */
export function useDrawingSession(entry: GarageEntry, key: DrawingKey) {
  const paint = useSharedValue<SkImage | null>(null);
  const live = useSharedValue<SkPicture | null>(null);
  const transform = useSharedValue<ViewTransform>({ scale: 1, tx: 0, ty: 0 });
  const [history, setHistory] = useState<HistoryState>({ canUndo: false, canRedo: false, hasPaint: false });
  const [zoomed, setZoomed] = useState(false);
  const [ready, setReady] = useState(false);

  const events = useMemo(() => new SessionEvents(), []);
  const session = useMemo(
    () => createStudioSession(entry.vehicle, { paint, live, transform }, events),
    [entry.vehicle, paint, live, transform, events],
  );
  const saver = useMemo(() => new Autosaver(session, key), [session, key]);

  // Route session events into React state and the autosaver.
  useEffect(
    () => events.connect({ history: setHistory, zoomed: setZoomed, changed: () => saver.schedule() }),
    [events, saver],
  );

  // Restore saved progress once.
  useEffect(() => {
    let alive = true;
    installWebProbe(session);
    const ids = new Set(session.vehicle.regions.map((r) => r.id));
    loadDrawing(blobStore, key, ids)
      .then((saved) => {
        if (!alive) return;
        if (saved) session.restore(saved.drawing, saved.basePng);
        else paint.value = session.paintImage;
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
      installWebProbe(null);
    };
  }, [session, key, paint]);

  // Save when the app goes to the background and when leaving the studio.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') void saver.saveNow();
    });
    return () => {
      sub.remove();
      if (saver.pending) void saver.saveNow();
      void saver.settled().then(() => session.dispose());
    };
  }, [session, saver]);

  return { session, paint, live, transform, history, zoomed, ready, saveNow: () => saver.saveNow() };
}
