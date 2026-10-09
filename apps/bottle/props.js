/* The Bottle's props: every bottle on Dave's shelf, glass and label, as the game builds it from three colours. */
import { prop, doc, fname } from '../prop_kit.js';
import { makeArt } from './art.js';
import { paletteOf } from './drinks.js';
import { DRINKS } from '../../kernel/cos_data.js';

export const NAME = 'THE BOTTLE';
export const FOLDER = 'BottleProps';
export async function props() {
  const L = [];
  DRINKS.forEach(d => {
    const pal = paletteOf(d);
    /* the sprite is 80 x 246 and draws itself from its own origin (art.js BOT: 40, 242), so it is put on a sheet that holds all of it: a shorter bottle (the squat one, the flask)
       used to land below the bottom of a 140 x 220 sheet and the picture was blank */
    L.push(prop('BOTTLE_' + fname(d.name), 100, 250, g => {
      const A = makeArt(g, pal), s = A.bottleSpec;
      g.save(); g.translate(10, 2);
      if (s.base) s.base(g);
      if (s.over && s.over[0]) s.over[0](g);
      g.restore();
    }, 4, { trim: true }));
  });
  L.push(doc('README.TXT', 'THE BOTTLE: THE PROPS\n\nEvery bottle Dave sells, built from its three colours the way the game builds it, enlarged three times.\nYou drank a measure of each. They are the ones you remember.\n'));
  return L;
}
