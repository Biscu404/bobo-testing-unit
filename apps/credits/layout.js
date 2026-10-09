/* Where everything on the credits screen stands, worked out from the size of each portrait. Pure, so Node can hold it (credits_check.js).
   A portrait is drawn at a whole multiple of its own pixels (never smoothed), as near its box as a multiple allows, and is centred in the box; the screen reads
   the sizes from the pictures themselves, so a wider crop made at 96 or 128 pixels (scripts/make-credit-art.py) needs no change here. */
export const W = 640, H = 560;

/* the creator has the big box in the middle, the three playtesters a smaller one each in a row beneath */
export const CAST = [
  { id: 'teiteotei', name: 'TEITEOTEI', role: 'THE CREATOR', box: 192, cx: W / 2, top: 44 },
  { id: 'biscu',     name: 'BISCU',     box: 128, cx: W / 6,     top: 350 },
  { id: 'gheghe',    name: 'GHEGHE',    box: 128, cx: W / 2,     top: 350 },
  { id: 'thea',      name: 'THEA',      box: 128, cx: W * 5 / 6, top: 350 }
];
export const FALLBACK = 64;                                     /* what a picture that did not load is taken to be */

/* the whole multiple of a picture's pixels that comes nearest its box without going far over it (a 96 px picture in a 192 box is two, a 128 px one is one) */
export const scaleFor = (n, box) => Math.max(1, Math.floor(box / Math.max(1, n) + 0.25));

/* sizes: { id: [w, h] } as the pictures report them; anything missing is the fallback */
export function place(sizes) {
  const out = {};
  CAST.forEach(c => {
    const [iw, ih] = (sizes && sizes[c.id]) || [FALLBACK, FALLBACK];
    const k = scaleFor(Math.max(iw, ih), c.box), w = iw * k, h = ih * k;
    const boxX = Math.round(c.cx - c.box / 2);
    out[c.id] = {
      id: c.id, name: c.name, role: c.role || null, k, w, h,
      x: Math.round(boxX + (c.box - w) / 2), y: Math.round(c.top + (c.box - h) / 2),    /* the picture, centred in its box */
      boxX, boxY: c.top, box: c.box, cx: Math.round(c.cx), cy: Math.round(c.top + c.box / 2)
    };
  });
  return out;
}

/* the halo round the creator's head follows the creator's box (an ellipse a little wider than the box and about half as tall again as the portrait's radius) */
export function haloOf(p) {
  const s = p.box / 192;
  return { x: p.cx, y: p.cy, rx: Math.round(200 * s), ry: Math.round(104 * s) };
}

/* a playtester's cross: the upright runs well above the box, the arm sits just above it and is wider than the box so the cross shows round the picture */
export function crossOf(p) {
  return { cx: p.cx, top: p.boxY - 60, height: p.box + 70, armW: 2 * Math.round(p.box * 0.7), armY: p.boxY - 28 };
}

/* the name plate: where the words go, under the box */
export function wordsOf(p) {
  const below = p.boxY + p.box + 6;
  return p.role
    ? [{ t: p.name, px: 26, y: below + 20, ink: 'white' }, { t: p.role, px: 18, y: below + 38, ink: 'yellow' }]
    : [{ t: p.name, px: 20, y: below + 20, ink: 'white' }];
}
