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
* The hook bus (`hooks.js`, kept; its tables are replaced) announces what happened: `onHit onBlock onWhiff onThrow onThrowBreak onSidestep onLaunch onBounce onWallSplat onKnockdown onWake
  onRingOut onCombo onSpecial onRoundStart onRoundEnd onKO onMatchEnd`. Audio, effects and trophies only listen (`bus.on`); none of them can change a fight.
* The status system (`status.js`, kept) carries the two effects that outlive a hit: Killer Queen's **bomb** mark and Angelo's **drowning**.
* Files stay under 300 lines. The movelists are one file per fighter (`char_*.js`) because 125 move rows do not fit one file; `moves.js` is the row format, the builder and the
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
Keyboard and gamepad both work, both rebindable (`input.js`, rewritten on the old rebindable keymap). Defaults: **P1** `A D` walk, `W S` sidestep/crouch, `F G` = `LP RP`, `V B` = `LK RK`.
**P2** arrows, `K L` = `LP RP`, `, .` = `LK RK`. With one human (arcade, CPU, survival, time attack, training) P1 accepts both maps. Gamepad: d-pad or left stick, `X Y A B` = `LP RP LK RK`,
`Start` confirms, `Select`/Back opens pause. The CONTROLS screen rebinds any key or button and stores it in `meta.keymap` through `save.js`.

## 5. Frame data — the one source of truth

A move row (`moves.js`) is `[id, name, command, height, startup, active, recovery, onHit, onBlock, damage, reach, anim, extras]`. Definitions (the usual ones):

* `startup` is the number of the **first active frame** (a move that hits on its 10th frame is `i10`); frame 1 is the frame the move begins.
* `active` is how many frames the hit can connect; `recovery` is the frames after the last active frame until the fighter can act.
* `total = startup − 1 + active + recovery`.
* `onHit` / `onBlock` is the **frame advantage** when the first active frame connects: (frames until the defender can act) − (frames until the attacker can act). `+4` means the defender is still
  stuck for four frames after the attacker is free.
* The sim derives the defender's stun from it: **`stun = advantage + (total − contactFrame)`**, and the defender can act on the tick after `stun` frames. A late contact in a long active window
  therefore gives a *better* advantage than the table, exactly as in the real games.
* Multi-hit moves list `hits` with their own frame numbers. Every hit before the last gets `stun = gap + 1` to the next hit, so a string that is meant to connect does; the table's advantage is for the last hit.
* Pushback, hit-stop, hit reaction and reach are small defaults derived from damage class and overridable in `extras`.

**Nothing else is hand-tuned.** The animation (6), the hit windows (the sim), the training display (11.7), the CPU's choices (10) and the checks (13) all read these rows.
`framedata_check.js` runs *every* move of every fighter in the sim, once on hit and once on block (and once on a late contact for moves with a long active window), and compares what the
sim produced with the row: the frame of first contact equals `startup`, the attacker's free tick equals `total`, and the measured advantage equals `onHit` / `onBlock`. It fails on any difference.

Authoring guide (checked as ranges by `fairness_check.js`):

| Class | startup | on block | notes |
|---|---|---|---|
| jab (high) | 10 | ≥ 0 | the fastest thing a fighter has; nothing is faster than i10 |
| mid poke | 12–14 | −3 … +1 | |
| power mid | 15–18 | −7 … −12 | the ones you punish |
| low | **≥ 14** | −6 … −16 | a low must be reactable |
| launcher | ≥ 14 | ≤ −12 | always punishable |
| sweep | ≥ 18 | ≤ −18 | knockdown, very punishable |
| throw | **≥ 12** | n/a | breakable; beaten by a sidestep and by any faster move |
| special | ≥ 16 | any | |
| projectile | ≥ 20 to the first frame | | travels slower than a walk-forward closes |

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

