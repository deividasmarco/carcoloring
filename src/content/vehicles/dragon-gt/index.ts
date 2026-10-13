import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { DRAGON_GT_TRACE } from './trace';

export const dragonGt: CatalogVehicle = {
  id: 'dragon-gt',
  name: 'Dragon GT',
  description: 'a muscular grand-touring coupe with a big wing',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: DRAGON_GT_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
