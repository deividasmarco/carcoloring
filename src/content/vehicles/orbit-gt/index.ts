import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { ORBIT_GT_TRACE } from './trace';

export const orbitGt: CatalogVehicle = {
  id: 'orbit-gt',
  name: 'Orbit GT',
  description: 'a round classic sports coupe',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: ORBIT_GT_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
