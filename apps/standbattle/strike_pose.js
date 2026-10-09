/* The animation of one move, placed on the move's own frames (phaseOf) and drawn from the key poses of its style (anim_styles.js).

   A key is still a handful of joint angles, which is how it is authored, but how the body gets from one key to the next is no longer a blend of angles:
     - a PUNCH is a fist going from where it was to where it lands in a straight line (the arm is solved to follow it, ik.js), so it leaves the guard and arrives, instead of
       swinging out on an arc and scooping under the target; the other fist stays at the chin through every twist and lean of the chest;
     - a KICK is the leg's own angles (a chamber and an extension are an arc about the hip: that is what a kick is), and the leg it stands on is planted by IK, so a
       kicker does not hover and does not sink through the floor;
     - both feet of a puncher are planted (a lunge steps them: the `feet` key), so the hips can drive forward over them. */

import { STYLES } from './anim_styles.js';
import { solveArm, solveLeg } from './ik.js';
import { GUARD, holdGuard, standOn, stanceFeet } from './stance.js';
import { ease } from './anim.js';

const SNAP = 3;
const PAIR = { armFront: ['sh', 'el'], armRear: ['sh', 'el'], legFront: ['hip', 'knee'], legRear: ['hip', 'knee'] };
const OTHER = { armFront: 'armRear', armRear: 'armFront', legFront: 'legRear', legRear: 'legFront' };
const lerp = (a, b, t) => a + (b - a) * t;
const mixv = (a, b, t) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], t)) : lerp(a, b, t));
const clamp01 = v => Math.max(0, Math.min(1, v));
const wrapPi = v => { while (v > Math.PI) v -= Math.PI * 2; while (v < -Math.PI) v += Math.PI * 2; return v; };

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

function resolveKey(key, limb) {
  if (!key) return null;
  const out = {};
  for (const k in key) out[k === 's' ? limb : k === 'o' ? OTHER[limb] : k] = key[k];
  return out;
}
const read = (pose, k) => (PAIR[k] ? [pose[k][PAIR[k][0]], pose[k][PAIR[k][1]]] : pose[k]);
const write = (pose, k, v) => { if (PAIR[k]) pose[k] = { [PAIR[k][0]]: v[0], [PAIR[k][1]]: v[1] }; else pose[k] = v; };

/* an arm key as a fist: where the fist is, relative to the shoulder, in lengths of a forty-pixel arm, and which side of the line shoulder -> fist the elbow is on
   (up: behind and high; down: tucked; null: the arm is straight and has no side). Worked out from the angles with the reference arm, so every style is still authored as angles. */
export function fistOf(sh, el, chestRot) {
  const sa = chestRot + sh, fa = sa + el, ex = Math.sin(sa) * 21, ey = Math.cos(sa) * 21, wx = ex + Math.sin(fa) * 19, wy = ey + Math.cos(fa) * 19;
  const phi = Math.atan2(wx, wy), d = wrapPi(sa - phi);
  return { x: wx / 40, y: wy / 40, up: Math.abs(d) < 0.07 ? null : phi >= 0 ? d > 0 : d < 0 };
}
const guardFist = limb => { const g = GUARD.stand[limb === 'armFront' ? 'lead' : 'rear']; return { x: g[0] / 40, y: g[1] / 40, up: false }; };

