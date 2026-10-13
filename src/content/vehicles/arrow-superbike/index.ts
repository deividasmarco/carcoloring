import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { ARROW_SUPERBIKE_TRACE } from './trace';

export const arrowSuperbike: CatalogVehicle = {
  id: 'arrow-superbike',
  name: 'Arrow Superbike',
  description: 'a full-fairing sports motorbike',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: ARROW_SUPERBIKE_TRACE,
  kind: 'superbike',
  thumbnail: require('./thumbnail.png'),
};
