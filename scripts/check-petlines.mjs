#!/usr/bin/env node
/* The desktop elephant's words, held to their numbers (pure Node: no DOM, no audio, no clock, a seeded dice).
     - at least fifty lines more than the sixteen he started with, none said twice
     - a goodbye for the day and for the late hours (he says one just before he lies down), and a few ways to wake
     - every line (whatever the desk looks like) is a string, fits the bubble, and is in his voice: lowercase, plain, on your side
   The pet that plays them is kernel/pet.js.   Run: node scripts/check-petlines.mjs */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const L = await import(pathToFileURL(path.join(ROOT, 'kernel/pet_lines.js')));
const V = await import(pathToFileURL(path.join(ROOT, 'kernel/pet_visit.js')));
const { LINES, PUSH_LINES, GOODBYES_DAY, GOODBYES_NIGHT, WAKES, WAKES_NEAR, HOME_LINES, DOOR_LINES, CHEESE_LINES, CHEESE_DONE, choose } = L;

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL  ' + m); } };
const MAX = 110;                          /* the bubble is 230 px wide: about four lines of this font */

const DESKS = [
  { icons: 0, sun: 0, wins: 0, hour: 3 }, { icons: 8, sun: 1, wins: 1, hour: 7 }, { icons: 22, sun: 250, wins: 2, hour: 13 },
  { icons: 40, sun: 99999, wins: 6, hour: 19 }, { icons: 200, sun: 12, wins: 0, hour: 23 }
];
const everyLine = pool => {
  const out = [];
  pool.forEach((x, i) => DESKS.forEach(d => out.push([i, typeof x === 'function' ? x(d) : x])));
  return out;
};

const OLD = 16;
ok(LINES.length >= OLD + 50, 'at least fifty more idle lines than the sixteen he began with (' + LINES.length + ')');
ok(GOODBYES_DAY.length >= 8 && GOODBYES_NIGHT.length >= 5, 'goodbyes: ' + GOODBYES_DAY.length + ' for the day, ' + GOODBYES_NIGHT.length + ' for the late hours');
ok(WAKES.length >= 3 && WAKES_NEAR.length >= 2 && HOME_LINES.length >= 2 && DOOR_LINES.length >= 2 && PUSH_LINES.length >= 5, 'enough ways to wake, go in, open the door and push an icon');
ok(CHEESE_LINES.length >= 6 && CHEESE_DONE.length >= 3 && new Set(CHEESE_LINES.concat(CHEESE_DONE)).size === CHEESE_LINES.length + CHEESE_DONE.length, 'and to eat cheese: ' + CHEESE_LINES.length + ' things to say over a wedge and ' + CHEESE_DONE.length + ' for the last, none twice');

