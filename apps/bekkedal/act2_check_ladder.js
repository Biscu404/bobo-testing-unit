/* Bekkedal — the two things a run is aiming at.
 *
 * A fifth sibling of `act2_check.js`, split off `act2_check_sim.js` for the
 * 300-line rule; still one command. What lives here is everything a day of
 * the simulation is *for*, as opposed to how it is spent: the purchase
 * ladder, and the loft's sixty-four entries seen from inside a run.
 *
 * Both are read rather than written down. The ladder is collected out of
 * `BEK_TALK`'s own `buy` offers plus `progression.js`'s three costs and the
 * handful of `BEK_ITEMS` a farm actually buys more than one of — so a price
 * that moves in the dialogue moves the ladder, and the lifetime figure the
 * balance pass asserts is derived rather than tallied by hand. The loft half
 * is not a second copy of `spine_check.js`'s table either: it is the same
 * `LOFT_ENTRIES`, asked a different question — not "can this ever be got"
 * but "can *this run* have got it by today", which is where the money and
 * the calendar meet.
 */
import { BEK_ITEMS, BEK_CROPS, BEK_TALK, BEK_LOT_COST, BEK_FISH_WATERS } from './data.js';
import { houseCost, houseTierCost, greenhouseCost } from './progression.js';
import { seasonOf, festivalOf, cropInSeason } from './seasons.js';
import { LOFT_ENTRIES } from './spine.js';

/* ---- the ladder -----------------------------------------------------------
   Everything in the valley that takes kr and gives something back, collected
   out of the tables rather than listed here: every `buy` offer anywhere in
   BEK_TALK (the bag, the can, the axe, the rod, the pick, the fields, the two
   pens), the lot, the house, the annex and the glass, and the things a shop
   sells that a farm actually wants. `at` is what has to be true first. */
function talkOffers() {
  const out = [];
  Object.keys(BEK_TALK).forEach(id => {
    const b = BEK_TALK[id];
    [].concat(b.nodes || [], b.chat || []).forEach(n => {
      if (n.buy && n.buy.kr) out.push({ id: id + ':' + (n.buy.tool || n.id || Object.keys(n.buy.flag || { x: 1 })[0]),
                                        kr: n.buy.kr, who: id, buy: n.buy });
    });
  });
  return out;
}
export function ladder() {
  const off = talkOffers();
  const one = k => off.filter(o => JSON.stringify(o.buy).indexOf(k) >= 0)[0];
  const kr = o => (o ? o.kr : 0);
  const FURNITURE_SET = (BEK_TALK.hakon.furniture || []).reduce((a, i) => a + (BEK_ITEMS[i].buy || 0), 0);
  const L = [
    { id: 'hakke', kr: kr(one('"tool":"hakke"')), at: s => true, give: s => { s.hasPick = 1; } },
    { id: 'lykt', kr: BEK_ITEMS.lykt.buy, at: s => s.hasPick, give: s => { s.hasLamp = 1; } },
    { id: 'bag1', kr: kr(one('"bagTier":1')), at: s => true, give: s => { s.bagTier = 1; } },
    { id: 'lot', kr: BEK_LOT_COST, at: s => s.tommerQuest, give: s => { s.lot = 1; } },
    { id: 'house', kr: houseCost({ flag: { build: 'skog', rabatt2: 1 } }).kr, at: s => s.lot,
      mats: houseCost({ flag: { build: 'skog', rabatt2: 1 } }), give: s => { s.built = 1; s.act2 = 1; } },
    { id: 'ullgenser', kr: BEK_ITEMS.ullgenser.buy, at: s => true, give: s => { s.warm = 1; } },
    { id: 'plot2', kr: kr(one('"plot2":1')), at: s => s.tommerQuest, give: s => { s.plot2 = 1; } },
    { id: 'kanne2', kr: kr(one('"kanneLv":1')), at: s => true, give: s => { s.kanneLv = 1; } },
    { id: 'oks2', kr: kr(one('"axeLv":2')), at: s => s.tommerQuest, give: s => { s.axeLv = 2; } },
    { id: 'stang2', kr: kr(one('"rodLv":2')), at: s => true, give: s => { s.rodLv = 2; } },
    { id: 'bag2', kr: kr(one('"bagTier":2')), at: s => s.bagTier >= 1, give: s => { s.bagTier = 2; } },
    { id: 'plot3', kr: kr(one('"plot3":1')), at: s => s.plot2, give: s => { s.plot3 = 1; } },
    { id: 'barn', kr: kr(one('"barn":1')), at: s => s.plot3, give: s => { s.barn = 1; } },
    { id: 'goats', kr: BEK_ITEMS.geit.buy * 4, at: s => s.barn, give: s => { s.goats = 4; } },
    { id: 'jars', kr: BEK_ITEMS.jar.buy * 4, at: s => s.built, give: s => { s.jars = 4; } },
    { id: 'tilbygg', kr: houseTierCost().kr, at: s => s.act2, mats: houseTierCost(), give: s => { s.tier = 1; } },
    { id: 'barn2', kr: kr(one('"barn2":1')), at: s => s.act2 && s.barn, give: s => { s.barn2 = 1; } },
    { id: 'kegs', kr: BEK_ITEMS.keg.buy * 4, at: s => s.jars, give: s => { s.kegs = 4; } },
    { id: 'goats2', kr: BEK_ITEMS.geit.buy * 4, at: s => s.barn2, give: s => { s.goats = 8; } },
    { id: 'sprinklers', kr: BEK_ITEMS.sprinkler.buy * 6, at: s => s.plot3, give: s => { s.spr = 6; } },
    { id: 'greenhouse', kr: greenhouseCost().kr, at: s => s.act2, mats: greenhouseCost(), give: s => { s.glass = 1; } },
    { id: 'furniture', kr: FURNITURE_SET, at: s => s.built, give: s => { s.furnished = 1; } },
    /* and the far end of it. The check found the real hole here: with the
       last of the one-off upgrades bought around day fifty and the loft
       running to ninety, there were forty mornings with money in the purse
       and nothing at all to want. A second of each is not padding — the pen
       holds eight, the annex and the yard both want furnishing, and a farm
       with three fields wants more than eight spreaders. */
    { id: 'jars2', kr: BEK_ITEMS.jar.buy * 4, at: s => s.kegs, give: s => { s.jars = 8; } },
    { id: 'kegs2', kr: BEK_ITEMS.keg.buy * 4, at: s => s.kegs, give: s => { s.kegs = 8; } },
    { id: 'sprinklers2', kr: BEK_ITEMS.sprinkler.buy * 6, at: s => s.spr, give: s => { s.spr = 12; } },
    { id: 'furniture2', kr: FURNITURE_SET, at: s => s.furnished && s.tier, give: s => { s.furnished = 2; } }
  ];
  return L.filter(x => x.kr > 0);
}
export const lifetimeSinks = () => ladder().reduce((a, x) => a + x.kr, 0);

