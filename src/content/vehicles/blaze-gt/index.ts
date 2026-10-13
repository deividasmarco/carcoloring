import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { BLAZE_GT_TRACE } from './trace';

export const blazeGt: CatalogVehicle = {
  id: 'blaze-gt',
  name: 'Blaze GT',
  description: 'a wedge-shaped supercar',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: BLAZE_GT_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
