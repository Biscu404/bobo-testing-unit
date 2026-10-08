/* node apps/standbattle/input_check.js — the input windows of spec 4.2, at and either side of each edge: taps and holds, dashes, the buffer, two buttons at once,
   quarter-circles and the charge, read the way the sim reads them (input_frames.js) from a stream of one integer per frame. */
import { kit, BIT } from './check_kit.js';
import { createInput, pushInput, pendingPress, motionMatch, parseCmd } from './input_frames.js';
import { RULES } from './rules.js';
import { planInputs } from './input_plan.js';
import { buildMove } from './moves.js';
const { ok, done } = kit('input');

const R = BIT.RIGHT, L = BIT.LEFT, D = BIT.DOWN, U = BIT.UP, LP = BIT.LP, RP = BIT.RP;
function feed(seq) { const st = createInput(); const taps = [], dashes = []; seq.forEach((b, i) => { pushInput(st, b, 1, i); if (st.tap) taps.push([i, st.tap]); if (st.dash) dashes.push([i, st.dash]); }); st.taps = taps; st.dashes = dashes; return st; }
const rep = (b, n) => new Array(n).fill(b);
const motion = (seq, kind) => { const st = feed(seq), pp = pendingPress(st); return pp ? motionMatch(st, pp.idx, kind) : false; };

/* tap and hold */
ok(feed([D, 0]).taps.length === 1 && feed([D, 0]).taps[0][1] === 'down', 'a lone tap of down is a sidestep to the near lane');
ok(feed([U, 0]).taps[0][1] === 'up', 'a lone tap of up is a sidestep to the far lane');
ok(feed([...rep(D, RULES.TAP), 0]).taps.length === 1, 'held ' + RULES.TAP + ' frames is still a tap');
ok(feed([...rep(D, RULES.TAP + 1), 0]).taps.length === 0, 'held ' + (RULES.TAP + 1) + ' frames is a crouch, not a tap');
ok(!feed(rep(D, RULES.TAP)).crouch && feed(rep(D, RULES.TAP + 1)).crouch, 'the crouch begins on frame ' + (RULES.TAP + 1));
ok(feed([D | L, 0]).taps.length === 0 && feed([D | LP, 0]).taps.length === 0, 'down with a direction or a button is not a tap');
ok(feed([D, D | R, R, R | LP]).taps.length === 0, 'a quarter-circle that starts on down never sidesteps');
ok(feed([U | D, 0]).taps.length === 0, 'up and down together is nothing');

/* dash */
ok(feed([R, 0, R]).dashes.length === 1, 'forward, release, forward is a dash');
ok(feed([R, ...rep(0, RULES.DASH_GAP), R]).dashes.length === 1, '... with up to ' + RULES.DASH_GAP + ' frames between');
ok(feed([R, ...rep(0, RULES.DASH_GAP + 1), R]).dashes.length === 0, '... and not with more');
ok(feed([R, R, R, 0, R]).dashes.length === 1, 'a held first press still counts if the second follows quickly');
ok(feed([L, 0, L]).dashes[0][1] === -1, 'back, release, back is a backdash');
ok(feed([R, 0, R, 0, R]).dashes.length === 1, 'three taps are one dash');

/* the buffer, and two buttons */
{ const st = feed([LP, ...rep(0, RULES.BUFFER - 1)]); ok(!!pendingPress(st), 'a press is good ' + RULES.BUFFER + ' frames'); }
{ const st = feed([LP, ...rep(0, RULES.BUFFER)]); ok(!pendingPress(st), 'and not one more'); }
{ const st = feed([LP, 0, RP]); ok(pendingPress(st).buttons === (LP | RP), 'two buttons ' + (RULES.SIMUL - 1) + ' frames apart are one press'); }
{ const st = feed([LP, 0, 0, RP]); ok(pendingPress(st).buttons === RP, 'three frames apart are not'); }
{ const st = feed([LP, 0]); st.consumed = st.tick; ok(!pendingPress(st), 'a press that has been used is gone'); }

