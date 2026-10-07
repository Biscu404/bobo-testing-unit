/* AfterEgypt's score: what the title, the five ways and the stingers are all written with.
 *
 * Everything is on D, so any one of them can follow any other (the title into a way, a way into its stinger, the stinger back
 * into the title) without a key change to make a seam of. What changes from tier to tier is the mode, the tempo, the way the
 * drum is hit and how many people are playing:
 *
 *   HIJAZ     D Eb F# G A Bb C     the step from Eb up to F# (an augmented second) is the sound of the desert to anybody who has
 *                                  heard one; PILGRIM, PHARAOH and the title are in it
 *   NAHAWAND  D E F G A Bb C#      the Arabic harmonic minor: a scribe's mode, learned and a little sad
 *   PHRYGIAN  D Eb F G A Bb C      the dark one, a flat second leaning on a drone: the priest's chant
 *   DOUBLE    D Eb F# G A Bb C#    hijaz kar, two augmented seconds in one octave: the temple, where nothing is at rest
 *
 * `pcs` are pitch classes (D = 2). The notes themselves are in the text notation of kernel/songtext.js, a bar to a string.
 */
export const HIJAZ = [2, 3, 6, 7, 9, 10, 0];
export const NAHAWAND = [2, 4, 5, 7, 9, 10, 1];
export const PHRYGIAN = [2, 3, 5, 7, 9, 10, 0];
export const DOUBLE = [2, 3, 6, 7, 9, 10, 1];
export const MODES = { hijaz: HIJAZ, nahawand: NAHAWAND, phrygian: PHRYGIAN, double: DOUBLE };

/* a part written a bar at a time: texts[i] is bar i (a rest if it is empty), every bar `bpb` beats, `from` bars in.
   A bar that is not exactly `bpb` long is written down in `misfit` (music_check.js holds it empty): it would slide every bar after it. */
export const misfit = [];
export function bars(L, texts, bpb, from) {
  const out = [];
  (texts || []).forEach((t, i) => {
    if (!t) return;
    const ns = L.parseNotes(t);
    if (Math.abs(ns.length_ - bpb) > 1e-9) misfit.push(t + ' = ' + ns.length_ + ' beats, not ' + bpb);
    ns.forEach(n => out.push([n[0] + ((from || 0) + i) * bpb, n[1], n[2], n[3]]));
  });
  return out;
}
export const rep = (t, n) => Array(n).fill(t);
/* a one-bar pattern chosen by the chord of each bar: table = { Dm: 'D3:e A3 ...', Gm: '...' }, `other` for a chord it has no row for */
export const byChord = (L, chords, bpb, table, other) => bars(L, chords.map(c => table[c] || (other == null ? '' : other)), bpb);
/* the same notes with every velocity multiplied (kernel/songtext.js writes 90/127 by default) */
export const soft = (notes, k) => notes.map(n => [n[0], n[1], n[2], Math.max(0.05, Math.min(1, n[3] * k))]);
/* only what starts inside [from, to) beats: a part that waits, or stops, or does not ring past the end of the song */
export const within = (notes, from, to) => notes.filter(n => n[0] >= from && n[0] < to);
/* the notes that start inside the song, each cut off where the song ends (a part that is moved later must not ring past the loop) */
export const clip = (notes, len) => notes.filter(n => n[0] < len).map(n => n[0] + n[1] > len ? [n[0], len - n[0], n[2], n[3]] : n);
/* a part later in time and/or higher */
export const later = (notes, beats, semis, k) => notes.map(n => [n[0] + beats, n[1], n[2] + (semis || 0), k == null ? n[3] : Math.max(0.05, Math.min(1, n[3] * k))]);
/* the root of every chord held for its bar, from `low` (a drone, a pedal) */
export function pedal(L, chords, bpb, low, vel, len) {
  return chords.map((c, b) => [b * bpb, len == null ? bpb - 0.1 : len, L.chordNotes(c, low)[0], vel == null ? 0.7 : vel]);
}
/* a hit on beat 1 of the bars named (0-based), e.g. a bell at the top of each phrase */
export const at = (barList, bpb, dur, midi, vel) => barList.map(b => [b * bpb, dur, midi, vel]);
/* one note's worth of everything: the track a tune is made of */
export const track = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
export const layer = (t, name) => Object.assign(t, { layer: name });
/* every track's level times k: how loud a whole band sits against the others (a way the temple's size, the title a little under) */
export const trim = (tracks, k) => tracks.map(t => Object.assign(t, { vol: Math.round(t.vol * k * 1000) / 1000 }));
export const drums = (name, hits, o) => Object.assign({ name, drums: hits }, o);
