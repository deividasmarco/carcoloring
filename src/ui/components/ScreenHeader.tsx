/**
 * The header of a secondary screen: a clear way back to the garage, and the
 * screen's title in the display face, sized to the room it has (one line).
 */
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fitTitleSize, nameSpacing } from '../fitName';
import { Icon } from '../icons';
import { colors, control, radius, type } from '../theme';

/** Width the back button takes, plus the gap after it. */
const BACK_W = 130;

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const room = (width - insets.left - insets.right - 24 - BACK_W) / Math.max(1, fontScale);
  const size = fitTitleSize(title, room, 18, 12);
  return (
    <View style={[styles.top, { paddingLeft: insets.left + 12, paddingRight: insets.right + 12 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to the garage"
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Icon name="back" size={24} color={colors.text} />
        <Text style={styles.backText}>Garage</Text>
      </Pressable>
      <Text style={[styles.title, { fontSize: size, letterSpacing: nameSpacing(size) }]} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: control.minTouch,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  backText: { ...type.label, color: colors.text },
  title: { fontFamily: type.title.fontFamily, color: colors.text, flexShrink: 1 },
  pressed: { opacity: control.pressedOpacity },
});
