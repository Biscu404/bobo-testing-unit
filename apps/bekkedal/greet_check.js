/* Bekkedal greeting check — `node apps/bekkedal/greet_check.js`
 *
 * The greetings (greet.js) are a layer in front of every ordinary conversation, so what they
 * promise is checked over a long simulated acquaintance rather than read:
 *   words    — every one of the eight who talk has every pool, no line names its own speaker, {n} appears
 *              only where there is a day count to put in it, and every face asked for is one the rig has;
 *   firsts   — the first time you speak to somebody on a given day they say hello most of the time (and not
 *              always: a greeting every single time is a recording), in the voice of the hour;
 *   agains   — the second and later times that day they say hello *again*, most of the time;
 *   absence  — four days or more and it is said, every time, and a longer absence says more;
 *   strangers— somebody you have never spoken to says nothing before their own first words;
 *   the same — the answer is a function of the save: asked twice, it says the same thing. */
import { BEK_GREET, greeting, greetingKind, AWAY_AT, dayPart, GREET_FIRST_PCT, GREET_AGAIN_PCT } from './greet.js';
import { BEK_NPCS, BEK_TALK } from './data.js';
import { PORT_MOODS } from './portrait.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(54) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

const talkers = BEK_NPCS.filter(n => n.n && BEK_TALK[n.id]).map(n => n.id);
const names = BEK_NPCS.map(n => n.n).filter(Boolean);
const lineStrings = l => typeof l === 'string' ? [l] : [l.no, l.en].filter(Boolean);
const flat = e => Array.isArray(e) ? e.flatMap(flat) : (e && typeof e === 'object' && !(e.no || e.en)) ? Object.values(e).flatMap(flat) : [e];

/* ---- words --------------------------------------------------------------- */
console.log('-- words --');
let missing = [], prefixed = [], braces = [], moodBad = [], onlyOne = [];
for (const id of talkers) {
  const g = BEK_GREET[id];
  if (!g) { missing.push(id + ' (all)'); continue; }
  const need = [['first.morning', g.first && g.first.morning, 2], ['first.day', g.first && g.first.day, 2], ['first.evening', g.first && g.first.evening, 2],
                ['first.night', g.first && g.first.night, 1], ['close', g.close, 2], ['again', g.again, 3],
                ['away.few', g.away && g.away.few, 2], ['away.many', g.away && g.away.many, 2], ['away.long', g.away && g.away.long, 1]];
  for (const [k, pool, min] of need) if (!Array.isArray(pool) || pool.length < min) missing.push(id + '.' + k);
  for (const [k, pool] of need) for (const e of flat(pool || [])) {
    const asObj = typeof e === 'string' ? { no: e, en: e } : e;
    if (!asObj.no && !asObj.en) { missing.push(id + '.' + k + ' (an empty line)'); continue; }
    if (asObj.no && !asObj.en) onlyOne.push(id + '.' + k);
    lineStrings(e).forEach(str => {
      if (names.some(n => str.startsWith(n + ': '))) prefixed.push(id + '.' + k + ': ' + str.slice(0, 30));
      if (str.includes('{n}') && !k.startsWith('away')) braces.push(id + '.' + k + ': ' + str.slice(0, 30));
    });
    if (e.m && !PORT_MOODS.includes(e.m)) moodBad.push(id + '.' + k + ' ' + e.m);
  }
}
ok(!missing.length, 'every one of the eight has every pool', missing.join(', '));
ok(!prefixed.length, 'no greeting is addressed by its own speaker', prefixed.join(', '));
ok(!braces.length, '{n} is only used where there is a day count', braces.join(', '));
ok(!moodBad.length, 'every face a greeting asks for is on the rig', moodBad.join(', '));
ok(!onlyOne.length, 'a Norwegian line always comes with its English', onlyOne.slice(0, 4).join(', '));

/* ---- the simulation -------------------------------------------------------
   A player who speaks to somebody on most days, more than once on some, with gaps now and then. */
