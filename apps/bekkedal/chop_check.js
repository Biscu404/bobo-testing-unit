/* node apps/bekkedal/chop_check.js — felling is a rhythm: chop.js against three kinds of player.
 *   a sharp one strikes the instant the mark is in the heart; an ordinary one strikes inside the pale stretch when it is
 *   there; a masher presses SPACE every tenth of a second. Every one of them fells every tree; the masher is slower and
 *   glances more; nobody takes longer than a sensible number of seconds; a steel axe is a point shorter. Pure Node. */
import { CHOP_POINTS, CHOP_ZONE, CHOP_HEART, CHOP_SWEEP_S, CHOP_MIN_C, CHOP_MAX_C, chopPoints, markerAt, newChop, chopTick, chopStrike } from './chop.js';

let bad = 0;
const ok = (c, m, d) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (d ? '  ' + d : '')); if (!c) bad++; };

function seeded(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

ok(markerAt(0) === 0 && Math.abs(markerAt(CHOP_SWEEP_S) - 1) < 1e-9 && Math.abs(markerAt(CHOP_SWEEP_S * 2)) < 1e-9, 'the mark goes 0 to 1 and back in two sweeps');
ok(CHOP_MIN_C - CHOP_ZONE > 0 && CHOP_MAX_C + CHOP_ZONE < 1, 'the stretch always lies wholly on the bar');
ok(CHOP_HEART < CHOP_ZONE, 'the heart is inside the stretch');
ok(chopPoints('Y', 1) === CHOP_POINTS.Y && chopPoints('G', 2) === CHOP_POINTS.G - 1 && chopPoints('Y', 2) >= 1, 'a steel axe is a point shorter, never none');

/* a player is a function from the state to "press now?" and a reaction delay (s) */
const players = {
  sharp:  { press: c => Math.abs(c.pos - c.centre) < CHOP_HEART * 0.7, every: 0.0 },
  steady: { press: c => Math.abs(c.pos - c.centre) < CHOP_ZONE * 0.8, every: 0.0 },
  masher: { press: () => true, every: 0.1 }
};
function fell(glyph, axe, who, seed) {
  const rnd = seeded(seed), c = newChop(glyph, axe, 1, 1, rnd), P = players[who], dt = 1 / 60;
  let since = 9, secs = 0;
  while (!c.done && secs < 120) {
    chopTick(c, dt); secs += dt; since += dt;
    if (since >= P.every && P.press(c)) { since = 0; chopStrike(c, rnd); }
  }
  return { secs: secs, done: !!c.done, blows: c.blows, glances: c.glances };
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const stats = {};
for (const who of Object.keys(players)) for (const g of ['Y', 'G']) for (const axe of [1, 2]) {
  const runs = Array.from({ length: 200 }, (_, i) => fell(g, axe, who, i + 1));
  stats[who + g + axe] = { secs: mean(runs.map(r => r.secs)), worst: Math.max(...runs.map(r => r.secs)), glances: mean(runs.map(r => r.glances)), all: runs.every(r => r.done) };
}
ok(Object.values(stats).every(s => s.all), 'every kind of player fells every kind of tree');
ok(stats.sharpY1.secs < stats.masherY1.secs + 0.5 && stats.sharpG1.glances < stats.masherG1.glances + 0.01, 'the sharp player is never worse than the masher');
ok(stats.sharpY1.glances === 0, 'a sharp player never glances off', stats.sharpY1.glances.toFixed(2));
ok(stats.masherY1.glances > 0.3, 'a masher does glance off', stats.masherY1.glances.toFixed(2));
ok(stats.steadyY1.secs <= 3.5 && stats.steadyG1.secs <= 6, 'a steady player takes seconds, not minutes', stats.steadyY1.secs.toFixed(1) + ' s birch, ' + stats.steadyG1.secs.toFixed(1) + ' s fir');
ok(Object.values(stats).every(s => s.worst < 14), 'nobody is ever stuck at one tree for long', Math.max(...Object.values(stats).map(s => s.worst)).toFixed(1) + ' s worst');
ok(stats.steadyG2.secs < stats.steadyG1.secs, 'the steel axe is quicker through a fir');
console.log(Object.keys(stats).filter(k => /1$/.test(k)).map(k => k + ' ' + stats[k].secs.toFixed(1) + 's').join('  '));
if (bad) { console.log(bad + ' failed'); process.exit(1); }
console.log('All chop checks pass.');
