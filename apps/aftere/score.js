/* AfterEgypt's music: a title tune, a tune for each of the five ways, and three stingers, all for the studio's real instruments.
 *
 *   title      NILE DAWN          plays while you choose a way
 *   pilgrim    FIRST LIGHT        sparse, hopeful, hijaz at 92: the whole flight is one pass of eight bars
 *   scribe     PAPYRUS            nahawand at 104: a violin and an oud, the first tune with a drum that means it
 *   priest     THE ZAR            phrygian in six-eight at 120: a chant, a drone, a rattle that does not stop
 *   pharaoh    KING OF THE DUNES  hijaz at 124: a trumpet, strings pushing on every eighth, the wind
 *   temple     THE THIRD TEMPLE   double harmonic at 148, in three, three and two, in thirty-two bars: all of it at once
 *
 * Each way is a core that is a tune on its own and layers the run switches on and off while it plays (music.js, danger.js):
 * `build` as the temple gets nearer, `edge` close to the stone, `swarm` when the locusts are out, `gust` in the wind, `gate` at the end.
 * Which layers a way has is LAYERS_OF: the ones the sim can ask for there. The stingers are `sting('clear' | 'unlock' | 'death')`.
 * Everything is on D, so any of them may fall in under any other. See tunes.js, band_early.js, band_late.js, stingers.js.
 */
import { memo } from '../scorekit.js';
import { EARLY } from './band_early.js';
import { LATE } from './band_late.js';
import { STINGERS, secsOf } from './stingers.js';
import { TUNES } from './tunes.js';

export const IDS = ['title', 'pilgrim', 'scribe', 'priest', 'pharaoh', 'temple'];
export const WAYS = IDS.slice(1);
export const NAMES = { title: 'NILE DAWN', pilgrim: 'FIRST LIGHT', scribe: 'PAPYRUS', priest: 'THE ZAR', pharaoh: 'KING OF THE DUNES', temple: 'THE THIRD TEMPLE' };
export const LAYERS = ['build', 'edge', 'swarm', 'gust', 'gate'];
export const LAYERS_OF = {
  title: [], pilgrim: ['build', 'edge'], scribe: ['build', 'edge'], priest: ['build', 'edge', 'swarm'],
  pharaoh: ['build', 'edge', 'swarm', 'gust', 'gate'], temple: ['build', 'edge', 'swarm', 'gust', 'gate']
};
export const STINGS = ['clear', 'unlock', 'death'];
/* TheStack presses a way with its arrangement filled in and nothing situational (no wind, no locusts, no stone) */
export const DISC_LAYERS = { build: true, edge: false, swarm: false, gust: false, gate: false };

const make = memo((L, id) => (EARLY[id] || LATE[id])(L));
const makeSting = memo((L, id) => STINGERS[id](L));
export const song = (L, id) => make(L, id);
export const sting = (L, id) => makeSting(L, id);
export { TUNES, secsOf };
/* seconds one pass of a tune lasts */
export const passSecs = id => TUNES[id].melody.length * TUNES[id].beats * 60 / TUNES[id].bpm;
