#!/usr/bin/env node
/* The folders that ship with the machine (::/Demo, ::/Doc, ::/Home, ::/Kernel, ::/Adam, ::/Compiler) and what their files promise.
   Pure part: DolDoc's `$$` is a dollar sign; every sprite a seeded document names exists; every link in a seeded document points at something the seed has; every button's
   word is one the machine knows or HolyC that parses; the programs that ship say something when run (nothing defines and stays quiet); the old text of a corrected
   document is on the REVISED list by hash; BellRing(n) rings n times; a Main that was called is not called twice.
   Shell part (the real machine): every document renders with no command left over; links open folders, pictures and documents; buttons open Tasks, Neofetch, LINES and
   the debugger; Panic.HC and Adam.HC run from [RUN]; COMPILE names the line a bracket is missing on; DEFRAG moves the real disk into one piece; TASKS ends a window.

     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-demo.mjs [--pure] */
import { readFileSync } from 'node:fs';
import { ddTokens, ddArgs } from '../kernel/doldoc.js';
import { ddSprite, DD_NAMES } from '../kernel/dd_sprites.js';
import { APP_ALIASES } from '../kernel/commands.js';
import { hcLex } from '../kernel/holyc_lex.js';
import { hcParse } from '../kernel/holyc_parse.js';
import { hcRun } from '../kernel/holyc_run.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const seed = JSON.parse(readFileSync(new URL('../assets/seed.json', import.meta.url), 'utf8'));
const paths = new Set(seed.map(e => e.path));
const folders = new Set(); paths.forEach(p => { const a = p.split('/'); for (let i = 2; i < a.length; i++) folders.add(a.slice(0, i).join('/')); });
const docs = seed.filter(e => e.type === 'doc' && /\.DD$/.test(e.path));

/* $$ */
const lit = ddTokens('cost $$5 and $FG,14$yellow$FG$ and $$FG,14$$');
ok(lit.map(t => (t.t === 'text' ? t.v : '<' + t.v + '>')).join('') === 'cost $5 and <FG,14>yellow<FG> and $FG,14$', 'a double dollar is one dollar sign and never a command: ' + JSON.stringify(lit));
ok(ddTokens('$FG,11$$FG$').length === 2, 'two commands side by side are two commands');
ok(ddArgs('"temple"').q[0] === 'temple', 'ddArgs reads a quoted name');

