# Trophies: the engine, the hooks and the UX

Proposal only. Nothing here is built. It is written so that the next coding session can build it in the order given
in `README.md` without re-reading the whole repo.

## 1. Shape of the thing

One kernel service, one small data file per app, one window to read it all in.

```
kernel/trophies.js        the store + the evaluator: window.Trophies (same pattern as window.Economy / window.Cos)
kernel/trophies_toast.js  the trophy card that slides in (queue, deferral, sound)
kernel/trophies_defs.js   imports every apps/<id>/trophies.js and kernel/trophies_system.js; builds the id index
apps/trophies/index.js    TROPHIES.EXE, the ledger window (+ style.css)
apps/<id>/trophies.js     pure data + pure rules for one app (no DOM, no clock): under 300 lines, like every other file
scripts/check-trophies.mjs  pure-Node check of every definition (section 9)
```

Why this shape, in this repo:

- `window.Economy`, `window.Cos`, `window.Pet`, `window.Drunk` already are how apps talk to the kernel, and **ten apps are
  `open()`-style and are never handed a `ctx`** (cook, crayon, elephant, magen, solitaire, sweeper, display, drawings,
  about, neofetch). A global is the only thing every app can reach. Mounted apps also get `ctx.trophy` (section 3) so new
  code stays inside the App Contract.
- Definitions live in the app's folder, next to its `*_check.js`, because the author of a mechanic is the person who knows
  what is fair to ask of it. The kernel only imports data. (The registry already dynamic-imports apps, so kernel -> apps
  data import is not a new direction.)
- Nothing runs per frame. A trophy is evaluated when something **happens** (an event) or at a named checkpoint (a poll the
  app asks for). Magen's own comment about ninety-eight achievements checked thirty times a second is the thing to not repeat.

## 2. A definition

```js
// apps/sweeper/trophies.js
export const TROPHIES = [
  { id: 'sw_untouched',                       // app prefix + snake_case; never reused, never renamed (saves hold it)
    tier: 'S',                                // B | S | G   (bronze / silver / gold)
    kind: 'skill',                            // progress | skill | explore | creative | meta | joke
    name: 'UNTOUCHED',                        // UPPERCASE, 24 characters at most (Bekkedal: { no, en })
    desc: 'Defeat a guardian without losing a mask.',   // sentence case, 64 at most, the EXACT condition
    hint: null,                               // secrets only: a rumour, never the answer
    secret: false,
    scope: 'room',                            // what a failed attempt costs: 'life' | 'save' | 'run' | 'room' | 'session'
    on: 'win',                                // the event that evaluates this
    when: p => p.boss && p.maskLoss === 0,    // pure predicate over the event payload
    // or: stat: { key: 'flags', op: 'gte', n: 10 }, or: sets: { key: 'benches', size: 6 }
    progress: null,                           // optional (state) => [have, need] for the bar in the ledger
    until: null,                              // optional (state) => reason string if it can no longer be earned
    legacy: false,                            // true: mirrors an achievement the game already awards itself
    pay: undefined }                          // SUN override; default by tier (section 6)
];
```

Four ways to be earned, all declarative:

| Trigger | Written as | Example |
|---|---|---|
| **Event + predicate** | `on`, `when` | `win` with `p.maskLoss === 0` |
| **Counter** | `stat: { key, op, n }` | `flagsPlaced >= 10` across the life of the machine |
| **Set** | `sets: { key, size }` | six different benches sat at, nine different drinks tasted |
| **Poll** | `poll: state => bool`, checked at the checkpoints the app names | "a full rack of twelve is ROOTED" after any plant is moved |

Counters come in four flavours so nobody hand-rolls `Math.max`: `add` (running total), `max` (high-water mark, e.g. best chain),
`set` (membership), `streak` (run of consecutive successes that a failure resets).

## 3. The API an app calls

