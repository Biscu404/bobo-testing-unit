#!/usr/bin/env node
/* Dave's farewell, held to its numbers (pure Node: no DOM, no audio, no clock, a seeded dice).
     - kernel/dave_farewell.js   which tier a visit to the shop is, and that every tier has enough to say, in the right voice
     - kernel/dave_plan.js       the babble: silence on spaces and stops, a question that climbs, a shout that is loud, nothing out of range
   The box that shows it is kernel/dave_box.js; the checks of THAT (the window list, the timers, the audio calls) are done in the real machine.
   Run: node scripts/check-farewell.mjs */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const F = await import(pathToFileURL(path.join(ROOT, 'kernel/dave_farewell.js')));
const P = await import(pathToFileURL(path.join(ROOT, 'kernel/dave_plan.js')));
const D = await import(pathToFileURL(path.join(ROOT, 'kernel/cos_data.js')));
const { TIERS, POOLS, VOICES, FAREWELL_MAX, BLINK_MS, FAIR_SPEND, FAIR_COUNT, LOT_SPEND, LOT_COUNT, summarize, tierOf, linesFor, pickFarewell, num } = F;
const { voicePlan, BASE_MS, PITCH } = P;

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL  ' + m); } };
const say = m => console.log(m);
function dice(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* the real shop, as `summarize` wants it */
const LISTS = { frame: D.FRAMES, logo: D.LOGOS, cursor: D.CURSORS, scheme: D.SCHEMES, pot: D.POTS, seed: D.SPECIES, wall: D.WALLS,
                crayon: D.CRAYON, garage: D.GARAGE, drink: D.DRINKS, elephant: D.ELEPHANT };
const START = { frame: ['beige'], logo: ['temple'], cursor: ['stock'], scheme: ['vga'], pot: ['terra'], seed: ['sunshoot'], wall: [], crayon: [], garage: [], drink: ['jager'], elephant: [] };
const clone = o => JSON.parse(JSON.stringify(o));
const find = (cat, id) => LISTS[cat].find(i => i.id === id);
const buy = (st, cat, id) => { st[cat].push(id); return st; };
const all = () => { const o = {}; Object.keys(LISTS).forEach(c => { o[c] = LISTS[c].map(i => i.id); }); return o; };
const total = Object.keys(LISTS).reduce((n, c) => n + LISTS[c].length, 0);
say('the shop: ' + total + ' things on ' + Object.keys(LISTS).length + ' shelves');

/* ---- the visit ----------------------------------------------------------------------------------------------------------- */
{
  const before = clone(START);
  const after = clone(START);
  buy(after, 'cursor', 'bone'); buy(after, 'frame', 'wood');
  const v = summarize(before, after, LISTS, 30000);
  ok(v.count === 2, 'two things bought (' + v.count + ')');
  ok(v.spent === find('cursor', 'bone').price + find('frame', 'wood').price, 'the spend is the prices (' + v.spent + ')');
  ok(v.top.id === 'wood', 'the dearest of them is the top');
  ok(v.lifeSpent === v.spent, 'with nothing before, the lifetime is this visit (' + v.lifeSpent + ')');
  ok(v.owned === 7 + 2 && v.total === total && v.left === total - 9, 'owned ' + v.owned + ' / ' + v.total);
  ok(summarize(before, before, LISTS, 5).count === 0, 'nothing bought is nothing');
  ok(summarize(after, after, LISTS, 5).lifeSpent === v.spent && summarize(after, after, LISTS, 5).count === 0, 'what was bought before is not bought now');
  ok(summarize(null, null, LISTS, 0).owned === 0, 'an empty save does not throw');
  ok(summarize(START, { frame: ['beige', 'nonesuch'] }, LISTS, 0).owned === 1, 'an id the shop does not sell is not counted');
}

/* ---- which tier -------------------------------------------------------------------------------------------------------------
   a visit by hand: how long it was, what was bought, what was owned before */
function visit(ms, buys, had) {
  const before = clone(START);
  (had || []).forEach(([c, i]) => buy(before, c, i));
  const after = clone(before);
  (buys || []).forEach(([c, i]) => buy(after, c, i));
  return summarize(before, after, LISTS, ms);
}
const cheap = ['cursor', 'bone'], cheap2 = ['cursor', 'jade'], mid = ['frame', 'wood'], big = ['frame', 'lunar'];
const cases = [
  ['a blink and nothing',                  visit(1500, []),                                          'blink'],
  ['a blink with a history',               visit(1500, [], [cheap]),                                 'blink'],
  ['just under a blink',                   visit(BLINK_MS - 1, []),                                  'blink'],
  ['a real visit, nothing, never bought',  visit(BLINK_MS, []),                                      'never'],
  ['a long visit, nothing, never bought',  visit(600000, []),                                        'never'],
  ['a real visit, nothing, has bought',    visit(60000, [], [cheap, mid]),                           'nothing'],
  ['one cheap thing',                      visit(60000, [cheap]),                                    'little'],
  ['two cheap things',                     visit(60000, [cheap, cheap2]),                            'little'],
  ['a quick buy still counts',             visit(900, [cheap]),                                      'little'],
  ['a fair spend in one',                  visit(60000, [mid]),                                      'fair'],
  ['three small things',                   visit(60000, [cheap, cheap2, ['cursor', 'plasma']]),      'fair'],
  ['one big thing',                        visit(60000, [big]),                                      'lot'],
  ['a spend at the line',                  null, 'edge'],
  ['everything, in a blink',               summarize(START, all(), LISTS, 100),                      'everything'],
  ['everything, owned long ago, no buy',   summarize(all(), all(), LISTS, 100),                      'everything'],
  ['everything, owned long ago, a long visit', summarize(all(), all(), LISTS, 90000),                'everything']
];
cases.forEach(([name, v, want]) => {
  if (want === 'edge') return;
  ok(tierOf(v) === want, name + ': ' + tierOf(v) + ' (wanted ' + want + ')');
});
{
  /* the lines: counts and sums on either side of each */
  const fake = (count, spent, extra) => Object.assign({ bought: [], count, spent, top: count ? { name: 'THE LUNAR LANDER', price: spent } : null, lifeSpent: spent, owned: 7 + count, total, left: total - 7 - count, ms: 60000 }, extra || {});
  ok(tierOf(fake(1, FAIR_SPEND - 1)) === 'little', 'a spend just under fair is little');
  ok(tierOf(fake(1, FAIR_SPEND)) === 'fair', 'a spend at fair is fair');
  ok(tierOf(fake(FAIR_COUNT - 1, 100)) === 'little', 'a count just under fair is little');
  ok(tierOf(fake(FAIR_COUNT, 100)) === 'fair', 'a count at fair is fair');
  ok(tierOf(fake(1, LOT_SPEND - 1)) === 'fair', 'a spend just under a lot is fair');
  ok(tierOf(fake(1, LOT_SPEND)) === 'lot', 'a spend at a lot is a lot');
  ok(tierOf(fake(LOT_COUNT - 1, 100)) === 'fair', 'a count just under a lot is fair');
  ok(tierOf(fake(LOT_COUNT, 100)) === 'lot', 'a count at a lot is a lot');
  ok(tierOf(fake(1, 100, { owned: total })) === 'everything', 'every shelf bare, whatever the visit');
  ok(tierOf(fake(0, 0, { total: 0, owned: 0, lifeSpent: 0 })) === 'blink' || tierOf(fake(0, 0, { total: 0, owned: 0, lifeSpent: 0, ms: 90000 })) === 'never', 'a shop of nothing is not "everything"');
}

/* ---- the lines ------------------------------------------------------------------------------------------------------------- */
const REP = {            /* a visit for each tier, plus the worst case for how long a line can get */
  blink: [visit(900, [])],
  never: [visit(60000, [])],
  nothing: [visit(60000, [], [cheap])],
  little: [visit(60000, [cheap]), visit(60000, [cheap, cheap2])],
  fair: [visit(60000, [mid]), visit(60000, [cheap, cheap2, ['cursor', 'plasma']])],
  lot: [visit(60000, [big]), visit(60000, [['frame', 'gold']]), visit(60000, Object.keys(LISTS).flatMap(c => LISTS[c].slice(1, 3).map(i => [c, i.id])))],
  everything: [summarize(START, all(), LISTS, 100), summarize(all(), all(), LISTS, 90000)]
};
const longestName = Object.keys(LISTS).flatMap(c => LISTS[c]).reduce((a, b) => (b.name.length > a.name.length ? b : a)).name;
const WORST = { bought: [], count: 107, spent: 196239, top: { name: longestName, price: 99999 }, lifeSpent: 196239, owned: 107, total: 107, left: 0, ms: 600000 };
const seenText = new Map();
let linesTotal = 0;
TIERS.forEach(t => {
  ok(!!POOLS[t] && !!VOICES[t], 'tier ' + t + ' has a pool and a voice');
  const vs = REP[t];
  vs.forEach(v => {
    ok(tierOf(v) === t, 'representative visit of ' + t + ' is ' + tierOf(v));
    const lines = linesFor(v);
    ok(lines.length >= 6, t + ': at least six lines apply (' + lines.length + ')');
    lines.forEach(l => {
      ok(l.length <= FAREWELL_MAX, t + ': too long for the box (' + l.length + ' > ' + FAREWELL_MAX + '): ' + l);
      ok(l === l.toUpperCase(), t + ': not in capitals: ' + l);
      ok(!/undefined|NaN|\[object|null|Infinity/.test(l), t + ': a hole in a line: ' + l);
      ok(!/[‘’“”]/.test(l), t + ': a curly quote in: ' + l);
    });
    ok(new Set(lines).size === lines.length, t + ': a line is there twice');
  });
  const base = linesFor(vs[0]);
  linesTotal += POOLS[t].length;
  base.forEach(l => { ok(!seenText.has(l) || seenText.get(l) === t, 'a line is in two tiers: ' + l); seenText.set(l, t); });
  /* the worst case a line can be filled with, for the tier's own pool */
  POOLS[t].forEach(e => {
    const l = typeof e === 'function' ? e(Object.assign({}, WORST)) : e;
    if (l) ok(l.length <= FAREWELL_MAX, t + ': the worst case is too long (' + l.length + '): ' + l);
  });
});
say('farewell lines: ' + TIERS.map(t => t + ' ' + POOLS[t].length).join(', ') + '  (' + linesTotal + ' in all)');

/* a line that names the thing, or the total, says the real one */
{
  const v = visit(60000, [['frame', 'lunar']]);
  const spent = find('frame', 'lunar').price;
  ok(v.spent === spent, 'the lunar lander costs ' + spent);
  ok(tierOf(v) === 'fair' || tierOf(v) === 'lot', 'the lunar lander is fair or a lot (' + tierOf(v) + ')');
  ok(linesFor(v).some(l => l.indexOf(num(spent)) >= 0), 'a line says what you spent: ' + num(spent));
  ok(linesFor(v).some(l => l.indexOf('LUNAR LANDER') >= 0), 'a line says what you bought');
  const w = visit(60000, [], [cheap, mid]);
  ok(linesFor(w).some(l => l.indexOf(num(w.lifeSpent)) >= 0), 'a sulk says the lifetime total: ' + num(w.lifeSpent));
  ok(num(4300) === '4,300' && num(196239) === '196,239' && num(0) === '0' && num(999) === '999' && num(1000) === '1,000', 'numbers get their commas');
}

/* picking: by the dice, never the same line twice running, every line reachable, and the voice is the tier's */
{
  TIERS.forEach(t => {
    const v = REP[t][0], pool = linesFor(v), r = dice(31 + t.length);
    let last = null, repeats = 0;
    const heard = new Set();
    for (let i = 0; i < 3000; i++) {
      const p = pickFarewell(v, r, last);
      if (p.tier !== t) { fails++; console.log('FAIL  picked from the wrong tier: ' + p.tier + ' for ' + t); break; }
      if (p.voice !== VOICES[t]) { fails++; console.log('FAIL  wrong voice for ' + t); break; }
      if (p.text === last) repeats++;
      last = p.text; heard.add(p.text);
    }
    ok(repeats === 0, t + ': never the same line twice running (' + repeats + ')');
    ok(heard.size === pool.length, t + ': every line is reachable (' + heard.size + ' of ' + pool.length + ')');
  });
  ok(pickFarewell(REP.lot[0], () => 0, null).text === linesFor(REP.lot[0])[0], 'the dice is the one passed in');
  ok(pickFarewell(REP.lot[0], () => 0.999999, null).text === linesFor(REP.lot[0]).slice(-1)[0], 'the last line is reachable by the dice');
  const solo = pickFarewell(REP.blink[0], () => 0, linesFor(REP.blink[0])[0]);
  ok(solo.text !== linesFor(REP.blink[0])[0], 'the line he said last time is skipped');
}

/* ---- the babble ------------------------------------------------------------------------------------------------------------ */
{
  const TEXT = 'YOU SPENT 4,300 ON A SPOON. WHY? I DON\'T KNOW! BUT I LOVE IT, TRULY.';
  const a = voicePlan(TEXT, dice(5), VOICES.lot), b = voicePlan(TEXT, dice(5), VOICES.lot), c = voicePlan(TEXT, dice(6), VOICES.lot);
  ok(JSON.stringify(a) === JSON.stringify(b), 'the same dice, the same babble');
  ok(JSON.stringify(a) !== JSON.stringify(c), 'a different dice, a different babble');
  ok(a.events.length === TEXT.length, 'one event per letter typed');
  ok(a.events.map(e => e.ch).join('') === TEXT, 'the letters are the text');
  let sounded = 0, letters = 0;
  a.events.forEach((e, i) => {
    const ch = TEXT[i];
    if (/[ ,.!?;:'\-]/.test(ch)) ok(e.sound === null, 'silence on "' + ch + '" (index ' + i + ')');
    else letters++;
    if (e.sound) {
      sounded++;
      const s = e.sound;
      ['f0', 'f1', 'dur', 'gain', 'bend'].forEach(k => ok(Number.isFinite(s[k]) && s[k] > 0, 'a sound has a positive ' + k + ' (' + s[k] + ') at ' + i));
      ok(Number.isFinite(s.f2) && s.f2 >= 0, 'a sound has a finite f2');
      ok(s.f0 >= 60 && s.f0 <= 700, 'pitch is a voice (' + Math.round(s.f0) + ' Hz) at ' + i);
      ok(s.dur >= 0.02 && s.dur <= 0.2, 'a blip is a few hundredths of a second (' + s.dur + ')');
      ok(s.gain > 0 && s.gain <= 2, 'gain is sane (' + s.gain + ')');
      ok('vpfn'.indexOf(s.k) >= 0, 'a known kind of sound: ' + s.k);
    }
    ok(Number.isInteger(e.ms) && e.ms >= 1 && e.ms <= 1000, 'a wait of a sensible number of milliseconds (' + e.ms + ')');
  });
  ok(sounded >= letters * 0.6 && sounded <= letters, 'most letters make a sound, not all (' + sounded + ' of ' + letters + ')');
  /* a full stop waits longer than a comma, which waits longer than a letter or a space */
  const wait = ch => { const i = TEXT.indexOf(ch); return a.events[i].ms; };
  ok(wait('.') > wait(',') && wait(',') > wait(' ') * 2 && wait('.') > wait('Y') * 4, 'a stop waits longer than a comma, a comma longer than a letter (' + wait('.') + ', ' + wait(',') + ', ' + wait(' ') + ')');
  ok(a.ms === a.events.reduce((n, e) => n + e.ms, 0), 'the total is the sum');
  ok(a.ms < 8000 && a.ms > 1000, 'a sixty-nine letter line takes a few seconds (' + a.ms + ' ms)');
  const longest = 'X'.repeat(0) + 'A'.repeat(FAREWELL_MAX);
  ok(voicePlan(longest, dice(1), VOICES.everything).ms < 8000, 'the longest line at the slowest voice takes less than eight seconds (' + voicePlan(longest, dice(1), VOICES.everything).ms + ')');
  ok(voicePlan('', dice(1)).events.length === 0 && voicePlan('', dice(1)).ms === 0, 'no text, no babble');
  ok(voicePlan('...', dice(1)).events.every(e => e.sound === null), 'nothing but stops is all silence');
  ok(voicePlan('A? A! 7 3', dice(1)).events.length === 9, 'digits and shouts do not throw');
}

/* a vowel is a different mouth from another vowel; a question climbs; a shout is loud; the sentence sags */
{
  const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const vowels = (plan, from, to) => plan.events.slice(from, to).filter(e => e.sound && e.sound.k === 'v').map(e => e.sound);
  const Q = 'WHAT DO YOU WANT FROM ME TODAY?', S = 'WHAT DO YOU WANT FROM ME TODAY.', X = 'WHAT DO YOU WANT FROM ME TODAY!';
  const rises = [];
  let qLast = [], qFirst = [], sLast = [], xGain = [], sGain = [], first = [], last = [];
  for (let seed = 1; seed <= 400; seed++) {
    const q = voicePlan(Q, dice(seed), { pitch: 1, wobble: 0.15, rate: 1 }), s = voicePlan(S, dice(seed), { pitch: 1, wobble: 0.15, rate: 1 }), x = voicePlan(X, dice(seed), { pitch: 1, wobble: 0.15, rate: 1 });
    const w = Q.lastIndexOf(' ') + 1;
    const qv = vowels(q, w, Q.length).map(s => s.f0);
    qLast.push(...qv); qFirst.push(...vowels(q, 0, 8).map(s => s.f0)); rises.push(qv[qv.length - 1] / qv[0]);
    sLast.push(...vowels(s, w, S.length).map(s => s.f0));
    xGain.push(...vowels(x, w, X.length).map(s => s.gain)); sGain.push(...vowels(s, w, S.length).map(s => s.gain));
    first.push(...vowels(s, 0, 10).map(s => s.f0)); last.push(...vowels(s, 18, S.length - 1).map(s => s.f0));
  }
  ok(mean(rises) > 1.1, 'a question climbs through its last word (the last vowel is ' + mean(rises).toFixed(2) + ' times the first)');
  ok(mean(qLast) > mean(sLast) * 1.2, 'a question ends higher than a statement (' + Math.round(mean(qLast)) + ' vs ' + Math.round(mean(sLast)) + ')');
  ok(mean(xGain) > mean(sGain) * 1.15, 'a shout is louder than a statement (' + mean(xGain).toFixed(2) + ' vs ' + mean(sGain).toFixed(2) + ')');
  ok(mean(last) < mean(first), 'a statement sags across its sentence (' + Math.round(mean(first)) + ' -> ' + Math.round(mean(last)) + ' Hz)');
  /* the voices differ: a pitch of 1.28 is above one of 0.8, and his own is where PITCH says */
  const pitch = v => mean(vowels(voicePlan('A'.repeat(50), dice(3), v), 0, 50).map(s => s.f0));
  ok(pitch(VOICES.blink) > pitch(VOICES.everything) * 1.4, 'the blink voice is higher than the dazed one (' + Math.round(pitch(VOICES.blink)) + ' vs ' + Math.round(pitch(VOICES.everything)) + ')');
  ok(Math.abs(pitch({ pitch: 1, wobble: 0.15, rate: 1 }) - PITCH) < PITCH * 0.2, 'his own pitch is about ' + PITCH + ' Hz (' + Math.round(pitch({ pitch: 1, wobble: 0.15, rate: 1 })) + ')');
  const dur = v => voicePlan('A'.repeat(50), dice(3), v).ms;
  ok(dur(VOICES.everything) > dur(VOICES.lot) * 1.4, 'the dazed voice is slower than the excited one (' + dur(VOICES.everything) + ' vs ' + dur(VOICES.lot) + ' ms)');
  ok(Math.abs(dur({ pitch: 1, wobble: 0.1, rate: 1 }) - 50 * BASE_MS) < 50 * BASE_MS * 0.1, 'at his own rate a letter is about ' + BASE_MS + ' ms');
  /* an A and an I are different mouths */
  const f1 = L => voicePlan(L.repeat(20), dice(2), { pitch: 1, wobble: 0.1, rate: 1 }).events.filter(e => e.sound).map(e => e.sound.f1);
  ok(mean(f1('A')) > mean(f1('I')) * 1.8, 'an A has a wider first formant than an I (' + Math.round(mean(f1('A'))) + ' vs ' + Math.round(mean(f1('I'))) + ')');
  /* every letter of the alphabet, every digit and the odd character is planned without a hole */
  const kinds = new Set();
  voicePlan('ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 \'"()&%$#', dice(4), VOICES.never).events.forEach(e => { if (e.sound) kinds.add(e.sound.k); });
  ok(kinds.size === 4, 'vowels, pops, hisses and hums are all there (' + [...kinds].join('') + ')');
}

console.log(fails ? '\n' + fails + ' FAILED' : '\nOK  check-farewell');
process.exit(fails ? 1 : 0);
