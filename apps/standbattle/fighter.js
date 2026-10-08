/* A fighter's runtime state (spec 2, 5). A fighter is plain data; fight_step.js moves it, fight_hit.js hurts it, pose_fighter.js draws it.

   state: 'intro' 'idle' 'dash' 'backdash' 'sidestep' 'attack' 'blockstun' 'hitstun' 'air' 'bounce' 'splat' 'down' 'wake' 'thrown' 'ko' 'win'
   A fighter is ACTIONABLE (can start a move, guard, walk) only in 'idle'. Walking, crouching and guarding are flags on 'idle', not states:
     walk   -1 back, 0, 1 forward (relative to facing)     crouch   holding down past the tap window     guard   holding back while free

   Timers are whole frames and are set so that a fighter becomes free on an exact tick (see moves.js stunFor and fight_step.js):
     attack      mf runs 1..move.total, the fighter is free on the tick mf would be total + 1
     *stun       stun is set to N + 1 on contact and counted down at the start of each following tick; free the tick it reaches 0 */

import { RULES, LANE_Z } from './rules.js';
import { createInput } from './input_frames.js';

export const NEUTRAL = 'idle';

export function createFighter(def, slot, x, lane, ml) {
  return {
    slot, id: def.id, def, ml, x, lane, z: LANE_Z[lane], facing: slot === 0 ? 1 : -1,
    hp: RULES.HP, maxHp: RULES.HP,
    state: 'idle', t: 0,
    walk: 0, crouch: false, guard: false,
    move: null, mf: 0, spent: [], aim: lane, connected: false, lastMove: null,
    stun: 0, stunKind: null, slide: 0, vx: 0, vy: 0, y: 0, air: null,
    ssTarget: lane, dashDir: 0, dashT: 0,
    comboIn: { hits: 0, dmg: 0, juggles: 0, bounced: false, active: false }, comboOut: { hits: 0, dmg: 0, last: 0, shown: 0 },
    statuses: [], hurtFlash: 0, counterHit: false, wakeChoice: null, rolled: 0,
    inp: createInput(), stats: { dealt: 0, taken: 0, throws: 0, breaks: 0, dodges: 0, blocks: 0, hits: 0, counters: 0, whiffs: 0, maxCombo: 0 }
  };
}

export function isFree(f) { return f.state === 'idle'; }
export function isAirborne(f) { return f.state === 'air' || f.state === 'bounce'; }
/* the status system and the HP choke point both go through here */
export function applyDamage(f, amount) {
  f.hp = Math.max(0, f.hp - amount);
  f.hurtFlash = 1;
  return f.hp <= 0;
}
