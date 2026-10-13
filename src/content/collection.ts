/**
 * Who may paint what.
 *
 * Free vehicles are an explicit set of permanent vehicle ids — never a
 * position in the garage — so reordering the garage or adding vehicles can
 * neither lock a free car nor unlock a premium one. Every other vehicle needs
 * the premium entitlement, as verified by the purchases SDK.
 */

/** Permanently free, with every tool. Never remove an id from this set. */
export const FREE_VEHICLE_IDS: ReadonlySet<string> = new Set(['apex-gt', 'blaze-gt', 'storm-sedan']);

/** RevenueCat entitlement that unlocks every premium vehicle. */
export const PREMIUM_ENTITLEMENT_ID = 'neon_bay_premium';

/** Store product of the monthly subscription (App Store Connect / Google Play). */
export const PREMIUM_MONTHLY_PRODUCT_ID = 'neon_bay_premium_monthly';

export type VehicleTier = 'free' | 'premium';

export function tierOf(vehicleId: string): VehicleTier {
  return FREE_VEHICLE_IDS.has(vehicleId) ? 'free' : 'premium';
}
