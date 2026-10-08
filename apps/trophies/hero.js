/* THE TOP OF THE LEDGER: a ring that fills as the ledger does, the three cups with how many of each, the SUN the trophies have paid, and the one to go for next. */
import { cup } from '../trophy_art.js';
import { totals, nextUp, ratio } from './model.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const SEGS = 48;

/* a ring of forty-eight blocks, lit clockwise from the top: bronze, then silver, then gold, the way the cups run; whole pixels, nothing blended */
export function drawRing(cv, frac) {
  const g = cv.getContext('2d'), S = cv.width, c = S / 2, r = S / 2 - 9;
  g.clearRect(0, 0, S, S); g.imageSmoothingEnabled = false;
  const lit = Math.round(frac * SEGS);
  for (let i = 0; i < SEGS; i++) {
    const a = i / SEGS * Math.PI * 2 - Math.PI / 2, x = Math.round(c + Math.cos(a) * r) - 3, y = Math.round(c + Math.sin(a) * r) - 3;
    g.fillStyle = '#000000'; g.fillRect(x - 1, y - 1, 8, 8);
    g.fillStyle = i < lit ? (i < SEGS / 3 ? '#AA5500' : i < SEGS * 2 / 3 ? '#AAAAAA' : '#FFFF55') : '#222244';
    g.fillRect(x, y, 6, 6);
    if (i < lit) { g.fillStyle = '#FFFFFF'; g.fillRect(x, y, 2, 2); }
  }
}

export function buildHero(T, o) {
  const hero = el('div', 'tr-hero');
  const ringBox = el('div', 'tr-ringbox'), ring = el('canvas', 'tr-ring'); ring.width = ring.height = 104;
  const mid = el('div', 'tr-ringcup'); mid.innerHTML = cup('G');
  const pct = el('div', 'tr-pct');
  ringBox.append(ring, mid, pct);
  const stats = el('div', 'tr-stats'), big = el('div', 'tr-big'), pods = el('div', 'tr-pods'), sub = el('div', 'tr-sub');
  stats.append(big, pods, sub);
  const next = el('div', 'tr-next');
  hero.append(ringBox, stats, next);

  function update() {
    const t = totals(T), f = t.total ? t.done / t.total : 0;
    drawRing(ring, f); pct.textContent = Math.floor(f * 100) + '%';
    big.textContent = t.done + ' / ' + t.total;
    pods.innerHTML = '';
    [['B', 'BRONZE', t.B], ['S', 'SILVER', t.S], ['G', 'GOLD', t.G]].forEach(([w, name, x]) => {
      const p = el('div', 'tr-pod w-' + w), ic = el('div', 'tr-podcup'); ic.innerHTML = cup(w, x.done === 0);
      const bar = el('div', 'tr-podbar'), fill = el('i'); fill.style.width = x.total ? Math.round(100 * x.done / x.total) + '%' : '0%'; bar.appendChild(fill);
      p.append(ic, el('div', 'tr-podn', x.done + '/' + x.total), bar, el('div', 'tr-podl', name));
      pods.appendChild(p);
    });
    const paid = T.sunEarned ? T.sunEarned() : 0, all = T.sunTotal ? T.sunTotal() : 0;
    sub.textContent = paid.toLocaleString('en-US') + ' OF ' + all.toLocaleString('en-US') + ' SUN PAID   ' + t.secretsDone + ' / ' + (t.secrets + t.secretsDone) + ' SECRETS';
    /* next up */
    next.innerHTML = '';
    const d = nextUp(T);
    next.appendChild(el('div', 'tr-nexth', 'NEXT UP'));
    if (!d) { next.appendChild(el('div', 'tr-nextn', 'NOTHING LEFT.')); next.appendChild(el('div', 'tr-nextd', 'THE LEDGER IS FULL.')); return; }
    next.appendChild(el('div', 'tr-nextn', T.nameOf(d)));
    next.appendChild(el('div', 'tr-nextd', T.descOf(d)));
    const p = T.progressOf(d);
    if (p && p[1] > 0) {
      const bar = el('div', 'tr-nextbar'), fill = el('i'); fill.style.width = Math.round(100 * Math.min(1, p[0] / p[1])) + '%'; bar.appendChild(fill);
      next.append(bar, el('div', 'tr-nextnum', p[0] + ' / ' + p[1] + (ratio(T, d) >= 0.8 ? '  NEARLY' : '')));
    }
    next.appendChild(el('div', 'tr-nextpay', (d.pay > 0 ? '+' + d.pay.toLocaleString('en-US') + ' SUN' : '') + (d.reward && d.reward.length ? '   + ' + d.reward[0].name : '')));
    next.onmousedown = ev => { ev.stopPropagation(); if (o.focus) o.focus(d.id); };
  }
  return { el: hero, update: update };
}
