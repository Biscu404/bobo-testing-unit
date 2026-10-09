/* THE ELEPHANT — fourteen more things to wear, on the big front-on elephant (wear.js is the first thirteen and the kit these use). They are Dave's second stock
   (kernel/cos_more_stock.js ELEPHANT_M): none is for sale, each is given by a trophy. Same rules as wear.js: sixteen colours by their VGA number, whole pixels, a black edge
   on everything, `k` is { R, B, oval } and `e.br` is the breath he is taking, so a hat rides his head. `MORE[slot][id](k, e)`; wear.js draws them in the same pass as its own.
   The little desktop elephant has his own pictures of the same fourteen (kernel/pet_art_more.js). */

/* a pair of curved horns, one each side of the head: `n` segments from the brow, each narrower and higher than the last, drifting out and then back in at the tip */
function hornPair(R, br, o) {
  const seg = i => { const w = Math.max(5, o.w - 2 * i), bx = i > o.bend ? (i - o.bend) * 5 : 0; return { w: w, y: o.y - i * o.rise + br, l: o.l - i * 4 + bx, r: o.r - w + i * 4 - bx }; };
  for (let i = 0; i < o.n; i++) { const g = seg(i); R(g.l - 1, g.y - 1, g.w + 2, o.rise + 3, 0); R(g.r - 1, g.y - 1, g.w + 2, o.rise + 3, 0); }
  for (let i = 0; i < o.n; i++) { const g = seg(i); R(g.l, g.y, g.w, o.rise + 1, o.c); R(g.r, g.y, g.w, o.rise + 1, o.c); R(g.l + g.w - 3, g.y, 3, o.rise + 1, o.sh); R(g.r, g.y, 3, o.rise + 1, o.sh); }
}
/* the top half of a rounded cap: rows from `top` to `bottom`, as wide as an ellipse of half-width `rx` there, with a black edge */
function dome(R, cx, top, bottom, rx, c, lit) {
  const h = bottom - top;
  for (let y = 0; y <= h; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - Math.pow((h - y) / h, 2))));
    R(cx - w - 1, top + y, w * 2 + 3, 1, 0); R(cx - w, top + y, w * 2 + 1, 1, c);
    if (lit != null && y < h * 0.5) R(cx - w + 2, top + y, Math.max(1, Math.round(w * 0.4)), 1, lit);
  }
}

