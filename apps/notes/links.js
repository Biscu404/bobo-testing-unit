/* The links of a vault of notes, as pure functions (no DOM, no clock): what `[[Another Note]]` points at, and the shape the whole vault makes. NOTES draws a page and a graph from
   these and the trophies ask them questions; `node apps/notes/links_check.js` holds them. A link is `[[title]]` or `[[title|alias]]`, case does not matter, and a link to a note that
   does not exist is a promise (drawn red). */
export const LINK_RE = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g;

/* every [[name]] in a body, in order, without duplicates */
export function linksOf(n) {
  const out = [];
  String(n.body || '').replace(LINK_RE, (m, t) => { const k = t.trim(); if (k && out.indexOf(k) < 0) out.push(k); return m; });
  return out;
}

/* the vault as a graph: `edges` are [from, to] pairs of distinct notes that both exist (a pair once, however often it is linked), `promises` the titles that are linked and not written */
export function graphOf(notes) {
  const byTitle = new Map();
  notes.forEach(n => byTitle.set(String(n.title).toLowerCase().trim(), n));
  const edges = [], seen = new Set(), promises = new Set();
  notes.forEach(a => linksOf(a).forEach(t => {
    const b = byTitle.get(t.toLowerCase());
    if (!b) { promises.add(t.toLowerCase()); return; }
    if (b === a) return;
    const k = a.id + '>' + b.id;
    if (!seen.has(k)) { seen.add(k); edges.push([a.id, b.id]); }
  }));
  return { edges, promises: [...promises] };
}

/* what the shape says: the largest joined piece (its notes and its links), a ring of three, the most notes any one note is linked from, and whether nobody is left out */
export function facts(notes) {
  const g = graphOf(notes), ids = notes.map(n => n.id);
  const adj = new Map(ids.map(i => [i, new Set()])), out = new Map(ids.map(i => [i, new Set()])), into = new Map(ids.map(i => [i, new Set()]));
  g.edges.forEach(([a, b]) => { adj.get(a).add(b); adj.get(b).add(a); out.get(a).add(b); into.get(b).add(a); });
  /* components, by flood */
  const comp = new Map(); let best = { notes: 0, links: 0 };
  ids.forEach(i => {
    if (comp.has(i)) return;
    const stack = [i], members = [];
    comp.set(i, i);
    while (stack.length) { const x = stack.pop(); members.push(x); adj.get(x).forEach(y => { if (!comp.has(y)) { comp.set(y, i); stack.push(y); } }); }
    const set = new Set(members), links = g.edges.filter(([a, b]) => set.has(a) && set.has(b)).length;
    if (members.length > best.notes || (members.length === best.notes && links > best.links)) best = { notes: members.length, links: links };
  });
  let ring = false;
  g.edges.forEach(([a, b]) => out.get(b).forEach(c => { if (c !== a && c !== b && out.get(c).has(a)) ring = true; }));
  const hub = ids.reduce((m, i) => Math.max(m, into.get(i).size), 0);
  const joined = ids.length > 0 && ids.every(i => adj.get(i).size > 0);
  return { notes: ids.length, links: g.edges.length, web: best, ring: ring, hub: hub, joined: joined, promises: g.promises.length };
}
