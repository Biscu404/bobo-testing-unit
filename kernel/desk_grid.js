/* Where desktop icons go: whole cells of one grid, from the same (8, 8) origin every layout function uses, so
   nothing can end up between two cells. Pure (no DOM), so `node scripts/check-desk.mjs` can hold it to its
   numbers.

   The old placement asked, for every icon, "which cells are taken?" by walking all the icons, and walked outward
   from its cell ring by ring through every cell of each ring when the desk was full; with two hundred icons that
   was the whole of a redraw. Now one occupancy map is built once and each icon is one lookup, and an outward search
   visits only the border of each ring. A desk with more icons than cells piles the extras in the last cell, each a
   few pixels off the one under it, instead of hiding them all at the same point. */
export const ICON_W = 84, ICON_H = 78, ORIGIN = 8, PILE_STEP = 5, PILE_MAX = 7;

export const gridOf = (w, h) => ({
  cols: Math.max(1, Math.floor((w - ORIGIN) / ICON_W)),
  rows: Math.max(1, Math.floor((h - ORIGIN) / ICON_H))
});
/* the default slot of the i-th icon: down a column, then the next */
export const slotOf = (i, h) => {
  const rows = Math.max(1, Math.floor((h - 12) / ICON_H));
  return { x: ORIGIN + Math.floor(i / rows) * ICON_W, y: ORIGIN + (i % rows) * ICON_H };
};
export const cellOf = (x, y) => ({ c: Math.round((x - ORIGIN) / ICON_W), r: Math.round((y - ORIGIN) / ICON_H) });
export const cellPos = (c, r) => ({ x: ORIGIN + c * ICON_W, y: ORIGIN + r * ICON_H });
const key = (c, r) => c + ',' + r;

/* the nearest free cell to (c0, r0) inside the grid, ring by ring (the border of each ring only); null if there is none */
export function nearestFree(taken, c0, r0, cols, rows) {
  const free = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows && !taken.has(key(c, r));
  if (free(c0, r0)) return { c: c0, r: r0 };
  const reach = Math.max(c0, cols - 1 - c0) + Math.max(r0, rows - 1 - r0);
  for (let ring = 1; ring <= reach; ring++) {
    for (let d = -ring; d <= ring; d++) {
      if (free(c0 + d, r0 - ring)) return { c: c0 + d, r: r0 - ring };
      if (free(c0 + d, r0 + ring)) return { c: c0 + d, r: r0 + ring };
    }
    for (let d = -ring + 1; d <= ring - 1; d++) {
      if (free(c0 - ring, r0 + d)) return { c: c0 - ring, r: r0 + d };
      if (free(c0 + ring, r0 + d)) return { c: c0 + ring, r: r0 + d };
    }
  }
  return null;
}

/* Lay a list out. items: [{ name }] in desk order; stored: name -> { x, y } where each was last (or nothing);
   arrivals: spots for newcomers dropped from a window (consumed in order); dims: { w, h } of the desktop.
   Icons that already have a place keep it before any newcomer is placed, so a new file never bumps an old one.
   Returns Map name -> { x, y }. */
export function layout(items, stored, arrivals, dims) {
  const { cols, rows } = gridOf(dims.w, dims.h);
  const taken = new Set(), out = new Map(), want = new Map();
  const clampCell = p => { const c = cellOf(p.x, p.y); return { c: Math.max(0, Math.min(cols - 1, c.c)), r: Math.max(0, Math.min(rows - 1, c.r)) }; };
  const arr = arrivals ? arrivals.slice() : [];
  const needs = [];
  items.forEach((it, i) => {
    const st = stored[it.name];
    if (st) {
      const w = clampCell(st);
      if (!taken.has(key(w.c, w.r))) { taken.add(key(w.c, w.r)); out.set(it.name, cellPos(w.c, w.r)); return; }
      want.set(it.name, w);
    }
    needs.push([it, i]);
  });
  let piled = 0;
  needs.forEach(([it, i]) => {
    const w = want.get(it.name) || clampCell((arr.length ? arr.shift() : null) || slotOf(i, dims.h));
    const cell = nearestFree(taken, w.c, w.r, cols, rows);
    if (cell) { taken.add(key(cell.c, cell.r)); out.set(it.name, cellPos(cell.c, cell.r)); return; }
    const p = cellPos(cols - 1, rows - 1), k = (piled++ % (PILE_MAX + 1)) * PILE_STEP;
    out.set(it.name, { x: p.x - k, y: p.y - k });
  });
  return out;
}