const head = {
  /* two pale horns curving up and out from a white brow band, the Hollow Knight's mask */
  horns(k, e) {
    const { R, B } = k;
    hornPair(R, e.br, { y: 96, rise: 6, n: 9, w: 18, bend: 5, l: 206, r: 274, c: 15, sh: 7 });
    B(204, 98 + e.br, 72, 10, 0, 3); B(206, 99 + e.br, 68, 8, 15, 2); R(206, 104 + e.br, 68, 2, 7);
  },
  /* striped blue and gold headcloth with a gold cobra on the brow, and the lappets hanging down each side of the face */
  nemes(k, e) {
    const { R, B } = k;
    B(196, 78 + e.br, 88, 32, 0, 14); B(198, 80 + e.br, 84, 28, 14, 13);
    for (let i = 0; i < 10; i++) R(200 + i * 8, 80 + e.br, 4, 28, 1);
    R(196, 106 + e.br, 88, 4, 0); R(198, 106 + e.br, 84, 2, 14);
    [[190, 0], [284, 0]].forEach(p => { R(p[0] - 1, 104 + e.br, 16, 52, 0); R(p[0], 105 + e.br, 14, 50, 14); for (let j = 0; j < 6; j++) R(p[0], 108 + e.br + j * 8, 14, 4, 1); });
    R(236, 76 + e.br, 8, 24, 0); R(237, 77 + e.br, 6, 22, 14); R(238, 80 + e.br, 4, 4, 12); R(239, 90 + e.br, 2, 8, 6);
  },
  /* a tall pleated white chef's hat: three puffs on a band */
  toque(k, e) {
    const { R, oval } = k;
    [[240, 68, 24, 20], [216, 80, 18, 14], [264, 80, 18, 14]].forEach(p => oval(p[0], p[1] + e.br, p[2], p[3], 0));
    [[240, 68, 22, 18], [216, 80, 16, 12], [264, 80, 16, 12]].forEach(p => oval(p[0], p[1] + e.br, p[2], p[3], 15));
    [226, 236, 246, 256].forEach(x => R(x, 62 + e.br, 2, 30, 7)); R(224, 54 + e.br, 14, 3, 15);
    R(208, 90 + e.br, 64, 18, 0); R(210, 92 + e.br, 60, 14, 15); R(210, 102 + e.br, 60, 4, 7);
  },
  /* an iron helmet with a gold band, rivets, and two horns */
  viking(k, e) {
    const { R } = k;
    hornPair(R, e.br, { y: 92, rise: 7, n: 6, w: 14, bend: 3, l: 204, r: 276, c: 15, sh: 7 });
    dome(R, 240, 62 + e.br, 100 + e.br, 34, 7, 15); R(238, 66 + e.br, 4, 34, 8); R(212, 74 + e.br, 5, 22, 15);
    R(206, 98 + e.br, 68, 10, 0); R(208, 99 + e.br, 64, 8, 14); R(208, 99 + e.br, 64, 2, 15); R(208, 105 + e.br, 64, 2, 6);
    [214, 232, 250, 264].forEach(x => R(x, 101 + e.br, 4, 4, 6));
  },
  /* a wide yellow brim, a red ribbon, and a hole where the ear would be if he had a wish for it */
  straw(k, e) {
    const { R, B, oval } = k;
    oval(240, 104 + e.br, 78, 13, 0); oval(240, 103 + e.br, 76, 11, 14);
    for (let i = 0; i < 12; i++) R(172 + i * 13, 100 + e.br + (i % 3), 6, 2, 6);
    B(212, 66 + e.br, 56, 40, 0, 12); B(214, 68 + e.br, 52, 36, 14, 11);
    for (let j = 0; j < 4; j++) R(216, 74 + e.br + j * 7, 48, 2, 6);
    R(212, 92 + e.br, 56, 10, 0); R(214, 94 + e.br, 52, 6, 12); R(264, 96 + e.br, 8, 4, 12); R(268, 100 + e.br, 4, 12, 12);
  },
  /* a white band with a red sun, tied at the back and trailing a tail over one side */
  headband(k, e) {
    const { R, oval } = k;
    R(196, 106 + e.br, 88, 14, 0); R(198, 108 + e.br, 84, 10, 15); R(198, 114 + e.br, 84, 2, 7);
    oval(240, 113 + e.br, 8, 6, 0); oval(240, 113 + e.br, 6, 4, 12); R(236, 110 + e.br, 3, 2, 15);
    for (let i = 0; i < 5; i++) { R(282 + i * 4, 112 + e.br + i * 5 - 1, 8, 8, 0); R(283 + i * 4, 112 + e.br + i * 5, 6, 6, 15); R(283 + i * 4, 116 + e.br + i * 5, 6, 2, 7); }
  },
  /* a small grey television on his head with a rolling picture and two ears for an aerial */
  tubehat(k, e) {
    const { R, B } = k;
    R(224, 36 + e.br, 3, 24, 0); R(254, 30 + e.br, 3, 30, 0); R(214, 34 + e.br, 14, 3, 0); R(250, 28 + e.br, 14, 3, 0);
    B(204, 56 + e.br, 72, 52, 0, 8); B(206, 58 + e.br, 68, 48, 7, 7); R(206, 58 + e.br, 68, 3, 15);
    R(212, 64 + e.br, 46, 36, 0); R(214, 66 + e.br, 42, 32, 1);
    for (let j = 0; j < 8; j++) R(214, 66 + e.br + j * 4, 42, 1, 9);
    R(214, 78 + e.br, 42, 5, 3); R(214, 83 + e.br, 42, 2, 11);
    R(262, 70 + e.br, 8, 8, 12); R(262, 84 + e.br, 8, 8, 8);
  }
};

const face = {
  /* a black strip of visor across both eyes, green, with a scan of text on it */
  visor(k, e) {
    const { R } = k;
    R(166, 134 + e.br, 148, 30, 0); R(168, 136 + e.br, 144, 26, 2); R(168, 136 + e.br, 144, 4, 10); R(168, 158 + e.br, 144, 3, 0);
    for (let i = 0; i < 6; i++) { R(176 + i * 24, 146 + e.br, 14 + (i % 3) * 3, 3, 10); R(176 + i * 24, 152 + e.br, 8 + (i % 2) * 6, 2, 10); }
    R(160, 142 + e.br, 8, 4, 0); R(312, 142 + e.br, 8, 4, 0);
  },
  /* cardboard 3D glasses, red on the left and cyan on the right */
  anaglyph(k, e) {
    const { R, B } = k;
    B(196, 130 + e.br, 44, 36, 0, 8); B(198, 132 + e.br, 40, 32, 15, 7); B(203, 137 + e.br, 30, 22, 12, 5);
    B(240, 130 + e.br, 44, 36, 0, 8); B(242, 132 + e.br, 40, 32, 15, 7); B(247, 137 + e.br, 30, 22, 11, 5);
    R(236, 140 + e.br, 8, 8, 15); R(236, 140 + e.br, 8, 2, 0); R(170, 142 + e.br, 28, 4, 0); R(282, 142 + e.br, 28, 4, 0);
    R(206, 140 + e.br, 6, 3, 15); R(250, 140 + e.br, 6, 3, 15);
  }
};

