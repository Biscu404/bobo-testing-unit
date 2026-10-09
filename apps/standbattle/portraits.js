/* Small painted busts of every fighter, in the fighter's own ramps (the HUD's life bars, the character select, the versus screen). One rig of polygons per
   fighter at 26 px; `size` scales the whole bust by whole pixels' worth of the same shapes through the context transform, so a big one is the same picture. */

import { px, poly } from './draw.js';
import { JOTARO, THUG, ANGELO, KQ, POLNAREFF, S, SH, BASE, LT, RIM } from './palette.js';

function bust(g, cx, cy, who) {
  if (who === 'jotaro') {
    poly(g, [[cx - 7, cy + 10], [cx - 9, cy + 2], [cx + 9, cy + 2], [cx + 7, cy + 10]], JOTARO.coat[BASE]);
    poly(g, [[cx - 5, cy + 4], [cx + 5, cy + 4], [cx + 4, cy - 5], [cx - 4, cy - 5]], JOTARO.skin[BASE]);
    poly(g, [[cx - 5, cy - 2], [cx + 5, cy - 2], [cx + 5, cy - 8], [cx - 5, cy - 8]], JOTARO.hair[BASE]);
    poly(g, [[cx - 7, cy - 6], [cx + 7, cy - 7], [cx + 6, cy - 11], [cx - 6, cy - 10]], JOTARO.coat[SH]);
    poly(g, [[cx + 4, cy - 7], [cx + 10, cy - 6], [cx + 10, cy - 4], [cx + 4, cy - 4]], JOTARO.coat[S]);
    px(g, cx - 3, cy - 1, 2, 2, '#12324A'); px(g, cx + 2, cy - 1, 2, 2, '#12324A');
  } else if (who === 'kira' || who === 'killer_queen') {
    poly(g, [[cx - 8, cy + 10], [cx - 7, cy - 2], [cx + 7, cy - 2], [cx + 8, cy + 10]], KQ.pink[BASE]);
    poly(g, [[cx - 6, cy + 1], [cx + 6, cy + 1], [cx + 5, cy - 9], [cx - 5, cy - 9]], KQ.pink[LT]);
    poly(g, [[cx - 6, cy - 3], [cx + 6, cy - 3], [cx + 5, cy - 10], [cx - 5, cy - 10]], KQ.black[BASE]);
    px(g, cx - 4, cy - 6, 3, 2, KQ.gold[BASE]); px(g, cx + 2, cy - 6, 3, 2, KQ.gold[BASE]);
    poly(g, [[cx - 1, cy - 10], [cx + 1, cy - 15], [cx + 3, cy - 10]], KQ.black[BASE]);
  } else if (who === 'polnareff') {
    const P = POLNAREFF;
    poly(g, [[cx - 8, cy + 10], [cx - 8, cy + 1], [cx + 8, cy + 1], [cx + 8, cy + 10]], P.vest[BASE]);
    poly(g, [[cx - 3, cy + 10], [cx - 3, cy + 1], [cx + 3, cy + 1], [cx + 3, cy + 10]], P.shirt[BASE]);
    poly(g, [[cx - 5, cy + 3], [cx + 5, cy + 3], [cx + 4, cy - 6], [cx - 4, cy - 6]], P.skin[BASE]);
    poly(g, [[cx - 5, cy - 4], [cx - 5, cy - 14], [cx + 1, cy - 17], [cx + 6, cy - 14], [cx + 5, cy - 4], [cx + 2, cy - 6], [cx - 2, cy - 6]], P.hair[BASE]);
    poly(g, [[cx - 3, cy - 13], [cx + 1, cy - 16], [cx + 4, cy - 13], [cx, cy - 12]], P.hair[RIM]);
    px(g, cx - 3, cy - 2, 2, 2, '#2A5A74'); px(g, cx + 2, cy - 2, 2, 2, '#2A5A74');
  } else {
    const P = who === 'angelo' ? ANGELO : THUG;
    const cloth = who === 'angelo' ? P.coat : P.jacket;
    poly(g, [[cx - 8, cy + 10], [cx - 8, cy + 1], [cx + 8, cy + 1], [cx + 8, cy + 10]], cloth[BASE]);
    poly(g, [[cx - 5, cy + 3], [cx + 5, cy + 3], [cx + 4, cy - 6], [cx - 4, cy - 6]], P.skin[BASE]);
    poly(g, who === 'angelo'
      ? [[cx - 6, cy - 3], [cx + 6, cy - 4], [cx + 5, cy - 10], [cx - 5, cy - 9]]
      : [[cx - 6, cy - 4], [cx - 3, cy - 12], [cx + 5, cy - 11], [cx + 6, cy - 4]], P.hair[BASE]);
    px(g, cx - 3, cy - 2, 2, 2, who === 'angelo' ? ANGELO.eye[BASE] : '#3A2A10');
    px(g, cx + 2, cy - 2, 2, 2, who === 'angelo' ? ANGELO.eye[BASE] : '#3A2A10');
  }
}

/* x, y: the top left of the frame; size: 26 is the HUD's, bigger is scaled up */
export function portrait(g, x, y, size, who, opts) {
  const o = opts || {};
  px(g, x - 2, y - 2, size + 4, size + 4, '#05060C');
  px(g, x - 1, y - 1, size + 2, size + 2, o.frame || '#6A7396');
  px(g, x, y, size, size, o.back || '#161A2C');
  g.save();
  g.beginPath(); g.rect(x, y, size, size); g.clip();
  const k = size / 26;
  g.translate(x + size / 2, y + size / 2 + 2 * k);
  g.scale(k, k);
  bust(g, 0, 0, who);
  g.restore();
}
