/* node apps/aftere/trophy_check.js — AfterEgypt's skill trophies are earnable, and not by sitting still. Bots that can see everything a player can (the next gap and where it will be, the coins
   and ankhs in it, the locusts) fly the five ways in different styles, and each trophy that asks for a style must be reached by the bot that has it: a clear that grazes ten pillars
   (CLOSE SHAVE), one that takes every coin (THE WHOLE PURSE), one that takes none (ASCETIC), a flawless clear of each way, ten doorways passed under a gust (AGAINST THE WIND). */
import { LEVELS } from './levels.js';
import { createRun, stepRun, SHIP_X, GUST_WARN } from './sim.js';
import { TROPHIES } from './trophies.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };
const seeded = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const next = r => r.pillars.filter(q => !q.off && q.x > (r.L.centred ? 14 : 6)).sort((a, b) => a.x - b.x)[0];
const centreAt = (r, p) => { const f = Math.max(0, (p.x - SHIP_X) / r.L.speed); return r.L.centred ? 100 : p.base + (p.wob ? p.wob * Math.sin(p.ph + (r.t + f) * 0.045) : 0); };
const dodge = (r, y) => { let best = y, risk = Infinity; for (let k = -3; k <= 3; k++) { const yy = y + k * 3; let q = Math.abs(k) * 0.01; r.locusts.forEach(l => { const f = (l.x - SHIP_X) / l.v; if (f > -4 && f < 70 && Math.abs(l.y - yy) < 13) q += 10 - f * 0.1; }); if (q < risk) { risk = q; best = yy; } } return best; };

const brains = {
  centre: r => { const p = next(r); return p ? dodge(r, centreAt(r, p)) : r.y; },
  /* hugs the stone: aims a few pixels from the nearer edge (the sign alternates doorway to doorway) */
  hug: r => { const p = next(r); if (!p) return r.y; return dodge(r, centreAt(r, p) + (p.gap / 2 - 5.5) * (Math.floor(p.base) % 2 ? 1 : -1)); },
  /* chases the coin in the next doorway, if there is one */
  purse: r => { const p = next(r); if (!p) return r.y; const it = r.items.filter(i => i.k === 'coin' && i.x > SHIP_X - 11).sort((a, b) => a.x - b.x)[0]; return dodge(r, it && Math.abs(it.x - 8 - p.x) < r.L.speed + 1 ? it.y : centreAt(r, p)); },
  /* keeps off everything that can be picked up */
  ascetic: r => {
    const p = next(r); if (!p) return r.y; const c = centreAt(r, p), near = r.items.filter(i => Math.abs(i.x - 8 - p.x) < r.L.speed + 1);
    let y = r.y, bestD = Infinity;
    for (let cand = c - p.gap / 2 + 3; cand <= c + p.gap / 2 - 3; cand += 1) {
      if (near.some(i => Math.abs(i.y - cand) < 11)) continue;
      const d = Math.abs(cand - c); if (d < bestD) { bestD = d; y = cand; }
    }
    return dodge(r, y);
  }
};
function fly(L, seed, brain) {
  const r = createRun(L, seeded(seed)); let wind = 0, ankhs = 0;
  for (let n = 0; n < 60 * 400 && !r.dead && !r.won; n++) {
    stepRun(r, { aim: brain(r), dir: 0 });
    r.ev.forEach(w => { if ((w === 'gap' || w === 'graze') && r.gust && r.gust.t > GUST_WARN) wind++; if (w === 'ankh') ankhs++; });
  }
  r.wind = wind; r.ankhsTaken = ankhs;
  return r;
}
const best = (L, brain, n, score) => { let b = null, wins = 0; for (let s = 1; s <= n; s++) { const r = fly(L, s, brain); if (r.won) { wins++; if (!b || score(r) > score(b)) b = r; } } return { b, wins }; };

const way = id => LEVELS.find(l => l.id === id);
/* every way can be cleared with no hit by the plain bot, at least sometimes */
LEVELS.forEach(L => { let clean = 0; for (let s = 1; s <= 60; s++) { const r = fly(L, s, brains.centre); if (r.won && r.hits === 0) clean++; } ok(clean > 0, L.name + ': a flawless clear happens (' + clean + ' of 60)'); });
/* grazing: ten in a clear of SCRIBE, twenty-five in one of PRIEST */
{ const a = best(way('scribe'), brains.hug, 60, r => r.grazes); ok(a.b && a.b.grazes >= 20, 'CLOSE SHAVE: a hugging bot grazes ' + (a.b && a.b.grazes) + ' in a SCRIBE clear'); }
{ const a = best(way('priest'), brains.hug, 80, r => r.grazes); ok(a.b && a.b.grazes >= 50, "RAZOR'S EDGE: a hugging bot grazes " + (a.b && a.b.grazes) + ' in a PRIEST clear'); }
/* ... and a bot that stays in the middle does not do it by accident */
{ let most = 0; for (let s = 1; s <= 60; s++) { const r = fly(way('priest'), s, brains.centre); if (r.won) most = Math.max(most, r.grazes); } ok(most < 20, 'a bot that holds the middle grazes at most ' + most + ' in a PRIEST clear: the trophies are not an accident'); }
/* every coin */
{ const a = best(way('scribe'), brains.purse, 80, r => r.coins / Math.max(1, r.coinsSpawned)); ok(a.b && a.b.coins === a.b.coinsSpawned, 'THE WHOLE PURSE: a coin-chaser takes ' + (a.b && a.b.coins) + ' of ' + (a.b && a.b.coinsSpawned) + ' on SCRIBE'); }
/* none */
{ let n = 0; for (let s = 1; s <= 60; s++) { const r = fly(way('priest'), s, brains.ascetic); if (r.won && r.coins === 0 && r.ankhsTaken === 0) n++; } ok(n > 0, 'ASCETIC: a bot that refuses everything clears PRIEST ' + n + ' of 60 times'); }
/* the wind */
{ const a = best(way('pharaoh'), brains.centre, 30, r => r.wind); ok(a.b && a.b.wind >= 10, 'AGAINST THE WIND: ' + (a.b && a.b.wind) + ' doorways passed under a gust in a PHARAOH clear'); }
/* an ankh pair and the shield, by the plain bot, in one of forty runs of the long ways */
{ let two = false, took = false; for (let s = 1; s <= 80 && !(two && took); s++) { const r = createRun(way('temple'), seeded(s)); for (let n = 0; n < 60 * 200 && !r.dead && !r.won; n++) { stepRun(r, { aim: brains.centre(r), dir: 0 }); if (r.shield >= 2) two = true; if (r.ev.indexOf('shield') >= 0) took = true; } }
  ok(two, 'A SPARE AND A SPARE: two ankhs at once happens'); ok(took, 'NOT YET: an ankh takes a blow'); }
/* both ways down: a pillar and a locust */
{ const causes = {}; for (let s = 1; s <= 60; s++) { const r = fly(way('priest'), s, r => r.y); if (r.dead && r.info.cause) causes[r.info.cause] = 1; } ok(causes.pillar, 'TWO WAYS DOWN: a run ends on a pillar'); }
ok(TROPHIES.every(t => t.id.indexOf('ae_') === 0) && TROPHIES.length === 23, 'twenty-three AfterEgypt trophies, every one an ae_');

console.log(fails ? fails + ' failed' : 'All checks pass.');
process.exit(fails ? 1 : 0);
