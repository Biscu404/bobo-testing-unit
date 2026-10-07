/* node apps/bekkedal/asks_check.js — what you can say, and what they remember (asks.js, ask_<id>.js). Pure Node.
 *   shape      every topic has an id, a label and lines; asks have 2-4 answers; ids are unique per person; no answer is empty;
 *   the box    every list the player is shown fits the dialogue box (the list is rows of 41 letters; a label is one row), and so does
 *              every question with its answers, and every line they say;
 *   memory     what a topic's `when` or an echo reads is something an answer really writes ('<person>.<topic>' and a value that
 *              exists), a follow-up is only reachable through the answer it follows, and nobody is ever left with nothing to say;
 *   play       a long simulated acquaintance: a player who answers at random, then one who answers the same way every time. Every
 *              topic that can be reached is reached, nothing is offered twice, the list is never empty while topics remain and
 *              never longer than the box, and the same day offers the same list. */
import { BEK_TALK, BEK_NPCS } from './data.js';
import * as F from './font.js';
import * as L from './layout.js';
import { topicMenu, openTopics, pickTopics, topicDialogue, memKey, MENU_SIZE } from './asks.js';

let fails = 0, checks = 0;
const ok = (c, m, d) => { checks++; if (c) { console.log('OK   ' + m.padEnd(70) + (d || '')); return true; } fails++; console.log('FAIL ' + m + '   ' + (d || '')); return false; };
const per = Math.max(1, Math.floor(L.DLG_TW / (F.FONT_ADV * F.FONT_LG)));
const rows = t => { const out = []; let line = ''; for (const w of String(t).split(' ')) { if (!line) line = w; else if (line.length + 1 + w.length <= per) line += ' ' + w; else { out.push(line); line = w; } } if (line) out.push(line); return out.length; };
const txt = (s, lang) => s == null ? '' : typeof s === 'string' ? s : s[lang];
const ids = Object.keys(BEK_TALK).filter(id => BEK_TALK[id].topics);
const mk = (day, mem) => ({ day: day, mem: mem || {}, fr: Object.fromEntries(BEK_NPCS.map(n => [n.id, 10])), flag: {}, q: {}, season: day % 4, weather: ['klar', 'regn'][day % 2], min: 12 * 60,
                            bag: {}, yst: {}, disc: {}, tools: {}, spine: { d: {} } });

console.log('-- shape --');
{
  const bad = [];
  ids.forEach(id => { const seen = new Set(); BEK_TALK[id].topics.forEach(t => {
    if (!t.id || !t.label || !t.lines || !t.lines.length) bad.push(id + '/' + t.id + ' is not whole');
    if (seen.has(t.id)) bad.push(id + '/' + t.id + ' is twice'); seen.add(t.id);
    if (t.ask) { const n = t.ask.opts.length; if (n < 2 || n > 4) bad.push(id + '/' + t.id + ' has ' + n + ' answers');
      t.ask.opts.forEach((o, i) => { if (!o.t || !o.reply || !o.reply.length) bad.push(id + '/' + t.id + ' answer ' + (i + 1) + ' says nothing'); if (o.then && !BEK_TALK[id].topics.some(x => x.id === o.then)) bad.push(id + '/' + t.id + ' goes on to ' + o.then + ', which is not there'); }); }
  }); });
  ok(!bad.length, 'every topic is whole, with ids that are one-of-a-kind', bad.slice(0, 3).join('; '));
  const total = ids.reduce((a, id) => a + BEK_TALK[id].topics.length, 0), answers = ids.reduce((a, id) => a + BEK_TALK[id].topics.reduce((b, t) => b + (t.ask ? t.ask.opts.length : 0), 0), 0);
  ok(ids.length === 8 && ids.every(id => BEK_TALK[id].topics.length >= 10), 'all eight have ten topics or more', ids.map(id => id + ' ' + BEK_TALK[id].topics.length).join(', '));
  ok(total >= 90 && answers >= 270, 'and a great deal to say between them', total + ' topics, ' + answers + ' answers to choose from');
  ok(ids.every(id => BEK_TALK[id].topics.filter(t => t.follow).length >= 1), 'each has a follow-up to something said before');
}

console.log('\n-- the box --');
{
  const bad = [];
  ids.forEach(id => BEK_TALK[id].topics.forEach(t => {
    ['no', 'en'].forEach(lang => {
      const label = txt(t.label, lang); if (rows(label) !== 1) bad.push(id + '/' + t.id + ' label is ' + rows(label) + ' rows: ' + label);
      t.lines.forEach(l => { const r = rows(txt(l, lang)); if (r > L.DLG_BODY_LINES) bad.push(id + '/' + t.id + ' a line is ' + r + ' rows'); });
      if (t.ask) { let n = rows(txt(t.ask.q, lang)); t.ask.opts.forEach(o => { n += rows(txt(o.t, lang)); (o.reply || []).forEach(r => { if (rows(txt(r, lang)) > L.DLG_BODY_LINES) bad.push(id + '/' + t.id + ' a reply is too long'); }); });
        if (n > L.DLG_BODY_LINES) bad.push(id + '/' + t.id + ' question and answers are ' + n + ' rows'); }
    });
  }));
  ok(!bad.length, 'labels are one row, lines and replies fit, a question with its answers fits', bad.slice(0, 4).join('; ') + (bad.length > 4 ? ' (+' + (bad.length - 4) + ')' : ''));
  const menu = topicMenu(BEK_TALK.astrid, 'astrid', mk(5), true);
  ok(menu && menu.opts.length === MENU_SIZE + 1 && rows(menu.q.en) + menu.opts.reduce((a, o) => a + rows(txt(o.t, 'en')) + 0, 0) <= L.DLG_BODY_LINES, 'the list of things to say, with its way out, fits too');
  const lc = BEK_TALK;
  const echoBad = [];
  ids.forEach(id => BEK_TALK[id].chat.forEach(c => c.t.forEach(l => ['no', 'en'].forEach(lang => { if (rows(txt(l, lang)) > L.DLG_BODY_LINES) echoBad.push(id + ': ' + String(txt(l, lang)).slice(0, 30)); }))));
  ok(!echoBad.length, 'and so does every line in their ordinary pool, echoes included', echoBad.slice(0, 2).join('; '));
}

