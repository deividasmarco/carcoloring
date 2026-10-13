/**
 * The painting screen route. Access is enforced here, not only in the garage
 * menu, so a link or back-stack entry to a locked vehicle can't paint it:
 * - free or unlocked vehicles open normally;
 * - a locked vehicle with saved artwork opens view-only;
 * - a locked vehicle without artwork goes back to the garage.
 */
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getGarageEntry, type GarageEntry } from '../../content/registry';
import { StudioScreen } from '../../features/studio/StudioScreen';
import { drawingKeyOf } from '../../state/drawingKey';
import { usePaintPreview } from '../../state/paintPreview';
import { useVehicleAccess } from '../../state/premium';
import { colors } from '../../ui/theme';

function GuardedStudio({ entry }: { entry: GarageEntry }) {
  const access = useVehicleAccess(entry.vehicle.id);
  const saved = usePaintPreview(drawingKeyOf(entry.vehicle));
  if (access === 'checking' || (access === 'locked' && !saved.loaded)) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (access === 'locked' && !saved.hasPaint) return <Redirect href="/" />;
  return <StudioScreen key={entry.vehicle.id} entry={entry} />;
}

export default function StudioRoute() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const entry = getGarageEntry(vehicleId);
  if (!entry) return <Redirect href="/" />;
  return <GuardedStudio key={entry.vehicle.id} entry={entry} />;
}
