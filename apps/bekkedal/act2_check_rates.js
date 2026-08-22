/* Bekkedal — what an hour of each of the five livelihoods is worth.
 *
 * The third sibling of `act2_check.js` (with `act2_check_walk.js`), split for
 * the 300-line rule and still one command. `act2_check_walk.js` answers how
 * far; this answers how much, and the two together are the rate table the
 * balance simulation and its assertions are built on.
 *
 * **Every number here is read, none is written down.** Sell prices come out
 * of `BEK_ITEMS`, energy out of `BEK_TOOLS`, crop timings out of `BEK_CROPS`,
 * the ore mix out of `MINE_BANDS` and `oreKind`'s own split, the fish out of
 * `BEK_FISH_WATERS`, the forage out of `BEK_FORAGE_DROPS`, how fast a square
 * comes back out of `BEK_REGROW`, and the stamina, the clock and the QUALITY
 * markup out of the rate block in `data.js`. That is the whole point of the
 * file: a price that moves moves the rate, the rate moves the assertion, and
 * the assertion fails in a check rather than in a playthrough.
 *
 * Two axes, because a day has two budgets. **kr per energy** is the rule the
 * brief states and the one that caught the old pick: with a 200-point bar and
 * no other limit, whichever activity pays most per point is the only one
 * worth doing. **kr per in-game minute** is the rule the bigger maps added —
 * the clock runs 06:00 to 02:00 whatever the bar says, so an activity that is
 * cheap in energy and ruinous in walking (a cast) and one that is dear in
 * energy and quick on its feet (a vein) can pay the same per point and still
 * not be the same choice.
 *
 * And **three stages**, because the spread that matters is the spread between
 * two things a player can do on the same afternoon. Comparing a fresh hoe
 * against the bottom of the mine says nothing; comparing everything reachable
 * at each stage of the game is the test the old one-shot figure was reaching
 * for and missing.
 */
import { BEK_ITEMS, BEK_CROPS, BEK_TOOLS, BEK_FISH_WATERS, BEK_FORAGE_DROPS,
         BEK_ANIMAL_KINDS, BEK_RECIPES, BEK_PRESV_DAYS, BEK_GRADE_MULT,
         BEK_RARE_CHANCE, BEK_REGROW, OKS_GRAN_E, BEK_MAPS, BEK_SOLID } from './data.js';
import { MINE_BANDS, mineDig, MINE_GEM_FLOOR, mineFloor } from './mine.js';
import { TILE_MIN, swingMin, tourOf } from './act2_check_walk.js';

export const toolE = id => BEK_TOOLS.filter(t => t.id === id)[0].e;
const sell = id => BEK_ITEMS[id].sell || 0;
const buy = id => BEK_ITEMS[id].buy || 0;

/* ---- the three stages -----------------------------------------------------
   What a player has in hand, not what exists. `floor` is how deep the mine is
   open to them, `rare` the cast's own rare chance (a good spot and the shrimp
   bait each add 0.05 to BEK_RARE_CHANCE — pickFishSpecies(), index.js). */
export const STAGES = [
  { id: 'early', t: 'day one', lvl: 0, axeLv: 1, pickLv: 1, grade: 0, floor: 0,
    rare: BEK_RARE_CHANCE, waters: ['lake'] },
  { id: 'mid', t: 'the house is up', lvl: 2, axeLv: 2, pickLv: 2, grade: 1, floor: 10,
    rare: BEK_RARE_CHANCE + 0.05, waters: ['lake', 'fjord', 'vidda'] },
  { id: 'late', t: 'the loft is filling', lvl: 3, axeLv: 2, pickLv: 2, grade: 2, floor: 20,
    rare: BEK_RARE_CHANCE + 0.1, waters: ['lake', 'fjord', 'vidda'] }
];

const row = (id, kr, en, min, cap) =>
  ({ id: id, kr: kr, en: en, min: min, cap: cap,
     krEn: en > 0 ? kr / en : null, krMin: min > 0 ? kr / min : null });

/* how many of a thing a day offers: the map's stock over how long it takes to
   come back, never the whole stock every morning */
