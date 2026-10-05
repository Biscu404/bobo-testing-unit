# Plan: Holytron DM-640 (TempleOS) as a standalone Electron app

Goal: ship the whole machine as a desktop app with **zero loss** — every app, every
saved game, every wallpaper/CRT/mixer setting, every file in the VFS, the
bit-exact 16-colour/no-antialiasing look, and the existing headless checks.

## 0. What the repo is today (facts that drive the plan)

- Pure static ES-module web app: `index.html` -> `kernel/boot.js` -> lazy
  `import()` per app via `kernel/registry.js` (28 apps). No bundler, no build step.
- Served by `server.js` (Express, port 3000) or `START.bat` / `start.sh`
  (`python -m http.server 3000`). Only runtime dep is `express`; dev dep `playwright`.
- **All user state is browser storage, scoped to the origin `http://localhost:3000`:**
  - IndexedDB `TempleOS_VFS` / store `files` (`kernel/vfs.js`, seeded from `assets/seed.json`)
  - IndexedDB `templeos.vault` (`kernel/vault.js`, blobs)
  - localStorage: `templeos.vfs.seedVersion`, `templeos.cosm`, `templeos.crt.v1`,
    `templeos.display.v1`, mixer key, sun/economy key, desktop icon positions,
    wallpaper key, and `app_<appId>_<key>` (everything `ctx.save` writes — Bekkedal
    saves, Stand Battle `run`/`meta`, Solitaire, Sweeper, Notes, Crayon, Cook, Hifi, Bottle, Magen)
- One external network dependency: Google Fonts `VT323` in `index.html`.
- Browser APIs in use: `AudioContext` (`snd.js`, `music.js`, `mixer.js`, Bekkedal,
  Stand Battle), `canvas` (integer-scaled, smoothing off), `URL.createObjectURL`
  (uploads in `desktop.js`, blobs in `vault.js`), `requestAnimationFrame`.
- Verification already exists: `scripts/smoke.mjs`, `bekkedal_*`, `lint-content.mjs`,
  `*_check.js` — headless Node/Playwright, so they keep working unchanged.
- Repo clutter at root (`fix_*.cjs`, `*_check.txt`, `big html file`, `temp_*.js`) is
  one-off migration scaffolding; it must not ship in the package.

## 1. The one real risk: storage origin

Electron's `file://` origin and a different port/protocol are **different
origins** from `http://localhost:3000`. If we just wrap the app, a user's
existing saves stay behind in their browser and the Electron app starts empty.
Everything else in this plan is routine; this is the part that must be done on
purpose.

Decisions:

1. **Pick one permanent origin and never change it.** Register a custom
   privileged scheme `templeos://app/` (`protocol.registerSchemesAsPrivileged`
   with `standard`, `secure`, `supportFetchAPI`, `corsEnabled`) and serve the
   repo through `protocol.handle`. Reasons: ES-module `import()` and
   `fetch('assets/seed.json')` need a real origin (they fail under `file://`),
   IndexedDB/localStorage persist per scheme+host, and there is no port to
   collide with. Fallback if a problem appears: loopback server on a fixed port
   bound to `127.0.0.1` — equally stable, but the port can be taken.
2. **Pin `userData`** (`app.setPath('userData', …/Holytron)`) so storage lives in
   a known folder and survives app updates and renames.
3. **Import path for existing browser data** (do this before cutting over):
   - Add a **"Export machine" / "Import machine"** feature (kernel-level, in the
     `display` or `account` app area, surfaced in the browser build first). It
     dumps *all* IndexedDB stores + *all* `templeos.*` / `app_*` localStorage keys
     to a single `.holytron.json` (blobs base64-encoded), and restores them.
     Versioned envelope: `{format:1, seedVersion, exportedAt, idb:{…}, ls:{…}}`.
   - Ship that into the **web build first**, so the user exports from the browser
     they play in today, then imports in Electron. No data is moved implicitly.
   - Import is additive-safe: it validates the envelope, writes to a temp copy,
     then swaps; it refuses a file with a newer `format` than it understands.
   - Keep `SEED_VERSION` logic as is; import sets `templeos.vfs.seedVersion`
     from the file so the patch-only seed migration still runs correctly.
