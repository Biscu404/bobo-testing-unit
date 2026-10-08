#!/usr/bin/env node
/* Can everything on the machine be read? (docs: CLAUDE.md, "Readability")
   Two halves.
   PURE (no browser): every colour scheme Dave sells keeps all six of its inks at 4.5:1 or better against its own background; and every stylesheet rule that sets a text colour and a plain
   background together is at least 3:1 (no dark grey on black, no light grey on white).
   BROWSER (Electron; `--pure` skips it): every app is opened on a freshly booted machine and its text measured against what is actually behind it, then its tabs, shelves and
   buttons are walked (never the ones that destroy) and measured again; the text drawn on canvases is measured too, against the pixels under it before it is drawn. Informative text
   has to be 4.5:1, text on a control that is switched off 3:1. What is known and accepted is in scripts/check-contrast.known.json ("app": ["selector|text", ...]).

     node scripts/check-contrast.mjs --pure
     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-contrast.mjs [appId ...] */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ratio, hex, TEXT_MIN, OFF_MIN, auditApp } from './lib/contrast.mjs';
import { SCHEMES } from '../kernel/cos_data.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };

/* ---- the schemes: six inks on one background ------------------------------------------------------------------------------------------------- */
SCHEMES.forEach(s => ['fg', 'dim', 'ok', 'hi', 'err', 'acc'].forEach(k => ok(ratio(s.v[k], s.v.bg) >= TEXT_MIN, 'scheme ' + s.id + ': ' + k + ' ' + s.v[k] + ' on ' + s.v.bg + ' is ' + ratio(s.v[k], s.v.bg).toFixed(2) + ':1, under ' + TEXT_MIN)));

/* ---- the stylesheets: a text colour and a plain background in one rule ----------------------------------------------------------------------- */
const files = [];
const walk = d => readdirSync(d).forEach(f => { if (['node_modules', 'dist', '.git', 'vendor'].includes(f)) return; const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.css$/.test(f)) files.push(p); });
walk(ROOT);
const solid = v => { const m = v && v.trim().match(/^(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(\s*!important)?$/); return m ? hex(m[1]) : null; };
/* rules that are not what they look like: a text colour that a later rule replaces, or a pair that is only ever one half of a flash */
/* (the empty tick-boxes of the Garage's course and of HOLYC.EXE: black on black until a goal is met, when the box turns green and the tick is black on it) */
const PAIR_OK = ['.c-box', '.hc-box'];
let pairs = 0;
files.forEach(f => {
  const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const sel = m[1].trim().replace(/\s+/g, ' '), decl = {};
    m[2].split(';').forEach(d => { const i = d.indexOf(':'); if (i > 0) decl[d.slice(0, i).trim()] = d.slice(i + 1).trim(); });
    const fg = solid(decl.color), bg = solid(decl.background) || solid(decl['background-color']);
    if (!fg || !bg || PAIR_OK.includes(sel)) continue;
    pairs++;
    ok(ratio(fg, bg) >= OFF_MIN, relative(ROOT, f) + ' ' + sel.slice(0, 60) + ': ' + decl.color + ' on ' + (decl.background || decl['background-color']) + ' is ' + ratio(fg, bg).toFixed(2) + ':1, under ' + OFF_MIN);
  }
});

/* ---- the machine: every app, its tabs and its canvases -------------------------------------------------------------------------------------- */
const pure = process.argv.includes('--pure');
const ids = process.argv.slice(2).filter(a => !a.startsWith('--'));
let summary = '';
if (!pure) {
  const { registry } = await import('../kernel/registry.js');
  const { launchTarget } = await import('./lib/target.mjs');
  const KNOWN = JSON.parse(readFileSync(new URL('./check-contrast.known.json', import.meta.url), 'utf8'));
  delete KNOWN._about;
  const ARGS = { folder: { path: '::/Demo' }, editor: { path: '::/Adam/Adam.HC', type: 'code' }, viewer: { path: '::/Home/Temple.BMP', type: 'image' } };
  const t = await launchTarget();
  const page = await t.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const boot = async () => {
    await page.goto(t.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.powerOn === 'function'); await page.evaluate(() => window.powerOn());
    await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
    await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(800);
  };
  let texts = 0;
  for (const id of (ids.length ? ids : Object.keys(registry).filter(k => k !== 'placeholder'))) {
    await boot();
    const r = await auditApp(page, id, { args: ARGS, settle: id === 'bekkedal' || id === 'standbattle' ? 2600 : 1300 });
    const known = new Set(KNOWN[id] || []);
    const fresh = r.found.filter(x => !known.has(x.sel + '|' + x.txt));
    texts += r.found.length;
    ok(fresh.length === 0, id + ': ' + fresh.slice(0, 6).map(x => x.cr + ':1 ' + x.fg + ' on ' + x.bg + ' ' + x.px + 'px ' + x.sel + ' "' + x.txt + '" (' + x.tag + ')').join('; ') + (fresh.length > 6 ? ' ... and ' + (fresh.length - 6) + ' more' : ''));
    console.log('  ' + id.padEnd(12) + String(r.clicks).padStart(3) + ' clicks, ' + r.found.length + ' below the line, ' + (r.found.length - fresh.length) + ' known');
  }
  ok(errors.length === 0, 'page errors: ' + errors.slice(0, 3).join(' | '));
  await t.close();
  summary = ', ' + texts + ' low-contrast kinds seen across the apps';
}
console.log(bad ? '\nFAILED ' + bad + ' of ' + n : '\nok  - everything can be read (' + SCHEMES.length + ' schemes, ' + pairs + ' stylesheet pairs' + summary + ')');
process.exit(bad ? 1 : 0);
