/* The second ten buildings' backdrops (see scenes_a.js). */
export const SCENES_B = {
  /* orange groves in rows, a water tower, white roofs */
  kibbutz: K => {
    K.sky(9, 11); K.cloud(30, 3, 15); K.cloud(118, 5, 15);
    K.ridge(5, 2, 2, 0.6, 2, 10);
    K.ground(7, 10, 2, 2);
    K.rep(0, 8, (x, i) => K.r(x, 21 + (i & 1), 8, 1, 2));
    K.rep(4, 10, (x, i) => { K.tree(x, 19, 9, 6, 2, 10); K.px(x - 1, 14, 12); K.px(x + 1, 12, 12); K.px(x + 2, 16, 12); });
    K.rep(70, 80, x => { K.r(x, 6, 7, 3, 7); K.r(x, 6, 7, 1, 15); K.r(x + 3, 9, 1, 8, 8); K.r(x + 1, 17, 5, 1, 8); K.house(x - 24, 19, 14, 6, 15, 12, 9, 6); });
  },
  /* a table-map: sea, a few lands, a dotted route, a sail */
  galut: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 3);
    K.rep(0, 16, (x, i) => K.r(x + (i % 3) * 4, 3 + (i * 7) % 18, 3, 1, 9));
    K.oval(22, 11, 17, 7, 6); K.oval(24, 10, 14, 5, 2); K.oval(18, 9, 6, 3, 10);
    K.oval(70, 12, 12, 8, 6); K.oval(72, 11, 9, 5, 2); K.oval(75, 8, 4, 2, 10);
    K.oval(116, 9, 18, 6, 6); K.oval(118, 8, 14, 4, 2); K.oval(126, 16, 6, 3, 6); K.oval(112, 7, 6, 2, 10);
    K.rep(2, 4, (x, i) => { K.px(x + 38, 11 + Math.round(Math.sin(i * 0.9) * 5), 14); });
    K.rep(0, 4, (x, i) => { if (x > 88 && x < 100) K.px(x, 14 - (i & 1), 14); });
    [[13, 9], [31, 12], [70, 10], [112, 8], [130, 11], [76, 15]].forEach(p => { K.r(p[0], p[1], 2, 2, 14); K.px(p[0], p[1], 15); });
    K.sail(46, 12, 6, 15); K.sail(144, 14, 6, 14);
    K.r(0, 0, 160, 1, 9); K.r(0, 23, 160, 1, 0);
  },
  /* the city at first light: stone, gold, olive trees */
  yerushalayim: K => {
    K.sky(1, 13, 0, 15); K.d(0, 9, 160, 6, 13, 14, 8); K.r(0, 14, 160, 6, 14);
    K.rep(0, 40, (x, i) => {
      K.r(x + 2, 12, 9, 8, 7); K.r(x + 2, 12, 2, 8, 15); K.r(x + 9, 12, 2, 8, 8);
      K.r(x + 14, 8, 8, 12, 7); K.r(x + 14, 8, 2, 12, 15); K.r(x + 20, 8, 2, 12, 8);
      K.r(x + 25, 13, 10, 7, 7); K.r(x + 25, 13, 2, 7, 15);
      K.arch(x + 5, 15, 3, 5, 0); K.arch(x + 17, 13, 3, 6, 0);
    });
    K.dome(32, 12, 8, 14, 15); K.dome(112, 12, 6, 8, 7);
    K.rep(0, 8, (x, i) => K.r(x, 18 - (i & 1), 4, 1 + (i & 1), 8));
    K.ground(5, 8, 7, 7, 2);
    K.rep(6, 20, (x, i) => { K.r(x, 15, 1, 5, 6); K.oval(x, 14, 4, 3, 2); K.px(x - 2, 13, 10); K.px(x + 1, 15, 10); });
  },
  /* big dressed stones in courses, notes in the cracks */
  kotel: K => {
    K.r(0, 0, 160, 24, 8); K.stars(10, 15, 11, 3, 5); K.d(0, 0, 160, 4, 1, 0, 8);
    for (let row = 0; row < 4; row++) {
      const y = 4 + row * 5, off = row % 2 ? 11 : 0, wid = row % 2 ? 22 : 32;
      for (let x = -off, i = 0; x < 160; x += wid, i++) {
        K.r(x + 1, y + 1, wid - 2, 4, 7); K.d(x + 1, y + 1, wid - 2, 4, 7, (i + row) % 3 ? 15 : 8, (i + row) % 3 ? 3 : 5);
        K.r(x + 1, y + 1, wid - 2, 1, 15); K.r(x + 1, y + 4, wid - 2, 1, 8);
      }
    }
    K.rep(7, 33, (x, i) => { K.r(x, 9, 2, 2, 15); K.r(x + 1, 14, 2, 1, 14); });
    K.rep(13, 27, (x, i) => { K.r(x, 4, 1, 3, 2); K.r(x + 1, 5, 1, 2, 10); });
    K.r(0, 23, 160, 1, 0);
  },
  /* the mountain, the courts, the gold front, a column of smoke */
  bayit: K => {
    K.sky(9, 11); K.cloud(12, 2, 15, 7); K.cloud(100, 4, 15, 7);
    K.ridge(5, 2, 2, 1.2, 10, 2); K.ground(4, 6, 14, 6);
    K.rep(0, 80, x => {
      K.r(x + 20, 12, 40, 8, 15); K.r(x + 20, 12, 40, 1, 7); K.r(x + 14, 17, 52, 3, 7);
      for (let i = 0; i < 6; i++) K.col(x + 22 + i * 6, 8, 12, 2, 15, 7);
      K.r(x + 20, 6, 40, 3, 14); K.r(x + 20, 6, 40, 1, 15); K.r(x + 24, 3, 32, 3, 14); K.r(x + 24, 3, 32, 1, 15);
      K.r(x + 36, 13, 8, 7, 0); K.r(x + 37, 14, 6, 6, 14);
      K.r(x + 68, 14, 4, 3, 7); K.r(x + 68, 14, 4, 1, 15);
      K.d(x + 66, 1, 8, 12, 9, 8, 5); K.d(x + 68, 0, 5, 3, 11, 8, 6);
    });
  },
  /* inside the tent: the curtain, the gold, the wings, the light */
  aron: K => {
    K.r(0, 0, 160, 24, 5);
    K.rep(0, 4, (x, i) => { K.r(x, 0, 2, 24, i & 1 ? 4 : 5); K.r(x + 2, 0, 1, 24, 0); });
    K.d(0, 0, 160, 10, 5, 0, 5);
    K.rep(0, 80, x => {
      K.glow(x + 40, 12, 36, 12, 14, 3); K.glow(x + 40, 12, 22, 9, 15, 3);
      K.peak(x + 33, 13, 12, 10, 14, 15); K.peak(x + 47, 13, 12, 10, 14, 15);
      K.r(x + 26, 14, 28, 9, 14); K.r(x + 26, 14, 28, 2, 15); K.r(x + 26, 22, 28, 2, 6);
      K.r(x + 37, 18, 6, 1, 6); K.r(x + 29, 18, 4, 1, 6); K.r(x + 47, 18, 4, 1, 6);
      K.r(x + 38, 6, 4, 8, 15);
    });
    K.r(0, 0, 160, 2, 14);
  },
  /* ten vessels of light, strung on one line, rising and falling */
  sefirot: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 1, 5); K.stars(22, 8, 15, 24, 9);
    const C = [15, 9, 12, 14, 10, 13, 11, 14, 12, 9], Y = [4, 9, 9, 14, 14, 19, 14, 9, 19, 5];
    K.rep(0, 16, (x, i) => {
      const y = Y[i % 10], nx = Y[(i + 1) % 10];
      for (let s = 1; s < 8; s++) K.px(x + 3 + s * 2, Math.round(y + (nx - y) * s / 8), 8);
      K.glow(x + 2, y, 6, 5, C[i % 10], 4); K.r(x, y - 2, 5, 5, C[i % 10]); K.r(x + 1, y - 1, 3, 3, 15); K.px(x, y - 2, 15);
    });
  },
  /* nothing to buy, nothing to eat: a long table in a bright field, all of it free */
  olam: K => {
    K.sky(11, 15, 0, 12); K.cloud(18, 2, 15); K.cloud(84, 4, 15); K.cloud(132, 1, 15);
    for (let k = 0; k < 160; k += 20) K.wash(k, 0, 10, 9, 14, 3);
    K.ridge(6, 3, 2, 0.3, 10, 2); K.ridge(3, 2, 3, 2.1, 2);
    K.rep(8, 40, x => { K.tree(x, 19, 11, 6, 10, 2); K.px(x - 2, 11, 12); K.px(x + 2, 13, 14); });
    K.r(0, 17, 160, 7, 15); K.r(0, 17, 160, 1, 7); K.r(0, 22, 160, 2, 7);
    K.rep(3, 10, (x, i) => { K.r(x, 15, 6, 2, 14); K.r(x + 1, 14, 4, 1, 14); K.r(x + 2, 19, 3, 2, [12, 14, 10, 13][i % 4]); });
  },
  /* the light between the wings, coming down */
  shekhinah: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 4); K.d(0, 0, 160, 24, 1, 0, 5); K.stars(20, 15, 11, 24, 2);
    K.rep(0, 80, x => {
      for (let y = 0; y < 24; y++) { const w = 3 + y; K.wash(x + 40 - w, y, w * 2, 1, 11, 4); K.wash(x + 40 - (w >> 1), y, w, 1, 15, 4); }
      K.glow(x + 40, 2, 10, 6, 15, 12); K.glow(x + 40, 2, 5, 3, 15, 16);
      K.r(x + 14, 8, 12, 2, 14); K.r(x + 8, 11, 12, 2, 14); K.r(x + 4, 14, 10, 2, 14);
      K.r(x + 54, 8, 12, 2, 14); K.r(x + 60, 11, 12, 2, 14); K.r(x + 66, 14, 10, 2, 14);
    });
    K.r(0, 22, 160, 2, 0);
  },
  /* four letters of light on a deep field */
  shem: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 5, 3); K.stars(34, 13, 15, 24, 4);
    const L = {
      h: (x, c) => { K.r(x, 5, 9, 2, c); K.r(x + 7, 7, 2, 12, c); K.r(x + 1, 10, 2, 9, c); },
      v: (x, c) => { K.r(x + 3, 5, 2, 14, c); K.r(x + 2, 5, 4, 2, c); },
      y: (x, c) => { K.r(x + 2, 5, 4, 5, c); K.r(x + 3, 10, 2, 2, c); }
    };
    K.rep(0, 80, x => {
      const pos = [[x + 6, 'h'], [x + 20, 'v'], [x + 30, 'h'], [x + 46, 'y']];
      pos.forEach(p => K.glow(p[0] + 4, 12, 9, 11, 14, 2));
      pos.forEach(p => L[p[1]](p[0] + 1, 6)); pos.forEach(p => L[p[1]](p[0], 14));
      pos.forEach(p => K.r(p[0], 5, 1, 1, 15));
    });
  }
};
