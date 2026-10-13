import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { VOLT_SEDAN_TRACE } from './trace';

export const voltSedan: CatalogVehicle = {
  id: 'volt-sedan',
  name: 'Volt Sedan',
  description: 'a sporty four-door sedan',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: VOLT_SEDAN_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
