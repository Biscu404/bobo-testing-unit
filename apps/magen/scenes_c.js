/* Backdrops for the hand (the press) and for kavanah (intention). */
const HEART = (K, x, y, c) => { K.r(x, y, 2, 2, c); K.r(x + 3, y, 2, 2, c); K.r(x, y + 1, 5, 2, c); K.r(x + 1, y + 3, 3, 1, c); K.px(x + 2, y + 4, c); };
const PARCH = K => { K.d(0, 0, 160, 24, 14, 6, 3); K.d(0, 17, 160, 7, 14, 6, 6); };

export const SCENES_C = {
  /* a desk, a lit candle, a sheet and a quill */
  c1: K => {
    K.r(0, 0, 160, 24, 6); K.d(0, 0, 160, 15, 6, 4, 3);
    K.r(0, 15, 160, 9, 6); K.r(0, 15, 160, 1, 14); K.d(0, 16, 160, 8, 6, 0, 3);
    K.rep(6, 40, (x, i) => {
      K.r(x, 13, 18, 3, 15); K.script(x + 2, 11, 14, 1, 0, i);
      K.r(x + 20, 4, 1, 11, 15); K.r(x + 21, 2, 2, 3, 14); K.glow(x + 21, 4, 9, 8, 14, 3);
      K.r(x + 5, 7, 1, 6, 15); K.r(x + 6, 6, 1, 2, 15); K.r(x + 4, 12, 3, 1, 8);
    });
  },
  /* a page, and two fingers keeping the line */
  c2: K => {
    PARCH(K);
    K.rep(0, 40, (x, i) => {
      K.script(x + 3, 3, 30, 4, 0, i * 3 + 5);
      K.r(x + 14, 12, 3, 12, 12); K.r(x + 19, 14, 3, 10, 12); K.r(x + 14, 12, 1, 3, 15); K.r(x + 19, 14, 1, 3, 15);
      K.r(x + 12, 20, 12, 4, 12);
    });
  },
  /* the little silver hand on a long rod */
  c3: K => {
    PARCH(K);
    K.rep(0, 80, (x, i) => {
      K.script(x + 4, 3, 70, 4, 0, i + 2);
      K.r(x + 6, 14, 52, 2, 7); K.r(x + 6, 14, 52, 1, 15); K.r(x + 58, 12, 5, 6, 7); K.r(x + 63, 13, 5, 2, 7); K.r(x + 58, 12, 5, 1, 15);
      K.r(x + 2, 12, 6, 6, 14); K.r(x + 3, 13, 4, 4, 15);
    });
  },
  /* a room full of heads, all of them answering */
  c4: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 3);
    K.rep(5, 20, x => K.lancet(x, 2, 7, 10, 8, 3, 11));
    K.r(0, 14, 160, 10, 0); K.d(0, 14, 160, 3, 0, 1, 8);
    K.rep(0, 8, (x, i) => { const h = 7 + (i * 5) % 3; K.r(x + 1, 22 - h, 5, h, [8, 6, 4, 1][(i * 3) % 4]); K.disc(x + 3, 21 - h, 2, [12, 6, 14, 7][(i * 7) % 4]); });
    K.rep(4, 8, (x, i) => { const h = 6 + (i * 3) % 3; K.r(x + 1, 24 - h, 5, h, [5, 2, 8, 6][(i * 5) % 4]); K.disc(x + 3, 23 - h, 2, [7, 14, 12, 6][(i * 3) % 4]); });
  },
  /* shawls, swaying: every second head leans the other way */
  c5: K => {
    K.r(0, 0, 160, 24, 9); K.d(0, 0, 160, 24, 9, 11, 3); K.r(0, 0, 160, 3, 15);
    K.rep(0, 10, (x, i) => {
      const lean = (i & 1) ? 1 : -1;
      K.r(x + 2, 7, 6, 17, 15); K.r(x + 2, 7, 1, 17, 7);
      for (let k = 10; k < 24; k += 3) K.r(x + 2, k, 6, 1, 1);
      K.disc(x + 5 + lean, 5, 2, 14); K.r(x + 3 + lean, 3, 5, 1, 0);
    });
  },
  /* the sukkah: branches overhead, the four species on the table */
  c6: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 2);
    K.rep(0, 4, (x, i) => { K.r(x, 0, 3, 3 + (i % 3), i & 1 ? 2 : 10); K.r(x + 1, 0, 1, 2, 6); });
    K.rep(8, 20, (x, i) => { K.r(x, 6, 1, 3, 8); K.r(x - 1, 9, 3, 3, [12, 14, 13][i % 3]); });
    K.r(0, 17, 160, 7, 15); K.r(0, 17, 160, 1, 14); K.d(0, 20, 160, 4, 15, 7, 3);
    K.rep(6, 40, (x, i) => {
      K.oval(x + 4, 15, 4, 3, 14); K.px(x + 3, 14, 15); K.r(x + 4, 11, 1, 2, 2);
      K.r(x + 14, 4, 1, 14, 2); K.r(x + 15, 5, 1, 12, 10); K.r(x + 16, 7, 1, 10, 2); K.r(x + 13, 8, 1, 9, 10);
      K.r(x + 21, 13, 1, 5, 2); K.r(x + 23, 12, 1, 6, 10);
    });
  },
  /* first light, the road, somebody already running */
  c7: K => {
    K.sky(1, 14, 0, 14); K.d(0, 8, 160, 5, 12, 14, 8);
    K.rep(12, 80, x => { K.disc(x + 20, 14, 8, 14); K.disc(x + 20, 14, 5, 15); });
    K.ridge(4, 2, 3, 2.2, 8); K.r(0, 15, 160, 9, 7); K.d(0, 15, 160, 4, 7, 15, 3);
    K.rep(0, 16, x => K.r(x + 2, 20, 8, 1, 14));
    K.rep(10, 80, (x, i) => { K.person(x, 19, 8, 4, 12); K.r(x - 1, 19, 2, 3, 4); K.r(x + 2, 19, 3, 2, 4); });
  },
  /* hearts, in rows, rising */
  c8: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 5, 4); K.stars(14, 15, 13, 24, 12);
    K.rep(3, 20, (x, i) => HEART(K, x, 2 + (i * 7) % 12, [12, 13, 15, 12][i % 4]));
    K.rep(13, 20, (x, i) => HEART(K, x, 12 + (i * 5) % 8, [13, 12, 4, 15][i % 4]));
  },
  /* the mountain, the fire on it, the whole people at its foot */
  c9: K => {
    K.sky(0, 5, 0, 18); K.stars(8, 15, 11, 8, 3);
    K.rep(0, 80, x => {
      K.peak(x + 40, 20, 56, 17, 8); K.peak(x + 40, 20, 24, 12, 7);
      K.glow(x + 40, 5, 12, 7, 12, 4); K.r(x + 39, 3, 3, 5, 14); K.r(x + 38, 5, 5, 3, 12); K.px(x + 40, 2, 15);
      K.r(x + 4, 4, 1, 4, 11); K.r(x + 5, 8, 1, 4, 11); K.r(x + 3, 11, 1, 3, 15);
    });
    K.ground(5, 6, 14, 8);
    K.rep(3, 6, (x, i) => K.tent(x + 1, 22, 5, 3, i & 1 ? 15 : 7));
  },
  /* the six hundred and thirteen: a grid of small lit lamps */
  c10: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 0, 6);
    K.rep(2, 8, (x, i) => { for (let y = 3; y < 23; y += 5) { K.r(x, y, 3, 3, 14); K.px(x, y, 15); K.wash(x - 2, y - 2, 7, 7, 14, 1); } });
    K.r(0, 0, 160, 1, 14); K.r(0, 23, 160, 1, 14);
  },

  /* ---- kavanah: the milk, the glow, one for each part of a person ---- */
  /* the mouth: sound going out in rings */
  k1: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 3);
    K.rep(20, 40, x => { for (let k = 1; k <= 4; k++) { K.r(x - k * 3, 12 - k * 2, 1, k * 4, k & 1 ? 11 : 15); K.r(x + k * 3, 12 - k * 2, 1, k * 4, k & 1 ? 11 : 15); } K.r(x - 2, 11, 5, 3, 12); K.r(x - 1, 12, 3, 1, 0); });
  },
  /* the heart: its own line, drawn as a pulse */
  k2: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 4, 3); K.rep(0, 8, x => K.r(x, 0, 1, 24, 0));
    for (let x = 0; x < 160; x++) { const m = x % 40; const y = m < 12 ? 12 : m < 15 ? 12 - (m - 11) * 3 : m < 18 ? 3 + (m - 14) * 6 : m < 21 ? 21 - (m - 17) * 3 : 12; K.r(x, y, 1, 2, 12); }
    K.rep(7, 40, (x, i) => HEART(K, x + 14, 17, 4));
  },
  /* the hands: clay, and prints in it */
  k3: K => {
    K.r(0, 0, 160, 24, 6); K.d(0, 0, 160, 24, 6, 14, 3); K.d(0, 0, 160, 24, 6, 0, 3);
    K.rep(6, 32, (x, i) => {
      const y = 4 + (i * 7) % 8;
      K.r(x, y + 5, 8, 8, 4); K.r(x, y + 5, 8, 1, 12);
      for (let f = 0; f < 4; f++) K.r(x + f * 2, y + 1 - (f === 1 || f === 2 ? 1 : 0), 1, 5, 4);
      K.r(x - 2, y + 7, 2, 2, 4);
    });
  },
  /* the feet: a path through the fields, and who went along it */
  k4: K => {
    K.sky(9, 11, 0, 10); K.ridge(6, 2, 2, 0.8, 2, 10); K.ground(12, 10, 2, 2, 5);
    K.r(0, 15, 160, 6, 6); K.d(0, 15, 160, 6, 6, 14, 5); K.r(0, 15, 160, 1, 14); K.r(0, 21, 160, 1, 6);
    K.rep(3, 12, (x, i) => { K.r(x, 16 + (i & 1) * 2, 3, 2, 0); K.r(x + 1, 15 + (i & 1) * 2, 1, 1, 0); });
  },
  /* the eyes: a field of them, open in the dark */
  k5: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 1, 5);
    K.rep(2, 16, (x, i) => { const y = 3 + (i * 7) % 12; K.oval(x + 5, y + 4, 6, 3, 15); K.disc(x + 5, y + 4, 2, 9); K.px(x + 5, y + 4, 0); K.px(x + 4, y + 3, 15); K.r(x - 1, y + 3, 1, 2, 15); K.r(x + 11, y + 3, 1, 2, 15); });
  },
  /* the house: a street of them, lit from inside */
  k6: K => {
    K.sky(1, 9, 0, 16); K.stars(12, 15, 11, 8, 6); K.ground(5, 8, 7, 0);
    K.rep(2, 20, (x, i) => { K.house(x, 19, 14, 7 + i % 3, [6, 7, 12, 14][i % 4], [4, 8, 1, 5][i % 4], 14, 0); K.wash(x - 3, 8, 20, 12, 14, 1); });
  },
  /* the street: lamps, and the cones of light under them */
  k7: K => {
    K.sky(0, 1, 0, 12); K.stars(12, 15, 9, 8, 7); K.r(0, 15, 160, 9, 8); K.d(0, 15, 160, 9, 8, 0, 4);
    K.rep(0, 8, (x, i) => K.r(x + 1, 18 + (i % 3) * 2, 5, 1, 7));
    K.rep(12, 40, x => { K.r(x, 4, 1, 14, 7); K.r(x - 2, 3, 5, 2, 14); K.glow(x, 12, 12, 11, 14, 3); K.r(x - 1, 17, 3, 1, 7); });
  },
  /* the whole of it: the sun, with all its rays */
  k8: K => {
    K.r(0, 0, 160, 24, 14); K.d(0, 0, 160, 24, 14, 15, 5);
    K.rep(0, 80, x => {
      for (let a = 0; a < 12; a++) { const an = a * Math.PI / 6; for (let s = 9; s < 34; s += 3) K.r(x + 40 + Math.cos(an) * s * 1.6, 12 + Math.sin(an) * s * 0.55, 3, 1, a & 1 ? 6 : 14); }
      K.disc(x + 40, 12, 8, 6); K.disc(x + 40, 12, 7, 14); K.disc(x + 40, 12, 4, 15);
    });
  }
};
