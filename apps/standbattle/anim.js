/* Pose engine.

   Sprites are never drawn from a frame table; every character is a
   forward-kinematic rig and this file decides where its joints are this
   millisecond. Angle convention (character always authored facing +x):
   0 rad points straight DOWN, positive swings FORWARD, so a limb's
   direction is (sin a, cos a) and a horizontal punch is +PI/2.

   Liveliness comes from three things layered on top of the raw combat
   state: anticipation/overshoot easing inside every action, spring-lagged
   secondary motion for hair and coat driven by the body's own velocity,
   and always-on idle life (breathing, blinking, weight shifts) so nothing
   ever sits perfectly still. */

import { standOn } from './stance.js';

const state = new WeakMap();

export function animState(f) {
  let s = state.get(f);
  if (!s) {
    s = {
      t: 0, prevX: f.x, vx: 0, vsm: 0,
      hair: { x: 0, v: 0 }, coat: { x: 0, v: 0 }, head: { x: 0, v: 0 },
      breathT: Math.random() * 6, blinkIn: 1 + Math.random() * 3, blink: 0,
      shiftT: Math.random() * 8, action: '', actionT: 0, prevAction: '',
      hitSeed: 0, hitCount: 0, land: 0, stepFlash: 0, prevGait: 0, stepped: 0
    };
    state.set(f, s);
  }
  return s;
}

function spring(s, target, k, damp, dt) {
  s.v += (target - s.x) * k * dt;
  s.v *= Math.exp(-damp * dt);
  s.x += s.v * dt;
  return s.x;
}

export const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inQuad: t => t * t,
  inQuart: t => t * t * t * t,
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  /* overshoots past 1 then settles -- follow-through */
  back: t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
  /* snappy pop used for impacts */
  pop: t => Math.sin(Math.min(1, t) * Math.PI)
};

export function basePose() {
  return {
    action: 'idle', t: 0,
    hipX: 0, hipY: 0, hipRot: 0,
    chestRot: 0, chestY: 0, shoulderRot: 0,
    headRot: 0, headX: 0, headY: 0,
    legRear: { hip: -0.16, knee: -0.12 }, legFront: { hip: 0.17, knee: -0.16 },
    armRear: { sh: 0.12, el: 0.30 }, armFront: { sh: -0.10, el: 0.34 },
    handRear: 'fist', handFront: 'fist',
    squashX: 1, squashY: 1,
    hairFlow: 0, coatFlow: 0, capeLift: 0,
    breath: 0, blink: 0, eyes: 'normal', brow: 'normal', mouth: 'closed', pupil: 0,
    flash: 0, ghosts: null, smear: 0, smearDir: 1,
    aura: 0, standOut: 0, standPunch: 0, standRot: 0, glow: 0, telegraph: 0,
    dust: 0, airborne: 0, gaitPhase: -1, bodyRot: 0,
    rearOver: 0,                       /* the rear arm is drawn over the body (it is the one punching) */
    feet: [0, 0]                       /* a lunge: how far the front and the rear foot are from where the stance stands them (px) */
  };
}

/* Shared per-frame bookkeeping: velocity, cloth springs, breath, blink. */
function tick(f, s, dtMs, pose, energy) {
  const dt = Math.min(0.05, dtMs / 1000);
  s.t += dt;
  const vx = (f.x - s.prevX) / Math.max(0.0001, dt);
  s.prevX = f.x;
  s.vx = vx;
  s.vsm += (vx - s.vsm) * Math.min(1, dt * 12);

  const facing = f.facing || 1;
  const drag = Math.max(-1.1, Math.min(1.1, -s.vsm * facing / 190));
  spring(s.hair, drag * 0.8 + pose.hairFlow, 190, 13, dt);
  spring(s.coat, drag + pose.coatFlow * 1.1, 120, 9.5, dt);
  spring(s.head, pose.headRot, 260, 16, dt);
  pose.hairFlow = s.hair.x;
  pose.coatFlow = s.coat.x;

  s.breathT += dt * (0.8 + energy * 1.9);
  pose.breath = Math.sin(s.breathT * 1.5);

  s.blinkIn -= dt;
  if (s.blinkIn <= 0) { s.blink = 0.14; s.blinkIn = 2.2 + Math.random() * 3.6; }
  if (s.blink > 0) { s.blink = Math.max(0, s.blink - dt); pose.blink = Math.min(1, s.blink / 0.07); }

  if (pose.action !== s.action) { s.prevAction = s.action; s.action = pose.action; s.actionT = 0; }
  else s.actionT += dt;
  return dt;
}

