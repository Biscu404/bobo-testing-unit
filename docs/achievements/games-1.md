# Catalogue 1 of 4: Sweeper, Solitaire, AfterEgypt, Garden, Cook, Magen

How to read a row. **K** = kind: P progression, S skill, E explore, C creative, J joke. **T** = tier: B, S, G. A trailing `*` on the
name means *secret* (shown as `???` with a rumour until found). **Proof**: `sim` the repo already has a simulator, solver or bot that
can prove it is possible; `bot` a small bot/counter would have to be added to prove it; `tune` the number is a first guess from the
code and wants a human playthrough; `-` nothing to prove. **Trigger** is the event (or counter/set) from the "Events" block above the table.

Every `desc` below is the exact condition, in the form it would be printed in the ledger. Names are UPPERCASE and written in each
game's own voice (see `README.md`, "Voice").

---

## Sweeper (HOLLOW SWEEPER)

**Mechanics found.** Classic in three sizes (SHALLOWS 9x9/10, THE HIVE 16x16/40, THE DEEP 30x16/99; pars 60/240/600 s; first click always safe,
chording needs flags). A campaign: six regions, 18 rooms (`data.js`), four region rules (bramble, spores, web, dark), six guardians that
cost two masks a hit (four leave a mask shard, so 5 -> 9 masks), soul earned by opening ground and spent on FOCUS / SCRY / DIVE, geo,
twelve charms in three notches (more notches for geo), a bench per region, and a shade that keeps half your geo where you fell.
**Existing achievements: none.** Kept: `best{}`, `won`, `played`, `streak`, `bestStreak`.

**Events to add.** `win{ classic, lv, secs, par, flags, boss, node, mod, maskLoss, spells, hpLeft, charms[], hurts, webBlocks, shadeFound }`
from `onWin` (`index.js`); `lose{ classic, clicks }` from `lose()` in `run.js`; `death{ node }` from `onDeath`; `bench{ region }` from `toBench`;
`cast{ kind, opened }` from `cast()`.
**Counters to add on the run object** (`run.js` `S`): `flagsPlaced` (right-click placing, not scry/thorns/womb flags), `maskLoss`,
`spells`, `hurts`, `webBlocks`, `clicks`. Streaks: `hiveWins`, `deepWins`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| sw_first | FIRST BREATH | Win any game of Sweeper. | P | B | - | win |
| sw_three | ALL THREE DEPTHS | Win SHALLOWS, THE HIVE and THE DEEP. | P | S | - | set wins:lv |
| sw_rooms6 | CARTOGRAPHER I | Clear 6 rooms of the campaign. | P | B | - | stat clearedRooms (poll at win) |
| sw_rooms12 | CARTOGRAPHER II | Clear 12 rooms. | P | S | - | same |
| sw_rooms18 | CARTOGRAPHER III | Clear all 18 rooms. | P | G | - | same |
| sw_gate | THE FIRST GUARDIAN | Defeat THE HOLLOW GATE. | P | B | - | win{node:'gate'} |
| sw_vessel | FULL VESSEL | Take all four mask shards: nine masks. | P | S | - | poll camp.shards |
| sw_hollow | THE HOLLOW ONE IS STILL | Defeat THE HOLLOW ONE. | P | G | - | win{node:'hollow'} |
| sw_charms | WELL DRESSED | Own all twelve charms. | P | G | - | poll at bench buy |
| sw_hive3 | HIVE MIND | Win THE HIVE three times in a row. | S | S | tune | streak hiveWins |
| sw_deep2 | DEEP BREATHS | Win THE DEEP twice in a row. | S | G | tune | streak deepWins |
| sw_par_e | QUICK HANDS | Win SHALLOWS in under 30 seconds (half its par). | S | B | tune | win |
| sw_par_m | QUICKER HANDS | Win THE HIVE in under 2 minutes (half its par). | S | S | tune | win |
| sw_par_h | QUICKEST HANDS | Win THE DEEP in under 5 minutes (half its par). | S | G | tune | win |
| sw_noflag | FEEL IT OUT | Win THE HIVE without placing a flag. | S | S | tune | win{flags:0} |
| sw_noflag_deep | BLIND FAITH | Win THE DEEP without placing a flag. | S | G | tune | win{flags:0} |
| sw_untouched | UNTOUCHED | Defeat a guardian without losing a mask. | S | S | tune | win{boss, maskLoss:0} |
| sw_final_clean | NOT A MARK ON HIM | Defeat THE HOLLOW ONE without losing a mask. | S | G | tune | win{node:'hollow', maskLoss:0} |
| sw_soulless | NO SOUL SPENT | Clear a campaign room without casting FOCUS, SCRY or DIVE. | S | S | - | win{spells:0} |
| sw_compass | COMPASS ONLY | Defeat a guardian with only the WAYWARD COMPASS equipped. | S | G | tune | win{boss, charms} |
| sw_thread | HANGING BY A THREAD | Win a campaign room with exactly one mask left. | S | S | - | win{hpLeft:1} |
| sw_dark | BY LANTERNLIGHT | Clear a DARK room (the Deepnest) without losing a mask. | S | S | tune | win{mod:'lantern', maskLoss:0} |
| sw_tangle | UNTANGLED | Clear a WEBBED room without clicking a webbed tile once. | S | B | - | win{mod:'web', webBlocks:0} |
| sw_mods | FOUR WAYS TO BE LOST | Clear a room under each region rule: BRAMBLE, SPORES, WEBBED, DARK. | E | S | - | set mods |
| sw_benches | SIT DOWN | Rest at the bench in all six regions. | E | S | - | set benches |
| sw_shade | WELCOME BACK | Die, then win the room where your shade fell and take its geo back. | E | B | - | win{shadeFound} |
| sw_builds | A CHARM FOR EVERYTHING | Win a room with each of the twelve charms equipped, one at a time is fine. | C | S | - | set charmWins |
| sw_pain | PAIN IS A TEACHER | Win a room with THORNS OF AGONY and GRUBSONG both equipped and two larvae hatched. | C | S | - | win{charms, hurts>=2} |
| sw_rude | RUDE AWAKENING* | Lose on your second click. | J | B | - | lose{clicks:2} |

