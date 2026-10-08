/* Dungeon Sweeper's tunes, part one: the three that are played above ground and in the first half of the descent.
 *
 * Dungeon synth: slow, dark and a little medieval. Each tune is sixteen bars of four beats, a melody that is simple on purpose and
 * is meant to be heard again and again, a pad that holds the chords like a cathedral with the windows out, a drone under it all, and
 * a bass that walks the roots. Written from scratch for this machine's instruments; the mood is the genre's, the notes are ours.
 *
 * A tune is data: `melody` is sixteen bars of notation (kernel/songtext.js), `chords` the chord of each bar. The band is built in
 * score.js from the parts named here (`lead`, `pad`, `bass`, `arp`, `booms`). */

export const TUNES_A = {
  gate: {
    title: 'THE HOLLOW GATE', bpm: 66, key: 'A', scale: 'minor', lead: 'ocarina', pad: 'choir', bass: 'cello', booms: [0],
    chords: 'Am F C G Am F E E Am F C G Dm E Am Am',
    melody: [
      'E5:h A4:q C5:q', 'F5:q. E5:e D5:h', 'C5:h B4:q C5:q', 'D5:w',
      'A4:q C5:e E5 A5:h', 'A5:q G5:e F5 E5:h', 'G#4:q B4:q E5:h', 'B4:h. E4:q',
      'C5:q. A4:e E4:h', 'F4:q A4:e C5 F5:h', 'G4:q E4:q C4:h', 'D4:q G4 B4:h',
      'D5:h C5:q A4:q', 'B4:q G#4:e E4 B4:h', 'E5:q. D5:e C5:q A4', 'A4:w'
    ]
  },
  crossway: {
    title: 'THE CROSSWAY', bpm: 74, key: 'E', scale: 'minor', lead: 'cello', pad: 'strings', bass: 'upright', arp: 'bells', booms: [],
    chords: 'Em C G D Em C Am B7 Em C G D Am B7 Em Em',
    melody: [
      'E4:h G4:q B4:q', 'C5:h B4:q A4:q', 'G4:h F#4:q E4:q', 'D4:q F#4:q A4:h',
      'E4:q G4:q B4:q G4:q', 'C4:h E4:q G4:q', 'A4:q C5:q E5:h', 'B4:q D#5:q F#5:h',
      'E5:h D5:q B4:q', 'C5:q B4:q A4:q G4:q', 'G4:h D4:q G4:q', 'D5:h C5:q B4:q',
      'A4:h C5:q E5:q', 'D#5:h F#4:q B4:q', 'E4:w', 'G4:h B4:q E5:q'
    ]
  },
  moss: {
    title: 'MOSS AND SPORE', bpm: 92, key: 'D', scale: 'minor', lead: 'flute', pad: 'synthpad', bass: 'bass', arp: 'harp', booms: [],
    chords: 'Dm C Bb C Dm C Bb A Dm C Bb C Gm A Dm Dm',
    melody: [
      'D5:q. F5:e A5:h', 'E5:q C5:e A4 C5:q E5', 'D5:h C5:q Bb4:q', 'C5:w',
      'D5:q F5 A5:h', 'C5:e Bb4 A4:q G4:h', 'Bb4:q D5:e F5 G5:q F5', 'A4:h. r:q',
      'F5:q. E5:e D5:q C5', 'Bb4:e C5 D5:q F5:h', 'G5:h F5:q E5:q', 'C5:q Bb4:e A4 G4:q F4',
      'G4:q Bb4 D5:h', 'A4:q C#5:e E5 A5:h', 'D5:h F5:q D5:q', 'D5:w'
    ]
  }
};
