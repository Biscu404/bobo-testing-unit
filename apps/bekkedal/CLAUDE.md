# Bekkedal

## Running it locally

`npm start` from the repo root opens the machine in its Electron window; launch
Bekkedal from the desktop. The app is loaded
through `kernel/registry.js`'s dynamic import, not opened as a standalone file —
there is no separate dev entry point for this app.

## File split

`data.js` holds only static content tables (items, crops, tools, NPCs,
decor placements, treeline mixes, dialogue, quests) plus the geometry constants — no functions that mutate game
state, no rendering, no DOM access. Two of those tables outgrew it and are
re-exported from siblings rather than written out here. The dialogue is one:
`BEK_TALK` is four files of two characters each, grouped by where the two
stand — `talk_town.js`, `talk_water.js`, `talk_field.js`, `talk_stone.js` —
and the twenty-four heart events split the same way into `scenes_valley.js`
and `scenes_wild.js`, joined as `BEK_SCENES`. The maps are the other, but
eleven maps of forty-odd columns is more than one file should carry beside
all of that, so they live in three siblings and `data.js` re-exports
`BEK_MAPS` from them: `maps_valley.js` (the farm, the town, the water, the
meadow and the three rooms — the two houses and the loft), `maps_wild.js` (the wood, the setra, the vidda,
the mine, the fjord) and `maps.js`, which joins the two halves and hangs
every seam between them off one declaration. `index.js` holds all engine and game logic:
state, input, drawing, audio, save/load. When adding content, it goes in
`data.js`; when adding behavior, it goes in `index.js`. Don't let either drift
into the other.