4. **Backups in Electron:** on quit (and daily), write a rolling copy of the
   export to `userData/backups/` (keep last 5). Cheap insurance against profile
   corruption, which Chromium storage is not immune to.

## 2. Target layout

```
electron/
  main.js          # app lifecycle, window, protocol, menu, single-instance lock
  preload.js       # contextBridge: tiny, explicit API (see §4); no Node in renderer
  protocol.js      # templeos:// handler, path-traversal-safe, correct MIME types
  backup.js        # export/import + rolling backups (main side of §1.3/1.4)
  icons/           # .ico / .icns / .png generated from assets/images
vendor/fonts/VT323-Regular.woff2   # bundled; index.html @font-face -> local
```

The app source (`index.html`, `kernel/`, `apps/`, `assets/`) **stays where it is
and stays unmodified except for the font link and the export/import hook** — the
browser build keeps working, so `npm start` and every headless check are
untouched. Electron is an additional shell, not a fork.

`package.json` gains: `"main": "electron/main.js"`, scripts `electron`,
`dist`; devDeps `electron`, `electron-builder`. `express` stays for the web build.

## 3. Window and rendering fidelity

The look is the product (`VGA16`, no antialiasing, integer upscale), so:

- `BrowserWindow`: `backgroundColor:'#000000'`, `show:false` until
  `ready-to-show` (no white flash), `autoHideMenuBar`, min size = the CRT's
  native size. Remember bounds + fullscreen state in `userData/window.json`.
- Disable anything that would resample the canvas: keep `zoomFactor` locked to 1
  (`webPreferences.zoomFactor`, block `Ctrl +/-/0` zoom via
  `before-input-event`), and verify `devicePixelRatio` handling on 125%/150%
  Windows scaling and Retina macOS — this is the most likely place for a visible
  regression. `webPreferences.backgroundThrottling:false` so Bekkedal's
  clock/Stand Battle's 60 Hz fixed-step loop doesn't stall when occluded.
- Fullscreen (F11) via the window, plus honour the existing CRT/display settings.
- Audio: `autoplayPolicy:'no-user-gesture-required'` removes the browser
  "click first" requirement for `snd.js`/`music.js`; confirm the mixer's MUS/SFX
  knobs still gate the buses.
- GPU: leave hardware acceleration on; add `--disable-gpu` fallback only if a
  driver issue is reported (smoothing-off canvas is deterministic either way).

## 4. Security (keep the sandbox)

Apps must never touch `kernel/`, and the Electron shell shouldn't change that
trust model:

- `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`.
- `preload.js` exposes only: `holytron.exportMachine()`, `importMachine()`,
  `version`, `quit()`. Nothing is reachable from `ctx`, so the `ctx` API
  contract in `CLAUDE.md` is unchanged.
- CSP via the protocol handler: `default-src 'self'; img-src 'self' data: blob:;
  media-src 'self' blob:; style-src 'self' 'unsafe-inline'` — `unsafe-inline`
  is needed today (inline SVG data URIs / inline styles); tighten later, not now.
  No remote origins at all after the font is bundled.
- Deny `window.open`, block navigation off the app origin, deny all permission
  requests.

## 5. Things that need a native equivalent

| Browser behaviour today | Electron handling |
|---|---|
| Upload via `<input type=file>` + `createObjectURL` (`desktop.js`) | Works unchanged in Chromium; keep. |
| Blob download of saved art/exports | `will-download` -> native Save dialog, default dir = Documents/Holytron. |
| Google Fonts VT323 | Bundled `.woff2` + `@font-face`; works offline. |
| `START.bat` / `start.sh` | Kept for the web build; Electron installers replace them for end users. |
| Tab close / reload | Window close = unmount flow; confirm `unmount()` of every app runs on `beforeunload` so Bekkedal/Stand Battle flush saves (add an explicit flush on `before-quit` -> renderer `beforeunload`). |

## 6. Phased execution

**Phase 1 — Safety net (web build, no Electron yet)**
1. Add Export/Import machine (§1.3) to the kernel. Tests: round-trip a populated
   profile byte-for-byte (VFS files incl. blobs, vault, every `app_*` key).
2. Bundle VT323 locally; confirm no remaining network requests (Playwright
   `page.route('**/*', …)` fails on any non-local request).
3. Remove nothing; run the full headless suite to baseline.

