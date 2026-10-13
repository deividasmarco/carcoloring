This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project notes (Neon Bay)

- Drawing engine lives in `src/engine/` and is framework-agnostic; React screens are in `src/features/`.
- Car parts are traced from line art: edit `src/content/vehicles/<id>/trace.ts` (seed points or lassos per part, closing lines for gaps), then run `npm run build:regions -- --only <id> --preview` and review `.scratch/<id>-regions.png` and `.scratch/<id>-lassos.png`. Never hand-edit `regions.generated.json`, and never rename region ids (saved drawings reference them).
- A new vehicle needs its trace registered in `src/content/vehicles/traces.ts` (build script), an `index.ts` typed `CatalogVehicle` (name, kind, accent, `thumbnail.png` written by the build), and a place in `ORDER` in `src/content/registry.ts` (garage order: free vehicles first). `npm run trace:atlas -- <png>` numbers the enclosed areas to help pick seeds.
- New traces use `strictBackground: true`: only white connected to the image border is background, so white areas inside the vehicle (body paint, seats) stay paintable, and see-through gaps (between spokes, under a wing) must be declared with `seeThrough` / `seeThroughWithin`. A tiny pocket walled in by ink thicker than 8 px has no neighbour to join and ends up "outside"; the clipping test catches it as a stray pixel, and a seed for the pocket in the right part fixes it.
- Free or premium is decided only by `FREE_VEHICLE_IDS` in `src/content/collection.ts` (never by position). Access is checked in the garage *and* in the studio route (`src/app/studio/[vehicleId].tsx`): a locked vehicle with saved paint opens view-only (`DrawingSession.setEditable(false)`, which lets an active stroke finish), one without paint redirects to the garage. Expiry never deletes drawings.
- Premium comes only from verified RevenueCat entitlements (`src/purchases/entitlement.ts`); the app keeps no "premium" flag of its own. `src/purchases/client.ts` is the native SDK client; `client.web.ts` has no store in production and a scripted **development-only** test store (`globalThis.__neonBayTestStore`) for the web e2e. Purchases, restore, subscription management and outside links run only while the parental gate is open (`src/state/parentGate.ts`); never add a purchase prompt outside the parent area. Store and RevenueCat setup: `docs/subscription-setup.md`.
- Saves are keyed by vehicle id + `assetVersion` (`drawings/<id>/v<n>/`). Bump `assetVersion` in a car's `trace.ts` whenever its parts change; older saves are then ignored instead of painting the wrong parts. Only `v1` of the Apex GT migrates the pre-version save.
- Each car has its own coordinate space; `layout.placement` (from the build) puts it on the garage stage. Go through `compose.ts` / `Stage.tsx` rather than assuming scene units equal car units.
- Generated paths use the even-odd fill rule; always parse them with `parseGeneratedPath`.
- Web-only code (CanvasKit, `LoadSkiaWeb`) must live in `*.web.ts(x)` files. Metro bundles every `require` it sees, even inside `Platform.OS === 'web'` branches, so a runtime check is not enough (see `src/bootstrap*.ts`).
- Skia applies a `Group`'s `opacity` only to children drawn with a paint (shapes, images), never to `<Picture>` children. Hide pictures with an (animated) `clip`, a `layer`, or view-level opacity. The garage carousel hides cars by clipping; relying on Group opacity once stacked every mounted car on one spot.
- Make offscreen surfaces with `makeOffscreenSurface` (`src/engine/render/surfaces`), not `Skia.Surface.MakeOffscreen`: on web each of those holds a WebGL context that is never released, and the browser starts dropping canvases after about 16.
- With the system's reduce-motion setting on, Reanimated finishes `withTiming`/`withSpring` immediately and calls their callbacks at once. Send any "started" event before starting the animation, or it arrives after "finished".
- Don't trust the sign of a gesture's release velocity on web: React Native Gesture Handler estimates it with a quadratic fit through the last few pointer events, which can point backwards when events arrive unevenly. The garage uses it only when it agrees with the finger's travel (`swipeRelease.ts`).
- Reanimated worklets: any module-level function called from a worklet needs a `'worklet'` directive, and closure variables are copied per worklet, so state shared between gesture callbacks must be a shared value (see `createCarouselPan` in `GarageScreen.tsx`). The React compiler lint also forbids mutating shared values inside component hooks, which is why that logic lives at module level.
- On web, Skia objects are never garbage collected: dispose every surface, image, paint and path you create (`cpuSnapshot` in `src/engine/render/snapshot.ts` frees the intermediate snapshot; `makeNonTextureImage` copies the pixels there). Tests render real pixels through CanvasKit (`jest/skiaEnvironment.js`) and run out of WASM heap on the same leaks, so dispose in tests too (as `RecordingListener` does), and build large per-vehicle fixtures in `beforeAll`, not at describe time.
- Before finishing: `npm test`, `npm run typecheck`, `npm run lint`, and with `npm run web` running, `npm run e2e:web` (runs the studio, garage/all-vehicles and premium suites; shared helpers in `e2e/lib.mjs`). Garage visuals are checked from screenshot pixels (garage wall hidden), not from component state: check the picture, with reduced motion on as well as off.
