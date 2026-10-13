import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { BOULDER_4X4_TRACE } from './trace';

export const boulder4x4: CatalogVehicle = {
  id: 'boulder-4x4',
  name: 'Boulder 4x4',
  description: 'a boxy off-road SUV',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: BOULDER_4X4_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