/* quarter-circles */
const qcf = (gap, lastGap, hold) => [D, ...rep(0, 0), D | R, R, ...rep(0, lastGap), R | LP];
ok(motion([D, D | R, R, R | LP], 'qcf'), 'down, down-forward, forward + button is a quarter-circle forward');
ok(!motion([D, D | L, L, L | LP], 'qcf'), '... and the other way is not');
ok(motion([D, D | L, L, L | LP], 'qcb'), 'and is one backward');
ok(motion([D, R, R | LP], 'qcf'), 'the diagonal may be skipped when down and forward are within 3 frames');
ok(!motion([D, 0, 0, 0, 0, R, R | LP], 'qcf'), '... and not when they are further apart');
{ // window: first step to the final step within MOTION_WINDOW
  const seq = n => [D, ...rep(D | R, 1), ...rep(0, n - 3), R, R | LP];
  const st = n => { const s = feed(seq(n)); return motionMatch(s, pendingPress(s).idx, 'qcf'); };
  ok(st(RULES.MOTION_WINDOW + 1), 'a motion whose last direction comes ' + RULES.MOTION_WINDOW + ' frames after its first counts');
  ok(!st(RULES.MOTION_WINDOW + 2), 'one frame later it does not');
}
{ // the button after the final direction
  const seq = n => [D, D | R, R, ...rep(R, n), R | LP];
  const t = n => { const s = feed([D, D | R, R, ...rep(0, n), LP]); return motionMatch(s, pendingPress(s).idx, 'qcf'); };
  ok(t(RULES.MOTION_BUTTON - 1) || t(RULES.MOTION_BUTTON), 'the button within ' + RULES.MOTION_BUTTON + ' frames of the last direction counts');
  ok(!t(RULES.MOTION_BUTTON + 3), 'and well after does not');
}
/* charge */
{ const ch = (n, gap) => { const s = feed([...rep(L, n), ...rep(0, gap || 0), R | RP]); return motionMatch(s, pendingPress(s).idx, 'ch'); };
  ok(ch(RULES.CHARGE), 'back held ' + RULES.CHARGE + ' frames, then forward + button, is a charge');
  ok(!ch(RULES.CHARGE - 1), 'one frame short is not');
  ok(ch(RULES.CHARGE + 4, 1), 'a one-frame release before the forward is forgiven');
  ok(!ch(RULES.CHARGE + 4, RULES.CHARGE_RELEASE + 3), 'a long gap is not');
  const g = feed([...rep(L, 20), 0, 0, ...rep(L, 20), R | RP]); ok(motionMatch(g, pendingPress(g).idx, 'ch'), 'a two-frame flicker of the stick in the middle is forgiven');
  const g2 = feed([...rep(L, 20), 0, 0, 0, ...rep(L, 20), R | RP]); ok(!motionMatch(g2, pendingPress(g2).idx, 'ch'), '... three is not');
}
/* parsing and the planner agree with the reader for every kind of command */
['LP', 'f+RP', 'd+LK', 'df+RP', 'qcf+LP', 'qcb+RK', 'ch+RP', 'LP+RP', 'ff+RP'].forEach(c => {
  const m = buildMove(['t', 'T', c, 'm', 12, 1, 14, 1, -1, 5, 40, 'jab'], 'x');
  const seq = planInputs(m, 1), st = feed(seq), pp = pendingPress(st);
  ok(pp && pp.buttons === m.cmd.buttons && (m.cmd.kind !== 'motion' || motionMatch(st, pp.idx, m.cmd.motion)), 'the planner performs "' + c + '" and the reader reads it back');
});
let threw = false; try { parseCmd('zz+LP'); } catch (e) { threw = true; } ok(threw, 'an unknown token in a command is an error at load');
done();