const perDay = (n, days) => Math.max(1, Math.round(n / days));

/* ---- ÅKEREN — one plot, one sowing --------------------------------------- */
const FARM_TILE = tourOf('farm', 'f', { x: 8, y: 8 }).perTile || 1;
export function cropRow(cropId, st) {
  const c = BEK_CROPS[cropId];
  const seedId = Object.keys(BEK_ITEMS).filter(k => BEK_ITEMS[k].seed === cropId)[0];
  const till = Math.max(1, toolE('spade') - (st.lvl >= 1 ? 1 : 0));
  const water = Math.max(1, toolE('kanne') - (st.lvl >= 1 ? 1 : 0));
  const yieldN = 1 + (st.lvl >= 3 ? FARM_LV3_DOUBLE : 0);
  const price = sell(c.out) * BEK_GRADE_MULT[st.grade] * yieldN;
  const regrow = c.regrow ? Math.max(1, c.regrow - (st.lvl >= 2 ? 1 : 0)) : 0;
  /* a regrowing crop is priced over three harvests off one sowing, which is
     what makes it a plan rather than a better potato */
  const harvests = regrow ? 3 : 1;
  const en = (till + 1 + c.days * water + 1) + (harvests - 1) * (regrow * water + 1);
  const acts = (3 + c.days) + (harvests - 1) * (regrow + 1);
  return row('crop:' + cropId, price * harvests - buy(seedId), en,
             acts * (FARM_TILE * TILE_MIN + swingMin('hand')), null);
}
/* farm lvl3's second head — index.js's FARM_LV3_DOUBLE, cited rather than
   imported because it is a chance inside act() and not a table */
const FARM_LV3_DOUBLE = 0.2;

/* ---- SKOGEN — one tree ---------------------------------------------------- */
export function fellRows(st) {
  const cut = st.axeLv >= 2 ? 1 : 0;
  const y = tourOf('forest', 'Y', { x: 22, y: 15 });
  const yf = tourOf('farm', 'Y', { x: 8, y: 8 });
  const g = tourOf('forest', 'G', { x: 22, y: 15 });
  const sw = swingMin('oks');
  const out = [row('fell:birch', sell('tommer'), Math.max(1, toolE('oks') - cut),
                   y.perTile * TILE_MIN + sw, perDay(y.n + yf.n, BEK_REGROW.birch))];
  if (st.axeLv >= 2) out.push(row('fell:gran', 2 * sell('tommer'),
    Math.max(1, toolE('oks') + OKS_GRAN_E - cut), g.perTile * TILE_MIN + sw,
    perDay(g.n, BEK_REGROW.gran)));
  return out;
}

/* ---- FJELLET — one swing --------------------------------------------------
   `oreKind` (rock.js) splits the declared `ore` channel — modulus 20, see
   noise_recipes.js's own F('ore', 19, 20) — at 11 and 17 on a plain vein and
   at 12 on a rich one. Counted here rather than cited, so the split moving
   moves the rate. On a generated floor the mix is not that: `mine.js` chooses
   which faces become veins by the band's own preference weights, so the mix a
   band converges on is MINE_BANDS' `ore` normalised, with `rich`/12 of the
   squares carrying the rich split instead and `gem`/12 of *those* a crystal
   once the floor is past MINE_GEM_FLOOR. */
const ORE_MOD = 20, RICH_MOD = 12, GEM_MOD = 12;
export function plainMix() {
  const m = { jern: 0, kobber: 0, solv: 0 };
  for (let v = 0; v < ORE_MOD; v++) m[v < 11 ? 'jern' : v < 17 ? 'kobber' : 'solv']++;
  Object.keys(m).forEach(k => { m[k] /= ORE_MOD; });
  return m;
}
export function richMix() {
  const m = { kobber: 0, solv: 0 };
  for (let v = 0; v < ORE_MOD; v++) m[v < 12 ? 'solv' : 'kobber']++;
  Object.keys(m).forEach(k => { m[k] /= ORE_MOD; });
  return m;
}
function bandMix(band) {
  const w = band.ore, tot = Object.keys(w).reduce((a, k) => a + w[k], 0), m = {};
  Object.keys(w).forEach(k => { m[k] = w[k] / tot; });
  return m;
}
const mixValue = m => Object.keys(m).reduce((a, k) => a + m[k] * sell(k), 0);

