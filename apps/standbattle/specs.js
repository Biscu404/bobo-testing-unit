/* The lengths of every fighter's body, in one place the pose engine can read without drawing anything: how long a thigh, a shin, an upper arm and a forearm are, how wide the hips and
   the shoulders sit and how high the hips stand. The sprites (sprite_*.js) are built on these same numbers, so a foot the pose engine puts on the floor is on the floor in the picture. */
import { SPEC as JOTARO } from './sprite_jotaro.js';
import { SPEC as KILLER_QUEEN } from './sprite_boss.js';
import { THUG_SPEC, ANGELO_SPEC } from './sprite_enemy.js';
import { POLNAREFF_SPEC } from './sprite_polnareff.js';

export const SPECS = { jotaro: JOTARO, kira: KILLER_QUEEN, delinquent: THUG_SPEC, angelo: ANGELO_SPEC, polnareff: POLNAREFF_SPEC };
/* a fighter's spec, or Jotaro's for anything that is not drawn (the checks pose a fighter with no def) */
export const specOf = f => (f && f.def && SPECS[f.def.sprite]) || JOTARO;
