import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { HALO_COUPE_TRACE } from './trace';

export const haloCoupe: CatalogVehicle = {
  id: 'halo-coupe',
  name: 'Halo Coupe',
  description: 'a curvy two-seat sports coupe',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: HALO_COUPE_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
