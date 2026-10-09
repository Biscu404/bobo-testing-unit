/* ACCOUNT.EXE: the SUN ledger. LEDGER is the last fifty movements, newest first; BY SOURCE adds the same fifty up by where each came from, so what pays and what
   costs shows at a glance. It listens to the economy while it is open and lets go when it is closed. */
export default {
  id: 'account',
  title: 'ACCOUNT.EXE',
  icon: '',
  width: 440,
  height: 420,
  resizable: true,
  mount(root, ctx) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'apps/account/style.css';
    root.appendChild(style);
    const E = window.Economy;
    let by = false;
    const el = (cls, txt, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

    const container = el('');
    container.style.height = '100%';
    root.appendChild(container);
    const bar = el('appbar');
    const mk = (t, fn) => { const b = el('appbtn', t, 'button'); b.addEventListener('click', fn); bar.appendChild(b); return b; };
    const bLed = mk('LEDGER', () => { by = false; draw(); }), bSrc = mk('BY SOURCE', () => { by = true; draw(); });
    root.appendChild(bar);

    const pad = n => String(n).padStart(2, '0');
    function draw() {
      container.textContent = '';
      bLed.classList.toggle('on', !by); bSrc.classList.toggle('on', by);
      const p = el('ledgpane');
      const head = el('ledghead'); head.appendChild(el('', by ? 'SOURCE' : 'WHEN / SOURCE', 'span')); head.appendChild(el('', 'SUN', 'span'));
      p.appendChild(head);
      const rows = E.ledger();
      if (!rows.length) p.appendChild(el('ledgrow', 'NO TRANSACTIONS. THE BOOKS ARE CLEAN, WHICH IS ALSO A WAY OF SAYING EMPTY.'));
      if (by) {
        const m = new Map();
        rows.forEach(r => { const g = m.get(r.s) || { n: 0, c: 0 }; g.n += r.n; g.c++; m.set(r.s, g); });
        [...m.entries()].sort((a, b) => Math.abs(b[1].n) - Math.abs(a[1].n)).forEach(([s, g]) => {
          const d = el('ledgrow ' + (g.n >= 0 ? 'in' : 'out'));
          d.appendChild(el('w', s + (g.c > 1 ? '  x' + g.c : ''), 'span')); d.appendChild(el('n', (g.n >= 0 ? '+' : '') + g.n, 'span')); p.appendChild(d);
        });
      } else rows.forEach(r => {
        const d = el('ledgrow ' + (r.n >= 0 ? 'in' : 'out'));
        const dt = new Date(r.t);
        d.appendChild(el('t', pad(dt.getHours()) + ':' + pad(dt.getMinutes()), 'span'));
        d.appendChild(el('w', r.s, 'span'));
        d.appendChild(el('n', (r.n >= 0 ? '+' : '') + r.n, 'span'));
        p.appendChild(d);
      });
      const tot = E.totals();
      p.appendChild(el('ledgtot', 'IN ' + tot.earned + '   OUT ' + tot.spent + '   ON HAND ' + E.balance()));
      container.appendChild(p);
    }
    draw();
    this._update = () => { if (document.body.contains(root)) draw(); };
    E.onChange(this._update);
  },
  unmount() { if (this._update && window.Economy && window.Economy.offChange) window.Economy.offChange(this._update); this._update = null; }
};
