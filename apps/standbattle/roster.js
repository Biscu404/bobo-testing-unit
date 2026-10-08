/* The roster: who can be picked, who can be fought, and each fighter's built movelist (spec 13). A roster entry is data; the movelists are char_*.js. */
import { buildMovelist } from './moves.js';
import JOTARO_ROWS from './char_jotaro.js';

export const ROSTER = {
  jotaro: { id: 'jotaro', name: 'JOTARO KUJO', short: 'JOTARO', stand: 'STAR PLATINUM', sprite: 'jotaro', playable: true, walk: { f: 1, b: 1 }, rows: JOTARO_ROWS,
    blurb: ['BRAWLER', 'BIG MIDS, STRONG THROWS', 'THE STAND HELPS WITH THE HEAVY ONES', 'FEW MOVES TRACK: HE WINS THE NEXT EXCHANGE'] }
};
export const PLAYABLE = Object.keys(ROSTER).filter(k => ROSTER[k].playable);

const built = {};
export function movelistOf(id) {
  if (!built[id]) built[id] = buildMovelist(id, ROSTER[id].rows);
  return built[id];
}
/* a fight def: the roster entry with its movelist */
export function defOf(id, extra) { return Object.assign({}, ROSTER[id], { ml: movelistOf(id) }, extra || {}); }
