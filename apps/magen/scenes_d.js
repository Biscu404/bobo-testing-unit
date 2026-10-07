/* Backdrops for the twelve communities (a skyline each) and the rules that change the rules. */
export const SCENES_D = {
  /* Toledo: horseshoe arches, a crenellated tower, cypress, terracotta light */
  d1: K => {
    K.sky(12, 14, 0, 14); K.ground(4, 6, 14, 6);
    K.rep(0, 40, (x, i) => {
      K.tower(x + 2, 19, 8, 17, 6, 14); K.arch(x + 4, 6, 3, 5, 0);
      K.r(x + 12, 11, 26, 8, 15); K.r(x + 12, 11, 26, 1, 7);
      for (let k = 0; k < 3; k++) K.arch(x + 14 + k * 8, 12, 6, 7, 6);
    });
    K.rep(31, 40, x => K.cypress(x, 19, 11, 2, 10));
  },
  /* the Rhineland: steep roofs, snow, one spire */
  d2: K => {
    K.sky(8, 7, 0, 12); K.ground(4, 15, 7, 7);
    K.rep(0, 32, (x, i) => { K.house(x + 2, 19, 10, 6 + (i % 3), [6, 14, 12, 7][i % 4], [4, 8, 1, 4][i % 4], 14, 0); });
    K.rep(24, 80, x => { K.r(x, 3, 2, 17, 7); K.peak(x + 1, 6, 6, 6, 8); K.r(x, 0, 1, 2, 15); });
    K.rep(0, 6, (x, i) => K.px(x + (i * 7) % 5, (i * 11) % 18, 15));
  },
  /* Baghdad at night: domes, minarets, a crescent, date palms */
  d3: K => {
    K.sky(0, 1, 0, 16); K.stars(14, 15, 11, 10, 4);
    K.rep(18, 80, x => { K.disc(x, 5, 3, 14); K.disc(x + 2, 4, 3, 0); K.disc(x + 2, 4, 2, 1); });
    K.ground(4, 0, 3, 3);
    K.rep(0, 40, (x, i) => {
      K.r(x + 8, 7, 4, 12, 3); K.r(x + 7, 6, 6, 1, 11); K.r(x + 9, 3, 2, 3, 3);
      K.dome(x + 24, 19, 7, 3, 11); K.r(x + 17, 15, 14, 4, 3);
    });
    K.rep(36, 40, x => K.palm(x, 19, 10, 6, 2));
  },
  /* Yemen: tall houses banded in white, mountains behind */
  d4: K => {
    K.sky(11, 15, 0, 13); K.ridge(8, 3, 2, 0.5, 7, 8); K.ground(3, 6, 14);
    K.rep(0, 24, (x, i) => {
      const h = 11 + (i * 5) % 6; K.r(x + 1, 21 - h, 9, h, 6);
      for (let k = 21 - h; k < 21; k += 4) K.r(x + 1, k, 9, 1, 15);
      K.r(x + 1, 20 - h, 9, 1, 15); K.arch(x + 4, 22 - h + 2, 3, 4, 0); K.r(x + 4, 18, 3, 3, 0);
    });
  },
  /* the highlands: round huts under thatch, a flat-topped acacia */
  d5: K => {
    K.sky(9, 11, 0, 12); K.ridge(6, 3, 2, 1.5, 2, 10); K.ground(5, 10, 2, 2, 6);
    K.rep(8, 40, (x, i) => { K.r(x, 14, 12, 6, 6); K.r(x + 5, 16, 2, 4, 0); K.peak(x + 6, 14, 16, 6, 14); K.r(x, 14, 12, 1, 4); });
    K.rep(28, 40, x => { K.r(x, 12, 1, 8, 6); K.r(x - 5, 10, 11, 2, 2); K.r(x - 3, 9, 7, 1, 10); });
  },
  /* the Konkan: a long beach, palms, a boat in the swell, a low sun */
  d6: K => {
    K.sky(9, 14, 0, 12); K.disc(120, 12, 6, 14);
    K.r(0, 12, 160, 6, 3); K.waves(12, 6, 3, 11, 15); K.ground(5, 14, 6, 6, 4);
    K.rep(12, 32, (x, i) => K.palm(x, 19, 11 + (i % 3), 6, 2));
    K.sail(60, 7, 6, 15);
  },
  /* the silk road: dunes, a blue-tiled minaret, a camel train */
  d7: K => {
    K.sky(11, 14, 0, 14); K.ridge(6, 3, 2, 0.4, 14, 6); K.ground(3, 6, 14, 14);
    K.rep(14, 80, x => { K.r(x, 4, 5, 15, 3); K.d(x, 5, 5, 14, 3, 11, 5); K.r(x - 1, 3, 7, 1, 11); K.dome(x + 2, 4, 3, 3, 11); });
    K.rep(46, 40, x => { K.r(x, 15, 8, 3, 6); K.disc(x + 2, 14, 1, 6); K.disc(x + 5, 14, 1, 6); K.r(x + 7, 12, 1, 4, 6); K.r(x + 1, 18, 1, 3, 6); K.r(x + 6, 18, 1, 3, 6); });
  },
  /* Ioannina: a lake, a castle wall on the water, plane trees */
  d8: K => {
    K.sky(9, 15, 0, 14); K.ridge(7, 3, 2, 2.0, 2, 10);
    K.r(0, 15, 160, 9, 1); K.waves(15, 9, 1, 9, 11);
    K.rep(8, 80, x => { K.r(x, 9, 34, 7, 7); K.r(x, 9, 34, 1, 15); K.tower(x + 12, 16, 10, 12, 7, 15); K.dome(x + 17, 6, 3, 14); K.arch(x + 4, 11, 4, 5, 0); K.arch(x + 26, 11, 4, 5, 0); K.r(x, 16, 34, 1, 8); });
    K.rep(60, 80, x => K.tree(x, 17, 10, 6, 2, 10));
  },
  /* Kaifeng: a pagoda, red pillars, a brown river, willows */
  d9: K => {
    K.sky(11, 15, 0, 12); K.ground(6, 6, 14, 14);
    K.r(0, 18, 160, 6, 6); K.waves(18, 6, 6, 14, 15);
    K.rep(10, 80, x => {
      for (let t = 0; t < 4; t++) { const w = 18 - t * 3, y = 3 + t * 4; K.r(x + 9 - (w >> 1), y, w, 1, 4); K.r(x + 8 - (w >> 1), y + 1, w + 2, 1, 4); K.r(x + 10 - (w >> 1), y + 2, w - 2, 2, 12); }
      K.r(x + 8, 0, 2, 3, 14); K.r(x + 2, 17, 14, 1, 7);
    });
    K.rep(50, 80, x => { K.r(x, 8, 1, 10, 6); K.r(x - 3, 8, 7, 2, 2); for (let k = 0; k < 5; k++) K.r(x - 3 + k * 2, 10, 1, 6 + (k % 2) * 2, 10); });
  },
  /* the Caucasus: snow peaks, pines, a village under them */
  d10: K => {
    K.sky(1, 11, 0, 16);
    K.rep(0, 80, x => { K.peak(x + 24, 20, 40, 16, 8, 15); K.peak(x + 60, 20, 34, 12, 7, 15); });
    K.ground(5, 2, 10, 2);
    K.rep(4, 10, (x, i) => { K.peak(x, 21, 7, 9 + i % 3, 2); K.r(x, 21, 1, 2, 6); });
    K.rep(0, 40, x => { K.house(x + 22, 21, 6, 4, 15, 4, 14); });
  },
  /* cliff-city: sandstone, caves, a wall along the top, a scroll's worth of sky */
  d11: K => {
    K.sky(9, 11, 0, 12);
    K.rep(0, 80, x => { K.r(x + 6, 6, 50, 18, 6); K.d(x + 6, 6, 50, 18, 6, 14, 3); K.r(x + 6, 6, 50, 1, 14); K.tower(x + 10, 6, 10, 4, 6, 14); K.tower(x + 40, 6, 12, 4, 6, 14);
      for (let k = 0; k < 4; k++) K.arch(x + 12 + k * 11, 11 + (k & 1) * 3, 4, 5, 0); });
    K.ground(2, 6, 14);
  },
  /* the harbours: masts, sails, the sea the people went by */
  d12: K => {
    K.sky(9, 11, 0, 12); K.cloud(30, 2, 15); K.cloud(112, 3, 15);
    K.waves(14, 10, 1, 9, 11);
    K.rep(6, 32, (x, i) => K.sail(x, 6 + (i % 3), [6, 14, 4, 15, 2][i % 5], [15, 14, 15, 11, 15][i % 5]));
    K.rep(20, 80, x => { K.r(x, 6, 3, 12, 15); K.r(x, 9, 3, 1, 4); K.r(x, 12, 3, 1, 4); K.r(x - 1, 4, 5, 2, 8); K.px(x + 1, 3, 14); });
  },

  /* ---- the rules ---- */
  /* a Friday night, one window lit, a neighbour at the door */
  s_goy: K => {
    K.sky(0, 1, 0, 14); K.stars(10, 15, 11, 8, 1); K.ground(4, 8, 7);
    K.rep(0, 40, (x, i) => { K.r(x + 2, 7, 22, 13, i & 1 ? 6 : 7); K.r(x + 2, 7, 22, 1, 15); K.r(x + 5, 10, 5, 5, 14); K.glow(x + 8, 13, 9, 8, 14, 3); K.r(x + 14, 12, 3, 8, 0); K.r(x + 5, 12, 5, 1, 6); });
    K.rep(28, 40, x => K.person(x, 19, 9, 8, 12));
  },
  /* the spice tower: silver, a flag, a drift of fragrance */
  s_bes: K => {
    K.r(0, 0, 160, 24, 5); K.d(0, 0, 160, 24, 5, 0, 8); K.stars(12, 13, 15, 24, 5);
    K.rep(14, 40, (x, i) => {
      K.r(x - 1, 13, 7, 9, 7); K.r(x - 1, 13, 2, 9, 15); K.r(x - 2, 21, 9, 2, 8);
      K.r(x + 1, 6, 3, 7, 7); K.r(x, 4, 5, 2, 7); K.r(x + 2, 2, 1, 2, 8); K.r(x + 3, 2, 3, 2, 4);
      for (let k = 0; k < 6; k++) K.px(x + 8 + (k * 3) % 7, 4 + (k * 5) % 12, k & 1 ? 14 : 10);
    });
  },
  /* one flame from many wicks */
  s_esh: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 5, 3);
    K.rep(0, 40, (x, i) => {
      K.glow(x + 20, 10, 20, 12, 14, 2);
      for (let k = 0; k < 5; k++) { const h = 8 - Math.abs(k - 2) * 2; K.flame(x + 12 + k * 4, 17 - h, k & 1 ? 12 : 14, 15); K.r(x + 12 + k * 4, 20 - 3, 1, 3, 8); }
      for (let s = 0; s < 8; s++) { K.r(x + 8 + s * 3, 19, 3, 1, s & 1 ? 1 : 15); K.r(x + 8 + s * 3, 20, 3, 1, s & 1 ? 15 : 1); K.r(x + 8 + s * 3, 21, 3, 1, s & 1 ? 1 : 15); K.r(x + 8 + s * 3, 22, 3, 2, s & 1 ? 15 : 1); }
    });
  },
  /* luck, written in the stars */
  s_maz: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 0, 6); K.stars(16, 8, 15, 24, 8);
    K.rep(2, 32, (x, i) => {
      const P = [[0, 8], [6, 3], [12, 9], [18, 4], [24, 12]];
      P.forEach((p, k) => { K.star4(x + p[0] + 1, p[1] + 5 + (i % 3), 14); if (k) { const q = P[k - 1], n = 6; for (let s = 1; s < n; s++) K.px(x + Math.round(q[0] + (p[0] - q[0]) * s / n) + 1, Math.round(q[1] + (p[1] - q[1]) * s / n) + 5 + (i % 3), 8); } });
    });
  },
  /* eighteen coins and the letters that spell life */
  s_chai: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 2);
    K.rep(0, 40, (x, i) => {
      K.r(x + 4, 4, 3, 14, 14); K.r(x + 4, 4, 11, 3, 14); K.r(x + 12, 4, 3, 14, 14); K.r(x + 10, 11, 5, 3, 14);
      K.r(x + 18, 5, 3, 8, 14); K.r(x + 18, 14, 2, 4, 14);
      for (let k = 0; k < 4; k++) { K.disc(x + 28 + (k & 1) * 4, 20 - k * 2, 2, 14); K.px(x + 27 + (k & 1) * 4, 19 - k * 2, 15); }
    });
    K.r(0, 22, 160, 2, 6);
  },
  /* the first time this year: blossom, the first warm sky */
  s_she: K => {
    K.sky(13, 15, 0, 12); K.ground(4, 10, 2, 2);
    K.rep(0, 20, (x, i) => { K.r(x + 8, 11, 2, 9, 6); K.oval(x + 9, 8, 6, 4, 13); K.oval(x + 8, 7, 4, 2, 15); K.px(x + 12, 10, 12); K.px(x + 5, 9, 12); });
    K.rep(4, 8, (x, i) => K.px(x, 15 + (i * 5) % 4, 15));
  },
  /* thirty-six lamps no one knows are lit */
  s_lam: K => {
    K.sky(0, 1, 0, 16); K.stars(10, 15, 9, 8, 2); K.ground(4, 0, 8);
    K.rep(0, 20, (x, i) => { K.r(x + 2, 12 + (i % 3), 14, 10, 8); K.r(x + 2, 12 + (i % 3), 14, 1, 7);
      K.r(x + 7, 15 + (i % 3), 2, 3, 14); K.wash(x + 4, 13 + (i % 3), 8, 8, 14, 3); K.px(x + 8, 5 + (i * 3) % 6, 14); K.px(x + 8, 4 + (i * 3) % 6, 15); });
  },
  /* a calm sea at night and a light that does not need watching */
  s_bit: K => {
    K.sky(0, 1, 0, 12); K.stars(18, 15, 11, 10, 3); K.r(0, 12, 160, 12, 1); K.waves(12, 12, 1, 9, 11);
    K.rep(14, 80, x => { K.disc(x, 5, 3, 15); K.disc(x + 1, 5, 3, 0); K.disc(x, 5, 2, 15);
      for (let y = 12; y < 24; y += 2) K.r(x - 2 + (y % 4), y, 4 - (y > 18 ? 2 : 0), 1, 15); });
    K.rep(50, 80, x => K.sail(x, 8, 6, 15));
  },
  /* two lecterns, two colours, one ruling written down between them */
  s_pil: K => {
    K.rep(0, 80, x => { K.r(x, 0, 40, 24, 1); K.d(x, 0, 40, 24, 1, 9, 3); K.r(x + 40, 0, 40, 24, 4); K.d(x + 40, 0, 40, 24, 4, 12, 3);
      K.r(x + 38, 0, 4, 24, 14); for (let k = 0; k < 24; k += 2) K.r(x + 38 + ((k >> 1) & 1) * 2, k, 2, 2, 0);
      K.r(x + 14, 8, 10, 12, 6); K.r(x + 12, 7, 14, 2, 14); K.r(x + 17, 3, 4, 4, 15); K.r(x + 54, 8, 10, 12, 6); K.r(x + 52, 7, 14, 2, 14); K.r(x + 57, 3, 4, 4, 15); });
  },
  /* the seventh year: plough lines grown over, a gate open, sheaves left standing */
  s_shm: K => {
    K.sky(11, 15, 0, 12); K.ridge(4, 2, 2, 0.1, 10, 2); K.ground(9, 6, 14, 2, 4);
    K.rep(0, 6, (x, i) => { K.r(x, 15 + (i & 1), 5, 1, 2); K.r(x + 2, 17, 3, 1, 10); K.r(x + 1, 20, 4, 1, 2); });
    K.rep(14, 40, x => { K.r(x, 9, 1, 10, 6); K.r(x + 8, 9, 1, 10, 6); K.r(x, 9, 9, 1, 6); K.r(x + 2, 11, 5, 1, 6); });
    K.rep(30, 40, x => { for (let k = 0; k < 4; k++) K.r(x + k, 13 + (k & 1), 1, 6, 14); K.r(x, 14, 4, 1, 4); });
  },
  /* ten people, and the room is a room */
  s_min: K => {
    K.r(0, 0, 160, 24, 6); K.d(0, 0, 160, 24, 6, 14, 2); K.r(0, 18, 160, 6, 4); K.r(0, 18, 160, 1, 14);
    K.rep(3, 16, (x, i) => { K.person(x + 4, 22, 11, [1, 2, 5, 8, 0][i % 5], [12, 14, 6, 7, 15][i % 5]); K.r(x + 4, 7, 2, 1, 15); });
    K.rep(0, 40, x => { K.r(x + 20, 3, 1, 3, 8); K.r(x + 18, 6, 5, 2, 14); K.glow(x + 20, 8, 7, 5, 14, 3); });
  },
  /* sayings of the fathers, cut in stone, in rows */
  s_pir: K => {
    K.r(0, 0, 160, 24, 14); K.d(0, 0, 160, 24, 14, 6, 4); K.d(0, 0, 160, 24, 14, 7, 2);
    K.rep(0, 40, (x, i) => { K.r(x, 0, 1, 24, 6); K.script(x + 5, 3, 30, 6, 6, i * 9 + 2); K.r(x + 4, 1, 32, 1, 6); K.r(x + 4, 22, 32, 1, 6); });
  }
};
