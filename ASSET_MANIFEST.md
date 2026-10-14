# Asset manifest

Every visual and font asset shipped in the app: where it comes from and what is known about its rights.
No stock artwork, logos, music or game assets are used. The app plays no audio.

**Rights status in short.** The vehicle drawings are image-generation output (or, for the 2026-10-13 collection, art supplied without a provenance note; see below). None of them is represented as licensed, public domain, CC0 or legally cleared. Many depict recognisable real production cars and motorcycles. The app shows them only under fictional names, with no manufacturer names, badges or logos. A rights review is still needed before release; see the Notes.

## Vehicles

Free or premium is set by permanent id in `src/content/collection.ts`, never by position.

| Id (permanent) | Display name | Tier | Source image (`assets/source/`) | Origin and rights status |
|---|---|---|---|---|
| `apex-gt` | Apex GT | free | `alpine-simple.png` | A. AI-generated project artwork |
| `blaze-gt` | Blaze GT | free | `01-lamborghini-huracan.png` | C. Supplied 2026-10-13, origin not recorded |
| `storm-sedan` | Storm Sedan | free | `01-bmw-m5-f90.png` | C |
| `ember-gt` | Ember GT | premium | `02-ferrari-488.png` | C |
| `zenith-gt` | Zenith GT | premium | `03-chevrolet-corvette-c8.png` | C |
| `dragon-gt` | Dragon GT | premium | `09-nissan-gt-r.png` | C |
| `circuit-coupe` | Circuit Coupe | premium | `03-porsche-911-992.png` | C |
| `orbit-gt` | Orbit GT | premium | `03-orbit-gt.png` | B. AI-generated car pack |
| `sprint-coupe` | Sprint Coupe | premium | `05-porsche-718-cayman.png` | C |
| `drift-coupe` | Drift Coupe | premium | `05-drift-coupe.png` | B |
| `halo-coupe` | Halo Coupe | premium | `10-toyota-supra.png` | C |
| `flux-coupe` | Flux Coupe | premium | `02-bmw-m4-g82.png` | C |
| `vector-coupe` | Vector Coupe | premium | `02-vector-coupe.png` | B |
| `thunder-v8` | Thunder V8 | premium | `08-ford-mustang.png` | C |
| `rumble-v8` | Rumble V8 | premium | `04-dodge-challenger.png` | C |
| `breeze-roadster` | Breeze Roadster | premium | `08-mazda-mx5.png` | C |
| `volt-sedan` | Volt Sedan | premium | `01-volt-sedan.png` | B |
| `turbo-wagon` | Turbo Wagon | premium | `06-audi-rs6-c8.png` | C |
| `zip-hatch` | Zip Hatch | premium | `07-volkswagen-golf-gti.png` | C |
| `pulse-hatch` | Pulse Hatch | premium | `06-pulse-hatch.png` | B |
| `ridge-suv` | Ridge SUV | premium | `04-porsche-macan.png` | C |
| `nova-suv` | Nova SUV | premium | `04-nova-suv.png` | B |
| `boulder-4x4` | Boulder 4x4 | premium | `05-toyota-land-cruiser.png` | C |
| `basecamp-4x4` | Basecamp 4x4 | premium | `06-land-rover-defender.png` | C |
| `fortress-4x4` | Fortress 4x4 | premium | `07-mercedes-g63.png` | C |
| `comet-superbike` | Comet Superbike | premium | `09-ducati-panigale-v4.png` | C |
| `arrow-superbike` | Arrow Superbike | premium | `10-yamaha-yzf-r1.png` | C |

**A. Apex GT.** AI-generated for this project with OpenAI's image-generation tool in ChatGPT and provided by the project owner. It was not downloaded from a stock website, and no SVG or PDF original exists. It is not labelled CC0 or public domain. The styling resembles contemporary mid-engine supercars, and there are no badges or logos. Only the car is used: the scenery in the image (sun, clouds, mountains, lake, trees, guardrails, road) is removed at build time.

**B. Car pack (six 1536 × 1024 RGBA PNGs).** Created 2026-10-12 with OpenAI image generation in ChatGPT for this project and supplied by the project owner. Its provenance note is at `assets/source/car-pack-provenance.md`. The originals are kept without pixel edits. It is **not** represented as CC0, public domain or legally cleared, and no stock-library licence is claimed. Visual similarity to real vehicles may remain.

**C. Collection, supplied 2026-10-13 (twenty 1536 × 1024 RGBA PNGs, in two batches of ten).**
- **Provenance.** No provenance note came with these files. Their origin (generator, tool or artist), terms and date of creation are **not recorded**. The drawing style matches the AI-generated car pack, but that is an observation, not evidence.
- **Rights status.** Not established. They are **not** represented as licensed, CC0, public domain or legally cleared.
- **What the files depict.** The filenames name real manufacturers and models. The drawings depict those production designs closely: body shapes, lamp graphics and wheel designs.
- **Badges and lettering.** Each image was inspected; none shows a manufacturer badge, logo or lettering. The Fortress 4x4's front grille disc is drawn empty.
- **How the app uses them.** The originals are kept unedited under their supplied filenames, which never appear in the app. The app uses only fictional names and permanent ids.
- **Same-model pairs.** Five of these depict the same production models as five car-pack drawings: M5 / Volt Sedan, M4 / Vector Coupe, 911 / Orbit GT, Macan / Nova SUV, 718 / Drift Coupe. Each pair is different artwork (a different drawing, pose and detail), not a duplicate image, so all were kept.

## Other assets

