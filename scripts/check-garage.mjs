#!/usr/bin/env node
/* The Garage, driven the way a person drives it: notes drawn, dragged, resized, boxed, copied,
   pasted, a stretch of song picked on the ruler and pasted elsewhere, undo and redo, the drum kit
   as a step sequencer, the velocity lane, the right button, recording from the keys, the
   mixer, and the export dialog. (The note and segment logic itself is held by
   apps/garage/edit_check.js in plain Node; this is the screen on top of it.)

     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-garage.mjs */
import { launchTarget } from './lib/target.mjs';

const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { if (window.powerOn) window.powerOn(); });
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(600);

let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + m); };

await page.evaluate(() => { window.__garageTest = {}; localStorage.setItem('app_garage_seen', '2'); });
await page.evaluate(async () => { const wm = await import('/kernel/wm.js'); await wm.openWindow('garage'); });
await page.waitForSelector('.garage .g-grid', { timeout: 8000 });
await page.waitForTimeout(800);
await page.evaluate(async () => { const wm = await import('/kernel/wm.js'); wm.openWins[wm.openWins.length - 1].setFull(true); });
await page.waitForTimeout(500);

const st = () => page.evaluate(() => { const { G } = window.__garageTest; const tr = G.song.tracks[G.sel]; return { notes: (tr.notes || []).map(n => n.map(x => +x.toFixed(3))), hits: (tr.hits || []).map(h => [h[0], h[1], h[2]]), sel: G.items.size, range: G.range && [G.range.a, G.range.b], cursor: G.cursor, tool: G.tool, bars: G.song.bars }; });
const geo = () => page.evaluate(() => { const { grid } = window.__garageTest, v = grid.view(), r = document.querySelector('.g-grid').getBoundingClientRect(); return { left: r.left, top: r.top, GUT: 78, pxb: v.pxb, sx: v.scrollX, sy: v.scrollY, rowTop: v.top, rowH: v.rowH, rows: v.rows, velTop: v.velTop }; });
let g;
const X = b => g.left + g.GUT + (b - g.sx) * g.pxb;
const Y = midi => g.top + g.rowTop + (g.rows.indexOf(midi) - g.sy + 0.5) * g.rowH;

