/* Bekkedal Act II check — `node apps/bekkedal/act2_check.js`
 *
 * act2Unlocked (index.js, set the moment houseBuilt is) gates four separate
 * surfaces: the house's own upgrade tier (hakonTilbygg(), index.js), the
 * pen's second tier (BEK_TALK.hakon's own offer), the quest board's two
 * higher-tier templates (BEK_QUEST_TEMPLATES' `act2` field, read by
 * quests.js's templateAvailable()), and one chat beat per NPC. Nothing on
 * screen proves any of the four actually stays locked before the milestone
 * and actually opens after it — that is what section 1 checks, reading the
 * same predicates/tables the game reads rather than a second copy of them.
 *
 * Section 2 is the balance pass, and it lives in three siblings of its own —
 * `act2_check_walk.js` (how far it is to everywhere, measured off the real
 * rows and seams), `act2_check_rates.js` (what an hour of each of the five
 * livelihoods is worth, priced off the real tables at three stages of the
 * game) and `act2_check_sim.js` (four players, four whole runs, arrival to
 * ending) — with `act2_check_balance.js` stating the targets. Split for the
 * 300-line rule, the way `mine_check_ore.js` is one of `mine_check.js`; still
 * one command.
 *
 * The simulation is a deliberate lower bound, not a prediction: it plays
 * optimally, never walks anywhere twice, never loses a fish it should not and
 * never stands still reading a conversation. A real playthrough takes at
 * least this long and never less — which is why the figures in the docs are
 * the ones `scripts/bekkedal_playtest.mjs` measured off the real frame loop,
 * with these beside them as the floor.
 */
import { BEK_TALK, BEK_QUEST_TEMPLATES, BEK_BARN_PLOT, BEK_BARN_PLOT2, BEK_BARN_SLOTS2,
         BEK_FARM_PLOTS, BEK_GREENHOUSE_PLOT, BEK_DECOR, BEK_MAPS } from './data.js';
import { houseTierAvailable, barnSlots } from './progression.js';
import { refreshBoard } from './quests.js';
import { PROP } from './decor.js';
import { balancePass } from './act2_check_balance.js';

let fails = 0, checks = 0;
const ok = (cond, label, detail) => {
  checks++;
  if (cond) return true;
  fails++; console.log('FAIL ' + label + (detail ? '   ' + detail : ''));
  return false;
};
const pass = (label, detail) => { checks++; console.log('OK   ' + label.padEnd(52) + (detail || '')); };

/* ---- 1a. the house tier, read-only against houseTierAvailable() ---------- */
console.log('\n-- house tier gate --');
ok(!houseTierAvailable({ act2Unlocked: false, built: 1, houseTier: 0 }), 'locked before act2Unlocked, even with the house standing');
ok(!houseTierAvailable({ act2Unlocked: true, built: 0, houseTier: 0 }), 'locked if the house itself is not built yet');
ok(!houseTierAvailable({ act2Unlocked: true, built: 1, houseTier: 1 }), 'locked once already bought (no double sale)');
ok(houseTierAvailable({ act2Unlocked: true, built: 1, houseTier: 0 }), 'open once act2Unlocked and built, before it is bought');
pass('house tier gate');

/* ---- 1b. every chat beat that actually depends on act2Unlocked ----------- */
console.log('\n-- NPC chat gating --');
/* an otherwise end-game-ish state, so toggling only act2Unlocked isolates
   exactly the entries that gate on it rather than on some other flag they
   also happen to need */
