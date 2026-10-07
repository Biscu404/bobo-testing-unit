import { hash } from './scene_kit.js';

/* ---- the props: little standing things a scene is built from -------------
   Every one is a handful of rectangles placed by its feet (x, gy) so a scene
   reads as a row of things on a line. They draw through K.r, so they wrap
   round the tile and a prop at the edge is simply on both sides of it.
   ========================================================================== */
export function addProps(K) {
  const r = K.r;

  K.tree = (x, gy, h, trunk, leaf, hi) => {
    const w = Math.max(5, Math.round(h * 0.7));
    r(x - 1, gy - Math.round(h * 0.45), 2, Math.round(h * 0.45), trunk);
    r(x - (w >> 1) + 1, gy - h, w - 2, 1, leaf);
    r(x - (w >> 1), gy - h + 1, w, Math.round(h * 0.45), leaf);
    r(x - (w >> 1) + 1, gy - h + 1 + Math.round(h * 0.45), w - 2, 1, leaf);
    if (hi != null) { r(x - (w >> 1) + 1, gy - h + 2, 2, 2, hi); r(x + 1, gy - h + 4, 2, 1, hi); }
  };
  K.cypress = (x, gy, h, c, hi) => {
    r(x, gy - h, 1, 2, c); r(x - 1, gy - h + 2, 3, 3, c); r(x - 2, gy - h + 5, 5, h - 8, c);
    r(x - 1, gy - 3, 3, 3, c);
    if (hi != null) r(x - 1, gy - h + 5, 1, h - 9, hi);
  };
  K.oval = (cx, cy, rx, ry, c) => {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
      r(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  };
  K.palm = (x, gy, h, trunk, leaf) => {
    r(x, gy - h, 1, h, trunk); r(x + 1, gy - h + 3, 1, h - 3, trunk);
    r(x - 4, gy - h, 4, 1, leaf); r(x + 1, gy - h, 4, 1, leaf);
    r(x - 6, gy - h + 1, 3, 1, leaf); r(x + 3, gy - h + 1, 3, 1, leaf);
    r(x - 2, gy - h - 1, 5, 1, leaf); r(x - 7, gy - h + 2, 2, 1, leaf); r(x + 5, gy - h + 2, 2, 1, leaf);
  };
  K.house = (x, gy, w, h, wall, roof, win, door) => {
    r(x, gy - h, w, h, wall);
    if (roof != null) { const half = (w >> 1) + 1; for (let j = 0; j < half; j++) r(x + (w >> 1) - j - 1, gy - h - half + j, Math.min(w + 2, j * 2 + 2), 1, roof); }
    if (win != null) for (let i = 2; i + 3 <= w - 1; i += 4) r(x + i, gy - h + 2, 2, 2, win);
    if (door != null) r(x + (w >> 1) - 1, gy - 4, 2, 4, door);
  };
  K.dome = (cx, gy, rad, c, hi) => {
    for (let y = 0; y < rad; y++) {
      const w = Math.round(Math.sqrt(rad * rad - (rad - y - 0.5) * (rad - y - 0.5)));
      r(cx - w, gy - rad + y, w * 2, 1, c);
      if (hi != null && y > 1) r(cx - w + 1, gy - rad + y, 1, 1, hi);
    }
    r(cx, gy - rad - 2, 1, 2, c);
  };
  /* a window or door with a round head */
  K.arch = (x, y, w, h, c) => {
    const rr = w >> 1;
    for (let i = 0; i < rr; i++) {
      const k = Math.round(Math.sqrt(rr * rr - (rr - i - 0.5) * (rr - i - 0.5)));
      r(x + rr - k, y + i, k * 2, 1, c);
    }
    r(x, y + rr, w, h - rr, c);
  };
  K.col = (x, y, h, w, c, hi) => {
    r(x, y, w, h, c); r(x - 1, y, w + 2, 2, c); r(x - 1, y + h - 2, w + 2, 2, c);
    if (hi != null) r(x + 1, y + 2, 1, h - 4, hi);
  };
  K.tent = (x, gy, w, h, c, c2) => {
    for (let i = 0; i < h; i++) {
      const ww = Math.round(w * (i + 1) / h);
      r(x - (ww >> 1), gy - h + i, ww, 1, i % 4 === 3 && c2 != null ? c2 : c);
    }
    r(x - 1, gy - 3, 3, 3, 0);
  };
  K.peak = (x, gy, w, h, c, snow) => {
    for (let i = 0; i < h; i++) {
      const ww = Math.round(w * (i + 1) / h);
      r(x - (ww >> 1), gy - h + i, ww, 1, snow != null && i < h * 0.3 ? snow : c);
    }
  };
  K.flame = (x, y, c1, c2) => { r(x, y + 1, 1, 3, c1); r(x - 1, y + 2, 3, 2, c1); r(x, y, 1, 2, c2 == null ? c1 : c2); };
  K.candle = (x, gy, h, body, flame) => {
    r(x - 1, gy - h, 3, h, body); r(x, gy - h - 3, 1, 2, 8);
    K.flame(x, gy - h - 6, flame, 15);
  };
  K.cloud = (x, y, c, c2) => {
    r(x, y + 2, 12, 2, c); r(x + 2, y + 1, 7, 1, c); r(x + 4, y, 4, 1, c);
    if (c2 != null) r(x + 1, y + 4, 11, 1, c2);
  };
  K.book = (x, y, w, h, c, band) => {
    r(x, y, w, h, c);
    if (band != null) { r(x, y + 1, w, 1, band); r(x, y + h - 2, w, 1, band); }
  };
  K.tower = (x, gy, w, h, c, hi) => {
    r(x, gy - h, w, h, c); if (hi != null) r(x, gy - h, 1, h, hi);
    for (let i = 0; i < w; i += 2) r(x + i, gy - h - 1, 1, 1, c);
  };
  K.person = (x, gy, h, body, head) => {
    r(x, gy - h, 2, 2, head); r(x - 1, gy - h + 2, 4, h - 2, body);
  };
  K.star4 = (x, y, c) => { r(x, y - 1, 1, 3, c); r(x - 1, y, 3, 1, c); };
  K.sail = (x, y, hull, sail) => {
    r(x, y + 5, 9, 2, hull); r(x + 1, y + 7, 7, 1, hull);
    r(x + 4, y, 1, 5, 8); r(x + 5, y, 3, 4, sail); r(x + 1, y + 2, 3, 3, sail);
  };
  /* rows of waves: a light crest every few pixels on a darker run */
  K.waves = (y, h, c1, c2, c3) => {
    r(0, y, K.W, h, c1);
    for (let j = 0; j < h; j += 3) for (let x = (j * 5) % 8; x < K.W; x += 8) { r(x, y + j, 4, 1, c2); if (c3 != null) r(x + 1, y + j, 2, 1, c3); }
  };
  /* lines of text, as an unreadable scribe would write them: short bars of random length */
  K.script = (x, y, w, rows, c, seed) => {
    for (let j = 0; j < rows; j++) {
      let cx = x;
      while (cx < x + w - 2) {
        const v = hash(j * 31 + cx * 7 + (seed || 1));
        const l = 2 + v % 4;
        r(cx, y + j * 3, Math.min(l, x + w - cx), 1, c);
        cx += l + 1;
      }
    }
  };
  /* a tall narrow stained-glass lancet: frame, panes, a bright centre */
  K.lancet = (x, y, w, h, frame, a, b) => {
    K.arch(x - 1, y - 1, w + 2, h + 2, frame);
    K.arch(x, y, w, h, a);
    for (let j = 3; j < h - 1; j += 4) for (let i = (j >> 2) & 1 ? 0 : w >> 1; i < w; i += w >> 1) r(x + i, y + j, Math.max(1, w >> 1), 2, b);
  };
}
