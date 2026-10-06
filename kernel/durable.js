/* localStorage that survives a power cut.

   Chromium writes localStorage to disk on its own schedule: the first write of
   a session within about five seconds, and a later one after a delay that grew
   past ten seconds in testing. Pull the plug in that window and a game's
   autosave is simply gone, which for a machine full of saves is the wrong
   trade. IndexedDB has no such queue, so every localStorage write is mirrored
   there a moment later, and at start-up the mirror (always at least as fresh as
   the disk copy) is put back before anything reads a setting.

   This is the page's first script: it restores, patches Storage, then loads
   boot.js, so nothing that reads localStorage at import time sees a stale copy. */
const DB = 'templeos_ls', STORE = 'kv';
const open = () => new Promise((res, rej) => {
  const q = indexedDB.open(DB, 1);
  q.onupgradeneeded = () => q.result.createObjectStore(STORE);
  q.onsuccess = () => res(q.result);
  q.onerror = () => rej(q.error);
});

let db = null;
const pending = new Map();          /* key -> value, or null for a delete */
let wipe = false, timer = null;

function flush() {
  timer = null;
  if (!db) return;
  const batch = [...pending], doWipe = wipe;
  pending.clear(); wipe = false;
  try {
    const tx = db.transaction(STORE, 'readwrite'), os = tx.objectStore(STORE);
    if (doWipe) os.clear();
    batch.forEach(([k, v]) => { if (v === null) os.delete(k); else os.put(v, k); });
  } catch (e) {}
}
const queue = (k, v) => { pending.set(k, v); if (!timer) timer = setTimeout(flush, 120); };

async function restore() {
  db = await open();
  const all = await new Promise((res, rej) => {
    const out = {}, q = db.transaction(STORE).objectStore(STORE).openCursor();
    q.onsuccess = () => { const c = q.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
    q.onerror = () => rej(q.error);
  });
  const keys = Object.keys(all);
  if (keys.length) {
    keys.forEach(k => { try { if (localStorage.getItem(k) !== all[k]) localStorage.setItem(k, all[k]); } catch (e) {} });
  } else {
    /* the first run with this: adopt whatever the disk copy already holds */
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); queue(k, localStorage.getItem(k)); }
  }
}

function install() {
  const P = Storage.prototype, set = P.setItem, rem = P.removeItem, clr = P.clear;
  P.setItem = function (k, v) { set.call(this, k, v); if (this === window.localStorage) queue(String(k), String(v)); };
  P.removeItem = function (k) { rem.call(this, k); if (this === window.localStorage) queue(String(k), null); };
  P.clear = function () { clr.call(this); if (this === window.localStorage) { pending.clear(); wipe = true; if (!timer) timer = setTimeout(flush, 120); } };
  window.addEventListener('pagehide', flush);
}

try { await restore(); install(); } catch (e) { /* no IndexedDB: plain localStorage, as before */ }
await import('./boot.js');
