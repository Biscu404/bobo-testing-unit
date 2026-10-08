/* The Studio Course's eyes: small pure functions that look at a song and say what is true of it. Nothing here touches the screen
   or the speaker, so `node apps/garage/course_check.js` can hold every goal of the course to a model answer. */
export const pc = n => ((n % 12) + 12) % 12;
export const notesOf = t => (t && t.notes) || [];
export const hitsOf = t => (t && t.hits) || [];
export const near = (a, b, e) => Math.abs(a - b) < (e == null ? 0.06 : e);
export const byId = (song, id) => song.tracks.find(t => t.id === id) || null;
export const drumsOf = song => song.tracks.find(t => t.inst === 'drums') || null;
export const pitchedOf = song => song.tracks.filter(t => t.inst !== 'drums');
export const noteCount = song => song.tracks.reduce((n, t) => n + notesOf(t).length + hitsOf(t).length, 0);
export const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const barOf = (song, beat) => Math.floor((beat + 1e-6) / song.beats);

/* the most notes sounding at once: how "chordy" a track is */
export function poly(t) {
  const ev = [];
  notesOf(t).forEach(n => { ev.push([n[0], 1], [n[0] + n[1] - 1e-4, -1]); });
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let c = 0, m = 0;
  ev.forEach(e => { c += e[1]; if (c > m) m = c; });
  return m;
}
/* who is who in a song, by what they play and not by what they are called: the lowest voice (under middle C's E, MIDI 52) is the bass,
   the voice with the most notes at once (`g.chordPoly`, three unless the genre says otherwise: power chords are two) is the chords, the
   highest of what is left is the lead, and the kit (or the timpani) is the drums */
export function roles(song, g) {
  const need = (g && g.chordPoly) || 3;
  const ps = pitchedOf(song).filter(t => notesOf(t).length && t.inst !== 'timpani');
  const mean = t => avg(notesOf(t).map(n => n[2]));
  const out = { drums: drumsOf(song) || song.tracks.find(t => t.inst === 'timpani') || null, bass: null, chords: null, lead: null };
  const low = ps.slice().sort((a, b) => mean(a) - mean(b))[0];
  if (low && mean(low) < 52) out.bass = low;
  const rest = ps.filter(t => t !== out.bass);
  out.chords = rest.filter(t => poly(t) >= need).sort((a, b) => poly(b) - poly(a) || mean(a) - mean(b))[0] || null;
  out.lead = rest.filter(t => t !== out.chords).sort((a, b) => mean(b) - mean(a))[0] || null;
  return out;
}
/* is there a hit of `piece` within a sixteenth of `pos` (in sixteenths from the top of `bar`)? */
export const hitAt = (t, piece, pos, bar, song) => hitsOf(t).some(h => h[1] === piece && near(h[0], (bar || 0) * song.beats + pos / 4, 0.07));
export const countHits = (t, piece, lo, hi) => hitsOf(t).filter(h => (!piece || h[1] === piece) && h[0] >= lo - 1e-6 && h[0] < hi - 1e-6).length;
/* notes of a track that start inside a bar */
export const inBar = (t, song, bar) => notesOf(t).filter(n => n[0] >= bar * song.beats - 0.05 && n[0] < (bar + 1) * song.beats - 0.05);
export const velOf = n => (n[3] == null ? 0.85 : n[3]);

/* two note lists as multisets: how many notes of `b` are not in `a` (start and pitch, to the sixteenth) */
const key = n => Math.round(n[0] * 8) + ':' + n[2];
export function newNotes(a, b) {
  const have = new Map();
  a.forEach(n => have.set(key(n), (have.get(key(n)) || 0) + 1));
  let fresh = 0;
  b.forEach(n => { const k = key(n), c = have.get(k) || 0; if (c > 0) have.set(k, c - 1); else fresh++; });
  return fresh;
}
/* did any note that is in both lists get a different velocity? */
export function velChanged(a, b) {
  const was = new Map(a.map(n => [key(n), velOf(n)]));
  return b.some(n => was.has(key(n)) && Math.abs(was.get(key(n)) - velOf(n)) > 0.04);
}
export const maxDur = t => notesOf(t).reduce((m, n) => Math.max(m, n[1]), 0);
/* every note of `now` is its partner in `then` shifted by `by` semitones, nothing added and nothing lost */
export function shiftedBy(then, now, by) {
  if (then.length !== now.length || !then.length) return false;
  const t = then.map(n => [n[0], n[2] + by]).sort((x, y) => x[0] - y[0] || x[1] - y[1]), u = now.map(n => [n[0], n[2]]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return t.every((n, i) => near(n[0], u[i][0], 0.01) && n[1] === u[i][1]);
}
/* is the pitch inside the scale of the song's key? (the same steps as kernel/songtext.js) */
const STEPS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], pentatonic: [0, 2, 4, 7, 9], pentaminor: [0, 3, 5, 7, 10], blues: [0, 3, 5, 6, 7, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10] };
const ROOT = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
export const keyPc = k => (ROOT[k] == null ? 0 : ROOT[k]);
export const inKey = (n, key, scale) => (STEPS[scale] || STEPS.major).indexOf(pc(n - keyPc(key))) >= 0;
/* the chord symbols' root pitch classes, bar by bar, for a song (as the band in a box would play them) */
export function chordRoots(L, song, prog) { return L.progression(song.key, song.scale, prog, song.bars).map(c => pc(L.chordNotes(c, 48)[0])); }
export function chordTones(L, song, prog) { return L.progression(song.key, song.scale, prog, song.bars).map(c => L.chordNotes(c, 48).map(pc)); }
