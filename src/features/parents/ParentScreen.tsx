/**
 * The parent area (only reachable through the parental gate): what premium
 * unlocks, its price as the store reports it, renewal and cancellation terms,
 * subscribe / restore / manage, and the privacy policy and terms links.
 */
import { useEffect } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FREE_VEHICLE_IDS } from '../../content/collection';
import { GARAGE } from '../../content/registry';
import { isParentGateOpen } from '../../state/parentGate';
import { premiumStore, usePremium } from '../../state/premium';
import type { PremiumState } from '../../state/premiumStore';
import { Icon } from '../../ui/icons';
import { colors, fonts } from '../../ui/theme';

const legal = (Constants.expoConfig?.extra?.legal ?? {}) as { privacyPolicyUrl?: string; termsOfUseUrl?: string };
/** Apple's standard licence agreement applies when no custom terms are set (iOS). */
const APPLE_STANDARD_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = legal.privacyPolicyUrl?.trim() || null;
const TERMS_URL = legal.termsOfUseUrl?.trim() || (Platform.OS === 'ios' ? APPLE_STANDARD_EULA : null);

const PREMIUM = GARAGE.filter((e) => e.tier === 'premium');
const premiumCars = PREMIUM.filter((e) => e.kind === 'car').length;
const premiumBikes = PREMIUM.filter((e) => e.kind === 'superbike').length;

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function openLink(url: string) {
  // External links leave the app: only from inside the gated parent area.
  if (!isParentGateOpen()) return;
  void Linking.openURL(url);
}

function StatusCard({ s, entitled }: { s: PremiumState; entitled: boolean }) {
  const until = formatDate(s.status.expiresAt);
  let title: string;
  let detail: string | null = null;
  if (s.phase === 'starting') {
    title = 'Checking the subscription…';
  } else if (entitled) {
    title = 'Premium garage is active';
    detail = until ? (s.status.willRenew ? `Renews automatically on ${until}.` : `Ends on ${until} and will not renew.`) : null;
  } else if (s.action.status === 'pending-approval') {
    title = 'Waiting for approval';
  } else {
    title = 'Premium garage is not active';
    detail = 'The three free cars are always available.';
  }
  return (
    <View style={[styles.card, entitled && styles.cardActive]} testID="premium-status">
      <View style={styles.row}>
        <Icon name={entitled ? 'check' : 'lock'} size={24} color={entitled ? colors.cyan : colors.textDim} accent={colors.amber} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {detail ? <Text style={styles.body}>{detail}</Text> : null}
      {entitled && s.status.billingIssue ? (
        <Text style={styles.warn}>The {s.storeName} reported a payment problem. Please check the payment method in your {s.storeName} account.</Text>
      ) : null}
      {s.status.unverified ? <Text style={styles.warn}>The subscription could not be verified, so premium stays locked. Try “Restore purchases”.</Text> : null}
      {s.stale ? <Text style={styles.note}>The store could not be reached just now, so this shows the last known status.</Text> : null}
    </View>
  );
}

function ActionMessage({ s }: { s: PremiumState }) {
  const msg = (() => {
    switch (s.action.status) {
      case 'purchased':
        return 'Thank you! Every premium vehicle is now unlocked.';
      case 'restored':
        return 'Purchases restored. Every premium vehicle is unlocked.';
      case 'nothing-to-restore':
        return `No active subscription was found for this ${s.storeName} account.`;
      case 'cancelled':
        return 'The purchase was cancelled. Nothing was charged.';
      case 'pending-approval':
        return 'The purchase is waiting for approval (for example Ask to Buy in Family Sharing). Premium unlocks automatically once it is approved.';
      case 'failed':
        return s.action.message ?? 'Something went wrong. Please try again.';
      default:
        return null;
    }
  })();
  if (!msg) return null;
  return (
    <Text style={[styles.message, s.action.status === 'failed' && styles.warn]} accessibilityLiveRegion="polite" testID="premium-message">
      {msg}
    </Text>
  );
}

