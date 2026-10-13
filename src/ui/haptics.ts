import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tick for selections; silently ignored where unsupported. */
export function tick() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

export function thud() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