```js
const T = window.Trophies.scope('sweeper');   // or ctx.trophy in a mounted app: wm.js adds it, scoped to appId

T.emit('win', { classic, lv, secs, par, boss, maskLoss, spells, hpLeft, mod, shadeFound });   // evaluates every rule with on:'win'
T.add('flagsPlaced');                 // counter += 1
T.max('bestChain', combo);            // high-water mark
T.mark('benches', rid);               // set membership
T.streak('hiveWins', true);           // false resets
T.check('rack');                      // run this app's poll rules for a checkpoint
T.award('sw_first');                  // direct unlock, for the one-off moment that has no useful payload
T.hold();  T.release();               // defer cards while a run / fight / blackout is on (section 8.3)
```

Rules for the call sites:

1. **A call site is one line, placed where the game already knows the thing happened.** The "Wire" lines in the catalogue name the
   function. Nothing is added to a hot loop.
2. **Never trust a trophy with gameplay.** `emit` and friends catch their own exceptions (the repo's convention everywhere
   `localStorage` is touched). A broken rule must never reach the player's run.
3. **Events carry facts, not conclusions.** `win{ maskLoss: 0 }`, not `win{ untouched: true }`: the rule lives in the data
   file, so tuning a threshold never touches the game's code.
4. **Facts the game does not track yet are listed per game as "to add"** (e.g. Sweeper's `flagsPlaced`, Cook's `undos`). They are
   counters on the run object, so they die with the run.
5. The kernel fires `window` events for others to hear, exactly like `cos-changed` and `wins-changed`:
   `trophy-earned { id, app, tier }` and `trophies-changed`. Dave, the elephant or the style meter can react to either.

Wiring example (Sweeper `onWin`, the only place the call goes for ~15 of its trophies):

```js
// apps/sweeper/index.js, inside onWin(S, secs): one line after the existing bookkeeping
T.emit('win', { classic: S.classic, lv: S.lv.id, secs, par: S.lv.par, flags: S.flagsPlaced, boss: !!(S.node && S.node.boss),
                maskLoss: S.maskLoss, spells: S.spells, hpLeft: S.hp, mod: S.mod, charms: S.camp ? S.camp.equipped : [],
                shadeFound: !!shadeFound });
```

## 4. Storage

One key, `templeos.trophies.v1`, in the same `localStorage` namespace as everything else (so `kernel/durable.js` mirrors it into
IndexedDB and a power cut cannot eat a trophy).

```js
{ v: 1,
  earned: { sw_first: 1767225600000, ... },         // id -> time
  stats:  { sweeper: { flagsPlaced: 41, bestChain: 33 }, ... },
  sets:   { sweeper: { benches: ['cross', 'green'] }, ... },
  streaks:{ sweeper: { hiveWins: 2 } },
  days:   ['2026-10-07', ...],                        // local calendar days the machine was opened, for the login streak
  seen:   { secretsRevealed: [...], nearMissShown: [...] } }
```

- A key that will not parse is copied to `templeos.trophies.v1.bak` and the machine says so, like the other saves (`DISK ERROR`).
- **Trophy data is never inside an app's own save.** Starting a new Bekkedal valley, `forget` in Sweeper, an L'dor Vador in
  Magen: none of them take a trophy away. Counters that are *meant* to restart (a generation's clock) are `scope: 'life'`
  and are kept in the app's own save and passed in the event payload instead.
- The README mentions a `FORMAT` command that wipes everything; it is not in the code today. If it ever returns, the trophy key is
  the one thing it should ask about separately.

### 4.1 Backfill (the part that makes this a good gift)

The player has played this for weeks. The first time the ledger loads it walks each app's `backfill(save) -> { earned: [ids], stats: {} }`
and awards, **silently and in one go**, everything their existing saves already prove, with a single card:

> **THE MACHINE REMEMBERED 19 THINGS YOU ALREADY DID.**  See them in TROPHIES.EXE.

Sources, all of which exist today: Cook `SV.ach` / `SV.medal` / `SV.best`; Magen `S.ach` / `S.bestCombo` / `S.gold` / `S.shab` /
`S.asc`; Sweeper `Sweeper.st` (`won`, `bestStreak`, `best{}`) and `camp.cleared` / `camp.shards` / `camp.owned`; Solitaire `st.won` /
`st.bestMoves`; AfterEgypt `prog.cleared` / `prog.best`; Garden `st.rooms` / `up`; Cos `owned`; Economy `totals()`; Stand Battle
`meta.cleared`; Bekkedal's autosave (`S.day`, `S.fr`, `S.spine`, `S.legend`, `S.disc`, `S.xp`). Backfill pays **no SUN** (the SUN
those games paid at the time was already paid) and plays no fanfare.

