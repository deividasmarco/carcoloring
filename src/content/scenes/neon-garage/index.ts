import type { SceneDefinition } from '../types';
import { drawGarageBackground, drawStaticReflections, drawUnderglow } from './background';
import { SCENE_LAYOUT } from './layout';

export const neonGarage: SceneDefinition = {
  id: 'neon-garage',
  frame: SCENE_LAYOUT.frame,
  drawBackground: drawGarageBackground,
  drawStaticLighting(canvas) {
    drawStaticReflections(canvas);
    drawUnderglow(canvas, 0.85);
  },
};
