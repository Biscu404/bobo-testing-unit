/* node apps/bottle/styles_check.js -- the fifteen hands of THE BOTTLE (pure Node: no canvas).
   THE FIFTEEN   fifteen styles, each its own (a different name, and a different motion), reached one band of drunkenness at a time, 0 to 1
   THE SOBER ONE style 0 is the way it always went: 3.5 s a drink, a straight line, nothing wandering
   NEVER FASTER  no style is quicker than the sober hand at anything (a carry, a way back, a drink), however drunk; every one starts at nothing and ends at the whole way
   THOUGHTS      a second thought is a real step back (the way goes down and then up again), and the ones with none never go back
   THE LIMITS    the slowest drink is a drink and not an evening, and the hand is where a hand can be */
import { STYLES, STYLE_COUNT, styleIndex, styleOf, schedule, progress, hand, circle, bump, slipDown, tipError, overshoot } from './styles.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(80) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const drink = st => schedule(st, 3.5, 1), carry = st => schedule(st, 0.7, 0.5), back = st => schedule(Object.assign({}, st, { thoughts: [], lead: 0, tail: 0, fumble: null }), 0.6, 1);

console.log('-- the fifteen --');
ok(STYLES.length === 15 && STYLE_COUNT === 15, 'fifteen styles');
ok(new Set(STYLES.map(s => s.id)).size === 15 && new Set(STYLES.map(s => s.name)).size === 15 && STYLES.every(s => s.name === s.name.toUpperCase() && s.name.length <= 18), 'each with a name of its own, in capitals, that fits the line it is shown on', STYLES.map(s => s.name).join(', '));
ok([0, 0.0667, 0.5, 0.9333, 1].map(styleIndex).join() === '1,1,7,13,14'.replace('1,1', '0,1') || [0, 0.0667, 0.5, 0.9333, 1].map(styleIndex).join() === '0,1,7,14,14', 'a level of 0 is the first and a level of 1 the last', [0, 0.0667, 0.5, 0.9333, 1].map(styleIndex).join());
{ let last = -1, mono = true; const seen = new Set(); for (let l = 0; l <= 1.0001; l += 0.001) { const i = styleIndex(l); if (i < last) mono = false; last = i; seen.add(i); } ok(mono && seen.size === 15, 'as it gets drunker the hand only ever moves on, and all fifteen are reached'); }
ok(styleOf(0) === STYLES[0] && styleOf(1) === STYLES[14] && styleOf(NaN) === STYLES[0] && styleOf(-3) === STYLES[0] && styleOf(9) === STYLES[14], 'a level that is nonsense is the nearest hand, never an error');
/* every style is a different motion: sampled over a measure, no two traces are the same */
const trace = st => { const out = []; const sch = drink(st); for (let t = 0; t < 12; t += 0.25) { const h = hand(st, t, 3), c = circle(st, t, 3); out.push([progress(sch, t), h.x, h.a, c.x, c.y, slipDown(st, t / 12), tipError(st, t, 3), overshoot(st, t / 12)].map(v => Math.round(v * 1000) / 1000).join(':')); } return out.join('|'); };
{ const traces = STYLES.map(trace); let nearest = Infinity; for (let i = 0; i < 15; i++) for (let j = i + 1; j < 15; j++) { const a = traces[i].split('|'), b = traces[j].split('|'); let d = 0; a.forEach((x, k) => { if (x !== b[k]) d++; }); nearest = Math.min(nearest, d); }
  ok(new Set(traces).size === 15 && nearest >= 10, 'no two of them move the same way: the likest pair differs in ' + nearest + ' of 48 samples'); }

console.log('\n-- the sober one --');
{
  const st = STYLES[0], d = drink(st);
  ok(d.T === 3.5 && carry(st).T === 0.7 && back(st).T === 0.6, 'a drink is 3.5 s, a carry 0.7 s, the way back 0.6 s');
  let straight = true; for (let t = 0; t <= 3.5; t += 0.1) if (Math.abs(progress(d, t) - t / 3.5) > 1e-9) straight = false;
  ok(straight, 'and the way goes at one pace from nothing to the whole (progress is the clock over the length)');
  let still = true; for (let t = 0; t < 8; t += 0.3) { const h = hand(st, t, 5), c = circle(st, t, 5); if (h.x !== 0 || h.a !== 0 || c.x !== 0 || c.y !== 0 || tipError(st, t, 5) !== 0) still = false; }
  ok(still && slipDown(st, 0.3) === 0 && overshoot(st, 0.6) === 0, 'it does not wander, rock, circle, slip or overshoot');
}

