/* Backdrops for what the next generation starts with, and for the things the MITZVOT tab
   shows that no building stands behind. */
export const SCENES_E = {
  /* the merit of the ancestors: a crown held over the hills at dusk */
  l_zech: K => {
    K.sky(1, 13, 0, 16); K.stars(14, 15, 14, 9, 4); K.ridge(5, 2, 2, 1.0, 5, 13); K.ridge(3, 2, 3, 0.2, 0);
    K.rep(0, 80, x => { K.glow(x + 40, 9, 14, 8, 14, 3); K.r(x + 33, 8, 14, 5, 14); K.r(x + 33, 5, 3, 3, 14); K.r(x + 38, 4, 3, 4, 14); K.r(x + 44, 5, 3, 3, 14); K.r(x + 33, 8, 14, 1, 15); K.px(x + 34, 4, 15); K.px(x + 39, 3, 15); K.px(x + 45, 4, 15); K.r(x + 38, 10, 4, 2, 12); });
  },
  /* the chain of tradition: links, and the lamplight on them */
  l_chain: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 0, 6);
    K.rep(0, 12, (x, i) => { const y = 8 + (i & 1) * 0; K.oval(x + 6, y + 4, 7, 4, 7); K.oval(x + 6, y + 4, 5, 2, 1); K.r(x + 1, y + 3, 2, 1, 15); K.r(x + 8, y + 7, 3, 1, 8); K.r(x + 12, y + 3, 2, 2, 7); });
    K.rep(20, 40, x => K.wash(x - 8, 3, 18, 18, 14, 2));
    K.r(0, 0, 160, 1, 14); K.r(0, 23, 160, 1, 14);
  },
  /* the box is opened and they are in it already, wrapped in velvet */
  l_cand: K => {
    K.r(0, 0, 160, 24, 5); K.d(0, 0, 160, 24, 5, 13, 2); K.r(0, 0, 160, 2, 14); K.r(0, 22, 160, 2, 14);
    K.rep(8, 40, (x, i) => { [0, 12].forEach(o => { K.r(x + o, 7, 3, 12, 7); K.r(x + o, 7, 1, 12, 15); K.r(x + o - 2, 18, 7, 3, 7); K.r(x + o - 1, 5, 5, 2, 15); K.flame(x + o + 1, 1, 14, 15); }); K.r(x + 5, 14, 6, 1, 7); });
  },
  /* what was learned: ridge behind ridge, each paler, each further away */
  l_mem: K => {
    K.sky(1, 11, 0, 14);
    K.ridge(14, 4, 2, 0.3, 1); K.d(0, 0, 160, 24, 11, 11, 0);
    K.ridge(12, 3, 3, 1.1, 9); K.ridge(9, 3, 2, 2.2, 3); K.ridge(6, 2, 3, 0.7, 2); K.ridge(3, 2, 2, 1.7, 0);
    K.stars(14, 15, 14, 8, 6);
  },
  /* a starting line; you are already some way down the track */
  l_start: K => {
    K.r(0, 0, 160, 24, 4); K.d(0, 0, 160, 24, 4, 12, 3);
    for (let y = 2; y < 24; y += 7) K.r(0, y, 160, 1, 15);
    K.rep(0, 80, (x, i) => { for (let k = 0; k < 6; k++) { K.r(x + 10, 1 + k * 4, 2, 2, (k & 1) ? 15 : 0); K.r(x + 12, 1 + k * 4, 2, 2, (k & 1) ? 0 : 15); } K.person(x + 40, 12, 9, 1, 14); K.r(x + 38, 12, 2, 3, 1); K.r(x + 42, 12, 3, 2, 1); });
  },
  /* a good eye: gold on the dark, and one star that is larger than the others */
  l_gold: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 1, 4);
    for (let i = 0; i < 26; i++) K.star4((i * 37) % 160, 2 + (i * 11) % 20, i % 3 ? 6 : 14);
    K.rep(0, 80, x => { K.glow(x + 40, 12, 16, 10, 14, 3); K.r(x + 38, 4, 5, 16, 14); K.r(x + 32, 10, 17, 5, 14); K.r(x + 34, 7, 13, 3, 14); K.r(x + 34, 15, 13, 3, 14); K.r(x + 39, 9, 3, 7, 15); });
  },
  /* the delight of it: a cup, two loaves under a cloth, a candle */
  l_shab: K => {
    K.r(0, 0, 160, 24, 5); K.d(0, 0, 160, 24, 5, 0, 4); K.r(0, 17, 160, 7, 15); K.r(0, 17, 160, 1, 7); K.d(0, 20, 160, 4, 15, 7, 3);
    K.rep(6, 40, x => {
      K.r(x, 9, 7, 5, 14); K.r(x + 1, 14, 5, 3, 14); K.r(x + 3, 17, 1, 1, 6); K.r(x + 1, 10, 5, 2, 4); K.r(x, 9, 7, 1, 15);
      K.oval(x + 16, 14, 7, 3, 1); K.oval(x + 16, 13, 6, 2, 9); K.r(x + 10, 12, 12, 1, 15);
      K.r(x + 28, 8, 3, 10, 15); K.flame(x + 29, 3, 14, 15); K.glow(x + 29, 6, 8, 8, 14, 3);
    });
  },
  /* it does not go out because you left the room: one lamp, burning, in a window */
  l_off: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 0, 6); K.stars(6, 15, 9, 24, 9);
    K.rep(0, 40, x => {
      K.r(x + 8, 0, 2, 3, 8); K.r(x + 7, 3, 4, 5, 4); K.r(x + 8, 8, 2, 1, 12); K.glow(x + 9, 8, 9, 9, 12, 3); K.px(x + 8, 5, 12);
      K.r(x + 22, 4, 12, 16, 6); K.r(x + 23, 5, 10, 14, 0); K.r(x + 23, 5, 10, 1, 14); K.r(x + 27, 5, 2, 14, 6);
      K.r(x + 24, 11, 3, 5, 14); K.r(x + 24, 11, 3, 1, 15); K.glow(x + 25, 13, 5, 6, 14, 5);
    });
    K.r(0, 21, 160, 3, 8);
  },
  /* the broken pieces, and the sparks that are coming back to them */
  l_tik: K => {
    K.r(0, 0, 160, 24, 0); K.d(0, 0, 160, 24, 0, 1, 4);
    K.rep(0, 40, (x, i) => {
      K.r(x + 14, 10, 12, 10, 8); K.r(x + 14, 10, 12, 1, 7); K.r(x + 16, 12, 8, 6, 0); K.r(x + 19, 12, 2, 3, 14);
      K.r(x + 10, 17, 3, 3, 7); K.r(x + 27, 15, 3, 4, 7); K.r(x + 6, 21, 4, 2, 8); K.r(x + 31, 20, 3, 2, 8);
      [[2, 3, 14], [35, 4, 12], [8, 8, 15], [32, 9, 11], [4, 14, 13], [36, 13, 10]].forEach(p => { K.px(x + p[0], p[1], p[2]); K.px(x + p[0] + (p[0] < 20 ? 3 : -3), p[1] + 2, 8); });
      K.glow(x + 20, 12, 8, 7, 14, 3);
    });
  },
  /* and you shall teach them: a bench of small people, one big person, one book */
  l_teach: K => {
    K.r(0, 0, 160, 24, 2); K.d(0, 0, 160, 24, 2, 10, 2); K.r(0, 2, 160, 11, 0); K.r(0, 2, 160, 1, 6); K.r(0, 13, 160, 1, 6);
    K.rep(6, 40, (x, i) => { K.script(x, 4, 24, 3, 15, i); });
    K.r(0, 17, 160, 7, 6); K.r(0, 17, 160, 1, 14);
    K.rep(0, 40, x => {
      K.person(x + 4, 22, 10, 4, 12); K.r(x + 8, 17, 4, 3, 15);
      for (let k = 0; k < 3; k++) K.person(x + 16 + k * 7, 22, 6, [1, 5, 14][k], [14, 12, 6][k]);
    });
  },

  /* ---- for the MITZVOT tab ---- */
  /* a bare wall of hung lamps: for every plain milestone that is not a building */
  m_stars: K => {
    K.r(0, 0, 160, 24, 1); K.d(0, 0, 160, 24, 1, 9, 3); K.stars(26, 15, 11, 24, 5);
    K.rep(6, 24, (x, i) => K.star4(x, 4 + (i * 9) % 16, [14, 15, 12][i % 3]));
  },
  m_shabbat: K => {
    K.sky(1, 6, 0, 14); K.d(0, 10, 160, 6, 6, 14, 5); K.ridge(4, 2, 3, 0.4, 0); K.r(0, 17, 160, 7, 15); K.d(0, 20, 160, 4, 15, 7, 3);
    K.rep(14, 40, x => { K.r(x, 9, 2, 8, 15); K.flame(x, 4, 14, 15); K.r(x + 8, 9, 2, 8, 15); K.flame(x + 8, 4, 14, 15); });
  },
  m_gold: K => {
    K.r(0, 0, 160, 24, 14); K.d(0, 0, 160, 24, 14, 6, 3);
    K.rep(0, 32, (x, i) => { K.star4(x + 5, 5 + (i * 7) % 12, 15); K.star4(x + 20, 12 + (i * 5) % 8, 6); });
  },
  m_books: K => {
    K.r(0, 0, 160, 24, 6); K.d(0, 0, 160, 24, 6, 4, 3);
    K.rep(0, 10, (x, i) => { const h = 12 + (i * 5) % 8; K.r(x + 1, 24 - h, 8, h, [4, 1, 2, 5, 14, 9][i % 6]); K.r(x + 1, 24 - h, 1, h, 15); K.r(x + 1, 24 - h + 3, 8, 1, 14); K.r(x + 1, 22, 8, 1, 14); });
  }
};
