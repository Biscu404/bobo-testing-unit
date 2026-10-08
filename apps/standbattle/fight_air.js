/* Everything that happens to a fighter who is not simply standing: launched, bounced, knocked down, rising, rolling, grabbed, pinned to a wall
   (spec 3, 9). `air` is a small record on the fighter: { juggles, slump, slam, bounce, low, ko }.

   y is height above the floor (up is positive), vy its speed. A launch goes up 9.5 and comes down under GRAVITY: about 35 frames of air.
   A fighter who is low (a trip, a throw) is knocked down, not launched, and cannot be juggled. A bounce is a launch that slams to the floor
   first and rebounds once. After SLUMP_AFTER juggle hits gravity doubles. On a wall stage a fighter who flies into the wall is PINNED
   (a long hitstun that closes the combo, fight_combo.js); on a ring stage one who flies past the edge is OUT. */

import { RULES, WORLD, BIT } from './rules.js';
import { pendingPress, consume } from './input_frames.js';
import { applyDamage } from './fighter.js';
import { pickMove, startMove, free } from './fight_cmd.js';
import { endCombo, registerHit, nextScale } from './fight_combo.js';

export const REACTION_STATES = { air: 1, down: 1, wake: 1, roll: 1, ko: 1 };

/* put a fighter in the air. opts: vy, vx (already signed), low, ko, bounce */
export function launch(fight, f, from, opts) {
  f.state = 'air'; f.t = 0; f.move = null; f.mf = 0; f.guard = false; f.crouch = false; f.stun = 0;
  f.vy = opts.vy; f.vx = opts.vx; if (f.y < 0) f.y = 0;
  f.air = { juggles: 0, slump: false, slam: !!opts.bounce, bounce: !!opts.bounce, low: !!opts.low, ko: !!opts.ko };
  fight.bus.fire('onLaunch', { slot: f.slot, kind: opts.bounce ? 'bounce' : opts.low ? 'trip' : 'launch', ko: !!opts.ko });
}

/* a hit on a fighter already in the air (a juggle): pop them again and count it */
export function juggle(fight, f, m, away) {
  const a = f.air;
  f.comboIn.juggles++; a.juggles++;
  f.vy = Math.max(f.vy, m.reaction === 'launch' ? m.lift * 0.8 : RULES.JUGGLE_VY);
  f.vx = away * 1.2;
  if (a.juggles >= RULES.SLUMP_AFTER) a.slump = true;
  if (m.reaction === 'down') { a.slam = true; f.vy = Math.min(f.vy, 2); }
}

function pinned(fight, f) {
  const a = fight.fighters[1 - f.slot];
  f.state = 'hitstun'; f.stun = RULES.SPLAT_FRAMES + 1; f.stunKind = 'splat'; f.y = 0; f.vy = 0; f.vx = 0; f.air = null; f.move = null;
  f.x = f.x < WORLD.MID ? WORLD.MIN : WORLD.MAX;
  const dmg = Math.max(1, Math.round(RULES.SPLAT_DMG * nextScale(f)));
  const dead = applyDamage(f, dmg);
  registerHit(fight, a, f, dmg, false);
  endCombo(fight, f, 'splat');
  fight.hitstop = Math.max(fight.hitstop, 10);
  fight.bus.fire('onWallSplat', { slot: f.slot, dmg });
  return dead;
}
export { pinned as splat };

function land(fight, f) {
  const a = f.air;
  f.y = 0;
  if (a.bounce) {
    a.bounce = false; a.slam = false; f.comboIn.bounced = true;
    f.vy = RULES.BOUNCE_VY; f.vx *= 0.4;
    fight.bus.fire('onBounce', { slot: f.slot });
    return;
  }
  f.vy = 0; f.vx = 0; f.slide = 0;
  if (a.ko) { f.state = 'ko'; f.air = null; fight.bus.fire('onKnockdown', { slot: f.slot, ko: true }); return; }
  f.state = 'down'; f.t = 0; f.air = null;
  fight.bus.fire('onKnockdown', { slot: f.slot, ko: false });
}

function airTick(fight, f) {
  const a = f.air, g = RULES.GRAVITY * (a.slam ? 2.6 : a.slump ? 2 : 1);
  f.vy -= g; f.y += f.vy; f.x += f.vx; f.vx *= 0.985;
  const rule = fight.stage.rule;
  if (f.x < WORLD.MIN || f.x > WORLD.MAX) {
    if (rule === 'walls') {
      if (!a.ko && Math.abs(f.vx) > 0.5) { pinned(fight, f); return; }
      f.x = f.x < WORLD.MID ? WORLD.MIN : WORLD.MAX; f.vx = 0;
    } else if (f.x < WORLD.MIN - RULES.RINGOUT_MARGIN || f.x > WORLD.MAX + RULES.RINGOUT_MARGIN) {
      fight.ringOut(f);
    }
  }
  if (f.y <= 0 && f.vy < 0) land(fight, f);
}

function startWake(fight, f, frames, kind) {
  f.state = kind; f.t = 0; f.stun = frames + 1; f.stunKind = kind;
  fight.bus.fire('onWake', { slot: f.slot, kind });
}

function downTick(fight, f, o) {
  if (f.t <= RULES.DOWN_FRAMES) return;
  const st = f.inp, b = st.bits;
  const fwdBit = f.facing > 0 ? BIT.RIGHT : BIT.LEFT, backBit = f.facing > 0 ? BIT.LEFT : BIT.RIGHT;
  const pp = pendingPress(st);
  if (pp) {
    const m = pickMove(f, pp, 'down');
    if (m) { consume(st); startMove(fight, f, o, m); fight.bus.fire('onWake', { slot: f.slot, kind: 'kick' }); return; }
  }
  if (b & BIT.UP && f.lane !== 1) { f.ssTarget = 1; startWake(fight, f, 20, 'roll'); return; }
  if (b & BIT.DOWN && f.lane !== 0) { f.ssTarget = 0; startWake(fight, f, 20, 'roll'); return; }
  if (b & backBit) { f.ssTarget = f.lane; startWake(fight, f, 20, 'roll'); f.rolled = -1; return; }
  if (b & fwdBit) { startWake(fight, f, 16, 'wake'); return; }
  if (f.t >= RULES.WAKE_SLOW) startWake(fight, f, RULES.RISE_FRAMES, 'wake');
}

export function stepReaction(fight, f, o) {
  switch (f.state) {
    case 'air': airTick(fight, f); break;
    case 'down': downTick(fight, f, o); break;
    case 'wake':
      f.stun--;
      if (f.stun <= 0) free(f);
      break;
    case 'roll':
      f.stun--;
      if (f.rolled === -1) f.slide = 0, f.x -= f.facing * RULES.ROLL_DIST / 20;
      if (f.t === 8) f.lane = f.ssTarget;
      if (f.stun <= 0) { f.rolled = 0; free(f); }
      break;
    default: break;
  }
}
