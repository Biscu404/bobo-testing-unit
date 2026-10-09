/* Turns a fighter's state into a pose (spec 14). Replaces pose_player.js / pose_enemy.js. The rig, the springs for hair and cloth, the idle, the walk and the hurt
   are anim.js's; what this file adds is the ANIMATION OF A MOVE, which is computed from the move's own frame data and nothing else:

     frames 1 .. startup-1-snap   the wind-up: neutral stance eases to the style's WIND key  (a longer startup is a longer, plainer telegraph)
     the `snap` frames before it  the wind key whips to the STRIKE key, arriving on the first active frame
     the active frames            the strike is held (a string of hits alternates limbs on the frames the hits are on)
     the recovery frames          the strike eases back to the stance over exactly `recovery` frames

   anim_styles.js says where the joints are at each key; this file says when. */

import { animState, basePose, tick, ease, applyIdle, applyWalk, applyHurt, applyDeath } from './anim.js';
import { STYLES } from './anim_styles.js';

const PAIR = { armFront: ['sh', 'el'], armRear: ['sh', 'el'], legFront: ['hip', 'knee'], legRear: ['hip', 'knee'] };
const OTHER = { armFront: 'armRear', armRear: 'armFront', legFront: 'legRear', legRear: 'legFront' };
const SNAP = 3;
const lerp = (a, b, t) => a + (b - a) * t;
const mixv = (a, b, t) => (Array.isArray(a) ? [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] : lerp(a, b, t));
const clamp01 = v => Math.max(0, Math.min(1, v));

function resolveKey(key, limb) {
  if (!key) return null;
  const out = {};
  for (const k in key) out[k === 's' ? limb : k === 'o' ? OTHER[limb] : k] = key[k];
  return out;
}
const read = (pose, k) => (PAIR[k] ? [pose[k][PAIR[k][0]], pose[k][PAIR[k][1]]] : pose[k]);
const write = (pose, k, v) => { if (PAIR[k]) pose[k] = { [PAIR[k][0]]: v[0], [PAIR[k][1]]: v[1] }; else pose[k] = v; };

/* where in its own animation a move is on frame `mf`: { stage, a, b, k } with a, b in 'neutral' 'wind' 'strike' 'toss' */
export function phaseOf(m, mf) {
  const S = m.startup, snap = Math.min(SNAP, S - 1), windEnd = Math.max(1, S - 1 - snap), lastActive = m.last.f + m.last.n - 1;
  if (mf < S) {
    if (mf <= windEnd) return { stage: 'wind', a: 'neutral', b: 'wind', k: ease.outCubic(mf / windEnd) };
    return { stage: 'snap', a: 'wind', b: 'strike', k: ease.outQuint((mf - windEnd) / (S - windEnd)) };
  }
  if (mf <= lastActive) return { stage: 'active', a: 'strike', b: 'strike', k: 1 };
  const r = clamp01((mf - lastActive) / m.recovery);
  if (m.h === 't' && STYLES[m.anim].toss) return r < 0.4 ? { stage: 'toss', a: 'strike', b: 'toss', k: ease.outCubic(r / 0.4) } : { stage: 'recover', a: 'toss', b: 'neutral', k: ease.outCubic((r - 0.4) / 0.6) };
  return { stage: 'recover', a: 'strike', b: 'neutral', k: ease.outCubic(r) };
}