export function ParentScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const s = usePremium();
  const store = premiumStore();
  const entitled = store.isEntitled();
  const busy = s.action.status === 'purchasing' || s.action.status === 'restoring';
  const price = s.offer.status === 'ready' ? s.offer.offer.priceString : null;

  useEffect(() => {
    if (!entitled && s.clientKind !== 'unavailable') void store.loadOffer();
    return () => store.clearAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.top, { paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to the garage"
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name="back" size={24} color={colors.text} />
          <Text style={styles.backText}>Garage</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Parents
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32, paddingLeft: insets.left + 20, paddingRight: insets.right + 20 }]}>
        <View style={styles.column}>
          {s.clientKind === 'dev-test-store' ? <Text style={styles.devBanner}>Test store (development build only). No real payment is made.</Text> : null}
          {s.clientKind === 'preview' ? (
            <Text style={styles.devBanner}>Expo Go preview: purchases are simulated by RevenueCat and never unlock anything. Use a development build to test real purchases.</Text>
          ) : null}

          <StatusCard s={s} entitled={entitled} />

          <Text style={styles.h2}>Premium garage</Text>
          <Text style={styles.body}>
            Unlocks {plural(premiumCars, 'premium car', 'premium cars')}
            {premiumBikes ? ` and ${plural(premiumBikes, 'superbike', 'superbikes')}` : ''} with every crayon, the pencil, the eraser, undo and saving — the same
            tools as the {FREE_VEHICLE_IDS.size} free cars, which always stay free.
          </Text>
          <View style={styles.thumbs} accessible accessibilityLabel={`${PREMIUM.length} premium vehicles`}>
            {PREMIUM.map((e) => (
              <View key={e.vehicle.id} style={styles.thumb}>
                <Image source={e.thumbnail} style={styles.thumbImage} resizeMode="contain" />
                <Text style={styles.thumbName} numberOfLines={1}>
                  {e.vehicle.name}
                </Text>
              </View>
            ))}
          </View>

          {!entitled ? (
            <View style={styles.buy}>
              {s.clientKind === 'unavailable' ? (
                <Text style={styles.body}>{s.unavailableReason}</Text>
              ) : s.offer.status === 'ready' ? (
                <>
                  <Text style={styles.price} testID="premium-price">
                    {price} <Text style={styles.per}>per month</Text>
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Subscribe for ${price} per month`}
                    accessibilityState={{ disabled: busy, busy }}
                    disabled={busy}
                    onPress={() => void store.purchase()}
                    style={({ pressed }) => [styles.primary, busy && styles.dim, pressed && styles.pressed]}
                  >
                    {s.action.status === 'purchasing' ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Subscribe</Text>}
                  </Pressable>
                </>
              ) : s.offer.status === 'loading' || s.offer.status === 'idle' ? (
                <ActivityIndicator color={colors.cyan} style={styles.spinner} />
              ) : (
                <View style={styles.row}>
                  <Text style={[styles.body, styles.flex]}>{'message' in s.offer ? s.offer.message : ''}</Text>
                  <Pressable accessibilityRole="button" onPress={() => void store.loadOffer()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Try again</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}

          <ActionMessage s={s} />

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy || s.clientKind === 'unavailable' }}
              disabled={busy || s.clientKind === 'unavailable'}
              onPress={() => void store.restore()}
              style={({ pressed }) => [styles.secondary, (busy || s.clientKind === 'unavailable') && styles.dim, pressed && styles.pressed]}
            >
              {s.action.status === 'restoring' ? <ActivityIndicator color={colors.cyan} /> : <Text style={styles.secondaryText}>Restore purchases</Text>}
            </Pressable>
            {entitled || s.status.managementUrl ? (
              <Pressable accessibilityRole="button" onPress={() => void store.manage()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>Manage subscription</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.h2}>How the subscription works</Text>
          <Text style={styles.small}>
            The price is shown by the {s.storeName} in your local currency. Payment is charged to your {s.storeName} account when you confirm the purchase. The
            subscription renews automatically every month unless it is cancelled at least 24 hours before the end of the current period. You can cancel at any time
            in your {s.storeName} account settings (or with “Manage subscription” above); premium then stays available until the end of the period you paid for.
          </Text>
          <Text style={styles.small}>
            If premium ends, nothing is deleted: saved pictures of premium vehicles can still be looked at, and they can be painted again whenever premium is
            active. The free cars are never affected.
          </Text>
          <Text style={styles.small}>
            Neon Bay has no ads, no tracking and no accounts, and doesn’t ask for personal information. Subscriptions are processed by the {s.storeName} and
            RevenueCat, the subscription service the app uses, with an anonymous identifier.
          </Text>

          <View style={styles.links}>
            {PRIVACY_URL ? (
              <Pressable accessibilityRole="link" onPress={() => openLink(PRIVACY_URL)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Privacy policy</Text>
              </Pressable>
            ) : (
              <Text style={styles.warn}>Privacy policy link not configured (app.json → extra.legal.privacyPolicyUrl).</Text>
            )}
            {TERMS_URL ? (
              <Pressable accessibilityRole="link" onPress={() => openLink(TERMS_URL)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Terms of use</Text>
              </Pressable>
            ) : (
              <Text style={styles.warn}>Terms of use link not configured (app.json → extra.legal.termsOfUseUrl).</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  backText: { fontFamily: fonts.label, fontSize: 15, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 3, color: colors.text },
  scroll: { paddingTop: 8, alignItems: 'center' },
  column: { width: '100%', maxWidth: 640, gap: 14 },
  devBanner: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bg,
    backgroundColor: colors.amber,
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  card: { padding: 16, gap: 8, borderRadius: 16, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  cardActive: { borderColor: colors.cyan },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  cardTitle: { fontFamily: fonts.labelBold, fontSize: 18, color: colors.text, flexShrink: 1 },
  h2: { fontFamily: fonts.labelBold, fontSize: 17, letterSpacing: 1, color: colors.text, marginTop: 6 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.textDim },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textDim },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.textFaint },
  warn: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.amber },
  message: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.cyan },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 96, alignItems: 'center', gap: 2 },
  thumbImage: { width: 96, height: 54 },
  thumbName: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  buy: { gap: 12, paddingVertical: 4 },
  price: { fontFamily: fonts.labelBold, fontSize: 26, color: colors.text },
  per: { fontFamily: fonts.body, fontSize: 16, color: colors.textDim },
  spinner: { alignSelf: 'flex-start', marginVertical: 12 },
  primary: {
    minHeight: 56,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.cyan,
  },
  primaryText: { fontFamily: fonts.labelBold, fontSize: 16, letterSpacing: 2, color: colors.bg, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  secondary: {
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surfaceRaised,
  },
  secondaryText: { fontFamily: fonts.label, fontSize: 15, color: colors.text },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  linkText: { fontFamily: fonts.label, fontSize: 15, color: colors.cyan, textDecorationLine: 'underline' },
  dim: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.97 }] },
});
