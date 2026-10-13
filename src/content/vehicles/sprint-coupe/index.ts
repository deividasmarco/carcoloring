import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { SPRINT_COUPE_TRACE } from './trace';

export const sprintCoupe: CatalogVehicle = {
  id: 'sprint-coupe',
  name: 'Sprint Coupe',
  description: 'a nimble mid-engine coupe',
  accent: '#FF3D9A',
  generated: generated as GeneratedVehicle,
  trace: SPRINT_COUPE_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
