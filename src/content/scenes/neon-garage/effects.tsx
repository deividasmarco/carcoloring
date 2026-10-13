/**
 * Ambient motion for the neon garage. Everything is driven by a Skia clock on
 * the UI thread (no React re-renders) and sits *behind* the car: rain beyond
 * the window, slowly drifting tube reflections, a car's headlights sweeping
 * across the floor every few seconds, and a breathing underglow. All changes
 * are slow sine/linear ramps — no flashing or strobing.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Picture, Points, Rect, Skia, useClock, type SkPoint } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { recordPicture } from '../../../engine/render/picture';
import { drawStaticReflections, drawUnderglow } from './background';
import { SCENE_LAYOUT as L } from './layout';
import { neonGarage } from '.';

const BOUNDS = { x: -200, y: 0, width: 2000, height: 1300 };
const WIN = L.window;
const RAIN_DROPS = 64;
const SWEEP_PERIOD = 15000;

/**
 * `underglow: false` leaves out the fixed glow under the studio car (the
 * garage carousel draws one per car, moving with the selection).
 */
export function GarageAmbience({ animate, underglow = true }: { animate: boolean; underglow?: boolean }) {
  const pictures = useMemo(
    () => ({
      still: recordPicture(BOUNDS, (c) => (underglow ? neonGarage.drawStaticLighting(c) : drawStaticReflections(c))),
      glow: underglow ? recordPicture(BOUNDS, (c) => drawUnderglow(c, 1)) : null,
      reflections: recordPicture(BOUNDS, (c) => drawStaticReflections(c)),
    }),
    [underglow],
  );
  if (!animate) return <Picture picture={pictures.still} />;
  return <AnimatedAmbience glow={pictures.glow} reflections={pictures.reflections} />;
}

function AnimatedAmbience({ glow, reflections }: { glow: ReturnType<typeof recordPicture> | null; reflections: ReturnType<typeof recordPicture> }) {
  const clock = useClock();

  const glowOpacity = useDerivedValue(() => 0.74 + 0.2 * Math.sin(clock.value / 1000));
  const reflectionOpacity = useDerivedValue(() => 0.82 + 0.16 * Math.sin(clock.value / 1900 + 1.3));
  const reflectionShift = useDerivedValue(() => [{ translateX: 3 * Math.sin(clock.value / 1500) }]);

  const sweep = useDerivedValue(() => {
    const t = (clock.value % SWEEP_PERIOD) / SWEEP_PERIOD;
    return [{ translateX: -900 + t * 3400 }, { skewX: -0.6 }];
  });

  const rain = useDerivedValue(() => {
    const pts: SkPoint[] = [];
    const span = WIN.height + 80;
    for (let i = 0; i < RAIN_DROPS; i++) {
      const x = WIN.x + ((i * 97.31) % WIN.width);
      const speed = 0.42 + ((i * 7) % 5) * 0.05;
      const y = WIN.y - 40 + ((clock.value * speed + i * 211.7) % span);
      pts.push({ x, y }, { x: x - 3, y: y + 22 });
    }
    return pts;
  });

  const windowClip = useMemo(() => Skia.XYWHRect(WIN.x, WIN.y, WIN.width, WIN.height), []);
  const floorClip = useMemo(() => Skia.XYWHRect(L.bleed.x, L.floorY, L.bleed.width, 1400), []);

  return (
    <>
      <Group clip={windowClip}>
        <Points points={rain} mode="lines" color="rgba(185, 225, 255, 0.3)" strokeWidth={1.6} />
      </Group>
      <Group opacity={reflectionOpacity} transform={reflectionShift}>
        <Picture picture={reflections} />
      </Group>
      <Group clip={floorClip}>
        <Group transform={sweep} blendMode="screen">
          <Rect x={0} y={L.floorY} width={360} height={2400} opacity={0.09}>
            <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 360, y: 0 }} colors={['#00000000', '#CFF7FF', '#00000000']} />
          </Rect>
        </Group>
      </Group>
      {glow ? (
        <Group opacity={glowOpacity}>
          <Picture picture={glow} />
        </Group>
      ) : null}
    </>
  );
}
