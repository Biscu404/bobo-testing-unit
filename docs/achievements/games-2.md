# Catalogue 2 of 4: Stand Battle, Bekkedal, The Bottle

Legend as in `games-1.md`: **K** P progression / S skill / E explore / C creative / J joke; **T** B S G; `*` secret; **Proof** `sim` /
`bot` / `tune` / `-`.

---

## Stand Battle Arena

**Mechanics found.** One playable Stand (Jotaro / Star Platinum), five moves (JAB, STRIKE, HEAVY, ORA BARRAGE, and the Stand Rush "ORA ORA
ORA!" gated on Momentum), a defensive triangle that is deliberately three different machines: **Step** (2 charges, 10 invulnerable
frames, 1.4 s recharge), **Guard** (-70%, drains Persistence, broken by Heavy-tagged hits) and **Clash** (frames 2-8; a *Perfect* Clash is
frames 2-3 and refunds a Step charge and marks the enemy Break, x1.8); poise and stagger; crits; Momentum/Persistence. Enemies:
MORIOH DELINQUENT (40 hp), ANGELO (elite, 78 hp, projectiles), an *aggressive* modifier (x1.35 speed) and the boss Killer Queen (200 hp, two
phases, SHEER HEART ATTACK in the second, a transition line at half health). The run is six nodes (BACK ALLEY, A QUIET STREET with a metal
cat and a choice of three random run buffs or a heal, SHOPPING STREET, the CAFE rest, BUDOGAOKA PARK, KAMEYU DEPARTMENT STORE). A seeded RNG
and `headless_harness.js` make a run reproducible. `meta.cleared` is the only thing saved across runs. **Existing achievements: none.**

**How it hooks in without touching the engine.** `hooks.js` already says that `bus.on(name, fn)` is a read-only observer, invoked once with
the final context after every effect has resolved, and that is how `audio.js` and `fx.js` watch combat without being able to change it. A new
`apps/standbattle/trophies_bridge.js` subscribes the same way to `onHit`, `onDamageTaken`, `onDodgeSuccess`, `onParrySuccess`,
`onPerfectClash`, `onStaggerStart`, `onGuardBreak`, `onKill` and `onPhaseTransition`, keeps per-fight counters, and emits at the end of the fight.
That also keeps the "no buff-specific engine code" rule intact.

**Events.** Fight: `fight-end{ won, enemy, node, modifier, secs, hpLeft, damageTaken, maxCombo, maxMomentum, dodges, perfectClashes, staggers,
guardHits, guardBroke, moveTypes[], finishedBy }`. Run: `phase`, `event-choice{ choice, buff }` from `applyEventChoice`, `node-clear`, `run-end{ cleared, buffs[] }`
from `advanceNode` and the combat-outcome click. UI: `rebind`, `debug-on`. Per-fight counters are plain fields on `combat`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| sb_first | STAR PLATINUM, ATTACK | Win a fight. | P | B | - | fight-end{won} |
| sb_angelo | ANGELO DOWN | Defeat ANGELO in BUDOGAOKA PARK. | P | B | - | fight-end{enemy} |
| sb_queen | KILLER QUEEN, STOPPED | Defeat Killer Queen and clear Act 1. | P | S | - | run-end{cleared} |
| sb_phase | I JUST WANT TO LIVE QUIETLY | Push Killer Queen into his second phase. | P | B | - | phase |
| sb_untouch | UNTOUCHABLE | Win a fight without taking damage. | S | S | sim | fight-end{damageTaken:0} |
| sb_scratch | NOT A SCRATCH | Defeat Killer Queen without taking damage. | S | G | sim | fight-end{enemy:'killer_queen'} |
| sb_aggr | TOO FAST TO HIT | Win the SHOPPING STREET fight (aggressive) without taking damage. | S | S | sim | fight-end{modifier} |
| sb_perfect | ORA, NOT TODAY | Land a Perfect Clash. | S | S | sim | perfect |
| sb_perfect3 | FRAME PERFECT | Land three Perfect Clashes in one fight. | S | G | tune | fight-end{perfectClashes>=3} |
| sb_step | STEP STEP | Dodge ten attacks with Step in one fight. | S | S | tune | fight-end{dodges>=10} |
| sb_poise | BREAK THEIR POISE | Stagger one enemy three times in a fight. | S | B | - | fight-end{staggers>=3} |
| sb_guard | BRICK WALL | Absorb eight hits with Guard in one fight without a guard break. | S | S | tune | fight-end |
| sb_momentum | FULL MOMENTUM | Reach 100 Momentum. | S | B | - | fight-end{maxMomentum} |
| sb_combo | ORA x 20 | Land a 20-hit combo. | S | S | tune | fight-end{maxCombo>=20} |
| sb_rush | ORA ORA ORA ORA | Defeat an enemy with the Stand Rush. | S | B | - | fight-end{finishedBy:'rush'} |
| sb_stand | STAND PROUD | Win a fight with 10 HP or less left. | S | S | - | fight-end{hpLeft<=10} |
| sb_za | ZA WARUDO | Defeat a DELINQUENT in under five seconds. | S | G | tune | fight-end{secs<5} |
| sb_bare | BARE KNUCKLES | Clear Act 1 without taking a buff: walk away from the cat. | S | G | sim | run-end{buffs:[]} |
| sb_jab | JUST THE JAB | Win a fight against a DELINQUENT using only JABs. | C | S | - | fight-end{moveTypes} |
| sb_gifts | THREE GIFTS FROM THE ALLEY | Be given each of the three run buffs, over any number of runs. | E | S | - | set buffs |
| sb_cat | THE CAT HAS A PAW OF METAL* | Pet the cat. | E | B | - | event-choice{pet} |
| sb_keys | MY OWN KEYS | Rebind a key. | C | B | - | rebind |
| sb_debug | HITBOX VISION | Switch on the DEBUG overlay. | J | B | - | debug-on |
| sb_yare | YARE YARE DAZE* | Lose a fight. | J | B | - | fight-end{!won} |

