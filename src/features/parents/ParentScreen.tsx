/**
 * The parent area (only reachable through the parental gate).
 *
 * For non-subscribers the first screenful is the offer: what premium unlocks,
 * a few example colourings, the store's localised price and period, the
 * subscribe button, the renewal disclosure, restore and the legal links. The
 * full collection, settings and the detailed terms follow further down.
 * Subscribers see their status, subscription management and restore instead.
 *
 * Customers never see configuration details: those are listed in a
 * development-only diagnostics box (and by `npm run check:release`).
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { configurationProblems, PRIVACY_URL, TERMS_URL } from '../../config/release';
import { FREE_VEHICLE_IDS } from '../../content/collection';
import { GARAGE, getGarageEntry } from '../../content/registry';
import { perPeriod } from '../../purchases/period';
import { isParentGateOpen } from '../../state/parentGate';
import { premiumStore, usePremium } from '../../state/premium';
import { UNAVAILABLE, type PremiumState } from '../../state/premiumStore';
import { setSettings, useSettings } from '../../state/settings';
import { Button } from '../../ui/components/Button';
import { ScreenHeader } from '../../ui/components/ScreenHeader';
import { Icon } from '../../ui/icons';
import { colors, fonts, radius, type } from '../../ui/theme';

const PREMIUM = GARAGE.filter((e) => e.tier === 'premium');
const PREMIUM_CARS = PREMIUM.filter((e) => e.kind === 'car').length;
const PREMIUM_BIKES = PREMIUM.filter((e) => e.kind === 'superbike').length;
const FREE_COUNT = FREE_VEHICLE_IDS.size;

/** Two example colourings (rendered by scripts/sample-previews.ts) and two vehicles as they start. */
const PREVIEW: { id: string; example?: number }[] = [
  { id: 'ember-gt', example: require('../../../assets/samples/ember-gt.png') },
  { id: 'thunder-v8' },
  { id: 'comet-superbike', example: require('../../../assets/samples/comet-superbike.png') },
  { id: 'basecamp-4x4' },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function openLink(url: string) {
  // External links leave the app: only from inside the gated parent area.
  if (!isParentGateOpen()) return;
  void Linking.openURL(url);
}

// ── Pieces ──────────────────────────────────────────────────────────────────

/** `count` preview tiles, `columns` to a row, in a block `width` wide. */
function PreviewTiles({ count, columns, width }: { count: number; columns: number; width: number }) {
  const gap = 10;
  const tileW = Math.floor((width - gap * (columns - 1)) / columns);
  const imageH = Math.round((tileW - 16) * 0.6);
  return (
    <View style={[styles.tiles, { gap }]}>
      {PREVIEW.slice(0, count).map(({ id, example }) => {
        const entry = getGarageEntry(id);
        if (!entry) return null;
        return (
          <View key={id} style={[styles.tile, { width: tileW }]}>
            <Image source={example ?? entry.thumbnail} style={{ width: tileW - 16, height: imageH }} resizeMode="contain" accessibilityIgnoresInvertColors />
            <Text style={styles.tileName} numberOfLines={2}>
              {entry.vehicle.name}
            </Text>
            {example ? <Text style={styles.exampleTag}>EXAMPLE COLOURING</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function Benefit({ children }: { children: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitDot}>
        <Icon name="check" size={16} color={colors.cyan} />
      </View>
      <Text style={styles.benefitText}>{children}</Text>
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

function LegalLinks({ storeName }: { storeName: string }) {
  const terms = TERMS_URL;
  const privacy = PRIVACY_URL;
  if (!privacy && !terms) return null;
  return (
    <View style={styles.links} accessibilityLabel={`Legal information for the ${storeName} subscription`}>
      {terms ? (
        <Pressable accessibilityRole="link" onPress={() => openLink(terms)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>Terms of use</Text>
        </Pressable>
      ) : null}
      {privacy ? (
        <Pressable accessibilityRole="link" onPress={() => openLink(privacy)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>Privacy policy</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The price, subscribe button and renewal disclosure (non-subscribers). */
function Offer({ s }: { s: PremiumState }) {
  const store = premiumStore();
  const busy = s.action.status === 'purchasing' || s.action.status === 'restoring';
  if (s.action.status === 'pending-approval') {
    return (
      <View style={styles.card} testID="premium-pending">
        <Text style={styles.cardTitle}>Waiting for approval</Text>
        <Text style={styles.bodyDim}>Premium unlocks by itself as soon as the purchase is approved.</Text>
      </View>
    );
  }
  if (s.clientKind === 'unavailable') {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyDim}>{Platform.OS === 'web' ? 'Subscriptions are available in the iPhone, iPad and Android apps.' : UNAVAILABLE}</Text>
      </View>
    );
  }
  if (s.offer.status === 'ready') {
    const { priceString, period } = s.offer.offer;
    const per = perPeriod(period);
    return (
      <View style={styles.offer}>
        <Text style={styles.price} testID="premium-price">
          {priceString} <Text style={styles.per}>{per}</Text>
        </Text>
        <Button
          variant="primary"
          size="large"
          label="Subscribe"
          accessibilityLabel={`Subscribe for ${priceString} ${per}`}
          busy={s.action.status === 'purchasing'}
          disabled={busy}
          onPress={() => void store.purchase()}
          style={styles.subscribe}
        />
        <Text style={styles.disclosure}>
          Renews automatically {per === 'per month' ? 'every month' : per} until cancelled. Cancel any time in your {s.storeName} account settings, at least 24
          hours before the end of the current period.
        </Text>
      </View>
    );
  }
  if (s.offer.status === 'loading' || s.offer.status === 'idle') {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }
  return (
    <View style={[styles.card, styles.row]}>
      <Text style={[styles.bodyDim, styles.flex]}>{'message' in s.offer ? s.offer.message : UNAVAILABLE}</Text>
      <Button label="Try again" onPress={() => void store.loadOffer()} />
    </View>
  );
}

function SubscriberStatus({ s }: { s: PremiumState }) {
  const until = formatDate(s.status.expiresAt);
  return (
    <View style={[styles.card, styles.cardActive]} testID="premium-status">
      <View style={styles.row}>
        <Icon name="check" size={24} color={colors.cyan} />
        <Text style={styles.cardTitle}>Premium garage is active</Text>
      </View>
      {until ? <Text style={styles.bodyDim}>{s.status.willRenew ? `Renews automatically on ${until}.` : `Ends on ${until} and will not renew.`}</Text> : null}
      {s.status.billingIssue ? (
        <Text style={styles.warn}>The {s.storeName} reported a payment problem. Please check the payment method in your {s.storeName} account.</Text>
      ) : null}
      {s.stale ? <Text style={styles.note}>The store could not be reached just now, so this shows the last known status.</Text> : null}
    </View>
  );
}

function SettingRow({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.setting}>
      <View style={styles.flex}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDetail}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.lineStrong, true: colors.cyan }}
        thumbColor={colors.text}
        {...({ activeThumbColor: colors.text } as object)}
        ios_backgroundColor={colors.lineStrong}
      />
    </View>
  );
}

function DevDiagnostics({ s }: { s: PremiumState }) {
  if (!__DEV__) return null;
  const problems = configurationProblems(s.clientKind === 'unavailable' && Platform.OS !== 'web' ? s.unavailableReason : undefined);
  const notes = [
    s.clientKind === 'dev-test-store' ? 'Test store (development build only). No real payment is made.' : null,
    s.clientKind === 'preview' ? 'Expo Go preview: purchases are simulated by RevenueCat and never unlock anything. Use a development build for real purchases.' : null,
    ...problems,
  ].filter((x): x is string => !!x);
  if (!notes.length) return null;
  return (
    <View style={styles.dev} testID="dev-diagnostics">
      <Text style={styles.devTitle}>DEVELOPMENT ONLY</Text>
      {notes.map((n) => (
        <Text key={n} style={styles.devText}>
          {n}
        </Text>
      ))}
    </View>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export function ParentScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = usePremium();
  const settings = useSettings();
  const store = premiumStore();
  const entitled = store.isEntitled();
  const busy = s.action.status === 'purchasing' || s.action.status === 'restoring';
  const [showAll, setShowAll] = useState(false);
  // Wide screens (landscape, tablets): the hero on the left, the offer on the right.
  const wide = width >= 700;
  const contentW = Math.min(wide ? 920 : 640, width - insets.left - insets.right - 40);
  const heroW = wide ? Math.floor((contentW - 28) * 0.54) : contentW;
  const columns = width >= 600 ? 4 : 3;

  useEffect(() => {
    if (!entitled && s.clientKind !== 'unavailable') void store.loadOffer();
    return () => store.clearAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restore = (
    <Button label="Restore purchases" busy={s.action.status === 'restoring'} disabled={busy || s.clientKind === 'unavailable'} onPress={() => void store.restore()} />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="PARENTS" onBack={onClose} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40, paddingLeft: insets.left + 20, paddingRight: insets.right + 20 }]}>
        <View style={[styles.column, { maxWidth: wide ? 920 : 640 }]}>
          <DevDiagnostics s={s} />

          {entitled ? (
            <>
              <SubscriberStatus s={s} />
              <ActionMessage s={s} />
              <View style={styles.actions}>
                <Button label="Manage subscription" onPress={() => void store.manage()} />
                {restore}
              </View>
              <LegalLinks storeName={s.storeName} />
            </>
          ) : (
            // Not active yet: lead with what premium is, then the offer.
            <View style={wide ? styles.split : styles.stack}>
              <View style={[styles.stack, { width: heroW }]}>
                <View testID="premium-status" accessibilityLabel={s.phase === 'starting' ? 'Checking the subscription' : 'Premium garage is not active'}>
                  <Text style={styles.headline} accessibilityRole="header">
                    Unlock the full garage
                  </Text>
                  <Text style={styles.lead}>
                    Colour {PREMIUM.length} more vehicles with the same crayons and tools. The {FREE_COUNT} free cars always stay free.
                  </Text>
                </View>
                <PreviewTiles count={wide ? 4 : columns} columns={wide ? 2 : columns} width={heroW} />
              </View>
              <View style={[styles.stack, wide && styles.flex]}>
                <View style={styles.benefits}>
                  <Benefit>{`${plural(PREMIUM_CARS, 'more car', 'more cars')}${PREMIUM_BIKES ? ` and ${plural(PREMIUM_BIKES, 'superbike', 'superbikes')}` : ''} to colour.`}</Benefit>
                  <Benefit>Save different versions of each one in My Creations.</Benefit>
                  <Benefit>All the same colouring tools as the free cars.</Benefit>
                </View>
                <Offer s={s} />
                <ActionMessage s={s} />
                <View style={styles.actions}>{restore}</View>
                <LegalLinks storeName={s.storeName} />
              </View>
            </View>
          )}

          {/* The whole premium collection, on request. */}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showAll }}
            onPress={() => setShowAll((v) => !v)}
            style={({ pressed }) => [styles.disclose, pressed && styles.pressed]}
          >
            <Text style={styles.sectionTitle}>All {PREMIUM.length} premium vehicles</Text>
            <Icon name={showAll ? 'prev' : 'next'} size={20} color={colors.textDim} />
          </Pressable>
          {showAll ? (
            <View style={styles.thumbs} accessibilityLabel={`${PREMIUM.length} premium vehicles`}>
              {PREMIUM.map((e) => (
                <View key={e.vehicle.id} style={[styles.thumb, { width: `${100 / (columns + 1) - 2}%` }]}>
                  <Image source={e.thumbnail} style={styles.thumbImage} resizeMode="contain" />
                  <Text style={styles.thumbName} numberOfLines={2}>
                    {e.vehicle.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settings}>
            <SettingRow
              label="Moving lights and rain"
              detail="The garage's gentle background animation. Also off when the device asks for reduced motion."
              value={settings.effects}
              onChange={(v) => setSettings({ effects: v })}
            />
            <View style={styles.rule} />
            <SettingRow
              label="Vibration"
              detail="A light tap feel on buttons and crayons, on phones that support it."
              value={settings.haptics}
              onChange={(v) => setSettings({ haptics: v })}
            />
          </View>

          <Text style={styles.sectionTitle}>About the subscription</Text>
          <Text style={styles.small}>
            The price is set by the {s.storeName} in your local currency and charged to your {s.storeName} account when you confirm. The subscription renews
            automatically unless it is cancelled at least 24 hours before the end of the current period. You can cancel at any time in your {s.storeName}{' '}
            account settings; premium then stays available until the end of the period you paid for.
          </Text>
          <Text style={styles.small}>
            If premium ends, nothing is deleted: pictures of premium vehicles stay in My Creations to look at, and they can be painted again whenever premium is
            active. The free cars are never affected.
          </Text>
          <Text style={styles.small}>
            Neon Bay shows no ads and has no accounts. Subscriptions are handled by the {s.storeName} and RevenueCat, the subscription service the app uses,
            with an anonymous identifier. See the privacy policy for details.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 12, alignItems: 'center' },
  column: { width: '100%', maxWidth: 640, gap: 16 },
  headline: { fontFamily: fonts.bodyBold, fontSize: 28, lineHeight: 34, color: colors.text },
  lead: { ...type.body, color: colors.textDim, marginTop: 6 },
  split: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  stack: { gap: 16 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { backgroundColor: colors.surface, borderRadius: radius.m, borderWidth: 1, borderColor: colors.line, padding: 8, gap: 4 },
  tileName: { ...type.bodySmall, fontSize: 13, lineHeight: 17, color: colors.text },
  exampleTag: { ...type.caption, fontSize: 9, letterSpacing: 1, color: colors.textFaint },
  benefits: { gap: 10 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  benefitText: { ...type.body, color: colors.text, flex: 1 },
  offer: { gap: 12, paddingTop: 4 },
  price: { fontFamily: fonts.bodyBold, fontSize: 30, color: colors.text },
  per: { fontFamily: fonts.body, fontSize: 17, color: colors.textDim },
  subscribe: { alignSelf: 'flex-start', minWidth: 220 },
  disclosure: { ...type.bodySmall, color: colors.textDim },
  card: { padding: 16, gap: 8, borderRadius: radius.m, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  cardActive: { borderColor: colors.cyan },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 19, color: colors.text, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  bodyDim: { ...type.body, color: colors.textDim },
  small: { ...type.bodySmall, color: colors.textDim },
  note: { ...type.bodySmall, color: colors.textFaint },
  warn: { ...type.bodySmall, color: colors.amber },
  message: { ...type.body, color: colors.cyan },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.cyan, textDecorationLine: 'underline' },
  disclose: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.text, marginTop: 4 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: { alignItems: 'center', gap: 2 },
  thumbImage: { width: '100%', aspectRatio: 16 / 10 },
  thumbName: { ...type.bodySmall, fontSize: 12, lineHeight: 16, color: colors.textDim, textAlign: 'center' },
  settings: { borderRadius: radius.m, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  settingLabel: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text },
  settingDetail: { ...type.bodySmall, color: colors.textDim, marginTop: 2 },
  rule: { height: 1, backgroundColor: colors.line },
  dev: { padding: 12, gap: 6, borderRadius: radius.s, borderWidth: 1, borderColor: colors.amber, borderStyle: 'dashed' },
  devTitle: { ...type.caption, fontSize: 11, color: colors.amber },
  devText: { ...type.bodySmall, color: colors.amber },
  pressed: { opacity: 0.8 },
});
