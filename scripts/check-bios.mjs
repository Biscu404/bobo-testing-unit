#!/usr/bin/env node
/* BIOS SETUP, held DEL at power-up (kernel/bios_cfg.js, bios_ui.js, bootseq.js, boot.js).
   Pure part: the settings are always whole and in range, every item has a list and some help, a step wraps both ways, and what POST does follows the
   settings (the memory count's steps, the hold, the speaker, the warm-up); the cold start's count is never changed.
   Shell part (the real machine, from source or HOLYTRON_EXE): DEL during POST opens SETUP and stops the boot; a held key does not reopen it; +/- change a
   setting; F10 keeps it and POST runs again to PRESS [~] TO ENTER; ESC with changes asks first; the setting is still there after a relaunch; the same
   screen is the CMOS window on the desktop and its arrows work.

     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-bios.mjs */
import * as C from '../kernel/bios_cfg.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };

/* ---- pure ---- */
ok(C.ITEMS.length >= 4, 'at least four settings');
C.ITEMS.forEach(i => { ok(i.values.length >= 2 && i.help.length > 20 && i.label, i.id + ' has values, a label and help'); ok(i.def >= 0 && i.def < i.values.length, i.id + ' has a default in range'); });
ok(JSON.stringify(C.mend(null)) === JSON.stringify(C.defaults()), 'nothing stored is the defaults');
ok(C.mend({ speaker: 99, memtest: -1, hold: 'x', reveal: 1.5 }).speaker === 0, 'a value out of range is put back');
ok(C.mend({ speaker: 1 }).speaker === 1, 'a good value is kept');
ok(C.mend({ speaker: 1 }).memtest === 0, 'an item missing from the store is its default');
const mem = new Map(); const store = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
ok(C.save({ speaker: 1, memtest: 2, hold: 3, reveal: 1 }, store) && C.load(store).hold === 3, 'a save comes back');
mem.set(C.KEY, '{not json'); ok(JSON.stringify(C.load(store)) === JSON.stringify(C.defaults()), 'a damaged store is the defaults, not an error');
let c = C.defaults();
C.ITEMS.forEach(i => { const back = C.step(C.step(c, i.id, 1), i.id, -1); ok(back[i.id] === c[i.id], i.id + ': one step on and one back is where it began'); let w = c; for (let k = 0; k < i.values.length; k++) w = C.step(w, i.id, 1); ok(w[i.id] === c[i.id], i.id + ': a full turn wraps'); });
ok(C.same(C.defaults(), C.mend({})), 'same() compares by value');
const p0 = C.post(C.defaults());
ok(p0.speaker && p0.memtest === 'full' && p0.holdSecs === 0 && p0.warm, 'the defaults are the machine as it always was');
const p1 = C.post({ speaker: 1, memtest: 1, hold: 2, reveal: 1 });
ok(!p1.speaker && p1.memtest === 'quick' && p1.holdSecs === 6 && !p1.warm, 'POST follows the settings');
ok(C.memSteps('full', false).step < C.memSteps('quick', false).step, 'a quick count takes bigger steps');
ok(C.memSteps('off', false) === null, 'an off count has no steps');
ok(C.memSteps('off', true).step === C.memSteps('full', true).step && C.memSteps('quick', true).step === 40, 'the cold start always counts in full');
ok(/3/.test(C.holdLine(3)) && /BOOTING\.\.\./.test(C.holdLine(0)), 'the hold line counts down');

if (bad || process.argv.includes('--pure')) { console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' pure checks pass'); process.exit(bad ? 1 : 0); }

/* ---- the real machine ---- */
const { launchTarget } = await import('./lib/target.mjs');
const SHOT = process.env.BIOS_SHOT;
const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const press = k => page.keyboard.press(k);
const text = sel => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const open = () => page.evaluate(() => !!document.querySelector('#splash .bsu'));
const wait = ms => page.waitForTimeout(ms);

