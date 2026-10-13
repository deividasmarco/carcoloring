import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { FORTRESS_4X4_TRACE } from './trace';

export const fortress4x4: CatalogVehicle = {
  id: 'fortress-4x4',
  name: 'Fortress 4x4',
  description: 'a boxy luxury off-roader',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: FORTRESS_4X4_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
