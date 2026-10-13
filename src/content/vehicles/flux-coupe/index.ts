import type { CatalogVehicle } from '../catalog';
import type { GeneratedVehicle } from '../types';
import generated from './regions.generated.json';
import { FLUX_COUPE_TRACE } from './trace';

export const fluxCoupe: CatalogVehicle = {
  id: 'flux-coupe',
  name: 'Flux Coupe',
  description: 'a two-door sports coupe with a tall grille',
  accent: '#22E4FF',
  generated: generated as GeneratedVehicle,
  trace: FLUX_COUPE_TRACE,
  kind: 'car',
  thumbnail: require('./thumbnail.png'),
};
