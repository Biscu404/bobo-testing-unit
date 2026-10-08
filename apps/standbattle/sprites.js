/* Which painter draws which fighter (spec 13, 14), and the Stand that stands behind the one fighter who has one drawn. */
import { drawJotaro } from './sprite_jotaro.js';
import { drawStar, standPose, barrageFists } from './sprite_star.js';
import { drawThug, drawAngelo } from './sprite_enemy.js';
import { drawKillerQueen } from './sprite_boss.js';
import { drawPolnareff } from './sprite_polnareff.js';

/* Killer Queen's art has three phases; the boss wears them as his HP falls, Kira himself wears the first */
const kqPhase = f => (f.def.boss ? (f.hp / f.maxHp > 0.66 ? 0 : f.hp / f.maxHp > 0.33 ? 1 : 2) : 0);

export const SPRITES = {
  jotaro: (g, pose) => drawJotaro(g, pose),
  delinquent: (g, pose) => drawThug(g, pose),
  angelo: (g, pose) => drawAngelo(g, pose),
  kira: (g, pose, f, tsec) => drawKillerQueen(g, pose, kqPhase(f), tsec),
  polnareff: (g, pose) => drawPolnareff(g, pose)
};
export const hasStar = f => f.def.sprite === 'jotaro';
export { drawStar, standPose, barrageFists };
