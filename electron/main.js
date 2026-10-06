/* Holytron DM-640 - Electron shell. The app itself (index.html, kernel/, apps/)
   is untouched; this file only hosts it. */
import { app, BrowserWindow, Menu, ipcMain, session, screen } from 'electron';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerScheme, handleScheme } from './protocol.js';
import { ORIGIN } from './resolve.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* FROZEN: appName decides where userData (and therefore every save) lives.
   Changing it orphans all saved data. HOLYTRON_USER_DATA is for tests only. */
app.setName('Holytron');
app.setPath('userData', process.env.HOLYTRON_USER_DATA || join(app.getPath('appData'), 'Holytron'));

/* No click-first gate for the Web Audio buses (snd.js, music.js). */
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

/* The app talks to nothing, so never probe for a proxy: on Windows Chromium otherwise
   looks up wpad:80 (proxy auto-discovery) at startup, an outbound request of its own. */
app.commandLine.appendSwitch('no-proxy-server');

registerScheme();

const gotLock = process.env.HOLYTRON_USER_DATA ? true : app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const STATE_FILE = () => join(app.getPath('userData'), 'window.json');
const MIN_W = 640, MIN_H = 480;

function loadState() {
  try {
    const s = JSON.parse(readFileSync(STATE_FILE(), 'utf8'));
    const ok = (n) => Number.isFinite(n);
    if (!ok(s.width) || !ok(s.height)) return {};
    /* drop a saved position that is no longer on any display */
    const onScreen = ok(s.x) && ok(s.y) && screen.getAllDisplays().some(d => {
      const b = d.workArea;
      return s.x < b.x + b.width - 40 && s.x + s.width > b.x + 40 && s.y >= b.y - 10 && s.y < b.y + b.height - 40;
    });
    return {
      width: Math.max(MIN_W, s.width), height: Math.max(MIN_H, s.height),
      ...(onScreen ? { x: s.x, y: s.y } : {}), fullscreen: s.fullscreen === true,
    };
  } catch (e) { return {}; }
}

function saveState(win, normal) {
  try {
    mkdirSync(app.getPath('userData'), { recursive: true });
    writeFileSync(STATE_FILE(), JSON.stringify({ ...normal, fullscreen: win.isFullScreen() }));
  } catch (e) { /* losing window geometry is harmless */ }
}

function createWindow() {
  const st = loadState();
  const win = new BrowserWindow({
    width: st.width || 1280, height: st.height || 800, x: st.x, y: st.y,
    minWidth: MIN_W, minHeight: MIN_H,
    backgroundColor: '#000000',
    show: false,
    autoHideMenuBar: true,
    title: 'Holytron DM-640',
    webPreferences: {
      preload: join(ROOT, 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,   /* Bekkedal's clock / Stand Battle's 60 Hz loop must not stall */
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  });

  /* remember the windowed bounds, so quitting from fullscreen restores them */
  let normal = win.getBounds();
  const track = () => { if (!win.isFullScreen() && !win.isMaximized() && !win.isMinimized()) normal = win.getBounds(); };
  win.on('resize', track); win.on('move', track);

  win.once('ready-to-show', () => { win.show(); if (st.fullscreen) win.setFullScreen(true); });

  /* Zoom is locked at 1: any resampling would soften the pixel look. */
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1);
    win.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {});
  });
  win.webContents.on('zoom-changed', () => { win.webContents.setZoomFactor(1); });
  win.webContents.on('before-input-event', (ev, input) => {
    if (input.type !== 'keyDown') return;
    /* Ctrl +/-/0 now reach the page: each window zooms itself (kernel/zoom.js).
       The browser's own page zoom stays locked, see zoom-changed below. */
    if (input.key === 'F11') { ev.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
    if (!app.isPackaged && input.key === 'F12') win.webContents.toggleDevTools();
  });

  /* Never leave the app origin; never open new windows. */
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (ev, url) => { if (!url.startsWith(ORIGIN + '/')) ev.preventDefault(); });

  win.on('close', () => saveState(win, normal));
  win.loadURL(`${ORIGIN}/index.html`);
  return win;
}

app.whenReady().then(() => {
  if (!gotLock) return;
  /* every permission request (camera, mic, geolocation, ...) is refused */
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  /* spellcheck:false on the window is not enough: Chromium still fetches a dictionary
     (en-us-*.bdic from redirector.gvt1.com) for the session. No languages, no download. */
  session.defaultSession.setSpellCheckerEnabled(false);
  session.defaultSession.setSpellCheckerLanguages([]);

  Menu.setApplicationMenu(null);
  ipcMain.on('holytron:version', (e) => { e.returnValue = app.getVersion(); });
  ipcMain.on('holytron:quit', () => app.quit());

  handleScheme(ROOT);
  createWindow();

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('second-instance', () => {
  const [w] = BrowserWindow.getAllWindows();
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