A sidestep (`sidestep.up` / `.down`) lasts 14 frames. Frames 1–2 happen in the old lane and the fighter can be hit as normal; on frame 3 the fighter's **lane flips**.
Every attack records the lane it was **aimed at** when it began (the opponent's lane at that frame, and the attacker steps into it); on an active frame it can hit only a defender in
that lane, unless the hit **tracks**: `track: 'none'` (linear), `'near'`, `'far'`, `'both'`. A tracking hit also connects to a defender who has moved to the lane named.
So a linear move that is committed when its target sidesteps whiffs, a tracking move catches it, and a sidestepper who is then attacked has been caught in the lane it chose.
A fighter can attack out of a sidestep from frame 14. A sidestep does not move the fighter along `x`.

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
* **Launch**: a launching hit puts the defender in the air (`vy` 11, gravity 0.55/frame², about 40 frames of air). Hitting an airborne defender is a **juggle**: each juggle hit pops them to
  `vy ≥ 6` and counts; after the 3rd juggle hit gravity doubles ("slump") and the 6th hit ends the juggle: they fall and the next hit is a new combo. A juggle hit that is not
  `juggle: true` in its row (slow, big moves) does nothing to a defender in the air.
* **Bounce**: a `hit: 'bounce'` slams the defender to the floor and they rebound once (`vy` 7). One bounce per combo. A rebound is juggleable like a launch.
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
* Round order: `intro` (150 frames: ROUND n, FIGHT!), `fight`, then the **KO beat** (36 sim frames at 0.30 speed = 2.0 s real, the camera pushes in), then the win pose (150 frames), then the next round or the result.
* A round ends on KO, ring-out, or the timer. On the timer the fighter with the higher *percentage* of HP wins; **equal HP, or both KO'd on the same frame, is a draw that counts as a win for both**.
* If a draw gives both fighters their second win at once, a **final round** is fought (30 s, sudden death). If that is also a draw, whoever dealt more damage in the match wins; if that is equal too, player 1 does.

## 11. Modes

### 11.1 Title and attract
`title` cycles every 9 s: the logo card; a **live CPU-vs-CPU fight** (two AIs on HARD, seeded, 25 s, random roster); the high-score table; the control sheet. Any key, click or gamepad button goes to the menu.

### 11.2 Menu and character select
Menu: ARCADE, VERSUS 2P, VERSUS CPU, SURVIVAL, TIME ATTACK, TRAINING, OPTIONS. One player at the cabinet picks with P1. **Pick-up choice:** on the select screen a second player who presses a button with
the P2 keys or pad joins in, the mode becomes a two-player versus, and both pick (P2's cursor appears). Select shows each fighter's portrait, name, Stand and a four-line style note; `START` also
shows the CONTROLS sheet.

### 11.3 Arcade ladder
* **Seven fights.** The four other fighters in a per-character order of rising danger, then **your own fighter as a mirror** (the CPU takes the other colours), then the **rival** (the strongest of
  the four again, on a different stage), then the **boss**: Killer Queen, Kira's Stand at full (phase art follows his remaining HP; he has extra moves — SHEER HEART ATTACK, BITES THE DUST —
  and no extra health or damage).
* **Three difficulty tiers** (EASY, NORMAL, HARD) change only the CPU's profile (10), the number of continues (5, 3, 1) and the score multiplier (×0.5, ×1, ×2). Within a ladder the profile ramps from
  its base at fight 1 to its top at the boss.
* **Continue countdown:** after a lost match a 10-second countdown; a press of `START` (or a click) *starts that fight again* (new match, same opponent) and costs a continue; at zero it is game over.
* **Score:** per round won 1,000; time bonus (60 − seconds) × 20; flawless round 2,000; every combo hit over 3 (50 each); ring-out 500; × tier multiplier; −5 % per continue used. Cleared ladders are
  recorded per fighter and tier.
* **High scores:** the top 10 keep **three initials** (arrows/`WASD` to choose, `START` to confirm; the previous initials are the default). Saved through `save.js`.

### 11.4 Versus
**VS 2P**: two people, both pick, stage picked by P1 (or random), best of three with a rematch option. **VS CPU**: one person, the opponent and the tier are picked; stage random or picked.

### 11.5 Survival
One round of 45 s per opponent, a seeded endless sequence that ramps the CPU one step per win. HP **carries over**, with 25 % of the maximum restored after a win (never above max). Over at 0 HP. Record: most
wins in a row, best fighter, saved as `meta.survival`.

### 11.6 Time attack
Five opponents, one round each of up to 45 s, normal tier, no continues; the clock runs across all five (including the intros, not the menus). Record: fastest clear per fighter, saved as `meta.timeattack`.

### 11.7 Training
A flat stage with walls, infinite time and HP that refills. On screen: the **frame data** of the move you are doing (name, height, `iN`, active, recovery, on hit, on block) and the **measured
advantage** of the last exchange (`+4 BLOCK`, `-12 HIT`), the combo's hit count, damage and scaling, an input history strip (the last 30 frames as arrows and buttons) and optionally the hit and
hurt boxes. **Dummy modes:** STAND, CROUCH, BLOCK (guards correctly by the incoming height), RANDOM (seeded mix of stand, crouch, guard, sidestep, jab). **Record / playback:** `RECORD` makes player 1's
inputs the dummy's for up to 600 frames, `PLAY` loops them. `RESET` puts both at the start positions with full HP. The dummy's side and the starting distance can be switched.

## 12. The CPU

The CPU is a player: each frame it produces the same integer a keyboard would (`ai.js`). It reads **only** the state a human sees (positions, the opponent's state, the move and frame the opponent
is in, the opponent's height), **delayed** by its reaction time, and it chooses from its own movelist using the same frame data (what is safe, what is a punisher, what reaches).

| Profile field | EASY | NORMAL | HARD | Meaning |
|---|---|---|---|---|
| `reaction` (frames) | 24 | 15 | 8 | how stale its view of the opponent is |
| `error` | 0.20 | 0.09 | 0.025 | chance a decision is replaced by a wrong one (wrong height guarded, a button mashed) |
| `punish` | 0.35 | 0.70 | 0.97 | chance it presses a guaranteed punish when one is open |
| `tech` | 0.10 | 0.45 | 0.85 | chance it breaks a throw |
| `step` | 0.10 | 0.30 | 0.55 | chance it sidesteps a linear move it saw start |
| `combo` | 3 | 6 | 12 | longest route it will attempt |
| `aggro` | 0.35 | 0.55 | 0.70 | how often it advances instead of waiting |

Difficulty is **only** these numbers and the seeded dice. There are no health, damage or speed multipliers for the CPU, hidden or otherwise. A fighter is the same fighter whoever plays it.

## 13. Roster

Five playable fighters and one boss-only fighter. The Morioh enemies and Kira are the base of the roster, as asked. All 120 HP; walk speeds differ by ±10 % as data.

| Fighter | Stand | Identity | Moves |
|---|---|---|---|
| **Jotaro Kujo** | Star Platinum | Brawler. Big mids, strong throws, Stand-assisted rushes (STAR FINGER long poke, ORA barrage, STAR BREAKER charge launcher). Few tracking moves. | 27 |
| **Yoshikage Kira** | Killer Queen | Trickster. Best lows and mix-ups; **TOUCH** puts a bomb on the opponent (status), **DETONATE** blows it (damage, timer 5 s). | 26 |
| **Morioh Delinquent** | — | Rushdown. Fast pokes, hard lows, a headbutt and a sweep; simple to learn, easy to guard once read. | 25 |
| **Angelo** | Aqua Necklace | Zoner. Long limbs, thrown rocks (projectiles), a grab that starts **drowning** (damage over time), tracks to the near lane. | 26 |
| **Jean Pierre Polnareff** | Silver Chariot | Fencer. The longest reach and the fastest pokes, thrusts that track one lane, low damage. New sprite (`sprite_polnareff.js`). | 26 |
| *Killer Queen (boss)* | | Kira's list plus SHEER HEART ATTACK (slow tracking bomb) and BITES THE DUST (a counter). | 28 |

**Movelist template** (every fighter gets about 25): 4 standing normals (`LP RP LK RK`), 4 forward normals (`F+LP/RP/LK/RK`), 2 back normals, 3 strings (`LP,RP`, `LP,RP,LK`, `RP,LK`), 4 crouching normals
(`D+LP/RP/LK/RK`), 2 launchers (`D/F+RP`, `D/F+LK`), 3–4 specials by motion (`qcf+LP`, `qcf+RP`, `qcb+RK`, charge `B~F+RP`), 1 dash attack (`F,F+RP`), 3 throws, 2 wake-up kicks, plus
character-specific rows (a stomp, a projectile, a counter). The rows are the data; this table is the shape.

## 14. Animation and art

* **New art:** Polnareff (`sprite_polnareff.js`, a build on the shared painter in `sprite_enemy.js`) and a portrait for each fighter. The title, select and result screens are painted with the existing rasterizer.
  Everything else (Jotaro, Star Platinum, Delinquent, Angelo, Killer Queen, the four stages, the font, the effects) is reused. Pixel rules unchanged.
* **Every move is animated from its frame data** (`pose_fighter.js`). A row names a style (`anim`) and a side; the style (`anim_styles.js`) gives three key poses (wind-up, strike, recover) as joint angles of
  the existing rig, and the engine places them on the move's own frames: **wind-up spans frames 1 … startup − 1, the strike is held across the active frames, the recovery eases back over `recovery` frames.**
  A move with a longer startup has a longer, more visible wind-up; there are no hand-timed loops. `anim_check.js` proves that every row has a style, that the striking limb is displaced from the guard
  pose by a visible amount during the wind-up (the telegraph), and that no two consecutive wind-up frames of a move longer than i12 are identical.
* States (guard, crouch, sidestep, hit, launch, knockdown, wake, throw/thrown, intro, win, KO) have poses of their own in the same file.
* The Star Platinum Stand appears on a move flagged `stand` (Jotaro's specials and heavies), driven by the same frame data.

## 15. Audio

Reused: the three-layer hit sound with combo pitch, the kill, the damage, the dodge, the parry-clang (now the block), the phase sting, the score engine (`score.js` unchanged: layers `explore` for menus,
`combat` for a fight, `tension` for the last round, a low-HP fighter and the boss). **Added, because a move or a stage cannot be read without them:** a throw crack, a sidestep whoosh, a wall-splat thud,
a counter-hit sting, a round-start bell, a KO boom and a round-end sting, a continue tick. All synthesised on the machine's SFX bus like the rest. No new music: nothing is composed, so nothing needs a licence.

## 16. Save, trophies, pay

* **Save** (`save.js`, the single choke point, migration v1 → v2): `meta` gains `difficulty`, `keymap {p1,p2,pad}`, `hiscores[10]`, `survival`, `timeattack`, `cleared {fighter: {tier}}`, `training`; the old `run` blob (a node map checkpoint) is
  removed on first load.
* **Trophies** go through `trophies_bridge.js` (rewritten for the new events). The old 24 are reworked into the new modes and more are added (`trophies.js`, `scripts/check-trophies.mjs`, the catalogue in `docs/achievements/games-2.md`).
* **Pay** (`pay.js`, `scripts/check-sun.mjs`): a round won, a match won, a ladder cleared by tier, a survival streak, a time-attack clear, all with once-a-session decay as the other games have, held to the band the
  SUN check already enforces.

## 17. Time budget (target: about two hours; measured by `budget_bot.js`)

The player sees every mode once on NORMAL and clears the arcade ladder with each of the five fighters. Mastery and trophies are on top. All figures are in-game time in a first-time play, from the
bot's play at a human pace (reaction 18 frames, 10 % errors, no routes over three hits). The *model* below is what the bot's measurement is checked against; the *measured* column is filled in by the run
(section 20).

| Block | Model | Justification |
|---|---|---|
| Round (intro 2.5 s + fight ≈ 34 s + KO beat 2.0 s + win pose 2.5 s) | 41 s | rounds usually end by KO before 60 s; the timer ends the long ones |
| Match = rounds × round + vs screen 4 s + result 3 s | 2.47 rounds → 109 s | a 62 % round-win rate gives 2.47 rounds a match on average |
| Ladder fights, tries included | 7 fights × 1.47 tries = 10.3 matches → 18.7 min | a 32 % chance of losing a match means 1.47 tries a fight |
| Continues, title, select, initials | 1.7 min | 3 continues × 8 s, 40 s of menus, 25 s of initials |
| **One ladder** | **≈ 20.4 min** | |
| **Five ladders** | **≈ 102 min** | |
| Versus 2P (one match, two humans, a rematch declined) | 4.5 min | longer rounds when both are learning |
| Versus CPU (two matches, two tiers) | 5 min | |
| Survival (a first run: six wins) | 4.5 min | six single rounds of ≈ 40 s |
| Time attack (one clear) | 3 min | five single rounds at the pace of a clear |
| Training (a look at every panel) | 4 min | by the player's choice; the least certain figure |
| Title, menus, options, controls | 3 min | |
| **Everything else** | **≈ 20 min** | |
| **Total** | **≈ 122 min** | within 10 % of two hours |

If the measurement says otherwise the knobs are, in order: the ladder length (7 fights), the CPU ramp (a harder CPU makes longer matches and more tries), the round count of survival/time attack, and the
timer (fixed at 60 s by the brief, so not a knob).

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
| D13 | The ladder has seven fights, four others + mirror + rival + boss. | Seven is the arcade norm, and the four other fighters, the mirror and the rematch fill it without a sixth fighter. |
| D14 | Movelists are data in `char_*.js`, the row format in `moves.js`. | 125 rows cannot live in one 300-line file; the format is the single place a column is defined. |
| D15 | Retire the effect-content registry, `stats.js`, `resources.js`, `poise.js`, `defense.js`. | They implement Persistence, Momentum, poise and Fragments, none of which exist now; keeping them would leave dead code that a check still has to pass. `content_check.js` now validates the roster and movelists. |
| D16 | `fairness_check.js` is rewritten as the reactability and range rules of 5, not removed. | The old rule ("no attack you cannot react to") still applies; it now reads frame data (lows ≥ i14, throws ≥ i12, nothing faster than i10, projectiles reactable). |
| D17 | Check and bot scripts are dev-only and are not packaged. | `electron-builder.yml` and `check-package.mjs` get the new file names; nothing in the app imports a `*_check.js` any more. |

## 19. Verification

`headless_harness.js` (a seeded bot that plays every mode: arcade, versus, survival, time attack, training), `content_check.js` (roster and movelist validity), `fairness_check.js` (5's ranges, reactability),
`framedata_check.js` (sim equals table, every move), `anim_check.js` (telegraphs), `input_check.js` (motion windows, tap/hold, buffer), `combat_check.js` (heights, sidestep, throw, juggle, bounce,
splat, wake-up, ring-out, scaling, rounds, draws), `ai_check.js` (profiles act only on delayed views, difficulty ordering), `trophy_check.js`, `budget_bot.js`; then `npm run check:paths`, `check:apps`, `check:listeners`,
`check:perf`, `check:trophies`, `check:sun`, `check:package`.

## 20. Measured results

*(filled in at the end of the work; see the final section of this file)*
