import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { getSettings } from '../state/settings';

/** Light tick for selections; off when the parent turned haptics off, ignored where unsupported. */
export function tick() {
  if (Platform.OS === 'web' || !getSettings().haptics) return;
  Haptics.selectionAsync().catch(() => {});
}

export function thud() {
  if (Platform.OS === 'web' || !getSettings().haptics) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
