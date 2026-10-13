import { FREE_VEHICLE_IDS, PREMIUM_ENTITLEMENT_ID, tierOf } from '../src/content/collection';
import { premiumStatusFrom } from '../src/purchases/entitlement';
import { PurchasesUnreachableError, type ClientKind, type CustomerInfoLike, type MonthlyOffer, type PurchaseOutcome, type PurchasesClient } from '../src/purchases/types';
import { createPremiumStore } from '../src/state/premiumStore';

const DAY = 24 * 3600 * 1000;

function info(opts: { active?: boolean; verification?: string; expiresAt?: number; willRenew?: boolean } = {}): CustomerInfoLike {
  const { active = true, verification = 'VERIFIED', expiresAt = Date.now() + 20 * DAY, willRenew = true } = opts;
  const ent = {
    identifier: PREMIUM_ENTITLEMENT_ID,
    isActive: true,
    willRenew,
    expirationDate: new Date(expiresAt).toISOString(),
    productIdentifier: 'neon_bay_premium_monthly',
    isSandbox: true,
    billingIssueDetectedAt: null,
    unsubscribeDetectedAt: null,
    verification,
  };
  return { entitlements: { active: active ? { [PREMIUM_ENTITLEMENT_ID]: ent } : {}, verification }, managementURL: 'https://apps.apple.com/account/subscriptions' };
}
const none = () => info({ active: false });

/** A scripted purchases client. */
class FakeClient implements PurchasesClient {
  storeName = 'App Store';
  current: CustomerInfoLike = none();
  offline = false;
  nextPurchase: PurchaseOutcome | 'grant' = 'grant';
  calls: string[] = [];
  private listeners = new Set<(i: CustomerInfoLike) => void>();
  constructor(readonly kind: ClientKind = 'revenuecat') {}
  async start() {}
  async getCustomerInfo() {
    this.calls.push('getCustomerInfo');
    if (this.offline) throw new PurchasesUnreachableError();
    return this.current;
  }
  addListener(l: (i: CustomerInfoLike) => void) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  push(next: CustomerInfoLike) {
    this.current = next;
    this.listeners.forEach((l) => l(next));
  }
  async getMonthlyOffer(): Promise<MonthlyOffer | null> {
    if (this.offline) throw new PurchasesUnreachableError();
    return { productId: 'neon_bay_premium_monthly', priceString: '€2.99', ref: 'pkg' };
  }
  async purchase(): Promise<PurchaseOutcome> {
    this.calls.push('purchase');
    if (this.nextPurchase === 'grant') {
      this.current = info();
      return { kind: 'purchased', info: this.current };
    }
    return this.nextPurchase;
  }
  async restore() {
    this.calls.push('restore');
    if (this.offline) throw new PurchasesUnreachableError();
    return this.current;
  }
  async manageSubscriptions() {
    this.calls.push('manage');
  }
}

function setup(kind: ClientKind = 'revenuecat', opts: { gate?: boolean; allowTestStore?: boolean } = {}) {
  const client = new FakeClient(kind);
  let gate = opts.gate ?? true;
  let clock = Date.now();
  const timers: { at: number; cb: () => void }[] = [];
  const store = createPremiumStore(client, {
    isParentGateOpen: () => gate,
    now: () => clock,
    setTimer: (cb, ms) => {
      const t = { at: clock + ms, cb };
      timers.push(t);
      return t;
    },
    clearTimer: (t) => {
      const i = timers.indexOf(t as never);
      if (i >= 0) timers.splice(i, 1);
    },
    allowTestStore: opts.allowTestStore,
  });
  return {
    client,
    store,
    setGate: (v: boolean) => (gate = v),
    /** Advances the fake clock, running due timers. */
    async advance(ms: number) {
      clock += ms;
      for (const t of [...timers].sort((a, b) => a.at - b.at)) {
        if (t.at <= clock) {
          timers.splice(timers.indexOf(t), 1);
          t.cb();
        }
      }
      await new Promise((r) => setImmediate(r));
    },
  };
}

describe('free and premium vehicles', () => {
  it('are decided by explicit ids, not by position', () => {
    expect([...FREE_VEHICLE_IDS]).toEqual(['apex-gt', 'blaze-gt', 'storm-sedan']);
    expect(tierOf('apex-gt')).toBe('free');
    expect(tierOf('orbit-gt')).toBe('premium');
    expect(tierOf('a-vehicle-added-later')).toBe('premium');
  });
});

describe('entitlement verification', () => {
  it('unlocks only a verified, active entitlement', () => {
    expect(premiumStatusFrom(info()).entitled).toBe(true);
    expect(premiumStatusFrom(info({ verification: 'VERIFIED_ON_DEVICE' })).entitled).toBe(true);
    expect(premiumStatusFrom(info({ verification: 'FAILED' }))).toMatchObject({ entitled: false, unverified: true });
    expect(premiumStatusFrom(info({ verification: 'NOT_REQUESTED' }))).toMatchObject({ entitled: false, unverified: true });
    expect(premiumStatusFrom(none()).entitled).toBe(false);
  });
});

