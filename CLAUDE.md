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
node scripts/check-drunk.mjs   # the Jäger journey (pure Node): a blackout is inside one bottle, about two minutes away at the very quickest
node scripts/check-style.mjs   # the style meter against five kinds of player (pure Node)
node scripts/check-styletrack.mjs # the style meter's recording: how it opens under the delete sound, how it loops, its gains (pure Node)
node scripts/check-delete.mjs  # the delete reel: a beat a file, 70 ms apart, a tune in C pentatonic that lands on the high C (pure Node)
node scripts/check-desk.mjs    # where desktop icons go: the grid, the occupancy map, a full desk (pure Node); npm run check:bulk pastes and deletes two hundred files
node apps/aftere/aftere_check.js # AfterEgypt: a bot flies all five ways across, nothing is asked that the ship cannot fly, the pay climbs (pure Node)
node apps/garden/garden_check.js # the garden: synergy arithmetic, and how long 99,999 SUN takes three kinds of player, equipped and not (pure Node)
node apps/bekkedal/life_check.js # what Bekkedal's people do between their posts: chores, sleep, errands, gifts worn (pure Node)
node apps/magen/music_check.js # Magen's score, its band's energy and the seams between tunes (pure Node); apps/bekkedal/music_check.js likewise
npm run check:music     # instruments, the studio, every game's score, and the style meter's recording
node apps/garage/edit_check.js # the Garage's note, segment and undo logic (pure Node)
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
  out off its own size sets `fluid: true` (or `body.dataset.fluid = '1'`) and is simply given the room. A window whose
  picture *is* the window (a `.gamepane`/`.godpane`/`.vidpane`, or a canvas that is the body's own child: `isCanvasWindow`
  in `wm.js`) is kept at its built size and scaled to fit. Every other window, **including one that merely has canvases
  in it** (the shop's thumbnails, Magen's star, Crayon's swatches), is a layout and just fills the desktop; it used to be
  scaled like a picture and ended up over its own title bar. An app whose root *is* the window body (it sets
  `root.className`, which drops `.wbody`: the shop and Notes) fills it with `flex: 1 1 auto; min-height: 0`, never
  `height: 100%`: the browser's zoom is applied to that very box and a zoomed 100% is taller than the window.
- **Drunk.** `kernel/drunk.js` (the bottle app) acts on the **whole interface**: an inline filter/transform on `#room` (case,
  well, chin and knobs as well as the picture), and the edges closing in and the eyelids are an overlay fixed to the viewport
  (`#drunkover`, built by `drunk.js`). `#tube` is left to the hold knobs, the saver and the power animation. Never give `#room`
  a fill-forwards animation: an animated value beats an inline style, which is what silently killed this effect before.
- **The chin.** LENS is a disabled knob: every machine runs at SOFT (`LENS_LOCK` in `hardware.js`, whatever an old save says).
  DEGAUSS is not a button any more but permanent: purity patches painted into the glass canvas with the scanlines
  (`kernel/degauss.js`, once per resize, so nothing animated sits over the picture); the terminal's `DEGAUSS` still fires the
  coil (`#degauss.pulse`, a one-shot flash).

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
  **Two hundred files are an ordinary thing to ask of it** (the style meter asks for exactly that): `vfs.js` keeps one IndexedDB
  connection for the session and answers `names(dir)` with a key cursor; `vfs_batch.js` is `copyMany/moveMany/trashMany/restoreMany/
  purgeMany/duplicateMany` (one transaction, one `vfs-changed` per folder, one `Style.hit` with the size of the pile) and the shared commands
  in `fileops.js` use them; `changed()` in `vfs_ops.js` coalesces announcements for 24 ms. **The desktop's icons are a keyed
  reconcile**, not a rebuild (`kernel/desktop.js` `buildIcons`): an icon whose name and kind are unchanged keeps its element and its
  selection, positions come from one occupancy map (`kernel/desk_grid.js`, pure), icons are CSS sprite classes rather than an `<img>`
  each (`icons_dom.js`). `check-desk.mjs` and `check-bulk.mjs` hold the numbers; the old code took twenty seconds for each step.
- **Deleting is a reel, not a thump.** `deletePaths` (`fileops.js`) hits the style meter once for the whole pile
  (`hitPile`), then puts the files in the bin a beat at a time (`gatherTrash` reads the pile once, `commitTrash` moves a
  slice): `kernel/delete_reel.js` (pure; `node scripts/check-delete.mjs`) plans it, **70 ms between beats, one file a beat
  until that would pass 3.4 s, then several**, and each beat is a note of a four-phrase tune in C pentatonic (C D E G A: inside
  C major and D minor, so it never fights the style meter's song) that always lands on the high C, with a chord on the last beat;
  a lone file is a two-note "dun-dun" (`Snd.reelNote/reelEnd/reelOne` in `style_sfx.js`). Piles queue, Ctrl+Z waits for the one
  running, and the pile is one undo.
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
  the screen in fullscreen has no layout to redo, so there the zoom multiplies the fit scale instead (`zoom.scaled(true)`, applied by
  `wm.js`'s `fitScaled`) and the picture follows the pointer when it outgrows the screen. The page's own zoom stays locked (`electron/main.js`).
  **A pane that holds a picture centres it with auto margins, never with `justify/align-items: center`** (`kernel/theme.css`: `.gamepane`, `.godpane`,
  `.vidpane`, the Garage's `.drawwrap`): centring that overflows is clipped on its near side for good, so zoomed in the left and the top of the picture could
  never be scrolled to, and zoomed out a short pane left the picture in the top of the window. A new app with a pane that holds a canvas uses one of those classes.
- **Help** is built in (`kernel/help.js`, pages in `help_text.js`, DolDoc): it is not a file on the VFS, so it cannot be deleted.
- **The Jäger is a journey, and it fits in one bottle.** `kernel/drunk_bac.js` is the arithmetic (pure; `scripts/check-drunk.mjs` holds it to its numbers): a
  measure sits in the stomach and reaches the blood with a time constant of 30 s, the body clears one per 60 s, and what the screen
  shows is the blood plus half of what is still on its way. The bottle app lets one measure down about every 10 s at the very
  quickest (a 3.5 s pour, a 3.5 s drink, a 2.6 s breather in which clicks do nothing; clicks are never queued and never speed anything up), so
  non-stop drinking is just under two minutes and thirteen of a bottle's seventeen measures to the floor, through seven named stages; a
  steady twenty seconds a measure is still out inside the bottle; one a
  minute holds a mild glow for ever. **The drink is first-person**: nobody is drawn drinking. The tumbler is an object
  (`apps/bottle/glass3d.js`, a raycast cylinder with real walls, a floor and liquor that stays level with the room): it is lifted
  toward the screen and tipped toward whoever is at the monitor, and what the near edge cannot hold goes over it.
- **The Jäger passes out.** At the limit (`BAC.LIMIT`) `kernel/blackout.js`
  takes the whole window (not just the tube: the overlay is `position:fixed` over the monitor, bezel and chin included) for ~16 s:
  nine altered scenes (`blackout_a/b.js`, bent by `blackout_fx.js`), unskippable, calmer and without the harshest effects under
  `prefers-reduced-motion`. **Seven of them are photographs** — a snowy bridge in a city, chickens on a park bench, an ULTRAKILL corridor,
  a bouldering wall, a heap of CDs, a baby turtle, a League of Legends match — pressed to the sixteen colours and Floyd-Steinberg dithered, 320 px wide,
  in `assets/blackout/*.png` (made by `python3 scripts/make-blackout-art.py name=photo.jpg …`; needs Pillow + numpy, the machine never
  runs it). `kernel/blackout_photo.js` loads them and drifts the 320×180 view up and down inside each (whole rows, never resampled; the
  pan ranges live there). The other two are drawn: a Discord channel and a Debian/GNOME desktop with neofetch
  (`blackout_b.js`, text in the 3×5 font of `blackout_draw.js`; its still parts are cached once with `layer()`, shades the sixteen can't
  make are 2×2 weaves from `dith()`). A scene's photo is optional: one that fails to load is never dealt. The double exposure is a
  checkerboard of pixels, not an alpha blend, so every pixel stays one of the sixteen. To add a scene: draw it (or add a photo to `FILES`
  in `blackout_photo.js`), then list it in `SCENES` in `blackout.js`.
- **Real instruments.** `kernel/instruments.js` is a sampler over `assets/instruments/` (49 instruments + a drum kit — the first 30 free, nineteen more in Dave's packs, samples of the
  MIT-licensed FluidR3_GM soundfont, built by `node scripts/make-instruments.mjs`; held instruments carry seamless loop points).
  `kernel/studio.js` is the mixer and scheduler (per-track volume/pan/room/mute/solo, a master that follows the MUS knob and the
  taskbar mixer's THE GARAGE channel, a limiter): `Studio.play(song)`, `Studio.live()`, `Studio.render(song)` (offline, for WAV
  and for TheStack discs). Apps reach it as `ctx.studio`.

- **The studio's desk and decks.** Every player (`Studio.play`) has a desk of its own (`kernel/studio_mix.js`: per track a drive, a
  three-band EQ, a compressor, pan, a send to the room and one to an echo synced to the tempo, and a meter; the master has a
  limiter and a stereo meter) and plays on a *channel* (`'garage'`, `'bekkedal'`, `'style'`...): the MUS knob and the taskbar mixer's
  slider for that channel set how loud, so a game's music is never at the mercy of the Garage's fader. A game plays its score
  through `Studio.deck(channel)` (`kernel/deck.js`): `play(song, { fade, layers, levels, at })` crossfades from the old song, `layers({ combat:
  true })` switches the tracks tagged with that `layer` on and off while the song plays (that is how Stand Battle's score gets
  bigger when a fight starts, and how Bekkedal's tunes lose their lead after dark), and `levels({ h1: 0.4, h2: 0 }, { glide })` *rides* a
  layer's level instead (the strip glides to it, and a layer taken right out stops being played at all): that is how Magen's band leans in
  with a chain. `segue(song, { now })` is how one tune follows another: the old one is let play out its pass and the new one starts on the very
  next sample, or (`now`, or when too little of the pass is left) on the next bar line; `preload` fetches a song's instruments ahead.
  The player answers `remaining()` (seconds to the end of its pass), `toBar()` (to the next bar line) and `beat()`, so a game can make its
  changes where the music itself changes. The deck plays a *copy*, so a score's own data is never muted by what a game does to it. `Studio.play` also takes `loopFrom/loopTo`, `from`, `countIn`, `fadeIn`, and returns a
  player with `seek`, `setLoop`, `setMetronome`, `fade`, `levels()`. `Studio.render` renders **in stretches of ~20 s** (a long song
  as one offline graph crawls) and takes `from/to`, `only` (a stem), `sampleRate`, `tail`, `limit`; `kernel/wavfile.js` writes
  16/24-bit WAVs, `kernel/midi.js` writes and reads standard MIDI files.
- **The games are scored for real instruments.** `apps/bekkedal/score.js`, `apps/elephant/score.js`, `apps/standbattle/score.js` and
  `apps/magen/score.js` are studio songs (built with `apps/scorekit.js`'s helpers; Magen's is written from scratch in the text notation); the
  Stack's folders play the same songs. **Which tune and when is `apps/director.js`**, shared (`createDirector`): a tune is heard through
  `minLoops` times, the next is arranged in the last `PREP` (14) seconds of the pass and starts on the downbeat after it (`deck.segue`),
  the next tune is the next in the pool (an order, never a dice roll), a change of place takes a bar-aligned crossfade unless the pass is
  nearly over, and `want(id)` holds one tune (Magen's Shabbat). `apps/bekkedal/music.js` is its pools and what the dark does to a tune
  (`node apps/bekkedal/music_check.js`); `apps/magen/music.js` is its rotation plus a smooth `energy` (below). A change of tune used to be a
  timer and a dice roll in a different key; do not bring either back.
- **The style meter.** `kernel/style_model.js` is its rules (pure; `scripts/check-style.mjs` plays five kinds of player against
  them): every rank is further than the last, a single file is worth less the higher you are (a pile of twenty to eighty is not
  marked down, so it is piles that reach the top), the bleed never stops (it runs at 60 % while a chain is alive and in full after
  the rank's own grace, which shrinks), and the top keeps its give so it does not flicker. `kernel/style.js` is the screen
  (`kernel/smeter.css`: `data-t` is the rank, and every rank up the meter is bigger, via `--sm-k`, and moves more;
  `kernel/style_fx.js`: sparks, a frame of light, and confetti at the top; reduced-motion switches all of it off). At the top rank
  **a song plays**: a recording, `assets/style/at_ends.mp3` (2:29, D minor; third-party content the owner supplied: its licence is theirs),
  decoded once and played from memory, so it starts at once (`kernel/style_track.js` plays it, `kernel/style_track_plan.js` is when and
  how, pure, held by `scripts/check-styletrack.mjs`). **It comes in under the delete sound**: for `BLEND` (5 s) the song rises on a
  smoothstep beneath echoes of the top rank's sound (C6 G6 C7 G7, `style_sfx.js`: open fifths, which sit inside D minor) that thin out
  and darken as it arrives. Kept at the top it plays through, and its own fade-out crosses (`SEAM`) into `LOOP_FROM` (the quiet build
  before the first drop) and goes round again. It plays on its own `'style'` channel of the studio, ducks the lobby, hushes
  `kernel/rage.js` (the chiptune layer), and fades out 1.5 s after the meter leaves the top. The first time the meter reaches it,
  `templeos.symphony.v1` is set (the key kept so earned folders are kept) and the Stack gets a STYLE METER folder with the song, which
  `apps/hifi/library.js` plays through the same decoded buffer (the old rendered symphony, which sometimes took two minutes to start in
  the Stack, is gone). **After a minute at the top the sound glitches** (`kernel/glitch.js`: stutter, bitcrush, tape wobble, gates; on the studio's
  channels, the SFX bus and the chiptune layer; rare and short at first, frequent and long over the next minute and a half; a pile
  of twenty or more files deleted while it is going throws a burst on the spot).

- **Dave's shop is a set of shelves** (`kernel/cos_data.js` is the stock, `kernel/cos.js` the till). A category in `COS_CATS` has a `kind`:
  `look` (frames, logos, pointers, schemes: worn one at a time, previewed by hovering), `stock` (pots, seeds: what the garden grows with),
  `wall` (BACKDROPS: the seven pressed photographs already in `assets/blackout/`; buying one sets the desktop and writes a real picture
  to `::/Home/Backdrops/`, and equipping sets the wallpaper through `kernel/wallpaper.js`) and `unlock` (CRAYON, GARAGE, DRINKS, ELEPHANT: something an
  app was given; `app` names which one, and the card opens it). `Cos.buy` ends in `Cos.tell`: every subscriber and a `cos-changed`
  window event hear it, so an open app (a crayon with a locked brush, a garage picker) updates at once. **A new thing for sale is one
  line in its list.** An app sends you to the right shelf with `ctx.openWindow('shop', { tab: 'crayon' })`. Lists are sorted by price on load.
  What the apps do with their shelves: **the Crayon** lists its eight extra brushes (`apps/crayon/brushes.js`, one function per brush
  laying one segment) and four layers (`layers.js`: clear sheets over the sheet, composited into the canvas the window shows) for everybody,
  dim and marked `$` until bought; **the Garage's** picker (`apps/garage/packs.js`) lists all forty-nine instruments and auditions any, but only a bought
  pack's can go on a track (a song that already uses one still plays); the nineteen new ones are built by `scripts/make-instruments.mjs <ids>`
  from FluidR3_GM like the first thirty; **THE BOTTLE** pours any drink you own (`apps/bottle/drinks.js` builds a whole bottle, label and
  liquor from three colours in `DRINKS`; `Drunk.drink(strength)` counts a measure against the limit in Jägermeisters, 0 for the cordial); **the Elephant** has a wardrobe
  (`apps/elephant/wear.js` draws on the big front-on elephant, `kernel/pet_art.js` on the small side-on one: same twelve things, two pictures).
- **The elephant on the desktop** (`kernel/pet.js`, saved as `templeos.pet.v1`) exists once FREE RANGE is bought and he is let out
  of his window (GO OUTSIDE; CALL HIM IN, or his menu, brings him back). He lives in `#desktop` under every window and over every icon,
  walks, sleeps (sooner and longer after 23:00; he wakes if the pointer comes close), talks (some lines read the desk: the icon count, the
  sun, the hour), hops, can be picked up and dropped, and every few minutes walks to one of your icons and pushes it a cell or two
  (`petIcons()` / `petMoveIcon()` in `desktop.js`: the move slides and is remembered like any other; his menu's PUT THE LAST ICON BACK undoes it). One 80 x 60 canvas
  redrawn twelve times a second and a transform. He wears what the wardrobe says (`Pet.setWear`), and the big elephant's window shows only the place
  and a note while he is outside.

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
- `magen`: `apps/magen/index.js` - Magen, an idle game of mitzvot around a clicked star. **Its music is six tunes for the studio's real
  instruments** (`apps/magen/score.js`: FREYGISH, NIGUN, HORA in 3, MI SHEBERACH, FREYLEKHS, and Shabbat's ZMIROT; all on D so any can follow any
  on a downbeat, sixteen bars each) **and a band that leans in with the chain**. Every tune is a core (a lead, a nylon guitar, a cello, an
  upright bass, a squeezebox: a whole tune alone) and three layers — `h1` the fiddle, the off-beat and a shaker; `h2` the kit, a second voice
  in thirds and oom-pah; `h3` the choir, running fiddle, timpani and a crash every four bars. `apps/magen/music.js` turns the click chain into
  an `energy` from 0 to 3 (`CHAIN`: 8, 22 and 40 clicks bring each layer fully in) that rises over ~1 s and falls over ~4 s, and rides the
  layers with `deck.levels`; **a click never restarts, ducks or re-cues the tune**, which is what it did when it was oscillators and a
  `recue()` on every step of the heat. The rotation is `apps/director.js` (each tune about a minute and a half); Shabbat takes ZMIROT in on the next
  bar line and `want(null)` goes on from where it left off. It plays on the studio's `'magen'` channel, so MUS and the taskbar slider set
  how loud. `node apps/magen/music_check.js` (pure Node): bars, notes, the lead on its chords, the energy's steps, the seams.
- `aftere`: `apps/aftere/index.js` - AfterEgypt, five ways across the sky to the third temple (`levels.js`: PILGRIM is the game as it was, then
  SCRIBE, PRIEST, PHARAOH and THE THIRD TEMPLE, each opened by clearing the one before). The tiers add a ship that chases the pointer at a limited
  speed, gaps that wander and breathe, locusts, gusts with a second of warning, a sky that closes in, coins and ankhs (a second chance). Pay climbs from 50 SUN
  to 2,500 plus coins a clear, a first clear and a clear with no hit pay more, and dying in the pillars keeps half the coins. `sim.js` is one run as plain data at a fixed
  60 Hz (no canvas, no clock), `draw.js` the picture, and `aftere_check.js` flies every tier with a bot and holds the pay ladder to a rising rate a minute.
- `garden`: `apps/garden/index.js` - GARDEN.EXE. Five rooms of twelve pots, each room standing in a pot of its own choice. **What grows where matters**
  (`synergy.js`, pure): HOME room, KIN pot, ROOTED (both), a room's SET pot, a BED of its own kind, MATE species beside it; hover a plant to read exactly what is helping
  it. **The work is taken out late**: drag with the can, the hand or the pull tool to sweep a rack, TEND (SPACE) waters every room and sweeps every plant with a chain
  bonus, and the bench (`B`) sells a DRIP line per room, bigger BASKETS (20 to 150 tokens a room) and a GATHERER that empties a full room at 65-85% of a hand's price
  (half that while away, for at most an hour). `model.js` is the whole economy as plain data; `world.js` loads and migrates a save; `scene.js`, `art.js`, `air.js`, `bench.js` are the picture, the plants, the wind and the panel.
  `garden_check.js` runs hours of it as a player who checks in every few minutes: fully equipped, 99,999 SUN is about a quarter of an hour; from nothing, two and a half hours;
  a night away with everything bought brings in about half of it.
- `shop`: `apps/shop/index.js` - CRAZY DAVE'S, eleven shelves (see **Dave's shop is a set of shelves**). `thumbs.js` draws every card, `lines.js` is what Dave says.
- `crayon`: DRAW.EXE; its extra brushes and layers are Dave's. `elephant`: the big elephant, his five places and songs, and the wardrobe and the door to the desktop.
- `folder`: a folder window: BACK / UP / path, select (click, Ctrl, Shift, rubber band), drag and drop to move or Ctrl-copy,
  right-click menus, F2/Del/Ctrl+C/X/V/D/A/Z, Enter opens, Backspace goes up. `trash`: the RecycleBin (put back, delete for good,
  drag things out). `viewer`: pictures and video; BACKGROUND (five fits), SAVE A COPY, DELETE, arrow keys walk the folder.
- `garage`: `apps/garage/index.js` - THE GARAGE, a studio for a producer and an audiophile that a beginner can still use.
  **The roll** (`grid.js`, `grid_draw.js`; one canvas holds the ruler, the notes and the velocity lane): three tools (DRAW: click to
  put a note down, drag it longer; clicking a note *selects* it so nothing is deleted by accident; on the drum kit DRAW is a step
  sequencer. SELECT drags a box. ERASE sweeps; the right button erases in any tool), move and resize by dragging, Ctrl-drag copies,
  Shift adds to the selection, a velocity lane, a minimap, variable snap (bar to 1/32, triplets, off), zoom both ways, MAGIC NOTES
  (only the key's rows). **Segments**: dragging the ruler picks a stretch of *time* across every track (or just this one), which
  can be looped, copied, cut, pasted at the yellow cursor (over the song, or pushing the rest later), duplicated, repeated, cleared,
  removed with the gap closed, or given a gap; the song grows by itself a bar at a time. All of it is `edit.js` (pure; `node
  apps/garage/edit_check.js`), narrated in the status line by `actions.js`, and undoable (80 steps, redo). **Transport**: play from
  the cursor, loop (the stretch or the song), count-in, click, tempo (typed or tapped), beats per bar, swing, REC on the keys
  (`keys.js`, quantized to the snap). **The desk** (`mixer.js`, `meters.js`; TAB or the dock tab): per track fader, pan, three-band
  EQ, compressor, drive, room and echo, meters; the master has a limiter you can set, a mono check, peak/RMS/gain-reduction and a
  spectrum. **Files**: SAVE (quietly over the same file), SAVE AS, OPEN (yours, the demos, or IMPORT a .mid), a guard before anything
  that would lose changes, a draft kept by itself; EXPORT (`export.js`) is a WAV (16 or 24 bit, 44.1/48 kHz, peak-normalised or as
  mixed, the whole song or the picked stretch, with a report of the peak and loudness), a WAV per track (stems) or a MIDI file.
  `help.js` (F1) lists every key. **LEARN** (`lessons*.js`) is now THE BASICS: the same eight short interactive lessons (the kit,
  pitch, the pulse, five safe notes, major and minor, chords, loops, your first track) in a dark control-room theme and plain
  adult sentences, with a tick for each one you have got.
- `sweeper`: `apps/sweeper/index.js` - Sweeper, a Hollow-Knight-flavoured minesweeper on one scalable canvas (`gfx.js`
  draws a 960x640 sheet onto whatever size the window is, so fullscreen is bigger, not blurrier). Two ways in: the plain
  game in three sizes, and a **campaign** — an ink-on-vellum *map* of six regions / 18 rooms (`map.js`, data in `data.js`)
  with benches, guardians, and a mechanical layer taken from the source: *masks* (a larva costs a mask, not the game),
  *soul* (earned by opening ground, spent on FOCUS to mend, SCRY to settle one tile, DIVE to settle an area), *geo*,
  *charms in notches* (`bench.js`: twelve charms, three starting notches, so a build is a choice), *regions that change
  the rules* (bramble, spores, web, dark) and a *shade* that keeps half your geo where you fell. The rules of a board are
  pure in `board.js` (`node apps/sweeper/board_check.js`); `run.js` is play, `run_draw.js` is the room.
- `cook`: the story (`CK_STORY`/`CK_END` in `data.js`) is the plot of Breaking Bad told plainly, names and all, ten chapters of
  four or five lines under 60 characters so none wraps; it used to leave every name out. Jesse (`apps/cook/jesse.js`) is drawn as a person — skin tone, buzzed hair, stubble, the yellow suit and the
  respirator round his neck. **That portrait is a third user-requested exception to the 16-colour rule** (a face needs a
  skin tone); nothing else in the app leaves VGA16. On a win he speaks first, in a box that fits what he says, and the
  BATCH COMPLETE panel does not start until he has finished.
- `bottle`: a Jägermeister bottle (baked once and turned by pixel sampling, `raster.js`, with the liquid poured into the *turned*
  interior) and a tumbler that is an object, not a sprite (`glass3d.js`: a thick-walled cylinder with a floor, found pixel by pixel by
  following a ray out of an eye, with the liquor held level by a plane and the volume solved for it). The pour (`pour.js`) is a
  feedback loop on the head of liquid above the lip (a weir). **Nobody is drawn drinking** (`drink.js`): the glass is lifted toward the
  screen and tipped toward the viewer, so the person at the monitor is the one it is tipped to, and what the near edge cannot hold goes
  over it. Clicks are never queued and never speed anything up: a pour, a drink and a breather each ignore them. Drinking drives
  `kernel/drunk.js` (the journey: see **The Jäger is a journey**).
- `hifi` (TheStack): a disc library with **folders** — one for the lobby's four variants and one per app that scores itself
  with music (`apps/hifi/library.js` lifts each app's own score into a disc spec; a disc is pressed the first time it is played).
  Nothing is pressed when the window opens, and no loose discs ride on the shelf outside the folders. Its face is drawn at the
  pixels it is shown at (`fit()`: the 480x386 room is scaled to the canvas, rectangles snap to whole screen pixels) in VT323 with the
  dimmest inks lifted for text, not blown up one and two thirds times. The STYLE METER folder appears once the meter has read
  HAPPY BIRTHDAY, with the song. **1-9 are EQ presets**, read as the physical digit (`Digit1`/`Numpad1`, so a layout where the digits
  need Shift still works) and heard from the document whenever TheStack is the front window and nothing is being typed into (a click on the title bar
  or the taskbar moves focus off the canvas, and the digits used to go to the desktop). A preset puts a bypassed EQ in circuit, and it is the curve the next
  discs inherit unless a disc has an EQ of its own saved with it, so a track change does not put the flat curve back.
- `standbattle`: `apps/standbattle/index.js` - Stand Battle Arena, a JoJo's Bizarre Adventure roguelike combat prototype (see `docs/stand-battle-arena-spec.md`), ported in full from the jojo-roguelike repo's current, far more developed build (replacing this repo's earlier prototype port). Playable Jotaro Kujo/Star Platinum vs. Morioh enemies and boss Yoshikage Kira/Killer Queen, across a 6-node Act 1 (Morioh) map. Zero meta-progression by design; internal 480×270 canvas on a 720×260 belt plane (x, z) with a tracking camera, integer-only upscale.
  **Combat engine:** dodge (Step) is edge-triggered and gated by a 2-charge meter (`fighter.js`, GDD §3.7) with a HUD pip readout. All action inputs are queued in a 9-frame input buffer (`combat.js`) and fire the instant the player returns to idle. Arena world bounds are centralized in `arena_bounds.js`, shared by the sim (`combat.js`) and camera (`render.js`).
  **Simulation core:** the sim steps in whole frames at a fixed 60Hz (`sim_loop.js`'s `createFixedStepLoop`) on a real (x, z) belt plane. `fighter.js` is the entity/component store (`combat.entities = [player, enemy]`). `render_adapter.js` handles depth projection/sorting/camera targeting. Depth movement (`input.js`'s forward/back, W/S by default) is clamped via `arena_bounds.js`; hit detection remains x-only per Phase 1 scope. `headless_harness.js` (`node apps/standbattle/headless_harness.js`) runs the sim with no canvas for reproducible, seeded testing.
  **The combat resolver:** frame data and real AABB hitboxes replace fixed windup/active/recover timers and simple range checks. `moves.js` defines player moves as timelines (`frames`, `hitboxes[]`, `cancels[]`, `armor`); `resolvers.js` holds the five choke points (`resolveMoveFrames`, `resolvePatternFrames`, `resolveDamage`, `applyHit`, `rollCrit`, `resolvePoiseDamage`) — the only place stat arithmetic happens. `hitbox.js` does AABB overlap in (x, z); `poise.js` implements per-enemy poise/Stagger; `resources.js` implements Momentum/Persistence; `defense.js` implements Step/Guard/Clash as three structurally distinct defensive tools (GDD §2.3). `ai.js`'s `PATTERNS` carry `hitbox`/`glyph`/`armor`/`tags` for enemy attacks. `debug_overlay.js` (toggled by a `DEBUG` button) draws hitboxes/hurtboxes/frame state. `fairness_check.js` (`node apps/standbattle/fairness_check.js`) asserts telegraph timing fairness.
  **The pipeline:** `hooks.js` is a flat name→kind hook registry (EVENT/EFFECT/QUERY) with a mutable-context effect dispatcher (`bus.effect`/`dispatcher.runEffect`) and pure-reducer query chains (`bus.query`/`dispatcher.runQuery`) for derived numbers. `stats.js` is a separate layered stat pipeline (base→flat→multiplicative→clamp) wiring Range/Speed/Precision/devPotential into real formulas. `status.js` is the generic status system (`virus`/`frozen` proof entries). `effect_lib.js` is the string-addressable verb vocabulary (`EFFECT_LIB`/`QUERY_LIB`) content authors reference by name — zero buff-specific engine code. `content_registry.js` collects Fragment/Relic/donor data and validates it (`content_check.js`, `node apps/standbattle/content_check.js`) before installing anything onto the dispatcher.
  **Cross-cutting foundations:** `rng.js` is one seeded xorshift128 PRNG per run with named sub-streams (map/rewards/combat/ai) so draws never desync each other; render/particle randomness stays on plain `Math.random()` deliberately. `save.js` is the single choke point over `ctx.save`/`ctx.load` (`'run'` and `'meta'` blobs, each versioned/migratable). `constants.js` re-exports shared numeric constants (arena bounds, `SIM_HZ`/`FRAME_MS`, `GROUND_Y`, `DEATH_ANIM_FRAMES`) so sim and render never drift. `input.js` owns a rebindable keymap persisted via `save.js`'s `meta` blob and classifies every action edge- vs. held-triggered.
  **Graphics (480×270 internal, rebuilt from scratch):** every pixel comes from a software rasterizer (`draw.js`, axis-aligned 1px rows only, no antialiased fills/rotations) layered with `palette.js` (five-step colour ramps, hue-shifted shadows), `layer.js` (offscreen sprite compositor: silhouette ink outlines, cast shadows, hit flashes, dodge afterimages, squash/stretch), `body.js`/`face.js` (shared humanoid rig, anime-style heads), `anim.js` + `pose_player.js`/`pose_enemy.js` (pose engine with per-pattern enemy telegraphs), `sprite_jotaro.js`/`sprite_star.js`/`sprite_enemy.js`/`sprite_boss.js` (~100-120px characters), `background.js`/`bg_scenes.js`/`bg_props.js` (six-layer parallax across four Morioh locations), and `font.js`/`font_data.js` (5×7 bitmap font). This app is an explicit, user-requested exception to the machine's base 16-colour/no-antialiasing rule below; canvas smoothing stays off and everything still snaps to whole pixels. `fx.js` and `arena.js` drive impact/telegraph/particle effects off the hook dispatcher and combat state respectively; `render.js` handles camera/parallax/sprite stamping/HUD. Sound is a 3-layer SFX design with combo-pitch escalation (`audio.js`); the music is `score.js`, one eight-bar combat loop for the studio's real instruments with explore/combat/tension layers, played on the game's own channel of the studio (`music.js` only starts it and switches the layers with `musicSetIntensity`).
  **Design documents — read before changing gameplay:** `docs/stand-battle-arena-spec.md` (technical contract), `docs/stand-battle-arena-gdd.md` (game design document), `docs/stand-battle-arena-tech.md` (engine audit/build order). There is no line budget on this app — content stays data-driven, never a new code path.

## Rules
- Apps never import from `kernel/`.
- Files stay under 300 lines (split into siblings in the app folder if needed).
