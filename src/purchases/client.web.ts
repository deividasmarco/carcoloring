/**
 * Purchases on the web.
 *
 * Production web builds sell nothing: subscriptions live in the iOS and
 * Android apps. Web *development* builds get a scripted test store so the
 * subscription flows (purchase, cancel, Ask to Buy, expiry, refund, offline)
 * can be exercised in a browser. It is clearly labelled, exists only when
 * __DEV__ is true, and this file is never part of a native bundle.
 */
import { PREMIUM_ENTITLEMENT_ID, PREMIUM_MONTHLY_PRODUCT_ID } from '../content/collection';
import { PurchasesUnreachableError, type CustomerInfoLike, type MonthlyOffer, type PurchaseOutcome, type PurchasesClient } from './types';

class UnavailableClient implements PurchasesClient {
  readonly kind = 'unavailable' as const;
  readonly storeName = 'App Store';
  readonly unavailableReason = 'Subscriptions are available in the iPhone, iPad and Android apps.';
  async start() {}
  async getCustomerInfo(): Promise<CustomerInfoLike> {
    return { entitlements: { active: {}, verification: 'NOT_REQUESTED' }, managementURL: null };
  }
  addListener() {
    return () => {};
  }
  async getMonthlyOffer() {
    return null;
  }
  async purchase(): Promise<PurchaseOutcome> {
    return { kind: 'failed', reason: 'unavailable', message: this.unavailableReason };
  }
  async restore() {
    return this.getCustomerInfo();
  }
  async manageSubscriptions() {}
}

// ── Development test store ──────────────────────────────────────────────────

type NextPurchase = 'success' | 'cancel' | 'pending' | 'network-error';
interface TestStoreState {
  subscribed: boolean;
  /** End of the current period (ms). */
  expiresAt: number | null;
  willRenew: boolean;
  pending: boolean;
  /** No connection (kept across reloads, to test an offline restart). */
  offline?: boolean;
  /** Customer info last received online: what the SDK serves from its device cache when offline. */
  cache?: CustomerInfoLike | null;
}

const KEY = 'neon-bay/dev-test-store.json';
const PERIOD_MS = 30 * 24 * 3600 * 1000;

function load(): TestStoreState {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return JSON.parse(raw) as TestStoreState;
  } catch {
    // ignore
  }
  return { subscribed: false, expiresAt: null, willRenew: false, pending: false };
}
const NOT_SUBSCRIBED: TestStoreState = { subscribed: false, expiresAt: null, willRenew: false, pending: false };

class DevTestStore implements PurchasesClient {
  readonly kind = 'dev-test-store' as const;
  readonly storeName = 'Test store';
  private state = load();
  private listeners = new Set<(info: CustomerInfoLike) => void>();
  nextPurchase: NextPurchase = 'success';

  get offline() {
    return !!this.state.offline;
  }
  set offline(v: boolean) {
    this.state.offline = v;
    this.save();
  }

  async start() {}

  private save() {
    try {
      globalThis.localStorage?.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
  }

  private info(): CustomerInfoLike {
    const s = this.state;
    const active = s.subscribed && s.expiresAt !== null && s.expiresAt > Date.now();
    const ent = {
      identifier: PREMIUM_ENTITLEMENT_ID,
      isActive: true,
      willRenew: s.willRenew,
      expirationDate: s.expiresAt ? new Date(s.expiresAt).toISOString() : null,
      productIdentifier: PREMIUM_MONTHLY_PRODUCT_ID,
      isSandbox: true,
      billingIssueDetectedAt: null,
      unsubscribeDetectedAt: s.willRenew ? null : new Date().toISOString(),
      verification: 'VERIFIED',
    };
    return {
      entitlements: { active: active ? { [PREMIUM_ENTITLEMENT_ID]: ent } : {}, verification: 'VERIFIED' },
      managementURL: null,
    };
  }

  /** Store-side change (renewal, expiry, refund); reaches the app only while online, like the SDK's listener. */
  private emit() {
    this.save();
    if (this.offline) return;
    const info = this.online();
    for (const l of this.listeners) l(info);
  }

  /** A successful round trip: refreshes the device cache. */
  private online() {
    const info = this.info();
    this.state.cache = info;
    this.save();
    return info;
  }

  /** Like the SDK: offline, the device cache answers; without one, the call fails. */
  async getCustomerInfo() {
    if (!this.offline) return this.online();
    if (this.state.cache) return this.state.cache;
    throw new PurchasesUnreachableError();
  }

  addListener(listener: (info: CustomerInfoLike) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async getMonthlyOffer(): Promise<MonthlyOffer | null> {
    if (this.offline) throw new PurchasesUnreachableError();
    const priceString = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(2.99);
    return { productId: PREMIUM_MONTHLY_PRODUCT_ID, priceString, period: 'P1M', ref: 'test-monthly' };
  }

  async purchase(): Promise<PurchaseOutcome> {
    await new Promise((r) => setTimeout(r, 150));
    if (this.offline) return { kind: 'failed', reason: 'network', message: 'The test store is offline.' };
    switch (this.nextPurchase) {
      case 'cancel':
        return { kind: 'cancelled' };
      case 'pending':
        this.state.pending = true;
        this.save();
        return { kind: 'pending' };
      case 'network-error':
        return { kind: 'failed', reason: 'network', message: 'The test store is offline.' };
      default:
        this.state = { ...this.state, subscribed: true, expiresAt: Date.now() + PERIOD_MS, willRenew: true, pending: false };
        this.emit();
        return { kind: 'purchased', info: this.online() };
    }
  }

  async restore() {
    if (this.offline) throw new PurchasesUnreachableError();
    return this.online();
  }

  async manageSubscriptions() {
    // The test store has no account page; cancelling is scripted below.
  }

  // Scripted events (development probes).
  approvePending() {
    if (!this.state.pending) return;
    this.state = { ...this.state, subscribed: true, expiresAt: Date.now() + PERIOD_MS, willRenew: true, pending: false };
    this.emit();
  }
  /** The current period ends in `ms` (0: now). */
  expireIn(ms: number) {
    this.state.expiresAt = Date.now() + ms;
    this.state.willRenew = false;
    this.emit();
  }
  refund() {
    this.state = { ...this.state, ...NOT_SUBSCRIBED };
    this.emit();
  }
  /** Drops the device cache, so an offline refresh fails instead of answering from it. */
  forgetCache() {
    this.state.cache = null;
    this.save();
  }
  /** Back to a fresh install: no subscription, no device cache, online. */
  reset() {
    this.state = { ...NOT_SUBSCRIBED };
    this.nextPurchase = 'success';
    this.emit();
  }
}

export function createPurchasesClient(): PurchasesClient {
  if (!__DEV__) return new UnavailableClient();
  const store = new DevTestStore();
  (globalThis as unknown as { __neonBayTestStore?: DevTestStore }).__neonBayTestStore = store;
  return store;
}
