import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { CIRCUIT_COUPE_TRACE } from './trace';

export const circuitCoupe: CatalogVehicle = {
  id: 'circuit-coupe',
  name: 'Circuit Coupe',
  description: 'a classic rear-engine sports coupe',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: CIRCUIT_COUPE_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
