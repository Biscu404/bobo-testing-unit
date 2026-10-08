/* BEKKEDAL's trophies (docs/achievements/games-2.md). Bilingual like a line of its dialogue: every name, description and rumour is `{ no, en }`, shown as English alone or as both,
   as the ledger is set. The Norwegian is a first draft for somebody who reads it to review (register: the game's own lines). Data only: trophy_calls.js is where the game tells the ledger
   what happened, and most of it is not an event at all but a question put to the save (`scan`): the facts below under `state` are read off S, so nothing here can disagree with it.
   Events: harvest { crop, grade }, catch { fish, rare, legend }, fell { glyph, clean, glances, hearts }, ore { ore }, craft { id }, cook { id }, gift { npc, tier }, bear, place-refused,
   use { what }, day { passedOut }, state { day, season, lot, built, houseDay, greenhouse, barn, deepest, fr10, arc, errands, loft... }.
   Sets: crops, fish, legends, gifted, cook, use, fairs, visit, scenes. Counter placed. Streaks: chores, bed, clean. Not trophies, on purpose: gold earned, items sold, steps walked,
   tiles ploughed, anything that is a counter of a chore. */
import { t, secret, rule } from '../trophy_kit.js';
import { BEK_CROPS, BEK_MAPS, BEK_SCENES, BEK_RECIPES } from './data.js';
import { LOFT_TOTAL } from './spine.js';
const on = rule.on;

/* a bilingual trophy: bk(id, [no, en] name, tier, kind, [no, en] description, rule, options) */
const L = (a) => ({ no: a[0], en: a[1] });
const bk = (id, name, tier, kind, desc, r, o) => t(id, L(name), tier, kind, L(desc), r, o);
const bks = (id, name, tier, kind, hint, desc, r, o) => secret(id, L(name), tier, kind, L(hint), L(desc), r, o);

export const CROPS = Object.keys(BEK_CROPS).length;
export const PLACES = Object.keys(BEK_MAPS).filter(k => !BEK_MAPS[k].inside).length;
export const DISHES = BEK_RECIPES.cook.length;
export const FISH = 10, LEGENDS = 3, FRIENDS = [1, 4, 8];
export const USES = ['read', 'clock', 'window', 'water', 'cat', 'tea'];          /* furniture_act.js: books, clock, window, plant, cat, tea */

