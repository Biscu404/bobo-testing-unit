/* THE ELEPHANT — what he wears, drawn on the big, front-on elephant. Sixteen colours, whole pixels, a black edge on everything, the same
 * three shapes (R a rectangle, B a block with its corners knocked off, limb/oval an ellipse built a row at a time) as the rest of him.
 *
 * Clothes go on in four passes, because the elephant is drawn back to front and a cape is behind him while a hat is on top:
 *   'back'   behind the body (the cape)         'feet'   over the feet (boots)
 *   'body'   over the body, under the head (the riding blanket)
 *   'front'  over everything: the cape's collar, scarf and bow tie, glasses, hats
 * `k` is the drawing kit of the window ({ R, B, oval }); `env` is { br } the breath he is taking, so a hat rides his head.
 * The little desktop elephant has his own pictures of the same twelve things (kernel/pet_art.js). */

/* a ring: an ellipse's outline, `th` thick, so what is inside it (an eye) stays seen */
function ring(R, cx, cy, rx, ry, th, c) {
  for (let y = -ry; y <= ry; y++) {
    const wo = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    const inner = Math.abs(y) < ry - th ? Math.round((rx - th) * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry - th) * (ry - th))))) : 0;
    if (inner <= 0) R(cx - wo, cy + y, wo * 2 + 1, 1, c);
    else { R(cx - wo, cy + y, wo - inner + 1, 1, c); R(cx + inner, cy + y, wo - inner + 1, 1, c); }
  }
}

