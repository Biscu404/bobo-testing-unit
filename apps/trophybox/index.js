/* TROPHYBOX.EXE -- the big trophies (every gold one and every mastery seal) live in here as cups on a shelf. Press one and drag it out of the window and it is on the desktop:
   it falls, has weight and a hitbox, lands on the floor, on the others and on the top edge of a window (kernel/trophy_drop.js). Double-click one out there to put it back, or drop it on
   this window. The box itself is handed over by the first gold trophy or seal (kernel/trophy_box.js). */
import { cup, wearOf, TIER_NAME } from '../trophy_art.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

export default {
  id: 'trophybox',
  title: 'TROPHYBOX.EXE',
  width: 560,
  height: 440,
  resizable: true,
  fluid: true,
  mount(root, ctx) {
    root.classList.add('tbox');
    const css = el('link'); css.rel = 'stylesheet'; css.href = 'apps/trophybox/style.css'; root.appendChild(css);
    const T = window.Trophies, P = window.TrophyProps;
    const head = el('div', 'tb-head', 'THE BOX'), shelf = el('div', 'tb-shelf'), bar = el('div', 'appbar hint');
    const mk = (label, fn) => { const b = el('button', 'appbtn', label); b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.click(); fn(); }); bar.appendChild(b); return b; };
    mk('ALL OUT', () => { const w = (document.getElementById('desktop') || { clientWidth: 800 }).clientWidth; P.bigList().forEach((d, i) => P.out(d.id, 80 + ((i * 97) % Math.max(200, w - 220)), -60 - i * 50)); });
    mk('ALL BACK', () => P.outIds().forEach(id => P.put(id)));
    const note = el('span', 'godword', '');
    bar.appendChild(note);
    root.appendChild(head); root.appendChild(shelf); root.appendChild(bar);
    if (!T || !P) { shelf.textContent = 'THE LEDGER IS NOT HERE.'; return; }

    const draw = () => {
      const list = P.bigList();
      shelf.textContent = '';
      list.forEach(d => {
        const out = P.isOut(d.id), wear = wearOf(d);
        const slot = el('div', 'tb-slot' + (out ? ' out' : '') + ' w-' + wear);
        const art = el('div', 'tb-cup'); art.innerHTML = cup(wear, false);
        slot.appendChild(art);
        slot.appendChild(el('div', 'tb-name', T.plainName(d)));
        slot.appendChild(el('div', 'tb-tier', out ? 'ON THE DESK' : (d.mastery ? 'SEAL' : TIER_NAME[wear] || '')));
        slot.title = T.plainDesc(d);
        if (!out) slot.addEventListener('pointerdown', ev => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); P.pickup(d.id, ev); });
        shelf.appendChild(slot);
      });
      if (!list.length) shelf.appendChild(el('div', 'tb-empty', 'NOTHING IN HERE YET. A GOLD TROPHY OR A MASTERY SEAL PUTS A CUP IN THE BOX.'));
      const total = T.total(d => d.tier === 'G' || d.mastery);
      head.textContent = 'THE BOX   ' + list.length + ' OF ' + total + ' BIG TROPHIES';
      note.textContent = 'DRAG A CUP OUT ONTO THE DESKTOP. DOUBLE-CLICK IT THERE, OR DROP IT HERE, TO PUT IT BACK.';
    };
    draw();
    const redraw = () => { if (root.isConnected) draw(); };
    window.addEventListener('trophies-changed', redraw);
    const off = P.onChange(redraw);
    this._off = () => { window.removeEventListener('trophies-changed', redraw); off(); };
  },
  unmount() { if (this._off) { this._off(); this._off = null; } }
};
