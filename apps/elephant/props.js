/* The Elephant's props: every thing he can wear, drawn alone on the big elephant's own canvas (so it lines up with him: lay it over his picture), and the small
   elephant who lives on the desktop in every pose, and in everything. */
import { prop, doc, fname } from '../prop_kit.js';
import { drawWear } from './wear.js';
import { drawMini, MINI_W, MINI_H } from '../../kernel/pet_art.js';
import { ELEPHANT } from '../../kernel/cos_data.js';
import { VGA16 } from '../aftere/draw.js';

export const NAME = 'THE ELEPHANT';
export const FOLDER = 'ElephantProps';
const kitOn = g => {
  const C = i => { const p = VGA16[i]; return 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')'; };
  const R = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; g.fillStyle = C(c); g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const B = (x, y, w, h, c, k) => { k = Math.min(k, Math.floor(w / 2), Math.floor(h / 2)); R(x + k, y, w - 2 * k, h, c); R(x, y + k, w, h - 2 * k, c); };
  const oval = (cx, cy, rx, ry, c) => { for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); if (w > 0) R(cx - w, cy + y, w * 2 + 1, 1, c); } };
  return { R, B, oval };
};
export async function props() {
  const L = [];
  ELEPHANT.filter(i => i.slot !== 'free').forEach(it => {
    const paint = g => { const k = kitOn(g), w = { [it.slot]: it.id }; ['back', 'feet', 'body', 'neck', 'front'].forEach(l => drawWear(l, w, k, { br: 0 })); };
    L.push(prop('WEAR_' + fname(it.name), 480, 300, paint, 3, { trim: true }));
    L.push(prop('OVERLAY_' + fname(it.name), 480, 300, paint, 1));
    L.push(prop('SMALL_WEARING_' + fname(it.name), MINI_W, MINI_H, g => drawMini(g, { pose: 'stand', t: 0.2, wear: { [it.slot]: it.id } }), 4));
  });
  ['stand', 'walk', 'sleep', 'push', 'sit', 'hop'].forEach(pose => L.push(prop('SMALL_' + pose.toUpperCase(), MINI_W, MINI_H, g => drawMini(g, { pose: pose, t: 0.4, wear: {} }), 4)));
  L.push(doc('README.TXT', 'THE ELEPHANT: THE PROPS\n\nWEAR_*.PNG is each thing he can wear, alone and cropped, enlarged three times. OVERLAY_*.PNG is the same thing on a 480 x 300 sheet the size of his window, so that it sits where it sits on him.\nSMALL_*.PNG is the one who walks the desktop: every pose, and in everything, enlarged four times.\nYou own everything Dave sells for him to wear, and he has heard everything he has to say.\n'));
  return L;
}
