/* Pure URL -> file mapping for templeos://app/, kept free of any electron
   import so scripts/check-shell.mjs can test it under plain Node. */
import { join, normalize, sep } from 'node:path';

export const SCHEME = 'templeos';
export const HOST = 'app';
export const ORIGIN = `${SCHEME}://${HOST}`;

/* Only these top-level entries are ever served: electron/, node_modules/,
   docs/, scripts/ and the repo's root clutter stay unreachable. */
const SERVED = new Set(['index.html', 'kernel', 'apps', 'assets', 'vendor']);

/* Maps a request URL to an absolute file under root, or null if it is
   outside the served set or tries to escape the root. Exported for tests. */
export function resolveRequest(rawUrl, root) {
  let u;
  try { u = new URL(rawUrl); } catch (e) { return null; }
  if (u.protocol !== `${SCHEME}:` || u.hostname !== HOST) return null;
  let rel;
  try { rel = decodeURIComponent(u.pathname); } catch (e) { return null; }
  if (rel.includes('\0')) return null;
  rel = rel.replace(/^\/+/, '') || 'index.html';
  const full = normalize(join(root, rel));
  if (!full.startsWith(root + sep)) return null;
  const top = full.slice(root.length + 1).split(sep)[0];
  return SERVED.has(top) ? full : null;
}
