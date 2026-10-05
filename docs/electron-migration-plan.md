# Plan: Holytron DM-640 (TempleOS) as a standalone Electron app

Decisions so far:
- Targets: **Windows** (primary, where it's developed) and **Debian Linux**.
- **No existing saves** to carry over.
- **The web build goes away.** Electron becomes the only way to run it.
- Unsigned, no auto-update for now (see §9).

Goal: ship the whole machine as a desktop app with every app, the bit-exact
16-colour/no-antialiasing look, and the existing checks intact.

## 0. What the repo is today

- Pure static ES-module web app: `index.html` -> `kernel/boot.js` -> lazy
  `import()` per app via `kernel/registry.js` (28 apps). No bundler.
- Run by `server.js` (Express, port 3000) or `START.bat` / `start.sh`.
- All user state is browser storage: IndexedDB `TempleOS_VFS` and
  `templeos.vault`, plus localStorage (`templeos.*`, `app_<appId>_<key>` for every
  `ctx.save`, including Bekkedal and Stand Battle).
- One network dependency: Google Fonts `VT323` in `index.html`.
- Existing checks: `scripts/smoke.mjs`, `bekkedal_*`, `lint-content.mjs`, `*_check.js`
  (headless Node / Playwright).
- Root clutter (`fix_*.cjs`, `*_check.txt`, `big html file`, `temp_*.js`) is
  one-off scaffolding and must not ship.

## 1. Storage: pick the origin once and never change it

Browser storage is keyed by origin, so the app must always load from the same
one, or saves silently disappear between versions. (With no existing saves and
no web build, there is nothing to migrate — only a rule to follow.)

1. Serve the app from a custom privileged scheme, `templeos://app/`
   (`protocol.registerSchemesAsPrivileged` + `protocol.handle`). `file://` breaks
   ES-module `import()` and `fetch('assets/seed.json')`; a localhost port can
   collide. A custom scheme has neither problem and behaves identically on
   Windows and Linux.
2. Pin `app.setPath('userData', …)` and freeze `appId` / `productName`; both
   decide where saves live. Changing them later orphans every save.
3. Rolling backups: on quit, write a JSON dump of IndexedDB + localStorage to
   `userData/backups/` (keep last 5). Chromium storage can corrupt; this is the
   safety net. Include a manual "Export / Import machine" in the kernel using the
   same dump format, so saves can move between machines or Windows <-> Linux.
   Format is versioned (`{format:1, seedVersion, idb, ls}`) and import refuses a
   newer format.

## 2. Target layout

```
electron/
  main.js       # lifecycle, window, single-instance lock, menu
  preload.js    # contextBridge: exportMachine / importMachine / version / quit
  protocol.js   # templeos:// handler, path-traversal-safe, correct MIME types
  backup.js     # dump/restore + rolling backups
build/icons/    # icon.ico (Windows), icon.png 512x512 (Linux)
vendor/fonts/VT323-Regular.woff2
```

`index.html`, `kernel/`, `apps/`, `assets/` stay in place; only changes are the
bundled font, the export/import hook, and removing web-only files (§6, Phase 5).

## 3. Window and rendering fidelity

- `BrowserWindow`: `backgroundColor:'#000000'`, `show:false` until
  `ready-to-show`, hidden menu bar, remember size/position/fullscreen in
  `userData/window.json`.
- Lock zoom to 1 (block Ctrl +/-/0 in `before-input-event`); test Windows 125% /
  150% scaling and Linux HiDPI (X11 and Wayland) — the likeliest place for the
  pixel look to soften.
- `backgroundThrottling:false` so Bekkedal's clock and Stand Battle's 60 Hz
  fixed-step loop don't stall when the window is occluded.
- `autoplayPolicy:'no-user-gesture-required'` for `snd.js` / `music.js`.
- F11 fullscreen.

## 4. Security

- `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`.
- Preload exposes only the four functions above; nothing reaches `ctx`, so the
  app contract in `CLAUDE.md` is unchanged.
- CSP in the protocol handler: `default-src 'self'; img-src 'self' data: blob:;
  media-src 'self' blob:; style-src 'self' 'unsafe-inline'`. No remote origins
  after the font is bundled.
- Deny `window.open`, block navigation off-origin, deny all permission requests.

## 5. Cross-platform concerns (Windows dev, Windows + Debian targets)

- **Line endings:** add `.gitattributes` (`* text=auto eol=lf`) so Windows
  checkouts don't produce CRLF churn or break shell scripts.
- **Paths:** the protocol handler and backup code use `path.join`, never
  hard-coded `/` or `\`; decode and normalise URLs, reject anything resolving
  outside the app root. File names are case-sensitive on Linux but not Windows —
  add a check that every `import` / asset path matches its file's exact case
  (this is a classic "works on Windows, breaks on Debian" bug).
- **Building the Debian package from Windows:** `.deb` can't be built natively on
  Windows. Use GitHub Actions with a matrix (`windows-latest` -> NSIS installer,
  `ubuntu-latest` -> `.deb` + AppImage), or WSL locally.
- **Linux runtime:** `.deb` declares Chromium's usual dependencies
  (electron-builder does this); test on a real Debian install, including the
  `chrome-sandbox` SUID issue (set `--no-sandbox` only as a documented fallback,
  never the default).
- **Save locations:** `userData` resolves to `%APPDATA%\Holytron` on Windows and
  `~/.config/Holytron` on Linux — nothing OS-specific in our code.
- **Downloads / Save dialogs:** `will-download` -> native dialog, default folder
  = Documents/Holytron.

## 6. Phased execution

**Phase 1 — Prep (still runnable in a browser)**
1. Bundle VT323 locally; verify zero non-local requests (Playwright
   request interception).
2. Add `.gitattributes`; add the import-path case check.
3. Baseline: run the full existing suite and record results.

**Phase 2 — Shell**
4. Add `electron/` and deps (`electron`, `electron-builder`); custom protocol;
   pinned `userData`; security flags; `"main": "electron/main.js"`,
   scripts `start` (`electron .`) and `dist`.
5. App boots straight to the desktop on Windows and Debian.

**Phase 3 — Parity verification (the "nothing is lost" gate)**
6. Point the Playwright scripts (`smoke.mjs`, `bekkedal_*`) at the Electron
   window via `_electron.launch`; pure-Node `*_check.js` keep passing as is.
7. Open / interact / close / reopen all 28 apps; no console errors; `unmount()`
   leaves no timers or listeners.
8. Pixel diff of the desktop and Bekkedal, Stand Battle, Solitaire, Hifi against
   baseline screenshots taken in Phase 1, at 100% / 125% / 150% on Windows and at
   100% / 200% on Debian. No antialiasing.
9. Persistence: write -> quit -> relaunch -> verify; kill the process mid-session
   and confirm at most the last unflushed save is lost; flush saves on
   `before-quit`.
10. Performance: Stand Battle holds 60 Hz; `bekkedal_playtest.mjs` day length
    still ~300 s.

**Phase 4 — Packaging**
11. `electron-builder` targets: `nsis` (Windows), `deb` (+ optional `AppImage`).
    `files` allowlist: `index.html`, `kernel/`, `apps/`, `assets/`, `vendor/`,
    `electron/`.
12. App id `com.holytron.dm640`, frozen. Icons from `assets/images`.
13. CI workflow builds both installers and runs the suite on both OSes.

**Phase 5 — Remove the web build**
14. Only after Phase 3 passes on both OSes: delete `server.js`, `START.bat`,
    `start.sh`, and drop `express` from `package.json`.
15. Delete the root scaffolding (`fix_*.cjs`, `*_check.txt`, `big html file`,
    `temp_*.js`, `bulk_port.cjs`, etc.) — confirm each is unused first.
16. Update `CLAUDE.md` and `README.md`: run with `npm start`, build with
    `npm run dist`, and the "never change scheme / appId / productName" rule.

## 7. Acceptance checklist

- [ ] All 28 apps launch and close cleanly on Windows and Debian.
- [ ] Saves persist across relaunch; Bekkedal reloads onto the same square; Stand Battle `run` / `meta` intact.
- [ ] Zero network requests; works offline; font identical.
- [ ] Screenshots match baseline at all tested scales; no antialiasing.
- [ ] Audio plays without a click; MUS/SFX knobs work.
- [ ] 60 Hz sim holds; Bekkedal day length unchanged.
- [ ] Existing suite green on both OSes, run against Electron.
- [ ] Case-sensitivity check passes (Debian boots what Windows boots).
- [ ] NSIS installer and `.deb` build in CI; package contains no scaffolding.
- [ ] Backups written on quit; export/import round-trips.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Origin / appId change orphans saves | Fixed scheme, pinned `userData`, frozen ids (§1) |
| Works on Windows, breaks on Debian (case, paths, line endings) | Case check, `path.join`, `.gitattributes`, CI on both |
| Can't build `.deb` on Windows | GitHub Actions ubuntu runner or WSL |
| DPI scaling softens the pixel look | Lock zoom, test scales on both OSes |
| Background throttling stalls the sim | `backgroundThrottling:false` |
| Storage corruption | Rolling backups |
| Removing the web build too early | Phase 5 gated on Phase 3 passing |

## 9. Signing and auto-update (explained)

- **Code signing** costs money (a certificate). Unsigned Windows installers show a
  blue "Windows protected your PC / unknown publisher" warning the first time;
  users click *More info -> Run anyway*. Debian `.deb` files don't need signing.
  Only matters if you give the app to other people.
- **Auto-update** means the app downloads and installs new versions by itself,
  which needs a server or GitHub Releases to host them. Without it, you
  reinstall manually to update.

Recommendation: neither for now. Both can be added later without changing saves,
as long as `appId` stays the same.

## 10. Progress log

**Phase 1 — done (baseline recorded on Linux/Node 22, pre-Electron)**
- VT323 bundled (`kernel/fonts.css`, `vendor/fonts/`, OFL license included); `index.html` no longer hits Google Fonts.
- `.gitattributes` added (LF everywhere, CRLF for `.bat`).
- `npm run check:paths` — every relative import / asset reference matches its file's exact case (533 references, 0 problems). It found one real bug: `standbattle` pointed its `icon` at a nonexistent `assets/images/standbattle.png`; set to `''` like the other apps.
- `npm run check:offline` — zero external requests, no page errors, font loads from the local copy. Before the change: one external request and the font did not load.
- Baseline, all passing: `lint-content`, `smoke` (takes ~10 minutes; do not wrap it in a short timeout), `bekkedal_furnish_check`, `bekkedal_savetest`, and all 12 `apps/**/*_check.js`.
- The browser-driven scripts expect a server on ports 3000/3001 until Phase 3 retargets them at Electron.

**Phase 2 — done (verified on Linux under Xvfb; not yet run on Windows or a real Debian desktop)**
- `electron/main.js`, `preload.cjs`, `protocol.js`, `resolve.js`. `npm start` now launches Electron; the old Express server remains as `npm run serve` until Phase 5.
- Origin `templeos://app/` (standard, secure, fetch-capable). Only `index.html`, `kernel/`, `apps/`, `assets/`, `vendor/` are served; `electron/`, `node_modules/`, `docs/`, `.git`, `package.json` and `%2e%2e` traversal all return 404 (`electron/resolve.js`, pure and unit-tested).
- `userData` pinned to `<appData>/Holytron` (`%APPDATA%\Holytron` on Windows, `~/.config/Holytron` on Linux) with the app name frozen; `HOLYTRON_USER_DATA` overrides it for tests only.
- Security: sandbox + context isolation, no Node in the renderer, preload exposes only `version` and `quit`, strict CSP (no `unsafe-eval`, scripts `'self'` only), navigation off-origin blocked, `window.open` denied, all permission requests refused, DevTools only when unpackaged (F12).
- Window: black background until ready, hidden menu, size/position/fullscreen remembered (off-screen positions discarded), F11 fullscreen, background throttling off, autoplay allowed, single-instance lock.
- `npm run check:shell` (run as `xvfb-run -a npm run check:shell` on Linux): 40 checks incl. boot from the fixed origin with no external requests or page errors, bundled font, seeded VFS, localStorage + IndexedDB surviving a relaunch, sandbox/CSP/navigation/popups. Stable 8/8 consecutive runs.
- Known gap: the zoom-lock check passes even with the lock code removed (with no menu there is no zoom accelerator and Xvfb ignores Ctrl+wheel), so it is a regression guard, not proof. Verify zoom by hand on Windows in Phase 3.
- Not done yet (still Phase 3/4): backups and Export/Import machine, DPI/pixel-diff checks, packaging.

**Phase 3 — done on Linux/Xvfb; still to repeat by hand on Windows and a real Debian desktop (see the end of this entry)**

How the "nothing is lost" gate was checked, and what came out:

| Plan item | Check | Result |
|---|---|---|
| 6. Existing suite against Electron | `scripts/lib/target.mjs` launches Electron (default) or the old web server (`HOLYTRON_TARGET=web`); `bekkedal_furnish_check` and `bekkedal_shots` now go through it. `smoke`, `bekkedal_playtest`, `bek_headless`, `lint-content` and all `*_check.js` are pure Node with a stubbed canvas, so they have no target and the Phase 1 baseline stands. `bekkedal_savetest` compares an old *web* build with the new one and stays web-only; it goes away with the web build in Phase 5, its job (old save loads into the new build) being covered by `check-persist`. | furnish check passes in Electron |
| 7. All 28 apps open / interact / close / reopen | `npm run check:apps`: real X button, twice per app, each in a freshly booted page; window/document listeners, intervals, rAF loops and timer chains are measured, not guessed. | 18 clean; 10 leak something on close. **Identical result on the old web build**, so none is an Electron regression. Listed with causes in `scripts/check-apps.known.json`; the check fails only on new problems. |
| 8. Pixel diff vs the browser | `bekkedal_shots` (92 canvas captures) run twice per target; `scripts/pngdiff.mjs` compares with the reference's own run-to-run noise as the allowance, plus a "no colours the reference never produced" test for antialiasing. | 71 identical, 21 differ only within run-to-run noise, 0 beyond it. Planted defects (global blur, a recoloured patch) are caught. |
| 9. Persistence | `npm run check:persist` | normal quit + relaunch: Bekkedal save byte-identical, same map and day. Hard kill (SIGKILL): IndexedDB always kept; localStorage (which `ctx.save` uses) is lost if the kill lands within ~1 s of the write, kept from 3 s on. |
| 10. Timing | `npm run check:perf` | Bekkedal clock 4.00 in-game min/s against 4 declared, so a day is 300 s, same as the web build. Frame rates match the web build (software-rendered Xvfb: 23-35 fps in both). |

Findings worth knowing:
- The machine's own output is not reproducible run to run, even in one browser: the dusk/night dither phase and the HUD clock (08:01 vs 08:02) depend on frame timing. That is why the pixel check compares against noise, skips the top 22 px HUD strip and works on 8x8 block means. Byte-comparison would have failed forever.
- Pre-existing app leaks (not touched, since this phase is about parity): `shop` is the only one with a loop that keeps running after close (`unmount()` cancels `this._raf` but the loop stores its id in a local); `notes`, `hifi`, `sweeper`, `solitaire`, `crayon`, `magen`, `cook` leave window/document listeners behind; `folder` and `garden` clean up lazily on their next event by design. The kernel itself leaves two `document` listeners per window ever opened (`wm.js` `createWindow`: `mousemove` + `mouseup`), which the check treats as the baseline.
- A crash can cost up to about 3 seconds of localStorage writes. Bekkedal autosaves every 6 s and on exit, so a crash costs at most the last few seconds of play; a graceful quit loses nothing. If that is too much, moving `ctx.save` onto IndexedDB (durable on commit) is the fix, and it would be a kernel change.

Run them: `xvfb-run -a -s "-screen 0 1920x1080x24" npm run check:shell` (and `check:apps`, `check:persist`, `check:perf`); on Windows just `npm run check:shell`. Pixel comparison: run `bekkedal_shots` twice per target into four folders, then `node scripts/pngdiff.mjs <webA> <electronA> --noiseA=<webB> --noiseB=<electronB>`.

**Not verified yet (needs a real display; I only had Xvfb):** 125% / 150% Windows scaling and Linux HiDPI (the likeliest place for the pixel look to soften), Ctrl+wheel zoom lock, real-GPU frame rate (target 60), audio output, F11 fullscreen, and a real Debian desktop (Wayland and X11). On Windows run `npm run check:shell`, `check:apps`, `check:persist`, `check:perf`, then look at the desktop and Bekkedal at your display scale.

**Phase 4 — Linux/Debian done and verified; Windows installer written but not built or run (needs a Windows machine, or the CI job)**

- `electron-builder.yml`: appId `com.holytron.dm640` and productName `Holytron` (frozen, with a comment saying why), `files` allowlist, NSIS for Windows (per-user, choose folder, **`deleteAppDataOnUninstall: false`** so an uninstall can never wipe saves), `.deb` for Debian. AppImage was dropped on purpose: it cannot use the setuid sandbox helper, and on Ubuntu 24+ the user-namespace restriction would stop the sandboxed renderer from starting. `electron` and `express` are devDependencies, so nothing from `node_modules` ships (the web server `express` only served the old build).
- `build/icon.png` + `build/icon.ico`, generated by `scripts/make-icon.mjs` in the machine's own VGA16 colours (a CRT with the yellow cross). It is a placeholder drawn by me; swap in your own art and rerun nothing, just replace the two files.
- `npm run pack` (unpacked), `npm run dist` / `dist:win` / `dist:linux` (installers, `--publish never`).
- `npm run check:package` (`scripts/check-package.mjs`, `scripts/lib/reach.mjs`): crawls everything the machine can load from `index.html` and proves **all 179 reachable files are in the asar**, and that no scaffolding got in (fix scripts, check dumps, the 1 MB scratch HTML, temp files, `server.js`, `scripts/`, `docs/`, markdown, lockfile, Bekkedal check scripts). It earned its keep: `apps/standbattle/fairness_check.js` looks like a dev check but is imported at runtime by `content_registry.js`, so a blanket `*_check*.js` exclusion would have broken Stand Battle; it is excluded by explicit name instead. Planted defects (a missing `boot.js`, a missing `fairness_check.js`, a stray `fix_all.cjs`, a stray `README.md`) are all caught. The asar is 196 files, 2.3 MB; the installer is about 100 MB because it carries Chromium.
- The checks now run against the built binary: `HOLYTRON_EXE=dist/linux-unpacked/holytron xvfb-run -a node scripts/check-shell.mjs` (also `check-persist`, `check-apps`). Packaged result: identical to the source tree (40/40 shell checks, persistence identical, 18 apps clean + the same 10 known leaks, 0 new).
- **Debian package, really installed** (Ubuntu 24.04 container, `dpkg -i` + `apt-get install -f` for its dependencies): installs to `/opt/Holytron`, adds `/usr/bin/holytron`, a `.desktop` launcher and the icon; its post-install script uses the kernel's user namespaces for the sandbox (setuid only where they are missing); launched **as an unprivileged user with the renderer sandbox on** (`--enable-sandbox`, no `--no-sandbox`) and booted to `templeos://app/index.html`; removing it leaves `~/.config/Holytron` alone.
- **A real finding, fixed:** the installed app tried to download a spell-check dictionary from `redirector.gvt1.com`. `spellcheck:false` on the window is not enough; the session needs `setSpellCheckerEnabled(false)` and no languages. `check-shell` now also records Chromium's own network log and fails if anything but loopback appears; it fails without the fix and passes with it. The installed app's network log is empty.
- `.github/workflows/build.yml`: matrix `windows-latest` (NSIS installer) and `ubuntu-latest` (`.deb`); runs paths, shell, persistence, apps, builds, checks the package, runs the shell and persistence checks against the *built* binary, installs the `.deb` and checks the launcher, then uploads the installers as artifacts. Not run yet: it only runs once pushed to GitHub.
- Windows, honestly: the unpacked Windows build (`dist/win-unpacked`, `Holytron.exe`) was produced here and its asar passes `check:package`, but the NSIS installer needs Wine to build on Linux (`spawn wine ENOENT`), so no Windows installer was built and no Windows binary was ever run. `check-persist` skips its power-cut scenario on Windows (no SIGKILL; orphaned children keep the profile locked).
- Deferred: code signing (unsigned Windows shows "unknown publisher" once), auto-update, and Electron fuses (disabling `RunAsNode` and the inspector would harden the binary, but Playwright drives Electron through the inspector, so enabling them would break the packaged-binary tests; revisit with a release-only build).

**Phase 5 — done (web build removed). Run on explicit request, ahead of the plan's own gate: Phase 3 had only been verified on Linux/Xvfb, and no Windows binary has ever been run. Do the Windows pass (the CI `windows-x64` job, or `npm run check:shell` etc. on your machine) before relying on a release.**

Removed (all recoverable from git history; the 1 MB original single-file monolith `big html file` was added in commit `5b50f3d`):
- The web build: `server.js`, `START.bat`, `start.sh`, `express`, the `serve` script, the `HOLYTRON_TARGET=web` mode of the test launcher, `scripts/check-offline.mjs` (superseded by `check-shell`'s network-log check) and `scripts/bekkedal_savetest.mjs` (it compared an old *web* build against the new one).
- Root scaffolding, each first confirmed unreferenced by anything real: 47 `fix_*.cjs`/`fix_hardware.js` one-off patch scripts, `analyze.js`, `bulk_port.cjs`, `extract_fs.cjs`, `full_extract.cjs` + `run_extract.sh`, `make_garden.sh`, `manual_fix.cjs`, `patch.cjs`, `patch_menu.cjs`, `temp_hooks.js`, `temp_js.js`, `test_browser.js`, the six `*_check.txt` dumps, and `metadata.json` (AI Studio hosting metadata).
- Kept: `style-meter-snippets.md` is design documentation `README.md` links to, so it moved to `docs/`. The dead-looking `apps/*_ext.js` and `apps/shop.js` stay: they are unreferenced by anything I could find but they are app code, not scaffolding, and removing them is a separate decision.
- The repo root is now: `.gitattributes .gitignore CLAUDE.md README.md electron-builder.yml index.html package.json package-lock.json`.

Updated: `README.md` (install and run instructions, where saves live, never rename the app/ID, how to check; the long design sections below are untouched and now carry a note that they describe the original single-file build), `CLAUDE.md` (Electron architecture, commands, the never-change rule, the `fairness_check.js` runtime-import warning), `apps/bekkedal/CLAUDE.md` (how to run it), script headers that described a web server.

One bug found by the cleanup itself: `check-paths` scanned the untracked `dist/` build folder, so it failed for anyone who had built once; it now skips `dist/` and `build/`.

Re-verified after the removal (Linux/Xvfb): `check:paths` 537 refs 0 problems; `lint-content`; all 12 `*_check.js`; `smoke` (full, ~10 min) 0 failures; `check:shell` 40/40; `check:persist`; `check:apps` 18 clean + 10 known, 0 new; `bekkedal_furnish_check`; `bekkedal_shots` (subset); `check:perf` clock 4.00 min/s; `npm run pack` + `check:package` (196 files, all reachable files present, none of the scaffolding) + the same shell checks against the packaged binary.

Still open: the Windows pass above; the 10 known app leaks (`scripts/check-apps.known.json`); placeholder icon and maintainer address; signing, auto-update, Electron fuses. `bekkedal_pairs.mjs` still composes its comparison images in a plain Chromium that Playwright must find, because it never ran the app itself.
