#!/usr/bin/env node
/* The listener cleanup must not cost behaviour: while a window is OPEN the window/document
   listeners it owns still have to work, and only closing may remove them.
     - crayon: a drag draws, mouseup ends the stroke (a later move draws nothing)
     - folder: a 'vfs-changed' for its directory redraws the open window
   Run: xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-listeners.mjs */
import { launchTarget } from './lib/target.mjs';

const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1400, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} - ${m}`); if (!c) fails++; };

await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function'); await page.evaluate(() => window.powerOn());
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });
const open = (id, args = {}) => page.evaluate(([id, a]) => import('/kernel/wm.js').then(m => m.openWindow(id, a)), [id, args]);
const closeTop = () => page.evaluate(() => { const ws = [...document.querySelectorAll('.win')], w = ws[ws.length - 1]; w.querySelector('.x').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); });

/* ---- crayon ---- */
await open('crayon');
await page.waitForSelector('.drawroot canvas', { state: 'visible' });
const cv = page.locator('.drawroot canvas').last();
const box = await cv.boundingBox();
const ink = () => cv.evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 600 && d[i + 3] > 0) n++; return n; });
const blank = await ink();
await page.mouse.move(box.x + 60, box.y + 60);
await page.mouse.down();
await page.mouse.move(box.x + 200, box.y + 120, { steps: 8 });
await page.mouse.move(box.x + 300, box.y + 200, { steps: 8 });
await page.mouse.up();
const drawn = await ink();
ok(drawn - blank > 500, `crayon: dragging draws a real stroke, not just the press dot (${blank} -> ${drawn} inked pixels)`);
await page.mouse.move(box.x + 100, box.y + 300, { steps: 6 });     /* button is up: must not draw */
await page.mouse.move(box.x + 350, box.y + 320, { steps: 6 });
ok(await ink() === drawn, 'crayon: mouseup ended the stroke (moving afterwards draws nothing)');
await closeTop(); await page.waitForTimeout(400);

/* ---- folder ---- */
await open('folder', { path: '::/Demo' });
await page.waitForTimeout(600);
const names = () => page.evaluate(() => { const ws = [...document.querySelectorAll('.win')]; return ws[ws.length - 1].innerText; });
const before = await names();
await page.evaluate(async () => {
  const { fs } = await import('/kernel/vfs.js');
  await fs.write('::/Demo/ZZLISTENER.TXT', 'x', { type: 'text' }).catch(() => fs.write('::/Demo/ZZLISTENER.TXT', 'x'));
  window.dispatchEvent(new CustomEvent('vfs-changed', { detail: { dir: '::/Demo' } }));
});
await page.waitForTimeout(700);
const after = await names();
ok(!/ZZLISTENER/.test(before) && /ZZLISTENER/i.test(after), 'folder: vfs-changed redraws the open window');
await closeTop();

ok(errors.length === 0, `no page errors ${errors.join(' | ')}`);
await t.close();
console.log(fails ? `${fails} FAILED` : 'LISTENER BEHAVIOUR OK');
process.exit(fails ? 1 : 0);
