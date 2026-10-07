/* The things Dave sticks on the monitor's case (kernel/cos_data.js FRAMES[].deco).
   Each one is drawn here as pixel art at the size it is shown at (1 SVG unit = 1 screen pixel, crisp edges), so the
   machine never scales or smears it, and none of it is stretched to the shape of the window.

   THE RULE FOR A DECORATION. The case is a thin ring of plastic round the glass (about 10 to 30 pixels, whatever the window),
   plus the chin underneath, which carries the knobs, the power button and the lamp. A frame's decoration lives on that plastic:
   in a corner, hugging the edge, no thicker than FLAT below, so it never lies over the menu bar, the desktop, the taskbar or a
   control. The old LUNAR LANDER foil was 38% of the monitor in each direction, stretched to its shape and the second piece
   not even turned round, so it sat over the File menu, the icons, the clock and the knobs. Sizes here are therefore in
   pixels (never a percentage of the monitor) and a corner piece is anchored to its corner. */

const px = (x, y, w, h, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
const wrap = (w, h, body) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h +
  '" shape-rendering="crispEdges">' + body + '</svg>';

/* a disc as a staircase of rows: a circle on a machine that will not anti-alias anything */
function disc(x, y, d, fill) {
  const r = d / 2;
  let out = '';
  for (let j = 0; j < d; j++) {
    const dy = j + 0.5 - r;
    const w = 2 * Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    if (w > 0) out += px(x + r - w / 2, y + j, w, 1, fill);
  }
  return out;
}

/* An L of material wrapped round a corner of the case: a strip `tt` thick and `tl` long along the top edge, a strip `lt`
   thick and `ll` long down the left edge, each ending in a ragged diagonal tear. `flip` turns the whole piece half a
   turn (integer translate, so it stays on the pixel grid) for the opposite corner. */
function cornerPiece(o) {
  const W = Math.max(o.tl, o.lt) + 1, H = Math.max(o.ll, o.tt) + 1;
  const jag = o.jag, slope = o.slope;
  const xmax = y => o.tl - y * slope + jag[y % jag.length];
  const ymax = x => o.ll - x * slope + jag[(x + 2) % jag.length];
  let s = '';
  /* the edge in shadow, one pixel proud of the body on the sides that face the glass */
  for (let y = 0; y < o.tt; y++) s += px(0, y, xmax(y) + 1, 1, o.edge);
  for (let x = 0; x < o.lt; x++) s += px(x, 0, 1, ymax(x) + 1, o.edge);
  s += px(0, o.tt, xmax(o.tt - 1) + 1, 1, o.edge);
  s += px(o.lt, 0, 1, ymax(o.lt - 1) + 1, o.edge);
  /* the body */
  for (let y = 0; y < o.tt; y++) s += px(0, y, xmax(y), 1, o.base);
  for (let x = 0; x < o.lt; x++) s += px(x, 0, 1, ymax(x), o.base);
  /* the light catching the outer edge */
  for (let y = 0; y < Math.min(2, o.tt); y++) s += px(0, y, Math.max(0, xmax(y) - 5), 1, o.hi);
  for (let x = 0; x < Math.min(2, o.lt); x++) s += px(x, 0, 1, Math.max(0, ymax(x) - 5), o.hi);
  /* creases and flecks, which make a flat colour read as a material */
  (o.creaseX || []).forEach(cx => {
    if (cx + 3 < xmax(o.tt - 1) - 2) s += px(cx, 0, 1, o.tt >> 1, o.crease) + px(cx + 2, o.tt >> 1, 1, o.tt - (o.tt >> 1), o.crease) + px(cx + 1, o.tt >> 1, 1, 1, o.crease);
  });
  (o.creaseY || []).forEach(cy => {
    if (cy + 3 < ymax(o.lt - 1) - 2) s += px(0, cy, o.lt >> 1, 1, o.crease) + px(o.lt >> 1, cy + 2, o.lt - (o.lt >> 1), 1, o.crease) + px(o.lt >> 1, cy + 1, 1, 1, o.crease);
  });
  (o.fleck || []).forEach(f => { s += px(f[0], f[1], f[2] || 2, 1, o.fleckc || o.hi); });
  if (o.flip) s = '<g transform="translate(' + W + ',' + H + ') rotate(180)">' + s + '</g>';
  return wrap(W, H, s);
}

/* gold foil, taped over two corners of the case */
const FOIL = { base: '#d8aa3c', hi: '#f0cc66', edge: '#7a5410', crease: '#b8861c', fleckc: '#fff0a0', slope: 3, jag: [0, 2, -1, 3, -2, 1] };

/* a pot's worth of moss, growing in from two corners */
const MOSS = { base: '#4a6e2d', hi: '#6f9a3c', edge: '#2a4318', crease: '#35551f', fleckc: '#9cc450', slope: 4, jag: [0, 3, -2, 4, -3, 1, 2, -4] };

/* a screw head, twelve pixels across, a slot cut across it */
function screw() {
  return wrap(12, 12, disc(0, 0, 12, '#585d64') + disc(1, 1, 10, '#0d0f11') + px(3, 5, 6, 2, '#585d64') + px(4, 2, 2, 1, '#2c3036'));
}

/* a vine up the right-hand edge of the case: a stem that wanders, and a leaf on alternate sides */
function vine() {
  const H = 260, W = 9;
  const sx = y => 4 + Math.round(Math.sin(y / 17) * 1.4);
  let s = '';
  for (let y = 0; y < H; y += 2) s += px(sx(y), y, 2, 2, '#4a6e2d');
  for (let y = 14, i = 0; y < H - 8; y += 26, i++) {
    const x = sx(y), L = i % 2 === 0;
    s += px(L ? x - 3 : x + 2, y, 3, 2, '#6f9a3c') + px(L ? x - 2 : x + 2, y + 1, 2, 1, '#9cc450') + px(L ? x - 4 : x + 3, y + 2, 2, 2, '#4a6e2d');
  }
  return wrap(W, H, s);
}

/* a heart sticker, thirteen by eleven, which fits on the corner of the case */
function heart() {
  const rows = ['..XXX...XXX..', '.XXXXX.XXXXX.', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', '.XXXXXXXXXXX.',
    '..XXXXXXXXX..', '...XXXXXXX...', '....XXXXX....', '.....XXX.....', '......X......'];
  let s = '';
  rows.forEach((r, y) => {
    const a = r.indexOf('X'), b = r.lastIndexOf('X');
    if (a >= 0) s += px(a, y, b - a + 1, 1, '#e8407a');
  });
  s += px(2, 1, 2, 1, '#ffd6ea') + px(1, 2, 2, 1, '#ffd6ea') + px(1, 3, 1, 1, '#ffd6ea');
  return wrap(13, 11, s);
}

/* a strip of tape across a corner of the case, at forty-five degrees: a staircase of rows, translucent, lighter at one edge and darker at the other */
function tape() {
  const N = 20, lo = 12, hi = 20;                       /* the band is every pixel whose x + y is from lo to hi */
  let s = '';
  for (let y = 0; y < N; y++) {
    const x0 = Math.max(0, lo - y), x1 = Math.min(N - 1, hi - y);
    if (x1 < x0) continue;
    s += px(x0, y, x1 - x0 + 1, 1, 'rgba(216,204,168,0.82)');
    s += px(x0, y, 1, 1, 'rgba(255,255,255,0.45)') + px(x1, y, 1, 1, 'rgba(0,0,0,0.22)');
  }
  return wrap(N, N, s);
}

export const DECO_NEW = {
  foilTL: cornerPiece({ ...FOIL, tl: 176, tt: 8, ll: 104, lt: 8,
    creaseX: [40, 78, 122], creaseY: [34, 64],
    fleck: [[20, 4], [58, 6], [96, 3], [4, 40], [5, 74]] }),
  foilBR: cornerPiece({ ...FOIL, tl: 64, tt: 2, ll: 96, lt: 8, flip: true,
    creaseX: [26], creaseY: [30, 56],
    fleck: [[14, 3], [4, 44]] }),
  mossTL: cornerPiece({ ...MOSS, tl: 150, tt: 8, ll: 96, lt: 8,
    creaseX: [], creaseY: [],
    fleck: [[10, 3], [34, 8, 3], [66, 5], [90, 2, 3], [5, 30], [6, 58, 3], [3, 80]] }),
  mossBR: cornerPiece({ ...MOSS, tl: 58, tt: 2, ll: 96, lt: 8, flip: true,
    fleck: [[10, 3], [30, 5, 3], [5, 36], [6, 60, 3]] }),
  tape: tape(),
  vineR: vine(),
  screw: screw(),
  heart: heart()
};
