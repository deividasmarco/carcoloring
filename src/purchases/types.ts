/**
 * The slice of the purchases SDK the app uses. RevenueCat's own types satisfy
 * these shapes; tests and the web development store provide their own.
 */

export interface EntitlementLike {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  expirationDate: string | null;
  productIdentifier: string;
  isSandbox: boolean;
  billingIssueDetectedAt: string | null;
  unsubscribeDetectedAt: string | null;
  /** 'VERIFIED' | 'VERIFIED_ON_DEVICE' | 'FAILED' | 'NOT_REQUESTED' (RevenueCat trusted entitlements). */
  verification: string;
}

export interface CustomerInfoLike {
  entitlements: {
    active: Record<string, EntitlementLike>;
    all?: Record<string, EntitlementLike>;
    verification: string;
  };
  managementURL: string | null;
}

/** The monthly subscription as offered by the store. */
export interface MonthlyOffer {
  productId: string;
  /** Localised price from the store, e.g. "€2.99" or "2,99 €". */
  priceString: string;
  /** Billing period from the store (ISO 8601, e.g. "P1M"), when it reports one. */
  period: string | null;
  /** Opaque store package, handed back to `purchase`. */
  ref: unknown;
}

export type PurchaseFailure = 'network' | 'not-allowed' | 'store' | 'unavailable' | 'busy' | 'unknown';

export type PurchaseOutcome =
  | { kind: 'purchased'; info: CustomerInfoLike }
  | { kind: 'cancelled' }
  /** Waiting for approval (Ask to Buy, or a pending payment). */
  | { kind: 'pending' }
  | { kind: 'failed'; reason: PurchaseFailure; message: string };

export type ClientKind =
  /** The real SDK in a development or store build. */
  | 'revenuecat'
  /** RevenueCat's Expo Go "Preview API mode": mocked, never grants access. */
  | 'preview'
  /** Web development builds only: a scripted test store. */
  | 'dev-test-store'
  /** No purchases here (production web, or no API key configured). */
  | 'unavailable';

export interface PurchasesClient {
  readonly kind: ClientKind;
  /** Parent-facing reason when `kind` is 'unavailable'. */
  readonly unavailableReason?: string;
  /** 'App Store', 'Google Play' or 'Test store'. */
  readonly storeName: string;
  start(): Promise<void>;
  /** Latest customer info; served from the SDK's cache when offline. */
  getCustomerInfo(): Promise<CustomerInfoLike>;
  addListener(listener: (info: CustomerInfoLike) => void): () => void;
  getMonthlyOffer(): Promise<MonthlyOffer | null>;
  purchase(offer: MonthlyOffer): Promise<PurchaseOutcome>;
  restore(): Promise<CustomerInfoLike>;
  /** Opens the store's subscription management. */
  manageSubscriptions(info: CustomerInfoLike | null): Promise<void>;
}

/** Thrown by the client when the store cannot be reached. */
export class PurchasesUnreachableError extends Error {
  constructor(message = 'The store could not be reached.') {
    super(message);
    this.name = 'PurchasesUnreachableError';
  }
}
