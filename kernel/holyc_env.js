/* What HolyC's Dir and Cd can see. The interpreter is synchronous and the disk is not, so a snapshot is taken before a program runs: the folder it starts in,
   the top of the disk, and the folders directly under both (enough for Dir("Doc") and Cd("::/Demo")). Names are listed folders-first, a folder with a slash. */
import { fs as vfs } from './vfs.js';

const norm = p => { let s = String(p || '').replace(/\\/g, '/').trim(); if (s.length > 2 && s.endsWith('/')) s = s.slice(0, -1); return s; };

export async function snapshot(cwd) {
  const lists = new Map();
  const grab = async p => {
    if (lists.has(p)) return;
    let l = [];
    try { l = await vfs.list(p); } catch (e) { l = []; }
    lists.set(p, l.slice().sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1) || a.name.localeCompare(b.name)));
  };
  cwd = norm(cwd) || '::';
  await grab('::'); await grab(cwd);
  for (const base of new Set(['::', cwd])) for (const e of (lists.get(base) || [])) if (e.type === 'folder') await grab(base === '::' ? '::/' + e.name : base + '/' + e.name);
  const abs = (p, from) => { p = norm(p); if (!p || p === '.') return from; if (p === '::' || p.startsWith('::/')) return p; if (p === '..') return from.indexOf('/') < 0 ? '::' : from.slice(0, from.lastIndexOf('/')) || '::'; if (p.charAt(0) === '/') return '::' + p; return from === '::' ? '::/' + p : from + '/' + p; };
  const state = { cwd };
  return {
    state,
    dirNames: p => { const l = lists.get(abs(p, state.cwd)); return l ? l.map(e => e.name + (e.type === 'folder' ? '/' : '')) : []; },
    cd: (p, apply) => { const t = abs(p, state.cwd); if (!lists.has(t)) return 0; state.cwd = t; if (apply) apply(t); return 1; }
  };
}
