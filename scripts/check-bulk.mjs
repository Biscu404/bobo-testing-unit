#!/usr/bin/env node
/* Two hundred files at once. Pasting a game onto the desktop two hundred times and then deleting the lot is what
   a style meter pushed to the top asks of this machine, so it has to be quick:
     - paste 200 copies (Ctrl+V held down) - each used to ask the folder about every name it had already given out
     - the desktop draws them all, once each, with its icons kept from one drawing to the next
     - delete all of them in one go: one move to the bin, one pile for the meter, one redraw
     - Ctrl+Z puts the whole pile back
   Budgets are generous (a software-rendered CI box): the old code took 20+ seconds for each of these.
     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-bulk.mjs */
import { launchTarget } from './lib/target.mjs';

const N = Number(process.env.BULK_N || 200);
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

const icons = () => page.evaluate(() => document.querySelectorAll('#icons .icon').length);
const before = await icons();

const paste = await page.evaluate(async N => {
  const { fs } = await import('/kernel/vfs.js');
  const f = await import('/kernel/fileops.js');
  const game = (await fs.list('::')).find(x => x.type === 'app');
  f.copyPaths(['::/' + game.name], false);
  const t0 = performance.now();
  for (let i = 0; i < N; i++) await f.pasteInto('::');
  return { ms: performance.now() - t0, game: game.name };
}, N);
ok(paste.ms < 15000, `${N} pastes took ${(paste.ms / 1000).toFixed(1)} s (budget 15 s; each used to cost more than the one before it)`);
await page.waitForFunction(([n, b]) => document.querySelectorAll('#icons .icon').length >= n + b, [N, before], { timeout: 15000 });
ok((await icons()) === before + N, `the desktop shows all ${before + N} icons`);
const names = await page.evaluate(() => [...document.querySelectorAll('#icons .icon')].map(n => n.dataset.name));
ok(new Set(names).size === names.length, 'and every one has a name of its own (' + names.slice(-2).join(', ') + ')');

/* no two icons share a cell unless the desk is full */
const spots = await page.evaluate(() => {
  const d = document.getElementById('desktop'), cols = Math.floor((d.clientWidth - 8) / 84), rows = Math.floor((d.clientHeight - 8) / 78);
  const seen = new Map(); [...document.querySelectorAll('#icons .icon')].forEach(n => { const k = Math.round((n.offsetLeft - 8) / 84) + ',' + Math.round((n.offsetTop - 8) / 78); seen.set(k, (seen.get(k) || 0) + 1); });
  return { cells: cols * rows, used: seen.size, icons: seen.size && [...seen.values()].reduce((a, b) => a + b, 0) };
});
ok(spots.used >= Math.min(spots.cells, spots.icons) - 1, `the icons fill the grid (${spots.used} of ${spots.cells} cells) instead of landing on one another`);

/* the meter is not hit once per file */
const del = await page.evaluate(async () => {
  const { fs } = await import('/kernel/vfs.js');
  const f = await import('/kernel/fileops.js');
  const { Style } = await import('/kernel/style.js');
  const all = (await fs.list('::')).filter(x => / \(\d+\)/.test(x.name)).map(x => '::/' + x.name);
  const t0 = performance.now();
  const n = await f.deletePaths(all);
  return { n, ms: performance.now() - t0, tier: Style.tier, said: document.querySelector('#sm-log') ? document.querySelector('#sm-log').textContent : '' };
});
ok(del.n === N && del.ms < 8000, `deleting all ${del.n} took ${(del.ms / 1000).toFixed(2)} s (budget 8 s)`);
ok(del.tier >= 5, `the pile reads as a pile: the meter is at rank ${del.tier} (${del.said.replace(/\s+/g, ' ').trim().slice(0, 50)})`);
await page.waitForFunction(n => document.querySelectorAll('#icons .icon').length <= n, before, { timeout: 15000 });
ok((await icons()) === before, 'the desktop is back to its own icons');

const undo = await page.evaluate(async () => {
  const f = await import('/kernel/fileops.js');
  const t0 = performance.now();
  await f.undoDelete();
  return performance.now() - t0;
});
await page.waitForFunction(([n, b]) => document.querySelectorAll('#icons .icon').length >= n + b, [N, before], { timeout: 15000 });
ok((await icons()) === before + N && undo < 8000, `Ctrl+Z puts all ${N} back in one go (${(undo / 1000).toFixed(2)} s)`);

ok(errors.length === 0, `no page errors ${errors.join(' | ')}`);
await t.close();
console.log(fails ? `${fails} FAILED` : 'BULK OK');
process.exit(fails ? 1 : 0);
