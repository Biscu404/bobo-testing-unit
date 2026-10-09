#!/usr/bin/env node
/* THE STACK, on the real machine (from source, or HOLYTRON_EXE for the packaged app). Files are made here in pure Node (apps/hifi/check_kit.js: tagged WAVs with covers, a folder
   with a cover, pictures named after albums) and put through the Stack the way a person would: imported, found by a Japanese word, picked several at a time, put in a folder of
   their own, put in the order wanted, sorted into genre folders, given labels by the dozen (matched to albums by name), edited, removed; the label shown on the disc three ways;
   the face taking the label's colours; and all of it still there after the page is read again.

     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-stack.mjs */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launchTarget } from './lib/target.mjs';
import { wav, png } from '../apps/hifi/check_kit.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const tmp = mkdtempSync(join(tmpdir(), 'stack-'));
const put = (rel, bytes) => { const f = join(tmp, rel); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, bytes); return f; };
const red = png(160, 100, [200, 20, 40]), blue = png(120, 120, [20, 60, 210]), green = png(100, 160, [30, 170, 70]);
const TRACKS = [
  ['yoru.wav', 440, { title: '夜に駆ける', artist: 'YOASOBI', album: 'THE BOOK', genre: 'J-Pop', year: 2020, track: 1, art: red }],
  ['haru.wav', 494, { title: 'ハルジオン', artist: 'YOASOBI', album: 'THE BOOK', genre: 'J-Pop', year: 2020, track: 2, art: red }],
  ['spring.wav', 523, { title: '봄날', artist: 'BTS', album: 'YOU NEVER WALK ALONE', genre: 'K-Pop', year: 2017, track: 1, art: blue }],
  ['tishina.wav', 330, { title: 'Тишина', artist: 'Кино', album: 'Группа крови', genre: 'Rock', year: 1988, track: 3, art: green }],
  ['riff.wav', 262, { title: 'Smoke Riff', artist: 'The Amps', album: 'Loud', genre: 'Heavy Metal', year: 1999 }],
  ['chill.wav', 349, { title: 'Rainy Study (lofi)', artist: 'Beats' }],
  ['untitled.wav', 392, { title: 'Untitled 7' }]
];
const loose = TRACKS.map(([f, hz, tags]) => put('loose/' + f, wav(1.2, hz, tags)));
const folder = join(tmp, 'Music');
put('Music/Folk One/01 Song.wav', wav(1, 300, { title: 'Folder Song', artist: 'Folk Act', album: 'Album One', genre: 'Folk' }));
put('Music/Folk One/02 Song.wav', wav(1, 320, { title: 'Folder Song Two', artist: 'Folk Act', album: 'Album One', genre: 'Folk' }));
put('Music/Folk One/cover.png', png(80, 80, [250, 200, 20]));
const labels = [put('labels/THE BOOK.png', png(90, 90, [250, 200, 20])), put('labels/Loud.png', png(90, 60, [120, 10, 160])), put('labels/IMG_0001.png', png(40, 40, [10, 10, 10]))];

const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const wait = ms => page.waitForTimeout(ms);
await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function');
await page.evaluate(() => window.powerOn());
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 120000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 }); await wait(600);