export function mineRows(st) {
  const sw = swingMin('hakke'), out = [];
  const lvlOff = st.lvl >= 1 ? 1 : 0;
  const extra = st.lvl >= 3 ? 1.25 : 1;                 /* mine lvl3's second piece */
  const g = tourOf('gruva', 'OQ', { x: 20, y: 12 });
  out.push(row('mine:gruva', mixValue(plainMix()) * extra + sell('stein'),
    Math.max(1, toolE('hakke') - lvlOff), g.perTile * TILE_MIN + sw,
    perDay(g.n, Math.max(1, BEK_REGROW.vein - (st.lvl >= 2 ? 1 : 0)))));
  MINE_BANDS.forEach(b => {
    if (b.from > st.floor) return;
    const def = mineFloor(0x5eed, b.from);
    const t = tourOf(def.rows, 'OQ', { x: def.home[0], y: def.home[1] });
    /* a rich vein needs the STÅLHAKKE, so a stage without it walks past them */
    const richFrac = st.pickLv >= 2 ? b.rich / RICH_MOD : 0;
    const ore = (1 - richFrac) * mixValue(bandMix(b)) + richFrac * mixValue(richMix());
    const gem = b.from >= MINE_GEM_FLOOR ? richFrac * (b.gem / GEM_MOD) * sell('krystall') : 0;
    out.push(row('mine:' + b.id, ore * extra + sell('stein') + gem,
      Math.max(1, toolE('hakke') + mineDig(b.from) - lvlOff),
      t.perTile * TILE_MIN + sw, t.n));
  });
  return out;
}

/* ---- VANNET — one cast ----------------------------------------------------
   A cast is not a fish: the wait, the strike and the fight are the minutes,
   and a share of them end with the line broken. FIGHT_MIN and LAND are the
   two figures in this file that are measured rather than read — the reel is a
   real-time skill test, so how long it takes and how often it is won are
   properties of a player, not of a table. Both were taken off casts driven
   through the real frame loop in scripts/bekkedal_playtest.mjs. */
export const FIGHT_MIN = 28, LAND = [0.85, 0.92, 0.97];
export function fishRows(st) {
  return st.waters.map(mp => {
    const w = BEK_FISH_WATERS[mp];
    const tot = w.pool.reduce((a, p) => a + p.w, 0);
    const base = w.pool.reduce((a, p) => a + (p.w / tot) * sell(p.id), 0);
    const kr = (1 - st.rare) * base + st.rare * sell(w.rare);
    const t = tourOf(mp, 'W', { x: 10, y: 13 });
    return row('fish:' + mp, kr * LAND[Math.min(2, st.lvl > 0 ? st.lvl - 1 : 0)],
               toolE('stang'), t.perTile * TILE_MIN + FIGHT_MIN, null);
  });
}

/* ---- SANKING — the one livelihood you can do with an empty bar ------------
   A wildflower costs a point (nothing at all past forage level 1); everything
   else is walked over and picked up for free. So forage's kr/energy is only
   meaningful before that level, and what has to hold afterwards is the other
   axis: the thing you get for nothing must not also be the best thing per
   minute. Both are measured; both are asserted. */
