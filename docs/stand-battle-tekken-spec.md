# Stand Battle Arena — arcade-fighter rework (design spec)

**Status:** this document replaces the *combat design and the run structure* of `stand-battle-arena-spec.md`, `-gdd.md` and `-tech.md`.
It is written before the code and kept in step with it; every number below is a constant in `apps/standbattle/` (the file is named in brackets).
**What stays from the old documents:** the fixed 60 Hz simulation, the seeded RNG streams, the headless run, the pixel rules (smoothing off,
whole-pixel snapping, integer upscale), the juice rules (hit-stop 3–12 frames, directional whole-pixel shake, a shake toggle that is not optional),
the rule that nothing the player cannot react to may hurt them, the 480×270 canvas, the art, and the JoJo fan-project premise.
**What is retired:** Persistence, Momentum, poise, the Step/Guard/Clash triangle, Fragments/Relics/Arrows and the effect-content registry, the node map and
the single-act roguelike run. Nothing in this rework copies another game's characters, moves or names; the genre terms used here (launcher, juggle,
sidestep, wall splat, frame advantage) are generic.

---

## 1. What the game is now

A two-fighter arcade fighter on a 3D-feeling stage. Two fighters face each other on the existing `(x, z)` plane; `x` is the long axis, `z` has **two lanes**.
Four attack buttons (left punch `LP`, right punch `RP`, left kick `LK`, right kick `RK`), a throw (`LP+RP`), a block held by pulling back, a crouch,
a sidestep, motion-input specials. Best of three rounds, 60 seconds a round. Modes: title/attract, arcade ladder, versus (two people on one keyboard),
versus CPU, survival, time attack, training.

Mastery is **knowledge and execution, not numbers**: every fighter has the same 120 HP, nothing is levelled, nothing is unlocked that makes a fighter stronger.
What separates players is frame traps, throw breaks, sidestep reads, combo routes and punish windows, and training mode shows all of them.

## 2. Architecture and determinism

* `fight.js` is a pure simulation: `createFight(config)` then `fight.step(bitsP1, bitsP2)` once per 60 Hz frame. No DOM, no canvas, no clock, no `Math.random`.
  All randomness is a named stream of `rng.js` (`ai`, `dummy`, `fx` is render-only and unseeded as before). The same seed and the same input bits give the same fight, frame for frame.
* Input to the sim is **one integer per player per frame** (bit flags: `LEFT 1, RIGHT 2, UP 4, DOWN 8, LP 16, RP 32, LK 64, RK 128`). A human's keyboard/gamepad, the CPU, the training dummy,
  a recorded loop and the budget bot all produce the same integer, so they are interchangeable and a fight can be replayed from an array of integers.
* `sim_loop.js` (kept) turns real time into whole frames. Hit-stop is counted in **sim frames** now (it was milliseconds in the juice object), so the headless run and the window agree.
  The KO slow-motion is a speed factor on the loop (`fight.timeScale`), not a change to the sim.
* The hook bus (`hooks.js`, kept and cut down to what a fight uses) announces what happened: `onSwing onHit onBlock onWhiff onSidestep onSidestepDodge onThrow onThrowBreak onLaunch onBounce onWallSplat
  onKnockdown onWake onCombo onSpecial onProjectile onDetonate onRoundStart onFight onKO onRoundEnd onMatchEnd`. Audio, effects, juice, the training screen and the trophy ledger only listen (`bus.on`);
  none of them can change a fight. The old belt-scroller's effect and query hooks (which rewrote numbers) are gone with the content that used them.
* The status system (`status.js`, kept) carries the two effects that outlive a hit: Killer Queen's **bomb** mark and Angelo's **drowning**.
* Files stay under 300 lines. The movelists are one file per fighter (`char_*.js`) because 181 move rows do not fit one file; `moves.js` is the row format, the builder and the
  shared system moves.

## 3. The stage

| | |
|---|---|
| Long axis `x` | `ARENA_MIN 58 … ARENA_MAX 662` (`arena_bounds.js`, unchanged). Fighters start 120 apart at the middle. |
| Lanes | `z = Z_REST − 10` (**near**, lane 0) and `Z_REST + 30` (**far**, lane 1): 16 px apart on screen (`zToYOffset`). A fighter's `lane` is logical and instant; its drawn `z` eases over 8 frames. |
| Push box | 26 wide, same lane only. Overlap is split between the two; at a wall the one against it does not move. |
| Walls | A stage with `rule: 'walls'` (alley, street, store) holds fighters at `ARENA_MIN/MAX`; a launched fighter that reaches the wall **splats**. |
| Ring-out | A stage with `rule: 'ring'` (park) has no wall: a fighter in a launch, knockdown or throw reaction that passes `ARENA_MIN − 24 / ARENA_MAX + 24` loses the round at once. Walking never goes over the edge. |
| Camera | Midpoint of the two fighters, clamped to the world (kept). The gap between fighters is capped at 380 so both stay on a 480 px screen. |

## 4. Input

### 4.1 Buttons and directions
`LP RP LK RK`, four directions, relative to facing in the sim (`F` forward, `B` back, `D` down). Written as numpad directions (5 neutral, 6 forward, 4 back, 2 down, 3 down-forward, 1 down-back).

| Input | Meaning |
|---|---|
| hold `B` (neutral or crouched) | **guard**. There is no block button. A fighter guards only while *actionable*; not in recovery, not in stun. |
| hold `D` longer than `TAP` | **crouch**. |
| tap `UP` / `DOWN` (pressed alone, released within `TAP = 6` frames) | **sidestep** to the far lane / the near lane. A direction held with another direction or a button is not a tap, so motion inputs that start on `D` never sidestep. |
| `6,5,6` within `DASH = 12` frames | dash (18 frames, 74 units); `4,5,4` backdash (22 frames, 50 units). |
| `LP+RP` | throw (see 8). `F+LP+RP` forward throw, `B+LP+RP` rear throw. Two buttons count as together when pressed within `SIMUL = 3` frames. |
| a button, optionally with a direction or a motion | a move from the fighter's movelist. |

### 4.2 The buffer and the motion windows (documented, tight, and the same for everybody)

