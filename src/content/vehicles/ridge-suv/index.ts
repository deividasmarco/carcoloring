import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { RIDGE_SUV_TRACE } from './trace';

export const ridgeSuv: CatalogVehicle = {
  id: 'ridge-suv',
  name: 'Ridge SUV',
  description: 'a sporty compact SUV',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: RIDGE_SUV_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