Notes. `sw_noflag` is a real skill test and not a stunt: with no flags there is **no chording** (`chordTargets` needs them), so it is
pure deduction. `sw_untouched` is only fair because SCRY and DIVE exist to resolve a forced guess; `sw_soulless` is the same room with
the safety net removed, which is why it is its own trophy. Nothing here is "never die": the longest scope is one room.

---

## Solitaire (LEAGUE SOLITAIRE)

**Mechanics found.** Klondike, draw three, unlimited redeals; four lanes (MID, BOT, TOP, SUPPORT with ZED, TALON, LEE SIN, JAX); pays
`max(40, 300 - 2 x moves)` and the move counter is on screen; double-click sends a card home; an AUTO-COMPLETE button appears when the
board is trivially won; three card backs; `st.won`, `st.played`, `st.bestMoves`. **Existing achievements: none.**

**Events to add.** `deal`, `move{ n, from, to }` (from the `onUp` placement), `redeal` (in `drawThree`), `lane-done{ lane }`,
`win{ moves, redeals, secs, auto, back, firstLane }`. Counter: `streak` (a deal abandoned for a new one counts as a break, which is the
only honest definition since the game has no explicit loss).

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| sol_first | FIRST BLOOD | Win a game. | P | B | - | win |
| sol_iron | IRON | Win 3 games. | P | B | - | stat wins |
| sol_gold | GOLD | Win 15 games. | P | S | - | stat wins |
| sol_chall | CHALLENGER | Win 40 games. | P | G | - | stat wins |
| sol_tight | TIGHT MACRO | Win in 120 moves or fewer. | S | S | tune | win{moves} |
| sol_clean | CLEAN MACRO | Win in 100 moves or fewer (a payout of 100 SUN or more). | S | G | tune | win{moves} |
| sol_onepass | ONE PASS | Win without ever recycling the waste pile. | S | S | tune | win{redeals:0} |
| sol_flash | FLASH | Win in under three minutes. | S | S | tune | win{secs} |
| sol_team | TEAMFIGHT | Move a run of five or more cards in one drag. | S | B | - | move{n>=5} |
| sol_spree | KILLING SPREE | Win three deals in a row. | S | S | tune | streak wins |
| sol_lane | CHOOSE YOUR LANE | Finish each lane (A to K) before the others, once per lane, in four wins. | C | S | - | set firstLane |
| sol_skins | THREE SKINS | Win once with each card back (HEXTECH, SILK, RUNE). | C | B | - | set backs |
| sol_auto | INEVITABLE | Get the board to where AUTO-COMPLETE appears. | E | B | - | poll autoReady |
| sol_bounce | THE LONG BOUNCE | Watch the victory cascade until the last card has left the table. | J | B | - | win + cascade end |