console.log('\n-- never faster --');
{
  const slower = STYLES.every(st => drink(st).T >= 3.5 && carry(st).T >= 0.7 && back(st).T >= 0.6 && st.pace >= 1);
  ok(slower, 'no hand is quicker than the sober one at a drink, a carry or the way back');
  ok(STYLES.every((s, i) => i === 0 || s.pace >= STYLES[i - 1].pace), 'and the pace only ever goes up with drink');
  let ends = true, cont = true;
  STYLES.forEach(st => [drink(st), carry(st), back(st)].forEach(sch => {
    if (progress(sch, 0) !== 0 || progress(sch, sch.T) !== 1 || progress(sch, sch.T + 5) !== 1) ends = false;
    for (let t = 0; t < sch.T; t += 0.02) if (Math.abs(progress(sch, t + 0.02) - progress(sch, t)) > 0.1) cont = false;
  }));
  ok(ends, 'every one begins at nothing and ends at the whole way, and stays there');
  ok(cont, 'and none of them jumps: the biggest step in a fiftieth of a second is a tenth of the way');
  const T = STYLES.map(s => drink(s).T);
  ok(T[14] > 2.4 * T[0] && T[7] > T[3], 'the last one is the slowest of the sort (' + T[14].toFixed(1) + ' s), second thoughts take longer than a loose wrist (' + T[7].toFixed(1) + ' against ' + T[3].toFixed(1) + ')');
}

console.log('\n-- second thoughts --');
{
  const goesBack = (st, sch) => { for (let t = 0; t < sch.T; t += 0.02) if (progress(sch, t + 0.02) < progress(sch, t) - 1e-9) return true; return false; };
  ok(STYLES.every(st => goesBack(st, drink(st)) === st.thoughts.some(th => th.back > 0)), 'a hand with a second thought goes back on itself in the drink, and one without never does');
  ok(STYLES.slice(0, 6).every(st => !st.thoughts.some(th => th.back > 0.1)), 'the first six hands have none worth the name');
  const t7 = STYLES[7], sch = drink(t7), at = t7.thoughts[0].at;
  let peak = 0, low = 1, seenPeak = false, dipped = false;
  for (let t = 0; t < sch.T; t += 0.01) { const p = progress(sch, t); if (p > peak) peak = p; if (peak >= at - 0.01) seenPeak = true; if (seenPeak && p < peak - t7.thoughts[0].back * 0.8) dipped = true; low = Math.min(low, p); }
  ok(dipped && peak <= 1, 'the seventh stops at ' + Math.round(at * 100) + '% of the way and takes back ' + Math.round(t7.thoughts[0].back * 100) + '% of it before it goes on');
  const holds = (() => { let longest = 0, run = 0; for (let t = 0.3; t < sch.T; t += 0.01) { if (Math.abs(progress(sch, t) - progress(sch, t - 0.01)) < 1e-9) run += 0.01; else run = 0; longest = Math.max(longest, run); } return longest; })();
  ok(holds >= 0.4, 'and it waits there (a stillness of ' + holds.toFixed(2) + ' s)');
}

console.log('\n-- the limits --');
{
  ok(STYLES.every(st => drink(st).T <= 11 && carry(st).T <= 4 && back(st).T <= 1), 'the slowest drink is ' + Math.max(...STYLES.map(s => drink(s).T)).toFixed(1) + ' s, the slowest carry ' + Math.max(...STYLES.map(s => carry(s).T)).toFixed(1) + ' s');
  let inside = true;
  STYLES.forEach(st => { for (let t = 0; t < 12; t += 0.05) { const h = hand(st, t, 11), c = circle(st, t, 11); if (Math.abs(h.x) > st.sway + 1e-9 || Math.abs(h.a) > st.rock + 1e-9 || Math.hypot(c.x, c.y) > st.orbit + 1e-9) inside = false; } });
  ok(inside, 'the hand never wanders further than its style says');
  ok(bump(0) === 0 && bump(1) === 0 && bump(0.5) === 1 && bump(-1) === 0 && bump(2) === 0, 'a slip or a swing starts and ends at nothing');
  ok(STYLES.filter(s => s.fumble).every(s => s.fumble.depth <= 44 && s.fumble.at > 0.2 && s.fumble.at < 0.8), 'a bottle slips only part of the way down, in the middle of the carry', STYLES.filter(s => s.fumble).map(s => s.name).join(', '));
  ok(STYLES.every(s => s.thoughts.every(th => th.at > 0.1 && th.at < 0.95 && th.back >= 0 && th.back < th.at && th.hold <= 1)), 'a second thought is somewhere on the way, goes back less than it has come and waits under a second');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nthe hands: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