function permissiveS(act2) {
  return {
    act2Unlocked: act2, houseBuilt: act2, built: 1, houseTier: 0,
    flag: { why: 'quiet', build: 'skog', lot: 1, barn: 1, barn2: 0, plot2: 1, plot3: 1,
            rabatt: 1, rabatt2: 1, jordbar: 1, rabarbra: 1, boat: 1,
            mine: 'stein', dairy: 'melk', fell: 'jakt', fisk: 'ro', sea: 'hav', marit: 'ro' },
    fr: { astrid: 10, hakon: 10, ingrid: 10, olav: 10, marit: 10, sigrid: 10, gunnar: 10, lars: 10 },
    q: { potet: 'done', sopp: 'done', blomst: 'done', tommer: 'done', multe: 'done', boat: 'done', jern: 'done' },
    disc: { farm: 1, town: 1, lake: 1, forest: 1, enga: 1, setra: 1, vidda: 1, gruva: 1, fjord: 1 },
    festival: null, bagTier: 2, kanneLv: 1, pickLv: 2, axeLv: 2,
    tools: { spade: 1, kanne: 1, oks: 1, stang: 1, hakke: 1 },
    animals: [{ id: 'a1', kind: 'goat' }],
    /* the rest of the shape a chat gate may read — a `if:` predicate now
       reaches the weather, the season, the hour, the bag and yesterday's
       four activity counters as readily as it reaches S.flag, so a state
       this check hands one has to be a whole `S` or the sweep below only
       proves that the fields it happens to carry do not throw. Kept in step
       with fresh() (index.js): a new top-level field there wants a line
       here. */
    map: 'town', px: 8, py: 8, day: 30, min: 12 * 60, weather: 'klar', season: 1,
    bag: {}, chest: {}, seen: {}, met: {}, chatIx: {},
    xp: { farm: 0, mine: 0, forage: 0, fish: 0 },
    lvl: { farm: 0, mine: 0, forage: 0, fish: 0 },
    yst: { farm: 0, mine: 0, forage: 0, fish: 0 },
    xpDay: { farm: 0, mine: 0, forage: 0, fish: 0 }
  };
}
const sOff = permissiveS(false), sOn = permissiveS(true);
const STORY_NPCS = ['astrid', 'hakon', 'ingrid', 'olav', 'marit', 'sigrid', 'gunnar', 'lars'];
let anyGateThrew = null;
STORY_NPCS.forEach(id => {
  const chat = (BEK_TALK[id] && BEK_TALK[id].chat) || [];
  let unlockedByAct2 = 0;
  chat.forEach(c => {
    if (!c.if) return;
    let before, after;
    try { before = !!c.if(sOff); after = !!c.if(sOn); }
    catch (e) { anyGateThrew = anyGateThrew || { id, e }; return; }
    if (!before && after) unlockedByAct2++;
  });
  const wantMin = id === 'hakon' ? 2 : 1;     /* hakon: the barn2 offer, and the completion line */
  ok(unlockedByAct2 >= wantMin, id + ': at least ' + wantMin + ' chat entr' + (wantMin > 1 ? 'ies' : 'y') + ' newly open once act2Unlocked',
     unlockedByAct2 + ' found');
});
ok(!anyGateThrew, 'no chat gate throws evaluating a permissive state', anyGateThrew ? anyGateThrew.id + ': ' + anyGateThrew.e.message : '');

/* ---- and every other state the valley can actually be in -----------------
   A chat gate is arbitrary code reading `S`, and there are a hundred of them
   now — gated on the weather, the season, the hour, the festival, the bag
   and what yesterday's four counters say. The pass above proves they survive
   one state; this one sweeps the combinations a real day can hand them, on a
   fresh save as well as a finished one, and additionally asserts that every
   NPC always has at least one line left to say. An `if` that excluded the
   last entry in a pool would divide by zero in talkTo()'s own
   `pool[(ix - 1) % pool.length]`. */
