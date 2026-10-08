/* node apps/sweeper/run_check.js -- Dungeon Sweeper's room cannot be got stuck in, and what it pays is what the budget says (pure Node).
   - a bot plays the real run (createRun: S.mouse, S.key) for a few dozen random moves, wrong flags, spells without the soul, clicks on webs and
     brambles included, then plays it out with the legal moves a player has: whatever it did, the room is won, or the player is dead, never stuck;
   - an aimed spell that cannot be cast is never left aimed; a spell not yet learnt is not cast;
   - the spells follow the map, the compass is found and not sold, three notches wide, and nothing pays by the click. */
import { createRun } from './run.js';
import { NODES, REGIONS, CLASSIC, START, CHARMS, SPELL_AT, spellOpen, regionCleared, maxMasks, ROOMS, ROOMS_ALL, baseCount, underCount, underOpen, modsOf } from './data.js';
import { hiddenSafe, blocked, underFlags, mk, lay, open } from './board.js';
import { classicPay, roomPay, farmFactor, isPerfect, perfectPar, parOf, CLASSIC_SUN, SUN_PER_GEO, FIRST, FIRST_GUARDIAN } from './pay.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
globalThis.window = { Sweeper: { st: { played: 0, streak: 0 }, save() {} } };
const snd = new Proxy({}, { get: () => () => {} });
const clearedAll = () => { const c = {}; Object.keys(NODES).forEach(id => { c[id] = 10; }); return c; };
const camp = (o) => Object.assign(JSON.parse(JSON.stringify(START)), { cleared: clearedAll(), soul: 99 }, o || {});

function room(node, c, seed, wins) {
  Math.random = seeded(seed);
  return createRun({ lv: node, node, camp: c, snd, onWin: () => { wins.n++; }, shadeGeo: () => 0 });
}
const at = (S, i) => [S.bx + (i % S.b.c) * S.tile + S.tile / 2, S.by + Math.floor(i / S.b.c) * S.tile + S.tile / 2];
const click = (S, i, button) => { const [x, y] = at(S, i); S.mouse('down', { button: button || 0 }, x, y); S.mouse('up', { button: button || 0 }, x, y); };

/* ---- the chaos, then the finish --------------------------------------------------------------------------------------------------- */
let stuck = 0, finished = 0, dead = 0, runs = 0;
REGIONS.forEach(rg => rg.nodes.forEach(node => {
  for (let seed = 1; seed <= 14; seed++) {
    const rnd = seeded(seed * 977 + node.c), wins = { n: 0 };
    const c = camp({ equipped: seed % 3 === 0 ? ['stalwart', 'quick'] : seed % 3 === 1 ? ['grubsong', 'thorns', 'womb'] : [], shards: seed % 5 });
    c.hp = maxMasks(c.shards);
    const S = room(node, c, seed, wins);
    runs++;
    /* a key is pressed with some soul: if it leaves a spell aimed, the soul to cast it is there */
    const aimed = (key, nd) => { const was = S.target; S.key({ key }); if (S.target && S.target !== was) ok(S.soul >= { scry: 33, dive: 66 }[S.target], nd.id + ': ' + S.target + ' is aimed with ' + S.soul + ' soul'); };
    for (let k = 0, m = 8 + Math.floor(rnd() * 70); k < m && !S.over; k++) {
      const r = rnd();
      if (r < 0.4) { const aimedNow = S.target, cost = aimedNow ? { scry: 33, dive: 66 }[aimedNow] : 0, soulNow = S.soul; click(S, Math.floor(rnd() * S.b.n), 0);
        if (aimedNow && soulNow < cost && S.started) ok(!S.target, node.id + ': a click with too little soul for the aimed spell lets go of it'); }
      else if (r < 0.65) click(S, Math.floor(rnd() * S.b.n), 2);
      else if (r < 0.9) { if (!S.target) S.soul = rnd() < 0.5 ? 0 : 20 + Math.floor(rnd() * 80); aimed('fqe'[Math.floor(rnd() * 3)], node); if (rnd() < 0.8) click(S, Math.floor(rnd() * S.b.n), 0); }
      else { if (!S.target) S.soul = Math.floor(rnd() * 100); aimed('qe'[Math.floor(rnd() * 2)], node); }
      /* an aimed spell that cannot be cast is a trap: whatever happened, if it is aimed there is the soul to cast it */
    }
    if (S.over) { if (S.dead) dead++; else finished++; continue; }
    /* the player's way out of anything: right-click lets go of an aim, a flag on safe ground is lifted, a bramble is cut and then opened,
       a web is opened from a neighbour; one pass that moves nothing, in a room that is not over, is a softlock */
    let safety = 0;
    if (!S.started) click(S, Math.floor(S.b.n / 2), 0);
    if (S.target) { click(S, 0, 2); ok(!S.target, node.id + '/' + seed + ': right-click lets go of the aim'); }
    while (!S.over && safety++ < 4000) {
      const b = S.b; let moved = false;
      for (let i = 0; i < b.n && !S.over; i++) {
        if (b.rev[i]) continue;
        if (b.flag[i] && !b.mine[i]) { click(S, i, 2); moved = true; continue; }
        if (b.mine[i] || b.flag[i]) continue;
        if (blocked(b, i) === 'web') continue;
        click(S, i, 0); moved = true;
      }
      if (!moved) break;
    }
    if (S.over) { if (S.dead) dead++; else finished++; }
    else { stuck++; ok(false, node.id + '/' + seed + ': stuck with ' + hiddenSafe(S.b) + ' safe tiles hidden (web ' + S.b.web.filter(Boolean).length + ')'); }
  }
}));
ok(stuck === 0, stuck + ' of ' + runs + ' rooms were left stuck');
ok(finished > runs * 0.4, 'the bot wins a fair share of the rooms it plays out (' + finished + ' of ' + runs + ', ' + dead + ' dead)');

