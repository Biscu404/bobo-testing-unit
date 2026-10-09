/* Everything a fighter does with its feet on the floor: the stance, the walk, the crouch, the guard, the run and the hop back.

   It used to be angles all the way down: a stance was eight joint angles somebody liked, a walk was two legs swung from a pin, a crouch was a thigh turned forward until the
   body sat down on its own heel, and the guard was a pair of arms crossed over the chest. Nothing said where a foot was, so feet slid, knees bent through each other and the fists
   went wherever two angles left them. Here a foot is told where it stands (ik.js turns that into the knee and the hip that put it there) and a fist is told where it is held
   (relative to the shoulder it hangs from, so the guard stays at the chin when the chest leans). The numbers are in pixels of a fighter with arms forty pixels long and are scaled by
   the body in specs.js, so a short fighter holds a shorter guard.

   Rig reminders (body.js): 0 rad points a limb straight DOWN, positive swings it FORWARD; chestRot positive leans the chest forward; hipY positive lowers the hips. */

import { plant, solveArm } from './ik.js';

const TAU = Math.PI * 2;
const armK = spec => (spec.upper + spec.fore) / 40;

/* where the ankles stand when the fighter is standing: the front foot ahead of its own hip, the rear foot behind its own */
export const stanceFeet = spec => ({ f: spec.hipW * 0.5 + 4.5, r: -(spec.hipW * 0.5 + 5.5) });

/* where a fist is held, relative to the shoulder joint it hangs from (x forward, y down), for a fighter with arms forty pixels long */
export const GUARD = {
  stand: { lead: [15, -7], rear: [9, -4] },          /* fists up at the chin, elbows tucked: a fighting stance, not a pair of folded arms */
  block: { lead: [16, -13], rear: [10, -10] },       /* both forearms up over the face */
  crouch: { lead: [15, -3], rear: [9, 0] }
};

/* put a fist at (dx, dy) from the shoulder it hangs from (px at forty-pixel arms); the elbow hangs below the line */
export function fistAt(pose, spec, side, dx, dy) {
  const k = armK(spec), a = solveArm(spec, pose.chestRot, dx * k, dy * k);
  if (side > 0) pose.armFront = a; else pose.armRear = a;
  return a;
}
export function holdGuard(pose, spec, kind, wob) {
  const g = GUARD[kind || 'stand'], w = wob || 0;
  fistAt(pose, spec, 1, g.lead[0] + w, g.lead[1] - w * 0.4);
  fistAt(pose, spec, -1, g.rear[0] - w * 0.5, g.rear[1] + w * 0.3);
}

/* the stance with its feet where they were left: used after anything has moved the hips, so the feet stay where they are. `off` is the lunge: [front foot, rear foot] in px */
export function standOn(pose, spec, off) {
  const F = stanceFeet(spec), o = off || [0, 0];
  return plant(pose, spec, { x: F.f + o[0], y: 0 }, { x: F.r + o[1], y: 0 });
}

/* a fighting stance, not a standing pose: the knees bent, the weight on both feet, the hips breathing, the fists up */
export function applyIdle(pose, s, energy) {
  const spec = s.spec, b = pose.breath, sway = Math.sin(s.t * 0.62), bounce = Math.sin(s.t * 1.9) * (0.4 + energy * 0.6);
  pose.hipY = 3.2 + b * 0.5 + bounce * 0.7 + (energy > 0.6 ? 1.6 : 0);
  pose.chestY = -b * 0.9;
  pose.chestRot = -0.05 + b * 0.04 + sway * 0.03 - (energy > 0.6 ? 0.06 : 0);
  pose.headY = -b * 0.5 + (energy > 0.6 ? Math.max(0, -b) * 0.8 : 0);
  pose.headRot = 0.06 - b * 0.03 + Math.sin(s.t * 0.43) * 0.05;
  pose.hipX = sway * 0.7;
  pose.hipRot = sway * 0.04;
  pose.hairFlow = Math.sin(s.t * 1.1) * 0.06 + b * 0.03;
  pose.coatFlow = Math.sin(s.t * 0.9 + 1) * 0.09;
  pose.pupil = Math.sin(s.t * 0.35) * 0.6;
  standOn(pose, spec);
  holdGuard(pose, spec, 'stand', b * 0.6 + sway * 0.4);
}

/* the feet of a walk: stance (the foot on the floor, going back under the body) then swing (up, over and forward). `p` is where this foot is in its own cycle, 0..1 */
function step(p, rest, half, lift, duty) {
  p = ((p % 1) + 1) % 1;
  if (p < duty) return { x: rest + half - 2 * half * (p / duty), y: 0 };
  const u = (p - duty) / (1 - duty), e = u * u * (3 - 2 * u);
  return { x: rest - half + 2 * half * e, y: -lift * Math.sin(Math.PI * u) };
}

