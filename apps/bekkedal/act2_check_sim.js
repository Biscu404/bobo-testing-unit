/* Bekkedal — four players, one valley, a whole run each.
 *
 * The fourth sibling of `act2_check.js`, and the one that turns the rate
 * table next door into an argument about *time*. A rate says a swing pays
 * seven kr a point; it does not say when the house goes up, whether the
 * fisher gets there a fortnight after the miner, or whether there is ever a
 * morning with money in your pocket and nothing worth saving for. Those are
 * questions about a run, so a run is what this simulates — day by day, from
 * arrival to the last thing on the loft's shelves, four times over, for four
 * players who each favour a different living.
 *
 * A day here is two budgets and not one. `BEK_EN_MAX` (plus what levels and
 * the loft have added, plus whatever was eaten) is the bar; `BEK_DAY_END -
 * BEK_DAY_START` is the clock, and the walk between the places the work is
 * comes out of the second one at `act2_check_walk.js`'s measured rate. That
 * is the whole reason this exists in the shape it does: the valley's maps are
 * three and four times what they were, so an energy budget on its own now
 * describes a game nobody is playing.
 *
 * Nothing here is authored. Prices, timings, energy, the ore mix, the fish,
 * the crops' seasons, the loft's sixty-four entries, the festivals' own days
 * and every shop price in the valley — including the ones written into
 * dialogue as `buy` offers — are read out of the real tables. The only
 * figures stated in this file are the four policies themselves, which are
 * descriptions of players rather than facts about the game.
 */
import { BEK_CROPS, BEK_EN_MAX, BEK_START_KR, BEK_DAY_START, BEK_DAY_END,
         BEK_XP_STEP, BEK_XP_LVL_STAMINA, BEK_SEASON_DAYS, BEK_LOFT, BEK_LOFT_STAGES,
         BEK_LOFT_FR, BEK_GIFT_CAP, BEK_QUEST_REFRESH_DAYS, BEK_CLOCK_MIN_PER_S,
         BEK_SEASONS, BEK_GIFT_FR } from './data.js';
import { cropInSeason } from './seasons.js';
import { MINE_BANDS } from './mine.js';
import { minsBetween } from './act2_check_walk.js';
import { STAGES, rateTable, bestOfEach, cropAvg, foodRows } from './act2_check_rates.js';
import { ladder, lifetimeSinks, spineTick } from './act2_check_ladder.js';
export { ladder, lifetimeSinks };

const DAY_MIN = BEK_DAY_END - BEK_DAY_START;
export const REAL_MIN = min => min / BEK_CLOCK_MIN_PER_S / 60;   /* in-game minutes -> real */

/* ---- where the work is ----------------------------------------------------
   One landing square per place, and the walk between two of them measured off
   the real rows. Cached, because a policy asks for the same legs every day of
   a two-hundred-day run. */
const WHERE = { farm: { m: 'farm', x: 8, y: 8 }, town: { m: 'town', x: 23, y: 15 },
                forest: { m: 'forest', x: 22, y: 15 }, lake: { m: 'lake', x: 10, y: 13 },
                enga: { m: 'enga', x: 22, y: 13 }, setra: { m: 'setra', x: 20, y: 13 },
                vidda: { m: 'vidda', x: 22, y: 13 }, gruva: { m: 'gruva', x: 12, y: 22 } };
const legCache = {};
export function leg(a, b) {
  if (a === b) return 0;
  const k = a + '>' + b;
  if (legCache[k] == null) legCache[k] = minsBetween(WHERE[a], WHERE[b]) || 0;
  return legCache[k];
}

/* ---- the four players -----------------------------------------------------
   An ordered round of places, and how much of the bar each is allowed. The
   only authored thing in this file: these describe players, not the game. */
export const POLICIES = [
  { id: 'farm-focused', round: [['farm', 'aker', 0.55], ['forest', 'skog', 0.2],
                                ['enga', 'sanking', 0.05], ['town', 'sell', 0]] },
  { id: 'mine-focused', round: [['farm', 'aker', 0.15], ['gruva', 'fjell', 0.6],
                                ['forest', 'skog', 0.05], ['town', 'sell', 0]] },
  { id: 'fish-focused', round: [['farm', 'aker', 0.15], ['lake', 'vann', 0.6],
                                ['forest', 'skog', 0.05], ['town', 'sell', 0]] },
  { id: 'mixed',        round: [['farm', 'aker', 0.3], ['forest', 'skog', 0.15],
                                ['gruva', 'fjell', 0.2], ['lake', 'vann', 0.15],
                                ['enga', 'sanking', 0.05], ['town', 'sell', 0]] }
];

