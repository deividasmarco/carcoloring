/**
 * Asks the garage to show a vehicle (from All cars, My Creations or the
 * studio). The garage owns its selection: it takes the request, by permanent
 * id, when it is focused again, so the change is made while it is on screen.
 */
let pending: string | null = null;

export function requestGarageSelection(vehicleId: string) {
  pending = vehicleId;
}

/** The requested vehicle id, once (null when there is none). */
export function takeGarageSelection(): string | null {
  const id = pending;
  pending = null;
  return id;
}
