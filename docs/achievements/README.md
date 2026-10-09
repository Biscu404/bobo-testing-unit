# Trophies for HOLYTRON DM-640: an achievement proposal

**Status: built.** The ledger, the card, the sounds, the terminal commands and every catalogue below are in the repo (`kernel/trophies*.js`, `apps/trophies/`, each game's
`apps/<id>/trophies.js`; CLAUDE.md, **Trophies**). The pages of this folder are the design record the build followed, and where the build differs it is in the numbers: **385
trophies and 10 seals in all (Sweeper 35, Garden 22, Garage 22 with the Studio Course's three, the machine 62, Notes 9, HOLYC.EXE 22 which did not exist when this was written,
the ledger's own meta area 25), about 16,400 SUN**; the thresholds that wanted a playthrough are held by `scripts/check-trophies.mjs` and the per-game `trophy_check.js` files.
It was written as a proposal for two readers: the person this machine is a birthday gift for, who hunts achievements, and the
coding session that will build it. It follows the brief: clear goals, meaningful and fun rather than a checklist, hard "for the right reasons", a mix of
progression, skill, exploration, creative and system-wide goals, and explicit triggers, counters, edge cases and on-screen copy.

## Read in this order

| File | What is in it |
|---|---|
| **`README.md`** (this) | What was scanned, what was found, the rules every trophy had to pass, numbers, voice, rollout, what needs a human. |
| `framework.md` | The engine: `window.Trophies`, the definition format, the four ways to trigger, storage, backfill, unobtainable-trophy rules, the ledger window, the card, sounds, copy bank, tests. |
| `games-1.md` | Sweeper, Solitaire, AfterEgypt, Garden, The Cook, Magen. |
| `games-2.md` | Stand Battle Arena, Bekkedal, The Bottle. |
| `toys.md` | Elephant, Crayon, The Garage, The Stack, Notes, the small tools. |
| `system.md` | The machine itself (files, style meter, terminal, hardware, Dave, calendar), then the meta trophies and the nine masteries. |

## The numbers

**342 new trophies + 9 derived masteries, plus 122 existing achievements carried over as mirrors** (Cook's 24, Magen's 98).

| Area | New | B | S | G | Area | New | B | S | G |
|---|---|---|---|---|---|---|---|---|---|
| Sweeper | 29 | 7 | 14 | 8 | The Bottle | 10 | 4 | 4 | 2 |
| Solitaire | 14 | 6 | 6 | 2 | Elephant + pet | 15 | 10 | 3 | 2 |
| AfterEgypt | 23 | 8 | 10 | 5 | Crayon | 10 | 6 | 3 | 1 |
| Garden | 20 | 9 | 7 | 4 | The Garage | 19 | 9 | 9 | 1 |
| The Cook | 9 (+24) | 5 | 2 | 2 | The Stack | 7 | 3 | 4 | 0 |
| Magen | 18 (+98) | 4 | 9 | 5 | Notes | 9 | 5 | 4 | 0 |
| Stand Battle | 47 | 26 | 15 | 6 | Small tools | 6 | 6 | 0 | 0 |
| Bekkedal | 52 | 18 | 25 | 9 | System | 62 | 34 | 19 | 9 |
| | | | | | Meta | 15 | 6 | 5 | 4 |
| **Total** | **342** | **150** | **134** | **58** | | | | | |

By kind: progression 116, skill 82, explore 79, creative 35, meta 13, joke 17 (5%, "sparingly"). Secrets: 20. About 14,800 SUN if everything is earned.
Of the 342, 28 can be **proved possible** with a simulator, solver or bot the repo already has (`sim`), 3 need a small bot added (`bot`), and **35 are thresholds
that are first guesses from the code and want a human playthrough** (`tune`; listed at the end of this file).

## What the scan covered, and what it found

Read: `CLAUDE.md` and `README.md`; every `apps/*/index.js` and the data/model files behind the games (`sweeper/{data,run,index}`, `solitaire/index`,
`aftere/{levels,sim,index}`, `garden/{model,synergy,rooms,world,index}`, `cook/{data,index}`, `magen/{data,index}`, `standbattle/{data,hooks,defense,
resources,moves,index,map}` and the GDD, `bekkedal/{data,spine,mine,chop,sleep,index}` and its rule files, `bottle/*`, `elephant/*`, `crayon`, `garage`, `notes`,
`hifi`, `terminal`, `tasks`, `defrag`, `cmos`, `display`); and the kernel pieces that matter to the interface (`wm`, `boot`/`bootseq`, `economy`, `cos`/`cos_data`,
`style`/`style_model`, `drunk`/`drunk_bac`/`blackout`, `pet`, `hardware`, `saver`, `konami`, `durable`, `fileops`/`vfs_ops`, `dave_*`, `mixer`, `help`).

| App | Achievements today | What its mechanics offer | Gap the proposal fills |
|---|---|---|---|
| Sweeper | **none** (win counts, streak, best times are kept) | Par times, flagless play (no chording without flags), masks, soul spells, 12 charms, 4 region rules, shade, guardians | Everything: a skill ladder (no-flag, no-hit, compass-only) and a build-diversity goal |
| Solitaire | **none** | Move-counted payout, redeals, lanes, auto-complete | Efficiency, single-pass, lane choice |
| AfterEgypt | **none** | 5 ways, 60 Hz sim that reports every moment as an event word, grazes, ankhs, coins | Flawless/graze/coin skill rows; the monitor's hold and phosphor as difficulty sliders |
| Garden | **none** | Synergy tags, 5 perfect racks, chain sweep, night plants, automation | Make the hover text matter: find the perfect racks |
| The Cook | **24** (`CK_ACH`) | BFS-proved par, kid reactions, undo | Undo-free par, kid collection; keep the 24 |
| Magen | **98** (`MG_ACH`), 60 of them "own N of building X" | Chain, golden star timing, Shabbat, machloket, ascent | **No skill content at all today**: chain, reaction, discipline, restriction runs |
| Stand Battle | **none** (before the arcade rework; now 47, see `games-2.md`) | Perfect Clash, Step charges, Guard, poise, Momentum, boss phases, 3 run buffs (the belt-scroller) | Skill rows via the hook bus, read-only |
| Bekkedal | **none** (loft and endings are the completions) | 3 legend fish with 3-part conditions, chop rhythm, mine, 24 heart events, 8 friendships, loft of 64 | Exploration puzzles, restraint, the speed pair |
| Bottle | **none** | Fixed BAC arithmetic, 7 stages, 9 drinks, 9 blackout scenes | Restraint and collection rather than quantity |
| Elephant, Crayon, Garage, Stack, Notes | **none** | No score by design | Celebrate what was made or found; never count presses |
| The machine | **none** | Style meter, files, terminal/HolyC, knobs, boot, Dave, SUN, calendar | The system set: explore the interface; the meta set |

## The rules every trophy had to pass

1. **It names a goal the game already has.** Clear a way, beat a boss, read the hover text, find the legend's hour. Nothing asks for a different game.
2. **The condition is exact and visible.** "Defeat a guardian without losing a mask", not "play well". Difficulty is in the sentence ("on THE DEEP", "with PHOS on P7").
3. **Hard for the right reason.** Skill (deduction, timing, reading a meter), knowledge (the law follows Hillel), or a puzzle (season, weather, hour). Never HP bloat or luck.
4. **Counts only where the loop already produces them.** Where a number appears it is "how many *different*" (species, drinks, notes, farewells) or a high-water mark (best chain), or the
   game's own stated goal (99,999 SUN is the price of the gold frame). **Refused, on purpose:** "N clicks", "N kills", "N crops harvested", "N steps", "N minutes played",
   "N drinks in total", "pass out in under X". Magen already has its click counts; they are kept as mirrors and nothing like them is added.
5. **A failed attempt costs a short, replayable thing.** Every "no hit / never" is scoped to a run, fight, room, descent or Shabbat (`scope` in the definition). Nothing is "never save", "never sell", "never die".
6. **No trophy depends on a permanent choice, a missable moment, or a specific answer to a story question.** The few that touch something missable are "N of M" (Dave's farewells).
7. **Jokes are 5% and mostly secret.** One of them is "VIEWING ACHIEVEMENTS!", because the brief asked for it.
8. **Each trophy is a good story to tell.** A test used while writing: could you describe it to a friend in one sentence and have them want to try?
9. **Nothing gameplay is locked behind a trophy.** Rewards are SUN and a few cosmetics.
10. **The apps with no score (Crayon, Elephant, Notes) get quiet trophies about what was made**, never about effort.

## Voice

The title is UPPERCASE and short; the description is a plain sentence and is the exact condition. The *voice* of the title follows the app, because the machine's
games do:

| App | Voice | Examples |
|---|---|---|
| System | Deadpan, mock-sacred, TempleOS | THE TEN KEYS, RING 0, EVERY SHELF BARE |
| Sweeper | Quiet, hollow, Hollow-Knight-adjacent (allusion, never quotation) | HANGING BY A THREAD, SIT DOWN |
| Solitaire | League of Legends in-jokes (ZED, TALON, LEE SIN, JAX are the lanes) | TEAMFIGHT, KILLING SPREE, CHALLENGER |
| AfterEgypt | Biblical-desert, short | THE WHOLE PURSE, NOT YET |
| Garden | Dry, botanical, patient | A PERFECT RACK, WHILE YOU SLEPT |
| The Cook | Breaking Bad, as the game already does; the kid's tone | MEASURE TWICE, THAT'S GLASS, MAN |
| Magen | Warm and exact; real terms used correctly; **never a joke at the expense of the practice** (the README is explicit about this) | SHOMER SHABBAT, THE LAW FOLLOWS |
| Stand Battle | JoJo catchphrases | ZA WARUDO, YARE YARE DAZE, STAND PROUD |
| Bekkedal | Gentle, bilingual: `{ no, en }` like a dialogue line | A THIEF IN FEATHERS / EN TYV MED FJÆR |
| The Bottle | Dry and rueful, never cheering | KNOW YOUR LIMIT, DESIGNATED DRIVER |
| Elephant | His voice, lowercase in the quote, kind | HE WAS ONLY HELPING |

## Rollout

1. **Phase 0, the engine** (`framework.md` sections 1-5, 9): `kernel/trophies.js`, store, backfill, `check-trophies.mjs`, the ledger window, the card. Mirror Cook's 24 and Magen's 98.
   Ship with the system and meta set (they need no game changes) so there is something to find on day one.
2. **Phase 1, the games with most to gain and most to prove**: Sweeper, Stand Battle (via the read-only hook bus), AfterEgypt, Magen's skill set. These have no achievements at all today.
3. **Phase 2, the rest of the games**: Garden, Solitaire, Cook's additions, Bekkedal (the largest: do it by area, farm -> water -> stone -> people -> home -> loft), Bottle.
4. **Phase 3, the quiet apps and the rewards**: toys, the earned-cosmetics shelf, `CERTIFICATE.DD`.

Each phase is independently shippable and each game's file is independent, so a game can be added or its numbers retuned without touching another.

## What needs a human

**To tune after a playthrough** (35 rows marked `tune`): `sw_hive3 sw_deep2 sw_par_e sw_par_m sw_par_h sw_noflag sw_noflag_deep sw_untouched sw_final_clean sw_compass sw_dark
sol_tight sol_clean sol_onepass sol_flash sol_spree ae_graze10 ae_graze25 ae_five mg_chain60 mg_double mg_heir mg_lonely sb_perfect3 sb_step sb_guard sb_combo sb_za
bk_grade bk_heart bk_mine15 bt_glow bt_limit sys_single gr_hot`. Every one is a threshold, not a design; the design is fixed.

**To decide, and only the owner can:**

1. The birthday (`BIRTHDAY = { m, d }`): without it `sys_birthday` stays dormant.
2. The text of `CERTIFICATE.DD` (phase 3) and whether the earned cosmetics are worth the art time.
3. Whether the Bottle's `bt_lights` and `bt_dreams` stay (see the taste note in `games-2.md`).
4. Whether Magen's `law` field (which side the stated ruling backs) is added to `MG_ARG`, which `mg_law` needs and which should be checked by someone who knows the sources.
5. The Norwegian in Bekkedal's names is a first draft for someone who reads it natively.
6. SUN amounts (B 15 / S 40 / G 100) and whether the mirrors should pay anything.

**Hints for the joke secrets** (`sw_rude`, `ae_advert`, `ck_glass`, `ck_idle`, `sb_cat`, `sb_yare`, `sys_*` and the like) are one-liners written when the strings are authored; the
catalogue prints a hint only where the secret is a puzzle (the three legends, the bear, the Konami code, the birthday).

## Things noticed in the repo while scanning

These are not part of the proposal, but each one would bite the person building it.

- **`apps/*_ext.js` are old, unreferenced copies.** `magen_ext.js` (1,647 lines), `cook_ext.js`, `sweeper_ext.js`, `solitaire_ext.js`, `elephant_ext.js`, `crayon_ext.js`,
  `drawings_ext.js`, `display_ext.js`, `about_ext.js` (and apparently `apps/shop.js`) are imported by nothing; only `eden_ext.js` is live (the Konami code). They match
  "achievement" in a search before the real code does. The live Magen and Cook are `apps/magen/` and `apps/cook/`.
- **`README.md` is stale in three places that matter here:** it still documents a `FORMAT` command that is not in the code (the trophy store is kept out of its reach regardless);
  it gives Bekkedal's lot as 1,200 kr (the data says 6,000, `BEK_LOT_COST`); and it says the bear arrives on day 6 (`CLAUDE.md` says 21).
- **`Economy.onChange` has no way to unsubscribe**, and `ACCOUNT.EXE` leaks a listener on every open (it says so in a comment). `Trophies.onChange` should return an unsubscribe function
  the way `Pet.onChange` does, and TROPHIES.EXE must call it on close.
- **Ten apps are `open()`-style and never receive a `ctx`**, so "apps never touch kernel globals" is already not true of them. The proposal follows what the repo does
  (`window.Trophies`, like `window.Economy`) and also offers `ctx.trophy` for the apps that do get a `ctx`.
- **`apps/bekkedal/index.js` is 4,645 lines** against the "files stay under 300 lines" rule. Bekkedal's trophy code is therefore specified as its own file
  (`apps/bekkedal/trophies.js`, split into `trophies_rules.js` if it passes 300 lines) plus one-line calls in `index.js`, so it adds nothing to the big file.
