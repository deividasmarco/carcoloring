import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { COMET_SUPERBIKE_TRACE } from './trace';

export const cometSuperbike: CatalogVehicle = {
  id: 'comet-superbike',
  name: 'Comet Superbike',
  description: 'a full-fairing racing motorbike',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: COMET_SUPERBIKE_TRACE,
  kind: 'superbike',
  thumbnail: require('./thumbnail.png'),
};
