import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { RUMBLE_V8_TRACE } from './trace';

export const rumbleV8: CatalogVehicle = {
  id: 'rumble-v8',
  name: 'Rumble V8',
  description: 'a widebody muscle car',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: RUMBLE_V8_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
