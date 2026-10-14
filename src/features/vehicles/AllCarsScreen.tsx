/**
 * Every vehicle as a grid: a faster way through the collection than swiping
 * one at a time. Choosing a vehicle shows it in the garage, where the normal
 * painting action is (a locked one is shown locked there: no purchase sheet).
 */
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GARAGE, type GarageEntry } from '../../content/registry';
import { requestGarageSelection } from '../../state/garageSelection';
import { accessOf, premiumStore, usePremium } from '../../state/premium';
import { useSettings } from '../../state/settings';
import { fitNamesUniformly, type NameFit } from '../../ui/fitName';
import { tick } from '../../ui/haptics';
import { ScreenHeader } from '../../ui/components/ScreenHeader';
import { Icon } from '../../ui/icons';
import { colors, control, fonts, radius, type } from '../../ui/theme';

type Filter = 'all' | 'free' | 'bikes';
const FILTERS: { id: Filter; label: string; test: (e: GarageEntry) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'free', label: 'Free', test: (e) => e.tier === 'free' },
  { id: 'bikes', label: 'Bikes', test: (e) => e.kind === 'superbike' },
];

const MIN_CARD = 170;
const GAP = 12;

function VehicleCard({
  entry,
  width,
  name,
  locked,
  selected,
  onPress,
}: {
  entry: GarageEntry;
  width: number;
  name: NameFit;
  locked: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const state = [locked ? 'locked' : null, selected ? 'selected' : null].filter(Boolean).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.vehicle.name}${state ? `, ${state}` : ''}`}
      accessibilityState={{ selected }}
      testID={`vehicle-${entry.vehicle.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      <Image source={entry.thumbnail} style={{ width: width - 24, height: Math.round((width - 24) * 0.62) }} resizeMode="contain" />
      <View style={[styles.nameBox, { minHeight: name.lineHeight * 2 }]}>
        <Text style={[styles.name, { fontSize: name.fontSize, letterSpacing: name.letterSpacing, lineHeight: name.lineHeight }]} numberOfLines={name.lines.length}>
          {name.lines.join('\n')}
        </Text>
      </View>
      {locked ? (
        <View style={styles.lock} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="lock" size={14} color={colors.textDim} accent={colors.textDim} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function AllCarsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const settings = useSettings();
  const premium = usePremium();
  const entitled = premiumStore().isEntitled();
  const [filter, setFilter] = useState<Filter>('all');
  const entries = useMemo(() => GARAGE.filter(FILTERS.find((f) => f.id === filter)!.test), [filter]);

  const room = width - insets.left - insets.right - 32;
  const columns = Math.max(2, Math.min(5, Math.floor((room + GAP) / (MIN_CARD + GAP))));
  const cardW = Math.floor((room - GAP * (columns - 1)) / columns);
  const selectedId = settings.lastVehicle ?? GARAGE[0].vehicle.id;
  // One name size for the whole grid, so the cards look alike.
  const nameFor = useMemo(() => fitNamesUniformly(GARAGE.map((e) => e.vehicle.name), (cardW - 24) / Math.max(1, fontScale), { max: 15, min: 10 }), [cardW, fontScale]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const choose = (id: string) => {
    tick();
    requestGarageSelection(id);
    close();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="ALL CARS" onBack={close} />
      <View style={[styles.filters, { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }]} accessibilityRole="tablist">
        {FILTERS.map((f) => {
          const on = f.id === filter;
          const count = GARAGE.filter(f.test).length;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${f.label}, ${count}`}
              onPress={() => setFilter(f.id)}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {f.label.toUpperCase()} <Text style={styles.chipCount}>{count}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        key={columns}
        data={entries}
        numColumns={columns}
        // 27 small images: render them all at once (no canvases here).
        initialNumToRender={GARAGE.length}
        keyExtractor={(e) => e.vehicle.id}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingTop: 4, paddingBottom: insets.bottom + 24, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }}
        renderItem={({ item }) => (
          <VehicleCard
            entry={item}
            width={cardW}
            name={nameFor(item.vehicle.name)}
            locked={accessOf(item.vehicle.id, premium, entitled) === 'locked'}
            selected={item.vehicle.id === selectedId}
            onPress={() => choose(item.vehicle.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  filters: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  chip: {
    minHeight: control.minTouch,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.cyan, backgroundColor: colors.cyanSoft },
  chipText: { ...type.caption, fontSize: 13, color: colors.textDim },
  chipTextOn: { color: colors.text },
  chipCount: { color: colors.textFaint },
  card: {
    padding: 12,
    gap: 8,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  cardSelected: { borderColor: colors.cyan, borderWidth: 2, padding: 11, ...control.glow, shadowOpacity: 0.35 },
  nameBox: { justifyContent: 'center' },
  name: { fontFamily: fonts.display, color: colors.text, textAlign: 'center' },
  lock: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { opacity: control.pressedOpacity },
});
