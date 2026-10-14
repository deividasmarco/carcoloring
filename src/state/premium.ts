/**
 * The app's premium store (one per app run) and React hooks for it.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { tierOf } from '../content/collection';
import { installPremiumProbe } from '../dev/webProbe';
import { createPurchasesClient } from '../purchases/client';
import { isParentGateOpen } from './parentGate';
import { createPremiumStore, type PremiumState, type PremiumStore } from './premiumStore';

let store: PremiumStore | null = null;

export function premiumStore(): PremiumStore {
  store ??= createPremiumStore(createPurchasesClient(), { isParentGateOpen: () => isParentGateOpen(), allowTestStore: __DEV__ });
  return store;
}

/** Starts the SDK once and refreshes when the app returns to the foreground. */
export function usePremiumLifecycle() {
  useEffect(() => {
    const s = premiumStore();
    void s.start();
    let last = Date.now();
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      // Throttled, except straight after the parent opened subscription management.
      if (!s.takeRefreshRequest() && Date.now() - last < 30_000) return;
      last = Date.now();
      void s.refresh();
    });
    installPremiumProbe({
      state: () => {
        const st = s.getState();
        return { phase: st.phase, entitled: s.isEntitled(), stale: st.stale, clientKind: st.clientKind, action: st.action.status };
      },
      refresh: () => s.refresh(),
    });
    return () => {
      sub.remove();
      installPremiumProbe(null);
    };
  }, []);
}

export function usePremium(): PremiumState {
  const s = premiumStore();
  return useSyncExternalStore(s.subscribe, s.getState, s.getState);
}

/**
 * - 'free'      a permanently free vehicle
 * - 'unlocked'  premium, and the verified entitlement is active
 * - 'locked'    premium without an active entitlement
 * - 'checking'  premium, while the SDK has not answered yet
 */
export type VehicleAccess = 'free' | 'unlocked' | 'locked' | 'checking';

export function accessOf(vehicleId: string, state: PremiumState, entitled: boolean): VehicleAccess {
  if (tierOf(vehicleId) === 'free') return 'free';
  if (entitled) return 'unlocked';
  return state.phase === 'starting' ? 'checking' : 'locked';
}

export function useVehicleAccess(vehicleId: string): VehicleAccess {
  const state = usePremium();
  return accessOf(vehicleId, state, premiumStore().isEntitled());
}

export const canPaint = (access: VehicleAccess) => access === 'free' || access === 'unlocked';
