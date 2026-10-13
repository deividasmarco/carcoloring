import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { tick } from '../haptics';
import { Icon, type IconName } from '../icons';
import { colors, fonts, radius, TOUCH } from '../theme';

interface Props {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** Filled cyan primary action. */
  primary?: boolean;
  /** Show the label under the icon (parents read it; kids read the icon). */
  showLabel?: boolean;
  size?: number;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon, label, onPress, disabled, selected, primary, showLabel, size = TOUCH, accent, style }: Props) {
  const iconColor = primary ? colors.bg : selected ? colors.cyan : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        tick();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { width: size, minHeight: size, borderRadius: size * 0.32 },
        primary && styles.primary,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.inner}>
        <Icon name={icon} size={Math.round(size * 0.5)} color={iconColor} accent={accent} />
        {showLabel ? (
          <Text numberOfLines={1} style={[styles.label, primary && { color: colors.bg }]}>
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
  },
  inner: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6 },
  primary: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  selected: {
    borderColor: colors.cyan,
    backgroundColor: colors.cyanSoft,
  },
  disabled: { opacity: 0.32 },
  pressed: { transform: [{ scale: 0.93 }] },
  label: {
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
});

export const buttonRadius = radius;
