/* node apps/shop/lines_check.js  --  Dave's crazy lines (pure Node: no DOM, no clock, a seeded dice).
   One hover in ten he says one of them instead of what the card really is; this holds that to its numbers. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FRAMES, LOGOS, CURSORS, SCHEMES, POTS, SPECIES, WALLS, CRAYON, GARAGE, DRINKS, ELEPHANT } from '../../kernel/cos_data.js';
import { DAVE_LINES, DAVE_BROKE, DAVE_CRAZY, DAVE_CRAZY_CAT, DAVE_CRAZY_ITEM, CRAZY_RATE, SPEECH_MAX, crazyPool, makeHoverTalk } from './lines.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELVES = { frame: FRAMES, logo: LOGOS, cursor: CURSORS, scheme: SCHEMES, pot: POTS, seed: SPECIES, wall: WALLS, crayon: CRAYON, garage: GARAGE, drink: DRINKS, elephant: ELEPHANT };

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL  ' + msg); } };
const say = msg => console.log(msg);

/* a seeded dice (mulberry32) */
function dice(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* every shelf the shop has is one the crazy lines know about: the keys of COS_CATS, read off the file, not copied */
const catsSrc = readFileSync(path.join(HERE, '../../kernel/cos.js'), 'utf8');
const catKeys = [...catsSrc.matchAll(/^  (\w+):\s*\{ list:/gm)].map(m => m[1]);
ok(catKeys.length >= 11, 'COS_CATS keys found in kernel/cos.js (' + catKeys.length + ')');
ok(catKeys.join() === Object.keys(SHELVES).join(), 'this check knows every shelf: cos.js ' + catKeys.join() + ' / here ' + Object.keys(SHELVES).join());
Object.keys(DAVE_CRAZY_CAT).forEach(k => ok(catKeys.indexOf(k) >= 0, 'DAVE_CRAZY_CAT.' + k + ' is a real shelf'));
catKeys.forEach(k => ok((DAVE_CRAZY_CAT[k] || []).length >= 3, 'shelf ' + k + ' has at least three lines of its own (' + (DAVE_CRAZY_CAT[k] || []).length + ')'));

/* the pool */
const cards = [];
catKeys.forEach(c => SHELVES[c].forEach(it => cards.push([c, it])));
const everything = new Set();
let longest = '';
cards.forEach(([c, it]) => crazyPool(c, it).forEach(l => {
  everything.add(l);
  if (l.length > longest.length) longest = l;
}));
const plain = DAVE_CRAZY.length + Object.values(DAVE_CRAZY_CAT).reduce((n, a) => n + a.length, 0);
say('crazy lines: ' + DAVE_CRAZY.length + ' for anywhere, ' + (plain - DAVE_CRAZY.length) + ' for a shelf, ' + DAVE_CRAZY_ITEM.length +
    ' that say the card\'s name; ' + everything.size + ' different lines across ' + cards.length + ' cards; longest ' + longest.length + ' of ' + SPEECH_MAX);
ok(DAVE_CRAZY.length >= 50, 'at least fifty lines for anywhere (' + DAVE_CRAZY.length + ')');
ok(plain >= 60, 'at least sixty fixed lines (' + plain + ')');
ok(everything.size >= 100, 'a hundred different lines across the shop (' + everything.size + ')');
cards.forEach(([c, it]) => ok(crazyPool(c, it).length >= 60, 'the card ' + c + '/' + it.id + ' has a pool of at least sixty (' + crazyPool(c, it).length + ')'));

/* each line is clean: unique, upper case, not too long, nothing undefined in it */
const seen = new Map();
const fixed = DAVE_CRAZY.concat(...Object.values(DAVE_CRAZY_CAT));
fixed.forEach(l => { ok(!seen.has(l), 'duplicate crazy line: ' + l); seen.set(l, 1); });
const known = new Set(DAVE_LINES.concat(DAVE_BROKE));
fixed.forEach(l => ok(!known.has(l), 'a crazy line repeats an ordinary one: ' + l));
everything.forEach(l => {
  ok(typeof l === 'string' && l.length > 0, 'an empty line');
  ok(l.length <= SPEECH_MAX, 'too long for the bubble (' + l.length + ' > ' + SPEECH_MAX + '): ' + l);
  ok(l === l.toUpperCase(), 'not in capitals: ' + l);
  ok(!/undefined|NaN|\[object|null/.test(l), 'a hole in a line: ' + l);
  ok(!/[‘’“”]/.test(l), 'a curly quote in: ' + l);
});

/* the dice: a hover below the rate is crazy, at the rate and above is the card's own */
const card = [catKeys[0], SHELVES[catKeys[0]][1]];
ok(CRAZY_RATE === 0.1, 'the rate is one in ten');
[[0, true], [0.05, true], [CRAZY_RATE - 1e-9, true], [CRAZY_RATE, false], [0.5, false], [0.9999, false]].forEach(([r, crazy]) => {
  const t = makeHoverTalk(() => r)(card[0], card[1]);
  ok(t.crazy === crazy, 'rng ' + r + ' gives crazy=' + crazy + ' (got ' + t.crazy + ')');
  if (!crazy) ok(t.text === card[1].blurb, 'a plain hover says the blurb, word for word');
});
const noBlurb = { id: 'x', name: 'A THING', price: 1 };
ok(makeHoverTalk(() => 0.5)('frame', noBlurb).text === 'A THING', 'a card with no blurb says its name, as before');

/* the rate, over a lot of hovers on every card, with a seeded dice */
{
  const rng = dice(20240607), talk = makeHoverTalk(rng);
  const pick = dice(7);
  const N = 200000;
  let crazy = 0, plainWrong = 0;
  for (let i = 0; i < N; i++) {
    const [c, it] = cards[Math.floor(pick() * cards.length)];
    const t = talk(c, it);
    if (t.crazy) crazy++; else if (t.text !== (it.blurb || it.name)) plainWrong++;
  }
  const rate = crazy / N;
  say('rate over ' + N + ' hovers: ' + (rate * 100).toFixed(2) + ' %');
  ok(Math.abs(rate - 0.1) < 0.004, 'about one hover in ten is crazy (' + rate + ')');
  ok(plainWrong === 0, 'the other nine say exactly what they always said (' + plainWrong + ' did not)');
}

/* never the same crazy line twice running, even if every hover is crazy and even on the same card */
{
  /* the first draw of a hover decides (0: crazy), the second picks the line */
  const alwaysCrazy = seed => { const r = dice(seed); let flip = false; return () => { flip = !flip; return flip ? 0 : r(); }; };
  const talk = makeHoverTalk(alwaysCrazy(5));
  let prev = null, repeats = 0, notCrazy = 0;
  for (let i = 0; i < 20000; i++) {
    const [c, it] = i % 3 === 0 ? card : cards[i % cards.length];
    const t = talk(c, it);
    if (!t.crazy) notCrazy++;
    if (t.text === prev) repeats++;
    prev = t.text;
  }
  ok(notCrazy === 0, 'a forced hover is crazy');
  ok(repeats === 0, 'no crazy line twice in a row (' + repeats + ' repeats in 20000)');
  /* every line of one card's pool does get said, and about as often as the others */
  const one = makeHoverTalk(alwaysCrazy(11)), pool = crazyPool(card[0], card[1]), count = new Map();
  for (let i = 0; i < pool.length * 400; i++) { const t = one(card[0], card[1]); count.set(t.text, (count.get(t.text) || 0) + 1); }
  ok(count.size === pool.length, 'every line of a pool is reachable (' + count.size + ' of ' + pool.length + ')');
  let lo = Infinity, hi = 0;
  count.forEach(n => { lo = Math.min(lo, n); hi = Math.max(hi, n); });
  ok(lo > 400 * 0.6 && hi < 400 * 1.4, 'no line is favoured: least ' + lo + ', most ' + hi + ', mean 400');
}

/* a pool of one cannot repeat itself without a choice: the filter falls back to nothing, not to a crash */
{
  const tiny = makeHoverTalk(() => 0);
  const a = tiny('nowhere', noBlurb), b = tiny('nowhere', noBlurb);
  ok(typeof a.text === 'string' && typeof b.text === 'string' && a.text !== b.text, 'a card the shelf has never heard of still works, and still does not repeat');
}

console.log(fails ? '\n' + fails + ' FAILED' : '\nOK  lines_check');
process.exit(fails ? 1 : 0);