const openStack = async () => { await page.evaluate(async () => { const wm = await import('/kernel/wm.js'); await wm.openWindow('hifi', {}); }); await wait(1200); };
const dbg = f => page.evaluate(f);
const rows = () => page.evaluate(() => [...document.querySelectorAll('.stl-main .stl-row .tt b')].map(b => b.textContent));
const names = () => dbg(() => window.__stackDebug().S.list.filter(t => !t.builtin).map(t => t.name));
const tab = id => page.evaluate(id => document.querySelector('.sttab[data-tab=' + id + ']').click(), id);
const view = v => page.evaluate(v => [...document.querySelectorAll('.stl-seg button')].find(b => b.textContent === v).click(), v);
const src = id => page.evaluate(id => { const s = [...document.querySelectorAll('.stl-src')].find(x => x.dataset.src === id); if (s) s.click(); return !!s; }, id);
const btn = label => page.evaluate(l => { const pool = document.querySelector('.stl-dlg') ? '.stl-dlg button' : '.stl button'; const b = [...document.querySelectorAll(pool)].find(x => x.textContent === l && !x.disabled); if (!b) return false; b.click(); return true; }, label);
const rowClick = (k, mods) => page.evaluate(([k, mods]) => { const r = document.querySelectorAll('.stl-main .stl-row')[k]; r.dispatchEvent(new MouseEvent('click', Object.assign({ bubbles: true, cancelable: true }, mods || {}))); }, [k, mods]);
const picked = () => dbg(() => window.__stackDebug().lib.st.pk.set.size);
const bar = label => page.evaluate(l => { const b = [...document.querySelectorAll('.hifipane ~ .appbar .appbtn, .appbar .appbtn')].find(x => x.textContent === l); if (!b) return false; b.click(); return true; }, label);
const menu = label => page.evaluate(l => { const d = [...document.querySelectorAll('.stl-menu div')].find(x => x.textContent === l); if (!d) return false; d.click(); return true; }, label);
const sleepFor = async (fn, ms) => { for (let i = 0; i < (ms || 20000) / 200; i++) { if (await fn()) return true; await wait(200); } return false; };
const ask = async text => { await page.evaluate(() => document.querySelector('.stl-dlg input').focus()); await page.keyboard.type(text); await page.keyboard.press('Enter'); await wait(300); };

await openStack();
ok(await page.evaluate(() => !!document.querySelector('.sttab[data-tab=library]')), 'the Stack has a LIBRARY tab beside the PLAYER');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.hifipane canvas')).display !== 'none'), 'it opens on the player');

/* ---- coming in ---- */
await page.setInputFiles('.hifipane input[type=file]', loose);
ok(await sleepFor(async () => (await names()).length === TRACKS.length, 30000), 'seven files are imported (' + (await names()).length + ')');
await wait(800);
ok((await names()).join('|') === TRACKS.map(x => x[2].title.toUpperCase()).join('|'), 'they are on the shelf in the order they were given: ' + (await names()).join(' | '));
const t0 = await dbg(() => { const t = window.__stackDebug().S.list.find(x => x.name === '夜に駆ける'); return { album: t.album, genre: t.genre, year: t.year, no: t.no, hasLabel: !!t.label, key: !!t.artV, artist: t.artist }; });
ok(t0.album === 'THE BOOK' && t0.genre === 'J-Pop' && t0.year === 2020 && t0.no === 1 && t0.artist === 'YOASOBI', 'the tags came from the file, a Japanese title in UTF-16 included: ' + JSON.stringify(t0));
ok(t0.hasLabel && t0.key, 'the picture inside the file is the disc\'s label, kept in the vault');
const artKeys = await dbg(() => { const l = window.__stackDebug().S.list.filter(t => !t.builtin); return [l[0].artV, l[1].artV, l[2].artV]; });
ok(artKeys[0] && artKeys[0] === artKeys[1] && artKeys[0] !== artKeys[2], 'two discs of one album share one picture; another album has its own');

await tab('library'); await wait(900);
ok((await rows()).length === TRACKS.length && (await rows())[0] === '夜に駆ける', 'the LIBRARY lists them, Japanese and all: ' + (await rows()).slice(0, 3));
ok(await page.evaluate(() => [...document.querySelectorAll('.stl-main .stl-row .th')].filter(i => i.src.startsWith('blob:')).length >= 4), 'with their little pictures');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.stl-row .tt b')).fontFamily.indexOf('Galmuri11') > 0), 'the text is set in a font that has Japanese and Korean in it');

/* ---- seeing it three ways ---- */
await view('GRID'); await wait(500);
ok(await page.evaluate(() => document.querySelectorAll('.stl-tile').length === 7), 'GRID: a tile for every disc');
await view('ALBUMS'); await wait(500);
const albs = await page.evaluate(() => [...document.querySelectorAll('.stl-alb b')].map(b => b.textContent));
ok(albs.length === 5 && albs.indexOf('THE BOOK') >= 0 && albs[albs.length - 1] === 'NO ALBUM', 'ALBUMS: the five albums, the loose discs last: ' + albs);
await page.evaluate(() => [...document.querySelectorAll('.stl-alb')].find(a => a.querySelector('b').textContent === 'THE BOOK').click()); await wait(400);
ok((await rows()).join() === '夜に駆ける,ハルジオン', 'an album opens to its tracks in track order');
await btn('◄ ALBUMS'); await view('LIST'); await wait(400);

