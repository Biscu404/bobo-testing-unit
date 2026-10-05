#!/usr/bin/env node
/* Path check: every relative import()/import/url()/src/href and every
   'assets/...' string must resolve to a file whose EXACT case matches on disk.
   Windows ignores case, Debian doesn't - this catches "works on Windows,
   breaks on Linux". Also fails on files that exist only with different case. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'docs', 'scripts', '.claude']);
const EXT = /\.(js|mjs|css|html)$/;
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.test(n) && dirname(p) !== ROOT || /^index\.html$/.test(n)) files.push(p);
  }
})(ROOT);

const exactExists = (p) => {
  const rel = relative(ROOT, p).split(sep);
  let cur = ROOT;
  for (const seg of rel) {
    if (!existsSync(cur) || !readdirSync(cur).includes(seg)) return false;
    cur = join(cur, seg);
  }
  return true;
};

const PATTERNS = [
  /(?:from|import)\s*\(?\s*['"`](\.{1,2}\/[^'"`]+)['"`]/g,
  /(?<![\w.])url\(\s*['"]?(?!data:|https?:|#)([^'")]+\.[A-Za-z0-9]+)['"]?\s*\)/g,
  /\b(?:src|href)=["'](?!https?:|data:|#)([^"']+)["']/g,
  /['"`](assets\/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)['"`]/g,
];
let bad = 0, checked = 0;
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      let spec = m[1].split(/[?#]/)[0];
      if (!spec || spec.includes('${')) continue;
      const base = spec.startsWith('assets/') && !f.endsWith('.css') ? ROOT : dirname(f);
      const target = resolve(base, spec);
      if (!target.startsWith(ROOT)) continue;
      checked++;
      if (!exactExists(target)) {
        bad++;
        console.log(`MISSING/CASE  ${relative(ROOT, f)} -> ${spec}`);
      }
    }
  }
}
console.log(`${checked} references checked, ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
