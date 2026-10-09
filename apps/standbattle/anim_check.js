/* node apps/standbattle/anim_check.js — every move is animated from its own frame data and nothing else (spec 14). For every move of every fighter:

     style      the row names a style that exists, and the style has the keys it needs
     telegraph  by the end of the wind-up the body is somewhere other than the stance (a visible amount of joint angle), for any move that starts on frame 11 or later
     moving     no two consecutive frames of the wind-up are the same pose, for any move slower than i12 (a longer startup is a longer, plainer telegraph, never a held frame)
     strike     the first active frame is the strike key, held until the last active frame
     recovery   the pose is back at the stance exactly when the move is over, after exactly `recovery` frames of easing
     frames     phaseOf puts the wind-up, the strike and the recovery on the move's own frames (no hand-timed loop exists to disagree with them) */

import { ROSTER, movelistOf } from './roster.js';
import { STYLES } from './anim_styles.js';
import { phaseOf, poseForMove, fighterPose } from './pose_fighter.js';

const fails = [];
let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const JOINTS = { armFront: ['sh', 'el'], armRear: ['sh', 'el'], legFront: ['hip', 'knee'], legRear: ['hip', 'knee'] };
const limbs = pose => Object.keys(JOINTS).map(k => JOINTS[k].map(j => pose[k][j]));
const dist = (a, b) => a.reduce((s, l, i) => s + Math.abs(l[0] - b[i][0]) + Math.abs(l[1] - b[i][1]), 0);

const idle = fighterPose({ state: 'idle', hp: 100, maxHp: 120, x: 0, facing: 1, def: {}, statuses: [] }, 0, 0);
const stance = limbs(idle);

Object.keys(ROSTER).forEach(id => {
  movelistOf(id).list.forEach(m => {
    const tag = id + '.' + m.id + ' (' + m.name + ', ' + m.anim + ')', st = STYLES[m.anim];
    ok(!!st && !!st.wind && !!st.strike, tag + ': a style with a wind-up and a strike');
    if (!st) return;
    const S = m.startup, last = m.last.f + m.last.n - 1;
    const at = f => limbs(poseForMove(m, f));
    /* where in the move each part is */
    ok(phaseOf(m, 1).stage === 'wind' || S <= 2, tag + ': frame 1 is the start of the wind-up');
    ok(phaseOf(m, S).stage === 'active' && phaseOf(m, last).stage === 'active', tag + ': the strike is held on the active frames');
    if (last < m.total) ok(phaseOf(m, last + 1).stage === 'recover' || phaseOf(m, last + 1).stage === 'toss', tag + ': the recovery starts the frame after the last hit');
    const rec = [];
    for (let f = last + 1; f <= m.total; f++) rec.push(phaseOf(m, f));
    ok(rec.length === m.recovery, tag + ': ' + rec.length + ' frames of recovery on the table, ' + m.recovery + ' in the row');
    ok(phaseOf(m, m.total).k >= 0.999, tag + ': the last frame of the move is the stance');
    /* the telegraph */
    if (S >= 11) {
      const windEnd = Math.max(1, S - 1 - Math.min(3, S - 1));
      ok(dist(at(windEnd), stance) >= 0.5, tag + ': a wind-up that moves the body only ' + dist(at(windEnd), stance).toFixed(2) + ' radians off the stance by frame ' + windEnd);
    }
    if (S > 12) {
      let same = 0;
      for (let f = 1; f < S - 1; f++) if (dist(at(f), at(f + 1)) < 1e-4) same++;
      ok(same === 0, tag + ': ' + same + ' identical consecutive frames in a ' + S + '-frame wind-up');
    }
    /* the strike key is where the hit is */
    const sp = at(S), sp2 = at(last);
    ok(dist(sp, sp2) < 1e-6 || m.hits.length > 1, tag + ': the strike is held still across its active frames');
    ok(dist(sp, stance) >= 0.6, tag + ': a strike only ' + dist(sp, stance).toFixed(2) + ' radians from the stance');
    ok(dist(at(m.total), stance) < 0.05, tag + ': the body is ' + dist(at(m.total), stance).toFixed(2) + ' radians from the stance when the move is over');
  });
});

if (fails.length) { fails.slice(0, 60).forEach(f => console.log('FAIL - ' + f)); console.log(fails.length + ' problems in ' + checks + ' checks'); process.exit(1); }
console.log('All ' + checks + ' animation checks pass: every move is animated from its frames.');
