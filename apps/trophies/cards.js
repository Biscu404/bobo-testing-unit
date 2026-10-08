/* One trophy as a card in the ledger. A locked card always says how: the exact condition, and for a counter or a set the live numbers (7 / 10, 4 of 9). A secret is ??? with a rumour
   (its hint) until it is found, and then flips to its real name with a SECRET FOUND tag. A closed one is grey and says why. The cup is the tier's colour (a secret magenta, a seal white),
   grey and dim while it is not earned yet. */
import { cup, wearOf } from '../trophy_art.js';
import { state, ratio } from './model.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const dateOf = ms => { const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
export const KIND_NAME = { progress: 'PROGRESSION', skill: 'SKILL', explore: 'EXPLORE', creative: 'CREATIVE', meta: 'META', joke: 'JOKE' };
const CHIP = { progress: 'P', skill: 'S', explore: 'E', creative: 'C', meta: 'M', joke: 'J' };

export function renderCard(T, d, o) {
  const s = state(T, d), lang = T.st.lang, hidden = d.secret && s !== 'done';
  const c = el('div', 'tr-card w-' + wearOf(d) + ' ' + s + (hidden ? ' hidden' : '') + (T.isPinned(d.id) ? ' pinned' : '') + (d.legacy ? ' mirror' : ''));
  c.dataset.id = d.id; c.tabIndex = -1; c.setAttribute('role', 'listitem');
  const icon = el('div', 'tr-cup'); icon.innerHTML = cup(wearOf(d), s !== 'done');
  const main = el('div', 'tr-body');
  const l1 = el('div', 'tr-l1');
  l1.appendChild(el('span', 'tr-name', hidden ? '???' : T.nameOf(d)));
  l1.appendChild(el('span', 'tr-kind k-' + CHIP[d.kind], CHIP[d.kind])); l1.lastChild.title = KIND_NAME[d.kind];
  if (d.secret) l1.appendChild(el('span', 'tr-tag sec', s === 'done' ? 'SECRET FOUND' : 'SECRET'));
  if (d.mastery) l1.appendChild(el('span', 'tr-tag seal', 'SEAL'));
  if (d.legacy) l1.appendChild(el('span', 'tr-tag mir', 'THE GAME\'S OWN'));
  if (d.scope && s !== 'done' && !hidden) l1.appendChild(el('span', 'tr-tag scope', 'PER ' + d.scope.toUpperCase()));
  { const pb = el('span', 'tr-pin', T.isPinned(d.id) ? 'PINNED' : 'PIN'); pb.title = 'Pin to the corner of the screen'; l1.appendChild(pb); }
  main.appendChild(l1);
  main.appendChild(el('div', 'tr-desc', hidden ? (T.hintOf(d) || 'A SECRET.') : T.descOf(d)));
  if (hidden) c.classList.add('hint');
  const p = !hidden && s === 'open' ? T.progressOf(d) : null;
  if (p && p[1] > 0) {
    const row = el('div', 'tr-prog'), bar = el('div', 'tr-bar'), fill = el('i'); fill.style.width = Math.round(100 * Math.min(1, p[0] / p[1])) + '%'; bar.appendChild(fill);
    row.append(bar, el('span', 'tr-num', p[0] + ' / ' + p[1])); main.appendChild(row);
  }
  if (s === 'closed') main.appendChild(el('div', 'tr-extra closed', 'CLOSED: ' + (d.retired ? 'it was retired' + (d.since ? ' in ' + d.since : '') : 'it can no longer be earned')));
  if (s === 'done') main.appendChild(el('div', 'tr-extra', 'EARNED ' + dateOf(T.st.earned[d.id])));
  const right = el('div', 'tr-pay', d.legacy ? 'MIRROR' : d.pay > 0 ? (s === 'done' ? 'PAID ' : '+') + d.pay + ' SUN' : '');
  c.append(icon, main, right);
  void lang; void ratio;
  return c;
}