The detailed doctrine for every sibling file lives in one of three rule
files, loaded automatically when you touch the paths they declare:
`.claude/rules/bekkedal-art.md` (rendering/art), `.claude/rules/bekkedal-content.md`
(quests/seasons/crafting/Act II content), `.claude/rules/bekkedal-engine.md`
(index.js-level engine concerns). Full geometry ("Canvas, camera and tile
coordinates") lives in `bekkedal-art.md`.

## File map

- `maps_valley.js` — the four places on the valley floor, and the three rooms
  (the two houses and the loft on the town square). Rows only.
- `maps_wild.js` — the five places past it. Rows only.
- `maps.js` — the seam table (`SEAMS`), the one loop that turns it into both sides' `exits`, and `BEK_WORLD`: where every
  map stands relative to the farm, **derived from the seams** rather than kept as a second list, with every disagreement
  between two routes to the same map recorded in `conflicts` (a loop that cannot exist on a plane). `world_check.js` fails on
  any. The valley used to have two: the forest west of the farm *and* north of the town, the meadow south of both at once.
  Now: the farm, then the square east of it, then the water east of that; the wood north of the square, and the track up to
  the setra, the vidda and the mine beyond it; the meadow south of the farm and the square, which share its north edge.
- `font.js` — bitmap glyph table and metrics. See `.claude/rules/bekkedal-art.md`.
- `text.js` — glyph atlas / text layout helpers. See `.claude/rules/bekkedal-art.md`.
- `layout.js` — panel rectangles, padding, column offsets. See `.claude/rules/bekkedal-art.md`.
- `noise.js` — terrain variation field, and the one seeded stream in it
  (`mineSalt`, for a generated mine floor). See `.claude/rules/bekkedal-art.md`.
- `noise_recipes.js` — the recipe tables `noise.js`'s `channels()` walks: every
  declared stream and where it sits in the channel space. Split off `noise.js`
  for the 300-line rule the way `palette_marks.js` is off `palette.js`; the
  dependency runs one way, so ask `noise.js` for a value and never touch these
  directly. See `.claude/rules/bekkedal-art.md`.
- `mine.js` — the descent: the four depth bands, a floor's layout, its ore mix
  and its shafts, generated per run. See **The descent**,
  `.claude/rules/bekkedal-content.md`.
- `mine_carve.js` — what `mine.js` cuts rock with: chambers, drifts, the flood
  fill, the repair pass, and the dead-end stub every shaft sits at. A sibling
  of `mine.js` for the 300-line rule, the way `decor_wild.js` is one of
  `decor.js`.
- `mine_ore.js` — the other sibling: which faces of the rock carry ore (and
  which metal), and which squares carry what the old crew left. Imports
  nothing back from `mine.js`, which is why it is *handed* a floor's map id
  rather than asking for one.
- `palette.js` — the sixty-four colours, the luminance ordering they are stated in, and `rampStep`. See `.claude/rules/bekkedal-art.md`.
- `palette_marks.js` — the `MARKS`/`SHADOWS`/`FEATURES` contrast tables: what may be drawn on what. Split off `palette.js` for the 300-line rule; the dependency runs one way, so import a colour from `palette.js` and a table from here. See `.claude/rules/bekkedal-art.md`.
- `light.js` — hour-of-day palette transform, the lamp state a pool resolves toward, and the falloff. See `.claude/rules/bekkedal-art.md`.
- `lamp.js` — the local-light pass: four hard bands between the picture at this hour and the picture in daylight (no dither). `lamp_bands.js` is its constants, `lampState`, `relightCoef` and the band states. See **Banded light**, `.claude/rules/bekkedal-art.md`.
- `surface.js` — glyph-to-palette-entry table per map. See `.claude/rules/bekkedal-art.md`.
- `building.js` — the elevation of a house, authored once as a profile of a
  tile's vertical position inside its own building: the wall and its courses,
  the plinth, the windows, the door and the gable corners. See **The facade**,
  `.claude/rules/bekkedal-art.md`.
- `roof.js` — the other half of that profile, ridge to eave, plus the chimney
  and the one live thing a building has: its smoke. See **The facade**.
- `autotile.js` — neighbour masks and rounded-union signed distance. See `.claude/rules/bekkedal-art.md`.
- `shore.js` — shoreline profile, surf, bank. See `.claude/rules/bekkedal-art.md`.
- `water.js` — deep water and its depth ramp. See `.claude/rules/bekkedal-art.md`.
- `rock.js` — the mountain and the ore (`oreKind`). See `.claude/rules/bekkedal-art.md`.
- `interior.js` — the inside of a room: the legacy aperiodic boards, volume and wear (the loft keeps them), and the switch to a made room. See `.claude/rules/bekkedal-art.md`.
- `rooms.js` — `BEK_ROOMS`: how each made room is dressed (the shack, the first house, and the house by the water). A room is rectangles of zone, each with a floor, a paper and a rug colourway, and a list of its windows. A map with no entry (the loft) keeps the old look.
- `interior_floors.js` — what a made room is made of, and all of it *periodic* (so it visibly repeats): five floors (plank, parquet, tile, flag, wash), four papers (stripe, tiled, panel, white) as a face or a cap, a patterned rug, a window with curtains, the door from inside.
- `decor_home.js`, `decor_home2.js` — the furniture of a made room, drawn whole: beds, wardrobes, dressers, bookcases, sofas, armchairs, chairs, tables, a kitchen run, a hearth and its breast, clocks, mirrors, plants, lamps. A piece bigger than a square is drawn from its top-left square (`FOOT` in `decor.js` says how many it covers), and the squares under it carry a solid glyph in the map. Merged into the one `PROP` table.
- `furniture_act.js` — what you can do with a house (`FURN`): browse a bookcase, read a clock, look out of a window (or from the piece under it), water a plant, make tea (+6 energy, once a day, like the ash); each answers in a dialogue box with the thing's name on it (`objectBox`). Pure but for the few save fields it names. `hint.js` reads its lines.
- `facades.js`, `facade_parts.js` — which house is which on the outside: eight walls, five roofs, three chimneys, five doors, four shutters, flower boxes, lanterns, three window styles, and `FACADES`, the list of every building by its top-left square. A map's building with no entry wears what the map always wore. See **The facade**.
- `rooms_check.js` — `node apps/bekkedal/rooms_check.js`. Every floor square is named; every piece stands on the solid squares it covers and nothing is an invisible block; wall items hang on walls with floor in front; windows are in outer walls; every pattern repeats (the same tile every six squares); everything that answers answers.
- `forest.js` — the treeline as a continuous strip. See `.claude/rules/bekkedal-art.md`.
- `fx.js` — the tool swing and its particles. See `.claude/rules/bekkedal-art.md`.
- `crops.js` — the ploughed plot; the one live (uncached) tile. See `.claude/rules/bekkedal-art.md`.
- `actors.js` — people, animals, item icons. See `.claude/rules/bekkedal-art.md`.
- `portrait.js` — the eight faces. One head-and-shoulders rig with parameters
  per character out of `BEK_NPCS[].face`, three expressions each. See **The
  faces**, `.claude/rules/bekkedal-art.md`.
- `menus.js` — every panel drawn over the picture. See `.claude/rules/bekkedal-art.md`.
- `menus_talk.js` — the two panels a *conversation* puts up: the dialogue box
  with its portrait column and name plate, and the buy prompt that comes out
  of one of its lines. A sibling of `menus.js` for the 300-line rule, the same
  way `decor_outdoor.js` is one of `decor.js`. See **The faces**.
- `menus_chrome.js` — the materials the rest of `menus.js`'s panels are drawn
  out of instead of `panel()`'s flat black rectangle: planed timber and
  pinned paper for the board, cloth and leather for the bag, a counter and
  its slate for the shop, bare planks for the workshop, a routed sign for
  travel, a quiet dark card for sleep, shelving for the loft. See
  `.claude/rules/bekkedal-art.md`.
- `menus_spine.js` — the loft's own two panels: the shelves, and the second
  ending. A third sibling of `menus.js` for the same 300-line reason. See
  **The loft**, `.claude/rules/bekkedal-content.md`.
- `spine.js` — the long spine, as questions rather than as state: whether the
  loft is open, what is in it, which wings are finished, which milestones are
  owed and what each one pays out. Pure, the way `schedule.js` and `scene.js`
  are; `spineDonate()` in `index.js` is the one writer in the app. See **The
  loft**, `.claude/rules/bekkedal-content.md`.
- `score.js` — the five tunes (dag, kveld, gruva, vidda, folkedans), eight bars each, orchestrated for the studio's real instruments (flute, violin, nylon guitar, harp, strings, cello, upright bass...); `lead` and `arp` layers are what the two night tunes drop after dark. A second fiddle is a voice a number of *scale steps* away in the tune's own key (`inKey`), never a fixed number of semitones, which is a third only half the time.
- `music.js` — which pool, and what the dark does to a tune. The choosing itself is the shared `apps/director.js`: a tune is heard through twice (`MIN_LOOPS`), the next in the pool follows on the downbeat after its last bar (`deck.segue`), the next is the *next*, not a dice roll, and a change of place takes a bar-aligned crossfade unless the pass is nearly over. It plays on Bekkedal's channel of the studio through `Studio.deck` (`kernel/deck.js`). See `.claude/rules/bekkedal-art.md`.
- `music_check.js` — `node apps/bekkedal/music_check.js`. The director against a pretend studio whose deck counts bars the way the real one does: where the first tune is drawn from, how long a tune lasts, that the change is arranged once and lands at the end of the pass, the order, a change of place, the night as a layer.
- `greet.js` — what somebody says before they say anything else: hello the first time you speak on a given day, hello *again* after that, and a remark (and a longer one the longer it has been) after four, nine and sixteen days. Pure, the way `schedule.js` is: a hash of the day, the speaker and how often you have spoken, never a random number, so a reload says the same thing. `talkTo()` calls it and stamps `S.lastTalk`. See **Greetings**, `.claude/rules/bekkedal-content.md`.
- `talk_greet_a.js`, `talk_greet_b.js` — `BEK_GREET`, four characters per file. Content only, in the first person, to the player.
- `greet_check.js` — `node apps/bekkedal/greet_check.js`. The greetings over a long simulated acquaintance.
- `ambience.js` — a bed per map, weather and the hour layered over it, positional hearth crackle, and material footsteps. See `.claude/rules/bekkedal-art.md`.
- `decor.js` — room prop kinds; authored placement lives in `data.js`'s `BEK_DECOR`. See `.claude/rules/bekkedal-art.md`.
- `decor_outdoor.js` — the farm/town/lake prop kinds, split out of `decor.js` purely for the 300-line rule and merged back into one `PROP` table there. See `.claude/rules/bekkedal-art.md`.
- `decor_wild.js` — the forest/vidda/setra/enga/fjord/gruva prop kinds, a second sibling for the same 300-line reason, merged into the same `PROP` table. See **Density**, `.claude/rules/bekkedal-art.md`.
- `decor_place.js` — FURNISHING: the player-placeable kinds (chairs, tables,
  rugs, beds, shelves, a dresser, plus the outdoor fence/gate/path/planter/
  bench/scarecrow/sign), a third sibling of `decor.js` for the same 300-line
  reason, merged into the same `PROP` table. Where one of these stands is
  never authored — it lives in `S.placed` (`index.js`), not `BEK_DECOR`.
  `gjerde`/`sti` are neighbour-aware, drawn with an `autotile.js` cardinal
  mask instead of the usual hash variation; `stol`/`benk` read `BEK_PLACE_ROT`
  (`data.js`) for a manual two-way rotation instead. See its own header.
- `placement.js` — whether a placement is allowed: pure functions of a map
  definition, what is already placed, and a candidate tile — `canPlace()`
  and the connectivity flood fill (`connectivityOK()`) behind the hard rule
  that a placement must never trap the player. No canvas, no `S`, exercised
  directly by `layout_check.js`. `PLACE_BLOCKS` (`decor.js`) names the only
  two kinds (`gjerde`, `grind`) this ever treats as a barrier.
- `wear.js` — the paths worn between the places people actually walk (door to field, road, pier, well), derived from a map's own landmark glyphs the same way `interior.js`'s `traceWear()` derives indoor wear. See `.claude/rules/bekkedal-art.md`.
- `quests.js` — the repeatable quest board. See `.claude/rules/bekkedal-content.md`.
- `seasons.js` — the seasonal layer (season/day-of-season/festival/weather). See `.claude/rules/bekkedal-content.md`.
- `schedule.js` — where everybody is: two to four named posts per NPC, and
  which one the clock (plus weather, season, a festival day, a story flag)
  currently puts them at. See `.claude/rules/bekkedal-content.md`.
- `life.js`, `life_data.js` — what people do between their posts. **They keep hours and do chores**: through the working day each goes to a *station* near their
  post (a doorstep to sweep, a well, a bench, a wall to mend, the water) for a ninety-minute slot and comes back; they sleep (`BED`: indoors and not to be found, so
  nobody is on the road at three in the morning); some of them (never the shopkeepers) are away on an errand for a few hours on some days. Every choice is a hash of the day, the person
  and the slot, never a random number. `life_check.js` walks all of it (every station is standable and reachable on foot, nobody jumps, a festival still gathers all eight).
- `walkers.js` — real-time walkers (breadth-first on the map's own walkability) for a scene's cast. **Nothing teleports**: a heart event no longer sets the player's square.
  The lead calls out (a bubble, `CALLS` in `life_data.js`) if they are more than five tiles off, runs to the square beside the player, the box opens where the player stands,
  and the cast walks home or away afterwards. `scripts/smoke.mjs` asserts the player's square did not move and the box opened.
- `looks.js`, `actors_look.js` — what a gift looks like once it is somebody's (`S.look`, save v21): a sweater and a scarf are worn, a cup, a bouquet, a basket of berries are held while
  they rest, the item the hands already carry at a chore is theirs if they were given it. `LOOKS` in `life_data.js` is the table.
- `hint.js` — what SPACE would do at the square in front of you, as the one line the HUD shows (`hintFor`, pure, the rules of `act()` read as questions), and the bag's footer saying how to
  hold a gift out and what happens next (`GIFT_HELP`). Before this nothing said that SPACE from the bag held the gift out, and the only sign was a line at the bottom of the screen.
- `scene.js` — the heart-event runner: whether one fires here and now, which
  beat is showing, where its cast stands, and what the world gets back when
  it ends. Pure, the way `schedule.js` is. See **Arcs and heart events**,
  `.claude/rules/bekkedal-content.md`.
- `talk_town.js`, `talk_water.js`, `talk_field.js`, `talk_stone.js` —
  `BEK_TALK`, two characters per file. Content only.
- `scenes_valley.js`, `scenes_wild.js` — `BEK_SCENES`, the twenty-four heart
  events. Content only.
- `progression.js` — money-sink formulas (`houseCost`, `houseTierCost`, `houseTierAvailable`, `barnSlots`). See `.claude/rules/bekkedal-content.md`.
- `layout_check.js` — `node apps/bekkedal/layout_check.js`. Also the dialogue
  box's two columns. See `.claude/rules/bekkedal-art.md`.
- `tile_check.js` — `node apps/bekkedal/tile_check.js`. See `.claude/rules/bekkedal-art.md`.
- `palette_check.js` — `node apps/bekkedal/palette_check.js`. See `.claude/rules/bekkedal-art.md`.
- `quest_check.js` — `node apps/bekkedal/quest_check.js`. See `.claude/rules/bekkedal-content.md`.
- `mine_check.js` — `node apps/bekkedal/mine_check.js`. Four hundred generated
  floors, walked. See `.claude/rules/bekkedal-content.md`.
- `mine_check_ore.js` — its last two families (the ore, and viability), split
  the same way and for the same reason `mine_ore.js` is. Still one command.
- `season_check.js` — `node apps/bekkedal/season_check.js`. See `.claude/rules/bekkedal-content.md`.
- `act2_check.js` — `node apps/bekkedal/act2_check.js`. See `.claude/rules/bekkedal-content.md`.
- `act2_check_walk.js` — the valley as *distances*, for the balance pass:
  breadth-first over squares and seams, and a nearest-neighbour tour per
  resource, at the measured 0.56 in-game minutes a tile. Nothing authored —
  every figure comes off `BEK_MAPS`' own rows and `maps.js`'s own seams.
- `act2_check_rates.js` — what an hour of each of the five livelihoods is
  worth, in kr per point of energy *and* kr per in-game minute, at three
  stages of the game. Reads prices, tool costs, crop timings, the ore mix,
  the fish pools and the forage table; writes down nothing.
- `act2_check_sim.js` — four players, four whole runs, arrival to the loft's
  ending. A day is two budgets (the bar and the 06:00-to-02:00 clock), the
  round walked until one of them runs out. The purchase ladder is collected
  out of `BEK_TALK`'s own `buy` offers plus `progression.js`, never listed.
- `act2_check_ladder.js` — the two things a run is aiming at, split off
  `act2_check_sim.js` for the same 300-line reason: the purchase ladder
  (collected out of `BEK_TALK`'s own `buy` offers and `progression.js`, so
  the lifetime figure is derived rather than tallied), and the loft's
  sixty-four entries asked "could *this run* have got it by today".
- `act2_check_balance.js` — the targets, asserted. See **The economy**,
  `.claude/rules/bekkedal-content.md`.
- `spine_check.js` — `node apps/bekkedal/spine_check.js`. The loft: its
  shape, that everything it asks for can actually be got, that no milestone
  is unreachable, that it completes, and how many in-game days it takes. See
  `.claude/rules/bekkedal-content.md`.
- `spine_check_time.js` — its last family, split the same way and for the
  same reason `mine_check_ore.js` is. Still one command.
- `chop.js`, `sleep.js`, `fog.js`, `typer.js`, `hellos.js`, `trips.js`, `asks.js`, `ask_astrid.js` … `ask_lars.js` — the last pass, all pure: the felling rhythm, the night and what staying up costs, drifting mist, the typed line (and `[action]` masks), a word as you pass, walking between maps, and the topics you can bring up and what is remembered (`S.mem`, save version 22). Each has a `*_check.js` beside it (`asks_check.js` for the ask files). See the root `CLAUDE.md`, "Nights, trees, doors and talk".
- `world_check.js` — `node apps/bekkedal/world_check.js`. The valley as one walkable thing: seams, flood fills, and everything placed by coordinate.

## Hard invariants

- Colour only via `C(RAMP[i])` — "Never a literal `rgb()`/hex string in a
  draw call, and never a bare index either: the art says `C(GRASS[2])`, not
  `C(21)`." Art that is handed a colour rather than naming one shades it with
  `rampStep` (`palette.js`), which returns the surface's own ramp neighbour
  and is therefore inside the band by construction. (full doctrine:
  **Palette**, `.claude/rules/bekkedal-art.md`)
- No alpha, ever: "There is no alpha compositing anywhere in this app and
  there must not be — no `globalAlpha`, no `rgba()`, no `ctx.filter`. A
  blend you cannot express as a stipple is a blend you may not use." (full
  doctrine: **No alpha, still**, `.claude/rules/bekkedal-art.md`)
- Every blend is an ordered dither via `dither()`/`ditherPat()`; every fill
  is an axis-aligned `fillRect` on integer coordinates. The one exception to the
  stipple is the local light (`lamp.js`), which is **not a dither at all any more**:
  it is four hard-edged bands of whole colours (see **Banded light**). It is still whole pixels of
  one of the palette's colours, with no alpha anywhere but the mask a live pool is cut out with.
- `data.js` is content, `index.js` is behaviour (see File split above).
- Files stay under 300 lines (repo-wide rule, see root `CLAUDE.md`).

## Save versioning

The save key is `BEK_SAVE` (`data.js`). The in-save schema version is the `ver`
field written by `fresh()` in `index.js` — currently **22**: `S.mem`, what you have said to whom (`'<person>.<topic>'` to a short word, never rewound, backfilled to `{}` by `heal()`), is the one new field. Version 21 before it was what people wear and hold; its one new field was `S.look` (NPC id to what a gift has made them wear or hold, and since when), backfilled to `{}` by `heal()` and never rewound; version 20 before it was the greetings, whose one new field was `S.lastTalk`: NPC id to the day number you last spoke to them,
which is all `greet.js` needs to say hello, hello again, or "where have you been". It is
stamped by `talkTo()` and backfilled to `{}` by `heal()`; a save from before it has never
"spoken" to anybody, so nobody remarks on an absence they cannot date, and everybody's
first words after the update are their own first words. Version 19 before it was the rebalance.
Its one new field was `S.enRescaled`, the marker over `heal()`'s one-shot
stamina raise: `BEK_EN_MAX` went from 120 to 220 and every price, tool cost
and shop price moved with it, so a save still carrying the old bar is not a
save of the old game but an unwinnable version of the new one. Raised by the
delta rather than clamped to the new base, so a run that had already earned
stamina keeps what it earned on top, and gated on its own marker for exactly
the reason the friendship rescale is — `heal()` never rewinds `ver` on an
existing save. Version 18 before it added
`S.placed`, FURNISHING's only field: every object a player has placed by
hand, keyed by `rkey(map, x, y)` exactly like `S.mined`/`S.felled`, each a
`{ kind, item, rot }` (the `decor.js`/`decor_place.js` drawing, the
`BEK_ITEMS` id handed back on pick-up, and 0/1 for the handful of kinds that
read a facing). Authored decor (`BEK_DECOR`) never touches this table and a
save from before it existed starts with an honest empty one — see
**FURNISHING** in the file map above and `placement.js`'s own header for the
validity rule (a placement is refused outright rather than saved and healed
around if it would trap the player, so `heal()`'s own backfill only ever
has to drop a malformed entry — an unknown kind, or a map that no longer
exists, the way a mid-run mine floor's own coordinates can). Version 17
before it added `S.spine`, the long spine's only field: `{ d, m, first, done }`, where `d` is
entry id to the day it was given and `m` is which milestones have already
handed over a *number*. Everything else about the loft — whether it is open,
which stage the building is at, which wings are finished, and all six payouts
that are not numbers — is derived from that table by `spine.js` and stored
nowhere, which is what stops a payout drifting from the donations that earned
it. Version 16 before it added
`S.cropGrade` (a crop item id's running quality average, 0..2 — see
**Farming depth** below) and `S.presv` (the keg/jar table, keyed like
`S.soil`), and extended every `S.soil` plot's own record with `fert`/`tend`.
Version 15 added `S.legend` (one legendary fish per water per year). Version
14 added `S.run` (the descent you are currently in, or null) and
`S.deepest` (the deepest floor ever reached, which is what the hoist at the
mouth offers you).

`S.run` is worth reading the shape of before you change anything near it. It is
`{ seed, floor, dug }` and **the rows of a floor are never in it**: a floor is
carved again from `(seed, floor)` on every load, which is only safe because
`mine_check.js` asserts that carve is deterministic across processes. `dug` is
keyed exactly the way `S.mined` is and is a separate table on purpose — a gruva
vein regrows against `S.day`, and a floor of the descent is consumed for the
run and replaced by the next one, so there is nothing a day counter could mean
down there. Keeping them apart is also what lets `healCoords()` go on asserting
that every key in `S.mined` names an authored map. A run does not survive a
night (`newDay()` drops it), and a mid-run save either resumes on the same
floor or resets cleanly to the mouth of the mine — `healCoords()` has no third
outcome.

Version 13 before it added `S.yst`/`S.xpDay` (what the player did yesterday,
and the mark today is measured from) for the chat lines gated on it. A heart event adds no field of
its own: it is one-shot through `S.seen['sc:' + id]`, and its run object is
transient and must never be serialised. `heal()` in `index.js` is the
migration function: it runs on every load and after `Object.assign(fresh(), ...)`
to backfill any field a stale save is missing. Any change to the shape of `S`
(new top-level field, new nested object, renamed key) must bump `ver` and add
a corresponding backfill line to `heal()` — a save from before the change must
still load without throwing.

## Checks

Run all seventeen before claiming anything is done:

- `node apps/bekkedal/tile_check.js` — terrain variation field is
  deterministic, uniform and aperiodic. Full paragraph: `.claude/rules/bekkedal-art.md`.
- `node apps/bekkedal/layout_check.js` — geometry, camera clamp, text
  fitting in both languages. Full paragraph: `.claude/rules/bekkedal-art.md`.
- `node apps/bekkedal/palette_check.js` — ramps, contrast bands, and that
  the darkest hour still separates walkable from solid. Full paragraph:
  `.claude/rules/bekkedal-art.md`.
- `node apps/bekkedal/quest_check.js` — the repeatable board's templates
  agree with what the engine actually requires. Full paragraph:
  `.claude/rules/bekkedal-content.md`.
- `node apps/bekkedal/season_check.js` — 4 simulated years of the seasonal
  layer. Full paragraph: `.claude/rules/bekkedal-content.md`.
- `node apps/bekkedal/schedule_check.js` — a simulated year of every NPC's
  schedule: every post is a real, standable tile; each NPC's default posts
  cover the full day with no gap and no overlap; across a year, every hour,
  every weather and both story-flag states, nobody resolves to a solid tile
  and no two NPCs ever share one; every shopkeeper stays on their own map
  through their stated hours; every festival day gathers all eight on the
  festival's own map at eight distinct tiles; and no heart event is ever
  played over somebody merely keeping their own hours. Full paragraph:
  `.claude/rules/bekkedal-content.md`.
- `node apps/bekkedal/act2_check.js` — every Act II surface, a sweep of all
  ~190 chat gates across every weather, season, hour and festival state
  (none throws, and no NPC is ever left with nothing to say), and **the
  balance pass**: the five livelihoods held to 1.5x of each other per point
  of energy at three stages of the game, and four whole runs — farm-, mine-
  and fish-focused and mixed — from arrival to the loft's ending, asserting
  Act I inside 20-25 days, Act II at four more seasons, six to ten real
  hours to the end, no policy dramatically ahead at any milestone, and never
  a morning with money and nothing to want. Full paragraph and the measured
  figures: **The economy**, `.claude/rules/bekkedal-content.md`.
- `node apps/bekkedal/mine_check.js` — four hundred generated mine floors
  (sixteen seeds × floors 1-25), walked: the same seed gives the same floor in
  a second process, every floor is rectangular and no smaller than one screen
  and made of nothing but the six glyphs the gruva already draws, every
  walkable square is reachable from the one you arrive on, every shaft is a
  real dead end that lands somewhere you can stand on the floor it names, every
  floor carries a viable count of veins with none sealed in rock and none on a
  shaft, the ore mix shifts toward silver band by band, the crystal is only
  found below its floor, and nothing is empty or unwinnable. Full paragraph:
  `.claude/rules/bekkedal-content.md`. **This is the check a change to the
  generator is most likely to break, and the only one that can see it at all.**
- `node apps/bekkedal/spine_check.js` — the loft (the long spine): its ids,
  plinths and displays; that every one of the sixty-four things it asks for
  has a real source in the valley and every condition reads a counter the
  engine raises; that all ten milestones fire exactly once at the count their
  own table declares; that nothing is open before Act II and Astrid and that
  the whole thing completes; and how many in-game days a lucky run needs,
  measured against the four-season target. Full paragraph:
  `.claude/rules/bekkedal-content.md`. **It has already found two bugs older
  than the loft: a legendary fish whose window the clock could not reach, and
  `planke`, which had a price and two recipes wanting it and no source
  anywhere.**
- `node apps/bekkedal/world_check.js` — the valley joins up: every seam is
  paired tile for tile and gated only on the way in, every map is one
  walkable piece, every place is reached from the farm without the travel
  menu, and nobody and nothing placed by coordinate — the eight who talk,
  the goats, the room props, the pens, the field expansions, the finished
  house, every heart event's cast and the square it stands the player on, the
  menu's own landing squares — stands in a wall or on the water.
  This is the check that a map edit is most likely to break.
- `node apps/bekkedal/rooms_check.js` — the two houses as made rooms: every floor square is a named zone, every piece of furniture is a prop on the solid squares it covers (a piece with no glyph is a thing you walk through, a glyph with no piece is an invisible block), everything on a wall hangs on one, every window is in an outer wall, the patterns *repeat* (a floor is the same tile every six squares, a rug's diamond is the same on every square), and every piece that answers says something in both languages. Full paragraph: `.claude/rules/bekkedal-art.md`.
- `node apps/bekkedal/greet_check.js` — the greetings: every NPC has every pool, no line names its
  own speaker, the first time on a day is a hello most of the time and not always, the second a
  hello again, four days away is always remarked on and longer says more, a stranger says
  nothing before their own first words, and the answer is a function of the save.
- `node apps/bekkedal/life_check.js` — what people do between their posts: every station a chore sends somebody to is a real tile they can reach on foot from their post,
  sleep is indoors and not on any map, errands are never a shopkeeper's and always end at the post they left, nobody jumps between two squares in a step (except the festival
  walk, which `schedule.js` caps itself), the same day and person give the same answer, and a gift is shown worn or held as `LOOKS` says.
- `node apps/bekkedal/hint_check.js` — the hint line: a line for everything SPACE does (a person by name, a gift by what it is, a locked door, a plot at each stage, a tool only where it has a use), none for what it does nothing with, and both languages in capitals everywhere.
- `node apps/bekkedal/music_check.js` — the director: where the first tune is drawn from, that
  a tune is heard through before another follows it, that a change is arranged once and lands at the
  end of the pass, that the order is an order, and what a change of place and the dark do.
- `node scripts/smoke.mjs` — headless 30-day run, save migration, a full
  simulated year run idle, a heart event played end to end through the
  real frame loop from a save seeded at friendship 4, a descent walked, and
  the loft opened, given to and finished — the only place the two panels in
  `menus_spine.js` are ever actually drawn. Full paragraph:
  `.claude/rules/bekkedal-engine.md`.
- `node scripts/lint-content.mjs` — the static content conventions: real item
  ids, sane friendship gates, real travel destinations, and — since the
  dialogue box grew a name plate — that no spoken line repeats the speaker's
  name and that every mood a line asks for is a face `portrait.js` has. Full
  paragraph: `.claude/rules/content.md`.

Also see `node scripts/bekkedal_playtest.mjs` (the valley walked and Act I
played through the real frame loop, with no debug hook — where the 0.56
minutes a tile and the real minutes a day come from),
`node scripts/bekkedal_shots.mjs <dir>` (the screenshot matrix),
`node scripts/bekkedal_pairs.mjs <before> <after> <out>` (before/after
composites), and `node scripts/bekkedal_savetest.mjs` (played-not-read save
compatibility) — full paragraphs in `.claude/rules/bekkedal-engine.md`.
