/* The small elephant: the one that lives on the desktop (kernel/pet.js) and stands in Dave's window wearing what is for sale.
 *
 * Side view, facing right, on an 80 x 60 canvas, one pixel to the pixel and nothing but the sixteen. The big elephant in
 * apps/elephant is drawn front-on, one row at a time; this one has to walk, so he is a different drawing of the same animal.
 * Flip the element (CSS scaleX(-1)) to face left: nothing here ever mirrors.
 *
 * drawMini(g, { pose, t, wear, think, eat })
 *   pose  'stand' | 'walk' | 'sleep' | 'push' | 'sit' | 'hop'
 *   eat   the pose of a piece of cheese being eaten (apps/cheese_art.js eatPose): the trunk goes to the floor in front of him, comes up with a wedge and brings it to his mouth
 *   t     seconds, for the breathing and the legs
 *   wear  { head, face, neck, body, feet } -> ids from cos_data.js ELEPHANT
 * Clothes are rectangles from the ground up, each a few pixels, so they read at this size. */
import { VGA16 } from './god.js';

export const MINI_W = 80, MINI_H = 60;
const C = i => 'rgb(' + VGA16[i].join(',') + ')';

function ellipse(g, cx, cy, rx, ry, fill, lit, shade) {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w <= 0) continue;
    g.fillStyle = C(0); g.fillRect(cx - w - 1, cy + y, w * 2 + 3, 1);
    g.fillStyle = C(fill); g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    if (lit != null && y < -ry * 0.35) { g.fillStyle = C(lit); g.fillRect(cx - w + 1, cy + y, Math.max(1, Math.round(w * 0.7)), 1); }
    if (shade != null && y > ry * 0.4) { g.fillStyle = C(shade); g.fillRect(cx - Math.round(w * 0.3), cy + y, Math.round(w * 1.3), 1); }
  }
}

