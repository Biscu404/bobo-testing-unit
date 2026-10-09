/* The Bottle's props: every bottle on Dave's shelf, glass and label, as the game builds it from three colours. */
import { prop, doc, fname } from '../prop_kit.js';
import { makeArt, BOT } from './art.js';
import { paletteOf } from './drinks.js';
import { DRINKS } from '../../kernel/cos_data.js';

export const NAME = 'THE BOTTLE';
export const FOLDER = 'BottleProps';
export async function props() {
  const L = [];
  DRINKS.forEach(d => {
    const pal = paletteOf(d);
    L.push(prop('BOTTLE_' + fname(d.name), 120, 260, g => {
      const A = makeArt(g, pal), s = A.bottleSpec;
      /* the bottle's own origin is the middle of its base (art.js, BOT): that goes to the middle of the foot of the picture, so a tall bottle is whole and a short one stands on the ground
         (it used to be moved by the sprite's centre as well, which put all but the top of a tall bottle below the picture and the whole of a short one) */
      g.save(); g.translate(60 - BOT.ox, 254 - BOT.oy);
      if (s.base) s.base(g);
      if (s.over && s.over[0]) s.over[0](g);
      g.restore();
    }, 4, { trim: true }));
  });
  L.push(doc('README.TXT', 'THE BOTTLE: THE PROPS\n\nEvery bottle Dave sells, built from its three colours the way the game builds it, enlarged four times.\nYou drank a measure of each. They are the ones you remember.\n'));
  return L;
}
