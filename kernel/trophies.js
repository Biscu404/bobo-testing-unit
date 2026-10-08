/* window.Trophies: the one service every app and the kernel talk to (the same pattern as window.Economy and window.Cos). The engine is trophies_core.js (pure); this is the machine's
   side of it: the one saved key (templeos.trophies.v1, which kernel/durable.js mirrors into IndexedDB so a power cut cannot eat a trophy; a key that will not read is copied to
   .bak and the ledger says so), SUN paid through window.Economy as `TROPHY: <NAME>`, the card and the taskbar cup (trophies_toast.js), the calendar, and the first-time backfill
   that finds what a person already did in their saves (trophies_backfill.js). Nothing here runs per frame, and every call catches its own errors. */
import { createTrophies } from './trophies_core.js';
import { registerAll, NAMES } from './trophies_defs.js';
import { makeToast } from './trophies_toast.js';
import { wire } from './trophies_wire.js';
import { backfill } from './trophies_backfill.js';
import { registry } from './registry.js';
import { openWindow } from './wm.js';
import { plain, words } from '../apps/trophy_kit.js';

const KEY = 'templeos.trophies.v1';
let damaged = false;
function read() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch (e) { damaged = true; try { localStorage.setItem(KEY + '.bak', raw); } catch (x) { /* nothing to be done */ } return null; }
}
const write = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage full: it still counts this sitting */ } };

export const Trophies = createTrophies({
  read: read, write: write,
  pay: (n, why) => { if (window.Economy) window.Economy.earn(n, why); },
  announce: (evt, detail) => { try { window.dispatchEvent(new CustomEvent(evt, { detail: detail })); } catch (e) { /* no window */ } }
});
registerAll(Trophies);
Trophies.damaged = () => damaged;
Trophies.names = NAMES;
Trophies.appCount = () => Object.keys(registry).filter(k => k !== 'placeholder').length;
Trophies.nameOf = d => words(d.name, Trophies.st.lang);
Trophies.descOf = d => words(d.desc, Trophies.st.lang);
Trophies.hintOf = d => words(d.hint, Trophies.st.lang);
Trophies.plain = plain;
Trophies.openLedger = id => openWindow('trophies', id ? { focus: id } : {}).catch(console.error);

let started = false;
Trophies.boot = () => {
  if (started) return; started = true;
  try {
    const toast = makeToast(Trophies, { nameOf: Trophies.nameOf, descOf: Trophies.descOf, open: id => Trophies.openLedger(id) });
    Trophies.toast = toast;
    toast.mountCup();
    toast.live();
    import('./trophies_pins.js').then(m => m.mountPins(Trophies)).catch(() => {});
    import('./rewards.js').then(m => m.startRewards(Trophies)).catch(() => {});
    import('./trophy_box.js').then(m => m.startBox(Trophies)).catch(() => {});
    wire(Trophies);
    const d = new Date(), two = n => String(n).padStart(2, '0');
    Trophies.openDay(d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()), d.getMonth() + 1, d.getDate());
    setTimeout(() => {
      try {
        const n = backfill(Trophies);
        if (n > 0) { Trophies.emit('meta', 'remember', { n: n }); toast.show({ id: 'remembered', name: 'THE MACHINE REMEMBERED ' + n + ' THING' + (n === 1 ? '' : 'S') + ' YOU ALREADY DID.', desc: 'See them in TROPHIES.EXE.', tier: 'S', kind: 'meta', pay: 0 }); }
      } catch (e) { /* the saves are somebody else's business */ }
    }, 2500);
  } catch (e) { /* never into the machine */ }
};
window.Trophies = Trophies;