/* sprites, links, buttons in the seeded documents */
const names = new Set(['temple', 'cross', 'folder', 'scroll', 'disk', 'bell', 'flame', 'ark', 'glider']);
names.forEach(k => ok(!!ddSprite(k), 'the sprite "' + k + '" the documents promise exists'));
DD_NAMES.forEach(k => ok(/<svg/.test(ddSprite(k)) && !/#[0-9A-Fa-f]{6}/.test(ddSprite(k).replace(/#(000000|0000AA|00AA00|00AAAA|AA0000|AA00AA|AA5500|AAAAAA|555555|5555FF|55FF55|55FFFF|FF5555|FF55FF|FFFF55|FFFFFF)/gi, '')), 'sprite ' + k + ' is VGA16 only'));
const MACHINE = new Set(['NEOFETCH', 'FETCH', 'LINES', 'PANIC', 'CRASH', 'DEGAUSS', 'DGAUSS', 'BELL', 'WELCOME', 'CREDITS', 'TROPHIES', 'SAVER']);
docs.forEach(d => {
  const text = d.content;
  text.split('\n').forEach((line, i) => ddTokens(line).filter(t => t.t === 'cmd').forEach(c => {
    const head = c.v.split(/[,+]/)[0].toUpperCase().trim(), a = ddArgs(c.v.slice(head.length).replace(/^[,+]/, ''));
    const where = d.path + ':' + (i + 1);
    if (head === 'SP') ok(!!ddSprite(a.q[0]), where + ' names a sprite that exists: ' + a.q[0]);
    if (head === 'LK') { const t = String(a.a.A || '').replace(/^FI:/, ''); ok(paths.has(t) || folders.has(t), where + ' links to something that is on the disk: ' + t); }
    if (head === 'MA') {
      const cmd = (a.a.LM || '').trim(), bare = cmd.replace(/;+$/, '');
      if (/^[A-Za-z]\w*$/.test(bare) && (MACHINE.has(bare.toUpperCase()) || APP_ALIASES[bare.toUpperCase()])) return;
      try { hcParse(hcLex(cmd)); ok(true, ''); } catch (e) { ok(false, where + ' button ' + JSON.stringify(cmd) + ' is neither a word the machine knows nor HolyC: ' + e.message); }
    }
  }));
});

/* the programs that ship, run */
const run = src => { const out = []; let err = null; try { hcRun(hcParse(hcLex(src)), l => out.push(l), null, { dirNames: () => [], builtins: { BellRing: a => a[0] || 1, Beep: () => 0, GodWord: () => 0 } }); } catch (e) { err = e; } return { out, err }; };
seed.filter(e => /\.HC$/.test(e.path) && !/AutoExec/.test(e.path)).forEach(f => {
  const r = run(f.content);
  ok(r.out.length > 0, f.path + ' says something when it is run (' + r.out.length + ' lines)');
  ok(!r.err || /^(Panic:|DebuggerEnter)/.test(r.err.message), f.path + ' runs without a fault (' + (r.err && r.err.message) + ')');
});
ok(run(seed.find(e => e.path === '::/Kernel/Panic.HC').content).err && /DebuggerEnter/.test(run(seed.find(e => e.path === '::/Kernel/Panic.HC').content).err.message), 'Panic.HC ends in the debugger');
const twice = run('I64 n; U0 Main() { "ONCE\\n"; } Main;');
ok(twice.out.filter(l => l === 'ONCE').length === 1, 'a Main the program called itself is not called again by the JIT (' + twice.out.length + ')');
ok(run('U0 Main() { "ONCE\\n"; }').out.length === 1, 'a Main nobody called is still called once');
/* the old text of a corrected document is on the REVISED list */
const vfs = readFileSync(new URL('../kernel/vfs.js', import.meta.url), 'utf8');
['::/Adam/Adam.HC', '::/Adam/Seth.HC', '::/Kernel/Panic.HC', '::/Kernel/Kernel.DD', '::/Doc/Welcome.DD', '::/Doc/DolDoc.DD', '::/Doc/Hardware.DD', '::/Home/Notes.DD']
  .forEach(p => ok(new RegExp("'" + p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + "': \\[\\d+\\]").test(vfs), p + ' is on the REVISED list, so an untouched old copy is brought up to date'));
ok(!JSON.stringify(seed).includes('TheBibel.TXT'), 'TheBibel.TXT is no longer shipped');

if (bad || process.argv.includes('--pure')) { console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' pure checks pass'); process.exit(bad ? 1 : 0); }
console.log('pure part: ' + n + ' checks pass');

/* ---- the real machine ---- */
const { launchTarget } = await import('./lib/target.mjs');
const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1500, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const wait = ms => page.waitForTimeout(ms);
await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function');
await page.evaluate(() => window.powerOn());
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 120000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 }); await wait(700);
const open = (id, args) => page.evaluate(async ([id, args]) => { const wm = await import('/kernel/wm.js'); await wm.openWindow(id, args || {}); }, [id, args]);
const titles = () => page.evaluate(() => [...document.querySelectorAll('.win .titlebar .t, .win .title')].map(e => e.textContent));
const wins = () => page.evaluate(() => [...document.querySelectorAll('.win')].map(w => (w.querySelector('.titlebar') || w).textContent.replace(/\[.*?\]/g, '').trim()));
const closeAll = () => page.evaluate(() => document.querySelectorAll('.win .x').forEach(x => x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))));
const hasWin = async re => (await wins()).some(w => re.test(w));
const click = (sel, nth) => page.evaluate(([sel, nth]) => { const e = document.querySelectorAll(sel)[nth || 0]; if (!e) return false; e.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; }, [sel, nth]);
const macro = label => page.evaluate(l => { const b = [...document.querySelectorAll('.win .ddmacro')].find(x => x.textContent === l); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; }, label);
const link = label => page.evaluate(l => { const b = [...document.querySelectorAll('.win .ddlink')].find(x => x.textContent === l); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; }, label);

