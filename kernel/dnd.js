/* Dragging things that are files, between the desktop, folder windows,
   folders and the recycle bin.

   It is pointer events rather than the browser's own drag-and-drop on
   purpose: the desktop's icons already move by pointer (they sit on a grid
   the browser knows nothing about), and one mechanism that works the same
   from every source is easier to keep right than two that have to agree.

   A drop zone is any element carrying data-drop: a folder path ('::/Doc'),
   '::' for the bare desktop, or '@trash' for the recycle bin. The zone
   under the pointer is the topmost one that is not covered by some other
   window, so a window on top of the desktop shields it.

     Dnd.begin(ev, { paths, svg, label, live, onDrop })

   `live` means the caller already moves its own elements (desktop icons do)
   so no ghost is drawn. onDrop(zone | null, upEvent) runs on release; zone
   is { el, drop } and null means "not on anything that takes files". */
const THRESHOLD = 4;
let ghost = null, hot = null;

function clearHot() {
  document.querySelectorAll('.dndhot').forEach(n => n.classList.remove('dndhot'));
  hot = null;
}

export function zoneAt(x, y, skip) {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (el.closest('#dndghost') || (skip && el.closest(skip))) continue;
    const z = el.closest('[data-drop]');
    const w = el.closest('.win');
    if (z && (!w || w.contains(z))) return { el: z, drop: z.dataset.drop };
    if (w) return null;                 /* over a window that takes nothing */
  }
  return null;
}

function makeGhost(opts, n) {
  const g = document.createElement('div');
  g.id = 'dndghost';
  g.innerHTML = (opts.svg || '') + '<span class="lbl"></span>';
  g.querySelector('.lbl').textContent = n > 1 ? n + ' ITEMS' : (opts.label || '');
  document.getElementById('desktop').appendChild(g);
  return g;
}

export const Dnd = {
  active: false,
  begin(ev, opts) {
    const sx = ev.clientX, sy = ev.clientY;
    let live = false, last = null;
    const desk = document.getElementById('desktop');

    const move = e => {
      if (!live) {
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < THRESHOLD) return;
        live = true;
        Dnd.active = true;
        if (!opts.live) ghost = makeGhost(opts, opts.paths.length);
        if (window.Snd) window.Snd.grab();
        if (opts.onStart) opts.onStart();
      }
      if (ghost) {
        const r = desk.getBoundingClientRect();
        ghost.style.left = (e.clientX - r.left + 8) + 'px';
        ghost.style.top = (e.clientY - r.top + 8) + 'px';
      }
      const z = zoneAt(e.clientX, e.clientY, '.dragging');
      last = z;
      if (!z || !hot || z.el !== hot) {
        clearHot();
        if (z && !(opts.accept && !opts.accept(z))) { z.el.classList.add('dndhot'); hot = z.el; }
      }
      if (opts.onMove) opts.onMove(e, z);
    };
    const finish = (e, cancelled) => {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('keydown', key, true);
      const was = live;
      clearHot();
      if (ghost) { ghost.remove(); ghost = null; }
      Dnd.active = false;
      if (!was) return;
      /* a click that turned into a drag must not also be a click */
      window.addEventListener('click', stopClick, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', stopClick, true), 0);
      const z = cancelled ? null : (zoneAt(e.clientX, e.clientY, '.dragging') || last);
      if (opts.onDrop) opts.onDrop(cancelled ? null : z, e, cancelled);
    };
    const up = e => finish(e, false);
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); finish(e, true); } };
    const stopClick = e => { e.stopPropagation(); e.preventDefault(); };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('keydown', key, true);
  }
};
