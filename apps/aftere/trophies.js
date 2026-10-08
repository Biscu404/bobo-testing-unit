/* AfterEgypt's trophies (docs/achievements/games-1.md). Data only; the calls are in trophy_calls.js. Events: run-end { way, won, hits, coins, coinsSpawned, grazes, ankhs, cause, pct, secs,
   vhold, phos }, shield (an ankh took a blow), ankh2 (two carried at once), wind10 (the tenth doorway passed under a gust). Stat chain (ways cleared in order), set causes. */
import { t, rule } from '../trophy_kit.js';
const on = rule.on;
const won = way => p => p.won && p.way === way;
const wonFrom = (...ways) => p => p.won && ways.indexOf(p.way) >= 0;
const NOT_PILGRIM = ['scribe', 'priest', 'pharaoh', 'temple'], FROM_PRIEST = ['priest', 'pharaoh', 'temple'];

export const TROPHIES = [
  t('ae_pilgrim', 'THE FIRST PILGRIMAGE', 'B', 'P', 'Clear PILGRIM.', on('run-end', won('pilgrim'))),
  t('ae_scribe', "THE SCRIBE'S WAY", 'B', 'P', 'Clear SCRIBE.', on('run-end', won('scribe'))),
  t('ae_priest', "THE PRIEST'S WAY", 'S', 'P', 'Clear PRIEST.', on('run-end', won('priest'))),
  t('ae_pharaoh', "THE PHARAOH'S WAY", 'S', 'P', 'Clear PHARAOH.', on('run-end', won('pharaoh'))),
  t('ae_temple', 'THE THIRD TEMPLE', 'G', 'P', 'Clear THE THIRD TEMPLE.', on('run-end', won('temple'))),
  t('ae_half', 'HALFWAY HOME', 'B', 'P', 'Get halfway across THE THIRD TEMPLE.', on('run-end', p => p.way === 'temple' && p.pct >= 50)),
  t('ae_near', 'WITHIN SIGHT', 'S', 'P', 'Get 90% of the way across THE THIRD TEMPLE.', on('run-end', p => p.way === 'temple' && p.pct >= 90)),
  t('ae_f_scribe', 'CLEAN HANDS', 'B', 'S', 'Clear SCRIBE without being hit.', on('run-end', p => won('scribe')(p) && p.hits === 0), { scope: 'run' }),
  t('ae_f_priest', 'CLEAN HEART', 'S', 'S', 'Clear PRIEST without being hit.', on('run-end', p => won('priest')(p) && p.hits === 0), { scope: 'run' }),
  t('ae_f_pharaoh', 'UNTOUCHED BY THE WIND', 'S', 'S', 'Clear PHARAOH without being hit.', on('run-end', p => won('pharaoh')(p) && p.hits === 0), { scope: 'run' }),
  t('ae_f_temple', 'A PERFECT TEMPLE', 'G', 'S', 'Clear THE THIRD TEMPLE without being hit.', on('run-end', p => won('temple')(p) && p.hits === 0), { scope: 'run' }),
  t('ae_graze20', 'CLOSE SHAVE', 'S', 'S', 'Graze twenty pillars (pass within 6 pixels of the stone) in one clear of SCRIBE or higher.', on('run-end', p => wonFrom(...NOT_PILGRIM)(p) && p.grazes >= 20), { scope: 'run' }),
  t('ae_graze50', "RAZOR'S EDGE", 'G', 'S', 'Graze fifty pillars in one clear of PRIEST or higher.', on('run-end', p => wonFrom(...FROM_PRIEST)(p) && p.grazes >= 50), { scope: 'run' }),
  t('ae_purse', 'THE WHOLE PURSE', 'G', 'S', 'Clear SCRIBE or higher having taken every coin that was put in the sky.', on('run-end', p => wonFrom(...NOT_PILGRIM)(p) && p.coinsSpawned > 0 && p.coins === p.coinsSpawned), { scope: 'run' }),
  t('ae_ascetic', 'ASCETIC', 'G', 'S', 'Clear PRIEST or higher taking no coin and no ankh.', on('run-end', p => wonFrom(...FROM_PRIEST)(p) && p.coins === 0 && p.ankhs === 0), { scope: 'run' }),
  t('ae_wind', 'AGAINST THE WIND', 'S', 'S', 'Pass ten doorways in one run while a gust is pushing.', on('wind10'), { scope: 'run' }),
  t('ae_five', 'PILGRIMAGE', 'G', 'S', 'Clear all five ways in order, with no failed run between.', rule.stat('chain', 5)),
  t('ae_ankh', 'NOT YET', 'B', 'E', 'Let an ankh take a blow for you.', on('shield')),
  t('ae_ankh2', 'A SPARE AND A SPARE', 'B', 'E', 'Carry two ankhs at once.', on('ankh2')),
  t('ae_down', 'TWO WAYS DOWN', 'B', 'E', 'End one run on a pillar and another on a locust.', rule.sets('causes', 2)),
  t('ae_roll', 'ROLLING PILGRIM', 'S', 'C', 'Clear PILGRIM with VHLD off centre, so the picture rolls the whole way.', on('run-end', p => won('pilgrim')(p) && p.vhold), { scope: 'run' }),
  t('ae_ghost', 'GHOST SHIP', 'S', 'C', 'Clear PHARAOH or higher with PHOS on P7 the whole way.', on('run-end', p => wonFrom('pharaoh', 'temple')(p) && p.phos), { scope: 'run' }),
  t('ae_advert', 'MISSED THE ADVERT', 'B', 'J', 'Lose a run in the first five seconds.', on('run-end', p => !p.won && p.secs < 5))
];

/* the progress a pilgrim has already saved: which ways are cleared and how far the temple was got */
export function backfill(read) {
  const pr = read('app_aftere_prog'), ids = [];
  if (!pr || !pr.cleared) return ids;
  const c = pr.cleared, best = pr.best || {};
  ['pilgrim', 'scribe', 'priest', 'pharaoh', 'temple'].forEach(w => { if (c[w]) ids.push('ae_' + w); });
  if ((best.temple || 0) >= 50) ids.push('ae_half'); if ((best.temple || 0) >= 90) ids.push('ae_near');
  return ids;
}