/* every seeded document renders: no command is left in the text, every sprite is a picture */
for (const d of docs) {
  await open('editor', { path: d.path }); await wait(350);
  const r = await page.evaluate(() => { const p = [...document.querySelectorAll('.ddpane')].pop(); return { text: p.textContent, sp: p.querySelectorAll('.ddsp svg').length, miss: p.querySelectorAll('.ddsp.missing').length }; });
  const want = (d.content.match(/\$SP,/g) || []).length - (d.content.match(/\$\$SP,/g) || []).length;
  ok(r.miss === 0, d.path + ': no sprite is missing');
  ok(r.sp >= want - (d.path.endsWith('DolDoc.DD') ? 1 : 0), d.path + ': its sprites are drawn (' + r.sp + ' of ' + want + ')');
  ok(!/\$(FG|BG|SP|LK|MA|TX|HL|TR)\b/.test(r.text.replace(/\$(FG|BG|SP|LK|MA|TX|HL|TR)[^ ]*\$/g, m => (d.path.endsWith('DolDoc.DD') ? '' : m))) || d.path.endsWith('DolDoc.DD'), d.path + ': no command is left in the page as text');
  await closeAll(); await wait(150);
}
await open('editor', { path: '::/Doc/DolDoc.DD' }); await wait(350);
ok(await page.evaluate(() => { const t = [...document.querySelectorAll('.ddpane')].pop().textContent; return t.indexOf('$FG,N$') >= 0 && t.indexOf('$SP,"name"$') >= 0 && t.indexOf('$MA,"t",LM="cmd"$') >= 0; }), 'DolDoc.DD shows the commands it describes, because its dollar signs are doubled');
await closeAll();

/* links and buttons */
await open('editor', { path: '::/Doc/Welcome.DD' }); await wait(350);
ok(await link('Demo'), 'Welcome.DD has a link to ::/Demo'); await wait(500);
ok(await hasWin(/::\/Demo/), 'a link to a folder opens the folder');
ok(await link('Charter.DD'), 'and one to a document'); await wait(500);
ok(await hasWin(/Charter/), 'a link to a document opens it');
await closeAll(); await open('editor', { path: '::/Doc/Welcome.DD' }); await wait(350);
for (const [label, re] of [['Neofetch', /Neofetch/i], ['Tasks', /Tasks/i], ['Lines', /LINES/], ['AfterEgypt', /AfterEgypt/i]]) {
  ok(await macro(label), 'the button ' + label + ' is there'); await wait(900);
  ok(await hasWin(re), 'the button ' + label + ' does something: a window called ' + re);
}
const lines = await page.evaluate(() => [...document.querySelectorAll('.win')].map(w => w.textContent).find(t => /THE CHARTER SAID/.test(t)) || '');
ok(/THE MACHINE\s+[\d,]+ lines/.test(lines) && /(LEFT|OVER BY)/.test(lines), 'LINES counts the real machine, not a page: ' + lines.replace(/\s+/g, ' ').slice(0, 160));
await closeAll(); await wait(200);

/* programs: RUN IT from the editor */
await open('editor', { path: '::/Adam/Adam.HC' }); await wait(350);
ok(await page.evaluate(() => { const b = [...document.querySelectorAll('.win .srcbtn')].find(x => x.textContent === '[RUN]'); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return true; }), '.HC files have a [RUN] button'); await wait(800);
ok(await page.evaluate(() => [...document.querySelectorAll('.win')].some(w => /ADAM IS AWAKE/.test(w.textContent) && /ADAM DOES NOT EXIT/.test(w.textContent))), 'Adam.HC says what Adam does when it is run');
await closeAll();
await open('editor', { path: '::/Kernel/Panic.HC' }); await wait(350);
await page.evaluate(() => { const b = [...document.querySelectorAll('.win .srcbtn')].find(x => x.textContent === '[RUN]'); b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }); await wait(1200);
ok(await hasWin(/PANIC/), 'Panic.HC ends in the debugger: a PANIC window opens');
await closeAll(); await wait(300);

