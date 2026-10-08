/* The pinned trophies: a small square in the top right corner of the glass, under the menu bar, over every window, which shows the trophies you pinned
   (their exact condition and live progress) while the pointer is on it. No pins, no square. It lives in #shell, so it is on the glass,
   it never takes a click that is not on it, and it stays out of the way of a fullscreen window by sitting above it at 18 px. */
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

export function mountPins(T) {
  const shell = document.getElementById('shell');
  if (!shell || document.getElementById('pinbox')) return;
  const box = el('div', 'pinbox'); box.id = 'pinbox'; box.style.display = 'none';
  const sq = el('div', 'pinsq'); sq.setAttribute('role', 'button'); sq.setAttribute('aria-label', 'Pinned trophies');
  const panel = el('div', 'pinpanel');
  box.appendChild(sq); box.appendChild(panel);
  shell.appendChild(box);

  function draw() {
    const pins = T.pinsList();
    box.style.display = pins.length ? 'block' : 'none';
    if (!pins.length) return;
    const done = pins.filter(d => T.earned(d.id)).length;
    sq.textContent = String(pins.length);
    sq.classList.toggle('alldone', done === pins.length);
    panel.textContent = '';
    panel.appendChild(el('div', 'pinhead', 'PINNED TROPHIES   ' + done + '/' + pins.length));
    pins.forEach(d => {
      const row = el('div', 'pinrow' + (T.earned(d.id) ? ' done' : ''));
      const p = T.earned(d.id) ? null : T.progressOf(d);
      row.appendChild(el('div', 'pinname', (T.earned(d.id) ? '✓ ' : '') + T.plainName(d)));
      row.appendChild(el('div', 'pindesc', d.secret && !T.earned(d.id) ? (T.hintOf(d) || 'A SECRET.') : T.plainDesc(d)));
      if (p && p[1] > 0) {
        const bar = el('div', 'pinbar'), fill = el('i'); fill.style.width = Math.round(100 * p[0] / p[1]) + '%';
        bar.appendChild(fill); row.appendChild(bar); row.appendChild(el('div', 'pinnum', p[0] + ' / ' + p[1]));
      }
      row.addEventListener('mousedown', ev => { ev.stopPropagation(); if (T.openLedger) T.openLedger(d.id); });
      panel.appendChild(row);
    });
    panel.appendChild(el('div', 'pinfoot', 'CLICK ONE TO FIND IT IN THE LEDGER.'));
  }
  T.onChange(evt => { if (evt === 'trophies-changed' || evt === 'trophy-earned') draw(); });
  draw();
}
