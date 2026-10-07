/* node apps/magen/auto_check.js: the auto-press ladder, its unlock, and the rates tooltip (pure Node) */
import { AUTO_LEVELS, AUTO_UNLOCK, autoUnlocked, autoGap, autoRate, autoNext, owed } from './auto.js';
import { ratesHtml } from './rates.js';
let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };

ok(AUTO_UNLOCK === 1000 && !autoUnlocked(999) && autoUnlocked(1000), 'it opens at a thousand presses by hand, not before');
ok(autoNext(999, 0) === null, 'nothing is for sale before that');
ok(autoNext(1000, 0).id === 'au1' && autoNext(5000, 3).id === 'au4' && autoNext(5000, 6) === null, 'the next level on sale is the one after the level held, and the ladder ends');
ok(AUTO_LEVELS.every((l, i) => i === 0 || (l.gap < AUTO_LEVELS[i - 1].gap && l.cost > AUTO_LEVELS[i - 1].cost)), 'every level presses faster and costs more than the one before');
ok(autoGap(0) === Infinity && autoRate(0) === 0, 'not bought: it never presses');
ok(autoRate(1) > 1 && autoRate(6) > autoRate(1) * 8 && autoRate(6) < 25, `the top level is a hand's blur, not a machine gun (${autoRate(1).toFixed(1)} to ${autoRate(6).toFixed(1)} a second)`);
/* a held button across 10 s at 30 fps presses the number of times the level says, give or take one */
for (let L = 1; L <= 6; L++) {
  let timer = autoGap(L), n = 0;
  for (let i = 0; i < 300; i++) { const o = owed(timer, 1 / 30, autoGap(L)); n += o.n; timer = o.timer; }
  ok(Math.abs(n - autoRate(L) * 10) <= 2 + autoRate(L) * 0.35, `level ${L}: ${n} presses in ten seconds (${(autoRate(L) * 10).toFixed(0)} expected)`);
}
const fmt = n => String(Math.round(n * 100) / 100);
const m = { mps: 2, raw: 2, resting: false, perPress: 5, crit: 0.05, autoLvl: 2, autoPerSec: 2.5, autoOpen: true, clicks: 1200, autoNeed: 1000,
            top: [{ n: 'KIPPAH', v: 1, pct: 50 }], kav: 1, zech: 1, other: 1, global: 1, offline: 0.4 };
const h = ratesHtml(m, fmt);
ok(h.includes('per minute') && h.includes('120') && h.includes('per hour') && h.includes('7200'), 'the tooltip gives the minute and the hour off the second');
ok(h.includes('auto-press') && h.includes('level 2') && h.includes('KIPPAH') && h.includes('40%'), 'and the auto-press, what makes the rate, and the offline share');
ok(ratesHtml(Object.assign({}, m, { autoLvl: 0, autoOpen: false, clicks: 400 }), fmt).includes('400 / 1000'), 'locked, it says how far the thousand has got');
console.log(bad ? bad + ' FAILED' : 'all good');
process.exit(bad ? 1 : 0);