**Phase 2 — Shell**
4. Add `electron/` + deps; custom protocol; pinned `userData`; security flags.
5. `npm run electron` boots straight to the desktop; same as `npm start` visually.

**Phase 3 — Parity verification (the "nothing is lost" gate)**
6. Run the existing suite *against the Electron renderer* by pointing the
   Playwright scripts at `templeos://app/` (Playwright's `_electron.launch`),
   not only the localhost server: `smoke.mjs`, `bekkedal_*`, `lint-content.mjs`,
   all `node apps/**/*_check.js` (these are pure Node and just keep passing).
7. Per-app manual/automated pass over all 28 registry entries: open, interact,
   close, reopen, no console errors, no leaked listeners (`unmount()` contract).
8. Visual diff: screenshot the desktop and a handful of apps (Bekkedal, Stand
   Battle, Solitaire, Hifi) in browser vs Electron at 100% / 125% / 150% DPI;
   pixel-compare, expect exact match. Check "no antialiasing" explicitly.
9. Persistence test: write data -> quit -> relaunch -> verify; then import an
   export taken from the real browser profile and compare against it.
10. Performance: Stand Battle holds 60 Hz sim; Bekkedal day-length measurement
    (`bekkedal_playtest.mjs`, five real minutes per day) still reads ~300 s.

**Phase 4 — Packaging**
11. `electron-builder`: NSIS (Windows, primary given `START.bat`), dmg (macOS),
    AppImage (Linux). `files` allowlist: `index.html`, `kernel/`, `apps/`,
    `assets/`, `vendor/`, `electron/` — excludes `fix_*.cjs`, `*_check.txt`,
    `big html file`, `temp_*`, `scripts/`, `docs/`, `node_modules` dev deps.
12. App id `com.holytron.dm640`, product name stable forever (it keys `userData`).
13. Code signing is optional for personal use; unsigned Windows builds trigger
    SmartScreen and unsigned macOS needs right-click-open. Decide before release.
14. Auto-update deferred; if added later, it must never touch `userData`.

**Phase 5 — Cut-over**
15. User exports from browser -> installs Electron build -> imports -> verifies
    Bekkedal save loads on the same tile and day (the savetest scenario).
16. Keep the web build working in-repo as the fallback and for CI.
17. Update `CLAUDE.md` / `README.md`: how to run the Electron build, the
    "never change the scheme/host/appId" rule, and the export/import procedure.

## 7. Acceptance checklist ("nothing lost")

- [ ] All 28 registry apps launch and close cleanly; every `unmount()` leaves no timers/listeners.
- [ ] Import of a real browser export restores VFS, vault, all `app_*` and `templeos.*` keys, verified by diff.
- [ ] Bekkedal save round-trips and reloads onto the same square; Stand Battle `run` and `meta` blobs intact.
- [ ] Zero network requests at runtime; works offline; font renders identically.
- [ ] Screenshots pixel-identical to the browser build at three DPI scales; no antialiasing.
- [ ] Audio plays without a click gesture; MUS/SFX knobs work.
- [ ] 60 Hz sim holds; Bekkedal day length unchanged.
- [ ] Existing headless suite green in both web and Electron runs.
- [ ] Rolling backups written on quit; kill -9 mid-session loses at most the last unflushed save.
- [ ] Installers build for each target; package contains no scaffolding files.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Origin change orphans saves | Fixed custom scheme + pinned `userData` + export/import done *first* (§1) |
| Chromium storage wiped/corrupted | Rolling JSON backups; never rely on storage alone |
| DPI scaling softens the pixel look | Lock zoom, test 125/150%, integer-scale in canvas already — verify in Phase 3 |
| Background throttling stalls the sim | `backgroundThrottling:false` |
| Renaming app/id later changes `userData` | Treat `appId`/`productName` as frozen; documented in `CLAUDE.md` |
| Bundle bloat from Electron | Accepted (~100 MB); app payload itself is ~1 MB + sources |

## 9. Open questions for you

1. Which OS(es) must ship first — Windows only, or macOS/Linux too?
2. Do you have existing saves in a browser you want carried over (decides how much of §1.3 is urgent)?
3. Should the web build stay supported long-term, or does Electron replace it?
4. Signed installers / auto-update now, or personal-use unsigned builds first?
