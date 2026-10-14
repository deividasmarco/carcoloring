/**
 * Legal links and release configuration, read from app.json (extra.legal).
 *
 * Customers only ever see working links: a missing URL hides its link and is
 * listed by `configurationProblems()` for development builds, and
 * `npm run check:release` (also run before production EAS builds) fails until
 * it is set. Nothing is invented: the only fallback is Apple's standard
 * licence agreement for the terms on iOS, which applies there by default.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const legal = (Constants.expoConfig?.extra?.legal ?? {}) as { privacyPolicyUrl?: unknown; termsOfUseUrl?: unknown };

/** Apple's standard licence agreement, which applies on iOS when an app sets no custom terms. */
export const APPLE_STANDARD_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

function httpsUrl(value: unknown): string | null {
  return typeof value === 'string' && /^https:\/\/\S+$/.test(value.trim()) ? value.trim() : null;
}

export const PRIVACY_URL = httpsUrl(legal.privacyPolicyUrl);
export const TERMS_URL = httpsUrl(legal.termsOfUseUrl) ?? (Platform.OS === 'ios' ? APPLE_STANDARD_EULA : null);

/** What still blocks a release, for development diagnostics (never shown to customers). */
export function configurationProblems(purchasesReason?: string): string[] {
  const out: string[] = [];
  if (!PRIVACY_URL) out.push('Privacy policy URL missing: set expo.extra.legal.privacyPolicyUrl (https) in app.json.');
  if (!httpsUrl(legal.termsOfUseUrl)) {
    out.push(
      Platform.OS === 'ios'
        ? "Terms of use URL not set: iOS falls back to Apple's standard licence agreement (set expo.extra.legal.termsOfUseUrl for your own terms)."
        : 'Terms of use URL missing: set expo.extra.legal.termsOfUseUrl (https) in app.json.',
    );
  }
  if (purchasesReason) out.push(`Purchases: ${purchasesReason}`);
  return out;
}
