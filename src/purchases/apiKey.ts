/**
 * The RevenueCat public SDK key for a platform, or why it can't be used.
 * Public keys (appl_… / goog_…) are made to ship inside apps; secret keys
 * (sk_…) grant server access and are refused.
 */
export function resolveApiKey(os: string, iosKey: string, androidKey: string): { key: string } | { problem: string } {
  const key = (os === 'ios' ? iosKey : os === 'android' ? androidKey : '').trim();
  if (!key) return { problem: 'Subscriptions are not set up in this build (no RevenueCat key).' };
  if (key.startsWith('sk_')) return { problem: 'A RevenueCat secret key was configured; only public SDK keys may ship in the app.' };
  const prefix = os === 'ios' ? 'appl_' : 'goog_';
  if (!key.startsWith(prefix)) return { problem: `The RevenueCat key for ${os} should start with "${prefix}".` };
  return { key };
}
