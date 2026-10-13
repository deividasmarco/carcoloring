/**
 * Reset confirmation, framed as a car wash. Two big icon buttons; the short
 * question is for the grown-up reading along.
 */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { thud, tick } from '../../ui/haptics';
import { Icon } from '../../ui/icons';
import { colors, fonts, radius } from '../../ui/theme';

interface Props {
  visible: boolean;
  onWash: () => void;
  onKeep: () => void;
}

export function WashDialog({ visible, onWash, onKeep }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeep} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.scrim}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.badge}>
            <Icon name="wash" size={44} color={colors.text} />
          </View>
          <Text style={styles.title}>Wash off all the paint?</Text>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keep my paint"
              onPress={() => {
                tick();
                onKeep();
              }}
              style={({ pressed }) => [styles.choice, styles.keep, pressed && styles.pressed]}
            >
              <Icon name="close" size={30} color={colors.text} />
              <Text style={styles.choiceLabel}>Keep</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Wash the car clean"
              onPress={() => {
                thud();
                onWash();
              }}
              style={({ pressed }) => [styles.choice, styles.wash, pressed && styles.pressed]}
            >
              <Icon name="wash" size={30} color={colors.bg} />
              <Text style={[styles.choiceLabel, { color: colors.bg }]}>Wash</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(3, 5, 10, 0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  title: { fontFamily: fonts.label, fontSize: 18, color: colors.text, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  choice: {
    flex: 1,
    height: 72,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  keep: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.lineStrong },
  wash: {
    backgroundColor: colors.magenta,
    shadowColor: colors.magenta,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  choiceLabel: { fontFamily: fonts.labelBold, fontSize: 13, letterSpacing: 1, color: colors.text, textTransform: 'uppercase' },
  pressed: { transform: [{ scale: 0.95 }] },
});