Why no "win with every suit mode": the 2-tone and distinct-colour modes are an accessibility setting, and a trophy for them would
punish using it.

---

## AfterEgypt

**Mechanics found.** Five ways (PILGRIM, SCRIBE, PRIEST, PHARAOH, THE THIRD TEMPLE), each unlocked by clearing the last; the tiers add a
chasing ship, wandering gaps, locusts, gusts with a one-second warning, a closing sky, coins and ankhs (a second chance; `shield` up to 2);
a 60 Hz fixed-step sim (`sim.js`) that already reports every moment as an event word: `coin ankh shield dead gap graze gust gust-on
gust-off locust win` (`r.info.cause` is `pillar` or `locust`). Pay climbs 50 -> 2,500 SUN; a clear with no hit and a first clear pay a
bonus. `aftere_check.js` flies every tier with a bot. **Existing achievements: none** (the pay bonuses are the only reward).

**Events to add.** Nothing in `sim.js`. `index.js` already loops `run.ev` once per step into `audio.events(run)`; call
`T.emit('step', run)` beside it, and `T.emit('run-end', {...})` from `finish()`: `{ way, won, hits, coins, coinsSpawned, grazes, ankhs,
shields, cause, pct, secs, vhold, phos, gustPasses }`. Counters live on `run` (`grazes`, `gustPasses`, `coinsSpawned` -- the last one
increments where `arrange()` pushes a coin). `T.hold()` on `fly()`, `T.release()` on `finish()`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| ae_pilgrim | THE FIRST PILGRIMAGE | Clear PILGRIM. | P | B | - | run-end{won} |
| ae_scribe | THE SCRIBE'S WAY | Clear SCRIBE. | P | B | - | run-end |
| ae_priest | THE PRIEST'S WAY | Clear PRIEST. | P | S | - | run-end |
| ae_pharaoh | THE PHARAOH'S WAY | Clear PHARAOH. | P | S | - | run-end |
| ae_temple | THE THIRD TEMPLE | Clear the fifth way. | P | G | - | run-end |
| ae_half | HALFWAY HOME | Get halfway across THE THIRD TEMPLE. | P | B | - | run-end{pct>=50} |
| ae_near | WITHIN SIGHT | Get 90% of the way across THE THIRD TEMPLE. | P | S | - | run-end{pct>=90} |
| ae_f_scribe | CLEAN HANDS | Clear SCRIBE with no hit. | S | B | sim | run-end{hits:0} |
| ae_f_priest | CLEAN HEART | Clear PRIEST with no hit. | S | S | sim | run-end |
| ae_f_pharaoh | UNTOUCHED BY THE WIND | Clear PHARAOH with no hit. | S | S | sim | run-end |
| ae_f_temple | A PERFECT TEMPLE | Clear THE THIRD TEMPLE with no hit. | S | G | sim | run-end |
| ae_graze10 | CLOSE SHAVE | Graze ten pillars in one clear (SCRIBE or higher). | S | S | tune | run-end{grazes} |
| ae_graze25 | RAZOR'S EDGE | Graze twenty-five pillars in one clear of PRIEST or higher. | S | G | tune | run-end{grazes} |
| ae_purse | THE WHOLE PURSE | Clear SCRIBE or higher having taken every coin. | S | G | bot | run-end{coins==coinsSpawned} |
| ae_ascetic | ASCETIC | Clear PRIEST or higher taking no coin and no ankh. | S | S | bot | run-end{coins:0, ankhs:0} |
| ae_wind | AGAINST THE WIND | Pass ten doorways in one run while a gust is pushing. | S | S | bot | step{gap during gust} |
| ae_five | PILGRIMAGE | Clear all five ways in order with no failed run between. | S | G | tune | streak wins by way |
| ae_ankh | NOT YET | An ankh takes a blow for you. | E | B | - | step{shield} |
| ae_ankh2 | A SPARE AND A SPARE | Carry two ankhs at once. | E | B | - | step{ankh, shield==2} |
| ae_down | TWO WAYS DOWN | End one run on a pillar and another on a locust. | E | B | - | set causes |
| ae_roll | ROLLING PILGRIM | Clear PILGRIM with VHLD off centre, so the picture rolls the whole way. | C | S | - | run-end{vhold!=5 throughout} |
| ae_ghost | GHOST SHIP | Clear PHARAOH or higher with PHOS on P7. | C | S | - | run-end{phos} |
| ae_advert | MISSED THE ADVERT* | Lose a run in the first five seconds. | J | B | - | run-end{secs<5, !won} |

