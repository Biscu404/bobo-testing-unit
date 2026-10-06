/* Zoom for one window. Most apps are drawn for one size and the window is
   whatever size it is, so every window can be made bigger or smaller inside
   itself: Ctrl and + / - / 0, Ctrl and the mouse wheel, or the [Z] on the
   title bar. It is the browser's own zoom, applied to the window's body only,
   so the app lays itself out again for the room it now has, exactly as a
   web page does. What you pick is remembered for that app. */
import { showMenu } from './menus.js';

const KEY = 'templeos.zoom.v1';
export const STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
const remember = (k, z) => {
  if (!k) return;
  if (z === 1) delete saved[k]; else saved[k] = z;
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
};

const nearest = z => STEPS.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a, 1);
const pct = z => Math.round(z * 100) + '%';

/* { win, body, bar, key() -> string|null, isActive() -> bool, before: element the button goes in front of } */
export function attachZoom(o) {
  const btn = document.createElement('span');
  btn.className = 'z';
  btn.textContent = '[Z]';
  btn.title = 'ZOOM. Ctrl and + / - / 0, or Ctrl and the mouse wheel, also work.';
  o.bar.insertBefore(btn, o.before || null);

  let z = 1, suspended = false, loaded = false;
  const apply = () => {
    o.body.style.zoom = (suspended || z === 1) ? '' : String(z);
    btn.textContent = z === 1 ? '[Z]' : '[' + pct(z) + ']';
    btn.classList.toggle('on', z !== 1);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };
  const set = (v, keep) => {
    z = nearest(v);
    if (keep !== false) remember(o.key(), z);
    apply();
    if (window.Snd) window.Snd.select();
  };
  const step = dir => {
    const i = STEPS.indexOf(z);
    set(STEPS[Math.max(0, Math.min(STEPS.length - 1, i + dir))]);
  };
  /* the key is only known once the window has been told which app it is */
  const load = () => {
    if (loaded || !o.key()) return;
    loaded = true;
    if (saved[o.key()]) { z = nearest(saved[o.key()]); apply(); }
  };
  setTimeout(load, 0);
  setTimeout(load, 250);

  btn.addEventListener('mousedown', ev => {
    ev.stopPropagation();
    if (window.Snd) window.Snd.click();
    load();
    const r = btn.getBoundingClientRect();
    const items = [
      { label: 'ZOOM IN', key: 'Ctrl +', run: () => step(1) },
      { label: 'ZOOM OUT', key: 'Ctrl -', run: () => step(-1) },
      { label: 'ACTUAL SIZE', key: 'Ctrl 0', run: () => set(1) },
      { sep: true }
    ].concat([0.5, 0.75, 1, 1.25, 1.5, 2, 3].map(v => ({ label: pct(v), on: v === z, run: () => set(v) })));
    showMenu(document.getElementById('ctxmenu'), r.left, r.bottom, items);
  });
  btn.addEventListener('dblclick', ev => ev.stopPropagation());

  o.win.addEventListener('wheel', ev => {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    ev.preventDefault();
    load();
    if (!suspended) step(ev.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  const onKey = ev => {
    if (!(ev.ctrlKey || ev.metaKey) || ev.altKey || !o.isActive() || suspended) return;
    if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); load(); step(1); }
    else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); load(); step(-1); }
    else if (ev.key === '0') { ev.preventDefault(); load(); set(1); }
  };
  document.addEventListener('keydown', onKey);

  return {
    btn,
    get: () => z,
    /* a fixed canvas that is scaled to fit the screen already has its own scale */
    suspend(on) { suspended = on; apply(); },
    dispose() { document.removeEventListener('keydown', onKey); }
  };
}
