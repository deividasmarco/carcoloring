/**
 * Purchases on iOS and Android: RevenueCat (react-native-purchases).
 *
 * Child-directed configuration:
 * - Anonymous app user id only; no subscriber attributes, no attribution
 *   network ids, automatic device-identifier collection off, diagnostics off.
 * - The store's own in-app messages (billing problems, price consent) are not
 *   shown automatically over the child's screen; the parent area reports them.
 * - Trusted entitlements on (INFORMATIONAL): every entitlement carries a
 *   verification result, and only verified ones unlock anything.
 *
 * The public SDK keys come from EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and
 * EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY at build time. They are designed to
 * ship in apps; RevenueCat secret keys (sk_…) are refused and must never be
 * placed in the app.
 *
 * In Expo Go the SDK runs in its "Preview API mode" (JavaScript mocks): useful
 * for UI previews, but it never grants access and verifies nothing.
 *
 * EXPO_PUBLIC_REVENUECAT_SIMULATE_ASK_TO_BUY=1 (iOS test builds only) makes
 * sandbox purchases wait for approval, to test the pending flow on a device.
 * It has no effect outside the App Store sandbox.
 */
import { Linking, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import { PREMIUM_MONTHLY_PRODUCT_ID } from '../content/collection';
import { resolveApiKey } from './apiKey';
import { PurchasesUnreachableError, type ClientKind, type CustomerInfoLike, type MonthlyOffer, type PurchaseFailure, type PurchaseOutcome, type PurchasesClient } from './types';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';
const SIMULATE_ASK_TO_BUY = process.env.EXPO_PUBLIC_REVENUECAT_SIMULATE_ASK_TO_BUY === '1';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function failureOf(e: unknown): PurchaseFailure {
  const code = (e as PurchasesError | undefined)?.code;
  switch (code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'network';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
    case PURCHASES_ERROR_CODE.INSUFFICIENT_PERMISSIONS_ERROR:
      return 'not-allowed';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return 'store';
    case PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR:
      return 'busy';
    case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
    case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return 'unavailable';
    default:
      return 'unknown';
  }
}

function isUnreachable(e: unknown) {
  return failureOf(e) === 'network';
}

/** Runs an SDK call, reporting connection problems as PurchasesUnreachableError. */
async function reach<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (e) {
    if (isUnreachable(e)) throw new PurchasesUnreachableError();
    throw e;
  }
}

/** Packages may carry a ":base-plan" suffix on Google Play. */
const matchesProduct = (p: PurchasesPackage) => p.product.identifier.split(':')[0] === PREMIUM_MONTHLY_PRODUCT_ID;

class RevenueCatClient implements PurchasesClient {
  readonly kind: ClientKind;
  readonly storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  private started: Promise<void> | null = null;

  constructor(private readonly apiKey: string) {
    this.kind = isExpoGo ? 'preview' : 'revenuecat';
  }

  start() {
    this.started ??= (async () => {
      if (await Purchases.isConfigured().catch(() => false)) return;
      Purchases.configure({
        apiKey: this.apiKey,
        entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
        automaticDeviceIdentifierCollectionEnabled: false,
        diagnosticsEnabled: false,
        shouldShowInAppMessagesAutomatically: false,
      });
      await Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.INFO : Purchases.LOG_LEVEL.ERROR).catch(() => {});
      if (SIMULATE_ASK_TO_BUY && Platform.OS === 'ios') await Purchases.setSimulatesAskToBuyInSandbox(true).catch(() => {});
    })();
    return this.started;
  }

  async getCustomerInfo(): Promise<CustomerInfoLike> {
    await this.start();
    return reach(() => Purchases.getCustomerInfo());
  }

  addListener(listener: (info: CustomerInfoLike) => void) {
    const l = (info: CustomerInfo) => listener(info);
    Purchases.addCustomerInfoUpdateListener(l);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(l);
    };
  }

  async getMonthlyOffer(): Promise<MonthlyOffer | null> {
    await this.start();
    const offerings = await reach(() => Purchases.getOfferings());
    const current = offerings.current;
    const pkg = current?.availablePackages.find(matchesProduct) ?? current?.monthly ?? null;
    if (!pkg) return null;
    return { productId: pkg.product.identifier, priceString: pkg.product.priceString, ref: pkg };
  }

  async purchase(offer: MonthlyOffer): Promise<PurchaseOutcome> {
    await this.start();
    try {
      const { customerInfo } = await Purchases.purchasePackage(offer.ref as PurchasesPackage);
      return { kind: 'purchased', info: customerInfo };
    } catch (e) {
      const err = e as PurchasesError;
      if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || err?.userCancelled) return { kind: 'cancelled' };
      if (err?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { kind: 'pending' };
      return { kind: 'failed', reason: failureOf(e), message: err?.message ?? String(e) };
    }
  }

  async restore() {
    await this.start();
    return reach(() => Purchases.restorePurchases());
  }

  async manageSubscriptions(info: CustomerInfoLike | null) {
    await this.start();
    if (Platform.OS === 'ios') {
      await Purchases.showManageSubscriptions();
      return;
    }
    await Linking.openURL(info?.managementURL ?? 'https://play.google.com/store/account/subscriptions');
  }
}

class UnavailableClient implements PurchasesClient {
  readonly kind = 'unavailable' as const;
  readonly storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  constructor(readonly unavailableReason: string) {}
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

export function createPurchasesClient(): PurchasesClient {
  const r = resolveApiKey(Platform.OS, IOS_KEY, ANDROID_KEY);
  return 'key' in r ? new RevenueCatClient(r.key) : new UnavailableClient(r.problem);
}
