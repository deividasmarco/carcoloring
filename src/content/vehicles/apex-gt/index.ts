import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { APEX_GT_TRACE } from './trace';

export const apexGt: CatalogVehicle = {
  id: 'apex-gt',
  name: 'Apex GT',
  description: 'a mid-engine supercar',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: APEX_GT_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
