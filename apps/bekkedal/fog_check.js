/* node apps/bekkedal/fog_check.js — the mist is banks, not a grid: it varies, it drifts slowly, it is never clear and never a wall. */
import { fogLevel, FOG_MIN, FOG_MAX, FOG_BLOCK } from './fog.js';
let bad = 0;
const ok = (c, m, d) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (d ? '  ' + d : '')); if (!c) bad++; };
const COLS = Math.ceil(960 / FOG_BLOCK), ROWS = Math.ceil(480 / FOG_BLOCK);
const field = t => { const f = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) f.push(fogLevel(x, y, t)); return f; };
ok(960 % FOG_BLOCK === 0 && FOG_BLOCK % 8 === 0, 'a block is a whole number of dither tiles');
let lo = 99, hi = 0, sum = 0, n = 0, steps = 0, big = 0;
for (let t = 0; t < 600; t += 7) {
  const f = field(t);
  f.forEach((v, i) => { lo = Math.min(lo, v); hi = Math.max(hi, v); sum += v; n++; if (i % COLS && Math.abs(v - f[i - 1]) > 0) steps++; if (i % COLS && Math.abs(v - f[i - 1]) > 2) big++; });
}
ok(lo >= FOG_MIN && hi <= FOG_MAX, 'strength stays in its band', lo + '..' + hi);
ok(hi - lo >= 4, 'it is thick in places and thin in others', 'spread ' + (hi - lo));
ok(sum / n > 1.8 && sum / n < 5, 'a veil everywhere, a wall nowhere', 'mean ' + (sum / n).toFixed(2) + ' of 16');
ok(big / n < 0.02, 'neighbouring blocks seldom jump more than two sixteenths (no visible block edges)', (100 * big / n).toFixed(2) + '% do');
const a = field(0), b = field(1), c = field(60);
const d = (p, q) => p.reduce((s, v, i) => s + Math.abs(v - q[i]), 0) / p.length;
ok(d(a, b) < 0.3, 'in a second it barely moves', d(a, b).toFixed(2));
ok(d(a, c) > 0.6, 'in a minute it has drifted', d(a, c).toFixed(2));
ok(JSON.stringify(field(5)) === JSON.stringify(field(5)), 'same time, same mist');
if (bad) { console.log(bad + ' failed'); process.exit(1); }
console.log('All fog checks pass.');
