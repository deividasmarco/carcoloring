import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { PULSE_HATCH_TRACE } from './trace';

export const pulseHatch: CatalogVehicle = {
  id: 'pulse-hatch',
  name: 'Pulse Hatch',
  description: 'a hot hatchback',
  accent: '#FFB23E',
  generated: generated as GeneratedVehicle,
  trace: PULSE_HATCH_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
