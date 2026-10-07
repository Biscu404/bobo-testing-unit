/* Bekkedal — what somebody has been given, as it is seen on them.
 *
 * `person()` (actors.js) draws the body; this draws the few pixels that make one body somebody who was given a scarf: a
 * wool scarf round the neck, a stone on a thong, a cup in the hand, a bunch of flowers, a basket, a fish held by the tail.
 * Small on purpose: a person is thirteen pixels wide, and a gift that is bigger than their hand is a joke, not a gift.
 *
 * What is drawn and when is `looks.js`'s question; here is only how. Source-space, drawn inside the playfield's art
 * transform like everything in actors.js, through `GG()` and `C()` for the same reasons (see actors.js's header).
 */
import { TIM, STO, SAN, SNO, WAT, GRASS, WAR } from './palette.js';

export function createLooks(GG, C) {
  const R = (col, x, y, w, h) => { GG().fillStyle = C(col); GG().fillRect(x, y, w, h); };

  /* worn: over the shirt and under the hands and head, so it is on at every angle */
  const WORN = {
    scarf(px, y) {
      R(SNO[0], px + 2, y + 7, 9, 2);                      /* round the neck */
      R(SNO[1], px + 2, y + 7, 9, 1);
      R(SNO[0], px + 8, y + 9, 2, 4);                      /* and the end that hangs */
      R(STO[3], px + 8, y + 12, 2, 1);
    },
    pendant(px, y, tint) {
      R(STO[0], px + 6, y + 8, 1, 2);                      /* the thong */
      R(tint == null ? WAT[5] : tint, px + 5, y + 10, 3, 3);
      R(SNO[1], px + 5, y + 10, 1, 1);                     /* and the one point where it catches the light */
    }
  };

  /* held: in the near hand. (hx, hy) is where the hand is; `left` says it is the left of the picture */
  const HELD = {
    cup(hx, hy, left, t) { R(SNO[1], hx, hy - 3, 4, 4); R(WAR[2], hx + 1, hy - 3, 2, 1); R(STO[3], left ? hx - 1 : hx + 4, hy - 2, 1, 2);
      if (((t * 2) | 0) % 2) R(SNO[0], hx + 1, hy - 5, 1, 1); else R(SNO[0], hx + 2, hy - 6, 1, 1); },        /* steam */
    bouquet(hx, hy) { R(GRASS[2], hx + 1, hy - 1, 1, 5); R(WAR[3], hx - 1, hy - 4, 5, 3); R(SNO[1], hx + 1, hy - 3, 1, 1); R(WAR[2], hx, hy - 5, 1, 1); },
    bite(hx, hy) { R(TIM[4], hx, hy - 2, 5, 3); R(TIM[3], hx, hy, 5, 1); R(SNO[0], hx + 1, hy - 2, 1, 1); },
    basket(hx, hy) { R(TIM[3], hx - 1, hy - 1, 7, 3); R(TIM[1], hx - 1, hy + 1, 7, 1); R(WAR[2], hx, hy - 3, 2, 2); R(WAR[3], hx + 3, hy - 3, 2, 2); },
    jug(hx, hy) { R(SNO[1], hx, hy - 4, 3, 5); R(WAT[4], hx, hy - 4, 3, 1); R(STO[3], hx + 3, hy - 3, 1, 2); },
    bowl(hx, hy) { R(STO[3], hx - 1, hy - 1, 6, 2); R(TIM[4], hx, hy - 2, 4, 1); },
    fish(hx, hy, left) { R(STO[4], hx - 1, hy - 1, 7, 2); R(SNO[0], hx - 1, hy - 1, 7, 1); R(STO[3], left ? hx + 6 : hx - 3, hy - 2, 2, 4); },
    coil(hx, hy) { R(TIM[4], hx, hy - 3, 5, 4); R(TIM[1], hx + 1, hy - 2, 3, 2); },
    plank(hx, hy) { R(TIM[3], hx - 3, hy - 2, 10, 2); R(TIM[4], hx - 3, hy - 2, 10, 1); },
    nails(hx, hy) { R(STO[4], hx, hy - 2, 1, 3); R(STO[4], hx + 2, hy - 2, 1, 3); R(STO[3], hx + 4, hy - 2, 1, 3); },
    stone(hx, hy) { R(STO[3], hx, hy - 2, 4, 3); R(STO[4], hx, hy - 2, 4, 1); },
    lamp(hx, hy) { R(STO[3], hx + 1, hy - 4, 2, 1); R(WAR[3], hx, hy - 3, 4, 4); R(SNO[1], hx + 1, hy - 2, 2, 2); }
  };

  /* the pieces a body wears, then what a hand carries; either may be missing */
  function worn(look, px, y) {
    if (!look || !look.wear) return;
    look.wear.forEach(w => { if (WORN[w.glyph]) WORN[w.glyph](px, y, w.tint); });
  }
  function carried(look, px, y, dir, t) {
    if (!look || !look.hold || !HELD[look.hold]) return;
    const left = dir === 2;
    const hx = left ? px - 4 : px + (dir === 1 ? -3 : 12), hy = y + 12;
    HELD[look.hold](dir === 1 ? px - 3 : hx, hy, left || dir === 1, t || 0);
  }
  return { worn, carried, glyphs: Object.keys(HELD).concat(Object.keys(WORN)) };
}
