/**
 * Renders a scene + vehicle for the studio. `transform` maps vehicle units to
 * the screen; the scene is drawn through the inverse of the vehicle's
 * placement, so car, paint, masks and touches all share vehicle units.
 *
 * Two stacked canvases:
 *   back:  scene background + ambient animation (redraws every frame)
 *   front: car base → paint (+ live stroke) → shading/outlines
 *          (redraws only when paint, the live stroke or the view changes)
 * Neither canvas receives touches; input is handled by the parent.
 */
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group, Image, Picture, type SkImage, type SkPicture } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { GarageEntry } from '../../content/registry';
import { GarageAmbience } from '../../content/scenes/neon-garage/effects';
import type { SceneDefinition } from '../../content/scenes/types';
import { recordPicture } from '../../engine/render/picture';
import type { VehicleRuntime } from '../../engine/vehicle/vehicleRuntime';
import type { ViewTransform } from '../../engine/view/viewTransform';

const BLEED = { x: -2600, y: -2600, width: 6800, height: 6800 };
const backgrounds = new Map<string, SkPicture>();

export function sceneBackground(scene: SceneDefinition): SkPicture {
  let pic = backgrounds.get(scene.id);
  if (!pic) {
    pic = recordPicture(BLEED, (c) => scene.drawBackground(c));
    backgrounds.set(scene.id, pic);
  }
  return pic;
}

const AMBIENCE: Record<string, (p: { animate: boolean }) => React.ReactElement> = {
  'neon-garage': GarageAmbience,
};

interface Props {
  entry: GarageEntry;
  vehicle: VehicleRuntime;
  transform: SharedValue<ViewTransform>;
  paint: SharedValue<SkImage | null>;
  live?: SharedValue<SkPicture | null>;
  animate: boolean;
}

export const Stage = memo(function Stage({ entry, vehicle, transform, paint, live, animate }: Props) {
  const background = useMemo(() => sceneBackground(entry.scene), [entry.scene]);
  const p = vehicle.placement;
  const matrix = useDerivedValue(() => {
    const t = transform.value;
    return [{ translateX: t.tx }, { translateY: t.ty }, { scale: t.scale }];
  });
  // Scene units → vehicle units → screen.
  const sceneMatrix = useDerivedValue(() => {
    const t = transform.value;
    return [{ translateX: t.tx }, { translateY: t.ty }, { scale: t.scale / p.scale }, { translateX: -p.x }, { translateY: -p.y }];
  });
  const empty = useMemo(() => recordPicture({ x: 0, y: 0, width: 1, height: 1 }, () => {}), []);
  // Picture requires a value; an empty picture stands in when no stroke is live.
  const livePicture = useDerivedValue(() => live?.value ?? empty);
  const rect = vehicle.layout.paintRect;
  const Ambience = AMBIENCE[entry.scene.id];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={sceneMatrix}>
          <Picture picture={background} />
          {Ambience ? <Ambience animate={animate} /> : null}
        </Group>
      </Canvas>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={matrix}>
          <Picture picture={vehicle.basePicture} />
          <Group layer>
            <Image image={paint} x={rect.x} y={rect.y} width={rect.width} height={rect.height} fit="fill" />
            {live ? <Picture picture={livePicture} /> : null}
          </Group>
          <Picture picture={vehicle.overlayPicture} />
        </Group>
      </Canvas>
    </View>
  );
});
