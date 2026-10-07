/* The delete reel. A selection put in the bin used to vanish in one frame with one sound, so a pile of two hundred
   files was a single thump. Now every file (or, for a big pile, every few) goes on its own beat, a short cooldown
   after the one before, and each beat is a note of a tune, so deleting a pile is a fast little melody.

   The tune is in C major pentatonic (C D E G A) on purpose: those five notes sit inside C major and inside D minor,
   the key the style meter's recording is in, and they are the notes the top rank's open fifths are made of, so the
   reel never fights anything that is playing. It is four eight-note phrases in a row (up, a step higher, across and
   down), whatever the length of the pile, and it always lands on the high C.

   This file is pure (no DOM, no speaker); kernel/fileops.js plays it, and scripts/check-delete.mjs holds it to its
   numbers. */
export const GAP = 70;       /* ms between one beat and the next: sixteenth notes at about 215 bpm */
export const SPAN = 3400;    /* the longest a pile is allowed to take, in ms, however big it is */

/* how a pile of n is spread over beats: one beat per file until that would take longer than SPAN, then several to a beat */
export function planReel(n) {
  n = Math.max(0, n | 0);
  const chunk = Math.max(1, Math.ceil(n / Math.floor(SPAN / GAP)));
  return { steps: Math.max(1, Math.ceil(n / chunk)), chunk, gap: GAP };
}

/* the pile cut into the groups that go on each beat, in order */
export function chunkItems(items, chunk) {
  const out = [];
  for (let i = 0; i < items.length; i += chunk) out.push(items.slice(i, i + chunk));
  return out;
}

/* the ladder the tune climbs: rung k is the pentatonic note k steps above C5 */
const PENTA = [0, 2, 4, 7, 9];
export const midiOf = k => 72 + PENTA[((k % 5) + 5) % 5] + 12 * Math.floor(k / 5);
export const hzOf = m => 440 * Math.pow(2, (m - 69) / 12);
const PHRASES = [
  [0, 1, 2, 3, 2, 1, 2, 0],
  [2, 3, 4, 3, 2, 3, 4, 5],
  [4, 3, 2, 3, 4, 5, 4, 3],
  [3, 4, 5, 4, 3, 2, 1, 0]
];
const HIGH_C = 5, G_BELOW = 3;

/* one note for each beat: { hz, accent, last }. A lone file gets a two-note "dun-dun" instead (steps === 1: G, then C). */
export function melody(steps) {
  const out = [];
  for (let s = 0; s < steps; s++) {
    const ph = PHRASES[Math.floor(s / 8) % PHRASES.length];
    out.push({ k: ph[s % 8], accent: s % 4 === 0, last: s === steps - 1 });
  }
  if (steps >= 2) { out[steps - 1].k = HIGH_C; out[steps - 2].k = G_BELOW; }
  return out.map(n => ({ hz: hzOf(midiOf(n.k)), midi: midiOf(n.k), accent: n.accent || n.last, last: n.last }));
}
