/* The symphony, first part: bars 1-32. The unwrapping, the ignition and the tune.

   Bars 1-8 are in C major and open on the very notes the machine plays when a file dies at the top rank (a harp and a bell playing
   C E G C E G C, then the chord): so the music begins as the delete sound and grows out of it, lifts for four bars of build, and
   breaks off one beat short of the downbeat. Bars 9-16 are the ignition: C minor, a broken beat, a bass riff with a flat second in
   it, the tune hinted at in the violins. Bars 17-32 are the tune itself, said twice: the question and then the answer. */
import { at, chug, hold, tune, kit, run, roll, riff, arp, pad, cycle } from './symphony_kit.js';
import { PROG, ROOT, HOOK_Q, HOOK_A, BELOW, HINT, up, RIFF_DARK, RIFF_PLAIN, PUNCH, DRUMS, CM, AB, G7 } from './symphony_theme.js';

const PW = [0, 7, 12];

export function intro(L, T) {
  const arpg = ['C5:s E5 G5 C6 E6 G6 C7:q. r:q', 'A4:s C5 E5 A5 C6 E6 A6:q. r:q', 'F4:s A4 C5 F5 A5 C6 F6:q. r:q', 'G4:s B4 D5 G5 B5 D6 G6:q. r:q'];
  arpg.forEach((t, i) => { tune(L, T.harp, t, 1 + i * 2, 0, 0.9 - i * 0.05); tune(L, T.glock, t.replace(/ r:q$/, ''), 1 + i * 2, 0, 0.5 + i * 0.03); });
  /* the chord the fanfare ends on, then a bell for each change */
  [[1, [60, 67, 72]], [3, [57, 64, 69]], [5, [53, 60, 65]], [7, [55, 62, 67]]].forEach(([b, ch], i) => ch.forEach(n => T.bells.push([at(b), 6, n - 12, 0.7 + i * 0.05])));
  const prog = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
  prog.forEach((ch, i) => { hold(T.choir, 1 + i * 2, [ch], 8, 0.34 + i * 0.1, null, 7.5); hold(T.strings, 1 + i * 2, [ch.map(n => n - 12)], 8, 0.3 + i * 0.1, null, 7.5); });
  [[36, 43], [33, 40], [29, 36], [31, 38]].forEach((ch, i) => hold(T.organ, 1 + i * 2, [ch], 8, 0.28 + i * 0.07, null, 7.5));
  T.timp.push([0, 4, 36, 0.95]);
  roll(T.timp, at(5), at(7), 0.5, [43], 0.3, 0.6); roll(T.timp, at(7), at(8) + 3, 0.25, [43], 0.5, 1);
  /* the build: strings climb, the snare rolls, a trumpet calls */
  roll(T.strings, at(5), at(9) - 1, 0.5, [65, 69, 72], 0.3, 0.8, 0.4);
  run(T.violins, at(7), [72, 74, 76, 77, 79, 81, 83, 84], 0.5, 0.45, 0.45, 0.95);
  tune(L, T.trumpet, 'G4:e G4 G4 G4:q C5:q.', 7, 0, 0.8); tune(L, T.trumpet, 'E5:q. D5:e C5:h', 8, 0, 0.7);
  kit(L, T.drums, 5, 2, { snare: 'x.x.x.x.x.x.x.x.', ride: 'x...............' });
  kit(L, T.drums, 7, 1, { snare: 'xxxxxxxxxxxxxxxx', crash: 'x...............' });
  const last = []; L.parseDrums({ snare: 'xxxxxxxxxxxx....' }, 4).forEach(h => last.push([h[0] + at(8), h[1], Math.min(1, h[2] + 0.1)]));
  last.forEach(h => T.drums.push(h));
}

