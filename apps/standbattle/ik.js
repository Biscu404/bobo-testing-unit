/* Two-bone inverse kinematics for the legs (and the one place that knows where a hip is).

   The rig (body.js) is forward kinematics: a pose says what angle each joint is at. Joint angles are the right thing to key a punch with, but they are the wrong thing to key
   a FOOT with: ask for "a stance" in angles and nothing says the feet are on the floor, so a crouch folded into a seat, a walk scissored its legs through each other and a
   lunge slid a planted foot along the ground. This file turns "the ankle is HERE" into the angles that put it there, so that:

     - a foot that is on the ground stays on the ground however the hips move (a lunge, a crouch, a lean, a sway);
     - the knee always bends the way a knee does (forward: the shin goes back, a negative `knee`), never through itself;
     - a walk is feet being placed, stance and swing, rather than two sticks swung from a pin.

   Coordinates are the rig's: local space, origin at the feet, +x forward, -y up. A limb's angle is from straight DOWN, positive swinging FORWARD. Pure: no canvas, no window. */

/* the rig's leg joint for one side: `side` +1 is the front leg, -1 the rear (the same arithmetic as skeleton() in body.js) */
export function hipJoint(spec, pose, side) {
  const d = side * spec.hipW * 0.5;
  return { x: pose.hipX + d * Math.cos(pose.hipRot), y: -spec.hipH + pose.hipY + d * Math.sin(pose.hipRot) * 0.4 };
}

/* the joint angles { hip, knee } (pose fields: `hip` is relative to pose.hipRot) that put the ankle at (ax, ay), the knee forward. A target out of reach is
   brought in to the longest the leg can be (a foot cannot be planted further than the leg is long: the hips have to come with it) */
export function solveLeg(spec, pose, side, ax, ay) {
  const H = hipJoint(spec, pose, side), L1 = spec.thigh, L2 = spec.shin;
  let vx = ax - H.x, vy = ay - H.y;
  let d = Math.hypot(vx, vy);
  const lo = Math.abs(L1 - L2) + 0.5, hi = L1 + L2 - 0.15;
  if (d > hi) { vx *= hi / d; vy *= hi / d; d = hi; }
  else if (d < lo) { const k = lo / Math.max(d, 1e-6); vx *= k; vy *= k; d = lo; }
  const phi = Math.atan2(vx, vy);                                                 /* the line hip -> ankle, from straight down */
  const cosA = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const ha = phi + Math.acos(cosA);                                               /* the thigh, rotated forward of that line: the knee leads */
  const kx = L1 * Math.sin(ha), ky = L1 * Math.cos(ha);
  const sa = Math.atan2(vx - kx, vy - ky);                                        /* the shin, from the knee to the ankle */
  const TAU = Math.PI * 2, wrap = (v, lo) => { while (v < lo) v += TAU; while (v >= lo + TAU) v -= TAU; return v; };
  return { hip: wrap(ha - pose.hipRot, -Math.PI), knee: wrap(sa - ha, -TAU) };   /* the knee is a negative angle (the shin goes back), the hip is small */
}

/* how far past the longest the leg can be a foot at (t.x, t.y) is, from the hip joint on this side (px; negative when it can be reached) */
const shortfall = (spec, pose, side, t) => { const H = hipJoint(spec, pose, side); return Math.hypot(t.x - H.x, t.y - H.y) - (spec.thigh + spec.shin - 0.15); };

/* put both feet where they are asked to be: front and rear are { x, y } ankle targets (y 0 is the floor, negative is in the air).
   A foot on the floor stays on the floor: when the hips are asked to be somewhere the legs cannot stretch to, the hips sink until they can (a body cannot be taller than its
   legs; it dips), so a lunge, a lean or the top of a stride never lifts a planted foot off the ground. */
export function plant(pose, spec, front, rear) {
  for (let pass = 0; pass < 4; pass++) {
    const need = Math.max(front && front.y > -0.01 ? shortfall(spec, pose, 1, front) : 0, rear && rear.y > -0.01 ? shortfall(spec, pose, -1, rear) : 0);
    if (need <= 0.001) break;
    pose.hipY += need * 1.1 + 0.01;
  }
  if (front) pose.legFront = solveLeg(spec, pose, 1, front.x, front.y);
  if (rear) pose.legRear = solveLeg(spec, pose, -1, rear.x, rear.y);
  return pose;
}

/* where the ankles are, from the angles (the inverse of solveLeg: the check uses it to prove the feet land where they were put) */
export function ankleOf(spec, pose, side) {
  const a = side > 0 ? pose.legFront : pose.legRear, H = hipJoint(spec, pose, side);
  const ha = pose.hipRot + a.hip, kx = H.x + Math.sin(ha) * spec.thigh, ky = H.y + Math.cos(ha) * spec.thigh, sa = ha + a.knee;
  return { x: kx + Math.sin(sa) * spec.shin, y: ky + Math.cos(sa) * spec.shin };
}

/* the same for an arm: the wrist at (dx, dy) from the shoulder joint, the elbow tucked DOWN (toward straight down from the line shoulder -> wrist), as a guard has it,
   or `up` (the other side of the line: the elbow behind and high, as a punch chambered at the hip or thrown from the shoulder has it).
   Used for the guard and for the stance, so the fists sit where a fist sits rather than wherever two angles happen to leave them. Returns { sh, el } relative to the chest
   (`chestRot`), like the pose's own fields. */
export function solveArm(spec, chestRot, dx, dy, up) {
  const L1 = spec.upper, L2 = spec.fore;
  let vx = dx, vy = dy, d = Math.hypot(vx, vy);
  const lo = Math.abs(L1 - L2) + 0.5, hi = L1 + L2 - 0.15;
  if (d > hi) { vx *= hi / d; vy *= hi / d; d = hi; } else if (d < lo) { const k = lo / Math.max(d, 1e-6); vx *= k; vy *= k; d = lo; }
  const phi = Math.atan2(vx, vy), a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const ua = phi + ((phi >= 0) !== !!up ? -a : a);
  const ex = L1 * Math.sin(ua), ey = L1 * Math.cos(ua), fa = Math.atan2(vx - ex, vy - ey);
  const TAU = Math.PI * 2, wrap = (v, lo) => { while (v < lo) v += TAU; while (v >= lo + TAU) v -= TAU; return v; };
  return { sh: wrap(ua - chestRot, -Math.PI), el: wrap(fa - ua, 0) };          /* a joint's angle is one number the rest of the rig mixes between keys: keep it in the range keys use */
}
