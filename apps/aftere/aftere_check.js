/* node apps/aftere/aftere_check.js — the five ways across, flown in Node.
 *
 * A bot that can see everything a player can (the next gap and where it will be, the locusts coming) and is held to the
 * ship's own speed clears every tier nine times in ten or better; one that does nothing clears none of the tiers that ask
 * for anything; the gaps never ask for more than the ship can fly; the pay climbs a minute at a time; and the same seed
 * flies the same run. */
import { LEVELS, rate, secs, payout, FLAWLESS } from './levels.js';
import { createRun, stepRun, arrange, maxShift, SHIP_X, RING } from './sim.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };
const seeded = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* where the next doorway's middle will be when the ship gets there */
function target(r) {
  const L = r.L;
  const p = r.pillars.filter(q => !q.off && q.x > (L.centred ? 14 : 6)).sort((a, b) => a.x - b.x)[0];
  if (!p) return { y: r.y, p: null };
  const f = Math.max(0, (p.x - SHIP_X) / L.speed);
  const c = L.centred ? 100 : p.base + (p.wob ? p.wob * Math.sin(p.ph + (r.t + f) * 0.045) : 0);
  return { y: c, p, half: p.gap / 2 };
}
function bot(r) {
  const t = target(r);
  if (!t.p) return r.y;
  let best = t.y, bestRisk = Infinity;
  for (let k = -4; k <= 4; k++) {
    const y = t.y + k * Math.max(0, t.half - 8) / 4;
    let risk = Math.abs(k) * 0.01;
    r.locusts.forEach(l => { const f = (l.x - SHIP_X) / l.v; if (f > -4 && f < 70 && Math.abs(l.y - y) < 13) risk += 10 - f * 0.1; });
    if (risk < bestRisk) { bestRisk = risk; best = y; }
  }
  return best;
}
function fly(L, seed, brain) {
  const r = createRun(L, seeded(seed));
  for (let n = 0; n < 60 * 400 && !r.dead && !r.won; n++) stepRun(r, { aim: brain(r), dir: 0 });
  return r;
}

const N = 120;
LEVELS.forEach(L => {
  let won = 0, hits = 0;
  for (let s = 1; s <= N; s++) { const r = fly(L, s, bot); if (r.won) won++; hits += r.hits; }
  ok(won / N >= 0.9, L.name + ': a bot that sees the doorways clears ' + won + ' of ' + N);
});
LEVELS.slice(1).forEach(L => {
  let won = 0;
  for (let s = 1; s <= 40; s++) if (fly(L, s, r => 100).won) won++;
  ok(won === 0, L.name + ': sitting still clears none (' + won + ' of 40)');
});

/* nothing is asked that the ship cannot fly: between two doorways it has (space - 40) pixels of world to cross the difference
   between the nearest edges, at the speed it is given, and the tier may lean on only most of that */
LEVELS.slice(1).forEach(L => {
  let worst = 0, longest = 0;
  for (let s = 1; s <= 40; s++) {
    const r = createRun(L, seeded(s)), seq = [];
    for (let i = 0; i < 300; i++) { const p = { x: 340 + (RING + i) * L.space }; arrange(r, p); if (!p.off) seq.push(p); }
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1], b = seq[i];
      const need = Math.max(0, Math.abs(b.base - a.base) + a.wob + b.wob - a.gap / 2 - b.gap / 2);
      worst = Math.max(worst, need / (L.follow * (L.space - 40) / L.speed));
      longest = Math.max(longest, Math.abs(b.base - a.base));
    }
  }
  ok(worst <= 0.8, L.name + ': the hardest change of doorway uses ' + Math.round(worst * 100) + '% of what the ship can fly (shift at most ' + Math.round(longest) + ' of ' + Math.round(maxShift(L)) + ')');
  ok(longest <= maxShift(L) + 1e-6, L.name + ': no gap sits further from the last than maxShift');
});

/* the ladder */
for (let i = 1; i < LEVELS.length; i++) {
  const a = LEVELS[i - 1], b = LEVELS[i];
  ok(b.pay > a.pay && b.first >= a.first && b.speed > a.speed && b.gap[1] < a.gap[1] && b.follow < a.follow, b.name + ' pays more, runs faster, and asks more than ' + a.name);
  ok(rate(b) > rate(a) * 1.5, b.name + ' is worth ' + Math.round(rate(b)) + ' sun a minute, over half as much again as ' + a.name + "'s " + Math.round(rate(a)));
}
ok(Math.round(secs(LEVELS[0])) === 18 && LEVELS[0].pay === 50, 'PILGRIM is the game it was: 18 seconds, 50 sun');
const T = LEVELS[4];
const win = { won: true, coins: 100, hits: 0 }, dead = { won: false, coins: 100, hits: 3 };
ok(payout(T, win, true).total === T.pay + 100 * T.coin + Math.round(T.pay * FLAWLESS) + T.first, 'a first, flawless clear pays everything: ' + payout(T, win, true).total);
ok(payout(T, win, false).first === 0 && payout(T, { ...win, hits: 1 }, false).flawless === 0, 'later clears do not pay the first-clear bonus, and a hit loses the flawless one');
ok(payout(T, dead, false).total === Math.round(100 * T.coin * 0.5) && payout(T, dead, false).base === 0, 'dying in the pillars keeps half the coins and nothing else');
ok(payout(LEVELS[0], { won: true, coins: 0, hits: 0 }, true).total === 50, 'PILGRIM pays exactly 50 whatever the bonuses');

/* the same seed is the same run */
const a = fly(LEVELS[3], 7, bot), b = fly(LEVELS[3], 7, bot);
ok(a.t === b.t && a.coins === b.coins && a.hits === b.hits && a.dist === b.dist, 'the same seed flies the same run');

console.log(fails ? fails + ' failed' : 'All checks pass.');
process.exit(fails ? 1 : 0);
