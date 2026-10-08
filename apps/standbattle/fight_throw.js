/* Throws (spec 8). A throw that connects puts the defender in 'thrown' for BREAK frames. A press of the throw's break button inside that window
   (a press up to a frame before the grab counts: a jab that was already on its way breaks it) separates both fighters with no damage and the
   same stun on each, so the advantage is 0. Otherwise the throw lands: full damage, no scaling, and the defender goes down. */

import { RULES, BIT } from './rules.js';
import { applyDamage } from './fighter.js';
import { registerHit, beginIfFree } from './fight_combo.js';
import { launch } from './fight_air.js';

const BREAK_STUN = 12;

export function startThrow(fight, a, d, m) {
  beginIfFree(d);
  d.state = 'thrown'; d.stun = RULES.BREAK + 1; d.thrower = a.slot; d.throwMove = m; d.throwTick = d.inp.tick;
  d.move = null; d.mf = 0; d.guard = false; d.crouch = false; d.t = 0;
  fight.hitstop = Math.max(fight.hitstop, 4);
  a.stats.throws++;
  fight.bus.fire('onThrow', { slot: a.slot, move: m });
}

export function tryThrowBreak(fight, f) {
  if (f.state !== 'thrown') return;
  const m = f.throwMove, mask = m.throw.brk === 'ANY' ? BIT.LP | BIT.RP : BIT[m.throw.brk];
  const h = f.inp.hist;
  for (let k = h.length - 1; k >= 0 && h[k].i >= f.throwTick - 1; k--) {
    if (h[k].press & mask) { breakThrow(fight, fight.fighters[f.thrower], f); return; }
  }
}

function breakThrow(fight, a, d) {
  [a, d].forEach(f => { f.state = 'hitstun'; f.stun = BREAK_STUN + 1; f.stunKind = 'break'; f.move = null; f.mf = 0; });
  a.slide -= a.facing * 8; d.slide += a.facing * 8;
  d.stats.breaks++;
  fight.hitstop = Math.max(fight.hitstop, 6);
  fight.bus.fire('onThrowBreak', { slot: d.slot, move: d.throwMove });
}

export function landThrow(fight, a, d) {
  const m = d.throwMove, dmg = m.dmg;
  const ko = applyDamage(d, dmg);
  registerHit(fight, a, d, dmg, false);
  launch(fight, d, a, { vy: 4, vx: a.facing * 1.6, low: true, ko });
  fight.hitstop = Math.max(fight.hitstop, ko ? RULES.KO_HITSTOP : 8);
  fight.bus.fire('onHit', { slot: a.slot, target: d.slot, move: m, dmg, kind: 'throw', counter: false, combo: d.comboIn.hits, height: 'throw', ko, reaction: 'down' });
}

/* the grab's countdown: when the window closes unbroken the throw lands */
export function stepThrown(fight, f) {
  f.stun--;
  if (f.stun <= 0) landThrow(fight, fight.fighters[f.thrower], f);
}