const WEATHERS = ['klar', 'regn', 'take'];
const HOURS = [6, 9, 12, 15, 18, 21, 23];
let sweepThrew = null, emptiest = null, sweeps = 0;
function blankS(act2) {
  const s = permissiveS(act2);
  s.flag = {}; s.q = {}; s.disc = { farm: 1 }; s.bag = {};
  s.fr = { astrid: 0, hakon: 0, ingrid: 0, olav: 0, marit: 0, sigrid: 0, gunnar: 0, lars: 0 };
  s.bagTier = 0; s.kanneLv = 0; s.pickLv = 0; s.axeLv = 1;
  s.tools = { spade: 1, kanne: 1, oks: 1, stang: 0, hakke: 0 };
  s.animals = []; s.built = 0; s.houseTier = 0;
  return s;
}
for (const base of [permissiveS(false), permissiveS(true), blankS(false), blankS(true)]) {
  for (const weather of WEATHERS) for (const season of [0, 1, 2, 3]) for (const h of HOURS)
    for (const festival of [null, ['var', 'sommer', 'host', 'vinter'][season]]) {
      const st = Object.assign({}, base, { weather, season, festival, min: h * 60 });
      STORY_NPCS.forEach(id => {
        const chat = (BEK_TALK[id] && BEK_TALK[id].chat) || [];
        let live = 0;
        chat.forEach(c => {
          sweeps++;
          try { if (!c.if || c.if(st)) live++; }
          catch (e) { sweepThrew = sweepThrew || { id, e, weather, season, h }; }
        });
        if (!emptiest || live < emptiest.live) emptiest = { id, live, weather, season, h };
      });
    }
}
ok(!sweepThrew, 'no chat gate throws in any weather, season or hour',
   sweepThrew ? sweepThrew.id + ' (' + sweepThrew.weather + ', season ' + sweepThrew.season + ', ' +
                sweepThrew.h + ':00): ' + sweepThrew.e.message : sweeps + ' gate evaluations');
ok(emptiest && emptiest.live > 0, 'every NPC always has something left to say',
   emptiest ? 'thinnest pool: ' + emptiest.id + ' with ' + emptiest.live + ' lines (' +
              emptiest.weather + ', season ' + emptiest.season + ', ' + emptiest.h + ':00)' : '');
pass('NPC chat gating', STORY_NPCS.length + ' NPCs checked');

/* ---- 1c. the pen's second tier -------------------------------------------- */
console.log('\n-- pen tier 2 --');
ok(barnSlots({ flag: {} }).length === 4, 'tier 1 alone is 4 slots');
ok(barnSlots({ flag: { barn2: 1 } }).length === 8, 'tier 1 + tier 2 is 8 slots');
BEK_BARN_SLOTS2.forEach(sl => {
  ok(sl.x >= BEK_BARN_PLOT2.x0 && sl.x <= BEK_BARN_PLOT2.x1 && sl.y >= BEK_BARN_PLOT2.y0 && sl.y <= BEK_BARN_PLOT2.y1,
     'slot (' + sl.x + ',' + sl.y + ') sits inside BEK_BARN_PLOT2');
});
function overlaps(a, b) { return a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0; }
const REGIONS = [BEK_BARN_PLOT, BEK_BARN_PLOT2, BEK_GREENHOUSE_PLOT, ...BEK_FARM_PLOTS];
let regionClash = null;
for (let i = 0; i < REGIONS.length && !regionClash; i++)
  for (let j = i + 1; j < REGIONS.length; j++)
    if (overlaps(REGIONS[i], REGIONS[j])) { regionClash = [REGIONS[i], REGIONS[j]]; break; }
ok(!regionClash, 'no two farm-map overlay regions (pens/plots) overlap', regionClash ? JSON.stringify(regionClash) : '');
pass('pen tier 2', BEK_BARN_SLOTS2.length + ' new slots');