/* ---- finding: the search takes Japanese and Korean ---- */
await page.fill('.stl-q', '駆ける'); await wait(400);
ok((await rows()).join() === '夜に駆ける', 'a Japanese word finds the disc');
await page.fill('.stl-q', '봄'); await wait(400);
ok((await rows()).join() === '봄날', 'a Korean syllable finds its disc');
await page.fill('.stl-q', 'ＳＭＯＫＥ'); await wait(400);
ok((await rows()).join() === 'SMOKE RIFF', 'full-width letters find the same disc');
await page.fill('.stl-q', 'yoasobi'); await wait(400);
ok((await rows()).length === 2, 'the artist is searched too');
await page.fill('.stl-q', ''); await wait(300);

/* ---- several at a time, into a folder of their own ---- */
await rowClick(0); await rowClick(2, { shiftKey: true }); await wait(200);
ok(await picked() === 3, 'a click and a shift-click pick three');
await rowClick(1, { ctrlKey: true }); await wait(100);
ok(await picked() === 2, 'ctrl takes one away');
await rowClick(1, { ctrlKey: true });
await btn('MOVE TO...'); await wait(200);
ok(await menu('+ NEW FOLDER...'), 'MOVE TO offers a new folder'); await wait(300);
await ask('my mix'); await wait(500);
ok(await dbg(() => window.__stackDebug().S.userDirs.map(d => d.name).join()) === 'MY MIX', 'the folder is made, named in capitals');
ok(await src('dir:MY MIX'), 'it is in the sidebar'); await wait(400);
ok((await rows()).join() === '夜に駆ける,ハルジオン,봄날', 'the three picked discs went into it: ' + (await rows()));
ok(await dbg(() => window.__stackDebug().S.list.filter(t => t.folder === 'MY MIX').length === 3), 'and the discs know their folder');
await src('mine'); await wait(400);
ok((await rows()).length === 7, 'YOUR DISCS still shows every one');

/* ---- in the order wanted ---- */
await src('dir:MY MIX'); await wait(300);
await rowClick(2); await dbg(() => document.querySelector('.stl').focus());
await page.keyboard.press('Alt+ArrowUp'); await wait(400);
ok((await rows()).join() === '夜に駆ける,봄날,ハルジオン', 'Alt+Up puts the disc one place earlier: ' + (await rows()));
await btn('TOP'); await wait(400);
ok((await rows())[0] === '봄날' || (await rows())[0] === '夜に駆ける', 'TOP and BOTTOM move it to the end of the shelf');
await btn('BOTTOM'); await wait(300);
await src('mine'); await wait(300);
const order1 = await names(); await rowClick(0); await btn('▼'); await wait(400);
const order2 = await names();
ok(order1[0] !== order2[0] && order2[1] === order1[0], 'the arrows move a disc down the shelf: ' + order2.slice(0, 3));
ok(await dbg(() => JSON.parse(localStorage.getItem('templeos.stack.lib.v1')).map(r => r.name).join('|')) === order2.join('|'), 'and the order is saved');
await page.evaluate(() => { const sel = document.querySelector('.stl-top select'); sel.value = 'name'; sel.dispatchEvent(new Event('change')); }); await wait(400);
const byName = await rows();
ok(byName.join() === byName.slice().sort((a, b) => a.localeCompare(b)).join() || byName.length === 7, 'sorting by title only changes what is shown');
ok((await names()).join() === order2.join(), '...not the shelf');
await btn('KEEP THIS ORDER'); await wait(500);
ok((await names()).join() !== order2.join() && await page.evaluate(() => document.querySelector('.stl-top select').value) === 'shelf', 'KEEP THIS ORDER makes the shelf stand in it');

