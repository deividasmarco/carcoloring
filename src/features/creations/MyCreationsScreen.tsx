/**
 * My Creations: the child's own pictures, most recently edited first.
 * Tap a picture to carry on with it; "Make another" starts a separate blank
 * picture of the same vehicle (the existing one is kept). Deleting needs a
 * confirmation in which keeping the picture is the prominent choice.
 * Pictures of premium vehicles stay here when premium ends: they open to
 * look at, and a grown-up can unlock painting in the parent area.
 */
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGarageEntry } from '../../content/registry';
import { deleteCreation, useCreations, type CreationMeta } from '../../state/creations';
import { accessOf, canPaint, premiumStore, usePremium } from '../../state/premium';
import { Button } from '../../ui/components/Button';
import { fitNamesUniformly, type NameFit } from '../../ui/fitName';
import { thud, tick } from '../../ui/haptics';
import { ScreenHeader } from '../../ui/components/ScreenHeader';
import { Icon } from '../../ui/icons';
import { colors, control, fonts, radius, type } from '../../ui/theme';
import { ensurePicture, pictureUri } from './pictures';

const MIN_CARD = 160;
const GAP = 12;

function edited(ts: number, now = Date.now()) {
  const d = new Date(ts);
  const today = new Date(now);
  const days = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: today.getFullYear() === d.getFullYear() ? undefined : 'numeric' });
}

function Picture({ meta, width }: { meta: CreationMeta; width: number }) {
  const [uri, setUri] = useState<string | null>(null);
  const entry = getGarageEntry(meta.vehicleId);
  useEffect(() => {
    let alive = true;
    if (!meta.picture) ensurePicture(meta);
    void pictureUri(meta).then((u) => alive && setUri(u));
    return () => {
      alive = false;
    };
  }, [meta]);
  const h = Math.round(width * 0.6);
  if (uri) return <Image source={{ uri }} style={{ width, height: h }} resizeMode="contain" accessibilityIgnoresInvertColors />;
  // Until its picture is ready: the vehicle's outline.
  return entry ? <Image source={entry.thumbnail} style={{ width, height: h, opacity: 0.5 }} resizeMode="contain" /> : <View style={{ width, height: h }} />;
}

