/**
 * The parent area. Every route under /parents (including deep links such as
 * neonbay://parents) shows the parental gate first; leaving the area closes
 * the gate again.
 */
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ParentalGate } from '../../features/parents/ParentalGate';
import { closeParentGate, useParentGateOpen } from '../../state/parentGate';
import { colors } from '../../ui/theme';

export default function ParentsLayout() {
  const open = useParentGateOpen();
  const router = useRouter();
  useEffect(() => () => closeParentGate(), []);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  if (!open) return <ParentalGate onClose={leave} />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }} />;
}
