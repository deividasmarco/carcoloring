import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { THUNDER_V8_TRACE } from './trace';

export const thunderV8: CatalogVehicle = {
  id: 'thunder-v8',
  name: 'Thunder V8',
  description: 'a fastback muscle car',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: THUNDER_V8_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