| Asset | Location | Source | Licence |
|---|---|---|---|
| Part maps (seed points, lassos, closing lines, merge decisions), one per vehicle | `src/content/vehicles/<id>/trace.ts` | Authored for this project against each source image | Project-owned |
| Region masks, vector line art, silhouette, hit-test map, garage placement (one set per vehicle; none shared) | `src/content/vehicles/<id>/regions.generated.json` | Derived from each source image and its `trace.ts` by `scripts/build-traced-vehicle.ts` | Derived from the source image (rights as that image) |
| Vehicle thumbnails (All cars, parent area) | `src/content/vehicles/<id>/thumbnail.png` | Rendered from the vehicle's own line art and paper by the same build | Derived from the source image (rights as that image) |
| Example colourings shown in the parent area (Ember GT, Comet Superbike), labelled "Example colouring" in the app | `assets/samples/<id>.png` | Rendered by `scripts/sample-previews.ts` from the vehicle's own part shapes and line art, filled with crayon-box colours | Derived from the source image (rights as that image) |
| Gallery pictures of a child's creations (written on the device, not shipped) | app storage `creations/<id>/picture-*.png` | Composed at save time from the vehicle's layers and the child's paint | The child's own artwork on the vehicle drawing |
| Car primer colours and ground shadows | `src/engine/render/vehicleLayers.ts` | Original, procedural | Project-owned |
| "Neon bay" night-garage scene (wall, window and city, neon tubes, emblem, wet floor, turntable) | `src/content/scenes/neon-garage/background.ts`, `layout.ts` | Original, procedural | Project-owned |
| Ambient animation (rain, reflections, light sweep, underglow) | `src/content/scenes/neon-garage/effects.tsx` | Original, procedural | Project-owned |
| Wax-crayon and coloured-pencil paper grain | `src/engine/render/brushTextures.ts` | Generated at runtime from Skia's Perlin fractal-noise shader | Project-owned |
| UI icons (garage, undo, redo, crayon, pencil, eraser, lights, wash, flag, save, share, check, close, fit, previous, next, lock, eye, parent, back, grid, gallery, plus, trash) | `src/ui/icons.tsx` | Original vector icons | Project-owned |
| Crayon illustrations in the colour rack | `src/ui/components/Crayon.tsx` | Original vector illustration | Project-owned |
| App icon, Android adaptive icon (foreground and monochrome), splash icon, favicon | `assets/*.png` | Rendered from the original bay emblem by `scripts/previews/appIcons.preview.ts` | Project-owned |
| Michroma typeface (wordmark, nameplate) | npm `@expo-google-fonts/michroma` | Copyright 2011 The Michroma Project Authors (github.com/googlefonts/Michroma-font) | Font: SIL Open Font License 1.1. Package code: MIT. Licence text in `node_modules/@expo-google-fonts/michroma/LICENSE_FONT` |
| Chakra Petch typeface (labels, buttons, counters) | npm `@expo-google-fonts/chakra-petch` | Copyright 2018 The Chakra Petch Project Authors (github.com/m4rc1e/Chakra-Petch) | Font: SIL Open Font License 1.1. Package code: MIT. Licence text in `node_modules/@expo-google-fonts/chakra-petch/LICENSE_FONT` |
| Atkinson Hyperlegible Next typeface (instructions, parent area, longer text) | npm `@expo-google-fonts/atkinson-hyperlegible-next` | Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors (github.com/googlefonts/atkinson-hyperlegible-next) | Font: SIL Open Font License 1.1. Package code: MIT. Licence text in `node_modules/@expo-google-fonts/atkinson-hyperlegible-next/LICENSE_FONT` |
| Michroma character widths (for fitting vehicle names) | `src/ui/fontMetrics.generated.ts` | Read from the Michroma font file by `scripts/font-metrics.mjs` | Font metrics (SIL Open Font License 1.1, as the font) |
| CanvasKit WebAssembly (web build only) | `public/canvaskit.wasm`, copied from npm `canvaskit-wasm` by `npm run setup:web` | Google (Skia) | BSD-3-Clause |

## Notes

- **Before release, get a rights review of the vehicle artwork.** Collection C has no recorded origin. Most drawings depict specific, recognisable production vehicles, and some manufacturers protect vehicle designs (trade dress or design rights) even without badges. Fictional names and no logos reduce, but do not remove, that risk. Replacing source images later is supported: rebuild the masks, keep the ids and bump `assetVersion` (see AGENTS.md).
- The brand name "Neon Bay", the emblem (a crayon tip and a lightning stroke in a ring) and all 27 vehicle display names above were created for this project. They are fictional organisational names, not cleared trademarks, and there is no association with any manufacturer. No trademark search has been done.
- The car pack arrived with its own provenance note named `ASSET_MANIFEST.md`. It was moved unchanged to `assets/source/car-pack-provenance.md` so it doesn't clash with this file. `assets/source/CLAUDE_INSTRUCTIONS.md` is the brief that came with the car pack.
- Some parts are merged where the drawing has no line between them. Examples: the Sprint Coupe "Body", the Zenith GT "Hood and nose", the Circuit Coupe hood and right fender, the Thunder V8 "Roof and rear fender", and the Ridge SUV hood and fenders. Each vehicle's `trace.ts` records its merge decisions.
- The previous procedurally drawn "Volta GT" car was replaced by the Apex GT and removed from the project.
- Licences for code dependencies are listed in their own packages under `node_modules`. In-app purchases use RevenueCat's `react-native-purchases` SDK (MIT).
- The template icons from `create-expo-app` have been replaced. The template's `LICENSE` file, which named Expo's company as copyright holder, was removed. **No licence has been chosen for this app yet.**
