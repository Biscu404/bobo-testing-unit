/* Magen's props: the seventy-seven scenes that stand behind every row (a 160 x 24 tile, drawn once and tiled in the game) and the glyphs of its icons. */
import { prop, doc, fname } from '../prop_kit.js';
import { MG_SCENES, mgSceneTile } from './backdrops.js';
import { MG_G } from './icons.js';
import { VGA16 } from '../aftere/draw.js';

export const NAME = 'MAGEN';
export const FOLDER = 'MagenProps';
export async function props() {
  const L = [];
  MG_SCENES.forEach(id => { const cv = mgSceneTile(id); if (cv) L.push(prop('SCENE_' + fname(id), cv.width, cv.height, g => g.drawImage(cv, 0, 0), 4)); });
  Object.keys(MG_G).forEach(id => L.push(prop('ICON_' + fname(id), 26, 26, g => MG_G[id]((x, y, w, h, c) => { const p = VGA16[c] || VGA16[15]; g.fillStyle = 'rgb(' + p.join(',') + ')'; g.fillRect(x, y, w, h); }), 6)));
  L.push(doc('README.TXT', 'MAGEN: THE PROPS\n\nThe scenes that stand behind every building, upgrade and rule of the star (each is a 160 x 24 strip that the game tiles),\nand the pixel glyphs of its icons. Enlarged whole-number times, nothing smoothed.\nYou earned every trophy there is for it. These are what it was drawn with.\n'));
  return L;
}
