/* The backyard puzzle, drawn (the picture the Cook's shed tab shows while you play): the lawn, the hedges and the pond, the shed, the van and the stall, the parts, the coins, the gnomes, the
   neighbours and the tax man, and you. Everything is in the machine's sixteen colours, two screen pixels to a pixel of the art (shed_art.js), on the Cook's own 420 x 320 page: the board is as
   many 30-pixel squares as the level has, in the middle of the room between the strip at the top and Jesse's box at the bottom. Red is what you may not end a turn on; the corners of a square
   say it will be red after this turn; an arrow on a neighbour says where she looks next; and the tax man leaves a ring where he is going. Pure drawing: it is handed the painters
   (R: rectangle, wash: dither) and asks the model (shed_model.js) what is where. */
import { DIRS, red, next, taxAt, facing } from './shed_model.js';
import { SHED, VAN, STALL, GNOME, TAX, JESSE, COIN, PARTS, neighbour, blit, sizeOf } from './shed_art.js';

export const T = 30, TOP = 36, ROOM = 212;                    /* the size of a square, where the board's room starts and how tall it is */
export const originOf = wd => [Math.round((420 - wd.w * T) / 2), TOP + Math.round((ROOM - wd.h * T) / 2)];
export const tileAt = (wd, mx, my) => { const [ox, oy] = originOf(wd), x = Math.floor((mx - ox) / T), y = Math.floor((my - oy) / T); return x >= 0 && y >= 0 && x < wd.w && y < wd.h ? [x, y] : null; };

