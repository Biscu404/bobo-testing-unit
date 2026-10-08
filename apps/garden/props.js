/* The Garden's props: every kind of plant at every stage of growing, every pot, the sun token. */
import { prop, doc, fname } from '../prop_kit.js';
import { drawPlant, drawPot, drawSunToken } from './art.js';
import { SPECIES, POTS } from '../../kernel/cos_data.js';

export const NAME = 'THE GARDEN';
export const FOLDER = 'GardenProps';
export async function props() {
  const L = [];
  SPECIES.forEach(sp => [1, 2, 3].forEach(stage => L.push(prop('PLANT_' + fname(sp.name) + '_STAGE_' + stage, 40, 50, g => drawPlant(g, 20, 48, sp, stage, 0, 1.4, 0, false), 4))));
  POTS.forEach(pot => L.push(prop('POT_' + fname(pot.name), 60, 44, g => drawPot(g, 4, 6, pot, 1.2, 1), 4)));
  L.push(prop('SUN_TOKEN', 12, 12, g => drawSunToken(g, 0, 2, 10), 8));
  L.push(doc('README.TXT', 'THE GARDEN: THE PROPS\n\nEvery plant at its three sizes, every pot and the sun token, enlarged four times (the token eight), nothing smoothed.\nYou grew every kind there is to full size. These are the portraits.\n'));
  return L;
}