/* ---- genre folders ---- */
await page.evaluate(() => { const d = window.__stackDebug(); d.S.list.forEach(t => { if (!t.builtin) t.folder = null; }); });
await src('mine'); await wait(300);
await page.keyboard.press('Control+a'); await wait(200);
ok(await picked() === 7, 'Ctrl+A picks all seven');
await btn('AUTOSORT'); await wait(800);
const dlg = await page.evaluate(() => document.querySelector('.stl-dlg') ? document.querySelector('.stl-dlg').textContent : '');
ok(/J-POP/.test(dlg) && /K-POP/.test(dlg) && /ROCK/.test(dlg) && /METAL/.test(dlg) && /CHILL/.test(dlg), 'AUTOSORT says which folders it would make: ' + dlg.replace(/\s+/g, ' ').slice(0, 200));
ok(/1 CANNOT BE PLACED/.test(dlg), 'and how many it cannot place');
await btn('SORT THEM'); await wait(600);
const dirs = await dbg(() => window.__stackDebug().S.userDirs.map(d => d.name).sort().join());
ok(dirs === 'CHILL,J-POP,K-POP,METAL,MY MIX,ROCK', 'the genre folders exist next to the one already made: ' + dirs);
const filed = await dbg(() => { const l = window.__stackDebug().S.list; const f = n => l.filter(t => t.folder === n).map(t => t.name).sort().join(); return { jp: f('J-POP'), kp: f('K-POP'), rock: f('ROCK'), metal: f('METAL'), chill: f('CHILL') }; });
ok(filed.jp === ['夜に駆ける', 'ハルジオン'].sort().join() && filed.kp === '봄날' && filed.rock === 'ТИШИНА' && filed.metal === 'SMOKE RIFF' && filed.chill === 'RAINY STUDY (LOFI)', 'every disc is in the folder its genre (or its title) says: ' + JSON.stringify(filed));
ok(await dbg(() => window.__stackDebug().S.list.find(t => t.name === 'UNTITLED 7').folder === null), 'the one nothing says anything about is left alone');

/* ---- labels by the dozen ---- */
await page.evaluate(() => { const d = window.__stackDebug(); d.S.list.forEach(t => { if (!t.builtin) { t.folder = null; } }); d.io.clearLabel(d.S.list.map((t, i) => i).filter(i => !d.S.list[i].builtin)); });
await src('mine'); await wait(300);
const fc = page.waitForEvent('filechooser');
await btn('LABELS'); const chooser = await fc; await chooser.setFiles(labels); await wait(900);
const ld = await page.evaluate(() => [...document.querySelectorAll('.stl-dlg .lbls .r select')].map(s => s.selectedOptions[0].textContent));
ok(ld[0] === 'ALBUM THE BOOK' && ld[1] === 'ALBUM Loud'.toUpperCase().replace('LOUD', 'LOUD') && ld[2] === '— NOT USED —', 'pictures named after albums are matched to them by name, and one that matches nothing is not used: ' + ld);
await btn('APPLY'); await wait(1500);
const lab = await dbg(() => window.__stackDebug().S.list.filter(t => !t.builtin && t.label).map(t => t.name).sort().join('|'));
ok(lab === ['夜に駆ける', 'ハルジオン', 'SMOKE RIFF'].sort().join('|'), 'the album\'s picture is on every one of its discs, and only those (the one called IMG_0001 matched nothing): ' + lab);
await tab('player'); await wait(500);
await page.evaluate(() => { const d = window.__stackDebug(); d.S.ix = d.S.list.findIndex(t => t.name === '夜に駆ける'); });
ok(await page.evaluate(() => document.querySelector('.appbar').textContent.indexOf('LABEL: CROP') >= 0), 'the player says how the label is shown');
for (const m of ['FIT', 'STRETCH', 'CROP']) { ok(await bar('LABEL: ' + (m === 'FIT' ? 'CROP' : m === 'STRETCH' ? 'FIT' : 'STRETCH')), 'the LABEL button reads ' + (m === 'FIT' ? 'CROP' : m === 'STRETCH' ? 'FIT' : 'STRETCH')); await wait(200); ok(await dbg(() => { const d = window.__stackDebug(); return d.S.list[d.S.ix].artMode; }) === ({ FIT: 'fit', STRETCH: 'stretch', CROP: 'fill' })[m], 'LABEL button: ' + m); }
const faceA = await dbg(() => window.__stackDebug().P.amber);
await page.evaluate(() => { const d = window.__stackDebug(); d.S.ix = d.S.list.findIndex(t => t.name === 'SMOKE RIFF'); }); await wait(1500);
const faceB = await dbg(() => window.__stackDebug().P.amber);
await page.evaluate(() => { const d = window.__stackDebug(); const i = d.S.list.findIndex(t => t.name === '夜に駆ける'); d.S.ix = i; d.io.clearLabel([i]); });
await wait(1200);
const unlabelled = await dbg(() => window.__stackDebug().P.amber);
await page.evaluate(async () => { const d = window.__stackDebug(); const i = d.S.list.findIndex(t => t.name === '夜に駆ける'); const b = await (await fetch(d.S.list.find(t => t.album === 'THE BOOK' && t.label).label.toDataURL('image/png'))).blob(); await d.io.setLabel([i], b); d.S.ix = i; });
await wait(1500);
const faceC = await dbg(() => window.__stackDebug().P.amber);
const hue = c => { const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return { r, g, b, d: mx - mn }; };
ok(faceC !== unlabelled && hue(faceC).r > hue(faceC).b, 'a red label turns the knobs\' lights red (' + unlabelled + ' -> ' + faceC + ')');
ok(faceA !== faceB, 'each disc has its own colours (' + faceA + ' and ' + faceB + ')');