export const TROPHIES = [
  /* ---- the farm and the house ---- */
  bk('bk_furrow', ['FØRSTE FURE', 'FIRST FURROW'], 'B', 'P', ['Høst den første avlingen din.', 'Harvest your first crop.'], on('harvest')),
  bk('bk_crops8', ['ÅTTE RADER', 'EIGHT ROWS'], 'S', 'P', ['Høst åtte ulike vekster.', 'Harvest eight different crops.'], rule.sets('crops', 8)),
  bk('bk_crops12', ['TOLV RADER', 'TWELVE ROWS'], 'G', 'P', ['Høst alle tolv vekstene.', 'Harvest all twelve crops.'], rule.sets('crops', CROPS)),
  bk('bk_grade', ['FØRSTE KLASSE', 'FIRST CLASS'], 'B', 'S', ['Høst en vekst av beste kvalitet.', 'Harvest a crop of the best grade.'], on('harvest', p => p.grade >= 2)),
  bk('bk_lot', ['TOMTEN ER DIN', 'THE LOT IS YOURS'], 'B', 'P', ['Kjøp tomten ved vannet.', 'Buy the lot by the water.'], on('state', p => p.lot)),
  bk('bk_house', ['ET HUS VED VANNET', 'A HOUSE BY THE WATER'], 'S', 'P', ['Få huset bygget ferdig.', 'Finish building the house.'], on('state', p => p.houseDay != null)),
  bk('bk_house30', ['RASK HAMMER', 'SWIFT HAMMER'], 'S', 'S', ['Få huset ferdig innen dag 30.', 'Finish the house by day 30.'], on('state', p => p.houseDay != null && p.houseDay <= 30)),
  bk('bk_house24', ['ENDA RASKERE', 'FASTER STILL'], 'G', 'S', ['Få huset ferdig innen dag 24.', 'Finish the house by day 24.'], on('state', p => p.houseDay != null && p.houseDay <= 24)),
  bk('bk_greenhouse', ['GLASS OG SOL', 'GLASS AND SUN'], 'B', 'P', ['Bygg drivhuset.', 'Build the greenhouse.'], on('state', p => p.greenhouse)),
  bk('bk_barn', ['TAK FOR DYRA', 'A ROOF FOR THE ANIMALS'], 'B', 'P', ['Bygg fjøset.', 'Build the barn.'], on('state', p => p.barn)),
  bk('bk_chores', ['MORGENSTELL', 'MORNING CHORES'], 'S', 'S', ['Stell dyrene sju dager på rad.', 'Feed your animals on seven days running.'], rule.streak('chores', 7)),
  /* ---- the water ---- */
  bk('bk_fish5', ['SPORTSFISKER', 'ANGLER'], 'B', 'P', ['Land fem ulike arter.', 'Land five different species.'], rule.sets('fish', 5)),
  bk('bk_fish10', ['TI ARTER', 'TEN SPECIES'], 'G', 'P', ['Land alle ti artene, legendene også.', 'Land all ten species, legends and all.'], rule.sets('fish', FISH)),
  bk('bk_rare', ['EN GYLDEN MORGEN', 'A GOLDEN MORNING'], 'B', 'E', ['Land en sjelden fisk: en gullørret eller en kveite.', 'Land a rare fish: a golden trout or a halibut.'], on('catch', p => p.rare)),
  bks('bk_troll', ['TROLLET I VANNET', 'THE TROLL IN THE LAKE'], 'S', 'E', ['Noe veldig gammelt har sine egne tider i vannet, midt på sommeren, en klar kveld.', 'Something very old keeps its own hours in the lake, in high summer, on a clear evening.'], ['Land trollørreten.', 'Land the troll trout.'], on('catch', p => p.fish === 'trollorret')),
  bks('bk_king', ['HAVETS KONGE', 'THE KING OF THE SEA'], 'S', 'E', ['Fjorden har en konge. Han holder seg til den mørke halvdelen av året, i regnet, når lysene tennes.', 'The fjord has a king. He keeps to the dark half of the year, in the rain, as the lamps come on.'], ['Land havkongen.', 'Land the sea king.'], on('catch', p => p.fish === 'havkonge')),
  bks('bk_needle', ['DEN HVITE NÅLEN', 'THE WHITE NEEDLE'], 'S', 'E', ['På vidda, når isen slipper midtvinters, er noe sølvfarget våkent etter leggetid.', 'On the plateau, when the ice lets go in midwinter, something silver is awake after bedtime.'], ['Land sneulken.', 'Land the snow char.'], on('catch', p => p.fish === 'sneulke')),
  bk('bk_legends', ['TRE LEGENDER', 'THREE LEGENDS'], 'G', 'E', ['Land alle tre legendene.', 'Land all three legends.'], rule.sets('legends', LEGENDS)),
  /* ---- felling and the mine ---- */
  bk('bk_clean', ['RENT SNITT', 'CLEAN CUT'], 'B', 'S', ['Fell et tre uten ett eneste glipp.', 'Fell a tree without one glancing blow.'], on('fell', p => p.glances === 0)),
  bk('bk_heart', ['RETT I HJERTET', 'RIGHT IN THE HEART'], 'S', 'S', ['Fell en stor gran med to dype hogg og ingen glipp.', 'Fell a great fir with two deep blows and no glance.'], on('fell', p => p.glyph === 'G' && p.hearts >= 2 && p.glances === 0)),
  bk('bk_timber', ['TØMMERMANN', 'TIMBER MAN'], 'S', 'S', ['Fell fem trær på rad uten glipp.', 'Fell five trees in a row without a glance.'], rule.streak('clean', 5)),
  bk('bk_mine5', ['FØRSTE STASJON', 'THE FIRST STATION'], 'B', 'P', ['Nå etasje 5 i gruva.', 'Reach floor 5 of the mine.'], on('state', p => p.deepest >= 5)),
  bk('bk_mine10', ['TIENDE ETASJE', 'THE TENTH FLOOR'], 'S', 'P', ['Nå etasje 10.', 'Reach floor 10.'], on('state', p => p.deepest >= 10)),
  bk('bk_mine15', ['FORBI LYKTA', 'PAST THE LAMP'], 'G', 'P', ['Nå etasje 15.', 'Reach floor 15.'], on('state', p => p.deepest >= 15)),
  bk('bk_krystall', ['EN STEIN SOM LYSER', 'A STONE THAT SHINES'], 'S', 'P', ['Finn bergkrystall.', 'Mine rock crystal.'], on('ore', p => p.ore === 'krystall')),
  bk('bk_lamp', ['LYS TIL DYBDEN', 'LIGHT FOR THE DEEP'], 'S', 'P', ['Lag krystallykten.', 'Craft the crystal lamp.'], on('craft', p => p.id === 'krystallykt')),
  /* ---- the people ---- */
  bk('bk_fr1', ['EN VENN', 'A FRIEND'], 'B', 'P', ['Nå vennskap 10 med én person.', 'Reach friendship 10 with one person.'], on('state', p => p.fr10 >= FRIENDS[0])),
  bk('bk_fr4', ['FIRE VENNER', 'FOUR FRIENDS'], 'S', 'P', ['Nå vennskap 10 med fire personer.', 'Reach friendship 10 with four people.'], on('state', p => p.fr10 >= FRIENDS[1])),
  bk('bk_fr8', ['ÅTTE VENNER', 'EIGHT FRIENDS'], 'G', 'P', ['Nå vennskap 10 med alle åtte.', 'Reach friendship 10 with all eight.'], on('state', p => p.fr10 >= FRIENDS[2])),
  bk('bk_scene', ['DIN EGEN SCENE', 'A SCENE OF YOUR OWN'], 'B', 'P', ['Se din første hjertehendelse.', 'See your first heart event.'], rule.sets('scenes', 1)),
  bk('bk_arc', ['EN HEL HISTORIE', 'A WHOLE STORY'], 'S', 'P', ['Se alle tre hjertehendelsene til én person.', 'See all three heart events of one person.'], on('state', p => p.arc)),
  bk('bk_scenes', ['ALLES HISTORIE', "EVERYONE'S STORY"], 'G', 'P', ['Se alle ' + BEK_SCENES.length + ' hjertehendelsene.', 'See all ' + BEK_SCENES.length + ' heart events.'], rule.sets('scenes', BEK_SCENES.length)),
  bk('bk_gift', ['AKKURAT DET JEG TRENGTE', 'JUST WHAT I WANTED'], 'B', 'E', ['Gi en gave de elsker.', 'Give a gift they love.'], on('gift', p => p.tier === 'loved')),
  bk('bk_gifts8', ['EN GAVE TIL ALLE', 'A PRESENT FOR EVERYONE'], 'S', 'S', ['Gi hver av de åtte en gave de elsker.', 'Give each of the eight a gift they love.'], rule.sets('gifted', 8)),
  bk('bk_errands', ['ALLE SJU ÆRENDER', 'ALL SEVEN ERRANDS'], 'S', 'P', ['Fullfør de sju faste oppdragene.', 'Finish the seven fixed requests.'], on('state', p => p.errands)),
  bks('bk_bear', ['PERKELE', 'PERKELE'], 'B', 'E', ['Noen i skogen feier alltid. Si hei.', 'Someone in the wood is always sweeping. Say hello.'], ['Snakk med bjørnen.', 'Talk to the bear.'], on('bear')),
  /* ---- the house and the year ---- */
  bk('bk_place10', ['HJEMMEBYGGER I', 'HOME MAKER I'], 'B', 'P', ['Ha ti ting satt ned i huset eller på tunet samtidig.', 'Have ten pieces placed in your home or yard at once.'], rule.stat('placed', 10)),
  bk('bk_place30', ['HJEMMEBYGGER II', 'HOME MAKER II'], 'S', 'P', ['Ha tretti ting satt ned samtidig.', 'Have thirty placed at once.'], rule.stat('placed', 30)),
  bks('bk_nice', ['BRA FORSØK', 'NICE TRY'], 'B', 'E', ['Du kan sette opp gjerde hvor som helst. Nesten.', 'You can fence anything. Almost.'], ['Prøv å sette et gjerde eller en grind som stenger inne en dør.', 'Try to place a fence or gate that would wall in a door.'], on('place-refused')),
  bk('bk_answers', ['HUSET SVARER', 'THE HOUSE ANSWERS'], 'S', 'E', ['Bruk seks ting i huset: bøker, klokke, vindu, plante, katt og te.', 'Use six things in the house: books, clock, window, plant, cat and tea.'], rule.sets('use', USES.length)),
  bk('bk_table', ['DUKET BORD', 'A LAID TABLE'], 'S', 'P', ['Lag alle ' + DISHES + ' rettene.', 'Cook all ' + DISHES + ' dishes.'], rule.sets('cook', DISHES)),
  bk('bk_winter', ['FØRSTE SNØ', 'THE FIRST SNOW'], 'B', 'P', ['Nå vinteren.', 'Reach winter.'], on('state', p => p.day >= 61)),
  bk('bk_year', ['ET ÅR I DALEN', 'A YEAR IN THE VALLEY'], 'S', 'P', ['Nå dag 81: en hel runde med årstider.', 'Reach day 81: one full round of the seasons.'], on('state', p => p.day >= 81)),
  bk('bk_fairs', ['ALLE FIRE MARKEDER', 'ALL FOUR FAIRS'], 'S', 'E', ['Vær på torget på hver av de fire festdagene.', 'Be on the town square on each of the four festival days.'], rule.sets('fairs', 4)),
  bk('bk_early', ['TIDLIG I SENGA', 'EARLY TO BED'], 'S', 'S', ['Gå til sengs før midnatt sju dager på rad.', 'Go to bed before midnight seven days running.'], rule.streak('bed', 7)),
  bks('bk_magpie', ['EN TYV MED FJÆR', 'A THIEF IN FEATHERS'], 'B', 'J', ['Hold deg oppe. Se hva natten koster.', 'Stay up. See what the night costs.'], ['Sovne der du står klokka 02:00.', 'Fall asleep where you stand at 02:00.'], on('day', p => p.passedOut)),
  bk('bk_valley', ['HELE DALEN', 'THE WHOLE VALLEY'], 'S', 'E', ['Besøk alle ' + PLACES + ' stedene.', 'Visit all ' + PLACES + ' places.'], rule.sets('visit', PLACES)),
  /* ---- the loft ---- */
  bk('bk_key', ['NØKKELEN', 'THE KEY'], 'S', 'P', ['Få nøkkelen til LOFTET.', 'Be given the key to LOFTET.'], on('state', p => p.loftOpen)),
  bk('bk_wing1', ['EN FLØY', 'ONE WING'], 'B', 'P', ['Fullfør én fløy av loftet.', 'Complete one wing of the loft.'], on('state', p => p.wings >= 1)),
  bk('bk_wing4', ['FIRE FLØYER', 'FOUR WINGS'], 'S', 'P', ['Fullfør fire fløyer.', 'Complete four wings.'], on('state', p => p.wings >= 4)),
  bk('bk_loft', ['LOFTET, FULLFØRT', 'LOFTET, COMPLETE'], 'G', 'P', ['Fullfør alle sju fløyene: ' + LOFT_TOTAL + ' ting.', 'Complete all seven wings: ' + LOFT_TOTAL + ' things.'], on('state', p => p.loftDay != null)),
  bk('bk_loft100', ['ET RASKT ÅR', 'A FAST YEAR'], 'G', 'S', ['Fullfør loftet innen dag 100.', 'Complete the loft by day 100.'], on('state', p => p.loftDay != null && p.loftDay <= 100))
];

