/* node apps/bekkedal/hellos_check.js — the word over the shoulder: both languages, capitals, short, never the same day twice over for everyone. Pure Node. */
import { BEK_NPCS } from './data.js';
import { helloFor, HELLO_RAIN, HELLO_MORNING, HELLO_DAY, HELLO_EVENING, HELLO_OWN } from './hellos.js';
let bad = 0; const ok = (c, m, d) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (d ? '  ' + d : '')); if (!c) bad++; };
const all = [].concat(HELLO_RAIN, HELLO_MORNING, HELLO_DAY, HELLO_EVENING, ...Object.values(HELLO_OWN));
ok(all.every(l => l.no && l.en), 'every greeting is in both languages');
ok(all.every(l => l.no === l.no.toUpperCase() && l.en === l.en.toUpperCase()), 'and in capitals, like the rest of the bubbles');
ok(all.every(l => l.no.length <= 38 && l.en.length <= 38), 'and short enough for a bubble', 'longest ' + Math.max(...all.map(l => Math.max(l.no.length, l.en.length))));
const who = BEK_NPCS.filter(n => n.posts).map(n => n.id);
ok(who.every(id => HELLO_OWN[id] && HELLO_OWN[id].length >= 2), 'each of the eight has words of their own');
const seen = new Set(); for (const id of who) for (let d = 1; d <= 60; d++) for (const m of [7 * 60, 13 * 60, 20 * 60]) seen.add(helloFor(id, d, m).en);
ok(seen.size >= 20, 'over two months there is plenty of variety', seen.size + ' different greetings');
ok(JSON.stringify(helloFor('astrid', 5, 480)) === JSON.stringify(helloFor('astrid', 5, 480)), 'a reload says the same thing');
let morning = 0; for (let d = 1; d <= 100; d++) { const g = helloFor('olav', d, 8 * 60); if (HELLO_MORNING.includes(g) || HELLO_OWN.olav.includes(g)) morning++; }
ok(morning === 100, 'in the morning it is a morning thing, or their own');
if (bad) process.exit(1); console.log('All hello checks pass.');