Notes. Every "without taking damage" is **per fight**; `sb_bare` is per run and a new run is a fresh attempt. `sb_za` quotes the length of the canonical
time stop; check the Delinquent's HP against the real damage numbers in `moves.js` before fixing it. A run is already reproducible from its seed, so
the `sim` rows can be proved in the headless harness with a scripted player.

---

## Bekkedal

**Mechanics found.** A valley of nine outdoor maps and three rooms with a 06:00-to-02:00 day, 20-day seasons, a year of 80 days. Tools (hoe, can,
axe, rod, pick), 12 crops, forage, fish in three waters with a weather/season/hour table, **three legends** each with its own window (the
lake's troll: midsummer, clear sky, 20:00-21:00; the fjord's king: winter, rain, 18:00-19:00; the plateau's needle: winter thaw, 23:00-01:00),
a rhythm for felling, a descent of generated mine floors (stations every fifth, krystall below 12), animals, preserves, 9 dishes and recipes
gated on friendship, **eight people with posts, schedules, five-beat arcs and 24 heart events** at friendship 4/7/10, gifts (loved/liked, two per
person per week), a 6,000 kr lot and a house to build (Act I ends there; fastest honest play 23-38 days per `act2_check.js`), furnishing with a
flood-fill that refuses a placement that would wall in a door, seven fixed errands plus a rotating board, a bear who says PERKELE, a night that
charges you (from 24:00) and a magpie at 02:00, the **loft** (seven wings, 64 things, four seasonal offerings, a second ending; fastest simulated
completion day 90). It has its own contract (`apps/bekkedal/CLAUDE.md`) and its own rule files, and it is **bilingual**: names below are English / Norwegian.
**Existing achievements: none** (the loft's wing payouts and the two endings are the only "completions").

**Events (from `index.js` functions that already exist).** `harvest{ crop, grade }`; `catch{ fish, rare, legend }` from `landFish`; `fell{ glyph, clean, heart }`
from `chopFinish`/`chopStrike`; `mine{ floor, ore }` from `mineSync`/`mineStart`; `gift{ npc, tier }` and `talk{ npc }` from `talkTo` (bear: `npc.bear`);
`scene-end{ id }` from `sceneEnd`; `build{ what }` from `hakonBuild` / `hakonTilbygg` / `hakonGreenhouse`; `lot` from `lotSign`; `place{ item, ok }` /
`place-refused` from `confirmPlace`; `craft{ id }`, `cook{ id }`; `donate{ wings, total }` from `spineDonate`; `day{ day, season, bedBefore24, chores, passedOut, magpie }`
from `newDay`/`startNap`; `visit{ map }` from `markDisc`; `use{ furniture }` from `furniture_act.js`. State-derived (poll on `day`): `friendship10`, `crops`, `fish` (sets
are kept in the trophy store, not in `S`).

| ID | Name (EN / NO) | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| bk_furrow | FIRST FURROW / FØRSTE FURE | Harvest your first crop. | P | B | - | harvest |
| bk_crops8 | EIGHT ROWS / ÅTTE RADER | Harvest eight different crops. | P | S | - | set crops |
| bk_crops12 | TWELVE ROWS / TOLV RADER | Harvest all twelve crops. | P | G | - | set crops |
| bk_grade | FIRST CLASS / FØRSTE KLASSE | Harvest a crop of the top grade. | S | B | tune | harvest{grade:2} |
| bk_lot | THE LOT IS YOURS / TOMTEN ER DIN | Buy the lot by the water. | P | B | - | lot |
| bk_house | A HOUSE BY THE WATER / ET HUS VED VANNET | Finish building the house. | P | S | sim | build{house} |
| bk_house30 | SWIFT HAMMER / RASK HAMMER | Finish the house by day 30. | S | S | sim | build{house}, day |
| bk_house24 | FASTER STILL / ENDA RASKERE | Finish the house by day 24. | S | G | sim | same |
| bk_greenhouse | GLASS AND SUN / GLASS OG SOL | Build the greenhouse. | P | B | - | build |
| bk_barn | A ROOF FOR THE ANIMALS / TAK FOR DYRA | Build the barn. | P | B | - | build |
| bk_chores | MORNING CHORES / MORGENSTELL | Tend your animals on seven days running. | S | S | - | streak chores |
| bk_fish5 | ANGLER / SPORTSFISKER | Land five different species. | P | B | - | set fish |
| bk_fish10 | TEN SPECIES / TI ARTER | Land all ten, legends and all. | P | G | - | set fish |
| bk_rare | A GOLDEN MORNING / EN GYLDEN MORGEN | Land a rare fish: a golden trout or a halibut. | E | B | - | catch{rare} |
| bk_troll | THE TROLL IN THE LAKE* / TROLLET I VANNET | (hint) *Something very old keeps its own hours in the lake, in high summer, on a clear evening.* | E | S | sim | catch{legend:'trollorret'} |
| bk_king | THE KING OF THE SEA* / HAVETS KONGE | (hint) *The fjord has a king. He keeps to the dark half of the year, in the rain, as the lamps come on.* | E | S | sim | catch{legend:'havkonge'} |
| bk_needle | THE WHITE NEEDLE* / DEN HVITE NÅLEN | (hint) *On the plateau, when the ice lets go in midwinter, something silver is awake after bedtime.* | E | S | sim | catch{legend:'sneulke'} |
| bk_legends | THREE LEGENDS / TRE LEGENDER | Land all three legends. | E | G | - | set legends |
| bk_clean | CLEAN CUT / RENT SNITT | Fell a tree without one glancing blow. | S | B | - | fell{clean} |
| bk_heart | RIGHT IN THE HEART / RETT I HJERTET | Fell a great fir with two deep blows and no glance. | S | S | tune | fell{glyph:'G', heart>=2, clean} |
| bk_timber | TIMBER MAN / TØMMERMANN | Fell five trees in a row without a glance. | S | S | - | streak clean |
| bk_mine5 | THE FIRST STATION / FØRSTE STASJON | Reach floor 5 of the mine. | P | B | - | mine{floor} |
| bk_mine10 | THE TENTH FLOOR / TIENDE ETASJE | Reach floor 10. | P | S | - | mine |
| bk_mine15 | PAST THE LAMP / FORBI LYKTA | Reach floor 15. | P | G | tune | mine |
| bk_krystall | A STONE THAT SHINES / EN STEIN SOM LYSER | Mine krystall. | P | S | - | mine{ore:'krystall'} |
| bk_lamp | LIGHT FOR THE DEEP / LYS TIL DYBDEN | Craft the crystal lamp. | P | S | - | craft |
| bk_fr1 | A FRIEND / EN VENN | Reach friendship 10 with one person. | P | B | - | poll fr |
| bk_fr4 | FOUR FRIENDS / FIRE VENNER | Reach friendship 10 with four people. | P | S | - | poll |
| bk_fr8 | EIGHT FRIENDS / ÅTTE VENNER | Reach friendship 10 with all eight. | P | G | - | poll |
| bk_scene | A SCENE OF YOUR OWN / DIN EGEN SCENE | See your first heart event. | P | B | - | scene-end |
| bk_arc | A WHOLE STORY / EN HEL HISTORIE | See all three heart events of one person. | P | S | - | set scenes |
| bk_scenes | EVERYONE'S STORY / ALLES HISTORIE | See all 24 heart events. | P | G | - | set scenes |
| bk_gift | JUST WHAT I WANTED / AKKURAT DET JEG TRENGTE | Give a loved gift. | E | B | - | gift{tier:'loved'} |
| bk_gifts8 | A PRESENT FOR EVERYONE / EN GAVE TIL ALLE | Give each of the eight a loved gift. | S | S | - | set gifted |
| bk_errands | ALL SEVEN ERRANDS / ALLE SJU ÆRENDER | Finish the seven fixed requests. | P | S | - | poll q |
| bk_bear | PERKELE* / PERKELE | (hint) *Someone in the wood is always sweeping. Say hello.* | E | B | - | talk{bear} |
| bk_place10 | HOME MAKER I / HJEMMEBYGGER I | Place ten pieces in your home or yard. | P | B | - | stat placed |
| bk_place30 | HOME MAKER II / HJEMMEBYGGER II | Place thirty. | P | S | - | stat placed |
| bk_nice | NICE TRY* / BRA FORSØK | (hint) *You can fence anything. Almost.* Try to place a fence or gate that would wall in a door. | E | B | - | place-refused |
| bk_answers | THE HOUSE ANSWERS / HUSET SVARER | Use six pieces in the house: books, clock, window, plant, cat and tea. | E | S | - | set use |
| bk_table | A LAID TABLE / DUKET BORD | Cook every dish you have a recipe for. | P | S | - | set cook |
| bk_winter | THE FIRST SNOW / FØRSTE SNØ | Reach winter. | P | B | - | day |
| bk_year | A YEAR IN THE VALLEY / ET ÅR I DALEN | Reach day 81: one full round of the seasons. | P | S | - | day |
| bk_fairs | ALL FOUR FAIRS / ALLE FIRE MARKEDER | Be on the town square on each of the four festival days. | E | S | - | set fairs |
| bk_early | EARLY TO BED / TIDLIG I SENGA | Go to bed before midnight seven days running. | S | S | - | streak bed |
| bk_magpie | A THIEF IN FEATHERS* / EN TYV MED FJÆR | (hint) *Stay up. See what the night costs.* Fall asleep where you stand at 02:00. | J | B | - | day{magpie} |
| bk_valley | THE WHOLE VALLEY / HELE DALEN | Visit all nine places. | E | S | - | set visit |
| bk_key | THE KEY / NØKKELEN | Be given the key to LOFTET. | P | S | - | spineOpen |
| bk_wing1 | ONE WING / EN FLØY | Complete one wing of the loft. | P | B | - | donate |
| bk_wing4 | FOUR WINGS / FIRE FLØYER | Complete four wings. | P | S | - | donate |
| bk_loft | LOFTET, COMPLETE / LOFTET, FULLFØRT | Complete all seven wings: sixty-four things. | P | G | sim | donate{done} |
| bk_loft100 | A FAST YEAR / ET RASKT ÅR | Complete the loft by day 100. | S | G | sim | donate{done}, day |

Notes.

- **Legends are the exploration backbone.** Each is a three-part puzzle (season, weather, hour) read off `BEK_FISH_WATERS`, wrapped in the reeling mini-game;
  the hint names the *kind* of condition and never the number. Nothing is missable: every season, every weather and every hour comes round again.
- **Scoped, not permanent.** There is no "never sell", "never sleep", "never skip a day". The streak trophies (chores, bed, clean cuts) reset and can be retried at once.
  No trophy depends on which of a person's first-meeting answers you gave; those are permanent and part of the ending.
- **The speed pair (`bk_house30`, `bk_house24`, `bk_loft100`) is the only "go faster" content**, kept to three rows, and the numbers are read off
  `act2_check.js`'s balance pass (the honest range is 23-38 days) and `spine_check.js` (fastest 90), not invented.
- **Copy rule.** Names and descriptions are `{ no, en }` like a dialogue line, shown per the language toggle (NO + EN, or EN only). The Norwegian above is a
  first draft for review by someone who reads it natively; the existing in-game Norwegian should be the reference for register.
- **A discrepancy to settle before `bk_bear` ships.** `CLAUDE.md` says the bear arrives on day 21; the README says day 6. The trophy only needs "talked to the
  bear", so it works either way, but its hint should not promise a date.
- **Not trophies, on purpose:** gold earned, items sold, steps walked, tiles ploughed. Bekkedal has no kill counter; the equivalent trap would be "harvest 1,000 crops".

---

## The Bottle (Jaeger)

**Mechanics found.** A first-person pour and drink (`drink.js`, `pour.js`, `glass3d.js`): one measure is 40 ml, a 700 ml bottle holds seventeen and a half, and
the arithmetic in `drunk_bac.js` is fixed (30 s to reach the blood, one measure cleared a minute, blackout at nine felt). Seven named stages
(SOBER, WARM, TIPSY, LOOSE, SLOSHED, HAMMERED, ABOUT TO GO); nine bottles from Dave (the cordial is 0%); a nine-scene blackout deck (seven photographs and two drawn
screens) dealt from a shuffled deck; clicks are never queued, so speed cannot be gamed. `Drunk.drink(units)`, `Drunk.stage()`, `Drunk.blackedOut()`.
**Existing achievements: none.**

**Taste check, for the owner.** This is a birthday gift, and the app is a dry, slightly rueful comedy about a bottle, so the trophies below reward the
*journey*, restraint and the collection of drinks and not speed or quantity. There is deliberately no "pass out fast" or "drink N bottles".
`bt_lights` and `bt_dreams` are the only ones about the blackout, and `bt_limit` and `bt_designated` are there to give the other side of it equal weight.
Delete either pair if it does not suit the person.

**Events.** `pour{ drink }`, `drink{ drink, units }`, `stage{ name }` (poll `Drunk.stage()` once a second while the loop runs), `blackout{ scene }`
from `runBlackout` (it already knows which scene it dealt), `bottle-empty{ drink }`. Counters: set `tasted`, set `scenes`, timer `glowSecs`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| bt_pour | THE FIRST POUR | Pour a measure. | P | B | - | pour |
| bt_skal | SKAL | Drink your first measure. | P | B | - | drink |
| bt_glow | A MILD GLOW | Keep the screen at WARM or TIPSY for five minutes, drinking at least three measures. | S | S | tune | stage poll |
| bt_limit | KNOW YOUR LIMIT | Reach ABOUT TO GO, then stop and let it drain back to SOBER without passing out. | S | S | tune | stage poll |
| bt_designated | DESIGNATED DRIVER | Empty a whole bottle of the cordial: seventeen and a half measures. | C | S | - | bottle-empty{cordial} |
| bt_flight3 | A SMALL FLIGHT | Drink a measure of three different drinks. | E | B | - | set tasted |
| bt_flight6 | A FLIGHT | Drink a measure of six different drinks. | E | S | - | set tasted |
| bt_flight9 | THE WHOLE SHELF | Drink a measure of all nine drinks. | E | G | - | set tasted |
| bt_lights | LIGHTS OUT | Pass out once. | J | B | - | blackout |
| bt_dreams | THIRTY DREAMS* | (hint) *The machine has thirty dreams. It does not repeat itself until it has had them all.* See all thirty blackout scenes. | E | G | - | set scenes |

Notes. The blackout deck is dealt without repeats, so `bt_dreams` takes exactly nine passes; the second blackout comes much sooner than the first
because waking leaves four measures in the blood (`BAC.WAKE`). `bt_limit` is the one with a point: it is the only trophy that rewards reading the
meter and stopping, which is what the arithmetic is built to teach.