await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function');
await page.evaluate(() => window.powerOn());
await page.waitForSelector('#bios .biosdel', { state: 'attached', timeout: 30000 });
ok((await text('#bios .biosdel')) === 'PRESS DEL TO ENTER SETUP', 'POST says what DEL is for');
await page.keyboard.down('Delete'); await wait(60); await page.keyboard.down('Delete'); await wait(60); await page.keyboard.down('Delete');
await page.waitForSelector('#splash .bsu', { timeout: 5000 });
await page.keyboard.up('Delete');
ok(await open(), 'a held DEL opens SETUP');
ok(/SETUP UTILITY/.test(await text('.bsu-title')), 'SETUP has its title');
await wait(600);
ok(!(await page.evaluate(() => !!document.getElementById('bootcursor'))), 'the boot stopped where it was (no PRESS [~] prompt under SETUP)');
await press('`'); await press('Enter'); await wait(100);
ok(await open(), 'a stray ~ does not leave SETUP');
await press('ArrowRight'); await wait(50);
if (SHOT) await page.screenshot({ path: SHOT });
ok((await text('.bsu-tab.on')) === 'ADVANCED', 'right arrow selects the next screen');
const rowLabel = () => page.evaluate(() => { const r = document.querySelector('.bsu-row.sel'); return r ? r.querySelector('.k').textContent + '=' + r.querySelector('.v').textContent : null; });
ok(/POST Speaker=\[ENABLED\]/.test(await rowLabel()), 'ADVANCED opens on POST Speaker');
await press('ArrowDown'); await press('-'); await wait(50);
ok(/Memory Test=\[OFF\]/.test(await rowLabel()), 'minus steps back (and wraps) to OFF');
ok(/CHANGES NOT SAVED/.test(await text('.bsu-help')), 'a change is said to be unsaved');
await press('Escape'); await wait(50);
ok(/Discard changes/.test(await text('.bsu-ask') || ''), 'ESC with changes asks first');
await press('n'); await wait(50);
ok(await open() && !(await text('.bsu-ask')), 'N goes back to SETUP');
await press('F10');
/* a profile that has never run owes the cold start: leaving SETUP runs that again, and its memory count is never shortened by a setting */
let counted = true;
try { await page.waitForFunction(() => /Memory test: \d+K/.test((document.getElementById('bios') || {}).textContent || ''), null, { timeout: 8000 }); } catch (e) { counted = false; }
ok(counted, 'POST ran again after SETUP, and the cold start still counts its memory in full with MEMORY TEST: OFF');
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 60000 });
ok(!(await open()), 'saving leaves SETUP and POST runs again to the prompt');
ok(await page.evaluate(() => JSON.parse(localStorage.getItem('templeos.bios.v1')).memtest === 2), 'the setting is stored');

/* a power cycle after that is a quick boot, and it reads the setting */
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 }); await wait(300);
await page.evaluate(() => window.powerOff()); await wait(500);
await page.evaluate(() => window.powerOn());
let skipped = true;
try { await page.waitForFunction(() => /Memory test: 640K OK \(SKIPPED\)/.test((document.getElementById('bios') || {}).textContent || ''), null, { timeout: 5000 }); } catch (e) { skipped = false; }
ok(skipped, 'a quick boot skips the memory test when SETUP says OFF');
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 60000 });

/* the desktop: the CMOS window is the same screen */
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 }); await wait(500);
await page.evaluate(async () => { const wm = await import('/kernel/wm.js'); await wm.openWindow('cmos', {}); });
await wait(400);
ok(await page.evaluate(() => !!document.querySelector('.win .bsu.win')), 'the CMOS window is the SETUP screen');
await page.evaluate(() => document.querySelector('.win .bsu').closest('[tabindex]').focus());
await press('ArrowRight'); await wait(60);
ok(await page.evaluate(() => [...document.querySelectorAll('.win .bsu-row')].some(r => r.querySelector('.k').textContent === 'Memory Test' && r.querySelector('.v').textContent === '[OFF]')), 'the CMOS window shows the saved setting');
await press('ArrowRight'); await wait(60);
ok((await text('.win .bsu-tab.on')) === 'BOOT', 'the arrows work in the CMOS window');
await press('F10'); await wait(400);
ok(await page.evaluate(() => !document.querySelector('.win .bsu')), 'F10 leaves the CMOS window');

/* a relaunch keeps it: same profile is not reused by the harness, so the value is read back from storage after a reload */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function');
ok(await page.evaluate(() => JSON.parse(localStorage.getItem('templeos.bios.v1')).memtest === 2), 'the setting survives a reload');
ok(errors.length === 0, 'no page errors: ' + errors.join(' | '));
await t.close();
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
