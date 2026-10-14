// Release configuration check: legal URLs and RevenueCat public keys.
//   npm run check:release                 (checks iOS and Android)
//   node scripts/check-release.mjs --platform ios
// EAS runs it before installing dependencies (package.json "eas-build-pre-install");
// there it only fails production builds, and checks the platform being built.
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const eas = !!process.env.EAS_BUILD;
const profile = process.env.EAS_BUILD_PROFILE;
if (eas && profile !== 'production') {
  console.log(`check-release: skipped for the "${profile}" profile (production builds only).`);
  process.exit(0);
}
const platformArg = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : null;
const platforms = platformArg ? [platformArg] : eas && process.env.EAS_BUILD_PLATFORM ? [process.env.EAS_BUILD_PLATFORM] : ['ios', 'android'];

const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const legal = app.extra?.legal ?? {};
const https = (v) => typeof v === 'string' && /^https:\/\/\S+$/.test(v.trim());
const problems = [];
const notes = [];

if (!https(legal.privacyPolicyUrl)) problems.push('app.json expo.extra.legal.privacyPolicyUrl: a public https privacy policy URL is required.');
if (!https(legal.termsOfUseUrl)) {
  if (platforms.includes('android')) problems.push('app.json expo.extra.legal.termsOfUseUrl: an https terms of use URL is required for Android.');
  else notes.push("No terms of use URL: iOS shows Apple's standard licence agreement instead.");
}

const keys = {
  ios: ['EXPO_PUBLIC_REVENUECAT_IOS_API_KEY', 'appl_'],
  android: ['EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY', 'goog_'],
};
for (const p of platforms) {
  const [name, prefix] = keys[p] ?? [];
  if (!name) continue;
  const value = (process.env[name] ?? '').trim();
  if (!value) problems.push(`${name}: missing. Set the RevenueCat public ${p} SDK key (EAS environment "production", or .env.local for local builds).`);
  else if (value.startsWith('sk_')) problems.push(`${name}: this is a RevenueCat SECRET key. Only the public ${prefix}… key may be built into the app.`);
  else if (!value.startsWith(prefix)) problems.push(`${name}: expected a public ${prefix}… key (Test Store keys must not ship in store builds).`);
}

for (const n of notes) console.log(`note: ${n}`);
if (problems.length) {
  console.error(`check-release: ${problems.length} problem(s) block a release (${platforms.join(', ')}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check-release: OK for ${platforms.join(', ')}.`);
