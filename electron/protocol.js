/* templeos://app/ - the one permanent origin the machine runs from.
   Browser storage (IndexedDB, localStorage) is keyed by scheme+host, so this
   must NEVER change once saves exist. See docs/electron-migration-plan.md §1. */
import { protocol } from 'electron';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { SCHEME, resolveRequest } from './resolve.js';

export { ORIGIN } from './resolve.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
};

/* The app has no inline scripts, eval, workers or remote origins. Inline
   styles and data:/blob: images are in real use today. */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/* Must run before app 'ready'. */
export function registerScheme() {
  protocol.registerSchemesAsPrivileged([{
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  }]);
}

export function handleScheme(root) {
  protocol.handle(SCHEME, async (req) => {
    const headers = { 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store' };
    const file = resolveRequest(req.url, root);
    if (!file) return new Response('Not found', { status: 404, headers });
    try {
      const body = await readFile(file);
      headers['Content-Type'] = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
      return new Response(body, { status: 200, headers });
    } catch (e) {
      return new Response('Not found', { status: 404, headers });
    }
  });
}
