/* node apps/garden/garden_check.js — how long the garden takes, measured on the real model with a player who is paying attention.
 *
 * The player visits every VISIT seconds, waters what is dry, sweeps every plant (a sweep chains: one more percent of the
 * price on each pot, up to a half) and then spends what it has on whichever of everything Dave and the bench sell is
 * worth the most a second for the price, replanting each room in the best arrangement it can find. Nothing here is a
 * number of the game: it all comes out of `cos_data.js`, `rooms.js`, `synergy.js` and `model.js`.
 *
 * What it holds the garden to:
 *   - a garden with every room, pot and plant bought but none of the late tools is a lot slower than one with them
 *     (the tools are why the third temple is a session and not a week)
 *   - fully equipped, the third temple's 99,999 SUN is about half an hour of a player who is paying attention
 *   - what you plant where matters: the best arrangement beats the same room planted with its best single plant, solid, in
 *     the pot you are given, by a wide margin, and which plant is best depends on the room
 *   - a night of being away is not the third temple on its own
 *   - synergy is exactly what it says (HOME, KIN, ROOTED, SET, BED, MATE), and the numbers do not drift
 */
import { SPECIES, POTS } from '../../kernel/cos_data.js';
import { ROOM_DEFS } from './rooms.js';
import { bonusFor, neighbours, HOME, KIN, ROOTED, SET, BED, MATE, POTS_PER_ROOM } from './synergy.js';
import * as M from './model.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };
const species = id => SPECIES.find(s => s.id === id), potById = id => POTS.find(p => p.id === id);
const w = { rooms: ROOM_DEFS, species, pot: potById, defaultPot: 'terra' };
let VISIT = 300;                     /* seconds between visits: 120 is a player who never looks away, 300 one who checks in, 900 one who is mostly elsewhere */
const GOAL = 99999, NIGHT = 0.395;
const approx = (a, b, e = 1e-9) => Math.abs(a - b) < e;

/* ---- synergy is what it says ---- */
{
  const def = ROOM_DEFS.find(d => d.id === 'shrine');
  const room = { pot: 'halo', pots: Array(POTS_PER_ROOM).fill(null) };
  room.pots[5] = { sp: 'thirdroot' };
  let b = bonusFor(room, def, species, 5);
  ok(approx(b.yield, HOME.yield * KIN.yield * ROOTED.yield) && approx(b.grow, HOME.grow), 'a plant in its home room and its kin pot is ROOTED: ' + b.tags.join(', '));
  room.pot = 'bone'; b = bonusFor(room, def, species, 5);
  ok(approx(b.yield, HOME.yield * SET.yield) && approx(b.grow, HOME.grow * SET.grow) && b.tags.includes('ROOM SET'), 'standing the room in its own pot sets it: ' + b.tags.join(', '));
  room.pot = 'halo'; room.pots[4] = { sp: 'thirdroot' }; room.pots[6] = { sp: 'halofern' }; room.pots[1] = { sp: 'thirdroot' }; room.pots[9] = { sp: 'halofern' };
  b = bonusFor(room, def, species, 5);
  ok(approx(b.yield, HOME.yield * KIN.yield * ROOTED.yield * (1 + 2 * BED.yield) * (1 + 2 * MATE.yield)) && approx(b.grow, HOME.grow * (1 + 2 * MATE.grow)), 'two of its kind and two mates beside it: ' + b.tags.join(', '));
  ok(neighbours(0).length === 2 && neighbours(5).length === 4 && neighbours(4).length === 3 && neighbours(11).length === 2, 'a corner has two neighbours, the middle four');
  ok(bonusFor({ pot: 'terra', pots: Array(12).fill(null) }, def, species, 0).yield === 1, 'an empty pot gets nothing');
}

