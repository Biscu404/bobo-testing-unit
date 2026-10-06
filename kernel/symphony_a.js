/* The symphony, first half: the unwrapping, the drop, and the theme.

   Bars 1-8 are in C major and open on the very notes the machine plays when a file dies at
   the top rank (a harp and a bell playing C E G C E G C, then the chord): so the music begins as
   the delete sound and grows out of it, lifts for four bars of build, and breaks off one
   beat short of the downbeat. Bars 9-24 are the drop: C minor, a double-kick, a relentless
   cello, driven guitar. Bars 25-40 are the theme, carried by trumpet and violins and a choir. */
import { at, chug, hold, tune, kit, run, roll, drumRoll } from './symphony_kit.js';

/* the theme: two four-bar phrases over Cm Ab Eb Bb and Cm Ab Fm G */
export const P1 = 'C5:q. Eb5:e G5:h | F5:q. Eb5:e C5:h | G5:q. Bb5:e G5:q Eb5:q | D5:q. F5:e D5:q Bb4:q';
export const P1b = 'C5:q. Eb5:e G5:q Bb5:q | Ab5:q. G5:e Eb5:h | G5:q Bb5 Eb6:q Bb5:q | F5:q. D5:e Bb4:h';
export const P2 = 'C5:q. Eb5:e G5:q C6:q | Eb6:q. C6:e Ab5:h | F5:q Ab5 C6:q F6:q | D6:q. B5:e G5:h';

export const ROOTS_DROP = [36, 36, 32, 32, 34, 34, 31, 31];
export const ROOTS_THEME = [36, 32, 39, 34, 36, 32, 41, 31];
const PW = [0, 7, 12];

export function intro(L, T) {
  const arp = ['C5:s E5 G5 C6 E6 G6 C7:q. r:q', 'A4:s C5 E5 A5 C6 E6 A6:q. r:q', 'F4:s A4 C5 F5 A5 C6 F6:q. r:q', 'G4:s B4 D5 G5 B5 D6 G6:q. r:q'];
  arp.forEach((t, i) => { tune(L, T.harp, t, 1 + i * 2, 0, 0.9 - i * 0.05); tune(L, T.glock, t.replace(/ r:q$/, ''), 1 + i * 2, 0, 0.5 + i * 0.03); });
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

export function drop(L, T) {
  const gtr = ROOTS_DROP.map(r => r + 12);
  chug(T.guitar, 9, 16, gtr, 'x.xx.xx.x.xx.xx.', 0.17, 0.78, PW);
  chug(T.bass, 9, 16, ROOTS_DROP, 'x.xx.xx.x.xx.xx.', 0.2, 0.85);
  chug(T.cello, 9, 16, gtr, 'xxxxxxxxxxxxxxxx', 0.16, 0.55);
  [[36, 43, 48, 51, 55], [32, 39, 44, 48, 51], [34, 41, 46, 50, 53], [31, 38, 43, 47, 50]].forEach((ch, i) =>
    [0, 1].forEach(rep => hold(T.choir, 9 + rep * 8 + i * 2, [ch.map(n => n + 12)], 8, 0.5, null, 7.5)));
  ROOTS_DROP.concat(ROOTS_DROP).forEach((r, b) => { T.organ.push([at(9 + b), 4, r, 0.4]); T.timp.push([at(9 + b), 1, r + 12, 0.85]); });
  /* brass and strings hit the changes */
  [0, 2, 4, 6, 8, 10, 12, 14].forEach(k => {
    const r = gtr[k % 8];
    [r + 12, r + 19, r + 24].forEach(n => T.trumpet.push([at(9 + k), 1.5, n, 0.78]));
    [r + 12, r + 15, r + 19].forEach(n => T.strings.push([at(9 + k), 1.5, n, 0.72]));
  });
  kit(L, T.drums, 9, 16, { kick: 'x.x.xxx.x.x.xxx.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', crash: 'x...............' },
    { kick: 'xxxxxxxxxxxxxxxx', snare: 'x.x.x.x.xxxxxxxx', hitom: 'xxxx............', crash: 'x...............' });
  /* the theme begins to show in the violins, over the second half */
  tune(L, T.violins, P1, 17, 12, 0.6); tune(L, T.violins, P2, 21, 12, 0.65);
  tune(L, T.glock, 'C6:s E6 G6 C7:q. r:q', 17, 0, 0.5); tune(L, T.glock, 'C6:s Eb6 G6 C7:q. r:q', 21, 0, 0.5);
}

export function theme(L, T) {
  const pr = ROOTS_THEME, gtr = pr.map(r => r + 12);
  tune(L, T.trumpet, P1, 25, 0, 0.85); tune(L, T.trumpet, P2, 29, 0, 0.88); tune(L, T.trumpet, P1b, 33, 0, 0.88); tune(L, T.trumpet, P2, 37, 0, 0.92);
  tune(L, T.violins, P1, 25, 12, 0.7); tune(L, T.violins, P2, 29, 12, 0.72); tune(L, T.violins, P1b, 33, 12, 0.74); tune(L, T.violins, P2, 37, 12, 0.78);
  tune(L, T.choir, P1, 25, -12, 0.5); tune(L, T.choir, P2, 29, -12, 0.52); tune(L, T.choir, P1b, 33, -12, 0.55); tune(L, T.choir, P2, 37, -12, 0.58);
  chug(T.guitar, 25, 8, gtr, 'x.x.x.x.x.x.x.x.', 0.3, 0.7, PW);
  chug(T.guitar, 33, 8, gtr, 'x.xx.xx.x.xx.xx.', 0.17, 0.78, PW);
  chug(T.bass, 25, 16, pr, 'x.x.x.x.x.x.x.x.', 0.35, 0.82);
  chug(T.cello, 33, 8, gtr, 'xxxxxxxxxxxxxxxx', 0.16, 0.5);
  /* the pads under the tune: the chord of each bar, held */
  [[48, 51, 55], [44, 48, 51], [51, 55, 58], [46, 50, 53], [48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 47, 50]].forEach((ch, i) =>
    [0, 1].forEach(rep => { hold(T.strings, 25 + rep * 8 + i, [ch], 4, 0.5, null, 3.9); hold(T.organ, 25 + rep * 8 + i, [ch.map(n => n - 12)], 4, 0.35, null, 3.9); }));
  pr.concat(pr).forEach((r, b) => { T.timp.push([at(25 + b), 1, r + 12, 0.8]); T.timp.push([at(25 + b) + 2, 1, r + 12, 0.7]); });
  kit(L, T.drums, 25, 8, { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', crash: 'x...............' }, { kick: 'x.......x.x.....', snare: '....x...x.x.xxxx', crash: 'x...............' });
  kit(L, T.drums, 33, 8, { kick: 'x.x.xxx.x.x.xxx.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', crash: 'x...............', ride: '..x...x...x...x.' },
    { kick: 'xxxxxxxxxxxxxxxx', snare: 'x.x.x.x.xxxxxxxx', hitom: 'xxxx............', lotom: '....xxxx........', crash: 'x...............' });
}
