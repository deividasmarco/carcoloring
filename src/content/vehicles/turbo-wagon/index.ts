import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { TURBO_WAGON_TRACE } from './trace';

export const turboWagon: CatalogVehicle = {
  id: 'turbo-wagon',
  name: 'Turbo Wagon',
  description: 'a fast family estate car',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: TURBO_WAGON_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