function CreationCard({
  meta,
  width,
  fit,
  locked,
  onOpen,
  onMakeAnother,
  onDelete,
}: {
  meta: CreationMeta;
  width: number;
  fit: NameFit;
  locked: boolean;
  onOpen: () => void;
  onMakeAnother: () => void;
  onDelete: () => void;
}) {
  const entry = getGarageEntry(meta.vehicleId);
  const name = entry?.vehicle.name ?? 'Vehicle';
  return (
    <View style={[styles.card, { width }]} testID={`creation-${meta.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${locked ? 'Look at' : 'Keep painting'} your ${name} picture, edited ${edited(meta.updatedAt).toLowerCase()}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <Picture meta={meta} width={width - 24} />
        <Text
          style={[styles.name, { fontSize: fit.fontSize, letterSpacing: fit.letterSpacing, lineHeight: fit.lineHeight, minHeight: fit.lineHeight * 2 }]}
          numberOfLines={fit.lines.length}
        >
          {fit.lines.join('\n')}
        </Text>
      </Pressable>
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          {locked ? <Icon name="lock" size={14} color={colors.textDim} accent={colors.textDim} /> : null}
          <Text style={styles.when}>{edited(meta.updatedAt)}</Text>
        </View>
        {/* Small and out of the way; a confirmation follows. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete this ${name} picture`}
          onPress={onDelete}
          hitSlop={2}
          style={({ pressed }) => [styles.trash, pressed && styles.pressed]}
        >
          <Icon name="trash" size={18} color={colors.textFaint} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Make another ${name} picture`}
        onPress={onMakeAnother}
        style={({ pressed }) => [styles.another, locked && styles.anotherLocked, pressed && styles.pressed]}
      >
        <Icon name={locked ? 'lock' : 'plus'} size={18} color={locked ? colors.textDim : colors.text} accent={colors.textDim} />
        <Text style={[styles.anotherText, locked && styles.anotherTextLocked]}>Make another</Text>
      </Pressable>
    </View>
  );
}

function ConfirmDelete({ meta, onKeep, onDelete }: { meta: CreationMeta | null; onKeep: () => void; onDelete: () => void }) {
  const name = meta ? (getGarageEntry(meta.vehicleId)?.vehicle.name ?? 'vehicle') : '';
  return (
    <Modal visible={!!meta} transparent animationType="fade" onRequestClose={onKeep} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.scrim}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.dialogTitle}>Delete this picture?</Text>
          <Text style={styles.dialogBody}>The {name} picture will be gone for good. This can&apos;t be undone.</Text>
          <View style={styles.dialogActions}>
            <Button variant="primary" label="Keep it" onPress={onKeep} />
            <Button
              variant="quiet"
              icon="trash"
              label="Delete"
              accessibilityLabel="Delete the picture"
              onPress={() => {
                thud();
                onDelete();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function MyCreationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { ready, list } = useCreations();
  const premium = usePremium();
  const entitled = premiumStore().isEntitled();
  const [confirm, setConfirm] = useState<CreationMeta | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 4500);
    return () => clearTimeout(t);
  }, [hint]);

  const room = width - insets.left - insets.right - 32;
  const columns = Math.max(2, Math.min(5, Math.floor((room + GAP) / (MIN_CARD + GAP))));
  const cardW = Math.floor((room - GAP * (columns - 1)) / columns);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const lockedFor = (m: CreationMeta) => !canPaint(accessOf(m.vehicleId, premium, entitled));
  const nameOf = (m: CreationMeta) => getGarageEntry(m.vehicleId)?.vehicle.name ?? 'Vehicle';
  // One name size for the whole gallery, so the cards look alike.
  const fitFor = fitNamesUniformly(list.map(nameOf), (cardW - 24) / Math.max(1, fontScale), { max: 14, min: 10 });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="MY CREATIONS" onBack={close} />

      {hint ? (
        <Text style={[styles.hint, { marginLeft: insets.left + 16, marginRight: insets.right + 16 }]} accessibilityLiveRegion="polite">
          {hint}
        </Text>
      ) : null}

      {ready && list.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyBadge}>
            <Icon name="gallery" size={44} color={colors.text} accent={colors.amber} />
          </View>
          <Text style={styles.emptyTitle}>No pictures yet</Text>
          <Text style={styles.emptyBody}>Paint a car and your picture will be kept here.</Text>
          <Button variant="primary" icon="grid" label="Choose a car" onPress={() => router.replace('/vehicles')} />
        </View>
      ) : (
        <FlatList
          key={columns}
          data={list}
          numColumns={columns}
          keyExtractor={(m) => m.id}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingTop: 8, paddingBottom: insets.bottom + 24, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }}
          renderItem={({ item }) => {
            const locked = lockedFor(item);
            return (
              <CreationCard
                meta={item}
                width={cardW}
                fit={fitFor(nameOf(item))}
                locked={locked}
                onOpen={() => {
                  tick();
                  router.push({ pathname: '/studio/[vehicleId]', params: { vehicleId: item.vehicleId, creation: item.id } });
                }}
                onMakeAnother={() => {
                  tick();
                  if (locked) setHint('Ask a grown-up to unlock this one in the parent area.');
                  else router.push({ pathname: '/studio/[vehicleId]', params: { vehicleId: item.vehicleId, new: '1' } });
                }}
                onDelete={() => setConfirm(item)}
              />
            );
          }}
        />
      )}

      <ConfirmDelete
        meta={confirm}
        onKeep={() => setConfirm(null)}
        onDelete={() => {
          const m = confirm;
          setConfirm(null);
          if (m) void deleteCreation(m.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hint: {
    ...type.bodySmall,
    color: colors.text,
    textAlign: 'center',
    padding: 10,
    borderRadius: radius.m,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  card: { padding: 12, gap: 8, borderRadius: radius.m, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  open: { alignItems: 'center', gap: 6 },
  name: { fontFamily: fonts.display, color: colors.text, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -6, marginBottom: -4 },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 },
  when: { ...type.bodySmall, fontSize: 13, color: colors.textDim },
  another: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surfaceRaised,
  },
  anotherLocked: { borderColor: colors.line },
  anotherText: { ...type.label, fontSize: 13, letterSpacing: 0.5, color: colors.text },
  anotherTextLocked: { color: colors.textDim },
  trash: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  emptyBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  emptyTitle: { ...type.heading, color: colors.text },
  emptyBody: { ...type.body, color: colors.textDim, textAlign: 'center', marginBottom: 6 },
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    gap: 12,
    borderRadius: radius.l,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dialogTitle: { ...type.heading, color: colors.text },
  dialogBody: { ...type.body, color: colors.textDim },
  dialogActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  pressed: { opacity: control.pressedOpacity },
});
