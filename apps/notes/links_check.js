/* node apps/notes/links_check.js — the vault's links: what [[a link]] points at, a promise, and the shapes the trophies ask for (a web, a ring, a hub, nobody left out). */
import { linksOf, graphOf, facts } from './links.js';
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };
const note = (id, title, body) => ({ id, title, body: body || '' });

ok(linksOf(note('a', 'A', 'x [[B]] y [[B ]] z [[C|see c]] [[ ]] [[D]]')).join() === 'B,C,D', 'links are read in order, once each, with an alias and without blanks (' + linksOf(note('a', 'A', 'x [[B]] y [[B ]] z [[C|see c]] [[ ]] [[D]]')).join() + ')');
{ const g = graphOf([note('a', 'A', '[[B]] [[Ghost]] [[a]]'), note('b', 'B', '[[A]]')]);
  ok(g.edges.length === 2 && g.promises.join() === 'ghost', 'a note links to another, not to itself; a link to nothing is a promise'); }
{ const f = facts([note('a', 'A', '[[B]]'), note('b', 'B', '[[C]]'), note('c', 'C', '[[A]]')]);
  ok(f.ring && f.web.notes === 3 && f.joined, 'A to B to C and back to A is a ring'); }
{ const f = facts([note('a', 'A', '[[B]]'), note('b', 'B', '[[C]]'), note('c', 'C', '')]);
  ok(!f.ring, 'a chain is not a ring'); }
{ const notes = [note('h', 'Hub')]; for (let i = 0; i < 8; i++) notes.push(note('n' + i, 'N' + i, '[[Hub]]'));
  const f = facts(notes); ok(f.hub === 8 && f.joined && f.web.notes === 9 && f.web.links === 8, 'eight notes that link to one are a hub, and nobody is left out'); }
{ const notes = []; for (let i = 0; i < 10; i++) notes.push(note('n' + i, 'N' + i, '[[N' + ((i + 1) % 10) + ']] [[N' + ((i + 3) % 10) + ']]'));
  notes.push(note('x', 'Loner', 'no links'));
  const f = facts(notes); ok(f.web.notes === 10 && f.web.links === 20 && !f.joined, 'ten notes joined by twenty links are a web, and the one with none is left out'); }
{ const f = facts([note('a', 'Index', '[[Bekkedal]] [[The Stack]]'), note('b', 'Bekkedal', ''), note('c', 'The Stack', '[[Index]]')]);
  ok(f.promises === 0 && f.links === 3, 'what the seed vault has: its links all point at a page'); }
console.log(fails ? fails + ' failed' : 'All checks pass.');
process.exit(fails ? 1 : 0);
