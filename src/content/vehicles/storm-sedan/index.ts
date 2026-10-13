import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { STORM_SEDAN_TRACE } from './trace';

export const stormSedan: CatalogVehicle = {
  id: 'storm-sedan',
  name: 'Storm Sedan',
  description: 'a fast four-door sports saloon',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: STORM_SEDAN_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