/* ---- what he wears: [x, y, w, h, colour] rectangles in the pixel space of a standing elephant, per pose offset (dy) --------- */
const WEAR = {
  partyhat: (R, o) => { R(58, 11 + o.hy, 8, 3, 12); R(59, 8 + o.hy, 6, 3, 14); R(60, 5 + o.hy, 4, 3, 12); R(61, 3 + o.hy, 2, 2, 15); },
  tophat:   (R, o) => { R(55, 12 + o.hy, 16, 2, 0); R(58, 2 + o.hy, 10, 10, 0); R(58, 9 + o.hy, 10, 2, 12); R(59, 3 + o.hy, 2, 5, 8); },
  wizard:   (R, o) => { R(54, 12 + o.hy, 18, 2, 1); R(58, 8 + o.hy, 10, 4, 1); R(60, 4 + o.hy, 6, 4, 1); R(62, 1 + o.hy, 3, 3, 1); R(61, 9 + o.hy, 2, 2, 14); R(65, 5 + o.hy, 1, 1, 14); R(55, 12 + o.hy, 16, 1, 9); },
  crown:    (R, o) => { R(56, 9 + o.hy, 12, 4, 14); R(56, 6 + o.hy, 2, 3, 14); R(61, 4 + o.hy, 2, 5, 14); R(66, 6 + o.hy, 2, 3, 14); R(58, 10 + o.hy, 2, 1, 12); R(64, 10 + o.hy, 2, 1, 9); },
  glasses:  (R, o) => { const x = 61 + o.fx, y = 20 + o.hy + o.fy; R(x, y, 9, 1, 0); R(x, y + 8, 9, 1, 0); R(x, y, 1, 9, 0); R(x + 8, y, 1, 9, 0); R(56, y + 4, 5, 1, 0); },
  shades:   (R, o) => { R(61 + o.fx, 22 + o.hy + o.fy, 10, 5, 0); R(57, 23 + o.hy + o.fy, 5, 1, 0); R(63 + o.fx, 22 + o.hy + o.fy, 2, 1, 8); },
  monocle:  (R, o) => { const x = 61 + o.fx, y = 20 + o.hy + o.fy; R(x, y, 9, 1, 14); R(x, y + 8, 9, 1, 14); R(x, y, 1, 9, 14); R(x + 8, y, 1, 9, 14); R(x + 4, y + 9, 1, 10, 14); },
  bowtie:   (R, o) => { R(60 + o.nx, 34 + o.hy + o.ny, 4, 5, 12); R(67 + o.nx, 34 + o.hy + o.ny, 4, 5, 12); R(64 + o.nx, 35 + o.hy + o.ny, 3, 3, 4); },
  scarf:    (R, o) => { R(49 + o.nx, 32 + o.hy + o.ny, 16, 3, 12); R(49 + o.nx, 35 + o.hy + o.ny, 16, 3, 15); if (!o.lying) { R(51 + o.nx, 38 + o.hy + o.ny, 4, 8, 12); R(51 + o.nx, 41 + o.hy + o.ny, 4, 2, 15); R(51 + o.nx, 46 + o.hy + o.ny, 4, 2, 14); } },
  blanket:  (R, o) => { R(21, 17 + o.by, 30, 13, 12); R(21, 28 + o.by, 30, 2, 14); R(21, 17 + o.by, 30, 2, 14); for (let x = 22; x < 50; x += 5) R(x, 30 + o.by, 2, 3, 14); R(34, 21 + o.by, 4, 4, 14); },
  /* a cloak hanging from the shoulders and flaring out behind him: mostly the body is in front of it, so what shows is the flare behind the rump and under the belly */
  cape:     (R, o) => { for (let j = 0; j < 31; j++) { const xl = Math.round(25 - j * 0.65), y = 18 + o.by + j; R(xl - 1, y, 1, 1, 0); R(xl, y, 38 - xl, 1, j > 27 ? 12 : 5); if (j % 5 === 2) R(xl, y, 2, 1, 13); } R(5, 49 + o.by, 30, 1, 0); },
  collar:   (R, o) => { R(50 + o.nx, 31 + o.hy + o.ny, 15, 3, 15); R(50 + o.nx, 34 + o.hy + o.ny, 15, 2, 5); R(52 + o.nx, 31 + o.hy + o.ny, 1, 3, 0); R(56 + o.nx, 31 + o.hy + o.ny, 1, 3, 0); R(60 + o.nx, 31 + o.hy + o.ny, 1, 3, 0); },
  halo:     (R, o) => { const y = 1 + o.hy - HAT_DROP; R(56, y, 14, 1, 0); R(54, y + 1, 18, 1, 14); R(53, y + 2, 2, 1, 14); R(71, y + 2, 2, 1, 14); R(54, y + 3, 18, 1, 14); R(56, y + 4, 14, 1, 0); R(58, y + 1, 3, 1, 15); R(66, y - 2, 1, 1, 15); },
  medal:    (R, o) => { R(55 + o.nx, 35 + o.hy + o.ny, 3, 7, 12); R(56 + o.nx, 35 + o.hy + o.ny, 1, 7, 15); R(53 + o.nx, 41 + o.hy + o.ny, 7, 5, 0); R(54 + o.nx, 42 + o.hy + o.ny, 5, 3, 14); R(56 + o.nx, 43 + o.hy + o.ny, 1, 1, 6); },
  boots:    (R, o) => { o.feet.forEach(f => { R(f[0] - 1, f[1] - 2, 11, 4, 12); R(f[0] - 1, f[1] - 2, 11, 1, 4); R(f[0] + 1, f[1] + 1, 11, 1, 0); }); }
};
const BEHIND = { cape: 1 };
const NECKWEAR = { bowtie: 1, scarf: 1, medal: 1 };                         /* round the throat: drawn before the trunk, so the trunk hangs in front of it */
const HAT_DROP = 3;                                              /* a hat sits on the head, not above it */

