import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { BREEZE_ROADSTER_TRACE } from './trace';

export const breezeRoadster: CatalogVehicle = {
  id: 'breeze-roadster',
  name: 'Breeze Roadster',
  description: 'a small open-top roadster',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: BREEZE_ROADSTER_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