/* what the save already proves, found the first time the ledger loads (the save key is BEK_SAVE: templeos.bekkedal.v2) */
export function backfill(read) {
  const s = read('templeos.bekkedal.v2'), ids = [];
  if (!s || typeof s !== 'object') return ids;
  if (s.flag && s.flag.lot) ids.push('bk_lot');
  if (s.houseBuilt) ids.push('bk_house');
  if (s.houseBuilt && s.houseBuiltDay != null && s.houseBuiltDay <= 30) ids.push('bk_house30');
  if (s.houseBuilt && s.houseBuiltDay != null && s.houseBuiltDay <= 24) ids.push('bk_house24');
  if (s.flag && s.flag.greenhouse) ids.push('bk_greenhouse');
  if (s.flag && s.flag.barn) ids.push('bk_barn');
  if ((s.deepest || 0) >= 5) ids.push('bk_mine5'); if ((s.deepest || 0) >= 10) ids.push('bk_mine10'); if ((s.deepest || 0) >= 15) ids.push('bk_mine15');
  if ((s.day || 0) >= 61) ids.push('bk_winter'); if ((s.day || 0) >= 81) ids.push('bk_year');
  const done = s.spine && s.spine.done;
  if (done) { ids.push('bk_loft'); if (done <= 100) ids.push('bk_loft100'); }
  return ids;
}
