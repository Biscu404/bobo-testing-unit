/* THE COOK's trophies. Its own ledger (`CK_ACH`, twenty-four) stays exactly as it was and is mirrored here, shown in TROPHIES.EXE and counted nowhere, paying nothing (the Cook's ledger
   never paid SUN and now does not either); the nine below are new and are earned by skill and by looking about (docs/achievements/games-1.md). Events: win { lv, steps, par, resets,
   undos, ruins, nudged }, ruin, wall, idle, thermo. Sets: noUndo (the benches won in par with no undo), said (the kid's first words on the mirror, the doubling plate, solvent, heat, cold and
   the first stage), ruinCauses. */
import { t, rule, mirror, inSet } from '../trophy_kit.js';
import { CK_ACH } from './data.js';
const on = rule.on;

export const KID_TOUR = ['first_mirror', 'first_double', 'first_solvent', 'first_hot', 'first_cold', 'first_stage'];

/* the tier a mirror is shown in: the weight of what it asks */
const TIER = { a4: 'S', a5: 'S', a7: 'S', a8: 'G', a10: 'S', a18: 'S', a20: 'S', a21: 'S', a23: 'G', a24: 'G' };
const KIND = { a12: 'joke', a21: 'joke' };                         /* the two that reward failing or fiddling, which the ledger files under jokes */
export const MIRRORS = CK_ACH.map(a => mirror('ck_' + a.id, a.n, TIER[a.id] || 'B', a.d, KIND[a.id] ? { kind: KIND[a.id] } : {}));

export const TROPHIES = [
  t('ck_undo5', 'MEASURE TWICE', 'S', 'S', 'Solve five benches in par without using undo.', rule.sets('noUndo', 5)),
  t('ck_oneshot', 'NO TAKE-BACKS', 'G', 'S', 'Solve THREE STAGES or ONE LAST TIME in par with no undo and no reset.', on('win', p => (p.lv === 9 || p.lv === 10) && p.steps <= p.par && p.undos === 0 && p.resets === 0), { scope: 'run' }),
  t('ck_knock', 'ONE KNOCK', 'G', 'S', 'Finish THE ONE WHO KNOCKS in par: 28 pours.', on('win', p => p.lv === 11 && p.steps <= p.par)),
  t('ck_kidtour', 'THE KID NOTICES', 'S', 'E', 'Hear his first words on the mirror, the doubling plate, the solvent, heat, cold and the first stage.', rule.sets('said', KID_TOUR.length)),
  t('ck_two', 'TWO WAYS TO LOSE', 'B', 'E', 'Ruin a batch on a red tile, and another in the sweep.', rule.sets('ruinCauses', 2)),
  t('ck_count', 'COUNT IT', 'B', 'E', 'Get to the kid\'s third nudge, then solve the bench anyway.', on('win', p => p.nudged), { scope: 'room' }),
  t('ck_thermo', 'THERMOSTAT', 'B', 'C', 'Heat and cool the burner in the same batch.', on('thermo')),
  t('ck_glass', "THAT'S GLASS, MAN", 'B', 'J', 'Pour at a wall.', on('wall')),
  t('ck_idle', 'NOT RUSHING YOU', 'B', 'J', 'Let the kid fill the silence with one of his idle lines.', on('idle'))
];

/* the mirrors: every entry of the Cook's own ledger that the save already holds; the kid's tour from what he has said */
export function backfill(read) {
  const sv = read('templeos.cook.v1'), ids = [];
  if (!sv) return ids;
  CK_ACH.forEach(a => { if (sv.ach && sv.ach[a.id]) ids.push('ck_' + a.id); });
  const said = KID_TOUR.filter(k => sv.said && sv.said[k]);
  said.forEach(k => ids.push(inSet('cook', 'said', k)));
  if (said.length === KID_TOUR.length) ids.push('ck_kidtour');
  return ids;
}
