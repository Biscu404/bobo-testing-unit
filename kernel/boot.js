import { initVFS } from './vfs.js';
import { openWindow } from './wm.js';
import { Cos } from './cos.js';
import { initDesktop } from './desktop.js';
import { Saver } from './saver.js';
import { Hold } from './hold.js';
import { wireKonami } from './desktop.js';
import { initHardware, CRT } from './hardware.js';
import "./snd.js";
import "./economy.js";
import "./vault.js";
import "./drunk.js";
import { Music } from './music.js';
import { SunUI } from './economy.js';
import { MixerUI } from './mixer.js';
import { panic } from './panic.js';
import { runBootSequence, cancelBoot } from './bootseq.js';
import { wireCtxGuard } from './ctxguard.js';
window.Music = Music;

/* window.onerror is the closest a browser gets to a machine check */
window.addEventListener('error', e => {
  if (!e || !e.error) return;
  try { panic(e.error, 'ring 0'); } catch (x) {}
});
window.addEventListener('unhandledrejection', e => {
  try { panic(e.reason || new Error('rejected promise'), 'async fault'); } catch (x) {}
});

const PALETTE = ['#FFFF55','#55FF55','#55FFFF','#FF55FF','#FF5555','#FFFFFF','#5555FF'];

function drawWordmark() {
  const wm = document.getElementById('wordmark');
  if(!wm) return;
  'TempleOS'.split('').forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.dataset.i = i;
    wm.appendChild(s);
  });
  let t = 0;
  setInterval(() => {
    t++;
    wm.querySelectorAll('span').forEach((s, i) => {
      s.style.color = PALETTE[(i + t) % PALETTE.length];
    });
  }, 220);
}

let bootDone = false;
let booting = false;
let vfsReady = false;

/* ---- when was the machine last used? -------------------------------------
   A launch after eight hours away gets the long boot, and it cannot be
   skipped. "Last used" is a heartbeat, not a launch time: a machine left
   running for a week and closed a minute ago is not a cold one. */
const COLD_MS = 8 * 60 * 60 * 1000;
/* Kept in IndexedDB, not localStorage: Chromium commits the first localStorage
   write of a session quickly and throttles the next, so a stamp written at
   launch makes the *next* real save (a game's, a setting's) wait much longer
   to reach the disk. IndexedDB has no such queue. */
function seenDB() {
  return new Promise((res, rej) => {
    const q = indexedDB.open('templeos_meta', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('kv');
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function readSeen() {
  try {
    const db = await seenDB();
    return await new Promise(res => {
      const g = db.transaction('kv').objectStore('kv').get('lastseen');
      g.onsuccess = () => res(Number(g.result) || 0);
      g.onerror = () => res(0);
    });
  } catch (e) { return 0; }
}
function stampSeen() {
  seenDB().then(db => { db.transaction('kv', 'readwrite').objectStore('kv').put(Date.now(), 'lastseen'); }).catch(() => {});
}
/* the machine has been away if nothing was ever recorded, or the last mark
   is eight hours old. A mark from the future (a clock set back) is not away. */
let owesLongBoot = true;
const seenReady = readSeen().then(seen => {
  const now = Date.now();
  owesLongBoot = !seen || (seen <= now && now - seen >= COLD_MS);
  stampSeen();
});
setInterval(stampSeen, 5 * 60 * 1000);
window.addEventListener('pagehide', stampSeen);

/* ~ is the way in, and nothing else: a stray click or a held key on the way
   to somewhere else must not throw the splash away. */
const isEnterKey = ev => !ev.ctrlKey && !ev.metaKey && !ev.altKey &&
  (ev.key === '~' || ev.key === '`' || ev.code === 'Backquote');
function onEnterKey(ev) {
  if (!isEnterKey(ev) || ev.repeat) return;
  ev.preventDefault();
  dismissSplash();
}

function runBootLines() {
  bootDone = false;
  booting = true;
  document.removeEventListener('keydown', onEnterKey, true);
  const mode = owesLongBoot ? 'long' : 'quick';
  if (window.Music && window.Music.bootStart) window.Music.bootStart();
  runBootSequence(mode, () => {
    if (mode === 'long') owesLongBoot = false;      /* only a boot that finished counts */
    bootDone = true;
    booting = false;
    document.addEventListener('keydown', onEnterKey, true);
  });
}

window.runBoot = async function() {
  if (bootDone || booting) return;
  if (!vfsReady) { await initVFS(); vfsReady = true; }
  await seenReady;
  runBootLines();
};

/* Power cycle: the shell stays alive in the background so windows and
   state survive, but the splash + boot lines replay every time the set
   is switched back on, same as the physical thing. */
window.powerOff = function() {
  if (!CRT.on) return;
  CRT.on = false;
  document.removeEventListener('keydown', onEnterKey, true);
  cancelBoot();
  booting = false;
  bootDone = false;
  const lamp = document.getElementById('lamp');
  if (lamp) lamp.classList.remove('on');
  const screen = document.getElementById('screen');
  if (!screen) return;
  screen.classList.add('collapsing');
  setTimeout(() => {
    screen.classList.add('off');
    screen.classList.remove('collapsing');
  }, 270);
};

window.powerOn = function() {
  if (CRT.on) return;
  CRT.on = true;
  const screen = document.getElementById('screen');
  if (screen) screen.classList.remove('off', 'collapsing');
  const lamp = document.getElementById('lamp');
  if (lamp) lamp.classList.add('on');
  const shell = document.getElementById('shell');
  if (shell) shell.style.display = 'none';
  const sp = document.getElementById('splash');
  if (sp) sp.style.display = 'flex';
  window.runBoot();
  if (window.Snd && window.Snd.boot) window.Snd.boot();
};

let desktopBuilt = false;

function dismissSplash() {
  if (!bootDone) return;
  const sp = document.getElementById('splash');
  if (!sp || sp.style.display === 'none') return;
  if (!CRT.on) return;
  
  sp.style.display = 'none';
  document.getElementById('shell').style.display = 'block';
  document.removeEventListener('keydown', onEnterKey, true);
  
  if (window.Snd && window.Snd.wake) window.Snd.wake();
  /* leaving the lobby: from here the song is the LOBBY switch's business */
  if (window.Music && window.Music.bootEnd) window.Music.bootEnd();

  if (desktopBuilt) {
    if (window.Snd && window.Snd.ok) window.Snd.ok(); // coming back from a power cycle
    return;
  }
  desktopBuilt = true;
  if (window.Snd && window.Snd.ok) window.Snd.ok();
  initDesktop();
  try { SunUI.mount(); } catch(e) {}
  try { MixerUI.mount(); } catch(e) {}
  try { Hold.apply(); } catch(e) {}
  try { Saver.watch(); } catch(e) {}
  try { wireKonami(); } catch(e) {}
}

window._bootAt = Date.now();

/* boot.js is loaded by durable.js after a restore, so DOMContentLoaded may be behind us */
const start = () => {
  initHardware();
  wireCtxGuard();
  Cos.boot();
  drawWordmark();
  if (CRT.on) {
    document.getElementById('screen').classList.remove('off');
    const lamp = document.getElementById('lamp');
    if (lamp) lamp.classList.add('on');
    window.runBoot();
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
