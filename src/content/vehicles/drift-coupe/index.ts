import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { DRIFT_COUPE_TRACE } from './trace';

export const driftCoupe: CatalogVehicle = {
  id: 'drift-coupe',
  name: 'Drift Coupe',
  description: 'a compact sports coupe',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: DRIFT_COUPE_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
