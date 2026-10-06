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
