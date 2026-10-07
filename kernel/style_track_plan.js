/* What the style meter's song does and when, with no speaker in it (pure, so `node scripts/check-styletrack.mjs`
   can hold it to its numbers).

   The song is a recording (assets/style/at_ends.mp3, 2:29, D minor, 80 bpm with a half-time feel): it is played
   from a decoded buffer, not rendered note by note, which is why it starts at once.

   How it begins. The meter has just reached the top, and the machine has just made the sound of a file dying at that
   rank (open fifths, C and G). For the first BLEND seconds the two are one thing: the song comes up out of nothing
   under echoes of that sound, each one quieter and darker than the last, until all there is is the song. The song's own
   first thirty seconds are quiet, so it is the delete sound that carries the opening and the song that takes over.

   How it lasts. Kept at the top it plays through once, and when it reaches its end it does not stop and does not
   jump: the last SEAM seconds of the pass (the recording's own fade-out) cross into LOOP_FROM, the quiet build before
   the first drop, and it comes round again. */
export const FILE = 'assets/style/at_ends.mp3';
export const BLEND = 5;                         /* seconds the song takes to come in under the delete sound */
export const LOOP_FROM = 22;                    /* where every pass after the first begins: the build into the drop at 0:31 */
export const TAIL = 3;                          /* the last seconds of the file are its own fade to silence: a pass ends this early */
export const SEAM = 2.5;                        /* the crossfade between one pass and the next */
export const LEAD = 8;                          /* a pass is scheduled this many seconds before it is needed */
export const HEADROOM = 0.8;                    /* the recording is mastered to full scale: this keeps the channel and the glitch from clipping it */

/* the delete sound at the top rank, as notes (C6 G6 C7 G7: kernel/style_sfx.js), and the echoes of it that carry the
   opening: [seconds after the song starts, loudness against the real delete sound]. They are the same notes, so
   they never fight the song (C and G are both inside D minor), and they thin out as the song comes up. */
export const NOTES = [1046.5, 1568, 2093, 3136];
export const ECHOES = [[0.35, 0.8], [1.0, 0.6], [1.75, 0.42], [2.6, 0.28], [3.5, 0.17], [4.4, 0.09]];

const clamp01 = x => Math.max(0, Math.min(1, x));
/* how loud the song is `t` seconds into the opening: nothing, then a slow lift, then all of it (a smoothstep) */
export const songGain = t => { const x = clamp01(t / BLEND); return x * x * (3 - 2 * x); };
/* how bright an echo is: the sound is a square wave through a filter that closes from 6 kHz to 700 Hz as the song arrives */
export const echoCutoff = t => 700 + 5300 * (1 - clamp01(t / BLEND));
/* the opening as a curve of gains, for setValueCurveAtTime */
export const songCurve = (n = 64) => Float32Array.from({ length: n }, (_, i) => songGain(BLEND * i / (n - 1)));

/* Passes. Pass 0 is the whole recording from the start; every later pass runs from LOOP_FROM. Each pass ends TAIL
   seconds before the file does, and the next begins SEAM seconds before that, so the two overlap by SEAM.
   `at` is seconds after the song started (0 for the first); `from`/`to` are positions in the file; `fadeIn`/`fadeOut`
   are the seconds of crossfade at each end (the first pass has no fade-in: the opening curve is its own). */
export function pass(k, len) {
  const to = Math.max(LOOP_FROM + 4 * SEAM, len - TAIL);
  const from = k === 0 ? 0 : LOOP_FROM;
  let at = 0;
  for (let i = 0; i < k; i++) at += (i === 0 ? to : to - LOOP_FROM) - SEAM;
  return { k, at, from, to, dur: to - from, fadeIn: k === 0 ? 0 : SEAM, fadeOut: SEAM };
}
/* where in the song `t` seconds after it started is, as a position in the file (for tests and for the Stack's clock) */
export function positionAt(t, len) {
  for (let k = 0; k < 1000; k++) {
    const p = pass(k, len), next = pass(k + 1, len);
    if (t < next.at) return p.from + Math.min(t - p.at, p.dur);
  }
  return LOOP_FROM;
}
