/* Bekkedal — the balance pass.
 *
 * The last of `act2_check.js`'s four siblings, and the one that states the
 * targets. `act2_check_walk.js` measures the valley, `act2_check_rates.js`
 * prices the work, `act2_check_sim.js` plays four whole runs; this asserts
 * what all of that has to add up to.
 *
 * The pass it replaces asked one question — does a mixed policy reach the
 * house around day 8-10 — of a game that no longer exists. Every session in
 * this queue changed the economy underneath it: the maps went to three and
 * four times their size, the descent, the fishing overhaul, farming's quality
 * and preserves, the loft's year of work and a house full of furniture all
 * arrived, and the one assertion left standing was about a number nobody had
 * measured since. These are the targets now:
 *
 *   ACT I     arrival to the finished house, 23-38 in-game days (it was 20-25 until the house cost a good deal more and a meal a good deal less)
 *   ACT II    house to the loft's ending, at least four more seasons
 *   TOTAL     6-10 real hours, and the valley still playable after
 *   NOBODY WINS  no livelihood pays more than 1.5x another per point of
 *                energy, at any stage of the game — the rule the old pick
 *                broke, kept and now checked three times over
 *   NO DEAD MORNINGS  there is never a day with money in the purse and
 *                     nothing at all it is worth spending on
 *
 * Every figure is read from the real tables. The two exceptions are stated
 * where they are used and are properties of a *player* rather than of the
 * game: how long a reel takes and how often it is won (measured off casts
 * driven through the real frame loop by scripts/bekkedal_playtest.mjs), and
 * the four policies themselves.
 */
import { BEK_SEASON_DAYS, BEK_SEASONS, BEK_ITEMS, BEK_RECIPES } from './data.js';
import { STAGES, rateTable, bestOfEach, foodRows, cropAvg } from './act2_check_rates.js';
import { POLICIES, simulate, ladder, lifetimeSinks, REAL_MIN } from './act2_check_sim.js';

/* the targets, in one place, so a reader can argue with them */
export const ACT1 = [23, 38];                       /* in-game days */
export const ACT2_SEASONS = 3.5;                     /* at least */
export const TOTAL_HOURS = [5.5, 10];                 /* real hours, whole run */
export const SPREAD = 1.5;                          /* kr/energy, best against best */
export const STAGE_SPREAD = 1.6;                    /* one policy against another, at any stage */
export const SINKS = [130000, 200000];              /* lifetime kr the ladder takes */
export const MAX_GAP = 32;                          /* days between two things to buy */
export const HORIZON = 300;