/* ---- the best arrangement for a room, given what is owned ---- */
const ptsOf = (st, ri, pid, layout) => {
  const room = st.rooms[ri];
  room.pot = pid;
  for (let i = 0; i < POTS_PER_ROOM; i++) { const c = i % 4, r = (i / 4) | 0; room.pots[i] = { sp: (c + r) % 2 ? layout[1] : layout[0], watered: 0, grown: 0, acc: 0, tok: 0 }; }
};
/* sun a second this room makes when mature and kept wet; `mature` seconds to get there */
function roomRate(st, ri) {
  const room = st.rooms[ri], def = ROOM_DEFS[ri];
  let r = 0, mature = 0, tok = 0;
  room.pots.forEach((p, i) => {
    if (!p) return;
    const s = M.stats(w, st, ri, i), sp = species(p.sp), nf = sp.night && !def.buff.night ? NIGHT : 1;
    r += sp.yield * s.yield * (1 + (s.blessed || 0)) * s.grow / sp.drop * nf;
    tok += s.grow / sp.drop * nf;
    mature = Math.max(mature, 3 * sp.grow / s.grow);
  });
  return { r, mature, tok };
}
function bestLayout(ownedSp, ownedPot, ri, horizon = 1800) {
  let best = null;
  const st = M.fresh(ROOM_DEFS);
  for (const pid of ownedPot) {
    const options = [];
    for (const s of ownedSp) { options.push([s, s]); const m = species(s).mate; if (m && ownedSp.includes(m)) options.push([s, m]); }
    for (const lay of options) {
      ptsOf(st, ri, pid, lay);
      const { r, mature } = roomRate(st, ri), score = r * Math.max(0.05, 1 - mature / horizon);
      if (!best || score > best.score) best = { score, rate: r, mature, pid, layout: lay };
    }
  }
  return best;
}

/* ---- the player ---- */
function newGame() {
  const st = M.fresh(ROOM_DEFS);
  const own = { sp: ['sunshoot'], pot: ['terra'] };
  return { st, own, sun: 0, spent: 0, t: 0, log: [] };
}
const roomsOpen = g => g.st.rooms.map((r, i) => r.unlocked ? i : -1).filter(i => i >= 0);

function arrange(g, force) {
  roomsOpen(g).forEach(ri => {
    const room = g.st.rooms[ri], b = bestLayout(g.own.sp, g.own.pot, ri);
    const cur = roomRate(g.st, ri).r;
    if (!force && room.pots.some(p => p) && b.rate < cur * 1.15 && room.pot) return;
    room.pot = b.pid;
    for (let i = 0; i < POTS_PER_ROOM; i++) {
      const c = i % 4, r = (i / 4) | 0, want = (c + r) % 2 ? b.layout[1] : b.layout[0];
      if (!room.pots[i] || room.pots[i].sp !== want) room.pots[i] = { sp: want, watered: g.t * 1000, grown: 0, acc: 0, tok: 0, wig: 0 };
    }
  });
}

/* a steady-state estimate of sun a second, for deciding what to buy: each room as its best arrangement, kept wet as far as the
   visits and the pot allow, losing what overflows the basket between visits unless the gatherer is there to take it */
function income(g) {
  let tot = 0;
  roomsOpen(g).forEach(ri => {
    const room = g.st.rooms[ri], b = bestLayout(g.own.sp, g.own.pot, ri);
    const save = room.pots, savePot = room.pot;
    room.pots = Array(POTS_PER_ROOM).fill(null);
    ptsOf(g.st, ri, b.pid, b.layout);
    const { r, tok } = roomRate(g.st, ri);
    const wf = room.drip ? 1 : Math.min(1, M.waterMs(w, g.st, ri) / (VISIT * 1000));
    const fcap = Math.min(1, M.cap(g.st) / Math.max(1e-9, tok * wf * VISIT));
    const hand = fcap * M.chainMult(7);
    tot += r * wf * (g.st.up.gather ? Math.max(hand, M.GATHER[g.st.up.gather].rate) : hand);
    room.pots = save; room.pot = savePot;
  });
  return tot;
}

