import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SizeIndex, ToolId } from '../../engine/stroke/types';
import { tick } from '../haptics';
import { Icon, type IconName } from '../icons';
import { colors } from '../theme';

const TOOLS: { id: ToolId; icon: IconName; label: string }[] = [
  { id: 'crayon', icon: 'crayon', label: 'Crayon' },
  { id: 'pencil', icon: 'pencil', label: 'Coloured pencil' },
  { id: 'eraser', icon: 'eraser', label: 'Eraser' },
];

interface ToolProps {
  tool: ToolId;
  color: string;
  onChange: (t: ToolId) => void;
  size: number;
  direction: 'row' | 'column';
}

export const ToolPicker = memo(function ToolPicker({ tool, color, onChange, size, direction }: ToolProps) {
  return (
    <View style={[styles.group, { flexDirection: direction }]} accessibilityRole="radiogroup" accessibilityLabel="Tools">
      {TOOLS.map((t) => {
        const sel = t.id === tool;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="radio"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: sel }}
            onPress={() => {
              tick();
              onChange(t.id);
            }}
            style={({ pressed }) => [
              styles.tool,
              { width: size, height: size, borderRadius: size * 0.3 },
              sel && styles.toolSelected,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            <Icon name={t.icon} size={size * 0.62} color={sel ? colors.text : colors.textDim} accent={t.id === 'eraser' ? undefined : color} />
          </Pressable>
        );
      })}
    </View>
  );
});

interface SizeProps {
  value: SizeIndex;
  color: string;
  onChange: (s: SizeIndex) => void;
  size: number;
  direction: 'row' | 'column';
}

const DOTS = [0.2, 0.36, 0.56];
const SIZE_LABELS = ['Thin', 'Medium', 'Thick'];

export const SizePicker = memo(function SizePicker({ value, color, onChange, size, direction }: SizeProps) {
  return (
    <View style={[styles.group, { flexDirection: direction }]} accessibilityRole="radiogroup" accessibilityLabel="Brush size">
      {([0, 1, 2] as SizeIndex[]).map((i) => {
        const sel = i === value;
        const d = Math.round(size * DOTS[i]);
        return (
          <Pressable
            key={i}
            accessibilityRole="radio"
            accessibilityLabel={SIZE_LABELS[i]}
            accessibilityState={{ selected: sel }}
            onPress={() => {
              tick();
              onChange(i);
            }}
            style={({ pressed }) => [
              styles.sizeSlot,
              { width: size, height: size, borderRadius: size / 2 },
              sel && styles.sizeSelected,
              pressed && { transform: [{ scale: 0.9 }] },
            ]}
          >
            <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: color, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { gap: 6, alignItems: 'center', justifyContent: 'center' },
  tool: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toolSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  sizeSlot: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  sizeSelected: { borderColor: colors.cyan, backgroundColor: colors.cyanSoft },
});
