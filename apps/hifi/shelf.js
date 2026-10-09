/* The shelf as plain data (pure: Node runs it in shelf_check.js). A disc is a track record; the shelf is an array of them. The pressed discs (the games' folders) are pinned
   where they are; the discs somebody brought are theirs to move, sort, put in folders of their own, and pick several of at once. Every call that moves things hands back
   `map` (old index -> new index), which is how the playing disc, the picked discs and the scroll find themselves again. */
export const DIR_MAX = 34;
const RESERVED = ['SHELF', 'ALL', 'UNSORTED', 'FAVOURITES', 'FAVORITES', 'RECENT', 'MOST PLAYED'];

/* the form two spellings are compared in: full-width and half-width the same, no case, no accents */
export const fold = s => String(s == null ? '' : s).normalize('NFKC').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
export function matches(t, q) {
  const w = fold(q); if (!w) return true;
  const hay = fold([t.name, t.artist, t.album, t.genre, t.folder, t.year].join(' | '));
  return w.split(' ').every(p => hay.indexOf(p) >= 0);
}

/* ---- folders ---- */
export const cleanDir = s => String(s == null ? '' : s).replace(/[\/\\\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, DIR_MAX);
export function dirError(name, dirs, builtin) {
  const n = cleanDir(name);
  if (!n) return 'A FOLDER NEEDS A NAME.';
  if (RESERVED.indexOf(n) >= 0) return n + ' IS A NAME THE SHELF USES.';
  if (dirs.some(d => cleanDir(d.name) === n) || (builtin || []).some(b => cleanDir(b) === n)) return 'THERE IS ALREADY A FOLDER CALLED ' + n + '.';
  return '';
}
export const userIdx = list => { const o = []; list.forEach((t, i) => { if (!t.builtin) o.push(i); }); return o; };

/* put discs in a folder ({ name, tint }) or back on the shelf (null); the pressed ones stay in their game's folder. Returns how many moved. */
export function moveToDir(list, idxs, dir) {
  let n = 0;
  idxs.forEach(i => {
    const t = list[i];
    if (!t || t.builtin) return;
    const to = dir ? dir.name : null;
    if ((t.folder || null) === to) return;
    t.folder = to; t.folderTint = dir ? dir.tint : undefined; n++;
  });
  return n;
}
/* a folder that goes: its discs go back on the shelf */
export function dropDir(list, name) { let n = 0; list.forEach(t => { if (!t.builtin && t.folder === name) { t.folder = null; t.folderTint = undefined; n++; } }); return n; }
export function renameDir(list, from, to, tint) { list.forEach(t => { if (!t.builtin && t.folder === from) { t.folder = to; if (tint) t.folderTint = tint; } }); }

/* ---- order ---- */
const apply = (list, slots, seq) => { slots.forEach((at, k) => { list[at] = seq[k]; }); };
function mapOf(before, list) { const at = new Map(); before.forEach((t, i) => at.set(t, i)); const m = new Map(); list.forEach((t, j) => m.set(at.get(t), j)); return m; }

/* the picked discs, kept in the order they have, go together to stand before the disc at `to` (a list index; list.length is the end) */
export function reorder(list, idxs, to) {
  const before = list.slice(), slots = userIdx(list), U = slots.map(i => list[i]);
  const pick = new Set(idxs.filter(i => list[i] && !list[i].builtin).map(i => list[i]));
  if (!pick.size) return { map: mapOf(before, list), moved: 0 };
  let p = 0; for (const i of slots) { if (i < to) p++; else break; }
  const moving = U.filter(t => pick.has(t)), rest = U.filter(t => !pick.has(t));
  const gone = U.slice(0, p).filter(t => pick.has(t)).length;
  rest.splice(p - gone, 0, ...moving);
  apply(list, slots, rest);
  return { map: mapOf(before, list), moved: moving.length };
}

/* the picked discs one place up (-1) or down (+1), as a block that stops at the ends */
export function shift(list, idxs, delta) {
  const before = list.slice(), slots = userIdx(list), U = slots.map(i => list[i]);
  const pick = new Set(idxs.map(i => list[i]).filter(t => t && !t.builtin));
  const up = delta < 0;
  for (let k = 0; k < Math.abs(delta); k++) {
    if (up) for (let i = 1; i < U.length; i++) { if (pick.has(U[i]) && !pick.has(U[i - 1])) { const t = U[i]; U[i] = U[i - 1]; U[i - 1] = t; } }
    else for (let i = U.length - 2; i >= 0; i--) { if (pick.has(U[i]) && !pick.has(U[i + 1])) { const t = U[i]; U[i] = U[i + 1]; U[i + 1] = t; } }
  }
  apply(list, slots, U);
  return { map: mapOf(before, list) };
}
/* the picked discs to the very top or bottom of the shelf */
export const toEnd = (list, idxs, top) => reorder(list, idxs, top ? 0 : list.length);

export const SORTS = {
  name: (a, b) => fold(a.name).localeCompare(fold(b.name)),
  artist: (a, b) => fold(a.artist).localeCompare(fold(b.artist)) || fold(a.album).localeCompare(fold(b.album)) || (a.no || 0) - (b.no || 0) || fold(a.name).localeCompare(fold(b.name)),
  album: (a, b) => fold(a.album).localeCompare(fold(b.album)) || (a.no || 0) - (b.no || 0) || fold(a.name).localeCompare(fold(b.name)),
  dur: (a, b) => (a.dur || 0) - (b.dur || 0),
  added: (a, b) => (a.added || 0) - (b.added || 0),
  plays: (a, b) => (b.plays || 0) - (a.plays || 0),
  year: (a, b) => (a.year || 9999) - (b.year || 9999) || fold(a.name).localeCompare(fold(b.name))
};
/* put the shelf itself in this order (only the discs somebody brought: the pressed ones do not move) */
export function sortUser(list, key, desc) {
  const before = list.slice(), slots = userIdx(list), U = slots.map(i => list[i]);
  const cmp = SORTS[key] || SORTS.name;
  const idx = new Map(U.map((t, i) => [t, i]));
  U.sort((a, b) => (desc ? -1 : 1) * cmp(a, b) || idx.get(a) - idx.get(b));
  apply(list, slots, U);
  return { map: mapOf(before, list) };
}

/* ---- albums ---- */
export function albums(list, idxs) {
  const g = new Map();
  idxs.forEach(i => {
    const t = list[i]; if (!t) return;
    const name = t.album || (t.builtin ? t.folder : '') || '', key = fold(name) || '\u0000';
    const a = g.get(key) || { key, name: name || 'NO ALBUM', artist: '', idx: [], year: null, loose: !name };
    a.idx.push(i);
    if (!a.artist) a.artist = t.artist || ''; else if (a.artist !== (t.artist || '') && a.artist !== 'VARIOUS ARTISTS') a.artist = 'VARIOUS ARTISTS';
    if (!a.year && t.year) a.year = t.year;
    g.set(key, a);
  });
  const out = [...g.values()];
  out.forEach(a => a.idx.sort((x, y) => ((list[x].no || 9999) - (list[y].no || 9999)) || (x - y)));
  return out.sort((a, b) => (a.loose ? 1 : 0) - (b.loose ? 1 : 0) || fold(a.name).localeCompare(fold(b.name)));
}

/* ---- picking several ---- */
export const emptyPick = () => ({ set: new Set(), anchor: null });
/* a click on `i`, with Ctrl and/or Shift, among the discs in `order` (the indices as they stand on screen) */
export function pick(sel, i, mods, order) {
  const set = new Set(sel.set);
  if (mods && mods.shift && sel.anchor != null && order.indexOf(sel.anchor) >= 0 && order.indexOf(i) >= 0) {
    const a = order.indexOf(sel.anchor), b = order.indexOf(i);
    if (!(mods.ctrl)) set.clear();
    for (let k = Math.min(a, b); k <= Math.max(a, b); k++) set.add(order[k]);
    return { set, anchor: sel.anchor };
  }
  if (mods && mods.ctrl) { if (set.has(i)) set.delete(i); else set.add(i); return { set, anchor: i }; }
  return { set: new Set([i]), anchor: i };
}
/* after discs moved or went: the pick follows them */
export function follow(sel, map) {
  const set = new Set(); sel.set.forEach(i => { if (map.has(i)) set.add(map.get(i)); });
  return { set, anchor: sel.anchor != null && map.has(sel.anchor) ? map.get(sel.anchor) : null };
}
export const sorted = sel => [...sel.set].sort((a, b) => a - b);
