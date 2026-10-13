import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { BASECAMP_4X4_TRACE } from './trace';

export const basecamp4x4: CatalogVehicle = {
  id: 'basecamp-4x4',
  name: 'Basecamp 4x4',
  description: 'a squared-off off-roader',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: BASECAMP_4X4_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
