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
