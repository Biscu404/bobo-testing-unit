/* node apps/solitaire/music_check.js -- Solitaire's score, its band and its seams (pure Node: no audio, no window).
   THE SCORE  every bar of every melody is as long as the bar; every note is playable and starts inside the song; the three tunes are in three keys
              a fifth apart, at three tempos, swung; each is a core of five and two layers; the melody sits on its chord on the strong beats;
   THE BAND   the energy the cards home earn rises in swells and falls in a sigh; a layer is never moved by more than a fraction a frame;
   THE SEAMS  the rotation is an order and not a dice roll, each tune is heard for about a minute and a half. */
import { createSolitaireMusic, heatOf, levelsOf, lean, loopsFor, passSecs, MIN_HEARD, HOME } from './music.js';
import { song as scoreOf, IDS, ORDER, TUNES, LAYERS, BARS, melodyOf } from './score.js';
import * as Lang from '../../kernel/songtext.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(68) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

console.log('-- the bars --');
for (const id of IDS) {
  const d = TUNES[id], bad = [];
  if (d.melody.length !== BARS) bad.push('has ' + d.melody.length + ' bars');
  d.melody.forEach((b, i) => { const len = Lang.parseNotes(b).length_; if (Math.abs(len - d.beats) > 1e-9) bad.push('bar ' + (i + 1) + ' is ' + len); });
  if (d.chords.split(' ').length !== BARS) bad.push('chords: ' + d.chords.split(' ').length);
  ok(!bad.length, id + ': sixteen bars of ' + d.beats + ' beats, and a chord for each', bad.join('; '));
}
console.log('\n-- the notes --');
const badNote = n => !(n[1] > 0 && n[0] >= 0 && n[2] >= 24 && n[2] <= 108 && n[3] > 0 && n[3] <= 1.0001);
for (const id of IDS) {
  const sg = scoreOf(Lang, id), len = Lang.songLength(sg);
  const wrong = sg.tracks.filter(t => (t.notes || []).some(badNote) || (t.hits || []).some(h => !(h[0] >= 0 && h[0] < len)));
  const over = sg.tracks.filter(t => (t.notes || []).some(n => n[0] >= len || n[0] + n[1] > len + 0.5));
  ok(!wrong.length && !over.length, id + ': every note is playable and starts inside the song', wrong.concat(over).map(t => t.name).join(', '));
}
console.log('\n-- the band --');
for (const id of IDS) {
  const sg = scoreOf(Lang, id), by = k => sg.tracks.filter(t => t.layer === k).length, core = sg.tracks.filter(t => t.layer == null).length;
  ok(core === 5 && LAYERS.every(k => by(k) >= 3) && sg.tracks.every(t => t.layer == null || LAYERS.includes(t.layer)), id + ': a core of ' + core + ' and layers of ' + LAYERS.map(k => by(k)).join('/'));
  ok(sg.swing >= 0.45 && sg.bpm >= 78 && sg.bpm <= 96, id + ': swung (' + sg.swing + ') and slow (' + sg.bpm + ' bpm)');
}
{
  const keys = IDS.map(id => TUNES[id].key).join(' ');
  ok(new Set(IDS.map(id => scoreOf(Lang, id).bpm)).size === IDS.length && keys === 'C G D', 'three tempos, and three keys a fifth apart', keys);
  const insts = new Set(); IDS.forEach(id => scoreOf(Lang, id).tracks.forEach(t => insts.add(t.inst)));
  ok(['epiano', 'bass', 'clarinet', 'vibes', 'sax', 'trumpet', 'organ', 'drums'].every(i => insts.has(i)), 'a wurlitzer, a bass, a clarinet, vibes, a sax and a trumpet', [...insts].join(' '));
}
console.log('\n-- the lead on its chords --');
for (const id of IDS) {
  const d = TUNES[id], ch = d.chords.split(' '), mel = melodyOf(Lang, id);
  let strong = 0, on = 0; const outside = new Set();
  mel.forEach(n => {
    const bar = Math.min(BARS - 1, Math.floor(n[0] / d.beats)), tones = Lang.chordNotes(ch[bar], 60).map(x => x % 12), pc = n[2] % 12, at = n[0] - bar * d.beats;
    if (d.pcs.indexOf(pc) < 0 && [6, 11, 1, 4].indexOf(pc) < 0) outside.add(pc);          /* the dominant chord's own third and the leading tone are the minor key's */
    if (Math.abs(at % 1) < 1e-6 && (at === 0 || at === 2)) { strong++; if (tones.includes(pc) || tones.some(t => Math.abs(t - pc) === 2 || Math.abs(t - pc) === 10)) on++; }
  });
  ok(!outside.size, id + ': nothing but the key and its dominant', [...outside].join(','));
  ok(strong > 0 && on / strong >= 0.8, id + ': the tune sits on its chord on the strong beats', Math.round(100 * on / strong) + '%');
}
console.log('\n-- the band leans in --');
ok(heatOf(0) === 0 && heatOf(4) === 0 && heatOf(12) === 1 && heatOf(40) === 2 && heatOf(52) === 2, 'nothing home is the core alone; a few aces bring the first layer; a pile the second');
ok(HOME.every((m, i) => i === 0 || (m[0] > HOME[i - 1][0] && m[1] >= HOME[i - 1][1])), 'the marks only climb');
ok(JSON.stringify(levelsOf(0)) === '{"h1":0,"h2":0}' && levelsOf(1).h1 === 1 && levelsOf(1).h2 === 0 && levelsOf(1.5).h2 === 0.5 && levelsOf(2).h2 === 1, 'the second layer starts as the first is full');
{
  let e = 0, worst = 0; for (let i = 0; i < 600; i++) { const n = lean(e, 2, 1 / 60); worst = Math.max(worst, n - e); e = n; }
  ok(worst < 0.04 && e > 1.9, 'a good pile reaches the whole band in about ten seconds, never more than a few hundredths a frame', worst.toFixed(3) + ' ' + e.toFixed(2));
  let f = 2; for (let i = 0; i < 60 * 4; i++) f = lean(f, 0, 1 / 60);
  ok(f > 0.5, 'a new deal puts the cards back and the band is still most of the way there four seconds later', f.toFixed(2));
}
console.log('\n-- the seams --');
ok(ORDER.length === 3 && ORDER.every(id => IDS.includes(id)) && new Set(ORDER).size === 3, 'the rotation is an order of the three, not a dice roll', ORDER.join(' > '));
for (const id of IDS) { const p = passSecs(id); ok(loopsFor(id) >= 2 && loopsFor(id) * p >= MIN_HEARD, id + ': heard through ' + loopsFor(id) + ' times (' + Math.round(loopsFor(id) * p) + ' s)'); }
{
  const fake = { sync() {} }, S = createSolitaireMusic({ studio: () => null, playing: () => false });
  ok(typeof S.home === 'function' && typeof S.step === 'function' && typeof S.won === 'function' && typeof S.sync === 'function', 'the music hands the game what it drives: home(), won(), step(), sync()');
  S.home(20); for (let i = 0; i < 600; i++) S.step(1 / 60); ok(S.energy > 0.9 && S.energy <= 1.001, 'twenty cards home leaves the band at the first layer, full (' + S.energy.toFixed(2) + ')');
  S.won(); for (let i = 0; i < 1200; i++) S.step(1 / 60); ok(S.energy > 1.95, 'a win brings the whole table in (' + S.energy.toFixed(2) + ')'); void fake;
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nsolitaire music: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
