/* The small tools the symphony is written with. Time is in beats; a bar is four of them and
   bars are counted from 1, as a score is. Every function adds notes to an array
   ([start, dur, midi, vel]) or hits to one ([start, 'kick', vel]) and returns nothing. */
export const at = bar => (bar - 1) * 4;

/* a pattern of sixteenths ('x' a hit, 'X' an accent, '.' nothing) over `bars` bars, each hit a note of the
   pitch the bar asks for. `roots` is one midi note, or one per bar; `stack` is what is played with it
   (semitones above), so [0, 7, 12] is a power chord. */
export function chug(out, bar, bars, roots, pat, len, vel, stack) {
  for (let b = 0; b < bars; b++) {
    const r = Array.isArray(roots) ? roots[b % roots.length] : roots;
    for (let i = 0; i < pat.length; i++) {
      const c = pat[i];
      if (c === '.') continue;
      const t = at(bar + b) + i / 4 * (16 / pat.length);
      (stack || [0]).forEach(k => out.push([t, len, r + k, c === 'X' ? Math.min(1, vel + 0.12) : vel]));
    }
  }
}
/* the same chord (given as midi notes) held for `each` beats, one after another, a given velocity or a rise from one to another */
export function hold(out, bar, chords, each, vel, vel2, len) {
  const total = chords.length;
  chords.forEach((ch, i) => {
    const v = vel2 == null ? vel : vel + (vel2 - vel) * i / Math.max(1, total - 1);
    ch.forEach(n => out.push([at(bar) + i * each, len == null ? each : len, n, v]));
  });
}
/* notes from the text notation, starting at a bar, transposed, at a velocity */
export function tune(L, out, text, bar, semis, vel) {
  L.parseNotes(text).forEach(n => out.push([n[0] + at(bar), n[1], n[2] + (semis || 0), vel == null ? n[3] : vel]));
}
/* drums from patterns over a stretch of bars; fill is optional extra patterns for the last bar of the stretch */
export function kit(L, out, bar, bars, pats, fill) {
  const body = fill ? bars - 1 : bars, base = at(bar);
  L.parseDrums(pats, body * 4).forEach(h => out.push([h[0] + base, h[1], h[2]]));
  if (fill) L.parseDrums(fill, 4).forEach(h => out.push([h[0] + base + body * 4, h[1], h[2]]));
}
/* a run of notes, `step` beats apart, rising or falling through the given pitches, getting louder */
export function run(out, start, pitches, step, len, v0, v1) {
  pitches.forEach((p, i) => out.push([start + i * step, len, p, v0 + (v1 - v0) * i / Math.max(1, pitches.length - 1)]));
}
/* repeated notes (a tremolo, a roll): the same pitch(es) every `step` beats from a to b, louder as it goes */
export function roll(out, a, b, step, pitches, v0, v1, len) {
  const n = Math.round((b - a) / step);
  for (let i = 0; i < n; i++) pitches.forEach(p => out.push([a + i * step, len == null ? step * 0.9 : len, p, v0 + (v1 - v0) * i / Math.max(1, n - 1)]));
}
/* a roll on one piece of the kit: the same hit every `step` beats from a to b, getting louder */
export function drumRoll(out, a, b, step, key, v0, v1) {
  const n = Math.round((b - a) / step);
  for (let i = 0; i < n; i++) out.push([a + i * step, key, v0 + (v1 - v0) * i / Math.max(1, n - 1)]);
}
