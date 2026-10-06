/* The symphony, second part: bars 33-56. The breath, the lift, and the climb back down into the dark.

   Bars 33-40 are the breath: half-time, a piano and a harp alone with the tune an octave lower, and then the band coming back
   in underneath it a bar at a time. Bars 41-48 are the lift: the tune in E flat major (HOOK_MAJ), four on the floor, a room standing
   up; it is the only time in the piece that it is allowed to be glad. Bars 49-56 are the cost of that: the minor key comes
   back, the beat breaks again, and a long climb on G (the dominant) with a snare roll that does not stop until one beat before
   the climax, which is silence. */
import { at, chug, tune, kit, run, roll, drumRoll, riff, arp, pad } from './symphony_kit.js';
import { PROG, ROOT, PLIFT, RLIFT, HOOK_Q, HOOK_MAJ, up, DRUMS, RIFF_BOUNCE, RIFF_DARK, RIFF_PLAIN, CM, AB, FM, G7 } from './symphony_theme.js';

const PW = [0, 7, 12];

/* bars 33-40 */
export function breath(L, T) {
  tune(L, T.piano, HOOK_Q, 33, -12, 0.5);
  arp(T.harp, 33, up(PROG, 12), [0, 1, 2, 3, 2, 1], 0.5, 0.45, 0.3, 0.5);
  pad(T.choir, 33, PROG.map(c => c.map(n => n + 12)), 0.3, 0.46); pad(T.strings, 33, PROG, 0.3, 0.5, -12);
  ROOT.forEach((r, b) => { T.organ.push([at(33 + b), 4, r, 0.35]); if (b < 4) T.timp.push([at(33 + b), 1, r + 12, 0.7]); });
  T.bells.push([at(33), 7, 60, 0.6], [at(37), 7, 67, 0.62]);
  kit(L, T.drums, 33, 4, DRUMS.half);
  /* the second four bars: the band returns, one thing at a time, the snare climbing to the lift */
  chug(T.bass, 37, 4, ROOT.slice(4), 'x.x.x.x.x.x.x.x.', 0.35, 0.7);
  chug(T.cello, 37, 4, ROOT.slice(4).map(r => r + 12), 'x.x.x.x.x.x.x.x.', 0.3, 0.45);
  PROG.slice(4).forEach((ch, i) => roll(T.strings, at(37 + i), i === 3 ? at(41) - 1 : at(38 + i), 0.25, ch.map(n => n + 12), 0.3 + i * 0.14, 0.4 + i * 0.16, 0.2));
  chug(T.guitar, 39, 2, ROOT.slice(6).map(r => r + 12), 'x.x.x.x.x.x.x.x.', 0.3, 0.62, PW);
  kit(L, T.drums, 37, 2, DRUMS.half);
  kit(L, T.drums, 39, 1, { kick: 'x...x...x...x...', snare: 'x.x.x.x.x.x.x.x.' });
  kit(L, T.drums, 40, 1, { snare: 'xxxxxxxxxxxxxxxx', kick: 'x.......x.......' });
  roll(T.timp, at(39), at(41) - 0.5, 0.25, [43], 0.3, 1, 0.22);
}

/* bars 41-48: E flat major */
export function lift(L, T) {
  const roots = RLIFT, gtr = roots.map(r => r + 12), chords = PLIFT;
  tune(L, T.violins, HOOK_MAJ, 41, 0, 0.8); tune(L, T.trumpet, HOOK_MAJ, 41, -12, 0.85); tune(L, T.choir, HOOK_MAJ, 41, -12, 0.58);
  tune(L, T.glock, HOOK_MAJ, 41, 12, 0.34);
  riff(T.bass, 41, 8, roots, RIFF_BOUNCE, 0.3, 0.84);
  chug(T.guitar, 41, 8, gtr, 'x.x.x.x.x.x.x.x.', 0.28, 0.66, PW);
  chug(T.pizz, 41, 8, chords.map(c => c[0] + 12), 'x.x.x.x.x.x.x.x.', 0.2, 0.55, [0, 7]);
  pad(T.strings, 41, chords, 0.5, 0.64); pad(T.organ, 41, chords, 0.34, 0.44, -12);
  arp(T.piano, 41, up(chords, 12), [0, 1, 2, 3, 2, 1, 2, 3], 0.25, 0.2, 0.36, 0.5);
  arp(T.harp, 41, up(chords, 24), [0, 1, 2, 1], 0.5, 0.4, 0.3, 0.42);
  roots.forEach((r, b) => { T.timp.push([at(41 + b), 1, r + 12, 0.8]); T.timp.push([at(41 + b) + 2, 1, r + 12, 0.6]); });
  T.bells.push([at(41), 6, 75, 0.7], [at(45), 6, 79, 0.7]);
  kit(L, T.drums, 41, 8, DRUMS.lift, DRUMS.fillSnare);
}

/* bars 49-56: back in C minor, a long climb on G, and a stop */
export function climb(L, T) {
  const R = [36, 36, 32, 32, 41, 41, 31, 31], gtr = R.map(r => r + 12);
  tune(L, T.trumpet, 'G4:q. Bb4:e C5:h | C5:q. Bb4:e Ab4:h', 49, 0, 0.7);
  tune(L, T.violins, 'G5:q. Bb5:e C6:h | C6:q. Bb5:e Ab5:h', 49, 0, 0.55);
  pad(T.choir, 49, [CM, CM, AB, AB, FM, FM, G7, G7].map(c => c.map(n => n + 12)), 0.3, 0.6); pad(T.strings, 49, [CM, CM, AB, AB, FM, FM, G7, G7], 0.4, 0.8, -12);
  riff(T.bass, 49, 4, R, b => b >= 2 ? RIFF_PLAIN : RIFF_DARK, 0.2, 0.8, true);
  chug(T.bass, 53, 4, [41, 41, 31, 31], 'x.x.x.x.x.x.x.x.', 0.3, 0.78);
  chug(T.cello, 49, 8, gtr, 'x.x.x.x.x.x.x.x.', 0.25, 0.5);
  chug(T.guitar, 53, 4, gtr.slice(4), 'x.x.x.x.x.x.x.x.', 0.3, 0.66, PW);
  chug(T.pizz, 49, 8, gtr, 'x...x...x...x...', 0.3, 0.6, [0, 7]);
  R.forEach((r, b) => T.organ.push([at(49 + b), 4, r, 0.4]));
  kit(L, T.drums, 49, 4, DRUMS.broken);
  kit(L, T.drums, 53, 3, DRUMS.build);
  /* the climb: tremolo strings, a rising line, a snare roll, the timpani, and nothing on the last beat */
  [[53, FM], [54, FM], [55, G7], [56, G7]].forEach(([b, ch], i) => roll(T.strings, at(b), b === 56 ? at(56) + 3 : at(b + 1), 0.25, ch.map(n => n + 12), 0.5 + i * 0.12, 0.6 + i * 0.12, 0.2));
  run(T.violins, at(53), [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81], 1, 0.95, 0.4, 1);
  run(T.trumpet, at(55), [67, 69, 70, 71, 72, 74, 75, 77], 0.5, 0.48, 0.5, 0.95);
  roll(T.timp, at(53), at(56) + 3, 0.25, [43], 0.45, 1, 0.22);
  drumRoll(T.drums, at(56), at(56) + 3, 0.25, 'snare', 0.55, 1);
}