export function drawMini(g, o) {
  const wear = o.wear || {}, t = o.t || 0, pose = o.pose || 'stand';
  const R = (x, y, w, h, c) => { g.fillStyle = C(c); g.fillRect(Math.round(x), Math.round(y), w, h); };
  const walking = pose === 'walk', sleeping = pose === 'sleep', pushing = pose === 'push', hop = pose === 'hop';
  const br = sleeping ? Math.round(Math.sin(t * 1.4) * 1) : Math.round(Math.sin(t * 1.6) * 0.6 + 0.2);
  const ph = walking ? Math.sin(t * 7) : 0, bob = walking ? -Math.round(Math.abs(Math.sin(t * 7)) * 1.5) : 0;
  const lift = hop ? -Math.round(Math.abs(Math.sin(t * 5)) * 6) : 0;
  g.clearRect(0, 0, MINI_W, MINI_H);
  g.save(); g.translate(0, lift);

  if (sleeping) {
    /* lying on his belly, head on the ground in front of him, trunk along the floor, one ear over the eye */
      const feet = [[22, 55], [44, 55]];
    if (wear.body === 'cape') WEAR.cape(R, { by: 12 + br });
    ellipse(g, 36, 41 + br, 24, 12, 7, 15, 8);
    ellipse(g, 28, 52, 8, 4, 8); ellipse(g, 48, 52, 8, 4, 8);
    if (wear.feet === 'boots') WEAR.boots(R, { feet: feet.map(f => [f[0] - 4, f[1]]) });
    ellipse(g, 62, 46, 10, 9, 7, 15, 8);
    ellipse(g, 56, 44, 5, 7, 8);
    for (let i = 0; i < 4; i++) R(70 + i * 2, 51 + (i > 1 ? 1 : 0), 4, 4 - (i > 1 ? 1 : 0), i % 2 ? 8 : 7);
    R(68, 53, 10, 1, 0);
    R(63, 44, 5, 1, 0);                                         /* the eye, shut */
    R(66, 52, 5, 2, 15);                                        /* a tusk, on the floor */
    R(45, 30 + br, 8, 2, 0); R(10, 36, 4, 14, 8); R(9, 48, 2, 4, 0);   /* the tail */
    if (wear.body === 'blanket') WEAR.blanket(R, { by: 12 + br });
    ['neck', 'face', 'head'].forEach(s => { const w = wear[s]; if (w && WEAR[w] && !BEHIND[w]) WEAR[w](R, { hy: 22 + br + (s === 'head' ? HAT_DROP : 0), fx: 2, fy: 0, nx: 2, ny: -4 - br, by: 12 + br, lying: true }); });
    g.restore();
    /* his dreams */
    const z = (t * 0.7) % 3;
    for (let i = 0; i < 3; i++) {
      const k = (z + i) % 3, y = 24 - k * 7, x = 62 + k * 4, s = 2 + Math.floor(k);
      R(x, y, s, 1, 15); R(x + s - 1, y + 1, 1, 1, 15); R(x, y + s - 1, s + 1, 1, 15);
    }
    return;
  }

  /* standing, walking, pushing */
  const E = o.eat || null, chewBob = E && E.chew ? Math.round(Math.sin(t * 20)) : 0;
  const hy = pushing ? 3 : E ? Math.round(E.lean * 4) + chewBob : 0, headX = pushing ? 4 : E ? Math.round(E.lean * 3) : 0;
  const fl = Math.round(ph * 3);
  const feet = [[20 - fl, 55], [46 + fl, 55], [29 + fl, 55], [53 - fl, 55]];
  if (wear.body === 'cape') WEAR.cape(R, { by: bob + br });
  /* far legs, then the tail, the body, the near legs */
  ellipse(g, 33 + fl, 49, 5, 7, 8); ellipse(g, 56 - fl, 49, 5, 7, 8);
  R(11, 26 + bob, 3, 2, 0); R(10, 28 + bob, 3, 12, 8); R(9, 38 + bob, 5, 3, 0); R(9, 39 + bob, 3, 2, 7);
  ellipse(g, 36, 31 + bob + br, 23, 13, 7, 15, 8);
  [[22 - fl, 50], [50 + fl, 50]].forEach(f => { ellipse(g, f[0], f[1], 6, 8, 7, 15, 8); R(f[0] - 5, 56, 11, 1, 0); });
  if (wear.feet === 'boots') WEAR.boots(R, { feet: [[22 - fl - 5, 54], [50 + fl - 5, 54]] });
  if (wear.body === 'blanket') WEAR.blanket(R, { by: bob + br });
  /* ear, head, trunk, tusk, eye */
  ellipse(g, 54 + headX, 24 + bob + hy, 7, 10, 8, 7);
  ellipse(g, 60 + headX, 26 + bob + hy, 11, 11, 7, 15, 8);
  const sway = Math.round(Math.sin(t * 1.2) * 1.2);
  const tx = 66 + headX;
  /* what is round the throat goes on before the trunk (and the cape's collar with it), so the trunk is in front of the knot */
  const place = { hy: bob + hy, fx: headX, fy: 0, nx: headX, ny: 0, by: bob + br };
  if (wear.body === 'cape') WEAR.collar(R, place);
  if (NECKWEAR[wear.neck]) WEAR[wear.neck](R, place);
  if (pushing) {
    for (let i = 0; i < 6; i++) { R(tx + i * 2, 33 + bob + hy + (i > 3 ? 1 : 0), 4, 5, i % 2 ? 8 : 7); R(tx + i * 2, 38 + bob + hy + (i > 3 ? 1 : 0), 4, 1, 0); }
  } else if (E) {
    /* the trunk goes down to the floor in front of him, then comes up with a wedge to his mouth */
    let tipX = tx, tipY = 34;
    for (let i = 0; i < 6; i++) {
      const k = i / 5, x = tx + Math.round(E.lean * 7 * k * k + E.curl * 3 * k), y = 34 + bob + hy + Math.round(i * 3 - E.curl * Math.max(0, i - 1) * 2.2);
      R(x, y, 6 - (i > 3 ? 2 : 0), 4, i % 2 ? 8 : 7);
      tipX = x; tipY = y;
    }
    if (E.wedge) { R(tipX - 1, tipY - 1, 6, 4, 14); R(tipX - 1, tipY + 2, 6, 1, 6); R(tipX + 1, tipY, 1, 1, 6); }
  } else if (o.think) {
    for (let i = 0; i < 6; i++) { R(tx + 1 + Math.round(i * 0.8), 34 + bob + hy + i * 3 - (i > 2 ? (i - 2) * 4 : 0), 5 - (i > 3 ? 1 : 0), 4, i % 2 ? 8 : 7); }
  } else {
    for (let i = 0; i < 6; i++) { R(tx + sway * (i / 5) + (i > 3 ? 2 : 0), 34 + bob + hy + i * 3, 6 - (i > 3 ? 2 : 0), 4, i % 2 ? 8 : 7); }
    R(tx - 1, 34 + bob + hy, 1, 17, 0);
  }
  R(65 + headX, 36 + bob + hy, 5, 2, 15);                       /* the tusk */
  const blink = (t % 5.3) > 5.15;
  R(63 + headX, 22 + bob + hy, 4, 4, blink ? 7 : 15);
  if (!blink) { R(65 + headX, 23 + bob + hy, 2, 3, 0); R(63 + headX, 22 + bob + hy, 1, 1, 15); } else R(63 + headX, 24 + bob + hy, 4, 1, 0);
  R(60 + headX, 19 + bob + hy, 7, 1, 8);                        /* a brow */
  /* clothes on the face and head follow the head */
  ['face', 'head'].forEach(s => { const w = wear[s]; if (w && WEAR[w] && !BEHIND[w]) WEAR[w](R, s === 'head' ? Object.assign({}, place, { hy: place.hy + HAT_DROP }) : place); });
  g.restore();
}

/* a little sheet of his own faces, for the shop: him in `wear` against a black ground */
export function thumbMini(g, w, h, wear, pose, t) {
  g.fillStyle = '#000000'; g.fillRect(0, 0, w, h);
  const c = document.createElement('canvas'); c.width = MINI_W; c.height = MINI_H;
  const q = c.getContext('2d');
  drawMini(q, { pose: pose || 'stand', t: t || 0, wear });
  g.imageSmoothingEnabled = false;
  g.drawImage(c, Math.round((w - MINI_W) / 2), Math.round((h - MINI_H) / 2) + 2);
}
export const WEAR_IDS = Object.keys(WEAR);