/* ---- spells ------------------------------------------------------------------------------------------------------------------ */
{
  const wins = { n: 0 }, node = NODES.stair;
  /* none are learnt at the start, and a locked key does nothing but say so */
  let c = camp({ cleared: {}, soul: 99 }); c.hp = 3;
  let S = room(node, c, 5, wins); click(S, 30, 0);
  S.key({ key: 'f' }); ok(S.hp === 3 && S.soul === 99, 'FOCUS is not cast before the Crossway is cleared');
  S.key({ key: 'q' }); ok(!S.target && /LOCKED/.test(S.msg[S.msg.length - 1].t), 'SCRY is not aimed before it is learnt, and the key says why');
  S.key({ key: 'e' }); ok(!S.target, 'DIVE likewise');
  /* learnt a region at a time */
  const only = ids => { const cl = {}; ids.forEach(id => { cl[id] = 5; }); return cl; };
  const cross = REGIONS[0].nodes.map(x => x.id), green = REGIONS[1].nodes.map(x => x.id), fungal = REGIONS[2].nodes.map(x => x.id), city = REGIONS[3].nodes.map(x => x.id);
  const kinds = cl => ['focus', 'scry', 'dive'].filter(k => spellOpen({ cleared: only(cl) }, k)).join(',');
  ok(kinds([]) === '', 'nothing is learnt at the start');
  ok(kinds(cross.slice(0, 2)) === '', 'two of the Crossway\'s three rooms learn nothing');
  ok(kinds(cross) === 'focus', 'the Crossway teaches FOCUS');
  ok(kinds(cross.concat(green)) === 'focus,scry' && kinds(cross.concat(fungal)) === 'focus,scry', 'either branch teaches SCRY');
  ok(kinds(cross.concat(green, fungal, city)) === 'focus,scry,dive', 'the City of Rain teaches DIVE');
  ok(Object.keys(SPELL_AT).every(k => SPELL_AT[k].every(id => REGIONS.some(r => r.id === id))), 'every spell is taught by a region that exists');
  ok(regionCleared({ cleared: only(cross) }, 'cross') && !regionCleared({ cleared: {} }, 'cross'), 'regionCleared');
  /* a spell that cannot be cast lets go of the aim */
  c = camp({ soul: 40 }); S = room(node, c, 7, wins); click(S, 30, 0);
  S.key({ key: 'e' }); ok(!S.target, 'DIVE is not aimed with 40 soul (it costs 66)');
  S.key({ key: 'q' }); ok(S.target === 'scry', 'SCRY is aimed with 40 soul'); S.soul = 5; const h = hiddenSafe(S.b);
  const j = S.b.rev.findIndex((v, i) => !v && !S.b.mine[i]); click(S, j, 0);
  ok(!S.target && S.soul === 5 && hiddenSafe(S.b) === h, 'an aimed SCRY that has lost its soul is let go, and costs nothing');
  S.soul = 80; S.key({ key: 'q' }); S.key({ key: 'q' }); ok(!S.target, 'the same key puts an aimed spell down');
  S.key({ key: 'q' }); click(S, j, 2); ok(!S.target, 'a right-click puts an aimed spell down');
  /* the three keys along the bottom are buttons, and a click on the bar is not a click on a tile */
  S.soul = 99; S.mouse('down', { button: 0 }, 14 + 150 + 20, 620); ok(S.target === 'scry', 'the Q button aims SCRY'); S.mouse('down', { button: 0 }, 14 + 150 + 20, 620); ok(!S.target, 'and puts it down');
  /* the cost is the soul, the cast is counted */
  S.soul = 99; S.key({ key: 'q' }); const k2 = S.b.rev.findIndex((v, i) => !v && !S.b.mine[i] && !S.b.flag[i]); click(S, k2, 0);
  ok(S.spells === 1 && S.b.rev[k2] && S.soul < 99 && !S.target, 'SCRY opens safe ground, costs soul and is counted');
}

