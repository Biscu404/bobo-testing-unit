/* What trophies hand over. A shelf item with `earn: '<trophy id>'` (kernel/cos_data.js: Solitaire's fourteen, the secret schemes and pointers a mastery seal opens) is never for sale;
   it is given the moment its trophy is earned, and to a machine that earned the trophy before this existed, at boot. The gift appears in Dave's shop at once (`Cos.tell`).
   The big trophies -- gold ones and the seals -- also put a cup in the TROPHY BOX (kernel/trophy_box.js). */
import { COS_CATS } from './cos.js';
import { toast } from './wm.js';

/* trophy id -> [{ cat, id, name }] */
export function giftTable() {
  const t = {};
  Object.keys(COS_CATS).forEach(cat => COS_CATS[cat].list.forEach(it => { if (it.earn) (t[it.earn] || (t[it.earn] = [])).push({ cat: cat, id: it.id, name: it.name, shelf: COS_CATS[cat].label }); }));
  return t;
}

export function startRewards(T) {
  const table = giftTable();
  const give = (id, quiet) => {
    (table[id] || []).forEach(g => {
      if (window.Cos && window.Cos.grant(g.cat, g.id) && !quiet) {
        try { toast('DAVE LEFT YOU SOMETHING: ' + g.name + '  (' + g.shelf + ' SHELF)'); } catch (e) { /* no screen */ }
      }
    });
  };
  Object.keys(table).forEach(id => { if (T.earned(id)) give(id, true); });
  window.addEventListener('trophy-earned', ev => { if (ev.detail && ev.detail.id) give(ev.detail.id, false); });
  window.addEventListener('trophies-changed', () => Object.keys(table).forEach(id => { if (T.earned(id)) give(id, true); }));
}