/* ---- the loft, entry by entry ---------------------------------------------
   Not a second copy of spine_check.js's table — the same LOFT_ENTRIES, asked
   a different question: not "can this ever be got" but "can *this run* have
   got it by today", which is where the money and the calendar meet. */
export function spineTick(s) {
  let have = 0;
  s.missing = [];
  LOFT_ENTRIES.forEach(x => {
    if (entryBy(s, x.e, x.w)) have++; else s.missing.push(x.w.id + ':' + x.e.id);
  });
  s.spine = have;
  if (have >= LOFT_ENTRIES.length) s.spineDone = 1;
}
function entryBy(s, e, w) {
  if (e.id.indexOf('fr:') === 0) return (s.fr[e.id.slice(3)] || 0) >= 10;
  if (e.id === 'deep10') return s.deepest >= 10;
  if (e.id === 'deep20') return s.deepest >= 20;
  if (e.season) {
    /* a festival offering: the day itself, and the thing in hand on it */
    for (let d = s.stage.loft || 1; d <= s.day; d++)
      if (festivalOf(d) && seasonOf(d).id === e.season && itemBy(s, e.item, d)) return true;
    return false;
  }
  return itemBy(s, e.item, s.day);
}
function itemBy(s, id, day) {
  const crop = Object.keys(BEK_CROPS).filter(c => BEK_CROPS[c].out === id)[0];
  if (crop) {
    if (s.glass) return true;
    for (let d = s.stage.loft || 1; d <= day - BEK_CROPS[crop].days; d++) if (cropInSeason(crop, d)) return true;
    return false;
  }
  const legend = Object.keys(BEK_FISH_WATERS).filter(m => BEK_FISH_WATERS[m].legend === id)[0];
  if (legend) {
    const lw = BEK_FISH_WATERS[legend].legendWhen;
    for (let d = s.stage.loft || 1; d <= day; d++) if (seasonOf(d).id === lw.season) return true;
    return false;
  }
  if (id === 'krystall') return s.deepest >= 12;
  if (id === 'solv' || id === 'kobber' || id === 'jern' || id === 'stein') return !!s.hasPick;
  if (['orret', 'laks', 'roye', 'torsk', 'makrell', 'kveite', 'gullorret'].indexOf(id) >= 0) return day > (s.stage.loft || 0);
  if (['melk', 'ull', 'egg', 'brunost'].indexOf(id) >= 0) return (s.goats || 0) > 0;
  if (id === 'syltetoy') return (s.jars || 0) > 0;
  if (id === 'fruktvin') return (s.kegs || 0) > 0;
  if (['potetstuing', 'gulrotkake', 'rabarbragrot'].indexOf(id) >= 0) return (s.goats || 0) > 0 && s.lv.farm >= 2;
  if (id === 'sprinkler') return (s.spr || 0) > 0 || s.kr > BEK_ITEMS.sprinkler.buy;
  if (id === 'gjerde') return !!s.hasPick;
  return day > (s.stage.loft || 0);              /* forage, wood, flowers */
}

