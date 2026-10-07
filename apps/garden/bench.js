/* GARDEN — the bench: what a room can be given (a drip line, a bigger basket, the gatherer), and the five ways the rack
   rewards good planting, in words. A panel laid over the garden; closes on a second click of BENCH, ESC, or its own button. */
import { HOME, KIN, ROOTED, SET, BED, MATE } from './synergy.js';

const pct = v => '+' + Math.round((v - 1) * 100) + '%';
const GUIDE = [
  ['#7ad06a', 'HOME ROOM  ' + pct(HOME.yield) + ' SUN  ' + pct(HOME.grow) + ' GROWTH', 'a plant in the room it comes from'],
  ['#7ad06a', 'KIN POT  ' + pct(KIN.yield) + ' SUN', 'a plant in the pot it likes  (both: ROOTED ' + pct(ROOTED.yield) + ' MORE)'],
  ['#c8a0ff', 'ROOM SET  ' + pct(SET.yield) + ' SUN  ' + pct(SET.grow) + ' GROWTH', 'the whole room, when its pot is the one the room is set for'],
  ['#5ad6d6', 'OF ITS KIND  +' + Math.round(BED.yield * 100) + '% SUN EACH', 'every pot beside it with the same plant (up to four)'],
  ['#ff8ac8', 'MATE  +' + Math.round(MATE.yield * 100) + '% SUN AND GROWTH EACH', 'every pot beside it with its mate (hover a plant to see who)']
];

export function createBench(hooks) {
  const el = document.createElement('div');
  el.className = 'gbench';
  el.style.display = 'none';
  el.addEventListener('mousedown', ev => ev.stopPropagation());

  function row(o) {
    const r = document.createElement('div');
    r.className = 'gbrow' + (o.owned ? ' own' : '');
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = o.name;
    const tx = document.createElement('div'); tx.className = 'tx'; tx.textContent = o.blurb;
    const bt = document.createElement('button'); bt.className = 'appbtn';
    bt.textContent = o.owned ? 'HAVE IT' : o.price + ' SUN';
    bt.disabled = o.owned || hooks.balance() < o.price;
    bt.addEventListener('mousedown', ev => { ev.stopPropagation(); if (!bt.disabled && hooks.buy(o.id)) refresh(); });
    r.appendChild(nm); r.appendChild(tx); r.appendChild(bt);
    return r;
  }

  function refresh() {
    el.innerHTML = '';
    const h = document.createElement('div'); h.className = 'gbh';
    h.textContent = 'THE BENCH  --  ' + hooks.roomName() + '   (' + hooks.balance() + ' SUN)';
    el.appendChild(h);
    hooks.offers().forEach(o => el.appendChild(row(o)));
    const gh = document.createElement('div'); gh.className = 'gbh'; gh.textContent = 'WHAT IS WORTH PLANTING WHERE'; el.appendChild(gh);
    GUIDE.forEach(([col, a, b]) => {
      const r = document.createElement('div'); r.className = 'gbrow';
      const sw = document.createElement('div'); sw.className = 'sw'; sw.style.background = col;
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = a;
      const tx = document.createElement('div'); tx.className = 'tx'; tx.textContent = b;
      r.appendChild(sw); r.appendChild(nm); r.appendChild(tx); el.appendChild(r);
    });
    const c = document.createElement('button'); c.className = 'appbtn'; c.textContent = 'CLOSE';
    c.addEventListener('mousedown', ev => { ev.stopPropagation(); close(); });
    el.appendChild(c);
  }
  const open = () => { refresh(); el.style.display = ''; hooks.onChange(true); };
  const close = () => { el.style.display = 'none'; hooks.onChange(false); };
  return { el, refresh, open, close, isOpen: () => el.style.display !== 'none', toggle() { if (this.isOpen()) close(); else open(); } };
}