const seen = new Map();
const pools = { LINES, PUSH_LINES, GOODBYES_DAY, GOODBYES_NIGHT, WAKES, WAKES_NEAR, HOME_LINES, DOOR_LINES, CHEESE_LINES, CHEESE_DONE };
for (const [name, pool] of Object.entries(pools)) {
  everyLine(pool).forEach(([i, t]) => {
    ok(typeof t === 'string' && t.length > 3, name + '[' + i + '] answers a line');
    ok(t.length <= MAX, name + '[' + i + '] fits the bubble (' + t.length + '): ' + t);
    ok(!/[A-Z]/.test(t), name + '[' + i + '] is in his lowercase voice: ' + t);
    ok(!/undefined|NaN|\[object/.test(t), name + '[' + i + '] has no hole in it: ' + t);
  });
}
/* no line twice, within the idle pool, on any one desk (a line that changes with the desk is the same line) */
DESKS.forEach(d => {
  const lines = LINES.map(x => (typeof x === 'function' ? x(d) : x));
  ok(new Set(lines).size === lines.length, 'no idle line is the same as another on the desk ' + JSON.stringify(d));
});
ok(new Set(GOODBYES_DAY.concat(GOODBYES_NIGHT)).size === GOODBYES_DAY.length + GOODBYES_NIGHT.length, 'no goodbye twice');

/* the voice: he is on your side. A good share of the idle lines address you, and a few of them are the ones from his window */
const addr = /\b(you|your|pal|friend|kiddo)\b/;
const share = LINES.filter(x => addr.test(typeof x === 'function' ? x(DESKS[2]) : x)).length / LINES.length;
ok(share >= 0.6, 'most of what he says is said to you (' + Math.round(share * 100) + '%)');
ok(GOODBYES_DAY.concat(GOODBYES_NIGHT).filter(t => addr.test(t)).length >= 10, 'his goodbyes are warm, said to you');
ok(LINES.some(x => /believe in you/.test(typeof x === 'function' ? x(DESKS[0]) : x)), 'he believes in you, as he does in his window');

/* the picker reaches every line and the first and the last, and the deterministic dice agree */
const rnd = (() => { let a = 7; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
const hit = new Set();
for (let i = 0; i < 6000; i++) hit.add(choose(LINES, rnd, DESKS[1]));
ok(hit.size >= LINES.length - 4, 'a long chat reaches almost every line (' + hit.size + ' of ' + LINES.length + ')');
ok(choose(LINES, () => 0.999999999, DESKS[1]) === (typeof LINES[LINES.length - 1] === 'function' ? LINES[LINES.length - 1](DESKS[1]) : LINES[LINES.length - 1]), 'the dice cannot fall off the end');

/* ---- going to where you are (kernel/pet_visit.js) ---------------------------------------------------------------------------------------- */
{
  const flat = (name, t) => Object.entries(t).forEach(([app, pool]) => pool.forEach((x, i) => {
    ok(typeof x === 'string' && x.length > 3 && x.length <= MAX, name + '.' + app + '[' + i + '] fits the bubble (' + x.length + ')');
    ok(!/[A-Z]/.test(x), name + '.' + app + '[' + i + '] is in his lowercase voice: ' + x);
  }));
  flat('ENTER', V.ENTER); flat('WATCH', V.WATCH);
  const lists = { CHEER: V.CHEER, BIG_CHEER: V.BIG_CHEER, NAP: V.NAP, LEAVE: V.LEAVE, FOLLOW: V.FOLLOW, OUT_WHEN_SHUT: V.OUT_WHEN_SHUT };
  Object.entries(lists).forEach(([n, pool]) => { ok(pool.length >= 2, n + ' has more than one way to say it'); pool.forEach((x, i) => { ok(x.length <= MAX && !/[A-Z]/.test(x), n + '[' + i + '] fits and is lowercase: ' + x); }); });
  const games = Object.keys(V.GAMES);
  games.filter(a => a !== 'defrag').forEach(a => { ok((V.ENTER[a] || []).length >= 2 && (V.WATCH[a] || []).length >= 3, a + ' has its own words for coming in and for watching'); });
  ok(V.ENTER._.length >= 3 && V.WATCH._.length >= 3, 'every other app falls back on general words');
  ok(V.VISIT_RATE >= 0.8 && V.VISIT_RATE < 1, 'he goes to the window in use almost always, not always (' + V.VISIT_RATE + ')');
  /* who he visits */
  const w = (appId, o) => Object.assign({ appId: appId, hidden: false, active: false, z: 100 }, o || {});
  ok(V.pickTarget([]) === null && V.pickTarget(null) === null, 'no window, nowhere to go');
  ok(V.pickTarget([w('elephant', { active: true }), w('placeholder'), w('about')]) === null, 'not his own window, not a dialog');
  ok(V.pickTarget([w('notes', { z: 105 }), w('sweeper', { z: 101, active: true })]).appId === 'sweeper', 'the window in front is the one he goes to');
  ok(V.pickTarget([w('notes', { z: 109 }), w('sweeper', { z: 101 })]).appId === 'sweeper', 'with none in front, a game outranks a tool');
  ok(V.pickTarget([w('notes', { z: 109 }), w('terminal', { z: 120 })]).appId === 'terminal', 'two tools: the higher');
  ok(V.pickTarget([w('sweeper', { hidden: true, active: true }), w('notes')]).appId === 'notes', 'a window put away is not visited');
  const rnd = (() => { let a = 3; return () => { a = (a * 1103515245 + 12345) >>> 0; return a / 4294967296; }; })();
  const got = new Set(); for (let i = 0; i < 400; i++) got.add(V.lineFor(V.WATCH, 'sweeper', rnd, null));
  ok(got.size >= V.WATCH.sweeper.length, 'a long visit to the sweeper says all of what he has to say about it (' + got.size + ')');
  ok(V.lineFor(V.WATCH, 'nosuchapp', () => 0.5, null).length > 3, 'an unknown app gets a general word');
  const seen2 = V.WATCH.sweeper.concat(V.WATCH._).filter(t => t !== V.WATCH.sweeper[0]);
  ok(V.lineFor(V.WATCH, 'sweeper', () => 0, [V.WATCH.sweeper[0]]) !== V.WATCH.sweeper[0] && seen2.length > 0, 'he does not repeat a line he has just said');
}

console.log(fails ? fails + ' FAILED' : 'PET LINES OK  (' + LINES.length + ' idle lines, ' + (GOODBYES_DAY.length + GOODBYES_NIGHT.length) + ' goodbyes, ' + (WAKES.length + WAKES_NEAR.length) + ' wakings)');
process.exit(fails ? 1 : 0);
