import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { EMBER_GT_TRACE } from './trace';

export const emberGt: CatalogVehicle = {
  id: 'ember-gt',
  name: 'Ember GT',
  description: 'a sleek mid-engine supercar',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: EMBER_GT_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
