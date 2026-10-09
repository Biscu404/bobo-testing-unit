/* One fighter, one frame (spec 5, 7). The order inside a tick is the contract the frame data relies on:

     1. the state's own timer advances (an attack's frame counter, a stun counter, a dash...) and may hand the fighter back as FREE;
     2. a FREE fighter reads its input buffer: a move, a sidestep, a dash, or just walking/crouching/guarding;
     3. (fight_hit.js, after both fighters) hit windows are tested against the positions this tick left behind.

   So a move started on tick T is on its frame 1 on tick T, its frame m on T+m-1, and its fighter is free on T+total. A stun set on tick T by a
   contact lasts N+1 ticks, so the defender is free on T+N+1. Both numbers are what moves.js stunFor assumes. */

import { RULES, LANE_Z, WORLD } from './rules.js';
import { pendingPress, consume } from './input_frames.js';
import { pickMove, startMove, free } from './fight_cmd.js';
import { stepReaction, REACTION_STATES } from './fight_air.js';
import { endCombo } from './fight_combo.js';
import { tryThrowBreak, stepThrown } from './fight_throw.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function endMove(fight, f) {
  if (!f.connected) { f.stats.whiffs++; fight.bus.fire('onWhiff', { slot: f.slot, move: f.move }); }
  free(f);
}

/* the follow-up of a string, and a throw that arrives a frame or two after the button that started a jab */
function attackTick(fight, f, o) {
  const m = f.move, pp = pendingPress(f.inp);
  if (!pp) return;
  if (f.mf <= RULES.SIMUL + 1 && !m.special && m.h !== 't' && m.stance === 'stand') {
    const both = m.cmd.buttons | pp.buttons;
    if (both !== m.cmd.buttons) {
      const th = pickMove(f, { buttons: both, idx: pp.idx }, 'idle');
      if (th && th.h === 't') { consume(f.inp); startMove(fight, f, o, th); return; }
    }
  }
  const kids = f.ml.chains[m.id];
  if (!kids || f.mf < m.last.f + m.last.n) return;
  for (let k = 0; k < kids.length; k++) {
    if (kids[k].cmd.buttons === pp.buttons) { consume(f.inp); startMove(fight, f, o, kids[k]); return; }
  }
}

function startSidestep(f, tap) {
  const target = tap === 'up' ? 1 : 0;
  if (target === f.lane) return false;
  f.state = 'sidestep'; f.t = 1; f.ssTarget = target; f.walk = 0; f.guard = false; f.crouch = false;
  return true;
}

function startDash(f, dir) { f.state = dir > 0 ? 'dash' : 'backdash'; f.dashDir = dir; f.dashT = 1; f.t = 0; f.walk = 0; f.guard = false; f.crouch = false; }

function dashMove(f) {
  const back = f.state === 'backdash';
  const n = back ? RULES.BACKDASH_FRAMES : RULES.DASH_FRAMES, dist = back ? RULES.BACKDASH_DIST : RULES.DASH_DIST;
  const w = n - f.dashT + 1, sum = n * (n + 1) / 2;
  f.x += f.facing * (back ? -1 : 1) * dist * w / sum;
}

function neutral(fight, f, o) {
  const st = f.inp, last = st.hist[st.hist.length - 1];
  f.facing = o.x >= f.x ? 1 : -1;
  f.crouch = st.crouch;
  f.guard = !!(last && last.back);
  f.walk = 0;
  const pp = pendingPress(st);
  if (pp) {
    const m = pickMove(f, pp, 'idle');
    if (m) { consume(st); startMove(fight, f, o, m); return; }
  }
  if (st.tap && startSidestep(f, st.tap)) { fight.bus.fire('onSidestep', { slot: f.slot, lane: f.ssTarget }); return; }
  if (st.dash && !f.crouch) { startDash(f, st.dash); return; }
  if (f.crouch) return;
  const sp = f.def.walk || { f: 1, b: 1 };
  if (last && last.fwd) { f.x += f.facing * RULES.WALK_F * sp.f; f.walk = 1; }
  else if (last && last.back) { f.x -= f.facing * RULES.WALK_B * sp.b; f.walk = -1; }
}

function dashTick(fight, f, o) {
  f.facing = o.x >= f.x ? 1 : -1;
  dashMove(f);
  if (f.state === 'dash' && f.dashT >= 3) {
    const pp = pendingPress(f.inp);
    if (pp) { const m = pickMove(f, pp, 'dash'); if (m) { consume(f.inp); startMove(fight, f, o, m); return; } }
  }
}

function advance(fight, f, o) {
  switch (f.state) {
    case 'attack':
      f.mf++;
      if (f.mf > f.move.total) endMove(fight, f); else attackTick(fight, f, o);
      break;
    case 'dash': case 'backdash':
      f.dashT++;
      if (f.dashT > (f.state === 'dash' ? RULES.DASH_FRAMES : RULES.BACKDASH_FRAMES)) free(f); else dashTick(fight, f, o);
      break;
    case 'sidestep':
      if (f.t === RULES.SIDESTEP_FLIP) f.lane = f.ssTarget;
      if (f.t > RULES.SIDESTEP_FRAMES) free(f);
      break;
    case 'blockstun': case 'hitstun':
      f.facing = o.x >= f.x ? 1 : -1;
      f.crouch = f.inp.crouch;
      f.guard = f.state === 'blockstun';
      f.stun--;
      if (f.stun <= 0) free(f);
      break;
    case 'thrown':
      stepThrown(fight, f);
      break;
    default:
      if (REACTION_STATES[f.state]) stepReaction(fight, f, o);
  }
}

/* a combo is over the moment the other fighter is on the floor or on their feet again: a hit on a fighter who is lying or rising is a new one */
const FREEISH = { idle: 1, attack: 1, dash: 1, backdash: 1, sidestep: 1, down: 1, wake: 1, roll: 1, ko: 1 };

export function stepFighter(fight, f, o) {
  f.t++;
  if (f.hurtFlash > 0) f.hurtFlash = Math.max(0, f.hurtFlash - 1 / 9);
  advance(fight, f, o);
  if (f.comboIn.active && FREEISH[f.state]) endCombo(fight, f);
  if (f.state === 'idle') neutral(fight, f, o);
  tryThrowBreak(fight, f, o);
  const stepZ = Math.abs(LANE_Z[1] - LANE_Z[0]) / RULES.LANE_EASE, tz = LANE_Z[f.lane];
  f.z += clamp(tz - f.z, -stepZ, stepZ);
  if (f.slide) {
    const s = clamp(f.slide, -3.5, 3.5);
    f.x += s; f.slide -= s;
    if (Math.abs(f.slide) < 0.05) f.slide = 0;
  }
}

/* grounded fighters stay on the stage: walls hold them; on a ring stage they are held too, only a reaction can carry them over (fight_air.js) */
export function holdInside(fight, f, o) {
  if (!isGrounded(f)) return;
  if (f.x < WORLD.MIN) { f.x = WORLD.MIN; if (f.slide < 0) f.slide = 0; }
  if (f.x > WORLD.MAX) { f.x = WORLD.MAX; if (f.slide > 0) f.slide = 0; }
  /* neither can walk off the screen the camera can show */
  if (o && isGrounded(o)) { const lim = RULES.MAX_GAP; if (f.x - o.x > lim) f.x = o.x + lim; else if (o.x - f.x > lim) f.x = o.x - lim; }
}
function isGrounded(f) { return f.state !== 'air' && f.state !== 'bounce' && f.state !== 'thrown' && f.state !== 'down' && f.state !== 'wake'; }
