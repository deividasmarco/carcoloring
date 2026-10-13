import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { tick } from '../haptics';
import { colors, PALETTE } from '../theme';
import { Crayon } from './Crayon';

interface Props {
  selected: string;
  onSelect: (color: string) => void;
  /** 'tray': upright crayons in rows (portrait). 'rail': crayons pointing at the car (landscape). */
  layout: 'tray' | 'rail';
  /** Size of one slot (touch target), dp. */
  slot: { width: number; height: number };
  columns: number;
  /** Dimmed while the eraser is active; a tap still picks the colour. */
  dimmed?: boolean;
}

export const CrayonRack = memo(function CrayonRack({ selected, onSelect, layout, slot, columns, dimmed }: Props) {
  const tray = layout === 'tray';
  const length = tray ? slot.height - 14 : slot.width - 18;
  const thickness = tray ? Math.min(slot.width * 0.42, length * 0.3) : Math.min(slot.height * 0.5, length * 0.3);
  return (
    <View style={[styles.rack, { width: slot.width * columns }]} accessibilityRole="radiogroup" accessibilityLabel="Crayons">
      {PALETTE.map((c) => {
        const isSel = c.color === selected;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="radio"
            accessibilityLabel={c.name}
            accessibilityState={{ selected: isSel }}
            onPress={() => {
              tick();
              onSelect(c.color);
            }}
            style={({ pressed }) => [
              styles.slot,
              { width: slot.width, height: slot.height },
              tray ? styles.slotTray : styles.slotRail,
              dimmed && !isSel && { opacity: 0.55 },
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            <View style={isSel ? (tray ? styles.liftUp : styles.liftLeft) : undefined}>
              <Crayon id={c.id} color={c.color} length={length} thickness={thickness} direction={tray ? 'up' : 'left'} />
            </View>
            {isSel ? <View style={tray ? styles.slotLightTray : styles.slotLightRail} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
});

const glow = {
  backgroundColor: colors.cyan,
  shadowColor: colors.cyan,
  shadowOpacity: 0.9,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
};

const styles = StyleSheet.create({
  rack: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { alignItems: 'center' },
  slotTray: { justifyContent: 'flex-end', paddingBottom: 6 },
  slotRail: { justifyContent: 'center', alignItems: 'flex-end', paddingRight: 6 },
  liftUp: { transform: [{ translateY: -9 }] },
  liftLeft: { transform: [{ translateX: -10 }] },
  slotLightTray: { position: 'absolute', bottom: 1, width: '58%', height: 3, borderRadius: 2, ...glow },
  slotLightRail: { position: 'absolute', right: 6, bottom: 1, width: '62%', height: 3, borderRadius: 2, ...glow },
});
