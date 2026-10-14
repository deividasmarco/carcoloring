/**
 * Finished artwork: the composed export, revealed with a short celebration —
 * one soft light sweep across the car and a few sparkles that rise and fade.
 * Nothing flashes; with reduced motion the picture simply fades in.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Canvas,
  Group,
  Image,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Skia,
  type SkImage,
} from '@shopify/react-native-skia';
import Animated, { Easing, FadeIn, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GarageEntry } from '../../content/registry';
import { getArtwork } from '../../state/artworkHandoff';
import { useReduceMotion } from '../../state/settings';
import { IconButton } from '../../ui/components/IconButton';
import { Icon } from '../../ui/icons';
import { colors, fonts, radius } from '../../ui/theme';
import { saveArtwork, shareArtwork } from './shareArtwork';

const SPARKLE_COLORS = [colors.cyan, colors.amber, '#FFFFFF', colors.magenta, colors.cyan];

/** Four-point star centred at the origin. */
const STAR = (() => {
  const b = Skia.PathBuilder.Make();
  b.moveTo(0, -1).quadTo(0.12, -0.12, 1, 0).quadTo(0.12, 0.12, 0, 1).quadTo(-0.12, 0.12, -1, 0).quadTo(-0.12, -0.12, 0, -1).close();
  return b.build();
})();

function Sparkle({ progress, i, w, h }: { progress: { value: number }; i: number; w: number; h: number }) {
  // Deterministic placement around the car's silhouette band.
  const x = w * (0.12 + ((i * 0.618) % 1) * 0.76);
  const y = h * (0.42 + (((i * 0.382) % 1) - 0.5) * 0.42);
  const start = (i % 7) / 10;
  const r = 6 + (i % 4) * 3;
  const transform = useDerivedValue(() => {
    const t = Math.min(1, Math.max(0, (progress.value - start) / 0.45));
    const s = r * Math.sin(t * Math.PI);
    return [{ translateX: x }, { translateY: y - t * 26 }, { scale: Math.max(0.001, s) }];
  });
  const opacity = useDerivedValue(() => {
    const t = Math.min(1, Math.max(0, (progress.value - start) / 0.45));
    return Math.sin(t * Math.PI);
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={STAR} color={SPARKLE_COLORS[i % SPARKLE_COLORS.length]} />
    </Group>
  );
}

function Artwork({ image, width, height, celebrate }: { image: SkImage; width: number; height: number; celebrate: boolean }) {
  const progress = useSharedValue(celebrate ? 0 : 1);
  useEffect(() => {
    if (celebrate) progress.value = withDelay(250, withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.cubic) }));
  }, [celebrate, progress]);
  const sweep = useDerivedValue(() => [{ translateX: -width * 0.6 + progress.value * width * 2 }, { skewX: -0.5 }]);
  const sweepOpacity = useDerivedValue(() => 0.45 * Math.sin(Math.min(1, progress.value * 1.15) * Math.PI));
  const clip = useMemo(() => Skia.RRectXY(Skia.XYWHRect(0, 0, width, height), 18, 18), [width, height]);
  return (
    <Canvas style={{ width, height }}>
      <Group clip={clip}>
        <Image image={image} x={0} y={0} width={width} height={height} fit="cover" />
        {celebrate ? (
          <Group transform={sweep} opacity={sweepOpacity} blendMode="screen">
            <Rect x={0} y={-height * 0.2} width={width * 0.22} height={height * 1.4}>
              <LinearGradient start={{ x: 0, y: 0 }} end={{ x: width * 0.22, y: 0 }} colors={['#00000000', '#FFFFFFCC', '#00000000']} />
            </Rect>
          </Group>
        ) : null}
      </Group>
      {celebrate ? Array.from({ length: 16 }, (_, i) => <Sparkle key={i} i={i} progress={progress} w={width} h={height} />) : null}
      <RoundedRect x={0.5} y={0.5} width={width - 1} height={height - 1} r={18} color="rgba(34, 228, 255, 0.35)" style="stroke" strokeWidth={1} />
    </Canvas>
  );
}

/** `creationId`: the picture just finished. */
export function FinishedScreen({ entry, creationId }: { entry: GarageEntry; creationId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const [image, setImage] = useState<SkImage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const key = { vehicleId: entry.vehicle.id, assetVersion: entry.vehicle.generated.assetVersion ?? 1, creationId };
    getArtwork(entry, key).then((img) => alive && setImage(img));
    return () => {
      alive = false;
    };
  }, [entry, creationId]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  const landscape = width > height;
  const btn = Math.round(Math.min(64, Math.max(52, Math.min(width, height) * 0.15)));
  const availW = width - insets.left - insets.right - 32 - (landscape ? btn + 32 : 0);
  const availH = height - insets.top - insets.bottom - 32 - (landscape ? 0 : btn + 56);
  const aspect = entry.scene.frame.width / entry.scene.frame.height;
  const artW = Math.floor(Math.min(availW, availH * aspect));
  const artH = Math.floor(artW / aspect);
  const backToPaint = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/studio/[vehicleId]', params: creationId ? { vehicleId: entry.vehicle.id, creation: creationId } : { vehicleId: entry.vehicle.id } });
  const fileName = `${entry.vehicle.id}-${new Date().toISOString().slice(0, 10)}`;

  const actions = (
    <View style={[styles.actions, landscape ? styles.actionsColumn : styles.actionsRow]}>
      <IconButton icon="crayon" label="Paint" showLabel size={btn} onPress={backToPaint} />
      <IconButton
        icon="save"
        label="Save"
        showLabel
        size={btn}
        disabled={!image}
        onPress={async () => {
          if (!image) return;
          const r = await saveArtwork(image, fileName);
          setNotice(r === 'saved' ? 'Saved to your photos' : r === 'denied' ? 'Photos access is off in Settings' : 'Could not save the picture');
        }}
      />
      <IconButton
        icon="share"
        label="Share"
        showLabel
        size={btn}
        disabled={!image}
        onPress={async () => {
          if (image && !(await shareArtwork(image, fileName))) setNotice('Sharing is not available here');
        }}
      />
      <IconButton icon="garage" label="Garage" showLabel size={btn} onPress={() => router.dismissTo('/')} />
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={[styles.body, landscape && styles.bodyRow]}>
        <View style={styles.artSlot}>
          {image ? (
            <Animated.View entering={FadeIn.duration(reduceMotion ? 300 : 500)}>
              <Artwork image={image} width={artW} height={artH} celebrate={!reduceMotion} />
            </Animated.View>
          ) : (
            <View style={{ width: artW, height: artH, borderRadius: radius.l, backgroundColor: colors.surface }} />
          )}
        </View>
        {actions}
      </View>
      {notice ? (
        <Animated.View entering={FadeIn} style={[styles.notice, { bottom: insets.bottom + 16 }]} accessibilityLiveRegion="polite">
          <Icon name="check" size={18} color={colors.cyan} />
          <Text style={styles.noticeText}>{notice}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 16 },
  bodyRow: { flexDirection: 'row' },
  artSlot: {
    shadowColor: colors.cyan,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  actions: { gap: 12 },
  actionsRow: { flexDirection: 'row' },
  actionsColumn: { flexDirection: 'column' },
  notice: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  noticeText: { fontFamily: fonts.label, fontSize: 14, color: colors.text },
});