const HEAD = {
  partyhat(k, e) {
    const { R, oval } = k;
    for (let i = 0; i < 10; i++) {
      const w = Math.max(4, Math.round(46 - i * 4.4)), y = 104 + e.br - i * 5, x = Math.round(240 - w / 2 + i * 0.7);
      R(x - 1, y, w + 2, 5, 0); R(x, y, w, 5, i % 2 ? 12 : 14);
    }
    oval(246, 52 + e.br, 6, 6, 0); oval(246, 52 + e.br, 5, 5, 15);
    R(204, 104 + e.br, 72, 2, 0);
  },
  tophat(k, e) {
    const { R } = k;
    R(203, 99 + e.br, 74, 9, 0); R(204, 100 + e.br, 72, 6, 8);
    R(215, 57 + e.br, 50, 45, 0); R(217, 59 + e.br, 46, 41, 0);
    R(217, 88 + e.br, 46, 9, 12); R(217, 94 + e.br, 46, 2, 4);
    R(222, 63 + e.br, 4, 22, 8); R(217, 59 + e.br, 46, 2, 8);
  },
  wizard(k, e) {
    const { R, B } = k;
    for (let i = 0; i < 12; i++) {
      const w = Math.max(5, Math.round(72 - i * 5.8)), y = 100 + e.br - i * 5, x = Math.round(240 - w / 2 + Math.sin(i * 0.4) * i * 0.7 + i * 0.8);
      R(x - 1, y, w + 2, 5, 0); R(x, y, w, 5, i % 5 === 4 ? 9 : 1);
    }
    B(188, 99 + e.br, 104, 10, 0, 3); B(190, 100 + e.br, 100, 8, 1, 3); R(190, 100 + e.br, 100, 2, 9);
    R(226, 84 + e.br, 5, 5, 14); R(246, 68 + e.br, 4, 4, 14); R(236, 52 + e.br, 3, 3, 15); R(256, 90 + e.br, 3, 3, 15);
    R(250, 38 + e.br, 8, 6, 0); R(251, 39 + e.br, 6, 4, 1);
  },
  crown(k, e) {
    const { R, B } = k;
    [[210, 64, 9, 24], [236, 56, 9, 32], [261, 64, 9, 24]].forEach(p => { R(p[0] - 1, p[1] + e.br, p[2] + 2, p[3] + 2, 0); R(p[0], p[1] + 1 + e.br, p[2], p[3], 14); R(p[0], p[1] + 1 + e.br, 3, p[3], 15); });
    B(206, 83 + e.br, 68, 24, 0, 3); B(208, 85 + e.br, 64, 20, 14, 3);
    R(208, 99 + e.br, 64, 4, 6); R(208, 85 + e.br, 64, 3, 15);
    R(238, 60 + e.br, 5, 7, 12); R(212, 70 + e.br, 5, 5, 12); R(263, 70 + e.br, 5, 5, 9);
    R(220, 90 + e.br, 6, 6, 12); R(254, 90 + e.br, 6, 6, 9); R(237, 90 + e.br, 6, 6, 11);
  }
};
const FACE = {
  glasses(k, e) {
    const { R } = k;
    [218, 262].forEach(cx => ring(R, cx, 148 + e.br, 18, 15, 3, 0));
    R(235, 145 + e.br, 10, 3, 0); R(170, 143 + e.br, 31, 3, 0); R(279, 143 + e.br, 31, 3, 0);
  },
  shades(k, e) {
    const { R, oval } = k;
    [218, 262].forEach(cx => { oval(cx, 150 + e.br, 19, 14, 0); R(cx - 12, 141 + e.br, 9, 3, 8); });
    R(235, 145 + e.br, 10, 4, 0); R(170, 143 + e.br, 30, 4, 0); R(280, 143 + e.br, 30, 4, 0);
  },
  monocle(k, e) {
    const { R } = k;
    ring(R, 262, 148 + e.br, 18, 15, 4, 14); ring(R, 262, 148 + e.br, 14, 11, 1, 6);
    R(279, 156 + e.br, 3, 6, 14);
    for (let i = 0; i < 9; i++) R(279 + (i % 2) * 3, 160 + e.br + i * 6, 3, 5, 14);
  }
};
const NECK = {
  bowtie(k, e) {
    const { R, B } = k;
    B(209, 205 + e.br, 30, 20, 0, 4); B(241, 205 + e.br, 30, 20, 0, 4);
    B(211, 207 + e.br, 26, 16, 12, 4); B(243, 207 + e.br, 26, 16, 12, 4);
    R(213, 209 + e.br, 20, 2, 4); R(245, 209 + e.br, 20, 2, 4);
    B(233, 207 + e.br, 14, 16, 0, 3); B(235, 209 + e.br, 10, 12, 4, 2);
  },
  scarf(k, e) {
    const { R, B } = k;
    B(186, 197 + e.br, 108, 20, 0, 7); B(188, 199 + e.br, 104, 16, 12, 6);
    for (let i = 0; i < 6; i++) R(198 + i * 17, 199 + e.br, 7, 16, 15);
    B(193, 210 + e.br, 24, 48, 0, 4); B(195, 212 + e.br, 20, 44, 12, 3);
    for (let j = 0; j < 3; j++) R(195, 220 + e.br + j * 12, 20, 5, 15);
    for (let i = 0; i < 5; i++) R(196 + i * 4, 256 + e.br, 2, 6, 14);
  }
};
const BODY = {
  blanket(k, e) {
    const { R, B } = k;
    B(168, 164 + e.br, 144, 62, 0, 18); B(170, 166 + e.br, 140, 58, 14, 18); B(174, 170 + e.br, 132, 50, 12, 16);
    for (let i = 0; i < 6; i++) R(182 + i * 22, 172 + e.br, 4, 46, 14);
    R(174, 196 + e.br, 132, 3, 14);
    for (let i = 0; i < 12; i++) R(176 + i * 11, 224 + e.br, 4, 9, 14);
  }
};
const BACK = {
  cape(k, e) {
    const { R, B } = k;
    B(142, 146 + e.br, 196, 118, 0, 30); B(144, 148 + e.br, 192, 114, 5, 28);
    R(150, 255 + e.br, 180, 5, 12); R(144, 148 + e.br, 3, 100, 13);
  }
};
const COLLAR = {
  cape(k, e) {
    const { R, B } = k;
    B(192, 196 + e.br, 96, 18, 0, 7); B(194, 198 + e.br, 92, 14, 15, 6);
    for (let i = 0; i < 7; i++) R(202 + i * 13, 202 + e.br, 4, 7, 0);
  }
};
const BOOTS = (k) => {
  const { R, B } = k;
  [[214, 266], [266, 266], [198, 267], [282, 267]].forEach((f, n) => {
    const w = n < 2 ? 36 : 42, x = f[0] - w / 2;
    B(x - 1, 252, w + 2, 24, 0, 4); B(x, 253, w, 21, 12, 4);
    R(x, 252, w, 5, 15); R(x + 4, 262, 6, 8, 4); R(x - 2, 272, w + 4, 4, 0);
  });
};

export function drawWear(layer, wear, k, env) {
  const w = wear || {};
  if (layer === 'back') { if (w.body === 'cape') BACK.cape(k, env); return; }
  if (layer === 'feet') { if (w.feet === 'boots') BOOTS(k, env); return; }
  if (layer === 'body') { if (w.body === 'blanket') BODY.blanket(k, env); return; }
  if (w.body === 'cape') COLLAR.cape(k, env);
  if (w.neck && NECK[w.neck]) NECK[w.neck](k, env);
  if (w.face && FACE[w.face]) FACE[w.face](k, env);
  if (w.head && HEAD[w.head]) HEAD[w.head](k, env);
}