/* ---- a flag on safe ground ---------------------------------------------------------------------------------------------------- */
{
  const wins = { n: 0 }, S = room(NODES.stair, camp(), 11, wins);
  click(S, 27, 0);
  const b = S.b;
  for (let i = 0; i < b.n; i++) if (!b.rev[i] && !b.mine[i]) b.flag[i] = true;       /* every safe tile left is under a flag, nothing else to do */
  ok(underFlags(b) && !S.over, 'every safe tile hidden is flagged: the room is not won');
  const f = b.flag.findIndex((v, i) => v && !b.mine[i]);
  click(S, f, 0);
  ok(S.flagHint && /FLAG/.test(S.msg[S.msg.length - 1].t), 'a click on a flag that hides safe ground says so, instead of nothing');
  for (let i = 0; i < b.n; i++) if (b.flag[i] && !b.mine[i]) click(S, i, 2);
  for (let i = 0; i < b.n; i++) if (!b.rev[i] && !b.mine[i]) click(S, i, 0);
  ok(S.won && wins.n === 1, 'lifting the flags lets the room be won');
}

/* ---- the web: no safe tile is walled in --------------------------------------------------------------------------------------- */
{
  let walled = 0, boards = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const nd = NODES.void, b = mk(nd.c, nd.r, nd.m + 10 + (seed % 20)), r = seeded(seed);
    lay(b, Math.floor(r() * b.n), 'web', r); open(b, b.web.findIndex(() => false) < 0 ? 0 : 0, 1, 0);
    boards++;
    let moved = true;
    while (moved) { moved = false; for (let i = 0; i < b.n; i++) if (!b.rev[i] && !b.mine[i] && blocked(b, i) !== 'web') { open(b, i, 1, 0); moved = true; } }
    if (hiddenSafe(b)) walled++;
  }
  ok(walled === 0, walled + ' of ' + boards + ' crowded webbed boards had a safe tile that could never be opened');
}

