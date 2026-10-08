/* Dungeon Sweeper's props: the masks, the soul, geo, the bench, the skull, the shade, the notches, every charm and the nine rooms' backdrops. */
import { prop, doc, canvas, fname } from '../prop_kit.js';
import { makeGfx } from './gfx.js';
import { backdrop, mask, vessel, geo, bench, skull, shade, notch, charmIcon } from './art.js';
import { REGIONS, CHARMS } from './data.js';

export const NAME = 'DUNGEON SWEEPER';
export const FOLDER = 'SweeperProps';

/* every art function draws onto a 960 x 640 sheet through makeGfx; a sprite is drawn near the corner of one and copied out */
function sprite(w, h, k, fn) {
  return g => { const [cv] = canvas(960, 640), G = makeGfx(cv); fn(G); g.drawImage(cv, 0, 0, w, h, 0, 0, w, h); void k; };
}
export async function props() {
  const L = [];
  [['full', 'MASK_FULL'], ['empty', 'MASK_EMPTY'], ['blue', 'MASK_LIFEBLOOD']].forEach(([kind, n]) => L.push(prop(n, 80, 64, sprite(80, 64, 1, G => mask(G, 0, 0, 8, kind)), 1)));
  [[0, 'SOUL_EMPTY'], [0.5, 'SOUL_HALF'], [1, 'SOUL_FULL']].forEach(([f, n]) => L.push(prop(n, 56, 56, sprite(56, 56, 1, G => vessel(G, 28, 28, 26, f, 0)), 3)));
  L.push(prop('GEO', 60, 60, sprite(60, 60, 1, G => geo(G, 0, 0, 10)), 2));
  L.push(prop('BENCH', 120, 60, sprite(120, 60, 1, G => bench(G, 0, 0, 10, '#e6dcc0')), 2));
  L.push(prop('SKULL', 80, 70, sprite(80, 70, 1, G => skull(G, 0, 0, 10, '#e6dcc0')), 2));
  L.push(prop('SHADE', 80, 70, sprite(80, 70, 1, G => shade(G, 0, 0, 10, '#9bb0ff')), 2));
  L.push(prop('NOTCH_ON', 40, 40, sprite(40, 40, 1, G => notch(G, 0, 0, 10, true)), 2));
  L.push(prop('NOTCH_OFF', 40, 40, sprite(40, 40, 1, G => notch(G, 0, 0, 10, false)), 2));
  CHARMS.forEach(c => L.push(prop('CHARM_' + fname(c.name), 64, 64, sprite(64, 64, 1, G => charmIcon(G, 0, 0, 8, c.id, true)), 2)));
  REGIONS.forEach(rg => L.push(prop('ROOM_' + fname(rg.name), 960, 640, sprite(960, 640, 1, G => backdrop(G, rg)), 1)));
  L.push(doc('README.TXT', 'DUNGEON SWEEPER: THE PROPS\n\nEvery picture the game is built from, as a file: the masks, the soul vessel, geo, the bench, the skull,\nthe shade, the notches, every charm and the backdrop of every region of the descent and the Underdeep.\nThe small ones are enlarged whole-number times, nothing smoothed. Use them anywhere.\n\nYou finished the whole of it. Here is the bench it was drawn at.\n'));
  return L;
}
