/* Which files does the machine actually load? Crawls from index.html: <script>/<link>
   tags, static `import ... from './x.js'`, literal `import('./x.js')`, CSS @import and
   url(), and 'assets/...' string literals. Used by check-package to prove the packaged
   app contains everything reachable and nothing that is dev scaffolding. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';

const PATTERNS = [
  /(?:\bfrom|\bimport)\s*\(?\s*['"`](\.{1,2}\/[^'"`]+)['"`]/g,
  /@import\s+(?:url\()?['"]?(\.{1,2}\/[^'")]+)['"]?/g,
  /(?<![\w.])url\(\s*['"]?(?!data:|https?:|#)([^'")]+\.[A-Za-z0-9]+)['"]?\s*\)/g,
  /\b(?:src|href)\s*=\s*["'`](?!https?:|data:|#)([^"'`]+)["'`]/g,
  /['"`](assets\/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)['"`]/g,
  /['"`]\/((?:kernel|apps|assets|vendor)\/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)['"`]/g,
];

export function reachable(root, entries = ['index.html']) {
  const seen = new Set(), queue = entries.map(e => resolve(root, e));
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f) || !existsSync(f) || !statSync(f).isFile()) continue;
    seen.add(f);
    if (!/\.(js|mjs|css|html)$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    for (const re of PATTERNS) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) {
        const spec = m[1].split(/[?#]/)[0];
        if (!spec || spec.includes('${')) continue;
        const base = /^(assets|kernel|apps|vendor)\//.test(spec) && !f.endsWith('.css') ? root : dirname(f);
        const t = resolve(base, spec);
        if (t.startsWith(root + sep)) queue.push(t);
      }
    }
  }
  return new Set([...seen].map(f => relative(root, f).split(sep).join('/')));
}