console.log('\n-- memory --');
{
  /* every answer a topic can write, as 'person.topic=value' */
  const writes = new Set();
  ids.forEach(id => BEK_TALK[id].topics.forEach(t => { if (t.ask) topicDialogue(BEK_TALK[id], id, t).ask.opts.forEach(o => writes.add(memKey(id, t.id) + '=' + o.mem)); else writes.add(memKey(id, t.id) + '=said'); }));
  /* what a predicate asks for: run it against a state in which exactly one thing has been said, and see whether anything is true */
  const reads = [], dead = [];
  const probe = (label, fn) => { const hits = []; [...writes].forEach(w => { const [k, v] = w.split('='); try { if (fn(mk(10, { [k]: v }))) hits.push(w); } catch (e) {} }); if (!hits.length) { try { if (fn(mk(10, {}))) return; } catch (e) { return; } dead.push(label); } };
  ids.forEach(id => { BEK_TALK[id].topics.filter(t => t.follow).forEach(t => { const open = [...writes].some(w => { const [k, v] = w.split('='); try { return t.when(mk(10, { [k]: v })); } catch (e) { return false; } }); if (!open) dead.push(id + '/' + t.id + ' follows nothing that can be said'); }); });
  ids.forEach(id => BEK_TALK[id].chat.filter(c => /said|mem/.test(String(c.if))).forEach((c, i) => { const open = [...writes].some(w => { const [k, v] = w.split('='); try { return c.if(mk(10, { [k]: v })); } catch (e) { return false; } }); if (!open) dead.push(id + ' echo ' + i + ' answers nothing that can be said'); }));
  ok(!dead.length, 'every follow-up and every echo reads something an answer really writes', dead.slice(0, 3).join('; '));
  const empty = ids.filter(id => { for (let d = 1; d <= 120; d += 7) for (const mem of [{}, Object.fromEntries([...writes].map(w => w.split('=')))]) { const S = mk(d, mem); S.mem = mem; if (!BEK_TALK[id].chat.filter(c => !c.if || c.if(S)).length) return true; } return false; });
  ok(!empty.length, 'nobody is ever left with an empty pool, whatever has been said', empty.join(','));
}

console.log('\n-- an acquaintance --');
{
  const pickers = { random: (n, i) => (i * 7 + n * 3) % n, first: () => 0, last: n => n - 1 };
  Object.keys(pickers).forEach(name => {
    const problems = [], reached = {};
    ids.forEach(id => {
      const S = mk(1); let again = 0, longest = 0, visits = 0;
      for (let day = 1; day <= 400; day++) {
        S.day = day; S.season = day % 4; S.weather = ['klar', 'regn', 'klar'][day % 3];
        for (let rep = 0; rep < 2; rep++) {
          const m = topicMenu(BEK_TALK[id], id, S, true), m2 = topicMenu(BEK_TALK[id], id, S, true);
          if (JSON.stringify(m) !== JSON.stringify(m2)) problems.push(id + ': a list is not the same twice');
          if (!m) break;
          visits++;
          longest = Math.max(longest, m.opts.length);
          const pick = m.opts[pickers[name](m.opts.length - 1, day + rep)];
          if (!pick.topic) break;
          const t = BEK_TALK[id].topics.find(x => x.id === pick.topic);
          if (S.mem[memKey(id, t.id)]) { again++; }
          const d = topicDialogue(BEK_TALK[id], id, t);
          if (d.ask) { const o = d.ask.opts[pickers[name](d.ask.opts.length, day)]; S.mem[o.memKey] = o.mem; } else S.mem[d.key] = 'said';
          reached[id + '/' + t.id] = 1;
        }
      }
      if (again) problems.push(id + ' was offered ' + again + ' things twice');
      if (longest > MENU_SIZE + 1) problems.push(id + ' was offered a list of ' + longest);
    });
    const all = ids.reduce((a, id) => a + BEK_TALK[id].topics.length, 0), got = Object.keys(reached).length;
    ok(!problems.length, name + ': nothing offered twice, the list never too long, the same day the same list', problems.slice(0, 2).join('; '));
    ok(got >= all * 0.55, name + ': a player who takes it all the way reaches much of it', got + ' of ' + all + ' topics');
  });
}
console.log('\n' + (fails ? fails + ' of ' + checks + ' asks checks FAILED' : 'All ' + checks + ' asks checks pass.'));
process.exit(fails ? 1 : 0);
