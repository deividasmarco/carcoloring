import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { NOVA_SUV_TRACE } from './trace';

export const novaSuv: CatalogVehicle = {
  id: 'nova-suv',
  name: 'Nova SUV',
  description: 'a sporty crossover',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: NOVA_SUV_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