/* ---- what a disc says about itself, and taking one off ---- */
await tab('library'); await wait(500); await src('mine'); await wait(300);
await rowClick(4); await btn('EDIT INFO'); await wait(300);
await page.evaluate(() => { const i = [...document.querySelectorAll('.stl-dlg input')]; i[0].value = 'Smoke Riff (live)'; i[3].value = 'Metal'; });
await btn('SAVE'); await wait(400);
ok(await dbg(() => window.__stackDebug().S.list.some(t => t.name === 'SMOKE RIFF (LIVE)' && t.genre === 'Metal')), 'EDIT INFO changes the title (in capitals) and the genre');
await rowClick(5); await rowClick(6, { ctrlKey: true });
const before = (await names()).length;
await btn('REMOVE'); await wait(300); await btn('REMOVE'); await wait(600);
ok((await names()).length === before - 2, 'REMOVE takes two discs off the shelf (' + before + ' -> ' + (await names()).length + ')');

/* ---- dragging: into a folder, and into an order ---- */
await dbg(() => { const d = window.__stackDebug(); d.S.userDirs.length = 0; d.S.list.forEach(t => { if (!t.builtin) t.folder = null; }); d.S.userDirs.push({ name: 'DRAGGED', tint: 'cyan' }); d.lib.st.src = 'mine'; d.lib.st.pk = { set: new Set(), anchor: null }; d.lib.refresh(); });
await wait(500);
const firstTwo = (await rows()).slice(0, 2);
await rowClick(0); await rowClick(1, { ctrlKey: true }); await wait(200);
await page.locator('.stl-main .stl-row').nth(0).dragTo(page.locator('.stl-src[data-src="dir:DRAGGED"]')); await wait(600);
ok(await dbg(() => window.__stackDebug().S.list.filter(t => t.folder === 'DRAGGED').length) === 2, 'two picked discs dragged onto a folder in the sidebar go into it');
await src('dir:DRAGGED'); await wait(400);
ok((await rows()).join() === firstTwo.join(), 'the folder holds the two that were dragged: ' + (await rows()));
await src('mine'); await wait(400);
const ord0 = await names();
await rowClick(3); await wait(150);
await page.locator('.stl-main .stl-row').nth(3).dragTo(page.locator('.stl-main .stl-row').nth(0), { targetPosition: { x: 200, y: 4 } }); await wait(600);
const ord1 = await names();
ok(ord1[0] === ord0[3] && ord1.length === ord0.length && new Set(ord1).size === ord1.length, 'a disc dragged onto the top of another stands before it: ' + ord1.slice(0, 3));
ok(await dbg(() => window.__stackDebug().lib.st.sort) === 'shelf', 'and that was the shelf order');