## 5. The ledger

`TROPHIES.EXE`, 640 x 480 default, resizable and `fluid`, opened from: a desktop icon, the taskbar (a small cup next to the SUN counter,
showing the count), the desktop menu, the terminal (`TROPHIES`), and the Account window's footer.

```
+- TROPHIES.EXE -------------------------------------------------------------------------+
| 142 / 342     B 80/150   S 41/134   G 21/58    14 SECRETS UNFOUND      [ALL][OPEN][DONE]|
+---------------------+----------------------------------------------------------------+
| SYSTEM       31/45  | AFTEREGYPT                                    7 / 18   ######---- |
| AFTEREGYPT    7/18  |                                                                  |
| BEKKEDAL     12/38  |  [G] THE THIRD TEMPLE            Clear the fifth way.     +100 SUN|
| BOTTLE        3/ 8  |  [S] CLEAN HEART        Clear PRIEST with no hit.          +40 SUN|
| COOK         14/33  |  [B] CLOSE SHAVE   7 / 10 grazes in a clear (best so far)  +15 SUN|
| ...                 |  [?] ???          A SECRET. It likes long evenings and the wind.  |
|  MASTERED: COOK     |  [x] A RETIRED ONE     CLOSED: the item it needed was removed in 1.4  |
+---------------------+----------------------------------------------------------------+
```

- **Colour is the machine's.** Tier colours are VGA16 entries: B = brown (6), S = light grey (7), G = yellow (14), secret = light magenta
  (13), mastery/meta = white (15). The window obeys the sixteen-colour, no-antialias rule; only Bekkedal and Stand Battle are exceptions
  and this is neither.
- **A locked card always shows how**: the exact condition and, if it is a counter or a set, the live numbers (`7 / 10`, `4 of 9 drinks`).
  "How" is never hidden behind a click.
- **A secret** shows `???`, a tier chip, and its `hint`. When earned it flips to its real name and description and gets a "SECRET FOUND"
  line. A hint is a *rumour about where to look* ("It likes terracotta and long evenings."), not an instruction.
- **Sort**: by game (left), and inside it by nearest to completion first, so the card at the top is always the next thing worth doing.
  `[OPEN]` shows only what can still be earned. `CLOSED` cards (section 7) are greyed and say why, and are removed from every denominator.
- **Mastery**: each of the eight games has a derived trophy `MASTER OF <GAME>` (silver) for every non-secret, non-legacy trophy of that game
  (see `catalogue`). It is shown as a seal on the left list and lights when complete.
- **Keyboard**: arrows move, `Enter` on a card pins it (a pinned trophy's progress is echoed in the window's title bar), `Tab` flips
  the list, `Esc` closes. Every card is reachable without a mouse.
- A trophy's `kind` is shown as a one-letter chip (P S E C M J) so the player can see at a glance what *sort* of challenge it is and
  chase the sort they like.

## 6. Rewards

