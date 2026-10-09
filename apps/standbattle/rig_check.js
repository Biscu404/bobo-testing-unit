/* node apps/standbattle/rig_check.js — the limbs behave like limbs (pure Node). The rig is forward kinematics (body.js); what these checks hold is what the pose engine asks of it:

     feet        a foot that is meant to be on the floor is on the floor, in the stance, the crouch, the guard, every phase of the walk (both ways), under every punch and under the
                 standing leg of every kick, for every fighter (their legs are different lengths); and the foot of a walk is not dragged: while it is down it only moves backward
     knees       a knee only bends the way a knee does (the shin goes back), an elbow only the way an elbow does, in every pose the engine makes on its feet
     fists       the guard hangs at the chin, and keeps its place when the chest leans; a punch is thrown in a straight line from there and never scoops under the target
     order       the arm that is punching is never the one hidden behind the body */

import { skeleton } from './body.js';
import { ROSTER, movelistOf, defOf } from './roster.js';
import { SPECS, specOf } from './specs.js';
import { fighterPose, poseForMove } from './pose_fighter.js';
import { animState } from './anim.js';
import { STYLES } from './anim_styles.js';
import { phaseOf, fistOf } from './strike_pose.js';
import { stanceFeet } from './stance.js';

const fails = [];
let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const fighter = (id, over) => Object.assign({ state: 'idle', x: 0, y: 0, z: 0, facing: 1, hp: 100, maxHp: 120, def: defOf(id), statuses: [], move: null, mf: 0, walk: 0, crouch: false, guard: false, stun: 0, stunMax: 20, slot: 0 }, over || {});
const poseOf = (f, gait) => { let p = null; for (let k = 0; k < 3; k++) p = fighterPose(f, k * 0.016, 16); if (gait != null) { animState(f).prevGait = gait; p = fighterPose(f, 1, 0); } return p; };
const ankles = (spec, pose) => { const sk = skeleton(spec, pose); return { front: sk.legFront.ankle, rear: sk.legRear.ankle, sk }; };
const FIGHTERS = ['jotaro', 'kira', 'delinquent', 'angelo', 'polnareff', 'boss'];

