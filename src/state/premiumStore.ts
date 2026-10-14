/**
 * Premium access state, driven only by the purchases SDK (framework-free, so
 * it can be tested with a scripted client).
 *
 * - Access comes from verified SDK customer info (see purchases/entitlement).
 *   Nothing the app stores itself can grant it.
 * - Offline and failed refreshes keep the last status the SDK reported (the
 *   SDK serves its own cache when offline), so a temporary failure never
 *   ejects a subscriber. The status is marked stale until a refresh succeeds.
 * - When the current period ends, the store refreshes so an expiry, renewal
 *   or refund is picked up while the app is open.
 * - Purchase, restore and subscription management only run while the
 *   parental gate is open.
 */
import { msUntilExpiry, NO_PREMIUM, premiumStatusFrom, type PremiumStatus } from '../purchases/entitlement';
import { PurchasesUnreachableError, type ClientKind, type CustomerInfoLike, type MonthlyOffer, type PurchasesClient } from '../purchases/types';

export type OfferState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; offer: MonthlyOffer }
  | { status: 'none' | 'error'; message: string };

export type ActionStatus =
  | 'idle'
  | 'purchasing'
  | 'restoring'
  | 'pending-approval'
  | 'purchased'
  | 'restored'
  | 'nothing-to-restore'
  | 'cancelled'
  | 'failed';

export interface PremiumState {
  /** 'starting' until the SDK first answered (or gave up). */
  phase: 'starting' | 'ready';
  clientKind: ClientKind;
  storeName: string;
  unavailableReason?: string;
  /** Last status the SDK reported. */
  status: PremiumStatus;
  /** The last refresh failed; `status` is the last known one. */
  stale: boolean;
  offer: OfferState;
  action: { status: ActionStatus; message?: string };
}

export interface PremiumStoreDeps {
  isParentGateOpen(): boolean;
  now?(): number;
  setTimer?(cb: () => void, ms: number): unknown;
  clearTimer?(t: unknown): void;
  /** Development builds may let the web test store grant access. */
  allowTestStore?: boolean;
  /** Give up waiting for the first SDK answer after this long. */
  startTimeoutMs?: number;
}

const MAX_TIMER_MS = 6 * 3600 * 1000;