- **SUN, by tier, paid once**: B 15, S 40, G 100. A secret pays its tier. Mastery pays 150. (All 342 new trophies and the nine masteries
  come to about 14,800 SUN in total: the price of a few of Dave's mid-range frames, and 15% of the 99,999 of THE THIRD TEMPLE, so it cannot
  break the garden's pacing, which `garden_check.js` holds.) Source string: `TROPHY: <NAME>`, so it shows in ACCOUNT.EXE.
- **Legacy mirrors pay nothing.** Magen already pays SUN for its mitzvot (`achSun`) and Cook's ledger pays none by design. A mirrored
  entry is shown in the ledger under its game, but pays 0 and does not count toward the meta totals or toward mastery.
- **Cosmetic unlocks, earned not bought** (phase 3; art cost, so optional): a `kind: 'earned'` shelf in `COS_CATS` for boot logos
  (one per game mastered), one pointer, one frame at 200 trophies; and a real file written to `::/Home/Trophies/CERTIFICATE.DD` (a DolDoc
  document, which in this machine is a program) at 50 / 150 / all, in the style of how backdrops write a real picture. The last one is where
  the gift's own message goes.
- **Nothing gameplay-affecting is ever gated behind a trophy.** No ending, no level, no shop item.

## 7. When a trophy can no longer be earned

The brief's warning ("avoid gotcha windows") is turned into five rules, and every row of the catalogue has been checked against them.

1. **Scope a "never" to something short and replayable.** "Without a hit" is per run, per fight, per room, per Shabbat, per descent.
   There is no "never die in the whole campaign" or "never sell anything in the whole save". The `scope` field records it, and
   `check-trophies` fails a definition whose `desc` contains "never" with `scope: 'life'|'save'`.
2. **No trophy depends on a *particular* answer to a permanent choice.** Bekkedal's eight first-meeting questions are written down for
   ever; a trophy may reward having made a choice, never the right one.
3. **A set that contains a missable member is a "N of M" set.** Dave's `never` farewell can only be heard before the first purchase, so
   "hear his farewells" is *five of seven*, not seven.
4. **Everything else that could close declares `until`.** The ledger then shows `CLOSED - <reason>`, greys the card, and removes it from
   the denominators so a hunter's percentage is always reachable. Example: a trophy for a shop item that a later update removes becomes
   `retired: true, since: '1.4'` and behaves the same way.
5. **Counters are lifetime, tied to the machine, not to a save.** Re-starting the thing does not reset the trophy store; it can only
   add to it.

Other edge cases: two windows of the same app (Sweeper and Solitaire are single-instance; the rest are not): the store is a singleton and
`emit` is idempotent per id. The clock going backwards: the login streak ignores a day that is earlier than the last recorded one and
forgives one missed day per week (`GRACE_DAYS = 1`), because the machine has no network to prove anything and a flat tyre should
not end a streak.

## 8. The experience of earning one

### 8.1 The card

Not the bottom-of-screen `toast` (that is a single line, 3.2 s, shared by file operations). A trophy gets its own card, anchored just above
the taskbar at the right (beside the SUN counter), 4.2 s, drawn like Magen's banner: a tier-coloured frame, the cup glyph, name,
description, and the SUN line. `prefers-reduced-motion`: no slide, no sparkle, the card just appears and fades.

```
+--------------------------------------------+
| [cup] TROPHY - SILVER            +40 SUN   |
| UNTOUCHED                                  |
| Defeat a guardian without losing a mask.   |
+--------------------------------------------+
```

- **Sound**: a three-note rising cadence in C major pentatonic on the SFX bus (so the SFX knob and the mixer respect it), a fourth
  octave note and a shimmer for gold. A secret has a different, lower, slower figure. A mastery has the same figure as the style
  meter's top chord. Silent at SFX 0 like the rest of the machine.
- **Queue**: at most one card on screen, up to four waiting; more than four collapse into one card, `5 TROPHIES - OPEN TROPHIES.EXE`.
- **Click** opens the ledger on that card.

### 8.2 Near misses (to feed the "one more try")

A counter or set trophy that has just crossed 80% for the first time gets one quiet line in the ledger's "RECENT" strip, never a card:
`NEARLY: HIVE MIND 2 / 3`. At most once per trophy, ever (`seen.nearMissShown`).

### 8.3 Never in the middle of the action

`T.hold()` is called when AfterEgypt starts a run, Stand Battle starts a fight, Sweeper starts a room, a blackout begins
(`Drunk.blackedOut()`), the boot sequence runs, or the long boot is on screen. Cards queue while held and are shown, in order, on `release()`
or three seconds after the end screen appears. A trophy is *recorded* the instant it happens; only the card is delayed.
The one exception is `kind: 'joke'`, which is allowed to interrupt a boot screen because that is the joke.

### 8.4 Everywhere else it shows up

- **In the game's own end screen** (the line under "BATCH COMPLETE", Sweeper's pay panel, AfterEgypt's pay list): `TROPHY: <NAME>` rows, so the
  moment is attached to the game's own celebration instead of floating over it. The `emit` call returns the ids earned so the app can list them.
- **Terminal**: `TROPHIES` (summary and nearest five), `TROPHIES <APP>` (that game's list), `TROPHY <ID>` (full card). Output in the machine's
  voice, one sound per command like the rest of the terminal.
- **Help**: a new page in `kernel/help_text.js`, `TROPHIES`, that explains tiers, secrets, "CLOSED", and where SUN goes. Built in, so it cannot be deleted.
- **The desktop menu**: `TROPHIES...` next to `CRAZY DAVE'S SHOP...`.
- **ACCOUNT.EXE**: the trophy payouts appear as ordinary transactions.
- **Accessibility**: the card is an `aria-live="polite"` region; tier is spoken ("silver trophy"), not just coloured.

## 9. How it is tested

The repo's habit is a pure-Node check beside every rule. Three layers:

1. `node scripts/check-trophies.mjs` (new, pure): every id unique and prefixed with its app; tier, kind, scope valid; `name` <= 24 chars
   and UPPERCASE; `desc` <= 64 chars; every `on` is an event that app declares; every `stat`/`sets` key is declared; no secret without a
   `hint`; no non-secret with a `hint`; any `desc` with "never" is scoped `run|room|session`; no two trophies identical in condition;
   legacy ids exist in the source app's own table (Cook `CK_ACH`, Magen `MG_ACH`); counts per game/tier printed; SUN total printed.
2. `apps/<id>/trophies_check.js` (new, pure, one per app with skill trophies): the rule predicates run against the app's existing
   simulators and bots, so a trophy cannot ask for something the game cannot do. The ones that can be *proved* are marked `sim` in the
   catalogue: Cook (the BFS solver proves par, so "par with no undo" is real), AfterEgypt (`aftere_check.js` already flies every tier with a
   bot; extend it to count grazes, coins and flawless), Sweeper (`board_check.js`), Garden (`garden_check.js`), Bekkedal (`act2_check*.js`
   and `spine_check.js` already simulate whole runs and carry the "fastest possible" numbers), Magen (`music_check.js`-style tests of its pure parts).
3. Thresholds marked `tune` are first guesses from the numbers in the code. They are listed in the README so they get a human playthrough
   before they ship; a number is cheaper to change than a trophy a player has already failed.

## 10. Housekeeping when it is built

- `CLAUDE.md`: a "Trophies" section in the kernel list; `apps/trophies` in **Apps**; the `ctx.trophy` line in **The ctx API**.
- `kernel/registry.js`: add `trophies`. `kernel/wm.js`: the `ctx` object gets `trophy: window.Trophies.scope(appId)`.
- `.claude/rules/bekkedal-content.md`: a "Trophies" section (Bekkedal's are bilingual `{ no, en }` and gated on `S`, like a dialogue line).
- `electron/` needs nothing: no new top-level folder is served, no network.
- `npm run check:apps` (leak check): `TROPHIES.EXE` and the toast must add no listeners that survive close; use `scopedListeners`.
- `scripts/lint-content.mjs`: extend with the trophy copy rules (UPPERCASE name, length, no speaker prefix).
