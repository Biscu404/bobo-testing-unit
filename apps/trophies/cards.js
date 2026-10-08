/* One trophy as a card in the ledger: a plate in the tier's colour with its cup (a padlock over it while it is not yours), the name, the tags, the exact condition,
   a bar of cells for a counter, what it pays (and what else it gives), and the day it was earned. A secret is ??? and a rumour until it is found. A completion (the long ones,
   which pay in thousands) is gold-edged and says so; a seal is white; a trophy earned in the last two days says NEW. Clicking a card opens it: a button to pin it, one to go and
   play the game it is in, and the things it gives, which open Dave's shelf. `o` carries what the card needs from outside: { open(app), shop(cat), pin(id) }. */
import { cup, wearOf } from '../trophy_art.js';
import { state, isNew, appOf } from './model.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const dateOf = ms => { const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
export const KIND_NAME = { progress: 'PROGRESSION', skill: 'SKILL', explore: 'EXPLORE', creative: 'CREATIVE', meta: 'META', joke: 'JOKE' };
const CHIP = { progress: 'P', skill: 'S', explore: 'E', creative: 'C', meta: 'M', joke: 'J' };
const LOCK = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="1" width="8" height="2" fill="#000"/><rect x="3" y="3" width="2" height="5" fill="#000"/><rect x="11" y="3" width="2" height="5" fill="#000"/><rect x="4" y="2" width="8" height="1" fill="#AAAAAA"/><rect x="4" y="3" width="1" height="5" fill="#AAAAAA"/><rect x="11" y="3" width="1" height="5" fill="#AAAAAA"/><rect x="2" y="7" width="12" height="8" fill="#000"/><rect x="3" y="8" width="10" height="6" fill="#AAAAAA"/><rect x="7" y="10" width="2" height="3" fill="#000"/></svg>';
const CELLS = 20;

export function renderCard(T, d, o) {
  o = o || {};
  const s = state(T, d), hidden = d.secret && s !== 'done', fresh = isNew(T, d);
  const c = el('div', 'tr-card w-' + wearOf(d) + ' ' + s + (hidden ? ' hidden' : '') + (T.isPinned(d.id) ? ' pinned' : '') + (d.legacy ? ' mirror' : '') + (d.epic ? ' epic' : '') + (d.mastery ? ' seal' : '') + (fresh ? ' fresh' : ''));
  c.dataset.id = d.id; c.tabIndex = -1; c.setAttribute('role', 'listitem');
  const plate = el('div', 'tr-plate'), icon = el('div', 'tr-cup'); icon.innerHTML = cup(hidden ? 'secret' : wearOf(d), s !== 'done');
  plate.appendChild(icon);
  if (s !== 'done') { const k = el('div', 'tr-lock'); k.innerHTML = hidden ? '<b>?</b>' : LOCK; plate.appendChild(k); }
  const main = el('div', 'tr-body'), l1 = el('div', 'tr-l1');
  l1.appendChild(el('span', 'tr-name', hidden ? '???' : T.nameOf(d)));
  if (fresh) l1.appendChild(el('span', 'tr-tag new', 'NEW'));
  l1.appendChild(el('span', 'tr-kind k-' + CHIP[d.kind], CHIP[d.kind])); l1.lastChild.title = KIND_NAME[d.kind];
  if (d.epic) l1.appendChild(el('span', 'tr-tag epic', 'COMPLETION'));
  if (d.secret) l1.appendChild(el('span', 'tr-tag sec', s === 'done' ? 'SECRET FOUND' : 'SECRET'));
  if (d.mastery) l1.appendChild(el('span', 'tr-tag seal', 'SEAL'));
  if (d.legacy) l1.appendChild(el('span', 'tr-tag mir', 'THE GAME\'S OWN'));
  if (d.scope && s !== 'done' && !hidden) l1.appendChild(el('span', 'tr-tag scope', 'PER ' + d.scope.toUpperCase()));
  main.appendChild(l1);
  main.appendChild(el('div', 'tr-desc', hidden ? (T.hintOf(d) || 'A SECRET.') : T.descOf(d)));
  if (hidden) c.classList.add('hint');
  const p = !hidden && s === 'open' ? T.progressOf(d) : null;
  if (p && p[1] > 0) {
    const row = el('div', 'tr-prog'), bar = el('div', 'tr-cells'), on = Math.round(CELLS * Math.min(1, p[0] / p[1]));
    for (let i = 0; i < CELLS; i++) bar.appendChild(el('i', i < on ? 'on' : ''));
    row.append(bar, el('span', 'tr-num', p[0].toLocaleString('en-US') + ' / ' + p[1].toLocaleString('en-US'))); main.appendChild(row);
  }
  if (!hidden && d.reward && d.reward.length) main.appendChild(el('div', 'tr-gives' + (s === 'done' ? ' got' : ''), (s === 'done' ? 'GOT: ' : 'GIVES: ') + d.reward.map(r => r.name).join(', ')));
  if (d.mastery && !hidden) main.appendChild(el('div', 'tr-gives' + (s === 'done' ? ' got' : ''), (s === 'done' ? 'GOT: ' : 'OPENS: ') + 'A FOLDER ON THE DESKTOP WITH ITS PICTURES'));
  if (s === 'closed') main.appendChild(el('div', 'tr-extra closed', 'CLOSED: ' + (d.retired ? 'it was retired' + (d.since ? ' in ' + d.since : '') : 'it can no longer be earned')));
  if (s === 'done') main.appendChild(el('div', 'tr-extra', 'EARNED ' + dateOf(T.st.earned[d.id])));
  const right = el('div', 'tr-pay');
  if (d.legacy) right.appendChild(el('div', 'tr-mir', 'MIRROR'));
  else if (d.pay > 0) { const coin = el('i', 'tr-coin'); right.append(coin, el('div', 'tr-paynum', (s === 'done' ? '' : '+') + d.pay.toLocaleString('en-US')), el('div', 'tr-paysun', s === 'done' ? 'SUN PAID' : 'SUN')); }
  /* the open half of a card */
  const more = el('div', 'tr-more');
  const btn = (label, fn) => { const b = el('button', 'tr-b', label); b.addEventListener('mousedown', ev => { if (ev.button !== 0) return; ev.stopPropagation(); fn(); }); return b; };
  more.appendChild(btn(T.isPinned(d.id) ? 'UNPIN' : 'PIN', () => o.pin && o.pin(d.id)));
  const app = appOf(d.app);
  if (app && o.open) more.appendChild(btn('GO PLAY', () => o.open(app)));
  (d.reward || []).forEach(r => more.appendChild(btn('SEE ' + r.name, () => o.shop && o.shop(r.cat))));
  c.append(plate, main, right, more);
  return c;
}
