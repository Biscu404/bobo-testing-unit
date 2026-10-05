#!/usr/bin/env node
/* Does the real window keep the machine's timing?
     - frames per second delivered to requestAnimationFrame: idle desktop, with
       Stand Battle open, with Bekkedal open (hidden-window throttling would show here)
     - Bekkedal's in-game clock against BEK_CLOCK_MIN_PER_S, read off the save the
       game writes itself every 6 s (the same figure scripts/bekkedal_playtest.mjs
       derives a day length from: 06:00-02:00 = five real minutes)
   Run it from source or, with HOLYTRON_EXE=<binary>, against the packaged app:
     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-perf.mjs
   The fps floor is only meaningful on a machine with a real GPU: Xvfb renders in
   software, so there it is a sanity check, not a benchmark. */
import { launchTarget } from './lib/target.mjs';
import { BEK_CLOCK_MIN_PER_S } from '../apps/bekkedal/data.js';

const SECS = Number(process.env.PERF_SECS || 40);
const FLOOR = Number(process.env.PERF_FPS_FLOOR || 20);
const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1400, height: 900 } });
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} - ${m}`); if (!c) fails++; };
const errors = []; page.on('pageerror', e => errors.push(e.message));

await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { if (window.powerOn) window.powerOn(); });
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });

const fps = (ms = 4000) => page.evaluate((ms) => new Promise(res => {
  let n = 0, t0 = performance.now();
  (function f(ts) { n++; if (ts - t0 >= ms) res(Math.round(n * 1000 / (ts - t0))); else requestAnimationFrame(f); })(t0);
}), ms);
const win = async (id, sel) => {
  await page.evaluate((id) => import('/kernel/wm.js').then(m => m.openWindow(id)), id);
  await page.waitForSelector(sel, { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
};
const closeTop = () => page.evaluate(() => { const ws = [...document.querySelectorAll('.win')], w = ws[ws.length - 1]; w && w.querySelector('.x').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); });

const idle = await fps();
console.log(`[${t.kind}] idle desktop: ${idle} fps`);
await win('standbattle', '.win canvas');
const sb = await fps();
console.log(`[${t.kind}] Stand Battle open: ${sb} fps`);
await closeTop(); await page.waitForTimeout(500);
await win('bekkedal', 'canvas.bekcv');
const bk = await fps();
console.log(`[${t.kind}] Bekkedal open: ${bk} fps`);
ok(idle >= FLOOR && sb >= FLOOR && bk >= FLOOR, `every scene at or above ${FLOOR} fps`);

/* Bekkedal's clock: sample the autosave blob, take the slope between the first and last change */
const samples = [];
let last = null;
const t0 = Date.now();
while (Date.now() - t0 < SECS * 1000) {
  const v = await page.evaluate(() => { const b = localStorage.getItem('templeos.bekkedal.v2'); if (!b) return null; const s = JSON.parse(b); return { raw: b.length + ':' + s.day + ':' + s.min, day: s.day, min: s.min }; });
  if (v && v.raw !== last) { last = v.raw; samples.push({ t: Date.now(), abs: (v.day - 1) * 1440 + v.min }); }
  await page.waitForTimeout(200);
}
if (samples.length >= 3) {
  const a = samples[0], b = samples[samples.length - 1];
  const rate = (b.abs - a.abs) / ((b.t - a.t) / 1000);
  const pct = Math.abs(rate / BEK_CLOCK_MIN_PER_S - 1) * 100;
  console.log(`[${t.kind}] Bekkedal clock: ${rate.toFixed(2)} in-game min per real second (declared ${BEK_CLOCK_MIN_PER_S}), ${samples.length} samples over ${((b.t - a.t) / 1000).toFixed(0)} s`);
  ok(pct <= 5, `clock within 5% of the declared rate (${pct.toFixed(1)}% off => a 5-minute day measures ${(300 * BEK_CLOCK_MIN_PER_S / rate).toFixed(0)} s)`);
} else ok(false, `too few autosave samples (${samples.length})`);
ok(errors.length === 0, `no page errors ${errors.join(' | ')}`);
await t.close();
console.log(fails ? `${fails} FAILED` : 'PERF OK');
process.exit(fails ? 1 : 0);
