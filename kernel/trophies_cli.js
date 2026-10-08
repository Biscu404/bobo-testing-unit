/* The ledger as the terminal prints it, in plain lines (pure: no DOM, so scripts/check-trophies.mjs holds it). `TROPHIES` is the whole count and where each game stands, `TROPHIES <GAME>`
   is one game's list with a mark for each (done, not yet, a secret as its rumour), `TROPHY <ID or NAME>` is one trophy in full. Each line is [text, class] with the terminal's own classes:
   l-ok, l-holy (a milestone), l-dim, l-err. The same numbers the ledger window shows: they come from the same model (apps/trophies/model.js). */
import { areas, cards, totals } from '../apps/trophies/model.js';

const bar = (a, b, w) => { const n = b > 0 ? Math.round(a / b * w) : 0; return '[' + '#'.repeat(n) + '.'.repeat(w - n) + ']'; };
const pad = (s, n) => String(s).slice(0, n).padEnd(n);
const TIER = { B: 'BRONZE', S: 'SILVER', G: 'GOLD' };

export function summary(T, names) {
  const t = totals(T), out = [];
  out.push(['TROPHIES  ' + t.done + ' OF ' + t.total + '   BRONZE ' + t.B.done + '/' + t.B.total + '  SILVER ' + t.S.done + '/' + t.S.total + '  GOLD ' + t.G.done + '/' + t.G.total + '   SECRETS ' + t.secretsDone + ' FOUND', 'l-holy']);
  areas(T).forEach(a => out.push(['  ' + pad(names[a.id] || a.id.toUpperCase(), 17) + ' ' + String(a.done).padStart(3) + '/' + String(a.total).padEnd(3) + ' ' + bar(a.done, a.total, 20) + (a.mastered ? '  MASTERED' : '') + (a.mirrors ? '   +' + a.mirrorsDone + '/' + a.mirrors + ' OF THE GAME\'S OWN' : ''), a.mastered ? 'l-holy' : 'l-ok']));
  out.push(['TROPHIES <GAME> LISTS ONE. TROPHY <NAME> SHOWS ONE. TROPHIES OPEN OPENS THE LEDGER.', 'l-dim']);
  return out;
}

/* the area a word names: its id (SWEEPER, BEKKEDAL), or a part of its name (DUNGEON, STACK, SMALL) */
export function findArea(T, word, names) {
  const w = String(word || '').trim().toLowerCase().replace(/\.exe$/, '');
  if (!w) return null;
  const list = areas(T).map(a => a.id);
  return list.find(id => id === w) || list.find(id => String(names[id] || '').toLowerCase() === w) ||
    list.find(id => String(names[id] || '').toLowerCase().indexOf(w) >= 0 || id.indexOf(w) === 0) || null;
}

export function ofArea(T, id, names) {
  const g = cards(T, id, {}), out = [];
  const own = g.own.slice().sort((a, b) => (T.earned(b.id) ? 1 : 0) - (T.earned(a.id) ? 1 : 0) || a.id.localeCompare(b.id));
  const done = own.filter(d => T.earned(d.id)).length;
  out.push([(names[id] || id.toUpperCase()) + '  ' + done + ' OF ' + own.filter(d => !T.closed(d)).length, 'l-holy']);
  own.forEach(d => {
    const got = T.earned(d.id), p = got ? null : T.progressOf(d);
    const hidden = d.secret && !got;
    out.push([(got ? ' [X] ' : T.closed(d) ? ' [-] ' : ' [ ] ') + pad(hidden ? '???' : T.plainName(d), 34) + ' ' + (TIER[d.tier] || '').padEnd(6) + ' ' + (hidden ? (T.hintOf(d) || 'A SECRET.') : T.plainDesc(d)) + (p ? '  (' + p[0] + '/' + p[1] + ')' : ''), got ? 'l-ok' : 'l-dim']);
  });
  if (g.mirrors.length) out.push(['  AND ' + g.mirrors.filter(d => T.earned(d.id)).length + ' OF ' + g.mirrors.length + ' OF THE GAME\'S OWN ACHIEVEMENTS, WHICH PAY NOTHING AND COUNT NOWHERE.', 'l-dim']);
  return out;
}

export function ofOne(T, word) {
  const w = String(word || '').trim().toLowerCase();
  if (!w) return [['TROPHY <ID OR NAME>. TRY: TROPHY SW_FIRST, OR TROPHY HAPPY BIRTHDAY.', 'l-dim']];
  const all = [...T.defs.values()];
  const d = all.find(x => x.id.toLowerCase() === w) || all.find(x => T.plainName(x).toLowerCase() === w) || all.find(x => !x.secret && T.plainName(x).toLowerCase().indexOf(w) >= 0);
  if (!d) return [['NO TROPHY CALLED ' + word.toUpperCase() + '.', 'l-err']];
  const got = T.earned(d.id), hidden = d.secret && !got, p = got ? null : T.progressOf(d);
  const out = [[(hidden ? '???' : T.plainName(d)) + '   ' + (d.mastery ? 'MASTERY' : (TIER[d.tier] || '')) + (d.secret ? '  SECRET' : '') + (d.legacy ? '  THE GAME\'S OWN' : ''), got ? 'l-holy' : 'l-ok']];
  out.push([hidden ? (T.hintOf(d) || 'A SECRET.') : T.plainDesc(d), 'l-ok']);
  out.push([(got ? 'EARNED ' + new Date(T.st.earned[d.id]).toDateString().toUpperCase() : T.closed(d) ? 'CLOSED: IT CAN NO LONGER BE EARNED.' : 'NOT YET.') + (p ? '  ' + p[0] + ' OF ' + p[1] : '') + (d.pay > 0 ? '  PAYS ' + d.pay + ' SUN' : ''), got ? 'l-holy' : 'l-dim']);
  return out;
}