/* Which rate table a run is on right now. The three stages are the shape of
   it — what a fresh, a housed and a finished player has in hand — but how far
   down the mine is open is this run's own, so a descent is priced by where it
   has actually been rather than by which stage it is nominally in. Memoised:
   a two-hundred-day run asks for the same table most mornings, and building
   one carves four mine floors and tours nine maps. */
const tableCache = {};
function stageFor(s) {
  const base = !s.built ? STAGES[0] : (s.lvl >= 3 && s.deepest >= 15 ? STAGES[2] : STAGES[1]);
  return Object.assign({}, base, { floor: s.hasPick && s.hasLamp ? Math.max(1, s.deepest) : 0 });
}
function tableFor(s) {
  const st = stageFor(s);
  const k = st.id + '/' + st.floor;
  return (tableCache[k] = tableCache[k] || rateTable(st));
}
/* How far down a run has got is walked rather than dated: a descent day that
   works a floor properly reaches the next station, and only a station has a
   hoist out (MINE_STATION, mine.js), so depth is earned five floors at a
   time. Raised in runDay(), read by the rate table and by the loft. */

/* ---- a day ---------------------------------------------------------------- */
function runDay(s, pol, T, goal) {
  const best = bestOfEach(T);
  let en = s.enMax, min = DAY_MIN, at = 'farm', kr = 0, carried = 0;
  const workDone = {}, left = {};
  let deepWork = 0;
  const bagCap = 80 + (s.bagTier >= 1 ? 40 : 0) + (s.bagTier >= 2 ? 60 : 0) +
                 (s.spine >= BEK_LOFT_STAGES[0].at ? BEK_LOFT_STAGES[0].grant.bagCap : 0);
  /* a meal is a day-lengthener, and the reason money goes on mattering: buy
     one whenever the points it hands back earn more than it cost. Bounded by
     the clock rather than by the purse — there is only so much day to spend
     the stamina in, which is what stops it being a printing press. */
  const meals = foodRows(best.aker ? best.aker.krEn : 7)
    .filter(f => !f.cooked && f.net > 0).sort((a, b) => b.eat - a.eat);
  /* how many points it would take to fill the hours that are left, at what
     this run's own favourite work costs in minutes a point — eat up to that
     and no further, because past it the day runs out before the bar does */
  const perPoint = Math.max(0.5, (best[pol.round[0][1]] || best.aker || { min: 10, en: 7 }).min /
                                 (best[pol.round[0][1]] || best.aker || { min: 10, en: 7 }).en);
  const want = Math.min(FOOD_CAP, Math.max(0, Math.floor(DAY_MIN / perPoint) - s.enMax));
  while (meals.length && s.kr > meals[0].cost * 8 && en - s.enMax < want) {
    const m = meals[0];
    s.kr -= m.cost; s.spent += m.cost; s.food = (s.food || 0) + 1; en += m.eat;
  }
  /* what the day is *for*, on a day the next thing on the ladder wants
     materials: a house is thirty tømmer and twenty stein, and nobody is
     given those — the day goes to the wood and the adit until they are in
     the bag, which is a real part of why Act I is as long as it is */
  const round = pol.round.slice();
  if (goal && goal.mats) {
    if ((s.tommer || 0) < goal.mats.tommer) round.unshift(['forest', 'skog', 0.4]);
    if ((s.stein || 0) < goal.mats.stein && s.hasPick && s.hasLamp) round.unshift(['gruva', 'fjell', 0.4]);
  }
  round.forEach(r => { left[r[1]] = Math.max(left[r[1]] || 0, Math.ceil(s.enMax * r[2])); });
  /* the round is walked again and again until one of the two budgets runs
     out — a player with stamina left and hours left goes round once more, and
     that second circuit is most of what fills a day now the valley is this
     size. `left` is the policy's own share of the bar, topped up each lap so
     a favoured living gets the day's remainder rather than the day ending
     with the bar half full. */
  for (let lap = 0; lap < 14; lap++) {
    let didSomething = false;
    for (const [place, kind] of round) {
      if (kind === 'sell') continue;
      if (place === 'gruva' && !(s.hasPick && s.hasLamp)) continue;
      if (place === 'vidda' && !s.warm) continue;
      /* best-paying first, and *fall through* when it runs out. This is the
         whole reason anybody goes down the shaft: a surface vein pays more a
         point than the first floor of the descent does, and there are ten of
         them in the valley regrowing over three days. The rate says stay up
         here; the cap is what sends you down. */
      const rows = (kind === 'fjell'
        ? T.mine.filter(r => r.id === 'mine:gruva' || bandOK(r, s))
        : kind === 'aker' ? T.crops.filter(c => cropOK(c, s))
        : kind === 'skog' ? T.fell : kind === 'vann' ? T.fish : T.forage)
        .filter(x => x.krEn != null).sort((a, b) => b.krEn - a.krEn);
      for (const r of rows) {
        const cap = (r.cap == null ? Infinity : r.cap * (kind === 'aker' ? plots(s) / 8 : 1))
                    - (workDone[r.id] || 0);
        const walk = leg(at, place);
        if (cap < 1 || left[kind] < r.en || en < r.en || min < walk + r.min) continue;
        min -= walk; at = place;
        let n = 0;
        while (n < cap && left[kind] >= r.en && min >= r.min && en >= r.en) {
          en -= r.en; left[kind] -= r.en; min -= r.min; kr += r.kr; n++;
        }
        workDone[r.id] = (workDone[r.id] || 0) + n;
        workDone[kind] = (workDone[kind] || 0) + n;
        if (kind === 'fjell' && r.id !== 'mine:gruva') deepWork += n;
        if (kind === 'skog') s.tommer = (s.tommer || 0) + n;
        if (kind === 'fjell') s.stein = (s.stein || 0) + n;
        xp(s, kind, n);
        if (n) didSomething = true;
        /* nothing is sold where it is picked. A full sekk is a walk into town
           and back, which is what the two bag tiers and the loft's first stage
           are actually buying — fewer of them. */
        carried += n * (kind === 'fjell' ? 2 : 1);
        if (carried >= bagCap && min > leg(at, 'town') + leg('town', 'farm')) {
          min -= leg(at, 'town') + SELL_MIN; at = 'town'; carried = 0;
        }
      }
    }
    if (!didSomething) break;
    round.forEach(r => { if (r[1] !== 'sell') left[r[1]] += Math.ceil(s.enMax * r[2]); });
  }
  /* a day that works a whole floor of the descent comes out at the next
     station down, and only a station has a hoist (MINE_STATION, mine.js) —
     so how deep a run has been is earned five floors at a time, by days
     spent down there rather than by the calendar */
  if (deepWork >= 8) s.deepest = Math.min(20, s.deepest + 5);
  min -= leg(at, 'farm');
  /* the farmstead and the preserves are not energy, they are capital: what
     they pay comes in whether the bar is empty or not */
  T.farmstead.forEach(f => {
    if (f.id === 'dairy:goat') kr += f.perDay * (s.goats || 0);
    if (f.id === 'presv:jar') kr += f.perDay * (s.jars || 0);
    if (f.id === 'presv:keg') kr += f.perDay * (s.kegs || 0);
  });
  return { kr: kr, minUsed: Math.max(0, DAY_MIN - Math.max(0, min)), work: workDone,
           meal: meals.length ? meals[0].net : 0 };
}
/* the mouth is always open to a run with a pick and a lamp — MINE_BANDS' own
   `from`, against the deepest station the run has actually reached (or the
   first floor, if it has not been down yet) */