Notes. `ae_roll` and `ae_ghost` are the machine's knobs used as difficulty sliders: the monitor is part of the game here, which is the
whole premise of this build. The graze thresholds depend on how often a pillar is graze-able at all (`p.close < 6`); the bot in
`aftere_check.js` should log grazes per clear before the numbers are fixed.

---

## Garden (ZEN GARDEN)

**Mechanics found.** Five rooms (YARD, GREENHOUSE 800, CELLAR 1,400, ROOFTOP 2,200, SHRINE 3,200), twelve pots a rack, seven pots, eleven
species; **synergy tags** shown on hover (HOME ROOM, KIN POT, ROOTED, ROOM SET, N OF ITS KIND, N MATES); plants stop paying when dry and
never die; drip lines per room, four basket sizes, two gatherer tiers; TEND (space) with a pick chain up to +50%; night-only plants;
offline growth for up to an hour at 40%. Every species has exactly one `home` room and one `kin` pot, and each room has a `kinPot`, which
makes **five racks that can be perfect**: sunshoot/terra in the YARD, bellvine/glaze in the GREENHOUSE, mosscap/stump in the CELLAR,
ironbud/iron on the ROOFTOP, halofern/bone in the SHRINE (each plant is HOME + KIN = ROOTED, and the room is SET).
**Existing achievements: none.**

**Events to add.** `pick{ n, value, room, species, tags, night, doubled }` from `collect`; `tend{ paid, rooms, chain }` from `tend()`;
`plant{ species, room, pot }`; `buy{ what }`; `catchup{ gapMs, gathered }` from `M.catchUp`; poll `rack` after any plant, pot or room change
(`M.stats` already computes the tags). Counter: `gardenSun` (sum of `earn(n, 'GARDEN...')`), set `grown`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| gd_first | FIRST FRUIT | Pick your first SUN token. | P | B | - | pick |
| gd_sun1 | GREEN THUMB | Earn 1,000 SUN from the garden. | P | B | - | stat gardenSun |
| gd_sun2 | ORCHARD KEEPER | Earn 10,000 SUN from the garden. | P | S | - | stat |
| gd_sun3 | BY ROOT AND BRANCH | Earn 99,999 SUN from the garden: the price of the gold frame. | P | G | sim | stat |
| gd_rooms | FIVE ROOMS | Open all five rooms. | P | S | - | poll |
| gd_herb5 | HERBALIST | Grow five species to full size. | P | B | - | set grown |
| gd_herb8 | BOTANIST | Grow eight species to full size. | P | S | - | set grown |
| gd_herb11 | HERBARIUM | Grow all eleven species to full size. | P | G | - | set grown |
| gd_rooted | ROOTED | Have a plant showing both HOME ROOM and KIN POT. | E | B | - | poll rack |
| gd_bed | FULL BED | Have a plant with four of its own kind around it. | E | B | - | poll rack |
| gd_mates | BEST FRIENDS | Have a plant with two MATES beside it. | E | B | - | poll rack |
| gd_perfect1 | A PERFECT RACK | Fill a rack of twelve with plants that are all ROOTED, in a room that is SET. | S | S | sim | poll rack |
| gd_perfect5 | FIVE PERFECT RACKS | Do it in all five rooms at once. | S | G | sim | poll rack |
| gd_chain | FULL SWEEP | Make a TEND or sweep chain that reaches the +50% cap (13 picks). | S | S | sim | tend{chain>=13} |
| gd_drip | NEVER DRY | Fit a drip line in every room. | P | S | - | poll |
| gd_hands | HANDS FREE | Own all five drip lines, the biggest basket and both gatherers. | P | G | - | poll |
| gd_night | NIGHT SHIFT | Pick a NIGHTPEA token after dark in a room other than the cellar. | E | B | - | pick{night, !cellar} |
| gd_blessed | BLESSED | Get a doubled token at the SHRINE. | E | B | - | pick{doubled} |
| gd_away | WHILE YOU SLEPT | Come back after eight hours away and find the gatherer has paid in. | E | S | - | catchup{gapMs>=8h, gathered>0} |
| gd_tune | A TUNE FROM THE ROOTS | Poke five plants in rising pitch within eight seconds. | C | B | - | poke sequence |

