/* AfterEgypt's tunes, as they were written: a tempo, a mode, a chord for every bar and a melody a bar to a string (the text notation of
 * kernel/songtext.js; a bar is exactly `beats` long, which `music_check.js` holds them to). Who plays them, and what lies under them, is
 * in band_early.js and band_late.js.
 *
 *   TITLE     NILE DAWN         hijaz, 66, a nay and a harp over a drone: the calm before you fly
 *   PILGRIM   FIRST LIGHT       hijaz, 92, eight bars: the whole way across is one pass of the tune
 *   SCRIBE    PAPYRUS           nahawand, 104, a violin that goes somewhere and comes back
 *   PRIEST    THE ZAR           phrygian, in three (6/8) at 120: a chant on a drone and a drum that does not stop
 *   PHARAOH   KING OF THE DUNES hijaz, 124: a trumpet, strings that will not sit still, and the wind
 *   TEMPLE    THE THIRD TEMPLE  double harmonic, 148, thirty-two bars in two halves: the approach and the gate
 */
import { HIJAZ, NAHAWAND, PHRYGIAN, DOUBLE } from './score_kit.js';

export const TUNES = {
  title: {
    title: 'NILE DAWN', bpm: 66, beats: 4, pcs: HIJAZ, lead: 'flute',
    chords: 'D D Gm D D Gm Gm D D Gm Cm D Gm Ebmaj7 Gm D',
    melody: ['A4:h. Bb4:q', 'A4:q. G4:e F#4:h', 'G4:q A4 Bb4:h', 'F#4:q Eb4 D4:h',
             'D5:h. C5:q', 'Bb4:q. A4:e G4:h', 'Bb4:q. C5:e D5:h', 'Eb5:h D5:q A4',
             'A4:q. Bb4:e A4:q F#4', 'G4:q. A4:e Bb4:h', 'C5:q Bb4 G4 A4', 'F#4:q. Eb4:e D4:q F#4',
             'G4:q A4 Bb4 C5', 'D5:h. Eb5:q', 'D5:q. C5:e Bb4:q A4', 'D4:w']
  },
  pilgrim: {
    title: 'FIRST LIGHT', bpm: 92, beats: 4, pcs: HIJAZ, lead: 'flute',
    chords: 'D Gm D D D Gm Eb D',
    melody: ['D5:q A4 D5 F#5', 'G5:h. F#5:q', 'A5:q. G5:e F#5:q D5', 'Eb5:h D5:h',
             'A4:q D5 F#5 A5', 'Bb5:q. A5:e G5:q F#5', 'G5:q F#5 Eb5 D5', 'D5:w']
  },
  scribe: {
    title: 'PAPYRUS', bpm: 104, beats: 4, pcs: NAHAWAND, lead: 'violin',
    chords: 'Dm Dm Gm A Dm Gm A Dm Bb A7 Dm Dm Gm Edim A7 Dm',
    melody: ['A4:q D5 F5 E5', 'D5:q. E5:e F5:h', 'G5:q F5 D5 Bb4', 'C#5:q E5 A5 E5',
             'F5:q E5 D5 F5', 'Bb5:q. A5:e G5:h', 'A5:q G5 F5 E5', 'D5:h. A4:q',
             'D5:q F5 Bb5 F5', 'C#6:q. A5:e E5:h', 'D6:q. C#6:e A5:h', 'F5:q E5 D5 E5',
             'G5:q Bb5 G5 A5', 'E5:q G5 Bb5 G5', 'A5:q G5 E5 C#5', 'D5:w']
  },
  priest: {
    title: 'THE ZAR', bpm: 120, beats: 3, pcs: PHRYGIAN, lead: 'clarinet',
    chords: 'Dm Dm Eb Dm Dm Cm Eb Dm Gm Dm Eb Dm Cm Eb Dm Dm',
    melody: ['A4:q. Bb4:q.', 'A4:q. G4:e F4:e D4:e', 'G4:q. Bb4:q.', 'A4:e G4 F4 Eb4 D4:q',
             'D4:q. F4:e A4:q', 'C5:q. Bb4:e A4:q', 'Bb4:q. G4:q.', 'A4:q. D4:q.',
             'D5:q. C5:e Bb4:q', 'A4:q. G4:q.', 'Bb4:q. Eb5:q.', 'D5:q. A4:q.',
             'C5:e Bb4 A4 G4 F4 Eb4', 'G4:q. Bb4:q.', 'A4:q. F4:q D4:e', 'D4:q. r:q.']
  },
  pharaoh: {
    title: 'KING OF THE DUNES', bpm: 124, beats: 4, pcs: HIJAZ, lead: 'trumpet',
    chords: 'D D Gm D D Eb Gm D Gm D D D Eb Cm Eb D',
    melody: ['A4:e D5 F#5 A5 F#5:q G5', 'Eb5:q. F#5:e D5:h', 'Bb4:e D5 G5 Bb5 G5:q A5', 'F#5:q. G5:e A5:h',
             'A4:e D5 F#5 A5 G5:q F#5', 'Bb5:q. G5:e Eb5:h', 'D5:e G5 Bb5 G5 Bb5:q A5', 'D5:w',
             'Bb5:h A5:q G5', 'F#5:q G5 A5:h', 'A5:q. G5:e F#5:q A5', 'D5:q F#5 A5:h',
             'Bb5:q. A5:e G5:q Eb5', 'G5:q Eb5 C5:h', 'G5:q Bb5 G5 Eb5', 'D5:q. A4:e D5:h']
  },
  temple: {
    title: 'THE THIRD TEMPLE', bpm: 148, beats: 4, pcs: DOUBLE, lead: 'trumpet',
    chords: 'D D Eb D D Gm Eb D D Gm Eb Eb Gm Gm A D ' + 'Gm Eb D D Eb Eb D D Gm A D D Eb A D D',
    melody: [
      /* the approach: three, three and two */
      'D5:q. D5:q. Eb5:q', 'F#5:q. Eb5:q. D5:q', 'G5:q. G5:q. Bb5:q', 'A5:q. F#5:q. D5:q',
      'D5:q. D5:q. Eb5:q', 'G5:q. F#5:q. D5:q', 'Bb5:q. G5:q. Eb5:q', 'F#5:h. D5:q',
      'A4:e D5 F#5 A5 Bb5:q A5', 'G5:q. F#5:e Eb5:h', 'Bb5:q. Bb5:q. A5:q', 'G5:q. Eb5:q. D5:q',
      'Bb5:q. A5:q. G5:q', 'D5:q. G5:q. Bb5:q', 'A4:q C#5 E5 A5', 'D5:h r:h',
      /* the gate */
      'Bb5:h. A5:q', 'G5:q. F#5:e Eb5:h', 'F#5:q A5 D5:h', 'A5:h. F#5:q',
      'G5:q. Bb5:q. G5:q', 'Eb5:q. G5:q. Bb5:q', 'A5:q F#5 D5 F#5', 'A5:w',
      'Bb5:q. A5:q. G5:q', 'C#5:q E5 A5 E5', 'D5:q F#5 A5 F#5', 'D5:h A4:h',
      'G5:q. Bb5:q. Eb5:q', 'C#5:e E5 A5 C#5 A5:q E5', 'D5:q F#5 A5 D5', 'D5:w']
  }
};
export const IDS = ['title', 'pilgrim', 'scribe', 'priest', 'pharaoh', 'temple'];
