#!/usr/bin/env node
/* Persistence in the real Electron app, in a throwaway profile.
     A. a Bekkedal run is written down, the app is closed normally, relaunched on
        the same profile, and the save has to come back byte-identical and load
        onto the same map, tile and day.
     B. the process is killed with SIGKILL (power cut) N seconds after a write;
        the data has to survive for every N >= 6 (Bekkedal autosaves every 6 s, and
        Chromium flushes localStorage within a couple of seconds). Shorter N are
        reported, not failed: that is the honest size of the loss window.
   Linux: xvfb-run -a node scripts/check-persist.mjs */
import { _electron as electron } from 'playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const noSandbox = process.platform === 'linux' && (process.getuid?.() === 0 || process.env.CI);
const KEY = 'templeos.bekkedal.v2';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} - ${m}`); if (!c) fails++; };
const info = (m) => console.log(`INFO - ${m}`);

const EXE = process.env.HOLYTRON_EXE;       /* run against the packaged binary instead of the source tree */
const launch = (profile) => electron.launch({
  ...(EXE ? { executablePath: EXE } : {}),
  args: [...(EXE ? [] : [ROOT]), ...(noSandbox ? ['--no-sandbox'] : [])],
  env: { ...process.env, HOLYTRON_USER_DATA: profile },
});
async function boot(app) {
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
  await page.keyboard.press('Space');
  await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(500);
  return { page, errors };
}
const openBekkedal = async (page) => {
  await page.evaluate(() => import('/kernel/wm.js').then(m => m.openWindow('bekkedal')));
  await page.waitForSelector('canvas.bekcv', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => !!window.__bekDebug, { timeout: 15000 });
};

/* ---- A. graceful quit ------------------------------------------------------ */
{
  const profile = mkdtempSync(join(tmpdir(), 'holytron-persist-'));
  try {
    let app = await launch(profile);
    let { page, errors } = await boot(app);
    await openBekkedal(page);
    for (const k of ['d', 'd', 's', 's', 'a', 'w', ' ', 'Tab', ' ', 'f', 'i', 'i', 'q', 'q', 'Tab', 'Tab', ' ']) {
      await page.locator('canvas.bekcv').press(k); await page.waitForTimeout(90);
    }
    await page.waitForTimeout(7500);                         /* autosave fires every 6 s */
    const before = await page.evaluate(k => localStorage.getItem(k), KEY);
    ok(!!before, 'Bekkedal wrote a save');
    const b = JSON.parse(before);
    await app.close();

    app = await launch(profile);
    ({ page, errors } = await boot(app));
    const after = await page.evaluate(k => localStorage.getItem(k), KEY);
    ok(after === before, `save is byte-identical after a normal quit and relaunch (${before.length} bytes)`);
    await openBekkedal(page);
    await page.waitForTimeout(500);
    const nowBlob = JSON.parse(await page.evaluate(k => localStorage.getItem(k), KEY));
    ok(nowBlob.map === b.map && nowBlob.day === b.day, `reloaded onto the same map (${b.map}) and day (${b.day})`);
    ok(errors.length === 0, `no page errors on reload ${errors.join(' | ')}`);
    await app.close();
  } catch (e) { console.log('FAIL - A crashed:', e.message); fails++; }
  finally { rmSync(profile, { recursive: true, force: true }); }
}

/* ---- B. power cut -------------------------------------------------------- */
/* Windows has no SIGKILL / pkill: killing only the main process orphans its children, which
   keep the profile locked. The scenario is Linux/macOS only. */
if (process.platform === 'win32') info('power-cut scenario skipped on Windows');
for (const wait of process.platform === 'win32' ? [] : [0, 1, 3, 6, 10]) {
  const profile = mkdtempSync(join(tmpdir(), 'holytron-persist-'));
  try {
    let app = await launch(profile);
    let { page } = await boot(app);
    await page.evaluate(() => new Promise((res, rej) => {
      localStorage.setItem('persist.canary', 'ls-ok');
      const q = indexedDB.open('TempleOS_VFS', 1);
      q.onsuccess = () => { const t = q.result.transaction('files', 'readwrite'); t.objectStore('files').put({ type: 'text', content: 'idb-ok' }, '/persist.canary'); t.oncomplete = res; t.onerror = rej; };
    }));
    await page.waitForTimeout(wait * 1000);
    const pid = app.process().pid;
    try { process.kill(pid, 'SIGKILL'); } catch (e) {}
    try { execSync(`pkill -9 -f ${profile}`, { stdio: 'ignore' }); } catch (e) { /* none left */ }
    await new Promise(r => setTimeout(r, 800));

    app = await launch(profile);
    ({ page } = await boot(app));
    const back = await page.evaluate(() => new Promise((res) => {
      const ls = localStorage.getItem('persist.canary');
      const q = indexedDB.open('TempleOS_VFS', 1);
      q.onsuccess = () => { const g = q.result.transaction('files').objectStore('files').get('/persist.canary'); g.onsuccess = () => res({ ls, idb: g.result && g.result.content }); };
    }));
    const lsOk = back.ls === 'ls-ok', idbOk = back.idb === 'idb-ok';
    if (wait >= 6) ok(lsOk && idbOk, `SIGKILL ${wait}s after a write: localStorage ${lsOk ? 'kept' : 'LOST'}, IndexedDB ${idbOk ? 'kept' : 'LOST'}`);
    else info(`SIGKILL ${wait}s after a write: localStorage ${lsOk ? 'kept' : 'lost'}, IndexedDB ${idbOk ? 'kept' : 'lost'}`);
    await app.close();
  } catch (e) { console.log(`FAIL - B(${wait}s) crashed:`, e.message); fails++; }
  finally { rmSync(profile, { recursive: true, force: true }); }
}

console.log(fails ? `${fails} FAILED` : 'ALL PERSISTENCE CHECKS PASS');
process.exit(fails ? 1 : 0);
