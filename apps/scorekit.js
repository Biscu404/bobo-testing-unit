/* Helpers for writing a game's score as songs for the studio (kernel/songtext.js is the
   language; this is the small amount of bookkeeping that every game's score wants).
   An old-style part is [[name, start, length], ...] in eighth notes, like Bekkedal's and
   Elephant's tunes were written: 'Fs4' is F sharp, 'Bb3' is B flat. */

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midi(name) {
  const m = /^([A-G])(s|b|#)?(-?\d)$/.exec(name);
  if (!m) throw new Error('NOT A NOTE: ' + name);
  return PC[m[1]] + (m[2] === 's' || m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
}
/* eighth-note parts -> [[start, dur, midi, vel], ...] in beats (a beat is two eighths) */
export const eighths = (part, vel) => (part || []).map(n => [n[1] / 2, n[2] / 2, midi(n[0]), vel == null ? 0.7 : vel]);
/* the same notes later in time and/or higher: for the second time round */
export const shifted = (notes, beats, semis, vel) => notes.map(n => [n[0] + beats, n[1], n[2] + (semis || 0), vel == null ? n[3] : vel]);
/* a part played over again: n times, each `len` beats long */
export const again = (notes, len, n, semis) => { let out = []; for (let i = 0; i < n; i++) out = out.concat(shifted(notes, len * i, i ? (semis || 0) : 0)); return out; };
export const scale = (notes, k) => notes.map(n => [n[0], n[1], n[2], Math.max(0.05, Math.min(1, n[3] * k))]);
/* every note of the part a sixth/third/etc. above, for a second voice */
export const above = (notes, semis, vel) => notes.map(n => [n[0], n[1], n[2] + semis, vel == null ? n[3] * 0.8 : vel]);
/* a title and the lines of a score, once, however many times it is asked for */
export function memo(build) { const cache = new Map(); return (L, id) => { if (!cache.has(id)) cache.set(id, build(L, id)); return cache.get(id); }; }
/* A second voice a number of scale steps from the first (negative is below), in the mode it is in: `pcs` is the mode's pitch
   classes (D freygish: [2, 3, 6, 7, 9, 10, 0]). A note the mode does not have (a leading tone in a dominant chord) is heard
   as its nearest neighbour in it, lower on a tie. A voice a fixed number of semitones away is a third only half the time
   and a wrong note the rest, which is what a second fiddle used to be. */
export function harmonize(notes, pcs, steps) {
  const sc = [];
  for (let n = 24; n <= 108; n++) if (pcs.indexOf(n % 12) >= 0) sc.push(n);
  return notes.map(n => {
    let i = sc.indexOf(n[2]);
    if (i < 0) i = sc.reduce((b, v, j) => Math.abs(v - n[2]) < Math.abs(sc[b] - n[2]) ? j : b, 0);
    return [n[0], n[1], sc[Math.max(0, Math.min(sc.length - 1, i + steps))], n[3]];
  });
}
/* the part an octave up where there is room for it, and where there is not, as it stands */
export const octaveUp = (notes, top, vel) => notes.map(n => [n[0], n[1], n[2] + 12 <= top ? n[2] + 12 : n[2], vel == null ? n[3] : vel]);
/* a bass line from a pattern of [beat, length, 'r'|'5'|'8', velocity?] hits in each bar, on the root of each chord */
export function bassPattern(L, chords, bpb, pat, low) {
  const out = [];
  chords.forEach((c, b) => {
    const r = L.chordNotes(c, low || 40)[0];
    pat.forEach(h => out.push([b * bpb + h[0], h[1], h[2] === '5' ? r + 7 : h[2] === '8' ? r + 12 : r, h[3] == null ? 0.8 : h[3]]));
  });
  return out;
}
/* chords struck on the beats named (0-based, in beats): the "pah" of an oom-pah */
export function comp(L, chords, bpb, beats, base, len, vel) {
  const out = [];
  chords.forEach((c, b) => L.chordNotes(c, base || 57).forEach(n => beats.forEach(k => out.push([b * bpb + k, len || 0.45, n, vel == null ? 0.7 : vel]))));
  return out;
}
/* one hit every `bars` bars, as a drum pattern (patterns repeat to fill the song) */
export const everyBars = (bars, bpb, ch) => (ch || 'X') + '.'.repeat(bars * bpb * 4 - 1);

