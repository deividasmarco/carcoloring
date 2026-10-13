/**
 * The parental gate: open after a grown-up answered the gate question, for a
 * few minutes, and only in memory (a restart always asks again). Leaving the
 * parent area closes it. Purchases, restores, subscription management and
 * external links all check it at the moment they run, so no route or button
 * can reach them without passing the gate.
 *
 * Wrong answers are counted here too, not in the gate screen, so closing and
 * reopening the gate neither resets the count nor skips the pause.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';

export const PARENT_GATE_OPEN_MS = 10 * 60 * 1000;
/** Wrong answers in a row before the gate pauses. */
export const GATE_MAX_ATTEMPTS = 3;
export const GATE_COOLDOWN_MS = 30_000;

let openedAt: number | null = null;
let misses = 0;
let pausedUntil = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openParentGate(now = Date.now()) {
  openedAt = now;
  misses = 0;
  emit();
}

/** Records a wrong answer; returns how long the gate now pauses (0: ask again at once). */
export function recordGateMiss(now = Date.now()): number {
  misses++;
  if (misses < GATE_MAX_ATTEMPTS) return 0;
  misses = 0;
  pausedUntil = now + GATE_COOLDOWN_MS;
  return GATE_COOLDOWN_MS;
}

/** Milliseconds left of the pause after too many wrong answers. */
export function gatePauseRemaining(now = Date.now()) {
  return Math.max(0, pausedUntil - now);
}

export function closeParentGate() {
  if (openedAt === null) return;
  openedAt = null;
  emit();
}

export function isParentGateOpen(now = Date.now()) {
  return openedAt !== null && now - openedAt < PARENT_GATE_OPEN_MS;
}

/** Re-renders when the gate opens, closes or times out. */
export function useParentGateOpen(): boolean {
  const opened = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => openedAt,
    () => openedAt,
  );
  const [, tick] = useState(0);
  useEffect(() => {
    if (opened === null) return;
    const t = setTimeout(() => tick((n) => n + 1), Math.max(0, opened + PARENT_GATE_OPEN_MS - Date.now()) + 50);
    return () => clearTimeout(t);
  }, [opened]);
  return opened !== null && isParentGateOpen();
}
