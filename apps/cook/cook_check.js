/* THE COOK's words, voice and music, held to account: node apps/cook/cook_check.js (pure Node)
   - the story is in the order it happened, every card fits its box, every card is read exactly once and every bench has its cards;
   - Jesse has something to say about everything he is asked to react to, every line fits the box it is shown in, and nothing is said
     twice in a pool;
   - his voice is a function of the line (silent on spaces, a sound on every vowel, a rise on a question, louder on a shout);
   - the score builds, is sixteen bars, is in D, uses only instruments the machine has, in the range they have, and every layer is
     really a layer. */
import { readFileSync } from 'node:fs';
import * as L from '../../kernel/songtext.js';
import { CK_STORY, CK_END, STORY_AT, owed } from './story.js';
import { CK_LV } from './data.js';
import { kidPool, KID_TAGS, KID_MORE } from './lines.js';
import { moodFor } from './jesse.js';
import { blip } from './voice.js';
import { IDS, LAYERS, BARS, song, stinger, layersFor, levelsFor, TUNE_OF } from './score.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };

/* ---- the story -------------------------------------------------------------------------------------------------------------------- */
const SCENES = ['class', 'rv', 'desert', 'glass', 'meet', 'badge', 'blue', 'car', 'lab', 'blast', 'book', 'hole', 'empty'];
const SEASON = [1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5];             /* the season of the show each card is from: never goes backwards */
ok(CK_STORY.length === 13 && SEASON.length === CK_STORY.length, 'thirteen chapters');
CK_STORY.forEach((c, i) => {
  ok(c.l.length >= 4 && c.l.length <= 5, 'chapter ' + i + ' (' + c.t + '): four or five lines');
  c.l.forEach(l => ok(l.length <= 60, 'chapter ' + i + ': a line is ' + l.length + ' characters, 60 at most: ' + l));
  ok(SCENES[i] === c.sc, 'chapter ' + i + ' has the picture ' + SCENES[i] + ', not ' + c.sc);
  ok(i === 0 || SEASON[i] >= SEASON[i - 1], 'chapter ' + i + ' is not earlier in the show than the one before it');
});
ok(CK_END.l.every(l => l.length <= 60), 'the ending fits');
const read = [].concat(...Object.keys(STORY_AT).sort((a, b) => a - b).map(k => STORY_AT[k]));
ok(read.length === 13 && read.every((c, i) => c === i), 'the cards are read in order, once each: ' + read.join(','));
ok(Object.keys(STORY_AT).length === 10 && STORY_AT[1].length === 3, 'the first bench is preceded by the diagnosis, Jesse and the first batch');
ok(owed(1, {}).length === 3 && owed(1, { 0: 1, 1: 1, 2: 1 }).length === 0 && owed(11, {}).length === 0, 'owed() says what a bench still owes');

/* ---- Jesse's words ------------------------------------------------------------------------------------------------------------ */
let lines = 0;
KID_TAGS().forEach(tag => {
  const pool = kidPool(tag);
  ok(pool.length > 0, tag + ': an empty pool');
  ok(new Set(pool).size === pool.length, tag + ': a line is said twice in the pool');
  pool.forEach(s => { lines++; ok(typeof s === 'string' && s.length >= 6 && s.length <= 190, tag + ': a line of ' + (s && s.length) + ' characters: ' + s); });
  ok(['flat', 'shock', 'smirk', 'wince'].indexOf(moodFor(tag)) >= 0, tag + ': a face');
});
for (let b = 1; b <= 11; b++) {
  ok(kidPool('intro_' + b).length >= 1, 'bench ' + b + ' has an introduction');
  ok(kidPool('win_L' + b).length >= 2, 'bench ' + b + ' has two things to say when it is won');
  ok(CK_LV[b - 1] && CK_LV[b - 1].id === b, 'bench ' + b + ' exists');
}
['ruin_X', 'ruin_sweep', 'wall', 'win_par', 'win_over', 'win_first', 'idle', 'stuck1', 'stuck2', 'stuck3', 'reveal', 'reset_a', 'undo_a', 'ruin_many'].forEach(t => ok(kidPool(t).length >= 3, t + ': at least three ways to say it'));
ok(Object.keys(KID_MORE).length >= 25, 'a lot of new pools');

