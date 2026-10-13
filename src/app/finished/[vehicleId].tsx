import { Redirect, useLocalSearchParams } from 'expo-router';
import { getGarageEntry } from '../../content/registry';
import { FinishedScreen } from '../../features/finished/FinishedScreen';

export default function FinishedRoute() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const entry = getGarageEntry(vehicleId);
  if (!entry) return <Redirect href="/" />;
  return <FinishedScreen entry={entry} />;
}
