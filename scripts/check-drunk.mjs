#!/usr/bin/env node
/* The Jäger journey, held to its numbers (pure Node, no browser).
   Drinking as fast as the app allows must take a couple of minutes, not seconds, and must
   end in a blackout before the first bottle (seventeen measures) is gone; a leisurely
   pace of one measure every twenty seconds must still get there inside the bottle; a steady
   pace of one measure a minute must never black out; and it must not be possible to hurry
   the thing by clicking, which is the app's job (apps/bottle: nothing is queued, and a
   breather follows every measure) and is simulated here by the cycle. */
import { BAC, newBlood, swallow, step, over, felt, levelOf, stageOf, wake } from '../kernel/drunk_bac.js';
import { styleOf, styleIndex, schedule } from '../apps/bottle/styles.js';

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
const BOTTLE = Math.floor(700 / 40);               /* measures in a bottle: JAG_FULL / JAG_SHOT in apps/bottle/physics.js */
const fast = toFloor(9.6);                    /* pour 3.5 s + drink 3.5 s + the breather 2.6 s, measured in the app */
ok(fast.t > 90 && fast.t < 160, 'one every 9.6 s (as fast as the app allows): ' + fast.t.toFixed(0) + ' s, ' + fast.n + ' measures');
ok(fast.n >= 10 && fast.n <= BOTTLE - 2, 'blackout comes with a few measures to spare in one bottle (' + fast.n + ' of ' + BOTTLE + ')');
ok(fast.stages >= 7, 'every stage is passed through on the way (' + fast.stages + ')');
const easy = toFloor(20);
ok(easy.n <= BOTTLE, 'even one every 20 s is out inside the bottle: ' + easy.n + ' of ' + BOTTLE + ' measures, ' + easy.t.toFixed(0) + ' s');
ok(toFloor(60).t === Infinity, 'one a minute never gets there (settles at ' + toFloor(60).felt.toFixed(1) + ')');
ok(toFloor(45).t > 600, 'one every 45 s is slow enough to take ten minutes or more: ' + toFloor(45).t.toFixed(0) + ' s');
/* ...and the same with the hands: the drunker, the slower each measure goes (apps/bottle/styles.js: fifteen hands, none ever quicker than the sober one), so the journey can only be
   longer than the cycle above, never shorter, and must still end inside one bottle */
{
  const cycleOf = lvl => { const st = styleOf(lvl);
    const pour = 3.5 + (schedule(st, 0.7, 0.5).T - 0.7) + (schedule(Object.assign({}, st, { thoughts: [], lead: 0, tail: 0 }), 0.6, 1).T - 0.6) + 0.3 * styleIndex(lvl) / 14;
    return pour + schedule(st, 3.5, 1).T + 2.6; };
  const bb = newBlood(); let t = 0, next = 0, n = 0, hands = new Set(), longest = 0;
  while (t < 3600 && !over(bb)) {
    if (t >= next) { const c = cycleOf(levelOf(bb)); hands.add(styleIndex(levelOf(bb))); longest = Math.max(longest, c); swallow(bb); n++; next = t + c; }
    step(bb, 0.1); t += 0.1;
  }
  ok(over(bb) && n >= 10 && n <= BOTTLE - 2, 'with the hands slowing as it goes, non-stop drinking is still out inside the bottle: ' + n + ' of ' + BOTTLE + ' measures, ' + t.toFixed(0) + ' s');
  ok(t >= fast.t - 1 && t < 220, 'and it takes longer than the sober cycle did, never less (' + t.toFixed(0) + ' s against ' + fast.t.toFixed(0) + '), under four minutes');
  ok(hands.size >= 10, 'on the way it goes through ' + hands.size + ' of the fifteen hands, the slowest cycle ' + longest.toFixed(1) + ' s');
}
const b = newBlood(); for (let i = 0; i < 8; i++) swallow(b); for (let i = 0; i < 6000; i++) step(b, 0.1);
ok(felt(b) < 0.5, 'eight measures and ten minutes of rest: all but gone (' + felt(b).toFixed(2) + ')');
const w = newBlood(); wake(w);
ok(levelOf(w) > 0.3 && levelOf(w) < 0.7 && !over(w), 'waking from a blackout is rough, not clean (level ' + levelOf(w).toFixed(2) + ')');
const one = newBlood(); swallow(one);
ok(levelOf(one) < 0.12, 'a single measure barely shows (' + levelOf(one).toFixed(2) + ')');
console.log(bad ? bad + ' FAILED' : 'all good');
process.exit(bad ? 1 : 0);
