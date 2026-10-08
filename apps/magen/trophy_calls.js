/* Where Magen tells the trophies what happened (the list is trophies.js). `S` is handed in each time because the game replaces it on an ascent and a wipe. A Shabbat is remembered
   from its start (were the candles lit?) to its end (was the star left alone?). None of it can throw into the game. */
import { trophies } from '../trophy_scope.js';
import { MG_KAV, MG_SPEC, MG_LEG, MG_ARG } from './data.js';
import { LONELY } from './trophies.js';

const TR = trophies('magen');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export function createCalls() {
  let litAtStart = false, sig = '';
  return {
    /* the Magen mitzvah the game itself just awarded: its mirror is lit quietly (the game's own banner is the announcement) */
    mirrored: id => guard(() => TR.award('mg_' + id, true)),
    pressed(S, combo, auto) {
      guard(() => {
        if (combo >= 25) TR.emit('chain', { combo: combo });
        if (!auto && S.buffs.some(b => b.n === 'SIMCHA') && S.buffs.some(b => b.n === 'HAKHNASAT ORCHIM')) TR.add('bothBuffs');
        if (S.run >= LONELY && S.own.every(o => !o)) TR.emit('lonely', {});
      });
    },
    gold: (age, life) => guard(() => TR.emit('gold', { age: age, life: life })),
    shabbatStart: S => guard(() => { litAtStart = S.litFor > 0; TR.streak('lit', litAtStart); }),
    shabbatEnd: restClean => guard(() => TR.streak('shomer', litAtStart && !!restClean)),
    argSettled: (q, side) => guard(() => { if (q.law != null && side === q.law) TR.mark('law', MG_ARG.indexOf(q)); }),
    ascended: genSecs => guard(() => TR.emit('ascend', { genSecs: genSecs })),
    ledger: () => guard(() => TR.emit('ledger', {})),
    news: i => guard(() => TR.mark('newsSeen', i)),
    /* what is owned, looked at a few times a second: only a change is told */
    scan(S) {
      guard(() => {
        const kav = MG_KAV.every(u => S.up[u.id]), spec = MG_SPEC.every(u => S.up[u.id]), tree = MG_LEG.every(u => S.leg[u.id]), auto = S.aLvl || 0;
        const now = [kav, spec, tree, auto].join();
        if (now !== sig) { sig = now; TR.emit('own', { kav: kav, spec: spec, tree: tree, auto: auto }); }
      });
    }
  };
}