/* ---- 1d. the house's own decor tier --------------------------------------- */
console.log('\n-- house tier decor --');
const baseDecor = BEK_DECOR.lakehouse || [], t2Decor = BEK_DECOR.lakehouse_t2 || [];
const baseKeys = new Set(baseDecor.map(d => d.x + ',' + d.y));
let decorClash = null, decorOOB = null, decorBadKind = null;
const room = BEK_MAPS.lakehouse.rows;
t2Decor.forEach(d => {
  if (baseKeys.has(d.x + ',' + d.y)) decorClash = decorClash || d;
  if (d.y < 0 || d.y >= room.length || d.x < 0 || d.x >= room[d.y].length || room[d.y][d.x] === ' ') decorOOB = decorOOB || d;
  if (!PROP[d.kind]) decorBadKind = decorBadKind || d;
});
ok(!decorClash, 'lakehouse_t2 never reuses a lakehouse coordinate', decorClash ? JSON.stringify(decorClash) : '');
ok(!decorOOB, 'every lakehouse_t2 prop sits on a real room tile', decorOOB ? JSON.stringify(decorOOB) : '');
ok(!decorBadKind, 'every lakehouse_t2 kind exists in decor.js', decorBadKind ? JSON.stringify(decorBadKind) : '');
pass('house tier decor', t2Decor.length + ' new props');

/* ---- 1e. the board's two higher-tier templates ---------------------------- */
console.log('\n-- act2 quest templates --');
const ACT2_TEMPLATES = BEK_QUEST_TEMPLATES.filter(t => t.act2).map(t => t.id);
ok(ACT2_TEMPLATES.length >= 1, 'at least one act2 template exists', ACT2_TEMPLATES.join(', '));
function rollMany(act2, trials) {
  const S = { tools: { spade: 1, kanne: 1, oks: 1, stang: 1, hakke: 1 }, animals: [{ id: 'a1', kind: 'goat' }],
              fr: { astrid: 6, hakon: 6, ingrid: 6, olav: 6, marit: 6, sigrid: 6, gunnar: 6, lars: 6 },
              act2Unlocked: act2 };
  const seen = new Set();
  for (let t = 0; t < trials; t++) refreshBoard(S, 1000 + t).forEach(q => seen.add(q.tpl));
  return seen;
}
const preSeen = rollMany(false, 400);
const preLeaked = ACT2_TEMPLATES.filter(id => preSeen.has(id));
ok(preLeaked.length === 0, 'no act2 template ever rolls before act2Unlocked', '400 rolls, saw: ' + [...preSeen].join(','));
const postSeen = rollMany(true, 400);
const postMissing = ACT2_TEMPLATES.filter(id => !postSeen.has(id));
ok(postMissing.length === 0, 'every act2 template rolls at least once once act2Unlocked', '400 rolls');
pass('act2 quest templates', '400+400 rolls');

/* ============================================================================
   2. THE BALANCE PASS
   ---------------------------------------------------------------------------
   Three siblings, split for the 300-line rule the way `mine_check_ore.js` is
   one of `mine_check.js` — still one command. `act2_check_walk.js` measures
   the valley (how far to the wood, how far apart two birches are, how many
   in-game minutes that is); `act2_check_rates.js` prices every livelihood off
   the real tables at three stages of the game; `act2_check_sim.js` plays four
   whole runs, day by day, from arrival to the last shelf of the loft; and
   `act2_check_balance.js` states what all of it has to add up to.

   What used to be here was a single day-by-day energy budget asserting the
   house landed around day 8-10 with no loop dominating. Both halves of that
   were true of a game that has since been rebuilt underneath them — the maps
   are three and four times the size, so a day is mostly walking; the descent,
   the fishing overhaul, farming's quality and preserves, the loft's year of
   work and a house full of furniture all arrived after it was written. The
   targets are Act I in 20-25 days, Act II in at least four more seasons, six
   to ten real hours to the ending, and no livelihood or policy running away
   with it at any point along the way.
   ========================================================================== */
balancePass({ ok: ok, pass: pass });

console.log('\n' + (fails ? fails + ' of ' + checks + ' checks FAILED' : 'All ' + checks + ' act2 checks pass.'));
process.exit(fails ? 1 : 0);