export function balancePass(C) {
  const { ok, pass } = C;

  /* ---- 1. nobody wins ----------------------------------------------------- */
  console.log('\n-- the five livelihoods, per point of energy --');
  let worst = 0, worstAt = '';
  STAGES.forEach(st => {
    const T = rateTable(st);
    const b = bestOfEach(T);
    const rows = Object.keys(b).filter(k => b[k]).map(k => ({ k: k, v: b[k].krEn, id: b[k].id }))
                       .sort((a, c) => c.v - a.v);
    const spread = rows[0].v / rows[rows.length - 1].v;
    if (spread > worst) { worst = spread; worstAt = st.id; }
    ok(spread <= SPREAD, st.id + ': no livelihood pays more than ' + SPREAD + 'x another per energy',
       spread.toFixed(2) + 'x — ' + rows.map(r => r.k + ' ' + r.v.toFixed(1)).join(', '));
    /* and the other axis: the one you can do with an empty bar must not also
       be the quickest way to a krone */
    const all = [].concat(T.crops, T.fell, T.mine, T.fish, T.forage).filter(r => r.krMin > 0);
    const top = all.sort((a, c) => c.krMin - a.krMin)[0];
    ok(top.id.indexOf('forage') !== 0, st.id + ': foraging costs no energy, so it must not be the best per minute',
       'quickest is ' + top.id + ' at ' + top.krMin.toFixed(1) + ' kr/min');
  });
  pass('the five livelihoods', 'worst spread ' + worst.toFixed(2) + 'x, at ' + worstAt);

  /* ---- 2. what money is for ----------------------------------------------- */
  console.log('\n-- the money sinks --');
  const L = ladder(), total = lifetimeSinks();
  ok(total >= SINKS[0] && total <= SINKS[1], 'the ladder takes ' + SINKS[0].toLocaleString('en-US') +
     '-' + SINKS[1].toLocaleString('en-US') + ' kr over a run', Math.round(total).toLocaleString('en-US') + ' kr in ' + L.length + ' rungs');
  ok(L.every(x => x.kr > 0), 'every rung of the ladder has a price', L.filter(x => !x.kr).map(x => x.id).join(','));
  const cheapest = L.slice().sort((a, b) => a.kr - b.kr)[0], dearest = L.slice().sort((a, b) => b.kr - a.kr)[0];
  ok(dearest.kr / cheapest.kr >= 10, 'and they span a real range, so there is always a next size up',
     cheapest.id + ' ' + cheapest.kr + ' kr .. ' + dearest.id + ' ' + dearest.kr.toLocaleString('en-US') + ' kr');

  /* preserves beat raw, and slowly — and a cooked dish beats anything a shop
     sells, which is what keeps the farm worth having once money is easy */
  const avg = cropAvg();
  ['syltetoy', 'fruktvin'].forEach(id => {
    ok(BEK_ITEMS[id].sell > avg * 1.5, id + ' is worth more than the crop that went into it',
       BEK_ITEMS[id].sell + ' kr against an average crop at ' + Math.round(avg));
  });
  const food = foodRows(9);
  const bestBought = food.filter(f => !f.cooked).sort((a, b) => b.eat - a.eat)[0];
  const worstCooked = food.filter(f => f.cooked).sort((a, b) => a.eat - b.eat)[0];
  ok(worstCooked.eat > bestBought.eat, 'every cooked dish restores more than the best thing a shop sells',
     worstCooked.id + ' ' + worstCooked.eat + ' against ' + bestBought.id + ' ' + bestBought.eat);
  ok(food.filter(f => !f.cooked).every(f => f.krPerPoint > 4),
     'and bought food is a real cost, not a printing press',
     food.filter(f => !f.cooked).map(f => f.krPerPoint.toFixed(1)).join('/') + ' kr the point');
  pass('the money sinks', Math.round(total).toLocaleString('en-US') + ' kr');

  /* ---- 3. four players, four whole runs ------------------------------------ */
  console.log('\n-- four policies, arrival to the ending --');
  const runs = POLICIES.map(p => ({ p: p, r: simulate(p, HORIZON) }));
  runs.forEach(({ p, r }) => {
    const hrs = REAL_MIN(r.minTotal) / 60;
    const actII = (r.stage.spine || 0) - (r.stage.actI || 0);
    ok(r.stage.actI >= ACT1[0] && r.stage.actI <= ACT1[1],
       p.id + ': the house lands inside Act I’s window (' + ACT1[0] + '-' + ACT1[1] + ' days)',
       'day ' + r.stage.actI);
    ok(r.stage.spine > 0, p.id + ': and the loft is finished', r.stage.spine ? 'day ' + r.stage.spine
       : 'never — still short: ' + (r.missing || []).join(', '));
    ok(actII >= ACT2_SEASONS * BEK_SEASON_DAYS,
       p.id + ': Act II is at least ' + ACT2_SEASONS + ' more seasons',
       actII + ' days = ' + (actII / BEK_SEASON_DAYS).toFixed(1) + ' seasons');
    ok(hrs >= TOTAL_HOURS[0] && hrs <= TOTAL_HOURS[1],
       p.id + ': the whole run is ' + TOTAL_HOURS[0] + '-' + TOTAL_HOURS[1] + ' real hours',
       hrs.toFixed(1) + ' h over ' + r.day + ' days (' + (REAL_MIN(r.minTotal) / r.day).toFixed(1) + ' real min a day)');
    ok(r.blocked.length === 0, p.id + ': never a morning with money and nothing worth wanting',
       r.blocked.length ? 'blocked on days ' + r.blocked.slice(0, 8).join(',') : 'none');
    ok((r.gap || 0) <= MAX_GAP, p.id + ': never more than ' + MAX_GAP + ' days between two things to buy',
       'longest wait ' + (r.gap || 0) + ' days');
  });

  /* ---- 4. and none of them is running away with it ------------------------- */
  console.log('\n-- the four against each other --');
  const marks = ['hakke', 'lot', 'actI', 'loft', 'plot3', 'barn', 'tilbygg', 'greenhouse', 'spine'];
  let widest = 0, widestAt = '';
  marks.forEach(m => {
    const days = runs.map(({ r }) => r.stage[m]).filter(d => d > 0);
    if (days.length < runs.length) {
      ok(false, 'every policy reaches ' + m, days.length + ' of ' + runs.length + ' did');
      return;
    }
    const lo = Math.min(...days), hi = Math.max(...days);
    const ratio = hi / lo;
    if (ratio > widest) { widest = ratio; widestAt = m; }
    ok(ratio <= STAGE_SPREAD, 'no policy is dramatically ahead at ' + m + ' (≤' + STAGE_SPREAD + 'x)',
       'day ' + lo + '-' + hi + ' (' + ratio.toFixed(2) + 'x): ' +
       runs.map(({ p, r }) => p.id.split('-')[0] + ' ' + r.stage[m]).join(', '));
  });
  const hours = runs.map(({ r }) => REAL_MIN(r.minTotal) / 60);
  ok(Math.max(...hours) / Math.min(...hours) <= 2,
     'and no policy plays twice as long as another to get to the same ending',
     hours.map(h => h.toFixed(1) + 'h').join(' / '));
  pass('four policies', 'Act I day ' + runs.map(x => x.r.stage.actI).join('/') +
       ', ending day ' + runs.map(x => x.r.stage.spine).join('/') +
       ', ' + hours.map(h => h.toFixed(1)).join('/') + ' real hours, widest stage spread ' +
       widest.toFixed(2) + 'x at ' + widestAt);
  return runs;
}
export { BEK_RECIPES };