export function composeMove(pose, f, s) {
  const spec = s.spec, m = f.move, st = STYLES[m.anim], ph = phaseOf(m, f.mf), F = stanceFeet(spec);
  let limb = m.limb, idx = 0;
  /* a move on a kick button can have an arm's style (Killer Queen points a finger on LK) and the other way round: the style says what limb it is for */
  if ((st.kind === 'arm') !== (limb.indexOf('arm') === 0)) limb = (st.kind === 'arm' ? 'arm' : 'leg') + limb.slice(3);
  if (st.alt && (ph.stage === 'active' || ph.stage === 'snap')) {
    idx = Math.max(0, m.hits.filter(h => h.f <= f.mf).length - 1);
    if (idx % 2 === 1) limb = OTHER[limb];
  }
  const K = { wind: resolveKey(st.wind, limb), strike: resolveKey(st.strike, limb), toss: resolveKey(st.toss, limb) };
  if (st.alt) { const o = OTHER[limb]; K.strike[o] = K.wind[o]; }
  const punch = st.kind === 'arm' && !st.alt && !st.toss, kick = st.kind === 'leg';
  /* a punch is a fist; a kick keeps both fists up; both skip the style's own angles for the limbs they place themselves */
  const own = k => (punch && (k === limb || k === OTHER[limb] || k === 'legFront' || k === 'legRear')) || (kick && (k === OTHER[limb] || k === 'armFront' || k === 'armRear'));
  const keys = {};
  [K.wind, K.strike, K.toss].forEach(T => T && Object.keys(T).forEach(k => { if (!own(k)) keys[k] = 1; }));
  const base = {};
  Object.keys(keys).forEach(k => { base[k] = read(pose, k); });
  const T = name => (name === 'wind' ? K.wind : name === 'strike' ? K.strike : K.toss);
  const at = (name, k) => (name === 'neutral' || !T(name) || T(name)[k] === undefined ? base[k] : T(name)[k]);
  const neutralArm = punch ? read(pose, limb) : null;
  Object.keys(keys).forEach(k => write(pose, k, mixv(at(ph.a, k), at(ph.b, k), ph.k)));
  /* a move that starts from the floor (a rising kick) is low until it stands up again: the crouch eases off over the recovery, so the move ends in the stance */
  if (m.stance === 'down') { const low = ph.stage === 'recover' ? 1 - ph.k : 1; pose.hipY += 8 * low; pose.chestRot += 0.5 * low; }

  /* the punching fist, in a straight line when both ends of this stretch have the elbow on the same side, on the angles' own arc when they do not (a hook, an elbow) */
  if (punch) {
    const end = name => {
      if (name === 'neutral') return guardFist(limb);
      const key = T(name) && T(name)[limb];
      /* the arm angles of a key are the arm's own (1.55 is straight out), whatever the chest is doing in the same key: the fist is placed as if the chest were upright */
      return key ? fistOf(key[0], key[1], 0) : null;
    };
    const A = end(ph.a), B = end(ph.b), sameSide = A && B && (A.up === B.up || A.up === null || B.up === null);
    if (sameSide) {
      const up = A.up === null ? B.up : A.up, L = spec.upper + spec.fore;
      pose[limb] = solveArm(spec, pose.chestRot, lerp(A.x, B.x, ph.k) * L, lerp(A.y, B.y, ph.k) * L, !!up);
    } else {
      const aA = ph.a === 'neutral' ? neutralArm : T(ph.a)[limb] || neutralArm, aB = ph.b === 'neutral' ? neutralArm : T(ph.b)[limb] || neutralArm;
      pose[limb] = { sh: lerp(aA[0], aB[0], ph.k), el: lerp(aA[1], aB[1], ph.k) };
    }
    /* the rear hand never leaves the chin: it follows the shoulder it hangs from, whatever the chest does */
    const o = OTHER[limb], g = GUARD.stand[o === 'armFront' ? 'lead' : 'rear'], k = (spec.upper + spec.fore) / 40;
    pose[o] = solveArm(spec, pose.chestRot, g[0] * k, g[1] * k, false);
    standOn(pose, spec, pose.feet);
    if (limb === 'armRear' && ph.stage !== 'wind') pose.rearOver = 1;
  } else if (kick) {
    holdGuard(pose, spec, 'stand');
    const sup = limb === 'legFront' ? -1 : 1;                         /* the leg it stands on */
    pose[sup > 0 ? 'legFront' : 'legRear'] = solveLeg(spec, pose, sup, sup > 0 ? F.f : F.r, 0);
  } else {
    /* a barrage, a throw: both arms are the move's, the feet are planted */
    standOn(pose, spec, pose.feet);
    pose.rearOver = ph.stage === 'wind' ? 0 : 1;
  }
  return { ph, limb, idx, st };
}