const bandOK = (r, s) => {
  if (!s.hasPick || !s.hasLamp) return false;
  const b = MINE_BANDS.filter(x => 'mine:' + x.id === r.id)[0];
  return !!b && b.from <= Math.max(1, s.deepest);
};
const plots = s => 50 + (s.plot2 ? 16 : 0) + (s.plot3 ? 21 : 0) + (s.glass ? 16 : 0);
/* cropInSeason() takes the crop's own spec, not its id — handed a string it
   answers `true` for everything, which is a season gate that is not one */
const cropOK = (c, s) => s.glass || cropInSeason(BEK_CROPS[c.id.slice(5)], s.day);
function xp(s, kind, n) {
  const k = { aker: 'farm', fjell: 'mine', skog: 'mine', vann: 'fish', sanking: 'forage' }[kind];
  if (!k || !n) return;
  s.xp[k] = (s.xp[k] || 0) + n;
  const lv = Math.min(3, Math.floor(s.xp[k] / BEK_XP_STEP));
  const was = s.lv[k] || 0;
  if (lv > was) { s.enMax += BEK_XP_LVL_STAMINA * (lv - was); s.lv[k] = lv; }
  /* the stage a run is on is the best it has got at anything, not its farm */
  s.lvl = Object.keys(s.lv).reduce((a, t) => Math.max(a, s.lv[t] || 0), 0);
}

