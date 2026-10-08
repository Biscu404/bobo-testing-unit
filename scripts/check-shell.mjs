#!/usr/bin/env node
/* Electron shell check. Launches the real app (templeos://app/) in a throwaway
   profile and asserts: it boots with no page errors or external requests, runs
   from the fixed origin, saves survive a relaunch, the sandbox/CSP/navigation
   rules hold, and zoom stays locked. On Linux CI run it under xvfb-run; as root
   (containers) the Chromium sandbox is disabled for the test run only. */
import { _electron as electron } from 'playwright';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRequest } from '../electron/resolve.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = mkdtempSync(join(tmpdir(), 'holytron-test-'));
const noSandbox = process.platform === 'linux' && (process.getuid?.() === 0 || process.env.CI);
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} - ${m}`); if (!c) fails++; };

/* ---- 1. URL -> file mapping, plain Node ---------------------------------- */
{
  const r = (u) => resolveRequest(u, ROOT);
  ok(r('templeos://app/')?.endsWith('index.html'), 'root serves index.html');
  ok(r('templeos://app/kernel/boot.js')?.endsWith('boot.js'), 'kernel files are served');
  ok(r('templeos://app/vendor/fonts/VT323-latin.woff2') !== null, 'vendored font is served');
  for (const bad of ['electron/main.js', 'node_modules/electron/package.json', 'package.json',
    '%2e%2e/etc/passwd', 'kernel/%2e%2e/%2e%2e/etc/passwd', 'kernel/..%2f..%2fpackage.json', '.git/config', 'docs/electron-migration-plan.md'])
    ok(r(`templeos://app/${bad}`) === null, `refused: ${bad}`);
  ok(r('templeos://evil/index.html') === null, 'wrong host refused');
  ok(r('http://app/index.html') === null, 'wrong scheme refused');
}

/* HOLYTRON_EXE=<path to the packaged binary> runs the same checks against the built app */
const EXE = process.env.HOLYTRON_EXE;
/* the first launch also writes Chromium's own network log, so requests made by the browser
   process (dictionary downloads, updater pings...) are caught, not just the page's */
const NETLOG = join(profile, 'net.json');
const launch = (netlog) => electron.launch({
  ...(EXE ? { executablePath: EXE } : {}),
  args: [...(EXE ? [] : [ROOT]), ...(noSandbox ? ['--no-sandbox'] : []), ...(netlog ? [`--log-net-log=${NETLOG}`, '--net-log-capture-mode=Everything'] : [])],
  env: { ...process.env, HOLYTRON_USER_DATA: profile },
});

async function boot(app) {
  const page = await app.firstWindow();
  const external = [], errors = [];
  page.on('request', (q) => { const u = q.url(); if (!/^(templeos:|data:|blob:)/.test(u)) external.push(u); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForFunction(() => typeof window.powerOn === 'function'); await page.evaluate(() => window.powerOn());
  await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });   /* added in the same step as the key listener */
  await page.keyboard.press('Backquote');        /* the boot screen waits for ~, and nothing else */
  await page.waitForSelector('#icons .icon', { timeout: 30000 });
  await page.waitForTimeout(1500);
  return { page, external, errors };
}

