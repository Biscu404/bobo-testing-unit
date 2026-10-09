/* CHEESE. Gheghe's present (kernel/gifts.js: the bottle of Apa Plata Borsec comes with a button): a small button in the tray of the taskbar that puts a pile of cheese down for the elephant.
   The pile goes in his window, always; and on the desktop, in a corner and never on an icon, if he is out of his window and free to walk about (kernel/pet.js). He eats from
   both of them from time to time (the big one in his window, the small one on the desk: apps/cheese_art.js is how), a wedge at a time, and a pile that has been eaten is gone.
   What is kept is how much is left of each and which cell of the desk the pile stands on (templeos.cheese.v1). */
import { drawPile, PILE_W, PILE_H, MAX_BITES, PER_PRESS, drawWedge } from '../apps/cheese_art.js';
import { VGA16 } from './god.js';
import { deskIconCells } from './desktop.js';
import { nearestFree, cellPos, ICON_W, ICON_H } from './desk_grid.js';

const KEY = 'templeos.cheese.v1', S = 2;
let st = { app: 0, desk: 0, c: -1, r: -1 };
try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) st = { app: clampN(v.app), desk: clampN(v.desk), c: v.c | 0, r: v.r | 0 }; } catch (e) { /* none yet */ }
function clampN(n) { return Math.max(0, Math.min(MAX_BITES, Math.floor(+n || 0))); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* kept for this sitting */ } };
const subs = [], hooks = { out: () => false };
const tell = () => { subs.forEach(f => { try { f(); } catch (e) { /* a view that has gone */ } }); try { window.dispatchEvent(new Event('cheese-changed')); } catch (e) { /* nobody */ } };
const snd = (...a) => { try { window.Snd.tone(...a); } catch (e) { /* silent */ } };
const toast = m => { try { window.toast(m); } catch (e) { /* no toast */ } };
const C = i => 'rgb(' + VGA16[i].join(',') + ')';

let btn = null, pile = null;

/* the cell the pile stands on: the nearest free one to the corner, never one an icon is on (the bin's own corner is the bin's) */
function choose() {
  const { cols, rows, taken } = deskIconCells();
  const hit = nearestFree(taken, cols - 2, rows - 1, cols, rows);
  if (!hit) return false;                                   /* a desk with no free cell has no room for a pile */
  st.c = hit.c; st.r = hit.r;
  return true;
}
function boxOf() {
  if (st.desk <= 0 || st.c < 0) return null;
  const p = cellPos(st.c, st.r);
  return { x: p.x + (ICON_W - PILE_W * S) / 2, y: p.y + ICON_H - PILE_H * S - 4, w: PILE_W * S, h: PILE_H * S };
}
function paint() {
  const d = document.getElementById('desktop');
  if (!d) return;
  const b = boxOf();
  if (!b) { if (pile) pile.style.display = 'none'; return; }
  if (!pile) {
    pile = document.createElement('canvas'); pile.id = 'cheesepile'; pile.width = PILE_W * S; pile.height = PILE_H * S;
    d.appendChild(pile);
  }
  const g = pile.getContext('2d'); g.clearRect(0, 0, pile.width, pile.height);
  drawPile((x, y, w, h, c) => { g.fillStyle = C(c); g.fillRect(x, y, w, h); }, 0, 0, st.desk, S);
  pile.style.display = 'block'; pile.style.left = Math.round(b.x) + 'px'; pile.style.top = Math.round(b.y) + 'px';
}
/* an icon put down where the pile is: the pile moves to the nearest cell that is free (checked every few seconds, and when the window changes size) */
function settle() {
  if (st.desk <= 0) return;
  const { taken } = deskIconCells();
  if (taken.has(st.c + ',' + st.r) && choose()) { save(); paint(); }
}

export const Cheese = {
  hooks,
  appBites: () => st.app,
  deskBites: () => st.desk,
  deskPile: () => boxOf(),
  max: MAX_BITES,
  onChange(fn) { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
  /* the button: a pile in his window, and one on the desk if he is out */
  press() {
    const wasDesk = st.desk > 0;
    if (st.app >= MAX_BITES && (!hooks.out() || st.desk >= MAX_BITES)) { toast('THERE IS PLENTY OF CHEESE. LET HIM EAT SOME.'); snd(200, 80, { type: 'triangle', vol: 0.03 }); return false; }
    st.app = Math.min(MAX_BITES, st.app + PER_PRESS);
    let desk = false;
    if (hooks.out() && (wasDesk || choose())) { st.desk = Math.min(MAX_BITES, st.desk + PER_PRESS); desk = true; }
    save(); paint(); tell();
    snd(330, 90, { type: 'triangle', to: 220, vol: 0.04 }); snd(262, 120, { type: 'triangle', to: 392, delay: 0.07, vol: 0.03 });
    toast(desk ? 'CHEESE, IN HIS WINDOW AND ON THE DESKTOP.' : hooks.out() ? 'CHEESE, IN HIS WINDOW. THE DESKTOP HAS NO FREE CELL FOR A PILE.' : 'CHEESE, IN HIS WINDOW. HE IS NOT OUT, SO NOT ON THE DESKTOP.');
    return true;
  },
  /* a wedge eaten: from the pile in his window ('app') or on the desktop ('desk') */
  eat(where) {
    if (where === 'desk') { if (st.desk <= 0) return false; st.desk--; } else { if (st.app <= 0) return false; st.app--; }
    save(); paint(); tell();
    return true;
  },
  /* the button is there once the bottle of water has been given */
  mount() {
    const has = !!(window.Gifts && window.Gifts.has('borsec'));
    const bar = document.getElementById('taskbar');
    if (!bar) return;
    if (has && !btn) {
      btn = document.createElement('div'); btn.id = 'cheesebtn';
      btn.title = 'CHEESE. A PILE OF IT, FOR THE ELEPHANT: IN HIS WINDOW, AND ON THE DESKTOP IF HE IS OUT.';
      const cv = document.createElement('canvas'); cv.width = 14; cv.height = 9; btn.appendChild(cv);
      const g = cv.getContext('2d'); drawWedge((x, y, w, h, c) => { g.fillStyle = C(c); g.fillRect(x, y, w, h); }, 0, 0, 1);
      btn.addEventListener('mousedown', ev => { ev.stopPropagation(); Cheese.press(); });
      bar.insertBefore(btn, document.getElementById('mixerbox') || document.getElementById('sunbox') || document.getElementById('clock'));
    }
    paint();
  },
  boot() {
    this.mount();
    window.addEventListener('gift-given', () => this.mount());
    window.addEventListener('gifts-changed', () => this.mount());
    window.addEventListener('resize', () => { settle(); paint(); });
    setInterval(settle, 4000);
  }
};
window.Cheese = Cheese;
