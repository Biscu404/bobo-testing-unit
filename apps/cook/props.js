/* The Cook's props: Jesse, in the four moods the bench knows, mouth shut and mouth open. */
import { prop, doc } from '../prop_kit.js';
import { drawJesse } from './jesse.js';

export const NAME = 'THE COOK';
export const FOLDER = 'CookProps';
export async function props() {
  const L = [];
  ['flat', 'shock', 'smirk', 'wince'].forEach(mood => [0, 1].forEach(talk => L.push(prop('JESSE_' + mood.toUpperCase() + (talk ? '_TALKING' : ''), 16 * 8, 20 * 8, g => drawJesse(g, 0, 0, 8, mood, talk), 1))));
  L.push(doc('README.TXT', 'THE COOK: THE PROPS\n\nJesse, as he is drawn at every bench: flat, shocked, smirking, wincing; with his mouth shut and with it open.\nOne of the few faces on this machine with a skin tone. You finished every bench.\n'));
  return L;
}