Notes. The perfect racks are the garden's actual puzzle (what grows where matters), and the only way to find them is to read the hover
text, which is exactly the behaviour the app wants. `gd_away` is the one that links to the **long boot** (eight hours is also what triggers
it), so the machine, the garden and the clock all agree. Never "water everything"-style chores: the app's design says nothing can be lost.

---

## The Cook

**Mechanics found.** Ten solvable boards plus a hidden eleventh (par 28, opens at ten stars). Reagents are vectors; walls, ruin tiles, mirror
plates, doubling plates, a burner (wax/frost seals), unlabelled jars, a sweep, three stages. Three medals per board (finished, par,
par with nothing spilled and no reset); par is the BFS solver's shortest solution, so it cannot be beaten, only matched. The kid reacts
(`CK_KID`, once-flags in `SV.said`). **Existing: `CK_ACH`, 24 entries** (`apps/cook/data.js`), granted by `ach(id)`.

**Review of the existing 24.** Good: a1-a5 (finish 1/3/5/8/10), a6-a8 (99.1% ladder), a9-a10 (no resets), a13-a19 (read the jar, burner, frost, mirror,
sweep, stages: each teaches a mechanic), a22-a24 (ending, ten stars, the eleventh bench). Weak: **a12 RUINED A LOT** (ruin twenty batches) rewards failure
count, and **a20 THE MONEY** / **a21 STILL HERE** (reset ten times) are accumulation. Recommendation: keep all 24 as `legacy` mirrors (so nobody
loses what they have), mark a12 and a21 as `kind: 'joke'` in the ledger, and let a20 keep its place as a progression. None gets any SUN from the new system.

**Events to add.** `win{ lv, steps, par, resets, undos, ruins, pur }` and `ruin{ cause }` already exist as `win()` and `ruin` inside `index.js`;
add the `undos` counter in `undo()` and `T.emit` beside each `ach(...)` call. Once-flags already there: `SV.said.first_*`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| ck_undo5 | MEASURE TWICE | Solve five levels in par without using undo. | S | S | sim | win{undos:0, steps<=par} |
| ck_oneshot | NO TAKE-BACKS | Solve THREE STAGES or ONE LAST TIME in par with no undo and no reset. | S | G | sim | win{lv>=9} |
| ck_knock | ONE KNOCK | Finish THE ONE WHO KNOCKS in par (28 pours). | S | G | sim | win{lv:11} |
| ck_kidtour | THE KID NOTICES | Hear his first reaction to the mirror, the doubling plate, solvent, heat, cold and the first stage. | E | S | - | set said |
| ck_two | TWO WAYS TO LOSE | Ruin a batch on a red tile and under the sweep. | E | B | - | set ruinCauses |
| ck_count | COUNT IT | Get to the kid's third nudge, then solve the level anyway. | E | B | - | win after stuck3 |
| ck_thermo | THERMOSTAT | Heat and cool the burner in the same batch. | C | B | - | op heat+cool |
| ck_glass | THAT'S GLASS, MAN* | Pour at a wall. | J | B | - | pour{wall} |
| ck_idle | NOT RUSHING YOU* | Let the kid fill the silence with one of his idle lines. | J | B | - | say{idle} |

---

## Magen

**Mechanics found.** Cookie-Clicker economy around a clicked star: 20 buildings (kippah -> the Name), five tiers each, 10 hand upgrades, 8 kavanah,
12 communities, 13 rule-changers (`MG_SPEC`), a golden star (13 s life, five effects, one bad), Shabbat every six minutes (candles in the 18 s before;
75 s of rest; Havdalah), the machloket (12 disputes with rulings), L'dor vador (prestige, 10 legacy upgrades), an earned auto-press ladder, a 76-line
news ticker, a chain (`combo`, capped at 60, crit chance 2% -> 20%), `S.bestCombo` already saved.
**Existing: `MG_ACH`, 98 entries**, checked in `checkAch()` and paid in SUN by `achSun()`.