/* a walk in a fighting stance: feet placed one after the other, the hips lowest as each foot lands and highest as it passes, the shoulders turning against the hips, the fists
   riding the guard. `phase` runs forwards for a walk forwards and backwards for a walk back, which is exactly what the feet of a walk backwards do. */
export function applyWalk(pose, s, phase, back) {
  const spec = s.spec, F = stanceFeet(spec), p = phase * TAU, sn = Math.sin(p), cs = Math.cos(p);
  applyIdle(pose, s, 0.3);
  pose.gaitPhase = phase;
  const half = back ? 9 : 12, lift = back ? 6 : 8.5, duty = 0.58;
  pose.hipY += 0.8 + Math.abs(cs) * 1.6;
  pose.hipRot = sn * 0.07; pose.chestRot += -sn * 0.06 + (back ? -0.04 : 0.03); pose.chestY -= Math.abs(cs) * 0.5; pose.headY -= Math.abs(cs) * 0.5;
  pose.headRot += sn * 0.03; pose.hipX = sn * 0.6;
  pose.coatFlow = 0.22 + sn * 0.1; pose.hairFlow = 0.1 + sn * 0.05;
  plant(pose, spec, step(phase, F.f * 0.35, half, lift, duty), step(phase + 0.5, F.r * 0.35, half, lift, duty));
  holdGuard(pose, spec, 'stand', sn * 1.4);
}

/* knees bent deep, the hips down between the heels, the chest forward over them, the fists low */
export function applyCrouch(pose, s, deep) {
  const spec = s.spec, F = stanceFeet(spec), d = deep == null ? 1 : deep;
  pose.hipY = 3.2 + 14 * d; pose.chestRot = 0.06 + 0.2 * d; pose.headRot = 0.05; pose.hipX = 1 * d; pose.hipRot = 0;
  plant(pose, spec, { x: F.f + 3 * d, y: 0 }, { x: F.r - 1 * d, y: 0 });
  holdGuard(pose, spec, 'crouch');
}

/* both forearms up over the face, the weight back */
export function applyGuard(pose, s, crouched) {
  const spec = s.spec;
  pose.chestRot -= 0.08; pose.headRot -= 0.04;
  if (!crouched) standOn(pose, spec);
  holdGuard(pose, spec, 'block');
  pose.brow = 'angry'; pose.eyes = 'narrow'; pose.mouth = 'grit';
}

/* a run: long strides, both feet off the floor for a moment, the chest well forward, the fists pumping */
export function applyRun(pose, s, phase) {
  const spec = s.spec, F = stanceFeet(spec), p = phase * TAU, sn = Math.sin(p), cs = Math.cos(p);
  applyIdle(pose, s, 0.6);
  pose.gaitPhase = phase;
  pose.hipY = 8 + Math.abs(cs) * 1.5; pose.chestRot = 0.42; pose.hipRot = sn * 0.08; pose.headRot = -0.1 + sn * 0.03; pose.hipX = 2 + sn * 0.8;
  plant(pose, spec, step(phase, F.f * 0.3, 19, 15, 0.44), step(phase + 0.5, F.r * 0.3, 19, 15, 0.44));
  fistAt(pose, spec, 1, 12 + sn * 9, 4 - Math.abs(sn) * 2); fistAt(pose, spec, -1, 8 - sn * 9, 6 - Math.abs(sn) * 2);
}

/* the hop back: weight thrown behind, the front foot trailing, both feet clear of the floor for most of it */
export function applyBackhop(pose, s, k) {
  const spec = s.spec, F = stanceFeet(spec), air = Math.sin(Math.min(1, k) * Math.PI);
  applyIdle(pose, s, 0.4);
  pose.chestRot = -0.3 - 0.1 * air; pose.hipY = 6 + 3 * air; pose.hipX = -2;
  plant(pose, spec, { x: F.f - 6 * air, y: -9 * air }, { x: F.r - 9 * air, y: -12 * air });
  holdGuard(pose, spec, 'block');
}

/* the low sideways step: the hips swing round the planted feet and the shoulders lean away */
export function applySidestep(pose, s, dir, k) {
  const spec = s.spec;
  applyIdle(pose, s, 0.4);
  pose.hipRot = 0.5 * dir * k; pose.chestRot -= 0.2 * k; pose.squashX = 1 - 0.08 * k; pose.ghosts = 0.4 * dir; pose.hipY += 2 * k;
  standOn(pose, spec, [3 * k * dir, -3 * k * dir]);
  holdGuard(pose, spec, 'stand');
}
