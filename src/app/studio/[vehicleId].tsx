/**
 * The painting screen route: /studio/<vehicleId>
 *   ?creation=<id>  that creation (My Creations, Keep painting)
 *   ?new=1          a new, blank creation of the vehicle (Make another)
 *   (neither)       the vehicle's latest creation, or a new one
 *
 * Access is enforced here, not only in the garage, so a link or back-stack
 * entry to a locked vehicle can't paint it:
 * - free or unlocked vehicles open normally;
 * - a locked vehicle's existing creation opens to look at only;
 * - a locked vehicle with nothing to look at goes back to the garage.
 */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getGarageEntry, type GarageEntry } from '../../content/registry';
import { newCreationId } from '../../engine/persistence/creationStore';
import type { DrawingKey } from '../../engine/persistence/drawingStore';
import { StudioScreen } from '../../features/studio/StudioScreen';
import { getCreation, latestCreation, useCreations } from '../../state/creations';
import { useVehicleAccess } from '../../state/premium';
import { colors } from '../../ui/theme';

function GuardedStudio({ entry, creation, fresh }: { entry: GarageEntry; creation?: string; fresh: boolean }) {
  const access = useVehicleAccess(entry.vehicle.id);
  const creations = useCreations();
  const [newId] = useState(() => newCreationId());
  const vehicleId = entry.vehicle.id;
  const assetVersion = entry.vehicle.generated.assetVersion ?? 1;
  const meta = !creations.ready ? undefined : creation ? getCreation(creation) : fresh ? null : latestCreation(vehicleId);
  const id = meta?.id ?? newId;
  const key = useMemo<DrawingKey>(() => ({ vehicleId, assetVersion, creationId: id }), [vehicleId, assetVersion, id]);

  if (!creations.ready || access === 'checking') return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  // A named creation must exist, belong to this vehicle and fit its current artwork; never paint a different one.
  if (creation && (!meta || meta.vehicleId !== vehicleId || meta.assetVersion !== assetVersion)) {
    if (__DEV__) console.warn(`[studio] creation "${creation}" cannot be opened for ${vehicleId}`);
    return <Redirect href="/creations" />;
  }
  if (access === 'locked' && !meta) return <Redirect href="/" />;
  return <StudioScreen key={id} entry={entry} drawingKey={key} />;
}

export default function StudioRoute() {
  const { vehicleId, creation, new: fresh } = useLocalSearchParams<{ vehicleId: string; creation?: string; new?: string }>();
  const entry = getGarageEntry(vehicleId);
  if (!entry) return <Redirect href="/" />;
  return <GuardedStudio key={`${entry.vehicle.id}/${creation ?? ''}/${fresh ?? ''}`} entry={entry} creation={creation} fresh={fresh === '1'} />;
}