| Name | Frames | Rule |
|---|---|---|
| `BUFFER` | 9 | A button press is remembered for 9 frames and fires the first frame the fighter can act (or a cancel window opens). Kept from the old engine. |
| `TAP` | 6 | A lone `UP`/`DOWN` released within 6 frames is a sidestep; longer is a crouch (`DOWN`) or nothing (`UP`). |
| `MOTION_WINDOW` | 15 | The directions of a motion (`2,3,6` quarter-circle forward = `qcf`; `2,1,4` = `qcb`) must all be entered within 15 frames. The diagonal may be skipped (`2,6`) if the two are within 3 frames. |
| `MOTION_BUTTON` | 6 | The button must be pressed no later than 6 frames after the last direction of the motion (or at the same frame). |
| `CHARGE` | 36 | Hold back (`4`, `1` or `7`) for 36 frames (a gap of up to 2 frames is forgiven), then forward (`6`,`3`,`9`) plus the button within 6 frames of releasing back. |
| `SIMUL` | 3 | Two buttons count as pressed together. |
| `BREAK` | 14 | A thrown fighter breaks it by pressing the throw's break button inside 14 frames of the grab. |

A motion special needs its command: pressing the button alone gives the plain move. A motion is read from the **history ring** (the last 40 frames of direction and button state for each
fighter), never from the key-event stream, so keyboard, gamepad, CPU and replay agree. Where several moves match, the most specific command wins (motion > direction+button > button).

