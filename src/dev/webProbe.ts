/**
 * Development-only probe for automated browser checks (Playwright). Exposes
 * the open drawing session on `window.__neonBay` so tests can convert artwork
 * points to screen points and read back the committed paint. Never installed
 * in production builds or on native.
 */
import { AlphaType, ColorType } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { resolveStartRegion } from '../engine/regions/hitMap';
import type { DrawingSession } from '../engine/session/drawingSession';
import { toScreen } from '../engine/view/viewTransform';

export function installWebProbe(session: DrawingSession | null) {
  if (!__DEV__ || Platform.OS !== 'web') return;
  const g = globalThis as unknown as { __neonBay?: unknown };
  if (!session) {
    delete g.__neonBay;
    return;
  }
  const rt = session.vehicle;
  g.__neonBay = {
    vehicleId: rt.def.id,
    regions: rt.regions.map((r) => ({ id: r.id, code: r.code, bounds: r.bounds, material: r.material })),
    transform: () => session.transform,
    zoom: () => session.transform.scale / session.fitTransform.scale,
    toScreen: (x: number, y: number) => toScreen(session.transform, { x, y }),
    regionAt: (x: number, y: number) => {
      const r = resolveStartRegion(rt.hitMap, x, y, { searchRadius: 0.5, ambiguityMargin: 1 });
      return r.code === null ? null : rt.regionByCode.get(r.code)?.id ?? null;
    },
    /** Paint alpha (0–255) of the committed raster at an artwork point. */
    paintAlphaAt: (x: number, y: number) => {
      const img = session.paintImage;
      const rect = rt.layout.paintRect;
      const s = img.width() / rect.width;
      const px = img.readPixels(Math.floor((x - rect.x) * s), Math.floor((y - rect.y) * s), {
        width: 1,
        height: 1,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      }) as Uint8Array | null;
      return px ? px[3] : -1;
    },
    history: () => session.historyState,
    strokeCount: () => session.strokeCount,
    mode: () => session.machine.mode,
  };
}

/** Garage carousel state for browser checks: position (animated) and selection. */
export function installGarageProbe(
  probe: {
    position: () => number;
    selected: () => number;
    /** Vehicle ids of the cars currently mounted in the carousel. */
    mounted: () => string[];
    /** Distance between cars, and the top of the car area and the floor line on screen (dp). */
    stage: () => { slideW: number; top: number; ground: number };
    /** How the last swipe release was read: finger travel (dp), velocity (cars/s) and the direction chosen. */
    lastRelease: () => { travel: number; velocity: number; dir: number } | null;
    /** The selected vehicle's outline at rest, on screen (dp). */
    carRect: () => { x: number; y: number; width: number; height: number };
    vehicleIds: string[];
  } | null,
) {
  if (!__DEV__ || Platform.OS !== 'web') return;
  const g = globalThis as unknown as { __neonBayGarage?: unknown };
  if (probe) g.__neonBayGarage = probe;
  else delete g.__neonBayGarage;
}

/** Premium access for browser checks: the state, and a refresh as on returning to the app. */
export function installPremiumProbe(
  probe: {
    state: () => { phase: string; entitled: boolean; stale: boolean; clientKind: string; action: string };
    refresh: () => Promise<void>;
  } | null,
) {
  if (!__DEV__ || Platform.OS !== 'web') return;
  const g = globalThis as unknown as { __neonBayPremium?: unknown };
  if (probe) g.__neonBayPremium = probe;
  else delete g.__neonBayPremium;
}
