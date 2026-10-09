/* Combo bookkeeping (spec 9). A combo belongs to the DEFENDER while it lasts (`f.comboIn`): every hit on a fighter who is still in a reaction adds to it,
   and it ends the moment that fighter is free again, or on a wall splat (which closes it and starts the next one scaled from SPLAT_SCALE).
   The attacker keeps the last one for the HUD (`f.comboOut`). Pure bookkeeping: the damage arithmetic lives in fight_hit.js and calls scaleFor from rules.js. */

import { RULES, scaleFor } from './rules.js';

const SHOW_FRAMES = 100;

export function beginIfFree(d) {
  const c = d.comboIn;
  if (d.state === 'idle' || d.state === 'attack' || d.state === 'dash' || d.state === 'backdash' || d.state === 'sidestep' || d.state === 'blockstun') {
    c.active = false; c.mult = 1;
  }
}

/* the multiplier the next hit of this combo gets */
export function nextScale(d) {
  const c = d.comboIn;
  if (!c.active) return c.mult ? c.mult : 1;
  return scaleFor(c.hits) * (c.mult || 1);
}

export function registerHit(fight, a, d, dmg, counter) {
  const c = d.comboIn;
  if (!c.active) { c.active = true; c.hits = 0; c.dmg = 0; c.juggles = 0; c.bounced = false; c.starter = a.move ? a.move.id : null; }
  c.hits++; c.dmg += dmg;
  a.comboOut = { hits: c.hits, dmg: c.dmg, shown: SHOW_FRAMES, counter: !!counter };
  a.stats.hits++; a.stats.dealt += dmg; d.stats.taken += dmg;
  if (counter) a.stats.counters++;
  if (c.hits > a.stats.maxCombo) a.stats.maxCombo = c.hits;
}

export function endCombo(fight, d, why) {
  const c = d.comboIn;
  if (!c.active) return;
  c.active = false;
  const a = fight.fighters[1 - d.slot];
  fight.bus.fire('onCombo', { slot: a.slot, hits: c.hits, dmg: c.dmg, why: why || 'free', starter: c.starter, juggles: c.juggles });
  if (why === 'splat') c.mult = RULES.SPLAT_SCALE; else c.mult = 1;
  c.hits = 0; c.dmg = 0; c.juggles = 0; c.bounced = false;
}

export function tickCombo(f) { if (f.comboOut.shown > 0) f.comboOut.shown--; }
