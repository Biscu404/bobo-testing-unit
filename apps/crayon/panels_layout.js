/* Where the Crayon's panels stand when nobody has put them anywhere yet, and where a remembered one may stand (pure: node apps/crayon/panels_check.js).
   Two columns of panels beside the sheet: on its right if the desktop has the room, else on its left, else over its right edge; each at least partly on the desktop. */
export const GAP = 8;

/* defs: [{ id, w, h, col }], owner: { x, y, w, h }, desk: { w, h } -> { id: { x, y } } */
export function arrange(defs, owner, desk) {
  const cols = [];
  defs.forEach(d => { (cols[d.col] = cols[d.col] || []).push(d); });
  const widths = cols.map(c => Math.max(...c.map(d => d.w)));
  const heights = cols.map(c => c.reduce((s, d) => s + d.h, 0) + GAP * (c.length - 1));
  const total = widths.reduce((s, w) => s + w, 0) + GAP * (cols.length - 1), tall = Math.max(...heights);
  let x0 = owner.x + owner.w + GAP;
  if (x0 + total > desk.w - 4) x0 = owner.x - GAP - total;
  if (x0 < 4) x0 = Math.max(4, desk.w - total - 4);
  const y0 = Math.max(4, Math.min(owner.y, desk.h - tall - 4));
  const out = {};
  let x = x0;
  cols.forEach((c, ci) => {
    let y = y0;
    c.forEach(d => { out[d.id] = { x: Math.round(x), y: Math.round(y) }; y += d.h + GAP; });
    x += widths[ci] + GAP;
  });
  return out;
}

/* a remembered place, kept where its title bar can still be reached */
export function clampAt(at, size, desk) {
  const x = Math.max(0, Math.min(Math.round(+at.x || 0), Math.max(0, desk.w - Math.min(size.w, 120))));
  const y = Math.max(0, Math.min(Math.round(+at.y || 0), Math.max(0, desk.h - 30)));
  return { x, y };
}
