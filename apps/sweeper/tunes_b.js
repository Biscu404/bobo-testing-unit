/* Dungeon Sweeper's tunes, part two: the guardians, and the Underdeep under the Hollow One.
 *
 * The Hollow One is the heaviest thing in the game and the tune says so: a brass ostinato in eighths over a choir that does not
 * resolve, the timpani on every beat, the bass in eighths. The Underdeep is the quiet one: sixty beats a minute, a celesta that
 * says a note and then waits for a long time, a low choir with no words, and the cello holding the floor. Same genre, same key
 * family as the rest (B and G minor), so the director can cross from any of them on a bar line. */

export const TUNES_B = {
  hollow: {
    title: 'THE HOLLOW ONE', bpm: 88, key: 'G', scale: 'minor', lead: 'frenchhorn', pad: 'choir', bass: 'synthbass', booms: [0, 1, 2, 3],
    chords: 'Gm Eb Bb D Gm Eb F D Cm Eb Ab Bb Gm Eb D Gm',
    melody: [
      'G4:e G4 D5 D5 Bb4:q G4:q', 'Eb4:e Eb4 Bb4 Bb4 G4:h', 'Bb4:e Bb4 D5 D5 F5:q D5:q', 'D5:h. r:q',
      'G4:e G4 D5 D5 C5:q Bb4:q', 'Eb4:e Eb4 G4 G4 Bb4:h', 'F4:e F4 A4 A4 C5:q A4:q', 'D5:w',
      'C4:e C4 Eb4 Eb4 G4:q Eb4:q', 'Eb4:e Eb4 Ab4 Ab4 C5:h', 'Ab4:e Ab4 C5 C5 Eb5:q D5:q', 'Bb4:h. r:q',
      'G4:e G4 D5 D5 Bb4:q G4:q', 'Eb4:e Eb4 Bb4 Bb4 G4:h', 'D4:e D4 A4 A4 F#4:q D4:q', 'G4:w'
    ]
  },
  underdeep: {
    title: 'THE UNDERDEEP', bpm: 60, key: 'B', scale: 'minor', lead: 'celesta', pad: 'voiceoohs', bass: 'cello', booms: [0, 2],
    chords: 'Bm G A F#m Bm G Em F# Bm G A F#m Bm G F#7 Bm',
    melody: [
      'B4:h. r:q', 'D5:q F#5:q G5:h', 'A4:h. C#5:q', 'E5:h D5:h',
      'B4:h. r:q', 'G4:q D5:q B4:h', 'E5:q G5:q B5:h', 'F#5:q E5:e D5 C#5:h',
      'B4:h. r:q', 'G4:q A4:q B4:q D5:q', 'A4:h. r:q', 'F#4:q A4:q C#5:h',
      'B4:h. r:q', 'G4:q D5:q G5:h', 'F#5:q A#4:q C#5:h', 'B4:w'
    ]
  }
};
