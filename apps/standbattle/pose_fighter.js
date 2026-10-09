/* Turns a fighter's state into a pose (spec 14). The rig, the springs for hair and cloth and the hurt are anim.js's; the stance, the walk, the crouch, the guard and the run
   (feet put on the floor by IK) are stance.js's; the ANIMATION OF A MOVE is strike_pose.js's, computed from the move's own frame data and nothing else:

     frames 1 .. startup-1-snap   the wind-up: neutral stance eases to the style's WIND key  (a longer startup is a longer, plainer telegraph)
     the `snap` frames before it  the wind key whips to the STRIKE key, arriving on the first active frame
     the active frames            the strike is held (a string of hits alternates limbs on the frames the hits are on)
     the recovery frames          the strike eases back to the stance over exactly `recovery` frames

   anim_styles.js says where the joints are at each key; strike_pose.js says when and along which path; this file says what the body is doing when it is not attacking. */

import { animState, basePose, tick, ease, applyHurt, applyDeath } from './anim.js';
import { applyIdle, applyWalk, applyCrouch, applyGuard, applyRun, applyBackhop, applySidestep, holdGuard, standOn } from './stance.js';
import { composeMove, phaseOf } from './strike_pose.js';
import { specOf } from './specs.js';
import { STYLES } from './anim_styles.js';

export { phaseOf };
const clamp01 = v => Math.max(0, Math.min(1, v));

/* the face and the Stand of a move: what the telegraph, the strike and the recovery look like on the head, and what the Stand is doing behind a Stand user */
function expression(pose, f) {
  const m = f.move, st = STYLES[m.anim], { ph, idx } = pose._cm; delete pose._cm;
  pose.action = m.id;
  pose.t = ph.k;
  if (ph.stage === 'wind' || ph.stage === 'snap') { pose.brow = 'angry'; pose.eyes = 'narrow'; pose.mouth = 'grit'; pose.telegraph = ph.stage === 'wind' ? ph.k : 1; }
  else if (ph.stage === 'active') { pose.brow = 'angry'; pose.eyes = 'wide'; pose.mouth = 'shout'; pose.smear = 0.7; pose.dust = f.mf === m.startup ? 1 : 0; }
  else { pose.eyes = 'narrow'; pose.mouth = 'grit'; }
  if (m.stand) {
    pose.aura = 1;
    pose.standOut = ph.stage === 'wind' ? Math.min(1, ph.k * 1.4) : ph.stage === 'recover' ? 1 - ph.k * 0.85 : 1;
    if (st.alt && (ph.stage === 'active')) pose.standPunch = 1 + idx + clamp01((f.mf - m.hits[Math.min(idx, m.hits.length - 1)].f) / 4);
    else if (ph.stage === 'active' || ph.stage === 'snap') pose.standPunch = ease.outQuint(clamp01((f.mf - (m.startup - 3) + 1) / 4));
    else if (ph.stage === 'recover') pose.standPunch = 1 - ph.k;
  }
}

function victory(pose, s) {
  const b = Math.sin(s.t * 2.2), k = Math.min(1, s.actionT * 1.6);
  pose.chestRot = -0.12 - b * 0.03; pose.headRot = -0.16 + b * 0.03;
  pose.armFront = { sh: -0.30 - 0.85 * k, el: 1.75 - 0.2 * k }; pose.armRear = { sh: 0.34, el: 0.5 + b * 0.06 };
  pose.handFront = 'grip';
  standOn(pose, s.spec, [3, -3]);
  pose.coatFlow = 0.35 + b * 0.12; pose.hairFlow = 0.16 + b * 0.06;
  pose.eyes = 'narrow'; pose.mouth = 'smirk';
}

