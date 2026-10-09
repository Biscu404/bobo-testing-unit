/* How a goose gets onto a picture (Thea's present). Every place that has one asks here, so the goose in the elephant's pool, the one over Dave's head and the one that crosses the Garden's
   sky are the same bird: the frames are goose_frames.js, grids of hex digits in the machine's sixteen colours, all facing right. `drawGoose` takes a painter `R(x, y, w, h, colourDigit)` (the
   caller turns the digit into whatever its picture is made of: the elephant's VGA16, Bekkedal's ramps, Stand Battle's night), the bird's bottom-centre, a whole-number scale and whether it
   faces left. Pure but for the painter; node scripts/check-geese.mjs holds the frames. */
import * as F from './goose_frames.js';

export const FRAMES = {
  swim: F.SWIM, honk: F.SWIM_HONK, dabble: F.DABBLE,                    /* afloat: head up, head up and honking, head down with the tail in the air */
  up: F.FLY_UP, mid: F.FLY_MID, down: F.FLY_DOWN,                        /* flying: the wing's three places */
  sit: F.SIT, sitHonk: F.SIT_HONK,                                       /* on somebody's head */
  swimS: F.SWIM_S, honkS: F.HONK_S, dabbleS: F.DABBLE_S                  /* the small ones, about the size of a hen */
};
export const FAMILIES = {
  swim: ['swim', 'honk', 'dabble'], fly: ['up', 'mid', 'down'], sit: ['sit', 'sitHonk'], small: ['swimS', 'honkS', 'dabbleS']
};
/* the sixteen as CSS, for a painter that fills a canvas directly */
export const PAL16 = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA', '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
export const sizeOf = name => { const f = FRAMES[name]; return [f[0].length, f.length]; };

const memo = {};
/* a frame as runs of one colour along each row, [x, y, length, colour digit], turned round if `flip` */
export function runs(name, flip) {
  const key = name + (flip ? '<' : '>');
  if (memo[key]) return memo[key];
  const out = [];
  FRAMES[name].forEach((row, j) => {
    const r = flip ? row.split('').reverse().join('') : row;
    let i = 0;
    while (i < r.length) {
      const ch = r[i];
      if (ch === '.') { i++; continue; }
      let k = i + 1;
      while (k < r.length && r[k] === ch) k++;
      out.push([i, j, k - i, parseInt(ch, 16)]);
      i = k;
    }
  });
  return (memo[key] = out);
}

/* the goose `name` with the middle of its underside at (cx, by), each pixel of it `s` of yours (whole numbers: nothing here is smoothed) */
export function drawGoose(R, cx, by, name, s = 1, flip = false) {
  const [w, h] = sizeOf(name), x0 = Math.round(cx - (w * s) / 2), y0 = Math.round(by - h * s);
  runs(name, flip).forEach(([i, j, len, c]) => R(x0 + i * s, y0 + j * s, len * s, s, c));
}
/* the box a goose fills, [left, top, right, bottom], for whoever has to keep it on a surface or off an icon */
export function boxOf(cx, by, name, s = 1) {
  const [w, h] = sizeOf(name);
  return [Math.round(cx - (w * s) / 2), Math.round(by - h * s), Math.round(cx + (w * s) / 2), Math.round(by)];
}

/* where the wing is, a flap being a number that goes round 0..1: up, level, down, level */
const BEAT = ['up', 'mid', 'down', 'mid'];
export const flapFrame = ph => BEAT[Math.floor((((ph % 1) + 1) % 1) * 4)];
