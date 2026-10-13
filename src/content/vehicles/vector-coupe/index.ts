import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { VECTOR_COUPE_TRACE } from './trace';

export const vectorCoupe: CatalogVehicle = {
  id: 'vector-coupe',
  name: 'Vector Coupe',
  description: 'a sleek two-door coupe',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: VECTOR_COUPE_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
