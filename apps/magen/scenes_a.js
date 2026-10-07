/* The first ten buildings' backdrops. Each is a function of the kit (scene_kit.js,
   scene_props.js); the numbers are VGA16 indexes. 160 x 24, the ground at y 19. */
export const SCENES_A = {
  /* a tailor's stalls under striped awnings */
  kippah: K => {
    K.sky(9, 11); K.cloud(10, 2, 15, 7); K.cloud(92, 4, 15, 7);
    const AW = [[12, 15], [1, 15], [2, 15], [5, 15]], CL = [4, 1, 2, 5, 14, 6];
    K.rep(5, 40, (x, i) => {
      for (let s = 0; s < 30; s += 3) K.r(x + s, 7, 3, 4, (s / 3) % 2 ? AW[i % 4][1] : AW[i % 4][0]);
      K.r(x, 11, 30, 1, 8); K.d(x + 1, 12, 28, 3, 6, 0, 6);
      K.r(x + 1, 11, 1, 8, 6); K.r(x + 28, 11, 1, 8, 6);
      for (let s = 0; s < 6; s++) { K.r(x + 3 + s * 4, 14, 3, 5, CL[(s + i) % 6]); K.r(x + 3 + s * 4, 14, 3, 1, 15); }
      K.r(x, 18, 30, 1, 6);
    });
    K.ground(5, 6, 14, 8); K.d(0, 19, 160, 1, 6, 14, 6);
  },
  /* friday, a quarter of an hour to sunset, a table laid for it */
  nerot: K => {
    K.sky(1, 6, 0, 13); K.d(0, 9, 160, 7, 6, 14, 5);
    K.rep(24, 80, x => { K.disc(x + 10, 14, 7, 14); K.disc(x + 10, 14, 4, 15); });
    K.ridge(4, 2, 3, 0.4, 0, 8);
    K.rep(0, 16, (x, i) => { const h = 4 + (i * 5) % 5; K.r(x + 2, 19 - h, 5 + i % 3, h, 0); });
    K.rep(8, 40, (x, i) => { K.glow(x + 1, 8, 10, 8, 14, 2); K.glow(x + 11, 8, 10, 8, 14, 2); });
    K.r(0, 18, 160, 6, 15); K.r(0, 18, 160, 1, 7); K.d(0, 20, 160, 4, 15, 7, 3);
    K.rep(8, 40, (x, i) => {
      [0, 10].forEach(o => { K.r(x + o, 9, 3, 10, 15); K.r(x + o, 9, 1, 10, 7); K.r(x + o - 1, 18, 5, 1, 14); K.flame(x + o + 1, 4, 14, 15); });
    });
  },
  /* a wheat field at the end of summer, and a loaf in it */
  challah: K => {
    K.sky(11, 15, 2, 14); K.cloud(24, 3, 15); K.cloud(112, 2, 15);
    K.ridge(6, 2, 2, 1.1, 2, 10); K.ground(10, 14, 6, 14);
    K.rep(1, 3, (x, i) => { const h = 7 + (i * 5) % 4; K.r(x, 22 - h, 1, h, 6); K.r(x - 1, 22 - h, 3, 2, 14); K.r(x, 22 - h - 1, 1, 1, 14); });
    K.d(0, 17, 160, 6, 14, 6, 6);
    K.rep(26, 80, x => {
      K.oval(x + 14, 18, 14, 5, 4); K.oval(x + 14, 17, 13, 4, 6); K.oval(x + 14, 16, 11, 2, 14);
      for (let s = -9; s <= 9; s += 4) { K.r(x + 14 + s, 14, 2, 1, 4); K.r(x + 15 + s, 15, 2, 1, 4); K.r(x + 16 + s, 16, 2, 1, 4); K.r(x + 15 + s, 17, 2, 1, 4); }
    });
  },
  /* a lane of doorways in an old wall, a mezuzah on every right-hand post */
  mezuzah: K => {
    K.r(0, 0, 160, 24, 7);
    for (let y = 0; y < 24; y += 4) K.rep((y & 4 ? 4 : 0), 8, x => { K.r(x, y, 7, 3, 8); K.r(x, y, 7, 1, 7); K.d(x, y, 7, 3, 7, 8, 5); });
    K.d(0, 0, 160, 5, 7, 0, 6);
    K.rep(8, 40, x => {
      K.r(x - 1, 8, 12, 16, 15); K.arch(x, 9, 10, 15, 6); K.r(x + 1, 13, 1, 11, 4); K.r(x + 4, 10, 1, 14, 4);
      K.r(x + 8, 14, 1, 3, 14); K.r(x + 8, 14, 1, 1, 15);
      K.r(x + 12, 11, 2, 3, 14); K.px(x + 12, 10, 15);
    });
    K.r(0, 21, 160, 3, 8);
  },
  /* a blue tin box on a doorstep, and coins dropped by the road */
  pushke: K => {
    K.sky(9, 11); K.cloud(20, 3, 15); K.cloud(100, 4, 15);
    K.ridge(5, 2, 2, 2.0, 10, 2); K.ground(7, 2, 10, 10);
    K.rep(8, 40, (x, i) => {
      K.r(x, 12, 12, 10, 1); K.r(x, 12, 12, 1, 9); K.r(x + 1, 13, 1, 8, 9); K.r(x + 4, 11, 4, 1, 15);
      K.r(x + 2, 15, 8, 3, 15); K.r(x + 4, 16, 4, 1, 1); K.r(x + 4, 19, 4, 1, 14);
    });
    K.rep(24, 40, (x, i) => { for (let k = 0; k < 3 + i % 3; k++) { K.r(x, 21 - k * 2, 5, 2, 14); K.r(x, 21 - k * 2, 5, 1, 15); } });
  },
  /* parchment in columns, a roller at each side */
  torah: K => {
    K.d(0, 0, 160, 24, 14, 6, 3); K.d(0, 18, 160, 6, 14, 6, 6);
    K.rep(0, 40, (x, i) => {
      K.script(x + 5, 4, 30, 5, 0, i * 11 + 1);
      K.r(x, 0, 3, 24, 6); K.r(x, 0, 1, 24, 14); K.r(x + 2, 0, 1, 24, 4);
      K.r(x - 1, 0, 5, 2, 14); K.r(x - 1, 22, 5, 2, 14);
      K.px(x + 8, 2, 4); K.px(x + 20, 2, 4); K.px(x + 30, 2, 4);
    });
  },
  /* the room: pale wall, lancets of coloured glass, a bench-lined floor */
  shul: K => {
    K.r(0, 0, 160, 24, 7); K.d(0, 0, 160, 24, 7, 15, 4); K.r(0, 0, 160, 2, 14);
    K.rep(0, 32, x => { K.r(x, 2, 3, 17, 15); K.r(x, 2, 1, 17, 7); });
    K.rep(8, 32, (x, i) => K.lancet(x, 4, 8, 14, 8, [9, 12, 10, 14][i % 4], [11, 14, 15, 13][i % 4]));
    K.r(0, 19, 160, 5, 6); K.r(0, 19, 160, 1, 14);
    K.rep(0, 16, x => { K.r(x + 2, 20, 12, 1, 4); K.r(x + 2, 22, 12, 2, 0); });
    K.rep(19, 80, x => { K.flame(x, 1, 14, 15); K.r(x, 4, 1, 2, 14); });
  },
  /* shelves from floor to ceiling, and a lamp */
  yeshiva: K => {
    K.r(0, 0, 160, 24, 6);
    const COL = [4, 1, 2, 5, 14, 12, 9, 10, 13, 3];
    for (let row = 0; row < 3; row++) {
      const y = row * 8, top = y + 1;
      K.d(0, y, 160, 7, 0, 6, 4);
      for (let x = 0, i = 0; x < 160; i++) {
        const v = (i * 7 + row * 3) % 10, w = 2 + (i + row) % 3, h = 5 - (i * 3 % 3 === 0 ? 1 : 0);
        K.r(x, y + 7 - h, w, h, COL[v]); K.r(x, y + 7 - h, 1, h, 15);
        if (i % 4 === 1) K.r(x, y + 8 - h, w, 1, 14);
        x += w + (i % 9 === 8 ? 2 : 0);
      }
      K.r(0, y + 7, 160, 1, 14); K.r(0, y + 8 - 1 + 0, 160, 1, 4);
    }
    K.rep(20, 80, x => { K.r(x, 0, 1, 7, 8); K.r(x - 4, 7, 9, 3, 14); K.d(x - 8, 10, 17, 8, 6, 14, 3); K.r(x - 4, 7, 9, 1, 15); });
  },
  /* white tile, a stone lip, and forty se'ah of still water with the light in it */
  mikveh: K => {
    K.r(0, 0, 160, 24, 15);
    for (let y = 0; y < 8; y += 4) K.rep(y & 4 ? 0 : 4, 8, x => K.r(x, y, 7, 3, 7));
    K.d(0, 0, 160, 8, 7, 15, 5);
    K.r(0, 7, 160, 2, 8); K.r(0, 8, 160, 1, 7);
    K.r(0, 9, 160, 15, 3); K.d(0, 9, 160, 6, 3, 11, 8); K.d(0, 15, 160, 9, 3, 1, 4);
    K.rep(0, 20, (x, i) => { K.r(x + (i * 7) % 12, 11 + (i % 3) * 4, 6, 1, 11); K.r(x + 8, 12 + (i % 3) * 4, 3, 1, 15); });
    K.rep(0, 40, x => K.wash(x + 8, 9, 10, 15, 15, 3));
    K.rep(0, 80, x => { for (let s = 0; s < 4; s++) K.r(x + s * 4, 9 + s * 2, 5, 2, 7); });
  },
  /* three high chairs in wood, a marble floor, a pair of scales on the wall */
  beitdin: K => {
    K.r(0, 0, 160, 24, 6); K.d(0, 0, 160, 24, 6, 4, 3);
    K.rep(0, 8, x => K.r(x, 0, 1, 18, 4));
    K.rep(14, 80, x => {
      for (let k = 0; k < 3; k++) {
        const cx = x + k * 14;
        K.arch(cx - 1, 2, 12, 16, 0); K.arch(cx, 3, 10, 15, 4); K.arch(cx + 2, 5, 6, 12, 6);
        K.r(cx + 4, 6, 2, 3, 14); K.r(cx, 14, 10, 4, 0); K.r(cx + 1, 14, 8, 1, 14);
      }
      K.r(x + 50, 5, 1, 9, 14); K.r(x + 45, 6, 11, 1, 14); K.r(x + 44, 7, 4, 1, 14); K.r(x + 54, 7, 4, 1, 14); K.r(x + 46, 9, 1, 3, 14); K.r(x + 56, 9, 1, 3, 14);
    });
    K.r(0, 17, 160, 1, 14); K.r(0, 18, 160, 1, 0);
    K.rep(0, 8, (x, i) => { for (let j = 0; j < 2; j++) K.r(x, 19 + j * 3, 8, 3, (i + j) & 1 ? 15 : 8); });
  },
};