/* bars 9-16: C minor, C C C C Ab Ab G G */
export function drop(L, T) {
  const R = [36, 36, 36, 36, 32, 32, 31, 31], gtr = R.map(r => r + 12), riffFor = b => (b >= 4 && b < 6) ? RIFF_PLAIN : RIFF_DARK;
  riff(T.bass, 9, 8, R, riffFor, 0.2, 0.9, true);
  riff(T.guitar, 9, 8, gtr, b => riffFor(b).map(s => s == null ? null : [s, s + 7, s + 12]), 0.17, 0.82, true);
  /* the first beat is the weight of it: timpani, bass, a crash, and the stab of the trumpets */
  [0, 2, 4, 6].forEach(k => { T.timp.push([at(9 + k), 1, R[k] + 12, 0.95]); T.timp.push([at(9 + k) + 2.5, 0.5, R[k] + 12, 0.7]); });
  R.forEach((r, b) => T.organ.push([at(9 + b), 4, r, 0.4]));
  [[60, 67, 72], [60, 67, 72]].forEach((ch, i) => ch.forEach(n => T.trumpet.push([at(9 + i * 2), 0.5, n, 0.82])));
  /* the cello joins in the third bar, the choir in the fifth, the piano turning over in the seventh */
  chug(T.cello, 11, 6, gtr.slice(2), 'x.x.x.x.x.x.x.x.', 0.2, 0.52);
  pad(T.choir, 13, [AB, AB, G7, G7].map(c => c.map(n => n + 12)), 0.42, 0.55);
  arp(T.piano, 13, up([AB, AB, G7, G7], 12), [0, 1, 2, 3, 2, 1, 2, 3], 0.25, 0.22, 0.34, 0.48);
  /* the tune, hinted at: two bars of it, a bar of its ending, then a breath */
  tune(L, T.violins, HINT, 13, 0, 0.6); tune(L, T.violins, 'D6:q. B5:e G5:h', 15, 0, 0.66);
  tune(L, T.glock, 'C6:s Eb6 G6 C7:q. r:q', 14, 0, 0.45);
  T.bells.push([at(9), 6, 48, 0.8]);
  kit(L, T.drums, 9, 8, DRUMS.broken, DRUMS.fillToms);
}

/* bars 17-32: the tune. 17-24 the question (the violins, the choir, the cello under); 25-32 the answer (a trumpet joins, the guitar chugs) */
export function theme(L, T) {
  const gtr = ROOT.map(r => r + 12), chordsUp = up(PROG, 12), all = cycle(PROG, 16), ch2 = cycle(chordsUp, 16);
  tune(L, T.violins, HOOK_Q, 17, 0, 0.7); tune(L, T.violins, HOOK_A, 25, 0, 0.78);
  tune(L, T.choir, HOOK_Q, 17, -12, 0.46); tune(L, T.choir, HOOK_A, 25, -12, 0.56);
  tune(L, T.trumpet, HOOK_A, 25, -12, 0.82);
  tune(L, T.cello, BELOW, 17, 0, 0.62); tune(L, T.cello, BELOW, 25, 0, 0.7);
  tune(L, T.glock, HOOK_A, 25, 12, 0.3);
  pad(T.strings, 17, all, 0.42, 0.6); pad(T.organ, 17, all, 0.3, 0.42, -12);
  arp(T.piano, 17, ch2, [0, 1, 2, 3, 2, 1, 2, 3], 0.25, 0.2, 0.34, 0.5);
  /* the rhythm section: open and low for the question, tight and driving for the answer */
  chug(T.bass, 17, 8, ROOT, 'x.......x.......', 0.9, 0.84);
  riff(T.bass, 25, 8, ROOT, PUNCH, 0.2, 0.9, true);
  chug(T.guitar, 17, 8, gtr, 'x...............', 3.8, 0.6, PW);
  riff(T.guitar, 25, 8, gtr, PUNCH.map(s => s == null ? null : [0, 7, 12]), 0.17, 0.82, true);
  all.forEach((c, b) => { if (b % 2 === 0) T.timp.push([at(17 + b), 1, ROOT[b % 8] + 12, 0.8]); if (b >= 8) T.timp.push([at(17 + b) + 2, 1, ROOT[b % 8] + 12, 0.65]); });
  /* a harp falling through the last bar of each half, into the next */
  run(T.harp, at(24), [91, 88, 84, 79, 76, 72, 67, 64], 0.5, 0.6, 0.7, 0.45);
  run(T.harp, at(32), [91, 88, 84, 79, 76, 72, 67, 64], 0.5, 0.6, 0.8, 0.5);
  kit(L, T.drums, 17, 8, DRUMS.broken, DRUMS.fillToms);
  kit(L, T.drums, 25, 8, Object.assign({}, DRUMS.broken, { ride: '..x...x...x...x.' }), DRUMS.fillSnare);
}