describe('premium store', () => {
  it('starts from the SDK: no entitlement, then a verified one', async () => {
    const { client, store } = setup();
    await store.start();
    expect(store.getState().phase).toBe('ready');
    expect(store.isEntitled()).toBe(false);
    client.push(info());
    expect(store.isEntitled()).toBe(true);
  });

  it('keeps a subscriber unlocked when a refresh fails (offline), marking it stale', async () => {
    const { client, store } = setup();
    client.current = info();
    await store.start();
    expect(store.isEntitled()).toBe(true);
    client.offline = true;
    await store.refresh();
    expect(store.isEntitled()).toBe(true);
    expect(store.getState().stale).toBe(true);
    client.offline = false;
    await store.refresh();
    expect(store.getState().stale).toBe(false);
  });

  it('stays locked offline when the SDK has never confirmed premium', async () => {
    const { client, store } = setup();
    client.offline = true;
    await store.start();
    expect(store.getState().phase).toBe('ready');
    expect(store.isEntitled()).toBe(false);
  });

  it('refreshes when the period ends, locking after an expiry and staying unlocked after a renewal', async () => {
    const { client, store, advance } = setup();
    client.current = info({ expiresAt: Date.now() + 60_000 });
    await store.start();
    expect(store.isEntitled()).toBe(true);
    // Renewed by the store before the timer fires.
    client.current = info({ expiresAt: Date.now() + 30 * DAY });
    await advance(70_000);
    expect(store.isEntitled()).toBe(true);
    // Not renewed: the next refresh after expiry locks premium.
    client.current = none();
    await advance(31 * DAY);
    expect(store.isEntitled()).toBe(false);
  });

  it('locks premium when a refund or revocation arrives', async () => {
    const { client, store } = setup();
    client.current = info();
    await store.start();
    client.push(none());
    expect(store.isEntitled()).toBe(false);
  });

  it('never trusts a failed verification', async () => {
    const { client, store } = setup();
    client.current = info({ verification: 'FAILED' });
    await store.start();
    expect(store.isEntitled()).toBe(false);
    expect(store.getState().status.unverified).toBe(true);
  });

  it('purchases only with the parental gate open', async () => {
    const { client, store, setGate } = setup('revenuecat', { gate: false });
    await store.start();
    await store.loadOffer();
    await store.purchase();
    expect(client.calls).not.toContain('purchase');
    expect(store.isEntitled()).toBe(false);
    await store.restore();
    await store.manage();
    expect(client.calls).not.toContain('restore');
    expect(client.calls).not.toContain('manage');
    setGate(true);
    await store.purchase();
    expect(store.isEntitled()).toBe(true);
    expect(store.getState().action.status).toBe('purchased');
  });

  it('reports cancellation without error, and pending approval until it is approved', async () => {
    const { client, store } = setup();
    await store.start();
    await store.loadOffer();
    client.nextPurchase = { kind: 'cancelled' };
    await store.purchase();
    expect(store.getState().action.status).toBe('cancelled');
    expect(store.isEntitled()).toBe(false);
    client.nextPurchase = { kind: 'pending' };
    await store.purchase();
    expect(store.getState().action.status).toBe('pending-approval');
    expect(store.isEntitled()).toBe(false);
    client.push(info()); // approved later (Ask to Buy)
    expect(store.isEntitled()).toBe(true);
    expect(store.getState().action.status).toBe('purchased');
  });

  it('reports purchase failures and unreachable stores', async () => {
    const { client, store } = setup();
    await store.start();
    await store.loadOffer();
    client.nextPurchase = { kind: 'failed', reason: 'network', message: 'x' };
    await store.purchase();
    expect(store.getState().action).toMatchObject({ status: 'failed' });
    client.offline = true;
    await store.restore();
    expect(store.getState().action.message).toMatch(/could not be reached/);
    await store.loadOffer();
    expect(store.getState().offer.status).toBe('error');
  });

  it('restores an existing subscription, or says there is none', async () => {
    const { client, store } = setup();
    await store.start();
    await store.restore();
    expect(store.getState().action.status).toBe('nothing-to-restore');
    client.current = info();
    await store.restore();
    expect(store.getState().action.status).toBe('restored');
    expect(store.isEntitled()).toBe(true);
  });

  it('never lets Expo Go preview mode or the test store grant access unless allowed', async () => {
    for (const kind of ['preview', 'unavailable', 'dev-test-store'] as const) {
      const { client, store } = setup(kind);
      client.current = info();
      await store.start();
      expect(store.getState().status.entitled).toBe(true); // the SDK said so…
      expect(store.isEntitled()).toBe(false); // …but this client is not trusted
    }
    const dev = setup('dev-test-store', { allowTestStore: true });
    dev.client.current = info();
    await dev.store.start();
    expect(dev.store.isEntitled()).toBe(true);
  });
});