try {
  /* ---- 2. first launch ---------------------------------------------------- */
  let app = await launch(true);
  let { page, external, errors } = await boot(app);
  ok(page.url().startsWith('templeos://app/'), `runs from the fixed origin (${page.url()})`);
  ok(external.length === 0, `no external requests ${external.join(' ')}`);
  ok(errors.length === 0, `no page errors ${errors.join(' | ')}`);
  ok(await page.evaluate(() => document.fonts.check('16px VT323') && [...document.fonts].some(f => f.family.includes('VT323') && f.status === 'loaded')), 'VT323 loaded from the bundle');
  ok(await page.evaluate(() => isSecureContext), 'secure context (IndexedDB / AudioContext available)');

  const sec = await page.evaluate(() => ({
    require: typeof require, process: typeof process, Buffer: typeof Buffer,
    bridge: Object.keys(window.holytron || {}).sort().join(','), version: window.holytron?.version,
  }));
  ok(sec.require === 'undefined' && sec.process === 'undefined' && sec.Buffer === 'undefined', 'no Node globals in the renderer');
  ok(sec.bridge === 'quit,version' && /^\d+\.\d+\.\d+/.test(sec.version), `bridge exposes only quit + version (${sec.bridge} v${sec.version})`);

  const csp = await page.evaluate(async () => (await fetch('index.html')).headers.get('content-security-policy'));
  ok(/script-src 'self'/.test(csp || '') && !/unsafe-eval/.test(csp || ''), 'CSP header present, no unsafe-eval');
  const leak = await page.evaluate(async () => (await fetch('electron/main.js')).status);
  ok(leak === 404, `electron/ is not served (status ${leak})`);
  ok(await page.evaluate(async () => (await fetch('assets/seed.json')).ok), 'assets/seed.json is served');

  /* navigation / popups */
  await page.evaluate(() => { location.href = 'https://example.com/'; }).catch(() => {});
  await page.waitForTimeout(500);
  ok(page.url().startsWith('templeos://app/'), 'navigation off the app origin is blocked');
  const popups = await page.evaluate(() => { const w = window.open('https://example.com/'); return w === null; });
  ok(popups, 'window.open is denied');
  ok(app.windows().length === 1, 'still exactly one window');

  /* zoom lock: real input events through the browser pipeline, then read the zoom back */
  const zoom = await app.evaluate(async ({ BrowserWindow }) => {
    const wc = BrowserWindow.getAllWindows()[0].webContents;
    for (const keyCode of ['=', '-', '0']) {
      wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: ['control'] });
      wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: ['control'] });
    }
    /* Ctrl+wheel / pinch is the zoom path that exists even with no menu */
    for (const deltaY of [-120, -120, -120]) {
      wc.sendInputEvent({ type: 'mouseWheel', x: 200, y: 200, deltaX: 0, deltaY, modifiers: ['control'], canScroll: true });
    }
    await new Promise(r => setTimeout(r, 300));
    return { factor: wc.getZoomFactor(), level: wc.getZoomLevel() };
  });
  ok(zoom.factor === 1 && zoom.level === 0, `zoom still 100% after Ctrl +/-/0 and Ctrl+wheel (factor ${zoom.factor})`);

  /* seeded VFS + write a canary into both stores */
  const vfsCount = await page.evaluate(() => new Promise((res, rej) => {
    const q = indexedDB.open('TempleOS_VFS', 1);
    q.onsuccess = () => { const c = q.result.transaction('files').objectStore('files').count(); c.onsuccess = () => res(c.result); c.onerror = rej; };
    q.onerror = rej;
  }));
  ok(vfsCount > 0, `VFS seeded from assets/seed.json (${vfsCount} entries)`);
  await page.evaluate(() => new Promise((res, rej) => {
    localStorage.setItem('shellcheck.canary', 'ls-ok');
    const q = indexedDB.open('TempleOS_VFS', 1);
    q.onsuccess = () => { const t = q.result.transaction('files', 'readwrite'); t.objectStore('files').put({ type: 'text', content: 'idb-ok' }, '/shellcheck.canary'); t.oncomplete = res; t.onerror = rej; };
  }));
  await app.close();

  /* Chromium's own log: nothing may have left the machine */
  try {
    const raw = readFileSync(NETLOG, 'utf8');
    const log = JSON.parse(raw);
    const hosts = new Set();
    for (const e of log.events || []) {
      const p = e.params || {};
      for (const k of ['url', 'original_url']) if (typeof p[k] === 'string') { try { const u = new URL(p[k]); if (/^https?:|^wss?:/.test(u.protocol)) hosts.add(u.host); } catch (x) {} }
      if (typeof p.host === 'string' && !/^(templeos|app|localhost|127\.0\.0\.1|\[::1\])/.test(p.host.replace(/^https?:\/\//, ''))) hosts.add(p.host);
    }
    const remote = [...hosts].filter(h => !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(h));
    ok(remote.length === 0, `Chromium's network log shows no outbound hosts${remote.length ? ': ' + remote.join(', ') : ''}`);
  } catch (e) { ok(false, `network log unreadable (${e.message})`); }

  /* ---- 3. relaunch, same profile ----------------------------------------- */
  app = await launch();
  ({ page, errors } = await boot(app));
  const back = await page.evaluate(() => new Promise((res) => {
    const ls = localStorage.getItem('shellcheck.canary');
    const q = indexedDB.open('TempleOS_VFS', 1);
    q.onsuccess = () => { const g = q.result.transaction('files').objectStore('files').get('/shellcheck.canary'); g.onsuccess = () => res({ ls, idb: g.result && g.result.content }); };
  }));
  ok(back.ls === 'ls-ok' && back.idb === 'idb-ok', 'localStorage + IndexedDB survive a relaunch');
  ok(errors.length === 0, 'no page errors on relaunch');
  await app.close();

  ok(existsSync(join(profile, 'window.json')), 'window state written on close');
  if (existsSync(join(profile, 'window.json'))) {
    const w = JSON.parse(readFileSync(join(profile, 'window.json'), 'utf8'));
    ok(w.width >= 640 && w.height >= 480, `window state sane (${w.width}x${w.height})`);
  }
} catch (e) {
  console.log('FAIL - shell check crashed:', e.message);
  fails++;
} finally {
  rmSync(profile, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : 'ALL SHELL CHECKS PASS');
process.exit(fails ? 1 : 0);