function composeMove(pose, f) {
  const m = f.move, st = STYLES[m.anim], ph = phaseOf(m, f.mf);
  let limb = m.limb;
  let idx = 0;
  if (st.alt && (ph.stage === 'active' || ph.stage === 'snap')) {
    idx = Math.max(0, m.hits.filter(h => h.f <= f.mf).length - 1);
    if (idx % 2 === 1) limb = OTHER[limb];
  }
  const wind = resolveKey(st.wind, limb), strike = resolveKey(st.strike, limb), toss = resolveKey(st.toss, limb);
  if (st.alt) { const o = OTHER[limb]; strike[o] = wind[o]; }
  const keys = {};
  [wind, strike, toss].forEach(K => K && Object.keys(K).forEach(k => { keys[k] = 1; }));
  const base = {};
  Object.keys(keys).forEach(k => { base[k] = read(pose, k); });
  const at = (name, k) => (name === 'neutral' ? base[k] : ((name === 'wind' ? wind : name === 'strike' ? strike : toss)[k] !== undefined ? (name === 'wind' ? wind : name === 'strike' ? strike : toss)[k] : base[k]));
  Object.keys(keys).forEach(k => write(pose, k, mixv(at(ph.a, k), at(ph.b, k), ph.k)));
  pose.action = m.id;
  pose.t = ph.k;
  if (ph.stage === 'wind' || ph.stage === 'snap') { pose.brow = 'angry'; pose.eyes = 'narrow'; pose.mouth = 'grit'; pose.telegraph = ph.stage === 'wind' ? ph.k : 1; }
  else if (ph.stage === 'active') { pose.brow = 'angry'; pose.eyes = 'wide'; pose.mouth = 'shout'; pose.smear = 0.7; pose.dust = f.mf === m.startup ? 1 : 0; }
  else { pose.eyes = 'narrow'; pose.mouth = 'grit'; }
  if (m.stand) {
    pose.aura = 1;
    pose.standOut = ph.stage === 'wind' ? Math.min(1, ph.k * 1.4) : ph.stage === 'recover' ? 1 - ph.k * 0.85 : 1;
    if (st.alt && (ph.stage === 'active')) pose.standPunch = 1 + idx + clamp01((f.mf - m.hits[Math.min(idx, m.hits.length - 1)].f) / 4);
    else if (ph.stage === 'active' || ph.stage === 'snap') pose.standPunch = ease.outQuint(clamp01((f.mf - (m.startup - SNAP) + 1) / 4));
    else if (ph.stage === 'recover') pose.standPunch = 1 - ph.k;
  }
  if (m.stance === 'down') { pose.hipY += 8; pose.chestRot += 0.5; }
}

function crouchPose(pose) {
  pose.hipY = 13; pose.chestRot = 0.25; pose.headRot = 0.05;
  pose.legFront = { hip: 1.0, knee: -1.9 }; pose.legRear = { hip: -0.45, knee: -1.7 };
  pose.armFront = { sh: -0.4, el: 1.3 }; pose.armRear = { sh: 0.4, el: 1.6 };
}
function guardPose(pose) {
  pose.armFront = { sh: -1.28, el: 1.62 }; pose.armRear = { sh: 0.5, el: 1.5 };
  pose.handFront = 'guard'; pose.handRear = 'guard'; pose.chestRot -= 0.1; pose.brow = 'angry'; pose.eyes = 'narrow'; pose.mouth = 'grit';
}
function victory(pose, s) {
  const b = Math.sin(s.t * 2.2), k = Math.min(1, s.actionT * 1.6);
  pose.chestRot = -0.12 - b * 0.03; pose.headRot = -0.16 + b * 0.03;
  pose.armFront = { sh: -0.30 - 0.85 * k, el: 1.75 - 0.2 * k }; pose.armRear = { sh: 0.34, el: 0.5 + b * 0.06 };
  pose.handFront = 'grip'; pose.legFront.hip = 0.26; pose.legRear.hip = -0.28; pose.legRear.knee = -0.3;
  pose.coatFlow = 0.35 + b * 0.12; pose.hairFlow = 0.16 + b * 0.06;
  pose.eyes = 'narrow'; pose.mouth = 'smirk';
}

