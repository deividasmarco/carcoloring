/**
 * The app's text buttons.
 * - primary: filled cyan with the one glow (the main action of a screen);
 * - secondary: raised surface with a border (other actions);
 * - quiet: like secondary, dimmer text (locked or minor actions).
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { tick } from '../haptics';
import { Icon, type IconName } from '../icons';
import { colors, control, fonts } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Spoken label when it should say more than the visible text. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  busy?: boolean;
  /** Large (64) for a screen's main action; default 52. */
  size?: 'large' | 'default';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({ label, onPress, variant = 'secondary', icon, accessibilityLabel, accessibilityHint, disabled, busy, size = 'default', style, testID }: Props) {
  const primary = variant === 'primary';
  const fg = primary ? colors.bg : variant === 'quiet' ? colors.textDim : colors.text;
  const height = size === 'large' ? 64 : 52;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }}
      disabled={disabled || busy}
      hitSlop={4}
      testID={testID}
      onPress={() => {
        tick();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { height, borderRadius: height / 2, paddingHorizontal: size === 'large' ? 26 : 20 },
        primary ? styles.primary : styles.secondary,
        primary && control.glow,
        (disabled || busy) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'large' ? 28 : 22} color={fg} accent={fg} /> : null}
          <Text style={[styles.label, size === 'large' && styles.labelLarge, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', minWidth: control.minTouch },
  primary: { backgroundColor: colors.cyan },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.lineStrong },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: fonts.labelBold, fontSize: 15, letterSpacing: 1.5, textTransform: 'uppercase' },
  labelLarge: { fontSize: 16, letterSpacing: 2 },
  disabled: { opacity: control.disabledOpacity },
  pressed: { opacity: control.pressedOpacity, transform: [{ scale: 0.98 }] },
});
