/* node apps/sweeper/music_check.js -- Dungeon Sweeper's score, and which tune plays where (pure Node: no audio, no window).
   THE SCORE  every melody bar is four beats and there are sixteen of them, a chord for each; every note is playable and starts inside the
              song; the five tunes are five different tunes, all minor, slow enough to be dungeon synth, and each is a pass of a minute or so;
   THE TRACKS every tune has its lead, pad, drone and bass, and the timpani and the arpeggio where it asks for them;
   THE PLACES every place of the game names a tune and every tune has a place, and a place's pool is that one tune, so the director only
              changes tune when the place does. */
import * as Lang from '../../kernel/songtext.js';
import { TUNES, IDS, BARS, BPB, PLACE_TUNE, song as scoreOf } from './score.js';
import { createSweeperMusic } from './music.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(72) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

console.log('-- the bars --');
for (const id of IDS) {
  const d = TUNES[id], bad = [];
  if (d.melody.length !== BARS) bad.push('has ' + d.melody.length + ' bars');
  d.melody.forEach((b, i) => { const len = Lang.parseNotes(b).length_; if (Math.abs(len - BPB) > 1e-9) bad.push('bar ' + (i + 1) + ' is ' + len); });
  if (d.chords.split(' ').length !== BARS) bad.push('chords: ' + d.chords.split(' ').length);
  ok(!bad.length, id + ': sixteen bars of ' + BPB + ' beats, and a chord for each', bad.join('; '));
}

console.log('\n-- the notes --');
const badNote = n => !(n[1] > 0 && n[0] >= 0 && n[2] >= 24 && n[2] <= 108 && n[3] > 0 && n[3] <= 1.0001);
for (const id of IDS) {
  const sg = scoreOf(Lang, id), len = Lang.songLength(sg);
  const wrong = sg.tracks.filter(t => (t.notes || []).some(badNote) || (t.hits || []).some(h => !(h[0] >= 0 && h[0] < len)));
  const over = sg.tracks.filter(t => (t.notes || []).some(n => n[0] >= len || n[0] + n[1] > len + 0.5));
  ok(!wrong.length && !over.length, id + ': every note is playable and starts inside the song', wrong.concat(over).map(t => t.name).join(', '));
}

console.log('\n-- the tunes --');
const melodies = IDS.map(id => TUNES[id].melody.join('|'));
ok(new Set(melodies).size === IDS.length, 'the five melodies are five different tunes');
ok(new Set(IDS.map(id => TUNES[id].title)).size === IDS.length, 'the five have five different titles');
for (const id of IDS) {
  const d = TUNES[id], sg = scoreOf(Lang, id), names = sg.tracks.map(t => t.name);
  ok(d.scale === 'minor' && d.bpm >= 50 && d.bpm <= 110, id + ': minor, and slow enough for dungeon synth (' + d.bpm + ' bpm)');
  const pass = BARS * BPB * 60 / d.bpm;
  ok(pass >= 40 && pass <= 100, id + ': one pass is about a minute (' + pass.toFixed(0) + ' s)');
  const need = ['LEAD', 'PAD', 'DRONE', 'BASS'];
  ok(need.every(n => names.indexOf(n) >= 0), id + ': lead, pad, drone and bass are all there', names.join(' '));
  if (d.booms.length) ok(names.indexOf('TIMPANI') >= 0, id + ': the timpani it asks for is there');
  if (d.arp) ok(names.indexOf('ARP') >= 0, id + ': the arpeggio it asks for is there');
}

console.log('\n-- the places --');
const places = Object.keys(PLACE_TUNE);
ok(places.length === 5 && places.every(p => TUNES[PLACE_TUNE[p]]), 'five places, each naming a tune that exists', places.map(p => p + ' -> ' + PLACE_TUNE[p]).join(', '));
ok(new Set(Object.values(PLACE_TUNE)).size === IDS.length, 'every tune has a place of its own');
const Song = createSweeperMusic({ studio: () => null, playing: () => false });
for (const p of places) {
  Song.setPlace(p);
  const pool = Song.pool();
  ok(pool.length === 1 && pool[0] === PLACE_TUNE[p], 'the pool for "' + p + '" is its one tune', pool.join(','));
}
const before = Song.place();
Song.setPlace('nowhere');
ok(Song.place() === before, 'an unknown place is ignored (the last one stays)', before + ' -> ' + Song.place());

console.log('\n' + (fails ? fails + ' FAILED' : 'all ' + checks + ' checks passed') + ' (' + checks + ' checks)');
process.exit(fails ? 1 : 0);
