/**
 * Premium access from the purchases SDK's customer info (pure).
 *
 * Access is granted only for an active `neon_bay_premium` entitlement whose
 * signature RevenueCat verified (trusted entitlements: VERIFIED on its
 * servers, or VERIFIED_ON_DEVICE through StoreKit 2). A FAILED or missing
 * verification never unlocks anything, and nothing stored by the app itself
 * can grant access.
 */
import { PREMIUM_ENTITLEMENT_ID } from '../content/collection';
import type { CustomerInfoLike } from './types';

const VERIFIED = new Set(['VERIFIED', 'VERIFIED_ON_DEVICE']);

export interface PremiumStatus {
  /** Premium vehicles may be painted. */
  entitled: boolean;
  /** The SDK reports the entitlement active but its verification failed or was not performed. */
  unverified: boolean;
  /** End of the current period (ISO), when known. */
  expiresAt: string | null;
  willRenew: boolean;
  /** The store reported a billing problem; the store's grace period may still apply. */
  billingIssue: boolean;
  isSandbox: boolean;
  productId: string | null;
  /** Store page where the subscription can be managed or cancelled. */
  managementUrl: string | null;
}

export const NO_PREMIUM: PremiumStatus = {
  entitled: false,
  unverified: false,
  expiresAt: null,
  willRenew: false,
  billingIssue: false,
  isSandbox: false,
  productId: null,
  managementUrl: null,
};

export function premiumStatusFrom(info: CustomerInfoLike): PremiumStatus {
  const e = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!e || !e.isActive) return { ...NO_PREMIUM, managementUrl: info.managementURL };
  const verified = VERIFIED.has(e.verification);
  return {
    entitled: verified,
    unverified: !verified,
    expiresAt: e.expirationDate,
    willRenew: e.willRenew,
    billingIssue: !!e.billingIssueDetectedAt,
    isSandbox: e.isSandbox,
    productId: e.productIdentifier,
    managementUrl: info.managementURL,
  };
}

/** Milliseconds until the current period ends, or null when not applicable. */
export function msUntilExpiry(status: PremiumStatus, now: number): number | null {
  if (!status.entitled || !status.expiresAt) return null;
  const t = Date.parse(status.expiresAt);
  return Number.isFinite(t) ? t - now : null;
}
