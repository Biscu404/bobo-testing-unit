/* Bekkedal's props: the eight people of the valley, each in the three faces the conversation box knows (neutral, warm, troubled). */
import { prop, doc, fname } from '../prop_kit.js';
import { createPortrait, PORT_MOODS } from './portrait.js';
import { BEK_NPCS } from './data.js';
import { DAY_CSS } from './light.js';
import { DLG_PORT_W, DLG_PORT_H } from './layout.js';

export const NAME = 'BEKKEDAL';
export const FOLDER = 'BekkedalProps';
export async function props() {
  const L = [];
  BEK_NPCS.forEach(npc => PORT_MOODS.forEach(mood => {
    if (!npc.face) return;
    L.push(prop(fname(npc.n || npc.id) + '_' + mood.toUpperCase(), DLG_PORT_W, DLG_PORT_H, g => {
      const { portrait } = createPortrait(() => g, i => DAY_CSS[i], () => {}, 2);
      g.fillStyle = DAY_CSS[0]; g.fillRect(0, 0, DLG_PORT_W, DLG_PORT_H);
      portrait(npc, mood, 0, 0, DLG_PORT_W, DLG_PORT_H);
    }, 3));
  }));
  L.push(doc('README.TXT', 'BEKKEDAL: THE PROPS\n\nThe people of the valley, each in the three faces the game gives them when they talk to you, enlarged three times.\nYou finished the storehouse and you earned every trophy there is. You know every one of them by now.\n'));
  return L;
}
