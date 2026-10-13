import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { ZIP_HATCH_TRACE } from './trace';

export const zipHatch: CatalogVehicle = {
  id: 'zip-hatch',
  name: 'Zip Hatch',
  description: 'a sporty five-door hatchback',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: ZIP_HATCH_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