FIGHTERS.forEach(id => {
  const spec = specOf(fighter(id)), F = stanceFeet(spec);
  const flat = (a, tag) => { ok(Math.abs(a.front.y) < 0.05 && Math.abs(a.rear.y) < 0.05, id + ': both feet on the floor ' + tag + ' (' + a.front.y.toFixed(2) + ', ' + a.rear.y.toFixed(2) + ')'); };
  /* the stance, the crouch, the guard */
  const stand = ankles(spec, poseOf(fighter(id)));
  flat(stand, 'in the stance');
  ok(Math.abs(stand.front.x - F.f) < 0.5 && Math.abs(stand.rear.x - F.r) < 0.5, id + ': the stance puts the feet where the stance stands them');
  flat(ankles(spec, poseOf(fighter(id, { crouch: true }))), 'in the crouch');
  flat(ankles(spec, poseOf(fighter(id, { guard: true }))), 'in the guard');
  flat(ankles(spec, poseOf(fighter(id, { state: 'blockstun', guard: true, stun: 6, stunMax: 12 }))), 'in blockstun');

  /* the walk, forwards and back: planted feet are planted, and a planted foot only goes back under the body (forwards for a walk back is the cycle run the other way) */
  [1, -1].forEach(dir => {
    const f = fighter(id, { walk: dir });
    let prev = null, slid = 0, steps = 0;
    for (let i = 0; i < 48; i++) {
      const gait = dir > 0 ? i / 48 : 1 - i / 48;                 /* a walk back runs the cycle the other way */
      const p = poseOf(f, gait), a = ankles(spec, p);
      ok(a.front.y < 0.05 && a.rear.y < 0.05, id + ': a foot never goes through the floor in the walk (' + a.front.y.toFixed(2) + ', ' + a.rear.y.toFixed(2) + ')');
      const planted = a.front.y > -0.05;
      if (planted && prev && prev.planted) { steps++; if ((a.front.x - prev.x) * dir > 0.6) slid++; }
      prev = { x: a.front.x, planted };
      ok(p.legFront.knee <= 0.001 && p.legRear.knee <= 0.001, id + ': the knees bend the right way in the walk');
    }
    ok(steps > 10, id + ': the walk has a planted foot to look at (' + steps + ')');
    ok(slid === 0, id + ': a planted foot of the walk' + (dir < 0 ? ' backwards' : '') + ' only goes back under the body (' + slid + ' frames the wrong way)');
    /* both feet are never off the floor at once in a walk: that is a run */
    let both = 0;
    for (let i = 0; i < 48; i++) { const a = ankles(spec, poseOf(f, dir > 0 ? i / 48 : 1 - i / 48)); if (a.front.y < -0.5 && a.rear.y < -0.5) both++; }
    ok(both === 0, id + ': a walk has a foot on the floor at every moment (' + both + ' frames with none)');
  });

  /* punches and kicks: feet planted, knees and elbows the right way, the guard at the chin */
  movelistOf(id).list.forEach(m => {
    const st = STYLES[m.anim];
    if (!st) return;
    const tag = id + '.' + m.id;
    const ph = f => phaseOf(m, f);
    let maxFloor = 0, badKnee = 0, badElbow = 0;
    for (let mf = 1; mf <= m.total; mf++) {
      const f = fighter(id, { state: 'attack', move: m, mf }), p = poseOf(f), a = ankles(spec, p);
      const sup = st.kind === 'leg' ? (m.limb === 'legFront' ? a.rear : a.front) : null;
      if (st.kind === 'arm' && !st.alt && !st.toss) { maxFloor = Math.max(maxFloor, Math.abs(a.front.y), Math.abs(a.rear.y)); }
      if (sup) maxFloor = Math.max(maxFloor, Math.abs(sup.y));
      if (p.legFront.knee > 0.05 && st.kind === 'arm') badKnee++;
      ['armFront', 'armRear'].forEach(k => { if (p[k].el < -0.05 || p[k].el > Math.PI * 2 + 0.05) badElbow++; });
    }
    /* a rising knee or uppercut leaves the floor on purpose (its hips go up: hipY below 1): the others keep both feet down */
    const rises = [st.strike, st.wind].some(k => k && k.hipY != null && k.hipY < 1);
    if (!rises && (st.kind === 'leg' || (st.kind === 'arm' && !st.alt && !st.toss))) ok(maxFloor < 0.06, tag + ': the foot it stands on stays on the floor through the whole move (off by ' + maxFloor.toFixed(2) + ')');
    ok(badElbow === 0, tag + ': an elbow never bends backwards through the move');
    ok(badKnee === 0, tag + ': a punch never turns the standing knee backwards');
    /* a straight punch: from the end of the wind-up to the strike the fist only comes closer to where it lands */
    const arcs = (() => { const key = (T) => T && T.s; const w = key(st.wind), k = key(st.strike); if (!w || !k) return true; const A = fistOf(w[0], w[1], 0), B = fistOf(k[0], k[1], 0); return !(A.up === B.up || A.up === null || B.up === null); })();
    if (st.kind === 'arm' && !st.alt && !st.toss && !arcs) {
      const S = m.startup, wrist = mf => { const f = fighter(id, { state: 'attack', move: m, mf }); const sk = skeleton(spec, poseOf(f)); const arm = m.limb === 'armFront' || m.limb === 'legFront' ? sk.armFront : sk.armRear; return arm.wrist; };
      const end = wrist(S), start = wrist(Math.max(1, S - 1 - Math.min(3, S - 1)));
      let worse = 0, prevD = Infinity;
      for (let mf = Math.max(1, S - 1 - Math.min(3, S - 1)); mf <= S; mf++) { const w = wrist(mf), d = Math.hypot(w.x - end.x, w.y - end.y); if (d > prevD + 0.8) worse++; prevD = d; }
      ok(worse === 0 || Math.hypot(end.x - start.x, end.y - start.y) < 4, tag + ': the fist closes on its target from the end of the wind-up (it moves away ' + worse + ' times)');
    }
  });

  /* the guard: both fists at the chin, and the same place when the chest leans (the shoulder moves, the fist stays where it is held relative to it) */
  const idle = skeleton(spec, poseOf(fighter(id)));
  const k = (spec.upper + spec.fore) / 40;
  ok(Math.abs((idle.armFront.wrist.x - idle.armFront.sh.x) - 15 * k) < 3 && Math.abs((idle.armFront.wrist.y - idle.armFront.sh.y) - (-7 * k)) < 3, id + ': the lead fist is held at the chin in the stance');
  const cross = movelistOf(id).list.find(m => m.button === 'RP' && !m.special && STYLES[m.anim] && STYLES[m.anim].kind === 'arm');
  if (cross) {
    const f = fighter(id, { state: 'attack', move: cross, mf: cross.startup }), p = poseOf(f), sk = skeleton(spec, p);
    ok(Math.abs((sk.armFront.wrist.x - sk.armFront.sh.x) - 15 * k) < 3 && Math.abs((sk.armFront.wrist.y - sk.armFront.sh.y) - (-7 * k)) < 3, id + ': the lead fist stays at the chin while the rear hand punches (' + cross.id + ')');
    ok(p.rearOver === 1, id + ': the rear hand is drawn over the body while it punches');
  }
});

/* the specs the pose engine reads are the ones the sprites are drawn with */
ok(Object.keys(SPECS).every(k => SPECS[k].thigh > 0 && SPECS[k].shin > 0 && SPECS[k].hipH > 0), 'every fighter has the lengths IK needs');
ok(Object.keys(ROSTER).every(id => SPECS[ROSTER[id].sprite]), 'every roster entry has a body');

if (fails.length) { fails.slice(0, 60).forEach(f => console.log('FAIL - ' + f)); console.log(fails.length + ' problems in ' + checks + ' checks'); process.exit(1); }
console.log('All ' + checks + ' rig checks pass: feet on the floor, knees and elbows the right way, the guard at the chin.');