**Review of the existing 98.** 60 are "own 1 / 50 / 100 of building X" (20 x 3), 8 are lifetime totals, 5 are click counts, 4 are rates, 4 Shabbat
counts, 3 golden-star counts, 3 ascents, 2 "own N of every building", plus 5 flags and a handful of one-offs. **It is almost entirely progression and
accumulation, with no test of skill.** The flags are the best of it (LICHTBENTSCHN, ELU V'ELU, and the two that are worth nothing on purpose:
ZICHRONAM LIVRACHA and MENUCHAH, which are exactly the "meaningful, not a checklist" idea). Recommendation: mirror all 98 as `legacy` (pay 0, not counted
in meta totals), keep `achSun` as it is, and add the skill/creative set below. The new ones respect the game's own rule that **rest is never a penalty** and
that nothing here is a joke at the expense of the practice.

**Events to add.** `click{ combo, crit }` from the press handler; `gold{ kind, age, life }` from `takeGold()`; `shabbat-start` / `shabbat-end{ lit, pressed }`;
`arg{ id, side, law }` from `settleArg()`; `ascend{ genSecs }` from `ascend()`; `buy{ kind, id }`. Counters: `chainBest` (use the saved `S.bestCombo`),
`litStreak`, `shomerStreak`, `newsSeen` (set), `genStart` (timestamp, reset by `fresh()`), `buildingsThisGen`. **Data to add:** `law: 0|1` on each
`MG_ARG` (which side the stated ruling backs).

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| mg_chain25 | KEEP GOING | Build a hand chain of 25 (the banner says so). | S | B | - | click{combo>=25} |
| mg_chain50 | DO NOT STOP | Build a hand chain of 50. | S | S | - | click{combo>=50} |
| mg_chain60 | THE FULL SIXTY | Reach the cap of the chain, 60. | S | G | tune | click{combo>=60} |
| mg_eye | SHARP EYE | Catch a golden star within a second of it appearing. | S | S | - | gold{age<1} |
| mg_clutch | JUST IN TIME | Catch a golden star in its last second. | S | B | - | gold{life-age<1} |
| mg_double | MITZVAH GORERET MITZVAH | Press 100 times while SIMCHA and HAKHNASAT ORCHIM are both running. | S | G | tune | click while both buffs |
| mg_candles3 | THREE FRIDAYS | Light the candles before three Shabbatot in a row. | S | S | - | streak lit |
| mg_shomer | SHOMER SHABBAT | Light the candles and then not press once, for three Shabbatot in a row. | S | G | - | streak lit&&rest |
| mg_law | THE LAW FOLLOWS | Side with the stated ruling in six different machloket. | E | S | - | set arg:law |
| mg_heir | AN IMPATIENT HEIR | Hand it on again within 90 minutes of the last time. | S | S | tune | ascend{genSecs} |
| mg_lonely | BY HAND ALONE | Earn 10,000 mitzvot in a generation before owning a single building. | C | S | tune | stat run, own==0 |
| mg_kav | ALL EIGHT KAVANOT | Buy all eight kavanah upgrades. | P | S | - | poll |
| mg_spec | THE WHOLE LAW | Buy all thirteen rule-changing upgrades. | P | S | - | poll |
| mg_tree | THE FULL TREE | Buy all ten legacy upgrades. | P | G | - | poll |
| mg_echo | THE FIRST ECHO | Buy the first level of the auto-press. | P | B | - | buy{auto} |
| mg_echo6 | SIX ECHOES | Buy all six auto-press levels. | P | S | - | buy{auto} |
| mg_ledger | READ THE LEDGER | Open the rates tooltip once CHESHBON is owned. | E | B | - | tooltip open |
| mg_news | EXTRA, EXTRA | Read every one of the 76 ticker lines. | E | G | - | set newsSeen |

Notes. `mg_lonely` is the incremental-game classic (a restriction challenge that changes how you play the opening) and, because it is
scoped to a *generation*, comes back every ascent. `mg_news` is a passive collection: the ticker runs while you do other things, so it is
not a chore, it is a reason to leave the window open; it is gold only because it takes the longest.
