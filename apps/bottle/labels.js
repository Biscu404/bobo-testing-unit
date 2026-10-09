/* The paper on a bottle: its frame, the name, the little picture and the two lines of small print, laid out for the label's own size (shapes.js gives each bottle its own).
   A drink may hand over `X.icon` (a picture in thirteen-by-eleven units, drinks.js) or `X.paint` (the whole inside of the label, for a label that is a picture of its own). */
/* a size for `text` that fits in `w` pixels in a monospace face: `size` at most, `k` the width of a character per pixel of size */
export const fit = (text, w, size, k) => Math.max(4, Math.min(size, Math.floor(w / (Math.max(1, text.length) * k) * 10) / 10));

/* the Jägermeister's stag, which every label without a picture of its own wears */
const stag = (r, x, y, s, ink) => {
  const q = (a, b, w2, h2) => r(x + a * s, y + b * s, Math.max(1, w2 * s), Math.max(1, h2 * s), ink);
  q(4, 5, 5, 5); q(5, 10, 3, 3); q(3, 7, 1, 2); q(9, 7, 1, 2);
  q(3, 1, 1, 5); q(9, 1, 1, 5); q(1, 2, 2, 1); q(10, 2, 2, 1); q(1, 2, 1, 2); q(11, 2, 1, 2);
  q(2, 0, 2, 1); q(9, 0, 2, 1); q(0, 4, 1, 2); q(12, 4, 1, 2);
  r(x + 6 * s, y - 5.2 * s, 1.2 * s, 5 * s, ink); r(x + 4.6 * s, y - 3.4 * s, 4 * s, 1.2 * s, ink);
  r(x + 6.2 * s, y - 5 * s, 0.8 * s, 4.6 * s, '#fffbe0'); r(x + 4.8 * s, y - 3.2 * s, 3.6 * s, 0.8 * s, '#fffbe0');
};

/* g2: the sprite's context (text is drawn through it), r: fills a rectangle, K: the colours, X: the words and picture, L: { top, w, h } from shapes.js */
export function drawLabel(g2, r, K, X, L) {
  const lw = L.w, lh = L.h, lx = -lw / 2, ly = -L.top, small = lh < 60, tw = lw - 6;
  r(lx, ly, lw, lh, K.label); r(lx, ly, lw, 3, K.labelHi); r(lx, ly + lh - 3, lw, 3, K.labelDk);
  r(lx + 3, ly + 3, lw - 6, 1, K.ink); r(lx + 3, ly + lh - 4, lw - 6, 1, K.ink);
  r(lx + 3, ly + 3, 1, lh - 6, K.ink); r(lx + lw - 4, ly + 3, 1, lh - 6, K.ink);
  if (X.paint) { X.paint(g2, r, K, { x: lx + 4, y: ly + 4, w: lw - 8, h: lh - 8 }); return; }
  g2.fillStyle = K.ink; g2.textAlign = 'center';
  g2.font = 'bold ' + fit(X.title, tw, 9, 0.62) + 'px serif'; g2.fillText(X.title, 0, ly + (small ? 14 : 17));
  const room = lh - (small ? 20 : 34) - (small ? 6 : 20), s = Math.max(1, Math.min(2.6, room / 11, (lw - 6) / 13));
  const ix = -Math.round(13 * s / 2), iy = ly + (small ? 20 : 34);
  if (X.icon) X.icon(r, ix, iy, s, K); else stag(r, ix, iy, s, K.ink);
  if (!small) {
    g2.font = fit(X.sub1, tw, 6, 0.6) + 'px monospace'; g2.fillText(X.sub1, 0, ly + lh - 14);
    g2.font = fit(X.sub2, tw, 5, 0.6) + 'px monospace'; g2.fillText(X.sub2, 0, ly + lh - 7);
  }
}
