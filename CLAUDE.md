# TempleOS Module System

## It is a desktop app (Electron)
The machine ships as a Windows installer and a Debian package; there is no web build and no server.
`index.html`, `kernel/` and `apps/` are the app and are loaded as-is — an app is still a plain ES module
and never touches Electron. `electron/` is only the shell that hosts them:
- `electron/resolve.js` / `protocol.js` — the app loads from `templeos://app/` and serves only `index.html`,
  `kernel/`, `apps/`, `assets/`, `vendor/`. A new top-level folder the app needs must be added to `SERVED`.
- `electron/main.js` — sandboxed window, no Node in the renderer, strict CSP, no outbound network, zoom
  locked at 100%, remembers window size, single instance. `electron/preload.cjs` exposes only `version` and `quit`.
- **Never change** the scheme/host (`resolve.js`), `app.setName`/the `userData` folder (`main.js`), or
  `appId`/`productName` (`electron-builder.yml`). Every save lives under them; changing one orphans all saves.
- The VT323 font is bundled in `vendor/fonts/` (`kernel/fonts.css`). Never add a remote URL: a request that
  leaves the machine fails `check:shell`.

### Commands
```
npm install
npm start               # run it from source
npm run pack            # unpacked app in dist/;  npm run dist  -> installer for this OS (win: .exe, linux: .deb)
```
Checks (Linux: prefix the GUI ones with `xvfb-run -a -s "-screen 0 1920x1080x24"`; add
`HOLYTRON_EXE=<path to the built binary>` to run the same checks against the packaged app):
```
npm run check:paths     # every import/asset path matches its file's exact case (Windows ignores case, Debian does not)
npm run check:shell     # origin, sandbox, CSP, no outbound traffic, VFS seed, relaunch
npm run check:persist   # a Bekkedal save survives quit + relaunch; power-cut loss window
npm run check:apps      # all apps open/close cleanly; fails only on leaks NOT in scripts/check-apps.known.json
npm run check:listeners # cleanup must not cost behaviour: an open window's listeners still work (crayon draws, folder redraws)
npm run check:perf      # frame rate and Bekkedal's day clock
npm run check:package   # after `npm run pack`: every file the app loads is packaged, no scaffolding is
node scripts/smoke.mjs  # ~10 min; node scripts/lint-content.mjs; node apps/*/*_check.js (pure Node)
```
Pixel comparison between two builds: `scripts/bekkedal_shots.mjs` twice per build, then `scripts/pngdiff.mjs`.
An app that opens its own window (`open()`) is never sent `unmount()`: add its window/document listeners with
`scopedListeners(el).on(window, type, fn)` from `apps/lifecycle.js`, which removes them when the window closes.
`apps/standbattle/fairness_check.js` is imported at runtime — do not treat `*_check*.js` as dev-only in packaging.
CI (`.github/workflows/build.yml`) builds and tests both installers. Record of the move: `docs/electron-migration-plan.md`.