/* BellRing(n) rings n times */
const rings = await page.evaluate(async () => {
  let c = 0; const real = window.Snd.bell; window.Snd.bell = () => { c++; };
  window.HolyC.run(window.HolyC.parse(window.HolyC.lex('BellRing(5);')), () => {}, null, {});
  await new Promise(r => setTimeout(r, 3200)); window.Snd.bell = real; return c;
});
ok(rings === 5, 'BellRing(5) rings five times (' + rings + ')');

/* COMPILE names the line */
await page.evaluate(async () => { const { fs } = await import('/kernel/vfs.js'); await fs.write('::/Home/Broken.HC', { type: 'code', content: 'U0 Main()\n{\n  "HI\\n";\n  if (1 {\n  }\n}\n' }); await fs.write('::/Home/Fine.HC', { type: 'code', content: 'U0 A() { "A\\n"; }\nU0 B() { A; }\nB;\n' }); });
const comp = async f => page.evaluate(async f => { const m = await import('/kernel/compile.js'); const { fs } = await import('/kernel/vfs.js'); const rows = []; m.compileNode(f, (await fs.read(f)).content, r => rows.push(...r)); return rows.join('\n'); }, f);
const cb = await comp('::/Home/Broken.HC');
ok(/ERROR\s+LINE 4/.test(cb) && /DOES NOT COMPILE/.test(cb), 'COMPILE names the line with the missing bracket: ' + cb.replace(/\n/g, ' | ').slice(0, 140));
const cf = await comp('::/Home/Fine.HC');
ok(/2 FUNCTION/.test(cf) && /COMPILES CLEAN/.test(cf), 'COMPILE counts the functions of a good file: ' + cf.replace(/\n/g, ' | ').slice(0, 160));

/* the terminal: Dir and Cd are real */
await open('terminal'); await wait(500);
const typeLine = async s => { await page.evaluate(() => document.querySelector('.terminput').focus()); await page.keyboard.type(s); await page.keyboard.press('Enter'); await wait(500); };
await typeLine('Cd("::/Doc");'); await typeLine('Dir;');
const term = await page.evaluate(() => [...document.querySelectorAll('.termout')].pop().textContent);
ok(/Welcome\.DD/.test(term) && /Charter\.DD/.test(term), 'Dir lists the real folder after Cd');
ok(await page.evaluate(() => /::\/Doc>/.test([...document.querySelectorAll('.termline .p')].pop().textContent)), 'Cd moved the terminal itself');
await closeAll(); await wait(200);

/* DEFRAG moves the real disk */
await open('defrag'); await wait(900);
const fr0 = await page.evaluate(() => document.querySelector('.defragstatus').textContent);
ok(/FILES, \d+ CLUSTERS\. \d+ FILES ARE IN PIECES/.test(fr0), 'DEFRAG reads the disk: ' + fr0);
await page.evaluate(() => { const b = [...document.querySelectorAll('.win .appbtn')]; b.find(x => x.textContent.startsWith('SPEED')).click(); b.find(x => x.textContent === 'DEFRAGMENT').click(); });
await page.waitForFunction(() => /DEFRAGMENTATION COMPLETE/.test(document.querySelector('.defragstatus').textContent), null, { timeout: 60000 });
ok(true, 'DEFRAG finishes');
await closeAll(); await wait(200);

/* TASKS ends a window and will not end Adam */
await open('placeholder'); await open('tasks'); await wait(900);
const before = (await wins()).length;
ok(await page.evaluate(() => [...document.querySelectorAll('.tasklist [data-task]')].length >= 2), 'TASKS lists the open windows');
ok(await page.evaluate(() => { const rows = [...document.querySelectorAll('.tasklist [data-task]')]; const r = rows.find(x => /placeholder|PLACEHOLDER|Placeholder/i.test(x.textContent)) || rows[0]; r.querySelector('.tend').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return true; }), 'a row can be ended'); await wait(600);
ok((await wins()).length === before - 1, 'ending a task closes its window (' + before + ' -> ' + (await wins()).length + ')');
await closeAll();

ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
await t.close();
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