/* ---- a run ---------------------------------------------------------------- */
export function simulate(pol, horizon) {
  const s = { day: 0, kr: BEK_START_KR, spent: 0, enMax: BEK_EN_MAX, xp: {}, lv: {}, lvl: 0,
              deepest: 0, tommerQuest: 0, bought: {}, stage: {}, minTotal: 0, blocked: [],
              goats: 0, jars: 0, kegs: 0, fr: {}, met: {}, spine: 0 };
  const bought = new Set();
  const L = ladder();
  for (s.day = 1; s.day <= horizon; s.day++) {
    const T = tableFor(s);
    /* Håkon's ten tømmer is the one fixed gate on the lot, and a day of the
       axe clears it — modelled as a date rather than an inventory, since what
       is being measured here is money and time, not the bag */
    if (!s.tommerQuest && s.day >= 3) s.tommerQuest = 1;
    const goalNow = L.filter(x => !bought.has(x.id) && x.at(s))[0];
    const d = runDay(s, pol, T, goalNow);
    s.kr += d.kr; s.minTotal += d.minUsed;
    s.krDay = d.kr;
    /* meeting people, and a gift a week each once you have (BEK_GIFT_CAP,
       loved is +2) — the pacing knob every arc and the FOLKET wing hang off */
    NPC_AT.forEach(([id, place, need]) => {
      if (s.met[id]) return;
      if (need && !s[need]) return;
      if (s.day >= 2) { s.met[id] = s.day; s.fr[id] = 2; }
    });
    Object.keys(s.met).forEach(id => {
      s.fr[id] = Math.min(10, 2 + BEK_GIFT_FR.loved * BEK_GIFT_CAP *
                              Math.floor((s.day - s.met[id]) / BEK_QUEST_REFRESH_DAYS));
    });
    /* the next thing worth saving for, and whether there is one */
    /* what a run is saving for: the first thing on the ladder it has not got
       and can already be offered. Bought in that order rather than cheapest
       first, because a player with the lot signed is saving for the house,
       not spending the difference on chairs. */
    const open = L.filter(x => !bought.has(x.id) && x.at(s));
    /* "never blocked" is not "there is always a shop row lit up" — it is that
       money is never inert. A run is blocked on a day when it has no rung of
       the ladder it could be saving for AND no meal worth eating, or when the
       rung it *is* saving for is further off than a run should ever have to
       stare at. Everything else is a purse doing its job. */
    const goal = open[0];
    const mealWorth = d.meal > 0;
    if (!s.spineDone && !mealWorth && (!goal || (d.kr > 0 && goal.kr / d.kr > BLOCK_DAYS)))
      s.blocked.push(s.day);
    if (goal) {
      if (s.lastBuy != null) s.gap = Math.max(s.gap || 0, s.day - s.lastBuy);
      for (const x of open) {
        if (s.kr < x.kr) break;                                  /* saving for it */
        if (x.mats && ((s.tommer || 0) < x.mats.tommer || (s.stein || 0) < x.mats.stein)) break;
        if (x.mats) { s.tommer -= x.mats.tommer; s.stein -= x.mats.stein; }
        s.kr -= x.kr; s.spent += x.kr; bought.add(x.id); x.give(s);
        s.stage[x.id] = s.day; s.lastBuy = s.day; s.lastRung = x.id;
      }
    }
    if (s.built && !s.stage.actI) s.stage.actI = s.day;
    if (!s.loftOpen && s.built && (s.fr.astrid || 0) >= BEK_LOFT_FR) { s.loftOpen = 1; s.stage.loft = s.day; }
    if (s.loftOpen) spineTick(s);
    if (s.spineDone) { s.stage.spine = s.day; break; }
  }
  return s;
}
/* how long a run may sit saving before the next thing counts as a wall */
const BLOCK_DAYS = 25;
/* the counter, once you are standing at it */
const SELL_MIN = 12;
/* nobody eats a hundred waffles: what a day's meals can reasonably add */
const FOOD_CAP = 400;
/* who is where, and what a run needs before it can get to them */
const NPC_AT = [['astrid', 'town'], ['hakon', 'town'], ['marit', 'town'], ['ingrid', 'lake'],
                ['olav', 'lake'], ['sigrid', 'setra'], ['gunnar', 'vidda', 'warm'],
                ['lars', 'gruva', 'hasLamp']];

export { DAY_MIN, BEK_LOFT, BEK_LOFT_STAGES, BEK_SEASON_DAYS, BEK_SEASONS, cropAvg };