### 4.3 Devices and the keymap
Keyboard and gamepad both work, both rebindable (`input.js`, rewritten on the old rebindable keymap). Defaults are laid out **for two hands**: **P1** `A D` walk, `W S` sidestep/crouch
(the left hand), and `U I` = `LP RP` over `J K` = `LK RK` (the right hand's index and middle fingers: hands on top, feet below, left on the left, like the arcade panel). It used to be
`F G` over `V B` beside `W A S D`, which asked one hand to steer and fight at once. **P2** arrows and the number pad, `4 5` = `LP RP` over `1 2` = `LK RK`. Two people at a keyboard with no
number pad press SHARED KEYBOARD on the CONTROLS screen: P1 `W A S D` + `F G V B` on the left, P2 arrows + `K L , .` on the right (the old split). With one human (arcade, CPU, survival, time attack,
training) P1 accepts both maps. A save that holds exactly the old defaults was never changed by its owner and gets the new ones. Gamepad: d-pad or left stick, `X Y A B` = `LP RP LK RK`,
`Start` confirms, `Select`/Back opens pause. The CONTROLS screen rebinds any key or button and stores it in `meta.keymap` through `save.js`.

## 5. Frame data — the one source of truth

A move row (`moves.js`) is `[id, name, command, height, startup, active, recovery, onHit, onBlock, damage, reach, anim, extras]`. Definitions (the usual ones):

* `startup` is the number of the **first active frame** (a move that hits on its 10th frame is `i10`); frame 1 is the frame the move begins.
* `active` is how many frames the hit can connect; `recovery` is the frames after the last active frame until the fighter can act.
* `total = startup − 1 + active + recovery`.
* `onHit` / `onBlock` is the **frame advantage** when the first active frame connects: (frames until the defender can act) − (frames until the attacker can act). `+4` means the defender is still
  stuck for four frames after the attacker is free.
* The sim derives the defender's stun from it: **`stun = advantage + (total − the hit's own first frame)`**, and the defender is free on the tick after the stun ends (`T + stun + 1` for a contact on tick `T`;
  the attacker is free on `T0 + total` for a move begun on `T0`). A contact `k` frames after the hit's first frame therefore leaves an advantage of the table's **plus k**, exactly as in the real games.
* Multi-hit moves list `hits` with their own frame numbers. Every hit before the last gets `stun = gap + 1` to the next hit, so a string that is meant to connect does; the table's advantage is for the last hit.
* Pushback, hit-stop, hit reaction and reach are small defaults derived from damage class and overridable in `extras`.

**Nothing else is hand-tuned.** The animation (6), the hit windows (the sim), the training display (11.7), the CPU's choices (10) and the checks (13) all read these rows.
`framedata_check.js` runs *every* move of every fighter in the sim, once on hit and once on block (and once on a late contact for moves with a long active window), and compares what the
sim produced with the row: the frame of first contact equals `startup`, the attacker's free tick equals `total`, and the measured advantage equals `onHit` / `onBlock`. It fails on any difference.

Authoring guide (held by `fairness_check.js`, which reads every row of every fighter and prints each one that breaks a rule):

| Class | startup | on block | notes |
|---|---|---|---|
| jab (high) | 10 or 11 | ≥ 0 and at most +1 | the fastest thing a fighter has; **nothing is faster than i10**, and a follow-up in a string counts from the string's first button |
| mid poke | 12–14 | −5 … 0 | |
| power move | 15 or later | −6 or worse (unless it reaches 50 or less) | the ones you punish |
| low | **≥ 14** (counted from the first button of its string) | −5 … −17 | a low must be reactable |
| launcher / knockdown | any | **−12 or worse** | always punishable |
| sweep | ≥ 17 | ≤ −17 | knockdown, very punishable |
| anything −11 or worse | | | the defender's jab is quicker than the recovery, so there is always a punish |
| throw | **≥ 12** | n/a | breakable; beaten by a sidestep and by any faster move; every fighter has three, broken by LP, RP and either |
| plus on block | jab-class only (i11 or faster), by at most +1 | | nothing else is ever plus on block |
| reach | a quick strike (i14 or faster) reaches at most 70, nothing more than 110 | | the longest pokes are specials with long startup |
| thrown thing | ≥ 20 to the first frame; crosses 80 units in 20 frames or more | | slower than a person's reaction |
| counter move | ≥ i20; its counter window is on the move's own frames | | |

## 6. Heights, guard, crouch

Every hit is **high**, **mid** or **low**. A fighter that is actionable and holding back **guards**; one holding `D` **crouches**; both together is a **crouch-guard**.

| Hit is… | stand, no guard | stand-guard | crouch | crouch-guard |
|---|---|---|---|---|
| high | hit | blocked | **whiffs (ducked)** | **whiffs** |
| mid | hit | blocked | hit | **hit** |
| low | hit | **hit** | hit | blocked |

A move that whiffs leaves the attacker in full recovery and the defender free: that is the punish. Throws ignore guard (8). A fighter who is not actionable is never guarding, and a hit
on a fighter who is attacking (startup or active frames) is a **counter hit**: +20 % damage and +3 stun frames, and some mids launch on a counter.

## 7. Sidestep and tracking

A sidestep (tap up / tap down) lasts 13 frames. Frames 1–2 happen in the old lane and the fighter can be hit as normal; on frame 3 the fighter's **lane flips**.
Every attack records the lane it was **aimed at** when it began (the opponent's lane at that frame, and the attacker steps into it); on an active frame it can hit only a defender in
that lane, unless the hit **tracks**: `track: 'none'` (linear), `'near'`, `'far'`, `'both'`. A tracking hit also connects to a defender who has moved to the lane named.
So a linear move that is committed when its target sidesteps whiffs, a tracking move catches it, and a sidestepper who is then attacked has been caught in the lane it chose.
A fighter can act again on frame 14. A sidestep does not move the fighter along `x`.

Because there are only two lanes, the direction of a sidestep is dictated by where you stand (`UP` from the far lane does nothing). Moves are authored with that in mind: roughly one
move in four tracks, and most of those track only one lane, so which lane you are in is a decision.

## 8. Throws

`LP+RP` is a throw; `F+LP+RP` a different throw; `B+LP+RP` a rear throw. Startup 12 (`i12`), range 28 (almost touching), 1 active frame, **beats guard and crouch** (it has no height),
**loses to a sidestep** (linear, `track: 'none'`) and to any move whose active frame comes first. Each throw names a **break button** (`LP` for the neutral throw, `RP` for the forward throw,
either for the rear one); pressing it within `BREAK = 14` frames of the grab cancels it: both fighters separate, no damage, both at 0 advantage. Throws do 70–80 % of a launcher's
damage, no scaling, no juggle; they end in a knockdown.

## 9. Combos, juggles, bounces, splats, knockdown

* **Combo** = hits on a defender who is in a reaction (stun, air, bounce) since the first hit. Counted by `fight_combo.js`; the counter drops when the defender is free.
* **Damage scaling** by the hit's place in the combo: `1.00 0.90 0.80 0.70 0.60 0.50 0.45 0.40 0.35 0.30` and 0.30 from the tenth on. Throws and the first hit are always 1.00.
* **Launch**: a launching hit puts the defender in the air (`vy` 8.6, gravity 0.33 per frame squared, about 50 frames of air, carried 0.7 away). Hitting an airborne defender is a **juggle**: each juggle hit pops them to
  `vy` 5.5 and counts; after the 3rd juggle hit gravity doubles ("slump") and the 6th hit ends the juggle: they fall and the next hit is a new combo. A juggle hit that is not
  `juggle: true` in its row (slow, big moves) does nothing to a defender in the air. `combat_check.js` proves that a launcher connects into a juggle move, that scaling applies hit by hit and that a splat closes the combo; how long a
  fighter's best route is depends on the frame data and is for training mode to show (the longest found by hand are five to seven hits).
* **Bounce**: a `hit: 'bounce'` slams the defender to the floor and they rebound once (`vy` 6). One bounce per combo. A rebound is juggleable like a launch.
* **Wall splat**: a launch or a heavy knock-back into a wall (walls stages) pins the defender for 34 frames. The splat deals `splat` damage and **ends the combo**: the counter closes (and the
  trophy/score system is told), the pinned fighter cannot act, and the attacker's next hit starts a new combo scaled from 0.80. Pushing a fighter into the wall with pokes does not splat;
  the row says which moves do (`splat: true`) and a juggle that reaches the wall does.
* **Knockdown**: a hit with `hit: 'down'`, the end of any launch, or a throw. The defender lies for 30 frames, then rises (20 frames). **Wake-up options**, chosen with the input held when
  they land: *nothing* (rise at 50 frames, the slowest), `F` quick-rise (rise at 34, vulnerable on the ground to nothing but low sweeps), `B` roll back (move 40 units away), `UP`/`DOWN`
  roll into the other lane, `LK` rising low kick (`i16` low) or `RK` rising mid kick (`i18` mid). A hit on a downed fighter is only possible with a move flagged `oki: true` (stomps and low sweeps), at normal damage.
* **Ring-out** (ring stages): a reaction that carries a fighter past the edge ends the round, win by ring-out.
* **Hit-stop** (sim frames, both fighters frozen, the round timer paused): 6 (damage under 8), 8 (under 14), 11 (heavy), 12 (launch), 20 on the killing blow.

## 10. Rounds

* Best of three: first to **2 round wins**. A round is 60 s (3600 frames, the timer paused during hit-stop and the intro).
* Round order: `intro` (150 frames: ROUND n, FIGHT!), `fight`, then the **KO beat** (36 sim frames at 0.30 speed = 2.0 s real; the picture's edges darken), then the win pose (150 frames), then the next round or the result.
* A round ends on KO, ring-out, or the timer. On the timer the fighter with the higher *percentage* of HP wins; **equal HP, or both KO'd on the same frame, is a draw that counts as a win for both**.
* If a draw gives both fighters their second win at once, a **final round** is fought (30 s, sudden death). If that is also a draw, whoever dealt more damage in the match wins; if that is equal too, player 1 does.

## 11. Modes

### 11.1 Title and attract
`title` cycles: the logo card (8 s); a **live CPU-vs-CPU fight** (two AIs on HARD, seeded, one round of up to 25 s, random roster; 30 s at most on screen); the high-score table (9 s); the control sheet (9 s).
Any key, click or gamepad button goes to the menu (`scene_title.js`).

### 11.2 Menu and character select
Menu: ARCADE, VERSUS 2P, VERSUS CPU, SURVIVAL, TIME ATTACK, TRAINING, OPTIONS. One player at the cabinet picks with P1. **Pick-up choice:** on the select screen a second player who presses a button with
the P2 keys or pad joins in, the mode becomes a two-player versus, and both pick (P2's cursor appears). Select shows each fighter's portrait, name, Stand and a four-line style note; `START` also
shows the CONTROLS sheet.

### 11.3 Arcade ladder
* **Six fights.** The four other fighters in order of rising danger (Delinquent, Angelo, Kira, Polnareff, Jotaro, skipping your own), then **your own fighter as a mirror** (the CPU takes the other colours), then
  the **boss**: Killer Queen, Kira's Stand at full (phase art follows his remaining HP; he has extra moves, SHEER HEART ATTACK and BITES THE DUST, and no extra health or damage). Stages go round alley, street and
  park; the boss is at the store (`ladder.js`). (A seventh fight, "the rival", was in the first draft and is gone: see D18.)
* **Three difficulty tiers** (EASY, NORMAL, HARD) change only the CPU's profile (12), the number of continues (**7, 5, 3**) and the score multiplier (×0.5, ×1, ×2). Within a ladder the profile climbs from the
  tier's own at fight 1 to a stronger one at the boss and never eases on the way (`ladderProfile`; the last fight of EASY is NORMAL's first, of NORMAL a little below the human-pace bot, of HARD beyond HARD).
* **Continue countdown:** after a lost match a 10-second countdown; a press of `START` (or a click) *starts that fight again* (new match, same opponent) and costs a continue; at zero, or with no continues left, it is game over.
* **Score:** per round won 1,000; time bonus (60 − seconds) × 20; flawless round 2,000; every combo hit over 3 (50 each); ring-out 500; × tier multiplier; −5 % per continue used. Cleared ladders are
  recorded per fighter and tier.
* **High scores:** the top 10 keep **three initials** (arrows/`WASD` to choose, `START` to confirm; the previous initials are the default). Saved through `save.js`.
* **Pause** (`ESC` or the pad's Start) has CONTINUE and QUIT TO MENU; quitting abandons the run and records and pays nothing.

### 11.4 Versus
**VS 2P**: two people, both pick, stage picked by P1 (or random), best of three with a rematch option. **VS CPU**: one person, the opponent and the tier are picked; stage random or picked.

### 11.5 Survival
One round of 45 s per opponent, a seeded endless sequence (every sixth win the boss). The CPU climbs with the number of wins whatever the arcade tier is (`survivalProfile`): EASY to NORMAL over the first seven,
NORMAL to HARD over the next seven, then HARD to beyond itself. HP **carries over**, with 25 % of the maximum (30) restored after a win (never above max). Over at 0 HP. Record: most wins in a row, best
fighter, saved as `meta.survival`. The tier only scales the pay and the score.

### 11.6 Time attack
Five fights: the first four of the ladder's others and the boss, one round each of up to 45 s, no continues (the first loss ends the attempt); the clock runs across all five (including the intros, not
the menus). The CPU climbs from EASY to NORMAL (`timeAttackProfile`): it is a race against the clock, not a test of the CPU. Record: fastest clear per fighter, saved as `meta.timeattack`.

### 11.7 Training
A flat stage with walls, infinite time and HP that refills. On screen: the **frame data** of the move you are doing (name, height, `iN`, active, recovery, on hit, on block) and the **measured
advantage** of the last exchange (`+4 BLOCK`, `-12 HIT`), the combo's hit count, damage and scaling, an input history strip (the last 30 frames as arrows and buttons) and optionally the hit and
hurt boxes. **Dummy modes:** STAND, CROUCH, BLOCK (guards correctly by the incoming height), RANDOM (seeded mix of stand, crouch, guard, sidestep, jab). **Record / playback:** `RECORD` makes player 1's
inputs the dummy's for up to 600 frames, `PLAY` loops them. `RESET` puts both at the start positions with full HP. The dummy's side and the starting distance can be switched.

## 12. The CPU

The CPU is a player: each frame it produces the same integer a keyboard would (`ai.js`). It reads **only** the state a human sees (positions, the opponent's state, the move and frame the opponent
is in, whether the opponent is guarding or crouching, a thrown thing), **delayed** by its reaction time (`ai_check.js` proves the delay to the frame, for a move, for a thrown thing and for a throw it has to break),
and it chooses from its own movelist using the same frame data (what is safe, what is a punisher, what reaches). Positions are seen as they are: a person tracks distance continuously and reacts late to *events*.

What it does, in the order it asks itself (`ai_think.js`, `ai_neutral.js`): (1) **every free frame**, whatever else it is doing (standing still, walking, resting), has something started that it should answer? A move it can see starts
(guard at the right height, or step out of a linear one), a thrown thing comes (step out of one that flies straight, hold back against one that follows, and keep holding until it is gone); one decision per threat, so the dice are
rolled once and not once a frame. (2) Is something recovering that it can punish? (3) Is the other fighter in a combo it can carry on, up to the profile's route length? (4) Otherwise the **neutral**, which it plays by distance like a
person: out of everyone's reach it walks in or waits; where it reaches and they do not it takes the free poke nearly every time; where they reach and it does not it backs off or guards; where both reach it is a race (attack as often as
`aggro`, otherwise guard, sometimes crouching when the other fighter has a low that reaches, step back, or stand still). It walks up to a guarding fighter to throw, and detonates a bomb it has placed.

| Profile field | EASY | NORMAL | HARD | Meaning |
|---|---|---|---|---|
| `reaction` (frames) | 30 | 24 | 18 | how stale its view of the opponent is |
| `error` | 0.24 | 0.16 | 0.10 | chance a decision is replaced by a wrong one (wrong height guarded, a button mashed) |
| `punish` | 0.20 | 0.35 | 0.55 | chance it presses a guaranteed punish when one is open |
| `tech` | 0.05 | 0.20 | 0.35 | chance it breaks a throw (it can only if `reaction` ≤ 11: a throw must be seen inside the 14-frame window) |
| `step` | 0.05 | 0.10 | 0.20 | chance it sidesteps a linear move it saw start |
| `combo` | 2 | 2 | 3 | longest route it will attempt |
| `aggro` | 0.35 | 0.50 | 0.55 | how often it advances instead of waiting |
| `think` (frames) | 30–70 | 16–50 | 12–40 | how long it rests between decisions |

Difficulty is **only** these numbers and the seeded dice. There are no health, damage or speed multipliers for the CPU, hidden or otherwise (`content_check.js`: a profile has exactly these keys). A fighter is the same fighter whoever plays it.

**Within a ladder** the profile moves from the tier's own at fight 1 to a stronger one at the boss: EASY to NORMAL's first, NORMAL to *reaction 19, error 0.105, punish 0.535, tech 0.33, step 0.19, think 12–41* (a little under the human-pace bot),
HARD to *reaction 10, error 0.04, punish 0.9, tech 0.7, step 0.45, combo 8, aggro 0.65, think 4–16* (a player who has played many fighting games). **Survival** and **time attack** have their own ramps (11.5, 11.6).

**Calibration, and why the tiers are what they are (D20).** A first draft had NORMAL a notch *better* than the human-pace bot (reaction 15 against its 18); that bot then won a quarter of its matches and never cleared a ladder. The tiers were moved until the
bot (`HUMAN` = HARD's own numbers: reaction 18, error 0.10, punish 0.55, tech 0.35, step 0.20, route of three) beats a NORMAL ladder about two matches in three. The same bot on both sides is an even match (`ai_check.js`), HARD beats NORMAL beats EASY
by a margin, and a NOVICE (= NORMAL) and a SKILLED player (reaction 12, error 0.05, punish 0.85, tech 0.65, step 0.40, route of eight) are the other two points on the scale the budget reports (17, 20).

## 13. Roster

Five playable fighters and one boss-only fighter. The Morioh enemies and Kira are the base of the roster, as asked. All 120 HP; walk speeds differ by ±10 % as data (`walk` in `roster.js`).

| Fighter | Stand | Identity | Moves |
|---|---|---|---|
| **Jotaro Kujo** | Star Platinum | Brawler. Big mids, strong throws, Stand-assisted rushes (STAR FINGER long poke, ORA barrage, STAR BREAKER charge launcher). Few tracking moves (5 of 23 strikes). | 29 |
| **Yoshikage Kira** | Killer Queen | Trickster. Best lows and mix-ups; **TOUCH** puts a bomb on the opponent (status), **DETONATE** blows it from anywhere (damage 26, the mark lasts 5 s). | 31 |
| **Morioh Delinquent** | — | Rushdown. Fast pokes, hard lows, a headbutt and a sweep; simple to learn, easy to guard once read. | 29 |
| **Angelo** | Aqua Necklace | Zoner. Long limbs, thrown rocks (projectiles), a grab that starts **drowning** (damage over time), tracks to the near lane. | 30 |
| **Jean Pierre Polnareff** | Silver Chariot | Fencer. The longest reach and the fastest pokes, thrusts that track one lane, low damage. New sprite (`sprite_polnareff.js`). | 29 |
| *Killer Queen (boss)* | | Kira's list plus SHEER HEART ATTACK (slow homing bomb, 18 damage) and BITES THE DUST (a counter, 30 damage if a hit arrives in frames 8–24). | 33 |

**Balance is measured, not felt (D23).** `fairness_check.js` holds the authoring guide; on top of it the five were played against each other, both sides the same bot (the human-pace profile), sides swapped half the time,
400 matches a pair, until every fighter sat between 41 and 59 %. What it took, and what it says about the game: the first round robin ranked the fighters by **reach** (the longest quick poke won and a fighter who was out-ranged by
ten units won one match in six), so the quick pokes of all five were pulled to within a few units of each other and the long ones were made slow; Kira's damage was raised by a fifth, because a trickster whose every hit does less than
the others' loses without ever being outplayed; Jotaro's and Polnareff's long pokes (STAR FINGER, PIERCE) were made slower and weaker. The result is in section 20. It is a measure of how well *this CPU* plays each list, not of how
a person would: a person will find the tricks the CPU does not (Kira's bomb, Angelo's drowning grab) and the order may move.

**Movelist template** (every fighter gets about 25 and a few more for its own tricks; the totals are above): 4 standing normals (`LP RP LK RK`), 4 forward normals (`F+LP/RP/LK/RK`), 2 back normals, 3 strings (`LP,RP`, `LP,RP,LK`, `RP,LK`), 4 crouching normals
(`D+LP/RP/LK/RK`), 2 launchers (`D/F+RP`, `D/F+LK`), 3–4 specials by motion (`qcf+LP`, `qcf+RP`, `qcb+RK`, charge `B~F+RP`), 1 dash attack (`F,F+RP`), 3 throws, 2 wake-up kicks, plus
character-specific rows (a stomp, a projectile, a counter). The rows are the data; this table is the shape.

## 14. Animation and art

* **New art:** Polnareff (`sprite_polnareff.js`, a build on the shared painter in `sprite_enemy.js`) and a portrait for each fighter. The title, select and result screens are painted with the existing rasterizer.
  Everything else (Jotaro, Star Platinum, Delinquent, Angelo, Killer Queen, the four stages, the font, the effects) is reused. Pixel rules unchanged.
* **Every move is animated from its frame data** (`pose_fighter.js`). A row names a style (`anim`) and a side; the style (`anim_styles.js`) gives three key poses (wind-up, strike, recover) as joint angles of
  the existing rig, and the engine places them on the move's own frames: **wind-up spans frames 1 … startup − 1, the strike is held across the active frames, the recovery eases back over `recovery` frames.**
  A move with a longer startup has a longer, more visible wind-up; there are no hand-timed loops. `anim_check.js` proves, for every move of every fighter, that the row has a style, that by the end of the wind-up of
  any move of i11 or slower the body is a visible amount of joint angle away from the stance (the telegraph; it caught the KNEE, whose wind-up hardly moved), that no two consecutive wind-up frames of a move slower than i12 are identical,
  that the strike is held across the active frames, and that the body is back at the stance exactly when the move is over, after exactly `recovery` frames of easing.
* States (guard, crouch, sidestep, hit, launch, knockdown, wake, throw/thrown, intro, win, KO) have poses of their own in the same file.
* The Star Platinum Stand appears on a move flagged `stand` (Jotaro's specials and heavies), driven by the same frame data.

## 15. Audio

Reused: the three-layer hit sound with combo pitch, the kill, the damage, the dodge, the parry-clang (now the block), the phase sting, the score engine (`score.js` unchanged: layers `explore` for menus,
`combat` for a fight, `tension` for the last round, a low-HP fighter and the boss). **Added, because a move or a stage cannot be read without them:** a throw crack, a sidestep whoosh, a wall-splat thud,
a counter-hit sting, a round-start bell, a KO boom and a round-end sting, a continue tick. All synthesised on the machine's SFX bus like the rest. No new music: nothing is composed, so nothing needs a licence.

## 16. Save, trophies, pay

* **Save** (`save.js`, the single choke point, migration v1 → v2): `meta` gains `difficulty`, `keymap {p1,p2,pad}`, `hiscores[10]`, `survival`, `timeattack`, `cleared {fighter: {tier}}`, `training`; the old `run` blob (a node map checkpoint) is
  removed on first load.
* **Trophies** go through `trophies_bridge.js` (rewritten for the new events; `setSink` lets a test hear what it emits). The old 24 were reworked into the new modes and 23 were added: **47** in all, 26 bronze, 15 silver, 6 gold,
  two of them secret (`trophies.js`, `scripts/check-trophies.mjs`, the catalogue in `docs/achievements/games-2.md`). `trophy_check.js` plays a witness through the sim for each trophy a fight can earn and shows that a near miss does not.
  The ledger is 419 trophies and about 139,600 SUN; the completion table in `kernel/trophy_rewards.js` follows the renamed ones (FIVE LADDERS 1,200, PERFECT MATCH 500, HARD, AND STILL STANDING 700).
* **Pay** (`pay.js`, `scripts/check-sun.mjs`): a won arcade match pays 100 + 30 for every stage already cleared (+25 a flawless round), a ladder cleared +1,000, versus CPU 80, survival 60 a win, time attack 600 (+300 under four
  minutes), all times the tier (0.5 / 1 / 2); nothing for a fight lost or for two people fighting each other; every payment in the last half hour takes 10 % off the next, down to 40 %. Three NORMAL ladders in an hour
  pay about 2,800 SUN, in the middle of the band the SUN check holds every game to.

## 17. Time budget (target: about two hours; measured by `budget_bot.js`)

The player sees every mode once on NORMAL and clears the arcade ladder with each of the five fighters; a ladder that ends in a game over is started again with a fresh credit until it is cleared. Mastery and trophies are on top.
All figures are in-game time in a first-time play, from a bot that plays at a human pace (`HUMAN`: reaction 18 frames, one decision in ten wrong, a punish taken about one time in two, no route over three hits). The time of a
fight is the sim's own count of real time (`fight.realFrames`: the KO beat at 0.30 speed included, hit-stop included); everything that is not a fight is the `timing.js` table, which the screens use to time themselves, so the figure
the bot reports and what a screen takes are the same number.

**The model** (written before the measurement, and what it was checked against):

| Block | Model | Justification |
|---|---|---|
| Round (intro 2.5 s + fight ≈ 34 s + KO beat 2.0 s + win pose 2.5 s) | 41 s | rounds usually end by KO before 60 s; the timer ends the long ones |
| Match = rounds × round + vs screen 4 s + result 3 s | 2.47 rounds → 109 s | a 62 % round-win rate gives 2.47 rounds a match on average |
| Ladder fights, tries included | 7 fights × 1.47 tries = 10.3 matches → 18.7 min | a 32 % chance of losing a match means 1.47 tries a fight |
| Continues, title, select, initials | 1.7 min | 3 continues × 8 s, 40 s of menus, 25 s of initials |
| **One ladder** | **≈ 20.4 min** | |
| **Five ladders** | **≈ 102 min** | |
| Everything else (versus 2P, versus CPU, survival, time attack, training, title and menus) | ≈ 20 min | one match each, a first survival run, one time-attack clear, four minutes in training |
| **Total** | **≈ 122 min** | within 10 % of two hours |

**What the measurement changed** (the knobs were, in the order the spec promised: the ladder length, the CPU ramp, the continues): the first measurement with seven fights and a CPU that was a notch better than the bot was **337 minutes and no clear at all**;
recalibrating the tiers around the bot (D20) brought it to 174 minutes; dropping the rival fight (D18) and raising the continues (D19) to 125; the NORMAL ladder's last step was then eased a little (D20) to land at the figure in section 20.

## 18. Decisions (and why)

| # | Decision | Why |
|---|---|---|
| D1 | Input to the sim is one integer per player per frame. | One representation for a keyboard, a pad, the CPU, the training dummy, a recording and a bot; replays and the headless run are trivial. |
| D2 | Two lanes, and a lane is *aimed at* when a move begins. | The brief asks for two depths. Aiming at the lane at move start makes "linear moves lose to a sidestep made after they start" true and keeps the sidestepper from being unhittable afterwards (any move they start aims at the lane the opponent is in). |
| D3 | Sidestep is a tap, crouch is a hold, both on the same direction key. | The brief says the sidestep is a *press* of up or down and that crouches exist. A 6-frame tap rule separates them without a second key, and motion inputs that start with `D` never sidestep because a chord is not a tap. |
| D4 | No jump. | Nothing in the brief needs it; air time comes from launches. It would have doubled the animations and the heights table. |
| D5 | Block is "hold back", automatic, only while actionable. | The brief. Also makes frame advantage mean something: the player who is free is the one who can guard. |
| D6 | Stun is *derived* from the authored advantage. | So the data the player reads in training is, by construction, what the sim does, and a check can prove it. |
| D7 | Hit-stop in sim frames, KO slow-mo as a loop speed factor. | The sim stays deterministic and testable; the budget counts real time with the factor applied. |
| D8 | A wall splat ends the combo and the next hit starts one scaled from 0.80. | The brief says a splat ends a combo; without a scaled restart a splat would be a free full combo and the best route in every fight. |
| D9 | A drawn round is a win for both; a double second win goes to a 30 s final round, then to damage dealt, then P1. | The brief says a draw is a win for both; the tie-break rule is needed so a match always ends. |
| D10 | The CPU sees a stale view and has a numeric error rate; no stat boosts. | The brief. It also makes the human-pace bot the same program with slower numbers, which is what the budget needs. |
| D11 | Boss has more *moves*, not more health or damage. | Same rule: difficulty is never a hidden number; a boss that is longer or harder to read is honest. |
| D12 | Five playable fighters, one boss-only. | Five ladders at about 20 minutes each is the bulk of the two hours; a sixth would be 20 more minutes the brief did not ask for. The boss is Kira's Stand, whose art already has three phases. |
| D13 | The ladder is the four other fighters, a mirror and the boss (six). | The four fighters are the roster, the mirror is the arcade classic, and the boss closes it. (The first draft had a seventh, the rival: D18.) |
| D14 | Movelists are data in `char_*.js`, the row format in `moves.js`. | 125 rows cannot live in one 300-line file; the format is the single place a column is defined. |
| D15 | Retire the effect-content registry, `stats.js`, `resources.js`, `poise.js`, `defense.js`. | They implement Persistence, Momentum, poise and Fragments, none of which exist now; keeping them would leave dead code that a check still has to pass. `content_check.js` now validates the roster and movelists. |
| D16 | `fairness_check.js` is rewritten as the reactability and range rules of 5, not removed. | The old rule ("no attack you cannot react to") still applies; it now reads frame data (lows ≥ i14, throws ≥ i12, nothing faster than i10, projectiles reactable). |
| D17 | Check and bot scripts are dev-only and are not packaged. | `electron-builder.yml` and `check-package.mjs` get the new file names; nothing in the app imports a `*_check.js` any more. |
| D18 | The rival fight is cut: the ladder is six fights. | Measured, not guessed: with seven fights the human-pace bot needed 174 minutes; the rival was the strongest fighter a second time, so it added the most tries for the least new. Six lands at about two hours. |
| D19 | Continues are 7 / 5 / 3 (EASY / NORMAL / HARD), not 5 / 3 / 1. | A ladder has about three lost matches in it for a person who is winning two in three; with three continues a game over came before the end and the whole ladder was started again, which is where the first draft's hours went. |
| D20 | The CPU's tiers are calibrated against the human-pace bot, and the NORMAL ladder ends a little below it. | NORMAL was first written by feel and was stronger than the bot: it won a quarter of its matches. Difficulty is seven numbers, so the fix is seven numbers: EASY → NORMAL → HARD are the scale the bot, a novice (= NORMAL) and a skilled player sit on, and each skill has a tier where the game is about two hours (section 20). |
| D21 | Survival and time attack ramp by their own rule, whatever the arcade tier is. | One round with carried-over life is much harsher than a best of three: survival from NORMAL gave a first run 0.8 wins; time attack from NORMAL was cleared one time in five. They are about lasting and about the clock, not about the CPU, so they start at EASY. The tier still scales the pay and the score. |
| D22 | The CPU answers a threat on every free frame, once per threat, and reads stance from the view it had a moment ago. | It used to ignore everything while it was standing still or resting (a quarter of its time) and to choose its attacks by the live stance of the other fighter, which is a view no person has. Both fixes made it a better opponent *and* a more honest one; `ai_check.js` holds the delay to the frame. |
| D23 | The roster is balanced by a round robin of one bot against itself, and the reach of quick pokes is kept within a few units. | Without a number the five drift: the first round robin put the fighters at 75 / 63 / 60 / 32 / 20 %, and the order followed reach (the long-poke fighters on top). After the pass they sit between 42 and 59 % (section 20). It measures this CPU, not a person: said so in 13. |
| D24 | The boss gets two moves that matter and nothing else. | Kira's list plus two cheap moves won 43 % of the boss's matches against the five (Kira himself is the weakest of them). Making SHEER HEART ATTACK and BITES THE DUST worth their long startup (18 and 30 damage) brought him to about 55 % (60 / 67 / 51 / 41 / 54 against Jotaro, Kira, the Delinquent, Angelo and Polnareff), a fight that is a little better than an average fighter's with no health or damage bonus; what makes him the last fight is that the ladder gives him its strongest CPU profile. |
| D25 | The pause menu has QUIT TO MENU. | The first version of the pause could only resume: a versus match or a run could not be left. Quitting abandons the run and pays and records nothing. |
| D26 | The hook bus keeps only its events. | The effect and query hooks served Fragments and Relics that no longer exist; keeping them was dead code with a validator. `hooks.js` is now the list of events and a bus that throws on a name not in it. |

## 19. Verification

Pure Node (no browser): `node apps/standbattle/framedata_check.js` (the sim reproduces the table for every move: first contact, free tick, on-hit and on-block advantage, late contact, throws, bombs, thrown things),
`combat_check.js` (heights, sidestep, throw, juggle, bounce, splat, wake-up, ring-out, scaling, rounds, draws), `input_check.js` (motion windows, tap and hold, buffer, charge), `content_check.js` (roster, movelists, ladder, profiles,
save, high scores, keymaps, stages, hook names, pay), `fairness_check.js` (5's authoring guide as ranges), `anim_check.js` (telegraphs and frame placement), `ai_check.js` (the delay, the ordering of the tiers, techs, dice),
`trophy_check.js` (a witness for every trophy), `headless_harness.js` (a seeded bot plays every mode and proves the same seed gives the same game), `budget_bot.js` (the hours). In the shell (Electron, Xvfb on Linux):
`npm run check:standbattle` (the screens, played with real keys, against the source and against the packaged app), `check:paths`, `check:shell`, `check:apps`, `check:listeners`, `check:perf`, `check:props`, `check:contrast`,
`check:music`, `check:trophies`, `check:sun`, `check:package` (after `npm run pack`).

## 20. Measured results

All of this is a bot with a person's numbers, never a person (see "what this cannot say" below). Every figure is reproducible: `node apps/standbattle/budget_bot.js 100 --all` (100 players for the budget, 50 for each other skill; a player is a seed).

### 20.1 The budget (`budget_bot.js`, the human-pace bot on NORMAL, 100 players, 500 ladders)

| Block | Model (17) | Measured |
|---|---|---|
| A round (intro, fight, KO beat at 0.30 speed, win pose) | 41 s | **41 s** |
| A match (rounds per match; fighting time) | 2.47 rounds, 109 s with the screens | **2.43 rounds, 99 s of fighting** (+ 4 s versus screen, 3 s result) |
| The bot's match win rate on a NORMAL ladder | 68 % | **68 %** (74–96 % in the first fights, 42–63 % against the boss) |
| Ladders cleared on the first credit; credits to clear one | – | **87 %**; 1.17 credits |
| One ladder (menu 6 s, select 14 s, the fights, screens, continues, initials) | 20.4 min | **18.3 min** (Jotaro 18, Kira 19, Delinquent 21, Angelo 15, Polnareff 21; sd 3 to 13 within a character) |
| Five ladders | 102 min | **91.6 min** |
| Versus 2P (one match, the rematch screen declined) | – | 2.6 min |
| Versus CPU (two matches, EASY and NORMAL) | – | 3.8 min |
| Survival (two runs; the first run reaches 2.6 wins on average) | – | 5.7 min |
| Time attack (up to two attempts; 74 % of players clear it) | – | 5.5 min |
| Training (a look at every panel) | 4 min | 4.0 min (an assumption: the player's choice) |
| Title, menus, options, controls, move list | 3 min | 3.0 min (an assumption) |
| **Everything else** | ≈ 20 min | **24.7 min** |
| **Total** | **≈ 122 min** | **116.3 min** (sd 19.3 between players, range 85 to 188; the band the bot checks is 110 to 130) |

The same bot at other points of the scale, to read the budget as a range and not a point: **a novice** (NORMAL's own numbers, who does not learn between credits) takes 118 minutes on EASY (91 % of ladders on the first credit) and would take 425 on NORMAL (6 %);
**a skilled player** (reaction 12 frames, one decision in twenty wrong, routes of eight) takes 77 minutes on NORMAL and 220 on HARD (34 %). Each skill has a tier where the game is about two hours, and NORMAL is the one for the bot the
brief describes. A person learns between credits and the bot does not, so the novice figure on NORMAL is a ceiling, not a forecast.

**What this cannot say.** The bot is a program with a human's numbers: it does not learn a fighter, does not read the CPU's habits, cannot be bored or stuck and plays one move set the same way every time. It says that the data
is *shaped* for two hours (a round, a match, a ladder and the pay of each are the lengths a plan of two hours needs, and nothing in it is an outlier), and the spread between players says how much the number depends on who plays. It
does not say how long *you* will take; only a person can.

### 20.2 Balance (a round robin of the same bot on both sides, 400 matches a pair, sides swapped half the time)

| | Jotaro | Kira | Delinquent | Angelo | Polnareff | average |
|---|---|---|---|---|---|---|
| **Jotaro** | – | 62 % | 51 % | 47 % | 48 % | **52 %** |
| **Kira** | 38 % | – | 49 % | 38 % | 43 % | **42 %** |
| **Delinquent** | 49 % | 51 % | – | 43 % | 56 % | **50 %** |
| **Angelo** | 53 % | 62 % | 57 % | – | 64 % | **59 %** |
| **Polnareff** | 52 % | 57 % | 44 % | 36 % | – | **47 %** |

The boss against the five (as player 1, 100 matches each): 60 / 67 / 51 / 41 / 54 %. The mirror of a fighter is an even match (`ai_check.js`: the same tier both sides, 35 to 65 %).

### 20.3 The CPU scale (win rate of a profile against another, five fighters mixed, 300 matches)

| as player 1 → against | EASY | NORMAL | HARD | SKILLED |
|---|---|---|---|---|
| EASY | 50 % | 13 % | 0 % | – |
| NORMAL (= the novice) | 91 % | 52 % | 13 % | 2 % |
| HARD (= the budget bot, `HUMAN`) | 99 % | 86 % | 55 % | 7 % |
| SKILLED | 100 % | 99 % | 93 % | 49 % |

The same profile on both sides is an even match; each step up the scale beats the one below by a wide margin (`ai_check.js` holds HARD > NORMAL > EASY and the even mirror on every run).

### 20.4 The checks and what they said (last run, on this branch)

| Check | Result |
|---|---|
| `framedata_check.js` | pass: 1,217 checks, the sim reproduces the table for all 181 moves (first contact, free tick, on hit, on block, late contact, throws, bombs, thrown things) |
| `combat_check.js`, `input_check.js` | pass: 66 and 44 checks |
| `content_check.js`, `fairness_check.js`, `anim_check.js`, `ai_check.js`, `trophy_check.js` | pass: 555, 574, 1,910, 15 and 21 checks (`anim_check` found a real fault, the KNEE's wind-up that hardly moved; `fairness_check` found two in the data, a low at i13 and a move at -11 that no jab was quick enough to punish; all fixed) |
| `headless_harness.js` | pass: every mode played, the same seed played twice gives the same fight |
| `npm run check:standbattle` (source and packaged app) | pass: 30 checks of the screens with real keys; the fight draws at 61 frames a second and steps at 60.1 ticks a second |
| `check:paths`, `check:shell`, `check:apps` (all 34 apps), `check:listeners`, `check:persist`, `check:contrast`, `check:props`, `check:trophies`, `check:sun`, `check:package` | pass |
| `check:perf` | pass: idle desktop 60 fps; Stand Battle's title 48 fps under Xvfb's software drawing (the floor is 20); in a fight 61 fps (`check:standbattle`) |
| `check:music` | one failure that is **not this branch's**: "every held instrument has a usable loop: synthpad 81" fails identically on the commit this branch started from |

Not verified: a person playing it (the feel, whether the CPU is fun to fight, whether the motion windows are kind), a gamepad (the bindings are tested with synthetic input only), the Windows installer (built and tested on Linux; the same code and
the same checks run in CI on both), and the time a first-time player really needs.
