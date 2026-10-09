/* THE ELEPHANT — what he wears, drawn on the big, front-on elephant. Sixteen colours, whole pixels, a black edge on everything, the same
 * three shapes (R a rectangle, B a block with its corners knocked off, limb/oval an ellipse built a row at a time) as the rest of him.
 *
 * Clothes go on in four passes, because the elephant is drawn back to front and a cape is behind him while a hat is on top:
 *   'back'   behind the body (the cape)         'feet'   over the feet (boots)
 *   'body'   over the body, under the head (the riding blanket)
 *   'neck'   over the head, under the trunk: the cape's collar, scarf and bow tie (the trunk hangs in front of them)
 *   'front'  over everything: glasses, hats
 * `k` is the drawing kit of the window ({ R, B, oval }); `env` is { br } the breath he is taking, so a hat rides his head.
 * The little desktop elephant has his own pictures of the same twelve things (kernel/pet_art.js). */

import { MORE } from './wear_more.js';

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
  /* a ring of light a hand's width over the head, with two sparks on it: a reward (kernel/cos_rewards.js), not for sale */
  halo(k, e) {
    const { R } = k;
    ring(R, 240, 74 + e.br, 44, 10, 5, 0); ring(R, 240, 74 + e.br, 42, 8, 3, 14);
    R(212, 66 + e.br, 14, 2, 15); R(262, 80 + e.br, 6, 2, 12); R(238, 62 + e.br, 3, 3, 15); R(190, 74 + e.br, 3, 3, 15); R(288, 70 + e.br, 3, 3, 15);
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
/* Round the throat: drawn after the head and before the trunk ('neck' pass), and below the tusks (they end at y 217), so the wings come out each
   side of the trunk and the trunk hangs in front of the knot; nothing white sits on top of the red. */
const NECK = {
  bowtie(k, e) {
    const { R, B } = k;
    B(207, 219 + e.br, 31, 20, 0, 4); B(242, 219 + e.br, 31, 20, 0, 4);
    B(209, 221 + e.br, 27, 16, 12, 4); B(244, 221 + e.br, 27, 16, 12, 4);
    R(211, 223 + e.br, 21, 2, 4); R(248, 223 + e.br, 21, 2, 4);
    B(233, 221 + e.br, 14, 16, 0, 3); B(235, 223 + e.br, 10, 12, 4, 2);
  },
  /* on the left of his chest, on a red ribbon, so the trunk does not hang over it: for hearing all two hundred things he has to say */
  medal(k, e) {
    const { R, B, oval } = k;
    B(192, 211 + e.br, 20, 28, 0, 3); B(194, 213 + e.br, 16, 24, 12, 3); R(199, 213 + e.br, 6, 24, 15); R(194, 213 + e.br, 3, 24, 4);
    oval(202, 248 + e.br, 12, 12, 0); oval(202, 248 + e.br, 10, 10, 14); oval(202, 248 + e.br, 6, 6, 6); R(200, 244 + e.br, 4, 8, 14); R(197, 247 + e.br, 10, 3, 14); R(196, 241 + e.br, 5, 3, 15);
  },
  scarf(k, e) {
    const { R, B } = k;
    B(184, 211 + e.br, 112, 20, 0, 7); B(186, 213 + e.br, 108, 16, 12, 6);
    for (let i = 0; i < 6; i++) R(196 + i * 17, 213 + e.br, 7, 16, 15);
    B(191, 224 + e.br, 24, 42, 0, 4); B(193, 226 + e.br, 20, 38, 12, 3);
    for (let j = 0; j < 3; j++) R(193, 233 + e.br + j * 11, 20, 5, 15);
    for (let i = 0; i < 5; i++) R(194 + i * 4, 265 + e.br, 2, 5, 14);
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
/* a cloak hanging from his shoulders and flaring out behind him, so what shows is a bell shape each side of the body and the hem under it */
const BACK = {
  cape(k, e) {
    const { R } = k;
    for (let y = 150; y < 262; y += 2) {
      const hw = Math.round(58 + (y - 150) * 0.52);
      R(240 - hw - 1, y + e.br, hw * 2 + 2, 2, 0); R(240 - hw, y + e.br, hw * 2, 2, 5);
      R(240 - hw, y + e.br, 3, 2, 13); R(240 + hw - 3, y + e.br, 3, 2, 1);
    }
    for (let i = 0; i < 4; i++) for (let y = 170; y < 256; y += 2) { const hw = Math.round(58 + (y - 150) * 0.52); R(240 - hw + 18 + i * (hw * 2 - 36) / 3, y + e.br, 2, 2, 1); }
    R(125, 258 + e.br, 230, 5, 0); R(126, 259 + e.br, 228, 3, 12);
  }
};
const COLLAR = {
  cape(k, e) {
    const { R, B } = k;
    B(190, 210 + e.br, 100, 18, 0, 7); B(192, 212 + e.br, 96, 14, 15, 6);
    for (let i = 0; i < 7; i++) R(202 + i * 13, 216 + e.br, 4, 7, 0);
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
  /* 'neck': what is round the throat goes on after the head and BEFORE the trunk, so the trunk hangs in front of the knot and the
     collar (it used to be drawn last, over the trunk, which put the bow tie on top of it) */
  if (layer === 'neck') { if (w.body === 'cape') COLLAR.cape(k, env); const n = NECK[w.neck] || MORE.neck[w.neck]; if (w.neck && n) n(k, env); return; }
  if (layer === 'feet') { if (w.feet === 'boots') BOOTS(k, env); return; }
  if (layer === 'body') { if (w.body === 'blanket') BODY.blanket(k, env); else if (w.body && MORE.body[w.body]) MORE.body[w.body](k, env); return; }
  const f = FACE[w.face] || MORE.face[w.face], h = HEAD[w.head] || MORE.head[w.head];
  if (w.face && f) f(k, env);
  if (w.head && h) h(k, env);
}