const neck = {
  /* a gold chain round the throat, and an ankh hanging from it on the left of his chest */
  ankhchain(k, e) {
    const { R, oval } = k;
    for (let i = 0; i < 15; i++) { const x = 196 + i * 6, y = 214 + Math.round(20 * Math.sin(Math.PI * i / 14)); R(x - 1, y - 1, 7, 6, 0); }
    for (let i = 0; i < 15; i++) { const x = 196 + i * 6, y = 214 + Math.round(20 * Math.sin(Math.PI * i / 14)); R(x, y, 5, 4, i % 2 ? 14 : 6); }
    oval(204, 248 + e.br, 8, 10, 0); oval(204, 248 + e.br, 6, 8, 14); oval(204, 248 + e.br, 3, 5, 0);
    R(192, 257 + e.br, 24, 7, 0); R(193, 258 + e.br, 22, 5, 14); R(200, 262 + e.br, 8, 18, 0); R(201, 262 + e.br, 6, 16, 14);
  },
  /* a black cord and a gold arrow head hanging on the left of his chest */
  arrowchain(k, e) {
    const { R } = k;
    for (let i = 0; i < 15; i++) { const x = 196 + i * 6, y = 212 + Math.round(22 * Math.sin(Math.PI * i / 14)); R(x, y, 6, 4, 0); }
    R(202, 232 + e.br, 4, 12, 8);
    const rows = [];
    for (let j = 0; j < 22; j++) rows.push(Math.max(2, 24 - Math.round(j * 1.1)));
    rows.forEach((w, j) => R(204 - Math.round(w / 2) - 1, 244 + e.br + j, w + 2, 1, 0));
    rows.forEach((w, j) => R(204 - Math.round(w / 2), 244 + e.br + j, w, 1, j % 6 === 0 ? 6 : 14));
    R(197, 246 + e.br, 3, 9, 15); R(202, 246 + e.br, 4, 4, 6);
  }
};

const body = {
  /* a red knitted sweater with a white snowflake band and collar */
  lusekofte(k, e) {
    const { R, B } = k;
    B(164, 164 + e.br, 152, 66, 0, 18); B(166, 166 + e.br, 148, 62, 12, 18);
    R(170, 178 + e.br, 140, 4, 15); R(170, 204 + e.br, 140, 4, 15);
    for (let i = 0; i < 11; i++) { const x = 174 + i * 13; R(x + 2, 188 + e.br, 3, 11, 15); R(x - 1, 191 + e.br, 9, 3, 15); R(x + 1, 189 + e.br, 5, 2, 12); }
    R(166, 220 + e.br, 148, 6, 15); R(166, 216 + e.br, 148, 3, 4);
  },
  /* a bright yellow plastic suit with a zip down the middle, a pocket and a dark hem */
  yellowsuit(k, e) {
    const { R, B } = k;
    B(164, 160 + e.br, 152, 70, 0, 20); B(166, 162 + e.br, 148, 66, 14, 19);
    R(238, 164 + e.br, 4, 62, 6); for (let j = 0; j < 12; j++) R(236, 166 + e.br + j * 5, 8, 2, 8);
    R(186, 190 + e.br, 30, 24, 0); R(188, 192 + e.br, 26, 20, 14); R(188, 192 + e.br, 26, 3, 6);
    R(166, 218 + e.br, 148, 8, 6); R(168, 164 + e.br, 4, 56, 15);
  },
  /* a plain brown robe with a rope round the middle and a hood folded at the back */
  robe(k, e) {
    const { R, B } = k;
    B(162, 160 + e.br, 156, 74, 0, 22); B(164, 162 + e.br, 152, 70, 6, 21);
    [184, 208, 272, 296].forEach(x => R(x, 166 + e.br, 3, 62, 0));
    R(164, 198 + e.br, 152, 8, 0); R(164, 199 + e.br, 152, 6, 14); for (let i = 0; i < 20; i++) R(166 + i * 8, 199 + e.br, 2, 6, 6);
    R(236, 204 + e.br, 8, 24, 14); R(236, 204 + e.br, 8, 2, 6); R(234, 224 + e.br, 12, 4, 6);
  }
};

export const MORE = { head, face, neck, body };
export const MORE_IDS = Object.keys(head).concat(Object.keys(face), Object.keys(neck), Object.keys(body));
/* how far each hat stands over the top of his head (y 104), so his speech bubble rises over it (index.js HAT_LIFT) */
export const LIFT_MORE = { horns: 52, nemes: 26, toque: 52, viking: 44, straw: 38, headband: 4, tubehat: 76 };