function candidates(g) {
  const c = [];
  ROOM_DEFS.forEach((d, i) => { if (!g.st.rooms[i].unlocked) c.push({ id: 'room:' + d.id, price: d.price, apply: () => { g.st.rooms[i].unlocked = true; } }); });
  SPECIES.forEach(s => { if (!g.own.sp.includes(s.id)) c.push({ id: 'seed:' + s.id, price: s.price, apply: () => g.own.sp.push(s.id) }); });
  POTS.forEach(p => { if (!g.own.pot.includes(p.id)) c.push({ id: 'pot:' + p.id, price: p.price, apply: () => g.own.pot.push(p.id) }); });
  roomsOpen(g).forEach(ri => M.offers(w, g.st, ri).forEach(o => { if (!o.owned && !(o.id === 'drip' && g.st.rooms[ri].drip)) c.push({ id: o.id + ':' + (o.id === 'drip' ? ROOM_DEFS[ri].id : g.st.up[o.id] || 0), price: o.price, apply: () => M.buy(w, g.st, ri, o.id, () => true) }); }));
  const seen = new Set();
  return c.filter(x => !seen.has(x.id) && seen.add(x.id));
}
function clone(g) { return { ...g, st: JSON.parse(JSON.stringify(g.st)), own: { sp: g.own.sp.slice(), pot: g.own.pot.slice() } }; }

function shop(g) {
  for (let guard = 0; guard < 50; guard++) {
    const base = income(g), cs = candidates(g).map(c => {
      const h = clone(g); const keep = g; void keep;
      /* the candidate's own apply works on `g`'s state; try it on the clone through the same ids */
      const cc = candidates(h).find(x => x.id === c.id);
      cc.apply();
      const gain = income(h) - base;
      return { ...c, gain, ratio: gain / Math.max(1, c.price) };
    }).filter(c => c.gain > 1e-6);
    if (!cs.length) return;
    cs.sort((a, b) => b.ratio - a.ratio);
    const best = cs[0], afford = cs.filter(c => c.price <= g.sun);
    const pick = afford[0] && (afford[0] === best || afford[0].ratio >= best.ratio * 0.5) ? afford[0] : null;
    if (!pick) return;
    g.sun -= pick.price; g.spent += pick.price;
    pick.apply();
    g.log.push({ t: g.t, id: pick.id, price: pick.price });
    arrange(g, false);
  }
}

function visit(g) {
  const now = g.t * 1000;
  roomsOpen(g).forEach(ri => {
    M.waterRoom(w, g.st, ri, now);
    let n = 0;
    g.st.rooms[ri].pots.forEach((p, i) => { if (p && p.tok) g.sun += M.collect(w, g.st, ri, i, M.chainMult(++n)); });
  });
}

function play(g, untilSun, maxSec, shopping = true) {
  const earn = n => { g.sun += n; g.earned = (g.earned || 0) + n; };
  g.earned = g.earned || 0;
  arrange(g, true);
  for (; g.t < maxSec; g.t++) {
    if (g.t % VISIT === 0) { visit(g); if (shopping) shop(g); }
    M.step(w, g.st, g.t * 1000, 1000, 1, earn);
    if (untilSun && (g.sun + g.spent) >= untilSun && !shopping) break;
    if (untilSun && g.sun >= untilSun) break;
  }
  return g;
}
const mins = s => (s / 60).toFixed(0) + ' min';

/* ---- the whole game, from a seed in a yard to the third temple ---- */
VISIT = 300;
const full = play(newGame(), GOAL, 60 * 3600);
console.log('purchases: ' + full.log.map(l => Math.round(l.t / 60) + 'm ' + l.id).join(' | '));
ok(full.sun >= GOAL, 'a player who checks in every five minutes reaches the third temple');
console.log('from nothing, the third temple takes ' + mins(full.t) + ' (' + (full.t / 3600).toFixed(1) + ' h) of a player who checks in every five minutes');

/* ---- fully equipped, from the day it is all bought ---- */
function maxed(tools) {
  const g = newGame();
  g.own = { sp: SPECIES.map(s => s.id), pot: POTS.map(p => p.id) };
  g.st.rooms.forEach(r => { r.unlocked = true; r.drip = tools; });
  if (tools) { g.st.up.basket = M.CAPS.length - 1; g.st.up.gather = M.GATHER.length - 1; }
  /* it has been growing for a quarter of an hour already: the plants are up */
  arrange(g, true);
  g.st.rooms.forEach(r => r.pots.forEach(p => { if (p) { p.grown = 1e12; p.watered = 0; } }));
  return g;
}
const table = {};
[120, 300, 900].forEach(v => {
  VISIT = v;
  table[v] = { tools: play(maxed(true), GOAL, 6 * 3600, false).t, bare: play(maxed(false), GOAL, 40 * 3600, false).t };
  console.log('visits every ' + v + ' s: everything bought ' + mins(table[v].tools) + ' to 99,999; rooms, pots and plants but none of the tools ' + mins(table[v].bare));
});
VISIT = 300;
ok(table[300].tools <= 35 * 60 && table[300].tools >= 15 * 60, 'fully equipped, checking in every five minutes, 99,999 SUN is ' + mins(table[300].tools) + ' (between 15 and 35)');
ok(table[900].bare > table[900].tools * 2, 'for a player who is mostly elsewhere the tools are worth more than double: ' + mins(table[900].bare) + ' without, ' + mins(table[900].tools) + ' with');
ok(table[300].bare > table[300].tools * 1.3, 'and for one who checks in every five minutes, a good deal (' + mins(table[300].bare) + ' without)');

