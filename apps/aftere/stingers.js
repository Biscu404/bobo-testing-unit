/* The three short pieces that end a run, all on D so each one can fall in under whatever was playing (the way it was flying fades in a
 * tenth of a second and these come up through the gap):
 *
 *   CLEAR   the arrival: a trumpet climbs to the Bb (the flat sixth of hijaz) and falls through A, G, F# to Eb, which is only a step from
 *           home, and the choir and the bells land on the D. About six seconds.
 *   UNLOCK  the same fanfare and then a second, higher, with the sparkle of a glockenspiel on top: a way has opened. About nine.
 *   DEATH   a cello and a trumpet's tail, the same fall as the clear but it comes down onto an Eb chord over a D in the bass and stays there:
 *           the flat second, unresolved. About six.
 *
 * They are played once (not looped) by music.js, which brings the title back when they are done.
 */
import { bars, soft, track, drums } from './score_kit.js';

/* one hit at the sixteenth `at` of `total`, as a drum pattern */
const once = (key, at, total) => ({ [key]: '.'.repeat(at) + 'x' + '.'.repeat(Math.max(0, total - at - 1)) });
const RUN = 'r:h D5:s Eb5 F#5 G5 A5 Bb5 C6 D6';                            /* the harp, up through the mode to the top */
const ROLL = 'r:h D2:s!60 D2!66 D2!72 D2!78 D2!84 D2!90 D2!96 D2!104';     /* a timpani roll in the last two beats of a bar */

export const STINGERS = {
  clear(L) {
    const ch = ['D', 'Gm', 'D'];
    return L.buildSong({ title: 'ARRIVAL', bpm: 112, key: 'D', scale: 'minor', bars: 3, beats: 4, tracks: [
      track('TRUMPET', 'trumpet', soft(bars(L, ['D5:q F#5 A5 Bb5', 'A5:q. G5:e F#5:q Eb5', 'D5:w'], 4), 1.1), { vol: 0.8, reverb: 0.4 }),
      track('NAY', 'flute', bars(L, ['D6:q F#6 A6 Bb6', 'A6:q. G6:e F#6:q Eb6', 'D6:w'], 4).map(n => [n[0], n[1], n[2], 0.5]), { vol: 0.4, reverb: 0.55, pan: 0.3 }),
      track('STRINGS', 'strings', soft(L.chordLine(ch, 4, 'pad', 50), 0.6), { vol: 0.5, reverb: 0.4 }),
      track('HARP', 'harp', bars(L, ['', RUN, ''], 4), { vol: 0.5, reverb: 0.5, pan: -0.3 }),
      track('ROLL', 'timpani', bars(L, ['', ROLL, 'D2:w!110'], 4), { vol: 0.56, reverb: 0.4 }),
      track('CHOIR', 'choir', bars(L, ['', '', 'D3+A3+F#4+D5:w!84'], 4), { vol: 0.5, reverb: 0.65 }),
      track('BELLS', 'bells', bars(L, ['', '', 'D6:e A5 F#5 D5 A4:h'], 4), { vol: 0.4, reverb: 0.65, pan: 0.3 }),
      drums('CRASH', once('crash', 32, 48), { vol: 0.5, reverb: 0.3 })] });
  },

  unlock(L) {
    const ch = ['D', 'Gm', 'Eb', 'D'];
    const lead = ['D5:q F#5 A5 Bb5', 'A5:q. G5:e F#5:q Eb5', 'G5:q Bb5 A5 F#5', 'D5:w'];
    return L.buildSong({ title: 'A WAY OPENS', bpm: 112, key: 'D', scale: 'minor', bars: 4, beats: 4, tracks: [
      track('TRUMPET', 'trumpet', soft(bars(L, lead, 4), 1.1), { vol: 0.8, reverb: 0.4 }),
      track('NAY', 'flute', bars(L, lead, 4).map(n => [n[0], n[1], n[2] + 12, 0.5]), { vol: 0.4, reverb: 0.55, pan: 0.3 }),
      track('STRINGS', 'strings', soft(L.chordLine(ch, 4, 'pad', 50), 0.62), { vol: 0.5, reverb: 0.4 }),
      track('HARP', 'harp', bars(L, ['', RUN, '', RUN], 4), { vol: 0.5, reverb: 0.5, pan: -0.3 }),
      track('SPARKLE', 'glock', bars(L, ['', '', 'r:h A5:s D6 F#6 A6 Bb6 A6 F#6 D6', 'D6:e A5 F#5 D6 A6:h'], 4), { vol: 0.4, reverb: 0.6, pan: 0.4 }),
      track('ROLL', 'timpani', bars(L, ['', ROLL, '', 'D2:w!110'], 4), { vol: 0.56, reverb: 0.4 }),
      track('CHOIR', 'choir', soft(bars(L, ['', '', 'Eb3+G3+Bb3+D4:h!70 Eb3+G3+Bb3+Eb4:h!78', 'D3+A3+F#4+D5:w!90'], 4), 1), { vol: 0.5, reverb: 0.65 }),
      drums('CRASH', once('crash', 48, 64), { vol: 0.5, reverb: 0.3 })] });
  },

  death(L) {
    return L.buildSong({ title: 'THE SAND', bpm: 76, key: 'D', scale: 'minor', bars: 2, beats: 4, tracks: [
      track('CELLO', 'cello', soft(bars(L, ['A3:q. G3:e F#3:q Eb3', 'Eb3:w'], 4), 1.1), { vol: 0.72, reverb: 0.5 }),
      track('PEDAL', 'cello', [[0, 8, 38, 0.7]], { vol: 0.5, reverb: 0.4 }),
      track('CHORD', 'strings', bars(L, ['D3+A3+F#4:w!60', 'Eb3+G3+Bb3+Eb4:w!70'], 4), { vol: 0.46, reverb: 0.55 }),
      track('CHOIR', 'choir', bars(L, ['D3+A3:w!56', 'Eb3+Bb3:w!60'], 4), { vol: 0.4, reverb: 0.7 }),
      track('GONG', 'bells', [[0, 4, 62, 0.8], [4, 4, 63, 0.6]], { vol: 0.4, reverb: 0.7 }),
      track('TIMPANI', 'timpani', [[0, 2, 38, 0.9], [4, 3, 39, 0.8]], { vol: 0.62, reverb: 0.45 })] });
  }
};
/* seconds one pass lasts, and the tail that rings after it */
export const secsOf = s => s.bars * s.beats * 60 / s.bpm;
