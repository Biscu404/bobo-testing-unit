/* Every trophy there is, in one place: the machine's own (trophies_system*.js) and each app's own list (apps/<id>/trophies.js). The kernel only imports data. The game ids
   and names below are also what a mastery seal is made from. A new app with trophies is one import and one line in APPS. */
import { SYSTEM_A } from './trophies_system.js';
import { SYSTEM_B, META, GAMES, TOYS } from './trophies_system2.js';
import { TROPHIES as SWEEPER, backfill as sweeperBackfill } from '../apps/sweeper/trophies.js';

/* each app's backfill reader: (read(key) -> object|null, T) -> [trophy ids already earned] */
export const BACKFILL = [sweeperBackfill];
export const APPS = [
  /* [id, the name the ledger shows, its trophy list] */
  ['sweeper', 'DUNGEON SWEEPER', SWEEPER]
];
export const NAMES = { system: 'THE MACHINE', meta: 'THE LEDGER', sweeper: 'DUNGEON SWEEPER', solitaire: 'SOLITAIRE', aftere: 'AFTEREGYPT', garden: 'THE GARDEN', cook: 'THE COOK', magen: 'MAGEN',
  standbattle: 'STAND BATTLE', bekkedal: 'BEKKEDAL', bottle: 'THE BOTTLE', elephant: 'THE ELEPHANT', crayon: 'CRAYON', garage: 'THE GARAGE', hifi: 'THE STACK', notes: 'NOTES', holyc: 'HOLYC.EXE', tools: 'THE SMALL TOOLS' };

export function registerAll(T) {
  T.register('system', SYSTEM_A.concat(SYSTEM_B));
  APPS.forEach(a => T.register(a[0], a[2]));
  T.register('meta', META);
  /* a mastery for each game, and for HOLYC.EXE (a thing to be finished) */
  T.finalize(GAMES.concat(['holyc']).map(id => ({ app: id, name: NAMES[id] })));
  void TOYS;
}
