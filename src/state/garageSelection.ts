/**
 * Asks the garage to show a vehicle (from All cars or My Creations). The
 * garage owns its selection; this only carries the request, by permanent id.
 */
let pending: string | null = null;
const listeners = new Set<() => void>();

export function requestGarageSelection(vehicleId: string) {
  pending = vehicleId;
  listeners.forEach((l) => l());
}

/** The requested vehicle id, once (null when there is none). */
export function takeGarageSelection(): string | null {
  const id = pending;
  pending = null;
  return id;
}

export function onGarageSelectionRequest(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
