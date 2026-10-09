/* The roster: who can be picked, who can be fought, and each fighter's built movelist (spec 13). A roster entry is data; the movelists are char_*.js. */
import { buildMovelist } from './moves.js';
import JOTARO_ROWS from './char_jotaro.js';
import KIRA_ROWS from './char_kira.js';
import DELINQUENT_ROWS from './char_delinquent.js';
import ANGELO_ROWS from './char_angelo.js';
import POLNAREFF_ROWS from './char_polnareff.js';
import BOSS_ROWS from './char_boss.js';

export const ROSTER = {
  jotaro: { id: 'jotaro', name: 'JOTARO KUJO', short: 'JOTARO', stand: 'STAR PLATINUM', sprite: 'jotaro', playable: true, walk: { f: 1, b: 1 }, rows: JOTARO_ROWS,
    blurb: ['BRAWLER', 'BIG MIDS AND STRONG THROWS', 'THE STAND HELPS WITH THE HEAVY ONES', 'FEW MOVES TRACK: HE WINS THE NEXT EXCHANGE'] },
  kira: { id: 'kira', name: 'YOSHIKAGE KIRA', short: 'KIRA', stand: 'KILLER QUEEN', sprite: 'kira', playable: true, walk: { f: 1.05, b: 1.05 }, rows: KIRA_ROWS,
    blurb: ['TRICKSTER', 'THE BEST LOWS IN THE GAME', 'TOUCH MARKS A BOMB, DETONATE BLOWS IT', 'HE WINS WHEN YOU GUESS WRONG'] },
  delinquent: { id: 'delinquent', name: 'MORIOH DELINQUENT', short: 'DELINQUENT', stand: 'NONE: JUST A BAD ATTITUDE', sprite: 'delinquent', playable: true, walk: { f: 1.1, b: 1 }, rows: DELINQUENT_ROWS,
    blurb: ['RUSHDOWN', 'FAST POKES AND A HARD LOW', 'A HEADBUTT FROM NOWHERE', 'EASY TO LEARN, EASY TO GUARD ONCE READ'] },
  angelo: { id: 'angelo', name: 'ANGELO', short: 'ANGELO', stand: 'AQUA NECKLACE', sprite: 'angelo', playable: true, walk: { f: 0.95, b: 1 }, rows: ANGELO_ROWS,
    blurb: ['ZONER', 'LONG LIMBS, THROWN ROCKS', 'A GRAB THAT STARTS YOU DROWNING', 'HE WANTS YOU AT THE END OF HIS ARMS'] },
  polnareff: { id: 'polnareff', name: 'JEAN PIERRE POLNAREFF', short: 'POLNAREFF', stand: 'SILVER CHARIOT', sprite: 'polnareff', playable: true, walk: { f: 1.1, b: 1.1 }, rows: POLNAREFF_ROWS,
    blurb: ['FENCER', 'THE LONGEST REACH, THE FASTEST POKES', 'THRUSTS THAT FOLLOW A SIDESTEP', 'LOW DAMAGE: HE WINS AT THE TIP OF THE BLADE'] },
  boss: { id: 'boss', name: 'KILLER QUEEN', short: 'KILLER QUEEN', stand: 'BITES THE DUST', sprite: 'kira', portrait: 'kira', boss: true, playable: false, walk: { f: 1, b: 1 }, rows: BOSS_ROWS,
    blurb: ['THE BOSS', 'KIRA, WITH NOTHING LEFT TO HIDE', 'SHEER HEART ATTACK FOLLOWS YOUR LANE', 'BITES THE DUST GIVES A HIT BACK'] }
};
export const PLAYABLE = Object.keys(ROSTER).filter(k => ROSTER[k].playable);

const built = {};
export function movelistOf(id) {
  if (!built[id]) built[id] = buildMovelist(id, ROSTER[id].rows);
  return built[id];
}
/* a fight def: the roster entry with its movelist */
export function defOf(id, extra) { return Object.assign({}, ROSTER[id], { ml: movelistOf(id) }, extra || {}); }
