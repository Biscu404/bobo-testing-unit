#!/usr/bin/env node
/* The Charter's budget (Doc/Charter.DD): the whole machine in 100,000 lines. This counts what ships (the same count as `node scripts/make-lines.mjs`, which writes
   assets/lines.json for the LINES command) and fails if it is over, or if assets/lines.json is more than 1% behind what is really there (run make-lines.mjs again). */
import { execFileSync } from 'node:child_process';
import { readFileSync, copyFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), file = join(ROOT, 'assets', 'lines.json');
const had = JSON.parse(readFileSync(file, 'utf8'));
copyFileSync(file, file + '.keep');
execFileSync(process.execPath, [join(ROOT, 'scripts', 'make-lines.mjs')], { stdio: 'ignore' });
const now = JSON.parse(readFileSync(file, 'utf8'));
copyFileSync(file + '.keep', file);
unlinkSync(file + '.keep');
let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
ok(now.total <= 100000, 'the machine is ' + now.total.toLocaleString() + ' lines; the Charter allows 100,000 (' + (100000 - now.total).toLocaleString() + ' left)');
ok(Math.abs(now.total - had.total) <= now.total * 0.01, 'assets/lines.json says ' + had.total.toLocaleString() + (Math.abs(now.total - had.total) <= now.total * 0.01 ? '' : ': run  node scripts/make-lines.mjs'));
process.exit(bad ? 1 : 0);