/* --- shared action builders ------------------------------------------- 
   The stance, the walk, the crouch, the guard and the run are stance.js (feet put on the floor by IK); the animation of a move is pose_fighter.js.
   What is here is what happens to a body that has stopped choosing: the hurt, the fall. */

export function applyHurt(pose, t, seed, heavy, spec) {
  const k = ease.outQuint(Math.min(1, t * 3));
  const jitter = Math.sin(t * 46 + seed) * (1 - t) * 0.09;
  pose.chestRot = -0.55 * heavy * (1 - t * 0.55) + jitter;
  pose.hipRot = -0.2 * (1 - t * 0.6);
  pose.headRot = -0.5 * heavy * (1 - t * 0.4) + jitter * 2;
  pose.headX = -1.6 * heavy * (1 - t * 0.5);
  pose.hipX = -2.4 * heavy * (1 - t * 0.6);
  pose.hipY = 1.2 * (1 - t);
  pose.armFront.sh = -0.10 - 1.15 * (1 - t * 0.5) - (seed % 2) * 0.2;
  pose.armFront.el = 0.34 + 0.9 * (1 - t);
  pose.armRear.sh = 0.12 + 1.0 * (1 - t * 0.5);
  pose.armRear.el = 0.3 + 0.7 * (1 - t);
  /* the feet stay where they were planted while the body is thrown back over them; the front one gives way a little on the hardest hits */
  if (spec) standOn(pose, spec, [-2.5 * heavy * (1 - t), 3 * (1 - t)]);
  pose.squashX = 1 + 0.09 * (1 - k);
  pose.squashY = 1 - 0.07 * (1 - k);
  pose.coatFlow = -0.8 * (1 - t);
  pose.hairFlow = -0.6 * (1 - t);
  pose.eyes = 'shut'; pose.brow = 'pain'; pose.mouth = 'shout';
  pose.handFront = 'open'; pose.handRear = 'open';
}

/* Death in three readable beats: stagger, buckle, fall. */
export function applyDeath(pose, t) {
  if (t < 0.28) {
    const k = t / 0.28;
    pose.chestRot = -0.5 * k; pose.headRot = -0.6 * k; pose.hipX = -2 * k;
    pose.armFront.sh = -1.3 * k; pose.armRear.sh = 1.2 * k;
    pose.legRear.hip = -0.16 - 0.5 * k;
  } else if (t < 0.55) {
    const k = (t - 0.28) / 0.27;
    pose.chestRot = -0.5 + 0.9 * k;
    pose.headRot = -0.6 + 0.9 * k;
    pose.hipY = 5 * k;
    pose.legFront.hip = 0.5 * k; pose.legFront.knee = -1.5 * k;
    pose.legRear.hip = -0.66 + 0.3 * k; pose.legRear.knee = -1.3 * k;
    pose.armFront.sh = -1.3 + 1.5 * k; pose.armRear.sh = 1.2 - 0.6 * k;
    pose.hipX = -2 - 1 * k;
  } else {
    /* the fall itself: the whole body pivots over the heels and lands
       flat, rather than folding into a crouch that never topples */
    const k = ease.inQuad(Math.min(1, (t - 0.55) / 0.45));
    pose.bodyRot = -1.42 * k;
    pose.chestRot = 0.4 - 0.5 * k;
    pose.headRot = 0.3 - 0.6 * k;
    pose.hipY = 5 - 3 * k;
    pose.hipX = -3 + 6 * k;
    pose.legFront.hip = 0.5 - 0.7 * k; pose.legFront.knee = -1.5 + 1.1 * k;
    pose.legRear.hip = -0.36 + 0.2 * k; pose.legRear.knee = -1.3 + 1.0 * k;
    pose.armFront.sh = 0.2 + 1.5 * k; pose.armRear.sh = 0.6 + 1.2 * k;
    pose.squashY = 1 - 0.06 * k; pose.squashX = 1 + 0.06 * k;
    pose.dust = k > 0.7 ? 1 : 0;
  }
  pose.eyes = 'x'; pose.mouth = 'open'; pose.brow = 'pain';
  pose.handFront = 'open'; pose.handRear = 'open';
  pose.coatFlow = 0.6; pose.hairFlow = 0.4;
}

export { tick };
