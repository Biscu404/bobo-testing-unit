/* Where Bekkedal tells the trophies what happened (the list is trophies.js). Two kinds of call. The few things that are not in the save afterwards (a harvest and its grade, a fish landed,
   a tree and how it was felled, a gift's tier, a refused fence) are one line each at the place the game does them. Everything else is a question put to the save: `scan(S)`, about once a
   second and on waking, derives the lot, the house and its day, the mine's depth, the friends, the heart events, the errands, the loft and so on from S and says only what changed, so a
   trophy can never disagree with the game it is for (and an old save is read the same way). Nothing in here writes to S, and none of it can throw into the game. */
import { trophies } from '../trophy_scope.js';
import { BEK_NPCS, BEK_SCENES, BEK_QUESTS, BEK_LOFT, BEK_FESTIVALS, BEK_MAPS } from './data.js';
import { spineOpen, wingDone } from './spine.js';
import { canPlace } from './placement.js';
import { PLACE_BLOCKS } from './decor.js';
import { USES } from './trophies.js';

const TR = trophies('bekkedal');
const guard = f => { try { return f(); } catch (e) { return undefined; } };
const FR_TOP = 10;
const PEOPLE = BEK_NPCS.filter(n => !n.bear).map(n => n.id);

export function createCalls() {
  let sig = '';
  return {
    harvest: (crop, grade) => guard(() => { TR.mark('crops', crop); TR.emit('harvest', { crop: crop, grade: grade }); }),
    caught(sp, item) { guard(() => { TR.mark('fish', sp); if (item.legend) TR.mark('legends', sp); TR.emit('catch', { fish: sp, rare: !!item.rare, legend: !!item.legend }); }); },
    /* a tree is down: how it was felled (chop.js's counters: `glances` blows that glanced off, `clean` the deep ones) */
    felled(c) { guard(() => { TR.streak('clean', c.glances === 0); TR.emit('fell', { glyph: c.glyph, glances: c.glances, hearts: c.clean }); }); },
    ore: ore => guard(() => TR.emit('ore', { ore: ore })),
    crafted: (id, cooking) => guard(() => { if (cooking) TR.mark('cook', id); TR.emit('craft', { id: id }); }),
    gift: (npc, tier) => guard(() => { if (tier === 'loved') TR.mark('gifted', npc); TR.emit('gift', { npc: npc, tier: tier }); }),
    bear: () => guard(() => TR.emit('bear', {})),
    used: what => guard(() => { if (what && USES.indexOf(what) >= 0) TR.mark('use', what); }),
    /* a placement was refused: only the one that is refused for walling in a door counts (the same placement would be allowed if the kind did not block) */
    refused(mapDef, placedHere, S, place) {
      guard(() => { if (PLACE_BLOCKS[place.kind] && canPlace(mapDef, placedHere, S.px, S.py, place.x, place.y, 'stol')) TR.emit('place-refused', {}); });
    },
    /* the night is over: kind is sleep.js's ('rested' went to bed before midnight, 'late' after it, 'ground' fell asleep where it stood at 02:00) */
    newDay(S, kind) {
      guard(() => {
        TR.streak('bed', kind === 'rested');
        TR.streak('chores', S.animals.length > 0 && S.animals.every(a => a.fed));
        TR.emit('day', { passedOut: kind === 'ground' });
      });
    },
    scan(S) {
      guard(() => {
        BEK_SCENES.forEach(sc => { if (S.seen['sc:' + sc.id]) TR.mark('scenes', sc.id); });
        Object.keys(S.disc).forEach(m => { if (BEK_MAPS[m] && !BEK_MAPS[m].inside) TR.mark('visit', m); });
        Object.keys(S.legend).forEach(sp => { TR.mark('legends', sp); TR.mark('fish', sp); });
        const fest = S.festival && BEK_FESTIVALS[S.festival];
        if (fest && S.map === fest.map) TR.mark('fairs', S.festival);
        const placed = Object.keys(S.placed).length;
        if (placed) TR.max('placed', placed);
        const state = {
          day: S.day, season: S.season, lot: !!S.flag.lot, houseDay: S.houseBuilt ? (S.houseBuiltDay || 99999) : null, greenhouse: !!S.flag.greenhouse, barn: !!S.flag.barn, deepest: S.deepest || 0,
          fr10: PEOPLE.filter(id => (S.fr[id] || 0) >= FR_TOP).length,
          arc: PEOPLE.some(id => ['4', '7', '10'].every(a => S.seen['sc:' + id + a])),
          errands: BEK_QUESTS.every(q => S.q[q.id] === 'done'),
          loftOpen: spineOpen(S), wings: BEK_LOFT.filter(w => wingDone(S, w.id)).length, loftDay: S.spine.done || null
        };
        const now = JSON.stringify(state);
        if (now !== sig) { sig = now; TR.emit('state', state); }
      });
    }
  };
}
