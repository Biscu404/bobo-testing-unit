/* Backdrops for the auto-press ladder and for the ledger (CHESHBON). */
import { AUTO_LEVELS } from './auto.js';

/* a night with a row of lit candles: one more every level, and the flames brighter */
const autoScene = n => K => {
  K.sky(0, 1, 0, 14); K.stars(10, 15, 11, 8, 3 + n); K.ground(4, 6, 14);
  const gap = Math.floor(160 / (n + 3));
  K.rep(gap, gap, (x, i) => { if (i < n + 2) { K.glow(x, 12, 10, 8, 14, 2 + n); K.candle(x, 20, 8 + (i % 2) * 2, 15, i % 3 ? 14 : 12); } });
};
export const SCENES_F = {
  /* the ledger: a shelf of account books and the tally marks on the wall behind */
  s_chesh: K => {
    K.r(0, 0, 160, 24, 6); K.d(0, 0, 160, 24, 6, 4, 4);
    K.rep(4, 20, x => { for (let k = 0; k < 4; k++) K.r(x + k * 3, 3, 1, 8, 15); K.r(x - 1, 8, 12, 1, 15); });
    K.r(0, 14, 160, 2, 4);
    K.rep(0, 10, (x, i) => { const h = 6 + (i * 5) % 4; K.r(x + 1, 14 - h, 8, h, [1, 2, 5, 4, 9, 3][i % 6]); K.r(x + 1, 14 - h, 1, h, 15); K.r(x + 1, 14 - h + 2, 8, 1, 14); });
    K.rep(5, 26, x => { K.r(x, 17, 13, 6, 15); K.r(x, 17, 13, 1, 8); K.r(x + 6, 17, 1, 6, 8); K.r(x + 2, 19, 3, 1, 8); K.r(x + 8, 19, 3, 1, 8); });
  }
};
AUTO_LEVELS.forEach((l, i) => { SCENES_F[l.id] = autoScene(i); });