## The machine's own behaviour (kernel)
- **Boot.** `kernel/boot.js` decides, `kernel/bootseq.js` performs. A launch after **eight hours** away (a 5 min
  heartbeat in IndexedDB `templeos_meta`, not the launch time) gets the *long boot*: ten seconds, unskippable — seven of a
  PC in trouble (dying fan, bad block, drive timeout, a progress bar that goes backwards, a freeze, the song coming
  through a wall), then three of crawling text. **The text is `kernel/boot_text.js`: edit that file, nothing else.**
  Every other power-on is the quick boot. Both end on `PRESS [~] TO ENTER` and only `~` (`` ` ``/Backquote) enters:
  clicks and every other key are ignored. The `#bootcursor` element appears when it is ready (the checks wait for it).
  A long boot that is interrupted (power cut mid-way) is owed again.
- **Lobby music.** The boot always plays the hymn, whatever the LOBBY switch says; on the desktop the switch and MUS
  govern it. `kernel/music_variants.js` builds four moods of the *same notes* (HYMN, MELLOW, DYNAMIC, GLITCH) as
  plain specs; the lobby plays them live (`kernel/music.js`) and TheStack presses the same specs as discs. The listener
  picks the variant in the mixer panel (♫).
- **Mixer.** `kernel/mixer.js` lists only what is running: a channel is offered while a window with its `appId` is open
  (`openWins` carries `appId`; `wm.js` fires `wins-changed`). A new app with music: add a channel to `CHANNELS`, multiply
  its bus by `window.Mixer.get('<id>')`, and listen for `mixer-changed`.
- **Fullscreen.** Every window has `[□]` (also F11 or a double-click on the title bar). A window whose app lays itself
  out off its own size sets `fluid: true` (or `body.dataset.fluid = '1'`) and is simply given the room; any other window
  with a canvas is kept at its built size and scaled to fit; plain DOM windows just fill the desktop.
- **Drunk.** `kernel/drunk.js` (the bottle app) acts on `#tube` through an inline filter/transform. Never give `#tube` a
  fill-forwards animation: an animated value beats an inline style, which is what silently killed this effect before.

- **Durable storage.** `index.html` loads `kernel/durable.js`, which mirrors every `localStorage` write into IndexedDB
  (`templeos_ls`) and restores it before `kernel/boot.js` loads. Chromium's own localStorage flush can lag by more than
  ten seconds, so without it a power cut loses recent saves; `check:persist` measures exactly that.

- **Files are real.** `kernel/vfs.js` is the key-value store; `kernel/vfs_ops.js` hangs `move`, `copy`, `rename`, `mkdir`,
  `trash`, `trashList`, `trashRestore`, `trashPurge`, `trashEmpty`, `restoreSystem` and `isSystem` on the same `fs` object (apps get
  them as `ctx.fs.*`) and announces every change with a `vfs-changed` event, which the desktop and every folder window obey.
  **Delete never destroys:** it moves the thing to `::/.Trash/<id>/` (the RecycleBin icon / `apps/trash`). Names that start with
  a dot (`.keep`, `.Trash`) are hidden from `list()` unless asked for. `restoreSystem()` writes back only the entries of
  `assets/seed.json` that are missing (pulling a deleted one out of the bin, leaving moved/renamed/edited ones alone, never
  resetting the desktop): it is in the desktop menu, File, Help and the terminal (`RESTORE`). `SEED_VERSION` in `vfs.js` must be
  bumped whenever `seed.json` gains an entry, or existing installs never see it.
- **Dragging files** is `kernel/dnd.js` (pointer events, one mechanism for every source). A drop zone is any element with
  `data-drop`: a folder path, `::` (the desktop) or `@trash`. Desktop icons, folder windows and the bin all use it; Ctrl at the
  drop copies, Esc cancels. The shared commands (copy/cut/paste/duplicate/rename/delete/undo/properties/keys) are
  `kernel/fileops.js`, the menus `kernel/filemenus.js`; `Active` in `fileops.js` says which list of files owns Delete/F2/Ctrl+C:
  the desktop or one folder window (set `win._fileEnv`), and none for any other window. The menu bar is `kernel/menubar.js`.
- **Right-click.** `kernel/ctxguard.js` suppresses the browser menu everywhere and gives text fields a cut/copy/paste menu; the
  desktop menu opens only on the bare desktop (never from inside a window); `wm.js` keeps the right mouse button away from any
  app that does not declare `rightClick: true` (Sweeper does). The `contextmenu` event itself is never blocked, so an app can
  still draw its own menu.
- **Zoom.** Every window has `[Z]` (and Ctrl +/-/0, Ctrl+wheel): `kernel/zoom.js` applies CSS `zoom` to the window body, so the
  app lays itself out again, and remembers the level per app (`templeos.zoom.v1`). A window that is a fixed canvas scaled to fit
  the screen in fullscreen suspends it. The page's own zoom stays locked (`electron/main.js`).
- **Help** is built in (`kernel/help.js`, pages in `help_text.js`, DolDoc): it is not a file on the VFS, so it cannot be deleted.
- **The Jäger passes out.** `Drunk.drink()` counts measures in the blood (one leaves every 30 s); at ten `kernel/blackout.js`
  takes the whole window (not just the tube) for ~16 s: ten altered scenes (`blackout_a/b.js`, drawn with the sixteen colours,
  bent by `blackout_fx.js`), unskippable, calmer and without the harshest effects under `prefers-reduced-motion`.
- **Real instruments.** `kernel/instruments.js` is a sampler over `assets/instruments/` (30 instruments + a drum kit, samples of the
  MIT-licensed FluidR3_GM soundfont, built by `node scripts/make-instruments.mjs`; held instruments carry seamless loop points).
  `kernel/studio.js` is the mixer and scheduler (per-track volume/pan/room/mute/solo, a master that follows the MUS knob and the
  taskbar mixer's THE GARAGE channel, a limiter): `Studio.play(song)`, `Studio.live()`, `Studio.render(song)` (offline, for WAV
  and for TheStack discs). Apps reach it as `ctx.studio`.

### Writing music (for Claude, and anyone else)
Music is data, not oscillator code. A song is `{ v, title, bpm, key, scale, bars, beats, swing, tracks: [{ id, name, inst, vol, pan,
reverb, mute, solo, notes: [[startBeat, durBeats, midi, vel0..1]], hits: [[startBeat, 'kick', vel]] }] }`, kept as `.SONG` files
(`type: 'song'`) and opened by the Garage. Write it in the text notation of `kernel/songtext.js` (read its header comment):
`buildSong({ title, bpm, key, scale, bars, tracks: [{ name, inst: 'piano', notes: 'C4:q E4 G4:h | C4+E4+G4:w' }, { name, drums: { kick: 'x...x...', snare: '....x...' } }] })`,
with `bassLine`, `chordLine`, `progression` and `accompany` for a band that fits the key. `apps/garage/songs.js` is a worked example
of seven songs. Instrument ids: piano epiano harpsichord organ musicbox marimba xylophone vibes glock steeldrum kalimba nylon
steelgtr eguitar harp pizz bass upright violin cello strings flute clarinet trumpet sax ocarina choir bells timpani woodblock,
and `drums` (kick snare stick clap hat openhat lotom midtom hitom crash ride cowbell tamb shaker). To add a demo song, add it
to `demoSongs()`; it shows up in the Garage's OPEN list and as a disc in TheStack's THE GARAGE folder.

## The App Contract
Every app is a module with a default export shaped exactly like this:

```js
export default {
id: 'terminal', // matches the folder name
title: 'TERMINAL.EXE', // window title bar text
icon: 'assets/images/terminal.png',
width: 640,
height: 480,
resizable: true,

// Called when a window is opened. `root` is an empty <div> inside the window body.
mount(root, ctx) {},

// Called when the window closes. Must remove every timer, interval,
// requestAnimationFrame loop, and listener attached to window/document.
unmount() {}
};
```

## The ctx API
`ctx` is the only channel between an app and the rest of the system. An app must never import from kernel/, never touch document.body or window globals belonging to other apps, and never reach into another app's DOM.

```js
ctx.fs.read(path) // -> Promise<Blob|string|null>
ctx.fs.write(path, data) // -> Promise<void>
ctx.fs.list(dir) // -> Promise<string[]>
ctx.fs.remove(path) // -> Promise<void>
ctx.save(key, value) // -> Promise<void> app-scoped settings/progress
ctx.load(key) // -> Promise<any>
ctx.openWindow(appId, args) // launch another app
ctx.close() // close this app's own window
ctx.setTitle(text) // retitle this window and its taskbar button
ctx.toast(msg) // the bottom-of-screen message
ctx.ask(title, default, cb) // an in-glass name box
ctx.studio // the instruments and the mixer: see "Real instruments"
```
An app module may also say `rightClick: true` (it uses the right mouse button) and `fluid: true` (it lays itself out off its own size).

## CSS Variables from theme.css
Not all extracted yet, but typically `#FFFFFF`, `#AAAAAA`, `#555555`, `#FFFF55` etc. (Standard 16-color CGA/VGA palette).

The machine's base rule is that all colour comes from `VGA16` (`kernel/god.js`) and nothing is antialiased. Two apps are explicit, user-requested exceptions to the colour half of it — `standbattle` and `bekkedal` — and both are described in the Apps list below. Neither is an exception to the no-antialiasing half.

## How to add a new app
1. Create `apps/<id>/index.js` obeying the contract.
2. (Optional) Create `apps/<id>/style.css` if it needs specific styles.
3. Add `<id>` to `kernel/registry.js`.
4. Update this `CLAUDE.md` with the new app description.

## Apps
- `placeholder`: `apps/placeholder/index.js` - A trivial app to test the window manager.
- `bekkedal`: `apps/bekkedal/index.js` - Bekkedal, a Norwegian-valley farming game on a 960×540 canvas drawn entirely with `fillRect` (see `apps/bekkedal/CLAUDE.md`, which is the contract for it). Eleven maps (each as big as its own rows say, floor 24×15, scrolling and clamping on both axes), a day/night clock, tools, crops, fishing, eight NPCs, a house to build, and a second act once it is.
  **A building is an elevation, not a rectangle of roof:** the roof, wall,
  door, windows, gable corners and chimney of every house in the valley are
  authored once, in `apps/bekkedal/building.js` and `roof.js`, as a profile of
  a tile's vertical position inside its own building — so courses run across
  the seam between two wall rows and a window is taller than either of them.
  Chimney smoke is the one part of a building that is not in the terrain cache.
  **The mine is a descent, not a room:** under the gruva's adit is a shaft, and
  under that are numbered floors that are *generated* rather than authored —
  `apps/bekkedal/mine.js`, carved by `mine_carve.js`, seeded per run so a floor
  is stable while you stand on it and different next time. Four depth bands
  move everything at once: the layout from the company's own rectangular
  workings to natural cavity, the ore mix from iron toward silver, the rock
  from seven energy a swing to ten, and the dark down four steps of
  `MINE_LIGHT` (`light.js`). All of it out of parts the game already had — a
  floor is a `BEK_MAPS`-shaped map of the six glyphs the gruva already draws,
  a shaft is an `exits` entry on a dead-end stub exactly like a seam in
  `maps.js`, a ladder is the prop `decor_wild.js` already drew, and **`rock.js`
  is not touched**: the ore mix shifts because the generator picks which faces
  become veins, not because `oreKind` rerolls. Every floor has a ladder up and
  down; only a station (every fifth) has a hoist out, so how far past one you
  dare go is the decision a run turns on — with no fail state under it, just
  the 02:00 clock and the energy bar. Below floor 12 a rich vein can carry
  `krystall`, the one thing with no source on the surface: it sells, Lars and
  Marit love it, and it crafts the lamp that makes the deepest bands
  survivable. `node apps/bekkedal/mine_check.js` walks four hundred generated
  floors — connected, viable, no vein sealed in rock, no shaft you can cross
  in passing.
  **The economy is measured, not felt:** Act I is 20-25 in-game days to the
  house, Act II four more seasons to the loft's ending on day 110, and the
  whole run six to ten real hours — a day being the full 06:00-to-02:00
  clock, five real minutes, now the valley has grown to the size where
  walking out to the work and back with a full sekk is most of what a day is.
  No livelihood pays more than 1.5x another per point of energy at any stage
  (the failure the old pick was: 21 against 17, so a rational first
  playthrough bought a hakke on day one and never farmed again), and about
  169,000 kr of purchases are spread across the arc so there is never a
  morning with money and nothing to want. All of it asserted by
  `act2_check.js`'s balance pass — four players, four whole runs, every number
  read from the real tables, never a hand-copied one — and the day length
  measured off the real frame loop by `scripts/bekkedal_playtest.mjs`. See
  **The economy**, `.claude/rules/bekkedal-content.md`.
  **There is a reason to be here on day thirty:** the long spine is **LOFTET**,
  the old log storehouse shut on the town square since the mine company left,
  which Astrid gives you the key to once the house is finished and she trusts
  you with it. Seven wings and sixty-four things — every crop, every fish
  including the three legends, the ores and two depths of the descent, the
  forage and the flowers, the dairy and the preserves and the cooked dishes,
  friendship 10 with all eight, and one offering at each of the four seasons'
  festivals — declared once in `BEK_LOFT` (`data.js`), answered by pure
  functions in `apps/bekkedal/spine.js`, drawn in `menus_spine.js`, and
  **written by exactly one function**, `spineDonate()`. Everything a wing pays
  out that is not a number (a recipe, an extra forage round, a hoist that goes
  all the way down, a day off every keg, the doubled gift cap, the
  displays that appear in the room and on the square) is derived from the
  donation table at the point of use and stored nowhere. It takes a year
  because the calendar says so rather than because a number was tuned: four
  festival offerings is four distinct seasons, and
  `node apps/bekkedal/spine_check.js` proves that from the table before
  measuring two hundred simulated runs against it (fastest: day 90). Filling it
  restores the building in three visible stages and ends in a second ending
  screen that reads back *this* run's choices — the house ending is untouched
  and stays the Act I close.
  **The valley is walked, not chosen from a menu:** the nine outdoor maps are three to four times the size they were and join along whole runs of their own edges — walk west off the farm and you are in the wood. The seams are declared once each, as pairings, in `apps/bekkedal/maps.js`; the rows themselves are in `maps_valley.js` and `maps_wild.js`. The travel menu survives only for the setra and the vidda, which are up the mountain and have to be climbed on foot before they are ever offered (`BEK_HOME`, `index.js`). `node apps/bekkedal/world_check.js` is what holds all of that together.
  **They have arcs, and three scenes each:** all eight carry a five-beat arc —
  a reticence, a first admission, a difficulty, a turn, a resolution — as
  `nodes` gated on ascending friendship, one thing they want and one thing
  they will not talk about, and around a hundred and ninety chat lines gated
  on the weather, the season, the hour, the festival, what you are carrying,
  what you did yesterday (`S.yst`, measured off the XP counters at each
  rollover), which quests are open and `act2Unlocked`. At friendship 4, 7 and
  10 the arc stops being told and is played: a *heart event*, triggered by
  being in a place inside an hour window rather than by talking to anyone,
  run by `apps/bekkedal/scene.js` — pure and data-driven, the way
  `schedule.js` is — over scenes authored in `scenes_valley.js`/
  `scenes_wild.js`. A scene places its own cast over the schedule's answer,
  stands the player somewhere for the length of it, freezes the clock and
  hands all three back at the end. They talk about each other: Astrid knows
  Håkon is building, Ingrid knows Olav's boat is patched, and Håkon's arc and
  Marit's converge on the same rotten ridge beam. `BEK_TALK` is four files of
  two characters each (`talk_town.js`, `talk_water.js`, `talk_field.js`,
  `talk_stone.js`), joined by `data.js`.
  **The people have faces:** the conversation box is a portrait, a name plate
  and the line, with answers as rows the selection moves between
  (`apps/bekkedal/menus_talk.js`). The eight portraits are one head-and-
  shoulders rig with parameters per character out of `BEK_NPCS[].face` and
  three expressions each (`apps/bekkedal/portrait.js`), never eight drawings —
  and because the plate is the only place a speaker is named, no line in
  `BEK_TALK` carries an `ASTRID: ` prefix any more. `layout_check.js` holds the
  box's geometry and `scripts/lint-content.mjs` holds the prefix rule.
  **They keep hours, not one tile forever:** each of the eight who talk has
  two to four named posts — a map, a tile, the hours they hold it
  (`BEK_NPCS[].posts`, `apps/bekkedal/data.js`) — and is always standing at
  one or visibly walking between two, off the real walk cycle
  (`apps/bekkedal/actors.js`'s `person()`), never fixed in place. Weather
  moves an outdoor post indoors, a season can move Sigrid's whole day
  between the setra and the valley, a story flag can open a new one
  (Håkon's pen), and a festival day converges all eight on the town square —
  picked, in that priority order, by `apps/bekkedal/schedule.js`'s pure
  `positionFor()`, which `node apps/bekkedal/schedule_check.js` checks over
  a simulated year. A shopkeeper's shop hours are one of their posts, stated
  in their own dialogue.
  **The house you build is a house you furnish:** carrying a placeable item
  (a chair, a table, a rug, a bed, a shelf, a lamp, a wall hanging, a
  dresser indoors; a fence, a gate, a path, a planter, a bench, a scarecrow,
  a sign outdoors — every one buyable from Håkon once the house stands, and
  craftable at the chest) and pressing SPACE from the bag opens placement
  mode: a ghost snaps to the tile, R rotates it where that means something,
  SPACE confirms, ESC cancels — the same arrows-select/space-acts/escape-
  closes convention the shop and craft panels already use. Facing a placed
  object and pressing act picks it up and drops straight into placement
  mode holding it, so moving one is pick-up-then-place. Every kind is a
  `decor.js`/`decor_place.js` `PROP` drawn through the same terrain-cache
  pass, `propMap` and light-source machinery authored decor already uses —
  a placed lamp lights the room through `lightSources()` exactly the way an
  authored one does — but it lives in `S.placed` (`index.js`), keyed by map
  and tile, never in `BEK_DECOR`. `gjerde` (fence) and `grind` (gate) are
  the one deliberate exception to "decor never changes walkability": a
  placement of either is refused outright if it would disconnect any door,
  mapped exit or bed from the player's own square, proved by a flood fill
  in `apps/bekkedal/placement.js` rather than a local check around the
  candidate tile — the same function `node apps/bekkedal/layout_check.js`
  exercises directly, with synthetic corridors where the trap is
  constructed rather than merely hoped for, and a sweep of every real map.
  **Palette:** this app is the second explicit, user-requested exception to the machine's base 16-colour rule above — see `apps/bekkedal/CLAUDE.md` and `.claude/rules/bekkedal-art.md` for the full doctrine.
- `folder`: a folder window: BACK / UP / path, select (click, Ctrl, Shift, rubber band), drag and drop to move or Ctrl-copy,
  right-click menus, F2/Del/Ctrl+C/X/V/D/A/Z, Enter opens, Backspace goes up. `trash`: the RecycleBin (put back, delete for good,
  drag things out). `viewer`: pictures and video; BACKGROUND (five fits), SAVE A COPY, DELETE, arrow keys walk the folder.
- `garage`: `apps/garage/index.js` - THE GARAGE, a band in a box: a track list with an instrument each (30 real instruments +
  drum kit, `picker.js`), a note grid (`grid.js`; MAGIC NOTES keeps every row inside the key so nothing is wrong), a live keyboard
  (`keys.js`; computer keys, REC), a mixer per track (`tracks.js`), BAND IN A BOX (drums/bass/chords that fit), undo, SAVE/OPEN to
  `::/Home/Songs/*.SONG`, EXPORT .WAV. **LEARN** (`lessons*.js`) is the manual for a five-year-old: eight tiny interactive lessons
  (sounds, high and low, the beat, five magic notes, happy and sad, chords, patterns, make a song), a star each.
- `sweeper`: `apps/sweeper/index.js` - Sweeper, a Hollow-Knight-flavoured minesweeper on one scalable canvas (`gfx.js`
  draws a 960x640 sheet onto whatever size the window is, so fullscreen is bigger, not blurrier). Two ways in: the plain
  game in three sizes, and a **campaign** — an ink-on-vellum *map* of six regions / 18 rooms (`map.js`, data in `data.js`)
  with benches, guardians, and a mechanical layer taken from the source: *masks* (a larva costs a mask, not the game),
  *soul* (earned by opening ground, spent on FOCUS to mend, SCRY to settle one tile, DIVE to settle an area), *geo*,
  *charms in notches* (`bench.js`: twelve charms, three starting notches, so a build is a choice), *regions that change
  the rules* (bramble, spores, web, dark) and a *shade* that keeps half your geo where you fell. The rules of a board are
  pure in `board.js` (`node apps/sweeper/board_check.js`); `run.js` is play, `run_draw.js` is the room.
- `cook`: Jesse (`apps/cook/jesse.js`) is drawn as a person — skin tone, buzzed hair, stubble, the yellow suit and the
  respirator round his neck. **That portrait is a third user-requested exception to the 16-colour rule** (a face needs a
  skin tone); nothing else in the app leaves VGA16. On a win he speaks first, in a box that fits what he says, and the
  BATCH COMPLETE panel does not start until he has finished.
- `bottle`: a Jägermeister bottle and tumbler, each baked once and turned by pixel sampling (`raster.js`) with the liquid poured into
  the *turned* interior: a surface that stays level with the room (plus a slosh) and is moved until exactly the right number of
  pixels are under it, so the liquid pools in the neck, runs to the lip and spills over a rim by itself. The pour (`pour.js`) is a
  feedback loop on the head of liquid above the lip (a weir), the drink (`drink.js`) has a hand, an arm and a face, and the liquor runs
  over the rim into the mouth. Clicks queue and speed everything up (spam a bottle). Drinking drives `kernel/drunk.js`; ten measures
  and the window blacks out.
- `hifi` (TheStack): a disc library with **folders** — one for the lobby's four variants and one per app that scores itself
  with music (`apps/hifi/library.js` lifts each app's own score into a disc spec; a disc is pressed the first time it is played).
- `standbattle`: `apps/standbattle/index.js` - Stand Battle Arena, a JoJo's Bizarre Adventure roguelike combat prototype (see `docs/stand-battle-arena-spec.md`), ported in full from the jojo-roguelike repo's current, far more developed build (replacing this repo's earlier prototype port). Playable Jotaro Kujo/Star Platinum vs. Morioh enemies and boss Yoshikage Kira/Killer Queen, across a 6-node Act 1 (Morioh) map. Zero meta-progression by design; internal 480×270 canvas on a 720×260 belt plane (x, z) with a tracking camera, integer-only upscale.
  **Combat engine:** dodge (Step) is edge-triggered and gated by a 2-charge meter (`fighter.js`, GDD §3.7) with a HUD pip readout. All action inputs are queued in a 9-frame input buffer (`combat.js`) and fire the instant the player returns to idle. Arena world bounds are centralized in `arena_bounds.js`, shared by the sim (`combat.js`) and camera (`render.js`).
  **Simulation core:** the sim steps in whole frames at a fixed 60Hz (`sim_loop.js`'s `createFixedStepLoop`) on a real (x, z) belt plane. `fighter.js` is the entity/component store (`combat.entities = [player, enemy]`). `render_adapter.js` handles depth projection/sorting/camera targeting. Depth movement (`input.js`'s forward/back, W/S by default) is clamped via `arena_bounds.js`; hit detection remains x-only per Phase 1 scope. `headless_harness.js` (`node apps/standbattle/headless_harness.js`) runs the sim with no canvas for reproducible, seeded testing.
  **The combat resolver:** frame data and real AABB hitboxes replace fixed windup/active/recover timers and simple range checks. `moves.js` defines player moves as timelines (`frames`, `hitboxes[]`, `cancels[]`, `armor`); `resolvers.js` holds the five choke points (`resolveMoveFrames`, `resolvePatternFrames`, `resolveDamage`, `applyHit`, `rollCrit`, `resolvePoiseDamage`) — the only place stat arithmetic happens. `hitbox.js` does AABB overlap in (x, z); `poise.js` implements per-enemy poise/Stagger; `resources.js` implements Momentum/Persistence; `defense.js` implements Step/Guard/Clash as three structurally distinct defensive tools (GDD §2.3). `ai.js`'s `PATTERNS` carry `hitbox`/`glyph`/`armor`/`tags` for enemy attacks. `debug_overlay.js` (toggled by a `DEBUG` button) draws hitboxes/hurtboxes/frame state. `fairness_check.js` (`node apps/standbattle/fairness_check.js`) asserts telegraph timing fairness.
  **The pipeline:** `hooks.js` is a flat name→kind hook registry (EVENT/EFFECT/QUERY) with a mutable-context effect dispatcher (`bus.effect`/`dispatcher.runEffect`) and pure-reducer query chains (`bus.query`/`dispatcher.runQuery`) for derived numbers. `stats.js` is a separate layered stat pipeline (base→flat→multiplicative→clamp) wiring Range/Speed/Precision/devPotential into real formulas. `status.js` is the generic status system (`virus`/`frozen` proof entries). `effect_lib.js` is the string-addressable verb vocabulary (`EFFECT_LIB`/`QUERY_LIB`) content authors reference by name — zero buff-specific engine code. `content_registry.js` collects Fragment/Relic/donor data and validates it (`content_check.js`, `node apps/standbattle/content_check.js`) before installing anything onto the dispatcher.
  **Cross-cutting foundations:** `rng.js` is one seeded xorshift128 PRNG per run with named sub-streams (map/rewards/combat/ai) so draws never desync each other; render/particle randomness stays on plain `Math.random()` deliberately. `save.js` is the single choke point over `ctx.save`/`ctx.load` (`'run'` and `'meta'` blobs, each versioned/migratable). `constants.js` re-exports shared numeric constants (arena bounds, `SIM_HZ`/`FRAME_MS`, `GROUND_Y`, `DEATH_ANIM_FRAMES`) so sim and render never drift. `input.js` owns a rebindable keymap persisted via `save.js`'s `meta` blob and classifies every action edge- vs. held-triggered.
  **Graphics (480×270 internal, rebuilt from scratch):** every pixel comes from a software rasterizer (`draw.js`, axis-aligned 1px rows only, no antialiased fills/rotations) layered with `palette.js` (five-step colour ramps, hue-shifted shadows), `layer.js` (offscreen sprite compositor: silhouette ink outlines, cast shadows, hit flashes, dodge afterimages, squash/stretch), `body.js`/`face.js` (shared humanoid rig, anime-style heads), `anim.js` + `pose_player.js`/`pose_enemy.js` (pose engine with per-pattern enemy telegraphs), `sprite_jotaro.js`/`sprite_star.js`/`sprite_enemy.js`/`sprite_boss.js` (~100-120px characters), `background.js`/`bg_scenes.js`/`bg_props.js` (six-layer parallax across four Morioh locations), and `font.js`/`font_data.js` (5×7 bitmap font). This app is an explicit, user-requested exception to the machine's base 16-colour/no-antialiasing rule below; canvas smoothing stays off and everything still snaps to whole pixels. `fx.js` and `arena.js` drive impact/telegraph/particle effects off the hook dispatcher and combat state respectively; `render.js` handles camera/parallax/sprite stamping/HUD. Sound is a 3-layer SFX design with combo-pitch escalation (`audio.js`) plus an adaptive chiptune engine (`music.js`, its own Web Audio gain bus wired to the machine's MUS knob) with explore/combat/tension intensity layers.
  **Design documents — read before changing gameplay:** `docs/stand-battle-arena-spec.md` (technical contract), `docs/stand-battle-arena-gdd.md` (game design document), `docs/stand-battle-arena-tech.md` (engine audit/build order). There is no line budget on this app — content stays data-driven, never a new code path.

## Rules
- Apps never import from `kernel/`.
- Files stay under 300 lines (split into siblings in the app folder if needed).
