/* The tray along the bottom of the credits screen: one cell for each thing the four have given you, where it goes when the hand has let go of it. The first four cells are always there
   (empty until the first visit's hands have come); the second four only appear when their thing is yours. Hovering one says what it is and where it works. Pure geometry (credits_check.js)
   and one drawing function. */
import { cookie, BORSEC, GOOSE, BLUEPRINT, CHIPS, BEER, MORGAN, POTION, drawGrid, sizeOf, css } from './sprites.js';

export const CELL = 44, ITEM = 2;                                  /* a cell is 44 pixels, the thing in it twice its own pixels */
export const ORDER = ['cookie', 'borsec', 'goose', 'blueprint', 'chips', 'biscubeer', 'morgan', 'potion'];
export const ROWS = { cookie: cookie(16), borsec: BORSEC, goose: GOOSE, blueprint: BLUEPRINT, chips: CHIPS, biscubeer: BEER, morgan: MORGAN, potion: POTION };

/* the cell for each item: along the bottom, centred as a row of however many are showing */
export function layout(W, H, shown) {
  const n = Math.max(1, shown.length), x0 = Math.round((W - n * CELL) / 2), y = H - CELL - 6, out = {};
  shown.forEach((id, i) => { const x = x0 + i * CELL; out[id] = { x, y, w: CELL, h: CELL, cx: x + CELL / 2, cy: y + CELL / 2 }; });
  return out;
}
/* which cells show: the first four, and each of the others that is yours */
export const shownOf = has => ORDER.filter((id, i) => i < 4 || has(id));
export const hit = (cells, mx, my) => Object.keys(cells).find(id => { const c = cells[id]; return mx >= c.x && mx < c.x + c.w && my >= c.y && my < c.y + c.h; }) || null;

export function drawTray(g, cells, has, hover) {
  const ids = Object.keys(cells);
  if (!ids.length) return;
  const first = cells[ids[0]], last = cells[ids[ids.length - 1]];
  g.fillStyle = css(0); g.fillRect(first.x - 6, first.y - 4, last.x + last.w - first.x + 12, CELL + 8);
  ids.forEach(id => {
    const c = cells[id];
    g.fillStyle = css(has(id) ? 1 : 0); g.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    g.fillStyle = css(id === hover ? 14 : has(id) ? 11 : 8);
    g.fillRect(c.x, c.y, c.w, 2); g.fillRect(c.x, c.y + c.h - 2, c.w, 2); g.fillRect(c.x, c.y, 2, c.h); g.fillRect(c.x + c.w - 2, c.y, 2, c.h);
    if (has(id)) { const [w, h] = sizeOf(ROWS[id]); drawGrid(g, ROWS[id], c.cx - w * ITEM / 2, c.cy - h * ITEM / 2, ITEM); }
  });
}
