/* Drawing kit for the blackout's hallucinations: the sixteen colours, a
   3x5 pixel font, falling snow, and a seeded random, so a scene is a function
   of the time and nothing else. Everything is flat rects on a 320x180 canvas
   that is scaled up without smoothing. */
import { VGA16 } from './god.js';

export const W = 320, H = 180;
export const PAL = VGA16.map(p => 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')');
export const K = { black: 0, blue: 1, green: 2, cyan: 3, red: 4, magenta: 5, brown: 6, grey: 7, dgrey: 8, lblue: 9, lgreen: 10, lcyan: 11, lred: 12, lmagenta: 13, yellow: 14, white: 15 };

export function seeded(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 3 columns x 5 rows, row by row */
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000', '!': '010010010000010',
  '?': '110001010000010', '#': '101111101111101', '>': '100010001010100', '<': '001010100010001', '/': '001001010100100',
  '(': '010100100100010', ')': '010001001001010', '%': '101001010100101', '+': '000010111010000', '=': '000111000111000',
  ',': '000000000010100', "'": '010010000000000', _: '000000000000111', '[': '110100100100110', ']': '011001001001011',
  '~': '000011110000000', '$': '011110011101110', '*': '101010111010101', ' ': '000000000000000'
};

export function pen(g) {
  const R = (x, y, w, h, c) => { g.fillStyle = PAL[c & 15]; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  /* text, scale = whole pixels per font pixel; returns the width it took */
  const T = (s, x, y, c, sc) => {
    sc = sc || 1;
    let cx = x;
    String(s).toUpperCase().split('').forEach(ch => {
      const gl = FONT[ch] || FONT['?'];
      for (let i = 0; i < 15; i++) if (gl.charAt(i) === '1') R(cx + (i % 3) * sc, y + Math.floor(i / 3) * sc, sc, sc, c);
      cx += 4 * sc;
    });
    return cx - x;
  };
  const circle = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, w * 2 + 1, 1, c); } };
  return { R, T, circle };
}

/* snow: `n` flakes, each with its own column, speed and sway, a pure function of t */
export function snow(R, t, n, seed, wind, big) {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 14 + r() * 40, ph = r() * 6.28, sz = r() < (big || 0.15) ? 2 : 1;
    const x = (x0 + Math.sin(t * 1.3 + ph) * 6 + (wind || 0) * t) % W, y = (r() * H + sp * t) % H;
    R((x + W) % W, y, sz, sz, r() < 0.75 ? 15 : 7);
  }
}
