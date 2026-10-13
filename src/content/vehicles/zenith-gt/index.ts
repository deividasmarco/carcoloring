import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { ZENITH_GT_TRACE } from './trace';

export const zenithGt: CatalogVehicle = {
  id: 'zenith-gt',
  name: 'Zenith GT',
  description: 'a sharp mid-engine sports car',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: ZENITH_GT_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