console.log('\n-- over a long acquaintance --');
const mkS = (day, min, last, fr, ix) => ({ day, min, lastTalk: last == null ? {} : { x: last }, fr: { x: fr }, chatIx: { x: ix } });
const rig = id => ({ day: 0, min: 0, lastTalk: {}, fr: {}, chatIx: {}, id });
let firstN = 0, firstSaid = 0, againN = 0, againSaid = 0, awayN = 0, awayMiss = 0, dayParts = new Set(), shortN = 0, shortAway = 0;
let awayKinds = new Set();
for (const id of talkers) {
  const S = rig(id); S.lastTalk = {}; S.fr = { [id]: 4 }; S.chatIx = {};
  let seed = 7 + id.length * 13, rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  let nextAbsence = 0;
  for (let day = 1; day <= 800; day++) {
    S.day = day;
    if (day < nextAbsence) continue;
    if (rnd() < 0.04) { nextAbsence = day + 3 + Math.floor(rnd() * 22); continue; }
    const visits = 1 + (rnd() < 0.4 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0);
    for (let v = 0; v < visits; v++) {
      S.min = 6 * 60 + Math.floor(rnd() * 20 * 60);
      const last = S.lastTalk[id], kind = greetingKind(id, S);
      if (last != null) {
        if (S.day - last >= AWAY_AT.few) { awayN++; if (!kind || !['few', 'many', 'long'].includes(kind)) awayMiss++; else awayKinds.add(kind); }
        else if (S.day === last) { againN++; if (kind === 'again') againSaid++; }
        else { firstN++; if (kind === 'first' || kind === 'close') { firstSaid++; if (kind === 'first') dayParts.add(dayPart(S.min)); } }
        if (S.day - last >= 1 && S.day - last < AWAY_AT.few) { shortN++; if (['few', 'many', 'long'].includes(kind)) shortAway++; }
      }
      const a = greeting(id, S), b = greeting(id, S);
      if (JSON.stringify(a) !== JSON.stringify(b)) ok(false, 'the same save says the same thing', id + ' day ' + day);
      S.lastTalk[id] = S.day; S.chatIx[id] = (S.chatIx[id] || 0) + 1;
    }
  }
}
const pct = (a, b) => (100 * a / Math.max(1, b));
ok(firstN > 2000 && pct(firstSaid, firstN) >= GREET_FIRST_PCT - 5 && pct(firstSaid, firstN) <= GREET_FIRST_PCT + 5,
   'the first time today: hello, most of the time', pct(firstSaid, firstN).toFixed(1) + '% of ' + firstN + ' (aiming at ' + GREET_FIRST_PCT + ')');
ok(againN > 500 && pct(againSaid, againN) >= GREET_AGAIN_PCT - 6 && pct(againSaid, againN) <= GREET_AGAIN_PCT + 6,
   'the second time today: hello again, most of the time', pct(againSaid, againN).toFixed(1) + '% of ' + againN + ' (aiming at ' + GREET_AGAIN_PCT + ')');
ok(awayN > 100 && awayMiss === 0, 'four days away or more: always remarked on', awayN + ' absences, ' + awayMiss + ' missed');
ok(awayKinds.size === 3, 'and a longer absence says more (few, many, long all reached)', [...awayKinds].join(', '));
ok(shortAway === 0, 'a day or three away is not made a fuss of', shortAway + ' of ' + shortN);
ok(dayParts.size === 4, 'the voice of the hour: morning, day, evening and night all reached', [...dayParts].join(', '));

/* ---- strangers, and the voice of friendship -------------------------------- */
console.log('\n-- strangers and friends --');
let strangerSpoke = 0;
for (const id of talkers) for (const day of [1, 5, 40]) if (greeting(id, { day, min: 700, lastTalk: {}, fr: {}, chatIx: {} }).length) strangerSpoke++;
ok(strangerSpoke === 0, 'somebody you have never spoken to says nothing first', strangerSpoke + ' did');
let closeReached = 0, closeWrong = 0;
for (const id of talkers) for (let day = 2; day < 300; day++) {
  const lowK = greetingKind(id, { day, min: 700, lastTalk: { [id]: day - 1 }, fr: { [id]: 2 }, chatIx: { [id]: 0 } });
  if (lowK === 'close') closeWrong++;
  if (greetingKind(id, { day, min: 700, lastTalk: { [id]: day - 1 }, fr: { [id]: 8 }, chatIx: { [id]: 0 } }) === 'close') closeReached++;
}
ok(closeWrong === 0 && closeReached > 0, 'the warmer hello is for people who like you', closeReached + ' warm hellos at friendship 8, ' + closeWrong + ' at 2');
const sample = greeting('astrid', { day: 30, min: 700, lastTalk: { astrid: 20 }, fr: { astrid: 3 }, chatIx: { astrid: 5 } });
ok(sample.length > 0 && JSON.stringify(sample).includes('10'), 'an absence says how many days', JSON.stringify(sample).slice(0, 80));

console.log('\n' + (fails ? fails + ' of ' + checks + ' greeting checks FAILED' : 'All ' + checks + ' greeting checks pass.'));
process.exit(fails ? 1 : 0);
