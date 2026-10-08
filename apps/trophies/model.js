/* What the ledger shows, as plain data (no DOM): the areas down the left side with how far each is, and the cards of one area in the order worth reading them in. Pure, so
   scripts/check-trophies.mjs holds it. `T` is the engine (kernel/trophies_core.js). A card's state is one of: done, open, closed. A mirror (a game's own achievement, shown but
   never counted) is listed apart, under its game. */
export const ORDER = ['system', 'sweeper', 'solitaire', 'aftere', 'garden', 'cook', 'magen', 'standbattle', 'bekkedal', 'bottle', 'elephant', 'crayon', 'garage', 'hifi', 'notes', 'holyc', 'tools', 'meta'];
export const state = (T, d) => T.earned(d.id) ? 'done' : T.closed(d) ? 'closed' : 'open';

/* [have, need] as a fraction in 0..1, or -1 when the trophy is an event with nothing to count */
export function ratio(T, d) { const p = T.progressOf(d); return p && p[1] > 0 ? p[0] / p[1] : -1; }

export function areas(T) {
  const out = [];
  ORDER.forEach(id => {
    const all = [...T.defs.values()].filter(d => d.app === id);
    if (!all.length) return;
    const own = all.filter(d => !d.legacy), live = own.filter(d => !T.closed(d) || T.earned(d.id));
    const done = own.filter(d => T.earned(d.id)).length, total = own.filter(d => !T.closed(d)).length;
    const mirrors = all.filter(d => d.legacy), mdone = mirrors.filter(d => T.earned(d.id)).length;
    const seal = T.defs.get('mastery_' + id);
    out.push({ id: id, done: done, total: total, mirrors: mirrors.length, mirrorsDone: mdone, mastered: !!(seal && T.earned(seal.id)), sealed: !!seal, open: live.length });
  });
  return out;
}

/* nearest to completion first, so the card at the top is always the next thing worth doing; finished ones after, the newest first; closed ones last */
export function sorted(T, list) {
  const rank = d => { const s = state(T, d); return s === 'open' ? 0 : s === 'done' ? 1 : 2; };
  return list.slice().sort((a, b) => {
    const ra = rank(a), rb = rank(b); if (ra !== rb) return ra - rb;
    if (ra === 0) { const xa = ratio(T, a), xb = ratio(T, b); if (xa !== xb) return xb - xa; return a.secret - b.secret; }
    if (ra === 1) return (T.st.earned[b.id] || 0) - (T.st.earned[a.id] || 0);
    return 0;
  });
}

/* the cards of one area ('all' is every area's nearest ones), through the filter (all / open / done), the kinds switched on and a search */
export function cards(T, area, o) {
  o = o || {}; const q = (o.query || '').trim().toUpperCase(), kinds = o.kinds || null;
  let list = [...T.defs.values()].filter(d => (area === 'all' ? !d.legacy : d.app === area));
  if (o.filter === 'open') list = list.filter(d => state(T, d) === 'open');
  else if (o.filter === 'done') list = list.filter(d => state(T, d) === 'done');
  if (kinds && kinds.length) list = list.filter(d => kinds.indexOf(d.kind) >= 0);
  if (q) list = list.filter(d => (T.plainName(d) + ' ' + T.plainDesc(d)).toUpperCase().indexOf(q) >= 0 || (T.earned(d.id) || !d.secret ? false : T.hintOf(d).toUpperCase().indexOf(q) >= 0));
  list = sorted(T, list);
  if (area === 'all') list = list.slice(0, 60);
  return { own: list.filter(d => !d.legacy), mirrors: list.filter(d => d.legacy) };
}

export function totals(T) {
  const live = [...T.defs.values()].filter(d => !d.legacy && !T.closed(d));
  const by = tier => ({ done: live.filter(d => d.tier === tier && T.earned(d.id)).length, total: live.filter(d => d.tier === tier).length });
  return { done: T.count(), total: T.total(), B: by('B'), S: by('S'), G: by('G'),
    secrets: live.filter(d => d.secret && !T.earned(d.id)).length, secretsDone: live.filter(d => d.secret && T.earned(d.id)).length };
}