/* ---- the compass is found, not sold; notches; the pay -------------------------------------------------------------------------- */
{
  const cp = CHARMS.find(x => x.id === 'compass');
  ok(cp.n === 3 && cp.cost === 0 && cp.feat === 'perfect', 'the Wayward Compass takes three notches and is found, not sold');
  ok(START.notches === 3 && START.owned.length === 0 && START.equipped.length === 0 && JSON.stringify(START.perfect) === '{}', 'a new descent starts with three empty notches and no compass');
  ok(CHARMS.filter(x => x.n === 3).length >= 2 && CHARMS.every(x => x.feat || x.cost > 0), 'only the compass has no price');
  ok(ROOMS === 18 && baseCount(clearedAll()) === 18 && underCount(clearedAll()) === 9 && ROOMS_ALL === 27, 'eighteen rooms to be perfect in, and nine more under them that the compass does not count');
  /* perfect: no larva hatched at all, and in 0.75 s a tile */
  const nd = NODES.hollow;
  ok(perfectPar(nd) === Math.round(22 * 13 * 0.75) && perfectPar(nd) < parOf(nd), 'perfect is quicker than the par that the time bonus runs to');
  ok(isPerfect(nd, { hits: 0 }, perfectPar(nd)) && !isPerfect(nd, { hits: 0 }, perfectPar(nd) + 1) && !isPerfect(nd, { hits: 1 }, 10), 'perfect is no hit and under the time');

  /* the plain game */
  CLASSIC.forEach(lv => {
    const quick = classicPay(lv, 1, [], 0), par = classicPay(lv, lv.par, [], 0), slow = classicPay(lv, lv.par * 3, [], 0);
    ok(par.total === CLASSIC_SUN[lv.id] && slow.total === CLASSIC_SUN[lv.id], lv.name + ': a win at par or over pays its base');
    ok(quick.total <= CLASSIC_SUN[lv.id] * 1.76 && quick.total > par.total, lv.name + ': a very quick win is capped at ' + quick.total);
  });
  const lv = CLASSIC[0], now = 1e9, run = k => Array.from({ length: k }, (_, i) => now - 1000 * i);
  ok(farmFactor(run(0), now) === 1 && farmFactor(run(5), now) === 0.5 && farmFactor(run(40), now) === 0.15, 'wins in the last half hour pay less each, to a floor of 15 %');
  ok(farmFactor([now - 31 * 60000], now) === 1, 'a win older than half an hour is forgotten');
  /* an hour of nothing but SHALLOWS at one win a half minute, as fast as the hand can click, is held to a few thousand SUN */
  { let stamps = [], sum = 0; for (let t = 0; t < 3600; t += 30) { const p = classicPay(lv, 12, stamps, t * 1000); sum += p.total; stamps.push(t * 1000); }
    ok(sum < 3500, 'an hour of SHALLOWS at a win every half minute pays ' + sum + ' SUN, under 3,500'); }
  { let stamps = [], sum = 0; for (let t = 0; t < 3600; t += 15) { const p = classicPay(lv, 8, stamps, t * 1000); sum += p.total; stamps.push(t * 1000); }
    ok(sum < 6000, 'an hour of SHALLOWS at a win every fifteen seconds pays ' + sum + ' SUN, under 6,000'); }
  { let stamps = [], sum = 0; const hv = CLASSIC[1]; for (let t = 0; t < 3600; t += 100) { const p = classicPay(hv, 100, stamps, t * 1000); sum += p.total; stamps.push(t * 1000); }
    ok(sum > 3000 && sum < 9000, 'an hour of THE HIVE at a win in under two minutes pays ' + sum + ' SUN, 3,000 to 9,000'); }

  /* the campaign */
  let first = 0, again = 0, flawless = 0, uFirst = 0, uAgain = 0;
  Object.values(NODES).forEach(x => {
    const f = roomPay(x, parOf(x), { first: true }), r = roomPay(x, parOf(x), {}), fl = roomPay(x, parOf(x), { first: true, flawless: true });
    if (x.act === 1) { first += f.total; again += r.total; flawless += fl.total; } else { uFirst += f.total; uAgain += r.total; }
    ok(f.base === x.geo * SUN_PER_GEO && f.first === (x.boss ? FIRST_GUARDIAN : FIRST), x.id + ': four SUN a geo and a first-clear prize');
    ok(r.total < f.total * 0.5 && r.total > 0, x.id + ': a room already cleared pays less than half, but pays');
    ok(fl.total > f.total && roomPay(x, 1, { first: true }).total > f.total, x.id + ': flawless and quick both add');
  });
  ok(first > 9000 && first < 40000, 'a first walk of the descent pays ' + first + ' SUN, 9,000 to 40,000');
  ok(again > 1800 && again < 14000, 'a second pass pays ' + again + ' SUN');
  ok(uFirst > 15000 && uFirst < 40000 && uAgain < uFirst * 0.5, 'the Underdeep pays ' + uFirst + ' SUN the first time, ' + uAgain + ' on a repeat');
  console.log('  the descent: ' + first + ' SUN the first time, ' + flawless + ' flawless, ' + again + ' on a repeat;  ' + runs + ' rooms played in the chaos test (' + finished + ' won, ' + dead + ' dead)');
}

console.log(bad ? bad + ' FAILED of ' + n : 'sweeper run: all ' + n + ' ok');
process.exit(bad ? 1 : 0);