export function fighterPose(f, tsec, dtMs) {
  const s = animState(f), pose = basePose();
  let energy = 0.3, name = f.state;
  switch (f.state) {
    case 'intro': applyIdle(pose, s, 0.6); pose.brow = 'angry'; pose.mouth = 'grit'; name = 'intro'; break;
    case 'win': applyIdle(pose, s, 0.2); victory(pose, s); if (f.def.stand) { pose.standOut = Math.max(0, 1 - s.actionT * 0.7); } break;
    case 'ko': applyDeath(pose, 1); break;
    case 'down': applyDeath(pose, 1); pose.eyes = 'shut'; pose.mouth = 'open'; break;
    case 'wake': { applyIdle(pose, s, 0.4); const k = 1 - clamp01(f.stun / (f.stunMax || 20)); const e = ease.inOut(k); pose.bodyRot = -1.42 * (1 - e); pose.hipY += 8 * (1 - e); pose.chestRot += 0.4 * (1 - e); break; }
    case 'roll': { applyIdle(pose, s, 0.4); crouchPose(pose); const k = 1 - clamp01(f.stun / 20); pose.bodyRot = (f.rolled === -1 ? 1 : -1) * Math.PI * 2 * ease.inOut(k); pose.ghosts = 0.6; break; }
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
      applyIdle(pose, s, 0.3); if (f.crouch) crouchPose(pose); guardPose(pose);
      const k = 1 - clamp01(f.stun / (f.stunMax || 12)); pose.hipX = -1.5 * (1 - k); pose.squashX = 1 + 0.04 * (1 - k); pose.dust = k < 0.3 ? 1 : 0; pose.glow = 0.5 * (1 - k); break; }
    case 'hitstun': {
      const t = 1 - clamp01(f.stun / (f.stunMax || 20));
      if (!s.hurtOn) s.hitSeed = Math.random() * 10;
      applyHurt(pose, t, s.hitSeed || 0, f.stunKind === 'counter' ? 1.3 : f.stunKind === 'splat' ? 1.1 : 1);
      if (f.stunKind === 'splat') { pose.armFront = { sh: -2.0, el: 0.3 }; pose.armRear = { sh: 2.0, el: 0.3 }; pose.legFront.hip = 0.5; pose.legRear.hip = -0.5; pose.squashX = 0.92; pose.hipX = 0; }
      if (f.hitCrouch) pose.hipY += 9;
      pose.flash = Math.max(f.hurtFlash || 0, 0.4 * (1 - t)); break; }
    case 'dash': applyWalk(pose, s, (s.t * 5) % 1, 1.3); pose.chestRot = 0.45; pose.hipY += 1; pose.armFront = { sh: -0.7, el: 1.3 }; pose.armRear = { sh: 0.3, el: 1.6 }; pose.ghosts = 0.5; pose.dust = f.dashT < 6 ? 1 : 0; break;
    case 'backdash': applyIdle(pose, s, 0.4); pose.chestRot = -0.35; pose.legFront = { hip: 0.7, knee: -0.9 }; pose.legRear = { hip: -0.9, knee: -0.4 }; pose.ghosts = -0.5; pose.dust = f.dashT < 6 ? 1 : 0; break;
    case 'sidestep': {
      applyIdle(pose, s, 0.4); const dir = f.ssTarget === 1 ? 1 : -1, k = Math.sin(clamp01(f.t / 13) * Math.PI);
      pose.hipRot = 0.5 * dir * k; pose.chestRot = -0.2 * k; pose.legFront.hip += 0.3 * k; pose.legRear.hip -= 0.3 * k; pose.squashX = 1 - 0.08 * k; pose.ghosts = 0.4 * dir; break; }
    case 'attack': applyIdle(pose, s, 0.3); composeMove(pose, f); break;
    default: {
      if (f.walk) { s.prevGait = (((s.prevGait + dtMs / 1000 * 2.6 * f.walk) % 1) + 1) % 1; applyWalk(pose, s, s.prevGait, 1); pose.armFront = { sh: -0.46, el: 1.3 }; pose.armRear = { sh: 0.42, el: 1.62 }; }
      else applyIdle(pose, s, f.hp / f.maxHp < 0.3 ? 1 : 0.3);
      if (f.crouch) crouchPose(pose);
      if (f.guard) guardPose(pose);
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
