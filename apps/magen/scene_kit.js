import { VGA16 } from '../../kernel/god.js';

/* ---- the drawing kit for the store's backdrops ---------------------------
   One backdrop is one tile of TW x TH art pixels, painted once in the sixteen
   with whole-pixel rectangles and nothing else, and shown at twice that size
   (backdrops.js). Everything that is drawn wraps round the tile's edges, so
   the tile repeats across a row of any width without a seam. Greys of light
   are ordered dithers (the same 4x4 matrix the star's canvas uses), never
   blends. y = 0 is the top; the ground line is GY.
   ========================================================================== */
export const TW = 160, TH = 24;
const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const RGB = VGA16.map(p => 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')');
export const rgb = i => RGB[i & 15];
/* a small deterministic scatter, so a scene is the same every time it is drawn */
export const hash = n => { n = Math.imul(n ^ 0x9E3779B9, 0x85EBCA6B); n ^= n >>> 13; n = Math.imul(n, 0xC2B2AE35); return (n ^ (n >>> 16)) >>> 0; };

export function makeKit() {
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const g = cv.getContext('2d');
  let cur = -1;                       /* setting a fill style is the slow part, so only when the colour changes */
  const put = (x, y, w, h, c) => { c &= 15; if (c !== cur) { g.fillStyle = RGB[c]; cur = c; } g.fillRect(x, y, w, h); };
  const K = { cv, W: TW, H: TH, GY: 19 };

  /* a rectangle that wraps round the left and right edges of the tile */
  K.r = (x, y, w, h, c) => {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w <= 0 || h <= 0 || y >= TH || y + h <= 0) return K;
    if (w >= TW) { put(0, y, TW, h, c); return K; }
    x = ((x % TW) + TW) % TW;
    put(x, y, w, h, c);
    if (x + w > TW) put(x - TW, y, w, h, c);
    return K;
  };
  /* a dithered rectangle: lvl 0..16 of c2 over c1 */
  K.d = (x, y, w, h, c1, c2, lvl) => {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = ((x + i) % TW + TW) % TW, Y = y + j;
      if (Y < 0 || Y >= TH) continue;
      put(X, Y, 1, 1, BAY[Y & 3][X & 3] < lvl ? c2 : c1);
    }
    return K;
  };
  K.px = (x, y, c) => K.r(x, y, 1, 1, c);
  /* a dithered overlay: only the pixels the matrix picks are painted, the rest of what is underneath stays.
     This is how light falls on a scene without a blend. */
  K.wash = (x, y, w, h, c, lvl) => {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = ((x + i) % TW + TW) % TW, Y = y + j;
      if (Y >= 0 && Y < TH && BAY[Y & 3][X & 3] < lvl) put(X, Y, 1, 1, c);
    }
    return K;
  };
  K.glow = (cx, cy, rx, ry, c, lvl) => {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
      K.wash(cx - w, cy + y, w * 2 + 1, 1, c, lvl);
    }
    return K;
  };
  /* a round disc, one run per row */
  K.disc = (cx, cy, rad, c) => {
    for (let y = -rad; y <= rad; y++) {
      const w = Math.round(Math.sqrt(Math.max(0, rad * rad + 0.5 - y * y)));
      K.r(cx - w, cy + y, w * 2 + 1, 1, c);
    }
    return K;
  };
  /* sky: a at the top, b at the horizon, a dithered band between */
  K.sky = (a, b, from, to) => {
    from = from == null ? 3 : from; to = to == null ? 17 : to;
    for (let y = 0; y < TH; y++) {
      const t = Math.max(0, Math.min(1, (y - from) / (to - from)));
      K.d(0, y, TW, 1, a, b, Math.round(t * 16));
    }
    return K;
  };
  /* a periodic silhouette: cyc whole waves across the tile so it joins up */
  K.ridge = (base, amp, cyc, ph, c, c2) => {
    for (let x = 0; x < TW; x++) {
      const a = (x / TW) * Math.PI * 2;
      const h = Math.round(base + amp * Math.sin(a * cyc + ph) + amp * 0.45 * Math.sin(a * cyc * 3 + ph * 2));
      K.r(x, TH - h, 1, h, c);
      if (c2 != null) K.px(x, TH - h, c2);
    }
    return K;
  };
  K.ground = (h, c, edge, speck, sc) => {
    K.r(0, TH - h, TW, h, c);
    if (edge != null) K.r(0, TH - h, TW, 1, edge);
    if (speck != null) for (let i = 0; i < TW * h / 6; i++) {
      const v = hash(i * 7 + (sc || 1));
      K.px(v % TW, TH - h + 1 + ((v >>> 8) % Math.max(1, h - 1)), speck);
    }
    return K;
  };
  K.stars = (n, c1, c2, ymax, seed) => {
    for (let i = 0; i < n; i++) {
      const v = hash(i * 13 + (seed || 3));
      K.px(v % TW, (v >>> 9) % (ymax || 14), (v >>> 20) % 4 === 0 ? c2 : c1);
    }
    return K;
  };
  /* call fn(x) at x0, x0 + step, ... for every whole step in the tile */
  K.rep = (x0, step, fn) => { for (let x = x0, i = 0; x < TW + x0; x += step, i++) fn(x, i); return K; };
  return K;
}