/* ---- his voice ---------------------------------------------------------------------------------------------------------------- */
{
  const text = 'Okay, so that is a YES. Really? Do not pour the lye!';
  let sounded = 0, letters = 0;
  for (let i = 0; i < text.length; i++) {
    const b = blip(text, i), ch = text[i];
    ok(JSON.stringify(blip(text, i)) === JSON.stringify(b), 'the voice is a function of the text');
    if (/[ ,.]/.test(ch)) ok(b === null, 'a space or a stop is silent');
    if (/[aeiou]/i.test(ch)) ok(!!b && b.kind === 'vowel', 'every vowel sounds: ' + ch);
    if (/[A-Za-z]/.test(ch)) letters++;
    if (b) { sounded++; ok((b.f === 0 || (b.f > 90 && b.f < 700)) && b.ms > 5 && b.ms < 200 && b.vol > 0 && b.vol < 0.05, 'a blip is in range: ' + JSON.stringify(b)); }
  }
  ok(sounded >= letters * 0.45 && sounded <= letters * 0.9 + 3, 'about half of the letters sound (' + sounded + ' of ' + letters + ')');
  const q = blip('Really?', 6), ex = blip('Stop!', 4), caps = blip('a YES', 3), low = blip('a yes', 3);
  ok(q.kind === 'ask' && q.to > q.f, 'a question rises');
  ok(ex.kind === 'bark' && ex.to < ex.f, 'a shout barks downward');
  ok(caps.f > low.f && caps.vol > low.vol, 'a word in capitals is higher and louder');
  ok(blip('', 0) === null && blip('a', 3) === null, 'nothing past the end');
}

/* ---- the score ------------------------------------------------------------------------------------------------------------------ */
const man = JSON.parse(readFileSync(new URL('../../assets/instruments/index.json', import.meta.url), 'utf8'));
const range = {}; man.instruments.forEach(i => { range[i.id] = [i.samples[0].midi, i.samples[i.samples.length - 1].midi]; });
const KIT = new Set(man.drums.hits.map(h => h.key));
const D_MINOR = new Set([2, 4, 5, 7, 9, 10, 0, 1]);                  /* D natural minor, and the C sharp of an A chord */
const D_MAJOR = new Set([2, 4, 6, 7, 9, 11, 1, 0]);
IDS.forEach(id => {
  const s = song(L, id);
  ok(s.bars === BARS && s.key === 'D', id + ': sixteen bars in D');
  ok(s.tracks.filter(t => !t.layer).length >= 3, id + ': a core of at least three tracks');
  LAYERS.forEach(l => ok(s.tracks.some(t => t.layer === l), id + ': the layer ' + l + ' has a track'));
  ok(s.tracks.every(t => !t.layer || LAYERS.indexOf(t.layer) >= 0), id + ': only layers h1 and h2');
  let longest = 0;
  s.tracks.forEach(t => {
    if (t.inst === 'drums') { ok((t.hits || []).length > 0 && t.hits.every(h => KIT.has(h[1])), id + '/' + t.name + ': a kit with its pieces'); return; }
    ok(range[t.inst] != null, id + '/' + t.name + ': an instrument the machine has (' + t.inst + ')');
    ok(t.notes.length > 0, id + '/' + t.name + ': has notes');
    t.notes.forEach(nn => {
      ok(nn[0] >= 0 && nn[0] + nn[1] <= BARS * 4 + 0.01 && nn[1] > 0, id + '/' + t.name + ': a note inside the song');
      ok(D_MINOR.has(((nn[2] % 12) + 12) % 12), id + '/' + t.name + ': a note of D minor (' + nn[2] + ')');
      if (range[t.inst]) ok(nn[2] >= range[t.inst][0] - 12 && nn[2] <= range[t.inst][1] + 12, id + '/' + t.name + ': ' + L.midiToName(nn[2]) + ' is out of range for ' + t.inst);
      ok(nn[3] > 0 && nn[3] <= 1, id + '/' + t.name + ': a velocity');
      longest = Math.max(longest, nn[0] + nn[1]);
    });
  });
  ok(longest <= BARS * 4 + 0.01 && longest > BARS * 4 - 4, id + ': the music fills the sixteen bars (' + longest + ')');
  const lead = s.tracks[0];
  ok(Math.abs(L.textLength(lead.notes) - BARS * 4) < 0.01, id + ': the tune is exactly sixteen bars long (' + L.textLength(lead.notes) + ' beats)');
  ok(JSON.stringify(layersFor(0)) === '{"h1":false,"h2":false}' && layersFor(2).h2 && levelsFor(1).h1 === 1 && levelsFor(1).h2 === 0, 'layer switches');
});
['win', 'ruin'].forEach(k => { const s = stinger(L, k); ok(s.bars === 2 && s.tracks.every(t => t.notes.length && range[t.inst]), k + ': a two-bar stinger'); });
for (let b = 1; b <= 11; b++) ok(IDS.indexOf(TUNE_OF(b)) >= 0, 'bench ' + b + ' has a tune');
ok(TUNE_OF(1) === 'desert' && TUNE_OF(3) === 'cook' && TUNE_OF(6) === 'heat' && TUNE_OF(9) === 'fall' && TUNE_OF(11) === 'fall', 'the tune follows the bench');
void D_MAJOR;

console.log((bad ? 'FAILED ' + bad + ' of ' : 'ok  - ') + n + ' checks; ' + CK_STORY.length + ' chapters, ' + lines + ' lines of Jesse, ' + IDS.length + ' tunes, ' + KID_TAGS().length + ' kinds of reaction');
process.exit(bad ? 1 : 0);
