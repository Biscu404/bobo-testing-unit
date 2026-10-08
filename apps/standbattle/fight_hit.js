/* Contact (spec 5, 6, 7, 9): which hit windows touch which fighter this tick, whether it is a hit, a block, a juggle, a throw or nothing, and what
   happens next. Every active frame of every move is tested here and nowhere else. The order matters:

     1. EVALUATE every live window against the fighters as they stand (so a trade is a trade: both are tested before either is hurt);
     2. APPLY strikes first and throws after (a throw that is hit the same frame never lands).

   Reach is measured from the attacker's centre to the defender's centre, less the half-width of the defender's hurtbox.  A hit can touch only the
   lane it was aimed at, unless its row tracks.  Heights: a high attack goes over a crouching fighter; a guarding fighter stops high and mid
   standing, low crouching (spec 6).  The stun a hit puts on a fighter is moves.js stunFor. */

import { RULES, WORLD } from './rules.js';
import { stunFor } from './moves.js';
import { applyDamage } from './fighter.js';
import { registerHit, nextScale, beginIfFree } from './fight_combo.js';
import { launch, juggle, splat } from './fight_air.js';
import { startThrow } from './fight_throw.js';
import { applyStatus } from './status.js';

const THROWABLE = { idle: 1, attack: 1, dash: 1, backdash: 1, sidestep: 1 };
const HITTABLE = { idle: 1, attack: 1, dash: 1, backdash: 1, sidestep: 1, blockstun: 1, hitstun: 1, wake: 1, roll: 1 };

function tracks(m, lane) { return m.track === 'both' || (m.track === 'near' && lane === 0) || (m.track === 'far' && lane === 1); }

/* 'hit' | 'block' | 'juggle' | 'throw' | null (whiffs: ducked, or nothing there to hit) */
function classify(d, m) {
  const s = d.state;
  if (m.h === 't') return THROWABLE[s] ? 'throw' : null;
  if (s === 'air') return m.juggle && d.air && !d.air.low && d.comboIn.juggles < RULES.JUGGLE_MAX ? 'juggle' : null;
  if (s === 'down') return m.oki ? 'hit' : null;
  if (!HITTABLE[s]) return null;
  if (s === 'roll' && d.t < 8 && m.h === 'h') return null;
  const crouch = (s === 'idle' || s === 'blockstun') && d.crouch;
  if (m.h === 'h' && crouch) return null;
  const guarding = (s === 'idle' && d.guard) || s === 'blockstun';
  if (guarding) return m.h === 'h' || (m.h === 'm' && !crouch) || (m.h === 'l' && crouch) ? 'block' : 'hit';
  return 'hit';
}

export function evalContact(fight, a, d, m, i, origin) {
  const dx = (d.x - origin) * a.facing;
  if (dx < -RULES.HURT_HALF || dx - RULES.HURT_HALF > (m.proj ? m.proj.r : m.reach)) return null;
  if (d.lane !== a.aim && !tracks(m, d.lane)) {
    if (!a.laneMissed && d.state !== 'ko') { a.laneMissed = true; d.stats.dodges++; fight.bus.fire('onSidestepDodge', { slot: d.slot, move: m }); }
    return null;
  }
  const kind = classify(d, m);
  if (!kind) return null;
  const counter = kind === 'hit' && d.state === 'attack' && d.mf <= d.move.last.f + d.move.last.n - 1;
  return { a, d, m, i, kind, counter };
}

function push(a, d, amount) {
  const dir = a.facing, room = dir > 0 ? WORLD.MAX - d.x : d.x - WORLD.MIN;
  if (room >= amount) { d.slide += dir * amount; return; }
  d.slide += dir * Math.max(0, room);
  a.slide -= dir * (amount - Math.max(0, room)) * 0.7;
}

export function applyContact(fight, c) {
  const { a, d, m, i } = c;
  const lastHit = i === m.hits.length - 1;
  a.spent[i] = true; a.connected = true;
  if (c.kind === 'throw') { startThrow(fight, a, d, m); return; }
  if (c.kind === 'block') {
    d.stats.blocks++;
    d.state = 'blockstun'; d.stun = stunFor(m, i, 'block', false) + 1; d.stunKind = 'block'; d.guard = true; d.move = null; d.mf = 0;
    push(a, d, lastHit ? m.push[1] : 1.5);
    fight.hitstop = Math.max(fight.hitstop, m.stop);
    fight.bus.fire('onBlock', { slot: a.slot, target: d.slot, move: m, hitIndex: i, height: m.height });
    return;
  }
  beginIfFree(d);
  const counter = c.counter, away = a.facing;
  const dmg = Math.max(1, Math.round(m.hits[i].dmg * nextScale(d) * (counter ? RULES.COUNTER_DMG : 1)));
  const dead = applyDamage(d, dmg);
  registerHit(fight, a, d, dmg, counter);
  if (lastHit && m.status && !dead) applyStatus(d, m.status.id, m.status.stacks);
  let rx = lastHit ? m.reaction : 'stagger';
  if (lastHit && counter && m.ch === 'launch') rx = 'launch';
  let shown = rx;
  if (dead) { launch(fight, d, a, { vy: 8, vx: away * 2.2, ko: true }); shown = 'ko'; }
  else if (c.kind === 'juggle') { juggle(fight, d, m, away); shown = 'juggle'; }
  else if (d.state === 'down') shown = 'down';
  else if (rx === 'launch') launch(fight, d, a, { vy: m.lift, vx: away * 2 });
  else if (rx === 'down') launch(fight, d, a, { vy: 4, vx: away * 1.6, low: true });
  else if (rx === 'bounce') launch(fight, d, a, { vy: 2, vx: away * 1, bounce: true });
  else {
    d.state = 'hitstun'; d.stun = stunFor(m, i, 'hit', counter) + 1; d.stunKind = counter ? 'counter' : 'hit'; d.hitCrouch = d.crouch;
    d.move = null; d.mf = 0; d.guard = false; d.crouch = false;
    push(a, d, lastHit ? m.push[0] : 1.5);
    if (m.splat && lastHit && (away > 0 ? WORLD.MAX - d.x : d.x - WORLD.MIN) <= RULES.SPLAT_DIST && fight.stage.rule === 'walls') splat(fight, d);
  }
  fight.hitstop = Math.max(fight.hitstop, dead ? RULES.KO_HITSTOP : m.stop);
  fight.bus.fire('onHit', { slot: a.slot, target: d.slot, move: m, hitIndex: i, dmg, kind: c.kind, counter, combo: d.comboIn.hits, height: m.height, ko: dead, reaction: shown });
}

export function detectHits(fight) {
  const F = fight.fighters, found = [];
  for (let k = 0; k < 2; k++) {
    const a = F[k], d = F[1 - k];
    if (a.state !== 'attack') continue;
    const m = a.move;
    for (let i = 0; i < m.hits.length; i++) {
      const h = m.hits[i];
      if (a.spent[i] || a.mf < h.f || a.mf > h.f + h.n - 1 || m.proj) continue;
      const c = evalContact(fight, a, d, m, i, a.x);
      if (c) found.push(c);
    }
  }
  found.sort((p, q) => (p.m.h === 't') - (q.m.h === 't'));
  for (let k = 0; k < found.length; k++) {
    const c = found[k];
    if (c.m.h === 't' && !(c.a.state === 'attack' && c.a.move === c.m)) continue;
    applyContact(fight, c);
  }
}
