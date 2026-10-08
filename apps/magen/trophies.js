/* MAGEN's trophies. Its own ninety-eight mitzvot (`MG_ACH`, which pay SUN through achSun as they always did) are mirrored here: shown in TROPHIES.EXE, paying nothing a second time and
   counted nowhere. The eighteen below are new, and are the skill and the discovery the old list never asked for (docs/achievements/games-1.md); none of them is a joke at the expense of the
   practice, and rest is never a penalty. Events: chain { combo }, gold { age, life }, ascend { genSecs }, own { kav, spec, tree, auto }, ledger, lonely, double. Sets: law (the machloket
   settled with the stated ruling), newsSeen (ticker lines). Streaks: lit, shomer. */
import { t, rule, mirror } from '../trophy_kit.js';
import { MG_ACH, MG_KAV, MG_SPEC, MG_LEG, MG_NEWS } from './data.js';
import { AUTO_LEVELS } from './auto.js';
import { achSun } from './pay.js';
const on = rule.on;

/* a mirror's tier is the weight of what it pays */
const tierOf = a => { const n = achSun(a); return n <= 60 ? 'B' : n <= 120 ? 'S' : 'G'; };
export const MIRRORS = MG_ACH.map(a => mirror('mg_' + a.id, a.n, tierOf(a), a.d));

export const LONELY = 50000;                      /* mitzvot in a generation, by hand, before the first building */
export const IMPATIENT_SECS = 90 * 60;

export const TROPHIES = [
  t('mg_chain25', 'KEEP GOING', 'B', 'S', 'Build a hand chain of 25 presses.', on('chain', p => p.combo >= 25)),
  t('mg_chain50', 'DO NOT STOP', 'S', 'S', 'Build a hand chain of 50.', on('chain', p => p.combo >= 50)),
  t('mg_chain60', 'THE FULL SIXTY', 'G', 'S', 'Reach the top of the chain: 60.', on('chain', p => p.combo >= 60)),
  t('mg_eye', 'SHARP EYE', 'S', 'S', 'Catch a golden star within a second of its appearing.', on('gold', p => p.age < 1)),
  t('mg_clutch', 'JUST IN TIME', 'B', 'S', 'Catch a golden star in its last second.', on('gold', p => p.life - p.age < 1)),
  t('mg_double', 'MITZVAH GORERET MITZVAH', 'G', 'S', 'Press the star a hundred times by hand while SIMCHA and HAKHNASAT ORCHIM are both running.', rule.stat('bothBuffs', 100)),
  t('mg_candles3', 'THREE FRIDAYS', 'S', 'S', 'Light the candles before three Shabbatot in a row.', rule.streak('lit', 3)),
  t('mg_shomer', 'SHOMER SHABBAT', 'G', 'S', 'Light the candles and then not press the star once, for three Shabbatot in a row.', rule.streak('shomer', 3)),
  t('mg_law', 'THE LAW FOLLOWS', 'S', 'E', 'Side with the stated ruling in six different machloket.', rule.sets('law', 6)),
  t('mg_heir', 'AN IMPATIENT HEIR', 'S', 'S', 'Hand it on again within ninety minutes of the last time.', on('ascend', p => p.genSecs != null && p.genSecs <= IMPATIENT_SECS)),
  t('mg_lonely', 'BY HAND ALONE', 'S', 'C', 'Earn ' + LONELY.toLocaleString('en-US') + ' mitzvot in one generation before you own a single building.', on('lonely')),
  t('mg_kav', 'ALL EIGHT KAVANOT', 'S', 'P', 'Buy all ' + MG_KAV.length + ' kavanah upgrades.', on('own', p => p.kav)),
  t('mg_spec', 'THE WHOLE LAW', 'S', 'P', 'Buy all ' + MG_SPEC.length + ' rule-changing upgrades.', on('own', p => p.spec)),
  t('mg_tree', 'THE FULL TREE', 'G', 'P', 'Buy all ' + MG_LEG.length + ' legacy upgrades.', on('own', p => p.tree)),
  t('mg_echo', 'THE FIRST ECHO', 'B', 'P', 'Buy the first level of the auto-press.', on('own', p => p.auto >= 1)),
  t('mg_echo6', 'SIX ECHOES', 'S', 'P', 'Buy all ' + AUTO_LEVELS.length + ' auto-press levels.', on('own', p => p.auto >= AUTO_LEVELS.length)),
  t('mg_ledger', 'READ THE LEDGER', 'B', 'E', 'Hover the counter once CHESHBON is yours, and read every rate there is.', on('ledger')),
  t('mg_news', 'EXTRA, EXTRA', 'G', 'E', 'Read every one of the ' + MG_NEWS.length + ' lines of the ticker.', rule.sets('newsSeen', MG_NEWS.length))
];

/* the mirrors from the save's own list, and a few of the new ones the save proves */
export function backfill(read) {
  const sv = read('templeos.magen.v1'), ids = [];
  if (!sv) return ids;
  MG_ACH.forEach(a => { if (sv.ach && sv.ach[a.id]) ids.push('mg_' + a.id); });
  if ((sv.bestCombo || 0) >= 25) ids.push('mg_chain25'); if ((sv.bestCombo || 0) >= 50) ids.push('mg_chain50'); if ((sv.bestCombo || 0) >= 60) ids.push('mg_chain60');
  const up = sv.up || {}, leg = sv.leg || {};
  if (MG_KAV.every(u => up[u.id])) ids.push('mg_kav');
  if (MG_SPEC.every(u => up[u.id])) ids.push('mg_spec');
  if (MG_LEG.every(u => leg[u.id])) ids.push('mg_tree');
  if ((sv.aLvl || 0) >= 1) ids.push('mg_echo'); if ((sv.aLvl || 0) >= AUTO_LEVELS.length) ids.push('mg_echo6');
  return ids;
}