const hash = (a, b, c, d) => { let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791) ^ (d * 2654435761); h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function createShedDraw(R, wash) {
  /* ground */
  function lawn(x, y, tx, ty) {
    R(x, y, T, T, 2);
    if ((tx + ty) % 2) wash(x, y, T, T, 0, 2);
    for (let k = 0; k < 5; k++) { const i = Math.floor(hash(tx, ty, k, 1) * 14), j = Math.floor(hash(tx, ty, k, 2) * 14); R(x + i * 2, y + j * 2, 2, 2, 10); }
    if (hash(tx, ty, 9, 9) < 0.07) { const i = 3 + Math.floor(hash(tx, ty, 8, 1) * 9), j = 3 + Math.floor(hash(tx, ty, 8, 2) * 9); R(x + i * 2, y + j * 2, 2, 2, [14, 15, 12, 13][Math.floor(hash(tx, ty, 8, 3) * 4)]); }
  }
  function hedge(x, y, tx, ty) {
    R(x, y, T, T, 0);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const ox = Math.floor(hash(tx, ty, i * 3 + j, 4) * 3) * 2, oy = Math.floor(hash(tx, ty, i * 3 + j, 5) * 3) * 2;
      R(x + i * 10 + ox, y + j * 10 + oy, 10, 10, 2);
      R(x + i * 10 + ox + 2, y + j * 10 + oy + 2, 4, 2, 10);
      R(x + i * 10 + ox, y + j * 10 + oy + 8, 10, 2, 0);
    }
  }
  function pond(x, y, tx, ty) {
    R(x, y, T, T, 1);
    for (let k = 0; k < 3; k++) { const i = Math.floor(hash(tx, ty, k, 6) * 10), j = Math.floor(hash(tx, ty, k, 7) * 14); R(x + i * 2, y + j * 2, 8, 2, 9); }
    if (hash(tx, ty, 5, 5) < 0.5) R(x + Math.floor(hash(tx, ty, 6, 6) * 13) * 2, y + Math.floor(hash(tx, ty, 6, 7) * 13) * 2, 2, 2, 11);
  }
  const at = (wd, tx, ty) => { const [ox, oy] = originOf(wd); return [ox + tx * T, oy + ty * T]; };
  /* a sprite standing in a square, its feet on the bottom of it */
  const stand = (rows, x, y, dx, dy) => { const [w, h] = sizeOf(rows); blit(R, rows, x + Math.round((T - w * 2) / 2) + (dx || 0), y + T - h * 2 - 1 + (dy || 0), 2); };
  const arrow = (x, y, d, c) => {               /* a little arrow on the edge of a square, pointing d */
    const cx = x + T / 2, cy = y + T / 2;
    if (d === 'E') { R(x + T - 8, cy - 2, 6, 4, c); R(x + T - 4, cy - 4, 2, 8, c); }
    else if (d === 'W') { R(x + 2, cy - 2, 6, 4, c); R(x + 2, cy - 4, 2, 8, c); }
    else if (d === 'N') { R(cx - 2, y + 2, 4, 6, c); R(cx - 4, y + 2, 8, 2, c); }
    else if (d === 'S') { R(cx - 2, y + T - 8, 4, 6, c); R(cx - 4, y + T - 4, 8, 2, c); }
  };
  const corners = (x, y, c) => { [[0, 0, 1, 1], [T - 6, 0, -1, 1], [0, T - 6, 1, -1], [T - 6, T - 6, -1, -1]].forEach(([dx, dy]) => { R(x + dx, y + dy, 6, 2, c); R(x + dx + (dx ? 4 : 0), y + dy, 2, 6, c); }); };

  /* the whole board for state `s` at time `t` (seconds, for the bobbing); `tween` { px, py, gn: [[x, y]...] } are where you and the gnomes are drawn if they are on their way */
  function board(wd, s, t, tween, o) {
    o = o || {};
    const [ox, oy] = originOf(wd), bob = Math.floor(t * 2.2) % 2, rd = red(wd, s), nx = next(wd, s);
    R(ox - 4, oy - 4, wd.w * T + 8, wd.h * T + 8, 0);
    for (let ty = 0; ty < wd.h; ty++) for (let tx = 0; tx < wd.w; tx++) {
      const c = wd.tiles[ty][tx], [x, y] = at(wd, tx, ty);
      if (c === '#') hedge(x, y, tx, ty); else if (c === '~') pond(x, y, tx, ty); else lawn(x, y, tx, ty);
    }
    /* what is red, under everything that stands on it */
    for (let ty = 0; ty < wd.h; ty++) for (let tx = 0; tx < wd.w; tx++) {
      const k = tx + ',' + ty, [x, y] = at(wd, tx, ty);
      if (wd.tiles[ty][tx] === 'S') continue;
      if (rd.has(k)) { wash(x, y, T, T, 12, 7); R(x, y, T, 2, 12); R(x, y + T - 2, T, 2, 12); R(x, y, 2, T, 12); R(x + T - 2, y, 2, T, 12); }
      else if (nx.has(k)) corners(x, y, 12);
    }
    /* the places */
    if (wd.shed) { const [x, y] = at(wd, wd.shed[0], wd.shed[1]); lawn(x, y, wd.shed[0], wd.shed[1]); blit(R, SHED, x, y, 2); }
    if (wd.van) { const [x, y] = at(wd, wd.van[0], wd.van[1]); lawn(x, y, wd.van[0], wd.van[1]); blit(R, VAN, x, y + 4, 2); if (s.van <= 0) wash(x, y, T, T, 0, 8); else for (let k = 0; k < Math.min(3, s.van); k++) R(x + 3 + k * 5, y + 1, 4, 3, 14); }
    if (wd.stall) { const [x, y] = at(wd, wd.stall[0], wd.stall[1]); lawn(x, y, wd.stall[0], wd.stall[1]); blit(R, STALL, x, y, 2); if (s.stall <= 0) wash(x, y, T, T, 0, 8); }
    /* what is lying about */
    wd.parts.forEach((p, i) => { if (!s.parts[i]) return; const [x, y] = at(wd, p[0], p[1]); stand(PARTS[i % PARTS.length], x, y, 0, -3 - bob * 2); R(x + 8, y + T - 3, 14, 2, 0); });
    wd.coins.forEach((p, i) => { if (!s.cn[i]) return; const [x, y] = at(wd, p[0], p[1]); stand(COIN, x, y, 0, -6 - bob * 2); });
    /* the tax man's round, a dotted line of squares, and where he stands */
    if (wd.tax && wd.tax.length > 1) {
      wd.tax.forEach((p, i) => { const [x, y] = at(wd, p[0], p[1]); R(x + 13, y + 13, 4, 4, 8); if (i) { const q = wd.tax[i - 1], [qx, qy] = at(wd, q[0], q[1]); R((x + qx) / 2 + 13, (y + qy) / 2 + 13, 4, 4, 8); } });
    }
    /* the neighbours: where she looks now is in her eyes, where she looks next is the arrow */
    wd.neighbours.forEach(n => {
      const [x, y] = at(wd, n.x, n.y), f = facing(n, s.t), nf = facing(n, s.t + 1);
      stand(neighbour(n.who, f), x, y, 0, 0);
      if (nf === '-') { if (o.zs !== false) { R(x + T - 11, y + 1, 8, 2, 15); R(x + T - 8, y + 3, 2, 2, 15); R(x + T - 11, y + 5, 8, 2, 15); } } else arrow(x, y, nf, 14);
    });
    /* the gnomes, and you */
    s.gn.forEach((g, i) => { const w = tween && tween.gn && tween.gn[i] ? tween.gn[i] : g, [x, y] = at(wd, 0, 0); stand(GNOME, x + w[0] * T, y + w[1] * T, 0, 0); });
    const tx = taxAt(wd, s.t), ntx = taxAt(wd, s.t + 1);
    if (tx) { const [x, y] = at(wd, tx[0], tx[1]); stand(TAX, x, y, 0, 0); if (ntx && (ntx[0] !== tx[0] || ntx[1] !== tx[1])) { const [mx, my] = at(wd, ntx[0], ntx[1]); R(mx + 2, my + 2, T - 4, 2, 12); R(mx + 2, my + T - 4, T - 4, 2, 12); R(mx + 2, my + 2, 2, T - 4, 12); R(mx + T - 4, my + 2, 2, T - 4, 12); } }
    const pxy = tween && tween.p ? tween.p : [s.x, s.y], [bx, by] = at(wd, 0, 0), ppx = bx + pxy[0] * T, ppy = by + pxy[1] * T;
    if (!o.hidePlayer) {
      stand(JESSE, ppx, ppy, 0, 0);
      if (s.held) stand(PARTS[(o.heldIx || 0) % PARTS.length], ppx, ppy, 0, -26);
    }
    if (o.dead) { wash(ox, oy, wd.w * T, wd.h * T, 12, 5); }
    return { rd, nx };
  }
  return { board, at, T };
}