export function createPremiumStore(client: PurchasesClient, deps: PremiumStoreDeps) {
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((cb, ms) => setTimeout(cb, ms));
  const clearTimer = deps.clearTimer ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>));
  let state: PremiumState = {
    phase: 'starting',
    clientKind: client.kind,
    storeName: client.storeName,
    unavailableReason: client.unavailableReason,
    status: NO_PREMIUM,
    stale: false,
    offer: { status: 'idle' },
    action: { status: 'idle' },
  };
  let lastInfo: CustomerInfoLike | null = null;
  let expiryTimer: unknown = null;
  let refreshRequested = false;
  let started = false;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<PremiumState>) => {
    state = { ...state, ...patch };
    for (const l of listeners) l();
  };

  /** Whether this client's answers may unlock anything. */
  const trusted = client.kind === 'revenuecat' || (client.kind === 'dev-test-store' && !!deps.allowTestStore);

  function apply(info: CustomerInfoLike) {
    lastInfo = info;
    const status = premiumStatusFrom(info);
    const patch: Partial<PremiumState> = { status, stale: false, phase: 'ready' };
    if (state.action.status === 'pending-approval' && status.entitled) patch.action = { status: 'purchased' };
    set(patch);
    scheduleExpiryRefresh(status);
  }

  function scheduleExpiryRefresh(status: PremiumStatus) {
    if (expiryTimer !== null) clearTimer(expiryTimer);
    expiryTimer = null;
    const ms = msUntilExpiry(status, now());
    if (ms === null) return;
    expiryTimer = setTimer(() => {
      expiryTimer = null;
      void refresh();
    }, Math.min(MAX_TIMER_MS, Math.max(1000, ms + 5000)));
  }

  async function refresh() {
    try {
      apply(await client.getCustomerInfo());
    } catch {
      // Keep the last status the SDK gave us; never eject on a failed refresh.
      set({ stale: true, phase: 'ready' });
    }
  }

  async function start() {
    if (started) return;
    started = true;
    const timeout = setTimer(() => {
      if (state.phase === 'starting') set({ phase: 'ready', stale: true });
    }, deps.startTimeoutMs ?? 8000);
    try {
      await client.start();
      client.addListener(apply);
      await refresh();
    } catch {
      set({ phase: 'ready', stale: true });
    } finally {
      clearTimer(timeout);
    }
  }

  async function loadOffer() {
    if (state.offer.status === 'loading') return;
    set({ offer: { status: 'loading' } });
    try {
      const offer = await client.getMonthlyOffer();
      // Configuration details stay in `unavailableReason` (development diagnostics); customers get plain words.
      set({ offer: offer ? { status: 'ready', offer } : { status: 'none', message: UNAVAILABLE } });
    } catch (e) {
      set({
        offer: {
          status: 'error',
          message: e instanceof PurchasesUnreachableError ? 'The store could not be reached. Check the connection and try again.' : 'The price could not be loaded. Please try again.',
        },
      });
    }
  }

  const gateClosed = () => {
    set({ action: { status: 'failed', message: 'Please answer the grown-up question again.' } });
  };

  async function purchase() {
    if (!deps.isParentGateOpen()) return gateClosed();
    if (state.offer.status !== 'ready') return;
    if (state.action.status === 'purchasing' || state.action.status === 'restoring') return;
    set({ action: { status: 'purchasing' } });
    const out = await client.purchase(state.offer.offer);
    switch (out.kind) {
      case 'purchased':
        apply(out.info);
        set({ action: premiumStatusFrom(out.info).entitled ? { status: 'purchased' } : { status: 'failed', message: 'The purchase finished but could not be verified yet. Try "Restore purchases" in a moment.' } });
        return;
      case 'cancelled':
        set({ action: { status: 'cancelled' } });
        return;
      case 'pending':
        set({ action: { status: 'pending-approval' } });
        return;
      default:
        set({ action: { status: 'failed', message: purchaseMessage(out.reason, out.message) } });
    }
  }

  async function restore() {
    if (!deps.isParentGateOpen()) return gateClosed();
    if (state.action.status === 'purchasing' || state.action.status === 'restoring') return;
    set({ action: { status: 'restoring' } });
    try {
      const info = await client.restore();
      apply(info);
      set({ action: { status: premiumStatusFrom(info).entitled ? 'restored' : 'nothing-to-restore' } });
    } catch (e) {
      set({
        action: {
          status: 'failed',
          message: e instanceof PurchasesUnreachableError ? 'The store could not be reached. Check the connection and try again.' : 'Purchases could not be restored. Please try again.',
        },
      });
    }
  }

  async function manage() {
    if (!deps.isParentGateOpen()) return gateClosed();
    // The subscription may change in the store's own screens: check again on return.
    refreshRequested = true;
    try {
      await client.manageSubscriptions(lastInfo);
    } catch {
      set({ action: { status: 'failed', message: `Open your ${client.storeName} account settings to manage the subscription.` } });
    }
  }

  return {
    getState: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    /** Premium vehicles may be painted right now. */
    isEntitled: () => trusted && state.status.entitled,
    start,
    refresh,
    loadOffer,
    purchase,
    restore,
    manage,
    clearAction: () => set({ action: { status: 'idle' } }),
    /** True once after subscription management was opened (refresh on return, whatever the throttle). */
    takeRefreshRequest() {
      const r = refreshRequested;
      refreshRequested = false;
      return r;
    },
  };
}

/** What customers see when purchases cannot be offered (the reason is for developers). */
export const UNAVAILABLE = 'Purchases are unavailable right now. Please try again later.';

export type PremiumStore = ReturnType<typeof createPremiumStore>;

function purchaseMessage(reason: string, message: string) {
  if (__DEV__ && message) console.warn(`[purchases] ${reason}: ${message}`);
  switch (reason) {
    case 'network':
      return 'The store could not be reached. Check the connection and try again.';
    case 'not-allowed':
      return 'Purchases are not allowed on this device (check Screen Time or Family settings).';
    case 'store':
      return 'The store had a problem. Please try again later.';
    case 'busy':
      return 'A purchase is already in progress.';
    case 'unavailable':
      return UNAVAILABLE;
    default:
      return 'The purchase did not go through. Please try again.';
  }
}