await page.evaluate(() => { const { api, grid } = window.__garageTest; api.G.magic = false; api.changed('view'); grid.centreOn(); });
await page.waitForTimeout(250);
g = await geo();
/* the notes */
await page.mouse.move(X(0.1), Y(60)); await page.mouse.down(); await page.mouse.move(X(1.5), Y(60), { steps: 6 }); await page.mouse.move(X(2.1), Y(60), { steps: 4 }); await page.mouse.up();
let s = await st(); ok(s.notes.length === 1 && s.notes[0][0] === 0 && Math.abs(s.notes[0][1] - 2) < 0.01, 'dragging in DRAW puts down one note and makes it as long as the drag');
await page.mouse.click(X(2.1), Y(64)); s = await st(); ok(s.notes.length === 2 && s.notes[1][2] === 64, 'a click puts a note on the grid');
await page.mouse.click(X(1), Y(60)); s = await st(); ok(s.notes.length === 2 && s.sel === 1, 'clicking a note selects it and takes nothing away');
await page.mouse.move(X(0.5), Y(60)); await page.mouse.down(); await page.mouse.move(X(2), Y(62), { steps: 8 }); await page.mouse.up();
s = await st(); ok(s.notes.some(n => n[0] === 1.5 && n[2] === 62), 'dragging a note moves it in time and pitch');
const endX = X(3.5); await page.mouse.move(endX - 2, Y(62)); await page.mouse.down(); await page.mouse.move(endX + g.pxb, Y(62), { steps: 6 }); await page.mouse.up();
s = await st(); ok(s.notes.some(n => n[2] === 62 && Math.abs(n[1] - 3) < 0.01), 'dragging its right edge makes it longer');
await page.keyboard.press('2');
await page.mouse.move(X(0.2), Y(70)); await page.mouse.down(); await page.mouse.move(X(5), Y(56), { steps: 8 }); await page.mouse.up();
s = await st(); ok(s.tool === 'select' && s.sel === 2, 'SELECT and a dragged box pick the notes inside it');
await page.keyboard.press('Control+c'); await page.mouse.click(X(8), g.top + 10);
s = await st(); ok(Math.abs(s.cursor - 8) < 0.3, 'a click on the ruler puts the cursor there');
await page.keyboard.press('Control+v'); s = await st(); ok(s.notes.length === 4 && s.notes.some(n => n[0] === 8) && s.sel === 2, 'paste puts the copies at the cursor and selects them');
await page.keyboard.press('Control+z'); s = await st(); ok(s.notes.length === 2, 'undo takes the paste back');
await page.keyboard.press('Control+y'); s = await st(); ok(s.notes.length === 4, 'redo puts it back');
await page.keyboard.press('Control+a'); await page.keyboard.press('Control+d'); s = await st(); ok(s.notes.length === 8, 'duplicate copies the selection straight after itself');
await page.keyboard.press('Delete'); s = await st(); ok(s.notes.length === 4, 'delete takes the selected away');
/* a stretch of song */
await page.mouse.move(X(0), g.top + 10); await page.mouse.down(); await page.mouse.move(X(2), g.top + 10, { steps: 5 }); await page.mouse.move(X(4), g.top + 10, { steps: 5 }); await page.mouse.up();
s = await st(); ok(s.range && s.range[0] === 0 && s.range[1] === 4, 'dragging along the ruler picks a stretch of song');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.g-seg')).display === 'flex'), 'and the strip of things to do with it appears');
await page.keyboard.press('Control+c'); g = await geo();
await page.mouse.click(X(12), g.top + 10); await page.keyboard.press('Control+v');
s = await st(); ok(s.notes.filter(n => n[0] >= 12).length === 2, 'a copied stretch pastes where the cursor is');
await page.evaluate(() => { const { api } = window.__garageTest; api.setRange(null); });
/* drums, velocity, the right button */
await page.keyboard.press('1');
await page.evaluate(() => { const { api, G } = window.__garageTest; G.song.tracks.push(api.lang.newTrack({ name: 'KIT', inst: 'drums', hits: [] })); api.selectTrack(G.song.tracks.length - 1, true); });
await page.waitForTimeout(300); g = await geo();
const Yk = key => g.top + g.rowTop + (g.rows.indexOf(key) - g.sy + 0.5) * g.rowH;
for (const b of [0, 1, 2, 3]) await page.mouse.click(X(b + 0.05), Yk('kick'));
s = await st(); ok(s.hits.length === 4, 'on the drum kit a click switches a cell on');
await page.mouse.click(X(1.05), Yk('kick')); s = await st(); ok(s.hits.length === 3, 'and clicking one that is on switches it off');
await page.mouse.move(X(4.05), Yk('hat')); await page.mouse.down(); await page.mouse.move(X(7.05), Yk('hat'), { steps: 12 }); await page.mouse.up();
s = await st(); ok(s.hits.filter(h => h[1] === 'hat').length >= 8, 'dragging across a row paints hits');
await page.mouse.move(X(0) + 2, g.top + g.velTop + 10); await page.mouse.down(); await page.mouse.move(X(0) + 2, g.top + g.velTop + 45, { steps: 5 }); await page.mouse.up();
s = await st(); ok(s.hits.find(h => h[0] === 0 && h[1] === 'kick')[2] < 0.5, 'dragging in the velocity lane changes how hard a hit is');
await page.mouse.click(X(0.05), Yk('kick'), { button: 'right' }); s = await st(); ok(!s.hits.some(h => h[0] === 0 && h[1] === 'kick'), 'the right button erases');
/* recording, the desk, export */
await page.evaluate(() => { const { api } = window.__garageTest; api.selectTrack(0, true); window.Studio.turnUp(6); });
await page.evaluate(() => document.querySelector('.g-rec').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
await page.waitForTimeout(1200);
await page.keyboard.down('a'); await page.waitForTimeout(250); await page.keyboard.up('a'); await page.waitForTimeout(300);
const before = (await page.evaluate(() => window.__garageTest.G.song.tracks[0].notes.length));
ok(before >= 5, 'recording keeps what is played on the keys (' + before + ' notes on the track now)');
await page.evaluate(() => window.__garageTest.stop());
await page.keyboard.press('Tab'); await page.waitForTimeout(400);
ok((await page.$$('.g-strip')).length >= 3 && !!(await page.$('.g-spec')), 'the mixer shows a strip for every track, a master and the spectrum');
await page.evaluate(() => window.__garageTest.api.exportDialog()); await page.waitForTimeout(300);
ok(!!(await page.$('.g-export')), 'the export dialog opens');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
await t.close();
console.log(fails ? fails + ' check(s) FAILED' : 'ALL GARAGE CHECKS PASS');
process.exit(fails ? 1 : 0);
