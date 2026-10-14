/**
 * App settings persisted locally. Tiny store with a hook; no backend.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import { blobStore } from '../engine/persistence/blobStore';

export interface Settings {
  /** Ambient light and rain animation. */
  effects: boolean;
  /** Light vibration on taps (phones that support it). */
  haptics: boolean;
  /** Car last selected in the garage (restored after a restart). */
  lastVehicle?: string;
}

const KEY = 'settings.json';
let state: Settings = { effects: true, haptics: true };
let loaded = false;
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const json = await blobStore.readText(KEY);
    if (json) {
      state = { ...state, ...JSON.parse(json) };
    }
  } catch {
    // Unreadable settings: keep defaults.
  }
  ready = true;
  emit();
}

/** Current settings, outside React. */
export function getSettings(): Settings {
  return state;
}

export function setSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  emit();
  blobStore.writeText(KEY, JSON.stringify(state)).catch(() => {});
}

export function useSettings(): Settings {
  useEffect(() => {
    load();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

/** System "reduce motion" preference, kept up to date. */
let reduceMotion = false;
const motionListeners = new Set<() => void>();
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => {
    reduceMotion = v;
    motionListeners.forEach((l) => l());
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
  reduceMotion = v;
  motionListeners.forEach((l) => l());
});

export function useReduceMotion(): boolean {
  return useSyncExternalStore(
    (l) => {
      motionListeners.add(l);
      return () => motionListeners.delete(l);
    },
    () => reduceMotion,
    () => reduceMotion,
  );
}

/** True once saved settings have been read (or found missing). */
export function useSettingsReady(): boolean {
  useEffect(() => {
    load();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ready,
    () => ready,
  );
}
