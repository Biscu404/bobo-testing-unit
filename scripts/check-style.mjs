#!/usr/bin/env node
/* The style meter against five kinds of player (pure Node): the model in kernel/style_model.js
   is stepped at 20 Hz through a simulated stretch of play and the ranks it reaches are read off. */
import { RANKS, TOP, newRun, hit, frame, effective } from '../kernel/style_model.js';

let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };

/* play: (second) -> files deleted at that second (0 for none). Returns {top (highest rank), at (seconds spent at the top), reached (seconds to first rank r)}. */
function run(play, secs) {
  const s = newRun(), reached = {};
  let top = -1, atTop = 0, maxHold = 0, sum = 0, cnt = 0;
  for (let t = 0; t < secs; t += 0.05) {
    const n = play(t, s);
    if (n) hit(s, n, t);
    frame(s, 0.05, t);
    if (t > secs / 2) { sum += s.tier; cnt++; }
    if (s.tier > top) top = s.tier;
    if (s.tier >= 0 && reached[s.tier] == null) reached[s.tier] = t;
    if (s.tier === TOP) atTop += 0.05;
    maxHold = Math.max(maxHold, s.atTop);
  }
  return { top, atTop, reached, maxHold, s, avg: sum / Math.max(1, cnt) };
}
const every = (period, n, from) => { let next = from || 0; return t => { if (t < next) return 0; next += period; return typeof n === 'function' ? n() : n; }; };

/* the ranks get further apart, and every one is harder to hold */
const spans = RANKS.slice(1).map((r, i) => r.at - RANKS[i].at);
ok(spans.every((x, i) => i === 0 || x > spans[i - 1]), 'each rank is further from the last than the one before it: ' + spans.join(', '));
ok(RANKS.every((r, i) => i === 0 || (r.drain > RANKS[i - 1].drain && r.grace < RANKS[i - 1].grace && r.gain <= RANKS[i - 1].gain)), 'the bleed is steeper, the grace shorter and a file worth less at every rank');
ok(effective(12) === 12 && effective(20) > 16 && effective(80) < 60 && effective(80) > effective(50), 'a pile is worth more than its parts but not in proportion (20 -> ' + effective(20).toFixed(1) + ', 50 -> ' + effective(50).toFixed(1) + ', 80 -> ' + effective(80).toFixed(1) + ')');

/* seeded, so the same numbers come out every time */
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

/* one file a second, forever */
const slow = run(every(1, 1), 600);
ok(slow.avg >= 3 && slow.avg <= 4.6, 'one file a second for ten minutes settles around A to S (average rank ' + slow.avg.toFixed(1) + ')');
const two = run(every(0.5, 1), 300);
ok(two.avg <= 5.9 && two.atTop / 300 < 0.1, 'two a second settles at SS to SSS and is hardly ever at the top (average rank ' + two.avg.toFixed(1) + ', ' + (two.atTop / 3).toFixed(0) + '% at the top)');
const flurry = run(every(0.33, 1), 180);
ok(flurry.atTop / 180 < 0.5, 'even three a second, which a hand cannot keep up, is not at the top for more than half of three minutes (' + (flurry.atTop / 180 * 100).toFixed(0) + '%)');
const piles10 = run(every(10, 30), 300);
ok(piles10.atTop / 300 < 0.4, 'a pile of thirty every ten seconds cannot hold the top (' + (piles10.atTop / 3).toFixed(0) + '% of five minutes)');
const piles = run(every(4, 40), 300);
ok(piles.top === TOP && piles.atTop > 60, 'forty files every four seconds reaches HAPPY BIRTHDAY and stays (' + piles.atTop.toFixed(0) + ' s of 300)');
let held = 0, reachedAll = 0; const TRIALS = 40;
for (let i = 0; i < TRIALS; i++) {
  const r = run(every(5, () => 20 + Math.floor(rnd() * 61)), 240);
  if (r.top === TOP) reachedAll++;
  if (r.maxHold >= 60) held++;
}
ok(reachedAll >= TRIALS * 0.9, 'piles of twenty to eighty every five seconds reach the top (' + reachedAll + ' of ' + TRIALS + ' runs)');
ok(held >= TRIALS * 0.6, 'and hold it for a minute and more, which is what the glitch waits for (' + held + ' of ' + TRIALS + ')');
let seven = 0;
for (let i = 0; i < TRIALS; i++) { const r = run(every(8, () => 20 + Math.floor(rnd() * 61)), 240); if (r.maxHold >= 60) seven++; }
ok(seven <= TRIALS * 0.25, 'but one pile every eight seconds cannot (' + seven + ' of ' + TRIALS + ' held it a minute)');
const q = every(2, 40), quit = run(t => t < 40 ? q(t) : 0, 120);
ok(quit.s.tier === -1 || quit.s.pts < 100, 'stop for a while and the meter is gone');
console.log(bad ? bad + ' FAILED' : 'all good');
process.exit(bad ? 1 : 0);