export function fighterPose(f, tsec, dtMs) {
  const s = animState(f), pose = basePose();
  s.spec = specOf(f);
  let energy = 0.3, name = f.state;
  switch (f.state) {
    case 'intro': applyIdle(pose, s, 0.6); pose.brow = 'angry'; pose.mouth = 'grit'; name = 'intro'; break;
    case 'win': applyIdle(pose, s, 0.2); victory(pose, s); if (f.def.stand) { pose.standOut = Math.max(0, 1 - s.actionT * 0.7); } break;
    case 'ko': applyDeath(pose, 1); break;
    case 'down': applyDeath(pose, 1); pose.eyes = 'shut'; pose.mouth = 'open'; break;
    case 'wake': { applyIdle(pose, s, 0.4); const k = 1 - clamp01(f.stun / (f.stunMax || 20)); const e = ease.inOut(k); pose.bodyRot = -1.42 * (1 - e); pose.hipY += 8 * (1 - e); pose.chestRot += 0.4 * (1 - e); break; }
    case 'roll': { applyCrouch(pose, s); const k = 1 - clamp01(f.stun / 20); pose.bodyRot = (f.rolled === -1 ? 1 : -1) * Math.PI * 2 * ease.inOut(k); pose.ghosts = 0.6; break; }
    case 'air': {
      applyDeath(pose, 0.2);
      const a = f.air || {};
      pose.bodyRot = a.slam ? -1.1 : Math.max(-1.6, Math.min(-0.2, -0.9 - f.vy * 0.07));
      pose.airborne = 1; pose.eyes = 'x'; pose.mouth = 'open';
      pose.legFront = { hip: 0.5 + Math.sin(s.t * 14) * 0.3, knee: -1.2 }; pose.legRear = { hip: -0.4 - Math.sin(s.t * 14) * 0.3, knee: -0.9 };
      pose.armFront = { sh: -1.5, el: 0.8 }; pose.armRear = { sh: 1.3, el: 0.6 };
      break; }
    case 'thrown': applyIdle(pose, s, 0.4); pose.bodyRot = -0.35; pose.armFront = { sh: -1.7, el: 0.5 }; pose.armRear = { sh: 1.4, el: 0.5 }; pose.eyes = 'shut'; pose.mouth = 'shout'; pose.brow = 'pain'; break;
    case 'blockstun': {
      applyIdle(pose, s, 0.3); if (f.crouch) applyCrouch(pose, s); applyGuard(pose, s, f.crouch);
      const k = 1 - clamp01(f.stun / (f.stunMax || 12)); pose.hipX = -1.5 * (1 - k); pose.squashX = 1 + 0.04 * (1 - k); pose.dust = k < 0.3 ? 1 : 0; pose.glow = 0.5 * (1 - k); break; }
    case 'hitstun': {
      const t = 1 - clamp01(f.stun / (f.stunMax || 20));
      if (!s.hurtOn) s.hitSeed = Math.random() * 10;
      applyHurt(pose, t, s.hitSeed || 0, f.stunKind === 'counter' ? 1.3 : f.stunKind === 'splat' ? 1.1 : 1, s.spec);
      if (f.stunKind === 'splat') { pose.armFront = { sh: -2.0, el: 0.3 }; pose.armRear = { sh: 2.0, el: 0.3 }; pose.squashX = 0.92; pose.hipX = 0; standOn(pose, s.spec, [6, -6]); }
      if (f.hitCrouch) { pose.hipY += 9; standOn(pose, s.spec, [0, 0]); }
      pose.flash = Math.max(f.hurtFlash || 0, 0.4 * (1 - t)); break; }
    case 'dash': applyRun(pose, s, (s.t * 5) % 1); pose.ghosts = 0.5; pose.dust = f.dashT < 6 ? 1 : 0; break;
    case 'backdash': applyBackhop(pose, s, clamp01((f.dashT || 1) / 16)); pose.ghosts = -0.5; pose.dust = f.dashT < 6 ? 1 : 0; break;
    case 'sidestep': applySidestep(pose, s, f.ssTarget === 1 ? 1 : -1, Math.sin(clamp01(f.t / 13) * Math.PI)); break;
    case 'attack': applyIdle(pose, s, 0.3); pose._cm = composeMove(pose, f, s); expression(pose, f); break;
    default: {
      if (f.walk) { s.prevGait = (((s.prevGait + dtMs / 1000 * 2.6 * f.walk) % 1) + 1) % 1; applyWalk(pose, s, s.prevGait, f.walk < 0); }
      else applyIdle(pose, s, f.hp / f.maxHp < 0.3 ? 1 : 0.3);
      if (f.crouch) applyCrouch(pose, s);
      if (f.guard) applyGuard(pose, s, f.crouch);
      if (!f.guard && !f.crouch) { pose.eyes = 'narrow'; pose.brow = f.hp / f.maxHp < 0.3 ? 'pain' : 'normal'; }
    }
  }
  s.hurtOn = f.state === 'hitstun';
  if (f.state !== 'hitstun') pose.flash = Math.max(pose.flash || 0, (f.hurtFlash || 0) * 0.5);
  if (f.statuses && f.statuses.length) pose.glow = Math.max(pose.glow || 0, 0.4);
  pose.action = pose.action === 'idle' ? name : pose.action;
  tick(f, s, dtMs, pose, energy);
  return pose;
}

/* a pose for a move at frame `mf` without a fighter, for the checks and the move-list screen */
export function poseForMove(m, mf) {
  const f = { state: 'attack', move: m, mf, x: 0, facing: 1, hp: 100, maxHp: 120, def: {}, statuses: [] };
  return fighterPose(f, 0, 0);
}