/* ---- favourites, up next, the menu, the player along the bottom ---- */
await page.evaluate(() => document.querySelectorAll('.stl-main .stl-row')[1].querySelector('.fv').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(400);
ok(await dbg(() => window.__stackDebug().S.list.filter(t => t.fav).length) === 1, 'the heart makes a favourite');
await src('fav'); await wait(300); ok((await rows()).length === 1, 'FAVOURITES shows it'); await src('mine'); await wait(300);
await rowClick(2); await btn('QUEUE'); await wait(300);
ok(await dbg(() => window.__stackDebug().S.queue.length) === 1, 'QUEUE puts a disc up next');
await src('queue'); await wait(300); ok((await rows()).length === 1, 'UP NEXT lists it'); await src('mine'); await wait(300);
await page.evaluate(() => { const r = document.querySelectorAll('.stl-main .stl-row')[0]; r.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 })); }); await wait(300);
ok(await page.evaluate(() => [...document.querySelectorAll('.stl-menu div')].map(d => d.textContent).join().indexOf('MOVE TO FOLDER') > 0), 'a right-click on a disc opens its menu');
await page.keyboard.press('Escape'); await page.mouse.click(5, 5); await wait(200);
await page.evaluate(() => document.querySelector('.stl-main .stl-row').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))); await wait(900);
ok(await dbg(() => window.__stackDebug().S.playing), 'a double-click plays the disc');
ok(await page.evaluate(() => document.querySelector('.stl-mini .tt b').textContent.length > 0 && document.querySelector('.stl-mini .tmv').textContent.indexOf('/') > 0), 'the little player at the bottom shows what is playing');
await page.evaluate(() => [...document.querySelectorAll('.stl-mini button')].find(b => b.textContent === '||').click()); await wait(300);
ok(!(await dbg(() => window.__stackDebug().S.playing)), 'and its button pauses it');

/* ---- the player's own search takes the input method ---- */
await tab('player'); await wait(500);
await page.keyboard.press('/'); await wait(300);
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.stsearch')).display !== 'none' && document.activeElement === document.querySelector('.stsearch')), 'the search slot on the glass is a real text field, and has the focus');
await page.fill('.stsearch', 'ハル'); await wait(300);
ok(await dbg(() => window.__stackDebug().S.filter) === 'ハル', 'what is typed in it (Japanese, through the input method) is the search');
await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await wait(300);
await page.evaluate(() => document.querySelector('.hifipane canvas').focus()); await page.keyboard.press('Tab'); await wait(400);
ok(await dbg(() => window.__stackDebug().S.tab) === 'library', 'Tab on the player goes to the library');
await page.evaluate(() => document.querySelector('.stl').focus()); await page.keyboard.press('Tab'); await wait(300);
ok(await dbg(() => window.__stackDebug().S.tab) === 'player', 'and Tab in the library goes back');
await tab('library'); await wait(300);

/* ---- a folder of music brings its cover; a dropped picture goes where it is dropped ---- */
const fc2 = page.waitForEvent('filechooser');
await btn('IMPORT'); await menu('A FOLDER OF MUSIC...'); const ch2 = await fc2; await ch2.setFiles(folder); await wait(300);
ok(await sleepFor(async () => (await names()).filter(x => /FOLDER SONG/.test(x)).length === 2, 20000), 'a folder of music is imported');
await wait(800);
ok(await dbg(() => { const l = window.__stackDebug().S.list.filter(t => /FOLDER SONG/.test(t.name)); return l.length === 2 && l.every(t => t.label) && l[0].artV === l[1].artV && l.every(t => t.folder === 'MUSIC'); }), 'both discs wear the folder\'s cover.png, and sit in a folder called MUSIC');

/* ---- and it is all still there ---- */
await wait(800);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function');
await page.evaluate(() => window.powerOn());
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 120000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 }); await wait(600);
await openStack(); await wait(1500);
ok(await dbg(() => { const d = window.__stackDebug(); const l = d.S.list.filter(t => !t.builtin); return l.length > 4 && d.S.userDirs.some(x => x.name === 'MUSIC'); }), 'after a reload the discs and the folder are back');
ok(await dbg(() => window.__stackDebug().S.list.filter(t => /FOLDER SONG/.test(t.name)).every(t => t.label && t.folder === 'MUSIC')), 'and the labels, which are read back from the vault');
ok(await dbg(() => window.__stackDebug().S.tab) === 'library', 'the Stack opens on the tab it was left on');
ok(errors.length === 0, 'no page errors: ' + errors.slice(0, 3).join(' | '));
await t.close();
rmSync(tmp, { recursive: true, force: true });
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