/* ---- what you plant where matters ---- */
{
  VISIT = 300;
  const g = maxed(true);
  const every = ROOM_DEFS.map((d, ri) => bestLayout(g.own.sp, g.own.pot, ri, 1e9));
  const naive = ROOM_DEFS.map((d, ri) => {
    const st = M.fresh(ROOM_DEFS);
    ptsOf(st, ri, 'terra', ['thirdroot', 'thirdroot']);
    return roomRate(st, ri).r;
  });
  const sumBest = every.reduce((a, b) => a + b.rate, 0), sumNaive = naive.reduce((a, b) => a + b, 0);
  ok(sumBest > sumNaive * 1.5, 'the best arrangement is ' + (sumBest / sumNaive).toFixed(1) + 'x the dearest plant in the starter pot');
  const picks = new Set(every.map(b => b.layout.join('+') + '@' + b.pid));
  ok(picks.size >= 3, 'the best choice depends on the room (' + picks.size + ' different arrangements across five rooms: ' + [...picks].join(', ') + ')');
  /* with the late species and pots held back, the old tier still has its own answer in each room */
  const old = ROOM_DEFS.map((d, ri) => bestLayout(['sunshoot', 'mosscap', 'bellvine', 'embercup', 'glassreed', 'nightpea', 'ironbud', 'halofern'], ['terra', 'glaze', 'iron', 'bone', 'stump'], ri, 1e9));
  ok(new Set(old.map(b => b.layout.join('+') + '@' + b.pid)).size >= 3, 'and so does the old tier: ' + [...new Set(old.map(b => b.layout.join('+') + '@' + b.pid))].join(', '));
}

/* ---- away ---- */
{
  const g = maxed(true);
  g.st.lastTick = 1;
  const earned = [];
  M.catchUp(w, g.st, 12 * 3600 * 1000, n => earned.push(n));
  const got = earned.reduce((a, b) => a + b, 0);
  ok(got > 5000 && got < GOAL * 0.7, 'a night away with everything bought brings in ' + Math.round(got) + ' SUN: worth having, not the third temple');
  const a = maxed(false); a.st.lastTick = 1;
  const e2 = []; M.catchUp(w, a.st, 12 * 3600 * 1000, n => e2.push(n));
  ok(e2.reduce((x, y) => x + y, 0) === 0, 'and with no gatherer it brings in none: the tokens wait in the baskets');
}

/* ---- the numbers on the shelves ---- */
ok(M.CAPS.every((c, i) => i === 0 || c > M.CAPS[i - 1]) && M.BASKET_PRICE.every((p, i) => i === 0 || p > M.BASKET_PRICE[i - 1]), 'bigger baskets cost more');
ok(M.GATHER[2].rate > M.GATHER[1].rate && M.GATHER[2].rate < 1, 'the gatherer never pays what your own hand does');
ok(M.chainMult(1) === 1 && approx(M.chainMult(12), 1 + 11 * M.CHAIN.step) && M.chainMult(99) === 1 + M.CHAIN.max, 'a sweep chains from nothing up to its ceiling');
ok(SPECIES.every(s => s.home && s.kin && s.mate && species(s.mate) && ROOM_DEFS.some(d => d.id === s.home) && POTS.some(p => p.id === s.kin)), 'every plant has a home room, a kin pot and a mate that exist');

console.log(fails ? fails + ' failed' : 'All checks pass.');
process.exit(fails ? 1 : 0);
