/* The symphony, second half: the breakdown, the climax a step higher, the finale, and the
   outro, which comes home to C major on the harp and the bell that began it. */
import { at, chug, hold, tune, kit, run, roll, drumRoll } from './symphony_kit.js';
import { P1, P1b, P2, ROOTS_THEME } from './symphony_a.js';

const PW = [0, 7, 12];

/* bars 41-56: everything drops away, then builds back to a stop one beat before the climax */
export function breakdown(L, T) {
  [[41, [36, 48]], [43, [32, 44]], [45, [41, 53]], [47, [31, 43]]].forEach(([b, ch]) => hold(T.piano, b, [ch], 8, 0.5, null, 7.5));
  tune(L, T.piano, 'C4:q Eb4 G4:h | C5:h. r:q | Bb4:q Ab4 F4:h | G4:w', 42, 0, 0.45);
  const chords = [[48, 55, 60, 63], [44, 51, 56, 60], [41, 48, 53, 56], [43, 50, 55, 59]];
  chords.forEach((ch, i) => { hold(T.choir, 41 + i * 2, [ch], 8, 0.32, null, 7.5); hold(T.strings, 41 + i * 2, [ch.map(n => n - 12)], 8, 0.3, null, 7.5); });
  for (let b = 0; b < 8; b++) { T.organ.push([at(41 + b), 4, [36, 36, 32, 32, 41, 41, 31, 31][b], 0.35]); T.timp.push([at(41 + b), 1, [36, 36, 32, 32, 41, 41, 31, 31][b] + 12, 0.75]); }
  [[41, 60], [45, 65]].forEach(([b, n]) => T.bells.push([at(b), 7, n, 0.6]));
  /* the pizzicato counts it out: a root and a fifth */
  chug(T.pizz, 45, 12, [41, 41, 31, 31, 36, 32, 34, 31, 36, 32, 31, 31].map(n => n + 12), 'x.x.x.x.x.x.x.x.', 0.25, 0.6, [0, 7]);
  kit(L, T.drums, 45, 4, { kick: 'x...............', clap: '........x.......' });
  kit(L, T.drums, 49, 4, { kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' });
  /* the build: tremolo strings, a rising line, a snare roll that does not stop until the beat before */
  [[49, [60, 63, 67]], [50, [56, 60, 63]], [51, [58, 62, 65]], [52, [55, 59, 62]], [53, [60, 63, 67]], [54, [56, 60, 63]], [55, [55, 59, 62]]].forEach(([b, ch], i) =>
    roll(T.strings, at(b), at(b + 1), 0.25, ch, 0.35 + i * 0.08, 0.4 + i * 0.09, 0.2));
  roll(T.strings, at(56), at(56) + 3, 0.25, [55, 59, 62, 67], 0.85, 1, 0.2);
  chug(T.cello, 49, 7, [36, 32, 34, 31, 36, 32, 31], 'xxxxxxxxxxxxxxxx', 0.16, 0.5);
  chug(T.guitar, 53, 3, [48, 44, 43], 'x.x.x.x.x.x.x.x.', 0.3, 0.7, PW);
  run(T.violins, at(53), [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82], 0.5, 0.48, 0.4, 1);
  roll(T.timp, at(53), at(56) + 3, 0.25, [43], 0.45, 1, 0.22);
  kit(L, T.drums, 53, 3, { snare: 'x.x.x.x.x.x.x.x.', kick: 'x.......x.......', crash: 'x...............' });
  drumRoll(T.drums, at(56), at(56) + 3, 0.25, 'snare', 0.6, 1);
}

/* bars 57-72: the theme a whole step up, at the top of its voice */
export function climax(L, T) {
  const up = 2, bass = [38, 34, 41, 36, 38, 34, 31, 33], gtr = bass.map(r => r + 12);
  [[57, P1], [61, P2], [65, P1b], [69, P2]].forEach(([b, p], i) => {
    tune(L, T.trumpet, p, b, up, 0.95); tune(L, T.trumpet, p, b, up - 12, 0.55);
    tune(L, T.violins, p, b, up + 12, 0.8); tune(L, T.choir, p, b, up, 0.7); tune(L, T.choir, p, b, up - 12, 0.55);
    tune(L, T.glock, p, b, up + 12, 0.35);
    if (i % 2 === 0) T.bells.push([at(b), 6, 62 + up, 0.7]);
  });
  chug(T.guitar, 57, 16, gtr, 'x.xx.xx.x.xx.xx.', 0.17, 0.85, PW);
  chug(T.bass, 57, 16, bass, 'x.xx.xx.x.xx.xx.', 0.2, 0.9);
  chug(T.cello, 57, 16, gtr, 'xxxxxxxxxxxxxxxx', 0.16, 0.6);
  [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]].forEach((ch, i) =>
    [0, 1].forEach(rep => { hold(T.strings, 57 + rep * 8 + i, [ch], 4, 0.62, null, 3.9); hold(T.organ, 57 + rep * 8 + i, [ch.map(n => n - 12)], 4, 0.45, null, 3.9); hold(T.choir, 57 + rep * 8 + i, [ch.map(n => n + 12)], 4, 0.42, null, 3.9); }));
  bass.concat(bass).forEach((r, b) => { for (let k = 0; k < 4; k++) T.timp.push([at(57 + b) + k, 0.9, r + 12, k % 2 ? 0.7 : 0.9]); });
  kit(L, T.drums, 57, 16, { kick: 'xxxxxxxxxxxxxxxx', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', crash: 'x...x...x...x...', ride: '..x...x...x...x.' },
    { kick: 'xxxxxxxxxxxxxxxx', snare: 'xxxxxxxxxxxxxxxx', hitom: 'xxxx............', midtom: '....xxxx........', lotom: '........xxxx....', crash: 'x...............' });
}

/* bars 73-92: back in C minor with everything, the guitar taking the tune in octaves, then a long climb to the cadence */
export function finale(L, T) {
  const pr = ROOTS_THEME, fin = pr.concat(pr, [41, 41, 31, 31]), gtr = fin.map(r => r + 12);
  tune(L, T.trumpet, P1, 73, 0, 0.95); tune(L, T.trumpet, P2, 77, 0, 0.98); tune(L, T.trumpet, P1b, 81, 0, 0.98); tune(L, T.trumpet, P2, 85, 0, 1);
  [[73, P1], [77, P2], [81, P1b], [85, P2]].forEach(([b, p]) => {
    tune(L, T.violins, p, b, 12, 0.8); tune(L, T.choir, p, b, 0, 0.72); tune(L, T.choir, p, b, -12, 0.6);
    tune(L, T.lead, p, b, -12, 0.85); tune(L, T.lead, p, b, -5, 0.7);
  });
  chug(T.cello, 73, 20, gtr, 'xxxxxxxxxxxxxxxx', 0.16, 0.62);
  chug(T.bass, 73, 20, fin, 'x.xx.xx.x.xx.xx.', 0.2, 0.9);
  chug(T.guitar, 73, 20, gtr, 'x.xx.xx.x.xx.xx.', 0.17, 0.82, PW);
  const ch = [[48, 51, 55], [44, 48, 51], [51, 55, 58], [46, 50, 53], [48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 47, 50]];
  for (let i = 0; i < 16; i++) { hold(T.strings, 73 + i, [ch[i % 8]], 4, 0.6, null, 3.9); hold(T.organ, 73 + i, [ch[i % 8].map(n => n - 12)], 4, 0.45, null, 3.9); }
  [[89, [41, 44, 48]], [90, [41, 44, 48]], [91, [43, 47, 50]], [92, [43, 47, 50]]].forEach(([b, c], i) => { hold(T.strings, b, [c], 4, 0.7 + i * 0.07, null, b === 92 ? 3 : 3.9); hold(T.choir, b, [c.map(n => n + 12)], 4, 0.6 + i * 0.1, null, b === 92 ? 3 : 3.9); });
  fin.forEach((r, b) => { for (let k = 0; k < 4; k++) T.timp.push([at(73 + b) + k, 0.9, r + 12, k % 2 ? 0.75 : 0.95]); });
  kit(L, T.drums, 73, 16, { kick: 'xxxxxxxxxxxxxxxx', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', crash: 'x...x...x...x...' },
    { kick: 'xxxxxxxxxxxxxxxx', snare: 'x.x.x.x.xxxxxxxx', hitom: 'xxxx............', midtom: '....xxxx........', lotom: '........xxxx....', crash: 'x...............' });
  kit(L, T.drums, 89, 3, { kick: 'x.x.x.x.x.x.x.x.', snare: 'x.x.x.x.x.x.x.x.', crash: 'x...............' });
  drumRoll(T.drums, at(92), at(92) + 3, 0.25, 'snare', 0.7, 1);
  roll(T.timp, at(91), at(92) + 3, 0.25, [43], 0.6, 1, 0.22);
  run(T.violins, at(91), [67, 71, 74, 79, 83, 86, 91, 95], 0.5, 0.48, 0.6, 1);
}

/* bars 93-100: C major, the fanfare notes again, and one long chord */
export function outro(L, T) {
  const arp = ['C5:s E5 G5 C6 E6 G6 C7:q. r:q', 'F4:s A4 C5 F5 A5 C6 F6:q. r:q', 'A4:s C5 E5 A5 C6 E6 A6:q. r:q', 'G4:s B4 D5 G5 B5 D6 G6:q. r:q', 'C5:s E5 G5 C6 E6 G6 C7:q. r:q', 'F4:s A4 C5 F5 A5 C6 F6:q. r:q', 'G4:s B4 D5 G5 B5 D6 G6:q. r:q'];
  arp.forEach((t, i) => { tune(L, T.harp, t, 93 + i, 0, 0.95); tune(L, T.glock, t.replace(/ r:q$/, ''), 93 + i, 0, 0.55); });
  const ch = [[48, 52, 55, 60], [41, 45, 48, 53], [45, 48, 52, 57], [43, 47, 50, 55], [48, 52, 55, 60], [41, 45, 48, 53], [43, 47, 50, 55]];
  ch.forEach((c, i) => { const b = 93 + i; hold(T.choir, b, [c.map(n => n + 12)], 4, 0.55 + i * 0.05, null, 4); hold(T.strings, b, [c], 4, 0.6 + i * 0.05, null, 4); hold(T.organ, b, [c.map(n => n - 12)], 4, 0.5 + i * 0.05, null, 4); T.bells.push([at(b), 4, c[0] + 12, 0.7]); });
  tune(L, T.trumpet, 'E5:h G5:h | F5:h A5:h | C6:h A5:h | B5:q. G5:e D6:h | E6:h C6:h | F6:h A5:h | D6:h B5:h', 93, 0, 0.9);
  tune(L, T.violins, 'C6:w | A5:w | E6:w | D6:w | G6:w | A6:w | G6:w', 93, 0, 0.7);
  [36, 29, 33, 31, 36, 29, 31].forEach((r, i) => { T.bass.push([at(93 + i), 3.5, r, 0.9]); T.cello.push([at(93 + i), 3.5, r + 12, 0.7]); for (let k = 0; k < 4; k++) T.timp.push([at(93 + i) + k, 0.9, r + 12, k === 0 ? 0.95 : 0.6]); });
  kit(L, T.drums, 93, 4, { kick: 'x.......x.......', snare: '........x.......', crash: 'x...............', hat: 'x.x.x.x.x.x.x.x.' });
  kit(L, T.drums, 97, 3, { kick: 'x.x.x.x.x.x.x.x.', snare: 'x.x.x.x.x.x.x.x.', crash: 'x...............' });
  /* bar 100: the last chord, all of it, held */
  const end = at(100);
  [36, 48, 52, 55, 60, 64, 67, 72].forEach(n => { T.organ.push([end, 8, n, 0.9]); T.strings.push([end, 8, n + 12, 0.85]); T.choir.push([end, 8, n + 12, 0.8]); });
  [60, 64, 67, 72, 76].forEach(n => { T.trumpet.push([end, 6, n + 12, 0.9]); T.bells.push([end, 10, n, 0.8]); });
  T.timp.push([end, 4, 36, 1]); T.drums.push([end, 'crash', 1], [end, 'kick', 1]); T.harp.push([end, 6, 84, 0.9], [end, 6, 88, 0.9], [end, 6, 91, 0.9], [end, 6, 96, 0.9]);
}
