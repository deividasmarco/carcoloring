# Claude Code: Neon Bay garage expansion

The existing Apex GT looks good and paints correctly. Preserve it, its saved progress, the neon style and the working drawing engine. Extend the existing project; do not rebuild from scratch.

## Supplied assets
Six AI-generated PNG source artworks (1536 x 1024, RGBA) are included in assets/source:
- 01-volt-sedan.png — Volt Sedan, performance four-door sedan.
- 02-vector-coupe.png — Vector Coupe, performance two-door coupe.
- 03-orbit-gt.png — Orbit GT, rounded classic sports coupe.
- 04-nova-suv.png — Nova SUV, sporty crossover.
- 05-drift-coupe.png — Drift Coupe, compact mid-engine-style coupe.
- 06-pulse-hatch.png — Pulse Hatch, everyday hot hatch.

Use these supplied images, not geometric replacement drawings. Open and inspect every image first. They contain alpha transparency; verify the silhouette, body opacity and any soft edge halo against the dark garage before integration. Preserve white car interiors. They are source artwork, NOT prebuilt region masks or finished coloring assets.

Use these fictional display names, not manufacturer/model names. Record the provenance from ASSET_MANIFEST.md without claiming CC0, public domain, legal clearance or official manufacturer association.

## Prepare every car
Reuse the asset preparation workflow that succeeded for Apex GT.
For each final artwork create its own silhouette, outline layer, labeled closed paint regions and hit map. Never reuse another vehicle's masks.
Match all layers and hit testing in a consistent local coordinate space. Keep the car's aspect ratio; normalize apparent size and ground contact across the garage using content bounds, not just the image canvas.
Keep hood, front bumper, visible doors, windows, roof, mirrors and wheels practical for a five-year-old. Tiny details can remain decorative rather than separate frustrating targets.
Preserve black outlines above the paint. Where boundaries need closure, use deliberate reviewed edits and document them.
Keep the exact successful region-locked behavior: each finger-down selects one region, and the full brush footprint remains clipped to it until finger-up. Dragging across adjacent parts never switches regions. The eraser follows the same rule. Preserve texture, undo/redo, auto-save and export.

## Main-menu garage carousel
Create a premium swipeable car selector within the current garage scene:
- Seven cars total, including the existing Apex GT.
- A horizontal swipe moves between vehicles, with large left/right buttons as an accessible alternative.
- Show one dominant centered vehicle with a small hint of the next/previous vehicle if space permits. No dashboard card grid.
- Finger tracking should be immediate; releasing snaps to one selected car using a well-damped spring.
- Aim for approximately 300–450 ms settling time, no excessive bounce.
- Cars translate horizontally with a subtle scale change; the garage background moves more slowly to add depth.
- Keep all cars grounded on the platform. No flipping or fake 3D rotation of flat PNGs.
- Move the platform glow with the selection; use restrained cyan/magenta light changes.
- Animate the car name and BAY number coherently with selection. Include a compact position indicator such as 02 / 07.
- Preserve selection on returning from the studio.
- Preload adjacent thumbnails and keep heavy paint data out of scrolling renders.
- Reuse compatible animation/gesture packages already installed. Keep the app compatible with its current Expo setup. Do not introduce web CanvasKit imports into native bundles.
- Respect reduced motion; provide a simple snap/crossfade fallback.
- Allow fast swipes safely: no blank slides, stale labels or opening the wrong vehicle.
- Do not add autoplay rotation, flashing neon, forced sound, purchases or locks.

The main action reads START PAINTING for a new car and KEEP PAINTING for one with saved strokes. The menu thumbnail should show that car's saved colors when available. Do not show another car's paint while loading.

## Data and persistence
Use stable vehicle IDs and a data-driven registry for artwork, masks, dimensions, display names and thumbnails.
Key saved drawings, histories and thumbnails by vehicle ID and relevant asset version. Preserve existing Apex GT data; migrate its key if needed without losing it.
Save pending strokes before navigating away. Resetting one car must never affect others. Verify persistence after a full app restart.
Keep all core content bundled and usable offline.

## Layout
Preserve the current neon-garage look. Enlarge usable artwork where possible without cropping the car.
Fix the settings cog overlapping the finish flag in the studio screenshot. All controls must respect safe areas and have separate touch targets of at least 44 points.
Verify portrait, landscape and a small iPhone screen. No accidental drawing from a garage swipe.

## Verification and delivery
1. Verify asset/mask overlays on screen for EACH new vehicle.
2. Test strokes at panel edges, crossing regions, leaving/re-entering a region and around wheel holes.
3. Test erase, undo, redo, export and reopening saved work per car.
4. Test switching cars rapidly and returning from the studio.
5. Confirm the original Apex GT still behaves correctly and retains saved art.
6. Check iOS native bundling and Expo dependency compatibility.
7. Report actual device/simulator testing separately from static or automated checks.

Implement the full extension. Do not stop after adding images to the menu. If a specific artwork cannot be segmented reliably, report the precise issue rather than silently using the wrong masks.

