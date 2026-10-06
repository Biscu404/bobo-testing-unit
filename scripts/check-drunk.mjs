#!/usr/bin/env node
/* The Jäger journey, held to its numbers (pure Node, no browser).
   Drinking as fast as the app allows must take minutes, not seconds; a steady
   pace of one measure a minute must never black out; and it must not be possible
   to hurry the thing by clicking, which is the app's job (apps/bottle: nothing is
   queued, and a breather follows every measure) and is simulated here by the cycle. */
import { BAC, newBlood, swallow, step, over, felt, levelOf, stageOf, wake } from '../kernel/drunk_bac.js';

let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };

/* seconds from the first measure to the floor at one measure every `cycle` seconds, or Infinity */
function toFloor(cycle, cap = 7200) {
  const b = newBlood(); const dt = 0.1; let t = 0, next = 0, n = 0; const seen = new Set();
  while (t < cap) {
    if (t >= next) { swallow(b); n++; next += cycle; }
    step(b, dt); t += dt; seen.add(stageOf(b));
    if (over(b)) return { t, n, stages: seen.size };
  }
  return { t: Infinity, n, stages: seen.size, felt: felt(b) };
}
const fast = toFloor(12.6);                   /* pour 4.3 s + drink 4.6 s + the breather 3.5 s, measured in the app */
ok(fast.t > 330 && fast.t < 480, 'one every 12.6 s (as fast as the app allows): ' + fast.t.toFixed(0) + ' s, ' + fast.n + ' measures');
ok(fast.stages >= 7, 'every stage is passed through on the way (' + fast.stages + ')');
ok(toFloor(60).t === Infinity, 'one a minute never gets there (settles at ' + toFloor(60).felt.toFixed(1) + ')');
ok(toFloor(25).t > 900, 'one every 25 s takes a quarter of an hour or more: ' + toFloor(25).t.toFixed(0) + ' s');
const b = newBlood(); for (let i = 0; i < 12; i++) swallow(b); for (let i = 0; i < 6000; i++) step(b, 0.1);
ok(felt(b) < 0.5, 'twelve measures and ten minutes of rest: all but gone (' + felt(b).toFixed(2) + ')');
const w = newBlood(); wake(w);
ok(levelOf(w) > 0.3 && levelOf(w) < 0.7 && !over(w), 'waking from a blackout is rough, not clean (level ' + levelOf(w).toFixed(2) + ')');
const one = newBlood(); swallow(one);
ok(levelOf(one) < 0.12, 'a single measure barely shows (' + levelOf(one).toFixed(2) + ')');
console.log(bad ? bad + ' FAILED' : 'all good');
process.exit(bad ? 1 : 0);
