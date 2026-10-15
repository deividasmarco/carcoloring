# Premium subscription: store and RevenueCat setup

What has to exist outside the code before the monthly premium subscription works, and how to test it for real.

The app expects these fixed identifiers (in `src/content/collection.ts`):

| What | Value |
|---|---|
| iOS bundle id | `com.atiduok.neonbay` (`app.json`) |
| Store product (auto-renewable, 1 month) | `neon_bay_premium_monthly` |
| RevenueCat entitlement | `neon_bay_premium` |
| RevenueCat offering | the **current** offering, with the product in its Monthly package |
| Price | €2.99 per month, set in the store (the app shows the store's localised price string and never a hard-coded price) |

The app never sees a secret key. It uses RevenueCat's **public** SDK keys (`appl_…`, `goog_…`), which are designed to ship inside apps. A secret key (`sk_…`) is refused if one is configured by mistake.

## 1. App Store Connect

You need the Account Holder role for step 1.

1. **Agreements.** Business → Agreements: accept the **Paid Apps** agreement and complete the bank and tax forms. Products can't be bought, even in the sandbox, until it is active.
2. **App record.** Apps → + → New App, with bundle id `com.atiduok.neonbay` (skip if EAS has already created it). If you choose the **Kids** category, guideline 1.3 applies. This app already follows it: purchases and outside links are behind the parental gate, and there are no ads and no analytics SDKs.
3. **Subscription group.** Your app → Monetization → Subscriptions → Subscription Groups → +. Use a reference name such as `Neon Bay Premium`. Add a group localisation, which is the display name parents see in their subscription settings.
4. **Subscription.** In that group → Create:
   - Reference name: `Neon Bay Premium Monthly`.
   - Product ID: `neon_bay_premium_monthly` (it must match exactly and can never be reused).
   - Subscription duration: **1 Month**.
   - Subscription prices → Add Subscription Price: pick your base country or region (e.g. Lithuania or Germany) and the **€2.99** price point. Review the prices Apple generates for the other storefronts.
   - Availability: all storefronts you want.
   - Localisation: display name (e.g. "Premium garage") and description ("Unlocks every premium car and superbike").
   - Family Sharing: your choice. Turning it on can't be undone.
   - Review information: a screenshot of the parent area's subscribe screen, plus review notes. Example notes: *"Purchases are in the parent area: Garage → Parents (top right). It is protected by a parental gate that asks a multiplication written in words (e.g. 'What is seven times eight?'); type the answer on the keypad."*
5. **Submit together.** The first subscription has to be submitted **with an app version**: add it under the version's "In-App Purchases and Subscriptions" section before submitting.
6. **In-App Purchase key** (for RevenueCat). Users and Access → Integrations → In-App Purchase → generate a key. Download the `.p8` file once, and note the **Key ID** and the **Issuer ID**.
7. **Server notifications.** Your app → App Information → App Store Server Notifications: paste the URL RevenueCat shows (step 2.2) as both the **Production** and the **Sandbox** server URL, Version 2. Expiry, renewal, refund and revocation then reach RevenueCat right away.
8. **Sandbox testers.** Users and Access → Sandbox → Test Accounts → +, with a new email address that isn't an Apple Account. On the test iPhone: Settings → Developer → Sandbox Apple Account → sign in. Developer mode must be on, which a development build install turns on.
9. **App Privacy.** Answer the questionnaire for what RevenueCat processes. Following RevenueCat's "Apple App Privacy" guide (check it again when you fill this in):
   - **Purchases → Purchase History:** collected, for **App Functionality** and **Analytics** (RevenueCat says every app using it selects both), **not linked** to the user (the app uses RevenueCat's anonymous app-user id and never sets a custom one), **not used for tracking**.
   - **Identifiers:** none. The app sets no custom app-user id, turns off `automaticDeviceIdentifierCollectionEnabled` and diagnostics, and blocks the advertising id on Android.
   - Nothing else: no contact info, usage data, location or diagnostics.
   - **Privacy policy URL:** the page in `docs/privacy/index.html`, published with GitHub Pages (see "Before release"). It describes exactly this; update it if the app starts handling other data.

## 2. RevenueCat

1. **Project.** Create a project, e.g. "Neon Bay".
2. **App.** Apps & providers → + App Store app: bundle id `com.atiduok.neonbay`. Upload the In-App Purchase key from step 1.6 (the `.p8` file, Key ID and Issuer ID). Copy the **Apple Server Notification URL** shown there into App Store Connect (step 1.7). Optionally add an App Store Connect API key so RevenueCat can import products.
3. **Product.** Product catalog → Products → + (or Import): `neon_bay_premium_monthly`.
4. **Entitlement.** Product catalog → Entitlements → +, identifier `neon_bay_premium`. Attach the product.
5. **Offering.** Product catalog → Offerings: the offering named `default` (create it if missing), marked **current**. Add a package of type **Monthly** (`$rc_monthly`) containing `neon_bay_premium_monthly`.
6. **No integrations.** Leave every attribution, analytics, ads and webhook integration **off**. The app sends no subscriber attributes and doesn't collect device identifiers.
7. **Public SDK key.** Project settings → API keys: copy the App Store app's **public** key (`appl_…`).

## 3. Put the keys into builds

Builds read the keys at build time from `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`. Each EAS build profile in `eas.json` uses the EAS environment of the same name.

```sh
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_XXXXXXXX \
  --environment development --environment preview --environment production --visibility plaintext
```

For a development build running against a local `npx expo start`, put the same line in `.env.local`, which git ignores:

```sh
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_XXXXXXXX
```

Without a key, the parent area says subscriptions aren't set up and everything premium stays locked. The free cars work either way.

## 4. Test real billing on an iPhone

Expo Go **can't** test billing. There the SDK runs in Preview API mode with JavaScript mocks, and the app treats those as never granting access. The web test store (`npm run web`) checks only the app's own handling of each outcome. Use a development build or TestFlight with a sandbox account:

```sh
npx eas-cli@latest build --profile development --platform ios   # install via the QR code / link
npx expo start                                                  # then open the app on the phone
# or a TestFlight build:
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --platform ios
```

Then check each case on the device:

| Case | How | Expect |
|---|---|---|
| Price | Parent area | The price comes from the store (€2.99 in euro storefronts), with "per month" |
| Purchase | Subscribe, confirm with the sandbox account | "Thank you!", and all premium vehicles unlock at once |
| Cancel in the sheet | Subscribe, then cancel | "The purchase was cancelled. Nothing was charged.", still locked |
| Ask to Buy (pending) | Build with `EXPO_PUBLIC_REVENUECAT_SIMULATE_ASK_TO_BUY=1` (sandbox only), then subscribe | "Waiting for approval", still locked, and unlocks once approved |
| Restore | Delete and reinstall, then Parent area → Restore purchases | "Purchases restored." |
| Manage | Parent area → Manage subscription | The system subscription sheet opens |
| Expiry | Cancel in Settings → Developer → Sandbox Apple Account → Manage. A sandbox month lasts minutes, and the rate can be changed per tester in App Store Connect | At the end of the period: painted premium vehicles open look-only, others are locked, and nothing is deleted |
| Expiry mid-stroke | Keep drawing as the period ends | The stroke finishes, then the screen becomes look-only |
| Revocation | RevenueCat → Customers → find the anonymous id → grant a promotional `neon_bay_premium` entitlement, then revoke it; or refund with an Xcode StoreKit configuration on a Mac | Locks the next time the app comes to the foreground, or at once if it is open and the SDK pushes the update |
| Offline | Airplane mode, then restart the app | The subscriber keeps premium (the SDK's device cache), and free cars always work |

## 5. Google Play (optional, not configured)

Create a subscription `neon_bay_premium_monthly` with a monthly auto-renewing base plan at €2.99. Then:

- connect a service account to RevenueCat;
- set up Real-time Developer Notifications;
- add the Play app in RevenueCat;
- set its `goog_…` key as `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`.

Check the Google Play Families policy for apps aimed at children.

## Before release

- The privacy policy is `docs/privacy/index.html`, served by GitHub Pages (repository Settings → Pages → Deploy from a branch → `master`, folder `/docs`; `docs/.nojekyll` serves the files as they are) at https://deividasmarco.github.io/carcoloring/privacy/. Change its date when you change it.
- Set `extra.legal.privacyPolicyUrl` and `extra.legal.termsOfUseUrl` in `app.json` (public https pages you control). On iOS the terms link falls back to Apple's standard licence agreement. Customers never see configuration messages: a missing link is simply not shown, and development builds list it in a "development only" box in the parent area.
- Run `npm run check:release`. It fails until the legal URLs and the public RevenueCat keys for each platform are set (a secret `sk_…` key or a key with the wrong prefix also fails it). EAS runs the same check before every **production** build (the `eas-build-pre-install` script in `package.json`), so a store build can't be made without them.
- Do the artwork rights review (see `ASSET_MANIFEST.md`).
