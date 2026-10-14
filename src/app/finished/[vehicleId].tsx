import { Redirect, useLocalSearchParams } from 'expo-router';
import { getGarageEntry } from '../../content/registry';
import { FinishedScreen } from '../../features/finished/FinishedScreen';

export default function FinishedRoute() {
  const { vehicleId, creation } = useLocalSearchParams<{ vehicleId: string; creation?: string }>();
  const entry = getGarageEntry(vehicleId);
  if (!entry) return <Redirect href="/" />;
  return <FinishedScreen entry={entry} creationId={creation} />;
}