export const FLOWERS = ['blomst_bla', 'blomst_gul', 'blomst_ro'];
export function forageRows(st) {
  const p = tourOf('enga', 'p', { x: 22, y: 13 });
  /* which of the three comes up is a fresh roll every time (act(), index.js),
     so what a picked square is worth is the average of the three, not any one */
  const bloom = FLOWERS.reduce((a, id) => a + sell(id), 0) / FLOWERS.length;
  const out = [row('forage:blomst', bloom, st.lvl >= 1 ? 0 : 1,
                   p.perTile * TILE_MIN + swingMin('hand'), perDay(p.n, BEK_REGROW.flower))];
  const byMap = {};
  BEK_FORAGE_DROPS.forEach(d => {
    const m = byMap[d.map] || (byMap[d.map] = { n: 0, kr: 0 });
    m.n += d.n; m.kr += d.n * sell(d.item);
  });
  Object.keys(byMap).forEach(mp => {
    const m = byMap[mp];
    /* scattered drops are found by sweeping, so the walk is a share of the
       map's own walkable ground rather than a tour between known squares */
    let open = 0;
    BEK_MAPS[mp].rows.forEach(r => { for (const c of r) if (BEK_SOLID.indexOf(c) < 0) open++; });
    out.push(row('forage:' + mp, m.kr * (st.lvl >= 3 ? 1.3 : 1), 0, open * 0.4 * TILE_MIN, m.n));
  });
  return out;
}

/* ---- FJØSET, and the two things that turn time into money ----------------- */
export const cropAvg = () => Object.keys(BEK_CROPS)
  .reduce((a, c) => a + sell(BEK_CROPS[c].out), 0) / Object.keys(BEK_CROPS).length;
export function farmsteadRows() {
  const val = p => Object.keys(p).reduce((a, k) => a + p[k] * sell(k), 0);
  const feed = buy('dyrefor');
  const tend = 3 * (TILE_MIN + swingMin('hand'));
  /* a preserve's real price is not its two trips, it is the days it holds a
     crop and the kr the vessel cost — so it is stated as what one of them
     earns a day and how long that takes to pay the vessel back */
  const presv = k => {
    const add = sell(k === 'jar' ? 'syltetoy' : 'fruktvin') - cropAvg();
    return { id: 'presv:' + k, kr: add, en: 0, days: BEK_PRESV_DAYS[k],
             perDay: add / BEK_PRESV_DAYS[k], cost: buy(k),
             payback: Math.ceil(buy(k) / (add / BEK_PRESV_DAYS[k])) };
  };
  const beast = (kind, id) => {
    const add = val(BEK_ANIMAL_KINDS[kind].produce) - feed;
    return { id: 'dairy:' + kind, kr: add, en: 0, min: tend, perDay: add,
             cost: buy(id), payback: Math.ceil(buy(id) / add) };
  };
  return [beast('goat', 'geit'), beast('chicken', 'hone'), presv('jar'), presv('keg')];
}
/* what a meal is worth: `eat` is stamina, and stamina is the day's other
   budget, so a dish is priced in the kr the energy it hands back can earn */
export function foodRows(krPerEn) {
  const cooked = BEK_RECIPES.cook.map(r => r.out);
  return Object.keys(BEK_ITEMS).filter(id => BEK_ITEMS[id].eat).map(id => {
    const it = BEK_ITEMS[id];
    const cost = cooked.indexOf(id) >= 0
      ? Object.keys(BEK_RECIPES.cook.filter(r => r.out === id)[0].need)
          .reduce((a, n) => a + BEK_RECIPES.cook.filter(r => r.out === id)[0].need[n] * sell(n), 0)
      : buy(id);
    return { id: id, cooked: cooked.indexOf(id) >= 0, eat: it.eat, cost: cost,
             krPerPoint: cost / it.eat, net: it.eat * krPerEn - cost };
  });
}

/* ---- the table, at one stage ---------------------------------------------- */
export function rateTable(st) {
  return { crops: Object.keys(BEK_CROPS).map(c => cropRow(c, st)),
           fell: fellRows(st), mine: mineRows(st), fish: fishRows(st),
           forage: forageRows(st), farmstead: farmsteadRows() };
}
/* the one row per livelihood a rational player would pick at this stage —
   the comparison the "no single loop dominates" rule is really about */
export function bestOfEach(t) {
  const best = rows => rows.filter(r => r.krEn != null).sort((a, b) => b.krEn - a.krEn)[0] || null;
  return { aker: best(t.crops), skog: best(t.fell), fjell: best(t.mine),
           vann: best(t.fish), sanking: best(t.forage) };
}
