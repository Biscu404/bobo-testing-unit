/* Stand Battle's tunes, part two: the other three places of Morioh and the boss. Same shape as part one (tunes_a.js): thirty-two bars, four sections of eight, a lead written out
   bar by bar, a style for every player (score_kit.js).

   SHOPPING STREET     A dorian, 106, swung a little: a funk groove, clean guitar scratching, a trumpet that says one thing and says it again
   BUDOGAOKA PARK      G major, 132: an anthem for the ring stage, a violin over strummed steel strings, a horn an octave under it when it matters
   KAMEYU STORE        G minor, 118, swung: the department store as a jazz-fusion room, vibes comping, a walking bass, a sax
   KILLER QUEEN        C minor, 148: a boss. The guitars chug in sixteenths from the first beat and the organ and choir come in when it is close */

const A_DOR = [9, 11, 0, 2, 4, 6, 7], G_MAJ = [7, 9, 11, 0, 2, 4, 6], G_MIN = [7, 9, 10, 0, 2, 3, 5], C_MIN = [0, 2, 3, 5, 7, 8, 10];
const SECS = ['verse', 'verse', 'chorus', 'break'];

export const TUNES_B = {
  shoppingstreet: {
    title: 'SHOPPING STREET', bpm: 106, beats: 4, swing: 0.12, key: 'A', pcs: A_DOR, secs: SECS, level: 1,
    chords: 'Am7 Am7 D7 D7 Am7 Am7 D7 D7  Am7 Am7 D7 D7 Gmaj7 Gmaj7 E7 E7  D7 E7 Am7 Am7 D7 E7 Am7 E7  Am7 Am7 Am7 Am7 Em7 Em7 D7 E7',
    lead: { inst: 'trumpet', layer: 'combat', vol: 1, vel: 1.25, reverb: 0.22, pan: 0.15, notes: [
      ['r:w', 'r:w', 'r:w', 'r:h r:e E5 G5:q', 'A5:e r G5 r E5 G5 A5:q', 'r:e A5 G5 E5 D5:q r:q', 'D5:e r F#5 r A5 F#5 D5:q', 'E5:e D5 C5 A4 C5:h'],
      ['A5:e r G5 r E5 G5 A5:q', 'B5:e A5 G5 E5 G5:q A5:q', 'F#5:e r A5 r B5 A5 F#5:q', 'D5:e F#5 A5 F#5 D5:h', 'G5:e r B5 r A5 G5 D5:q', 'F#5:e G5 A5 B5 A5:h', 'G#5:e r B5 r G#5 E5 B4:q', 'E5:h r:h'],
      ['A5:q. F#5:e D5:q F#5:q', 'G#5:q. B5:e E5:q G#5:q', 'A5:h G5:q E5:q', 'A5:q. B5:e A5:q G5:q', 'A5:q. F#5:e D5:q F#5:q', 'G#5:q. B5:e B5:q G#5:q', 'A5:e G5 E5 G5 A5:h', 'B5:h G#5:q E5:q'],
      ['r:w', 'r:w', 'E5:h A5:h', 'G5:h E5:h', 'G5:q. B5:e G5:q E5:q', 'D5:h E5:h', 'F#5:e A5 D5 F#5 A5:q F#5:q', 'E5:q G#5:q B5:h']] },
    doubleLead: { inst: 'sax', vol: 0.8, layer: 'tension', octave: -12, from: 8 },
    comp: { inst: 'epiano', base: 57, voicing: 'seventh', hold: 1, gate: 0.55, vol: 0.52, reverb: 0.15, pan: -0.3, layer: 'combat', pat: {
      verse: 'x..x..x.x..x..x.', chorus: 'X.x.X.x.X.x.X.x.', break: 'x.......x.......' }, fill: 'x..x..x.xxxxxxxx' },
    comp2: { inst: 'eguitar', base: 64, voicing: 'triad', hold: 1, gate: 0.3, vol: 0.7, reverb: 0.1, pan: 0.3, layer: 'combat', pat: {
      verse: '.xx.xx.x.xx.xx.x', chorus: 'xxxxxxxxxxxxxxxx', break: '................' } },
    bass: { inst: 'bass', base: 33, walk: false, vol: 0.88, pat: {
      verse: [[0, 0.22, 'r', 1], [0.5, 0.22, '8', 0.7], [0.75, 0.22, 'r', 0.6], [1.5, 0.22, '5', 0.7], [2, 0.22, 'r', 0.9], [2.75, 0.22, 'b7', 0.7], [3, 0.22, 'r', 0.8], [3.5, 0.45, '5', 0.7]],
      chorus: [[0, 0.4, 'r', 1], [0.5, 0.22, 'r', 0.6], [1, 0.4, '8', 0.8], [1.5, 0.22, '5', 0.6], [2, 0.4, 'r', 0.9], [2.5, 0.22, 'r', 0.6], [3, 0.4, 'b7', 0.8], [3.5, 0.22, '5', 0.65]],
      break: [[0, 1.9, 'r', 0.7], [2, 1.9, '5', 0.6]] } },
    pad: { inst: 'organ', base: 52, vel: 0.3, vol: 0.67, reverb: 0.3 },
    kit: {
      verse: { kick: 'x..x...x.x..x...', snare: '....x..o....x..o', hat: 'xoxoxoxoxoxoxoxo' },
      chorus: { kick: 'x..x..x.x..x..x.', snare: '....x..o....x..o', hat: 'xoxoxoxoxoxoxoxo', openhat: '......x.......x.' },
      break: { kick: 'x.......x.......', stick: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      fill: { kick: 'x.......x.......', snare: '....x.x.x.xxxxxx', hitom: '........x.x.....', tamb: 'x.x.x.x.x.x.x.x.' } } },

  budogaoka: {
    title: 'BUDOGAOKA PARK', bpm: 132, beats: 4, swing: 0, key: 'G', pcs: G_MAJ, secs: SECS, level: 1,
    chords: 'G G D D Em Em C C  G G D D Em Em C D  C D G Em C D G D  Em Em C C G G D D',
    lead: { inst: 'violin', layer: 'combat', vol: 1, vel: 1.3, reverb: 0.3, pan: -0.05, notes: [
      ['D5:q. G5:e B5:q A5:q', 'G5:h r:q D5:q', 'D5:q. F#5:e A5:q F#5:q', 'D5:h r:h', 'E5:q. G5:e B5:q G5:q', 'E5:h B4:h', 'C5:q. E5:e G5:q E5:q', 'C5:q D5:q E5:h'],
      ['G5:q B5:q D6:h', 'B5:q A5:q G5:h', 'A5:q. F#5:e D5:q F#5:q', 'A5:h F#5:h', 'G5:q. B5:e E6:q D6:q', 'B5:h G5:h', 'E5:q G5:q C6:q E6:q', 'D6:h A5:h'],
      ['E6:q. D6:e C6:q G5:q', 'F#5:q A5:q D6:h', 'B5:q. D6:e G6:q D6:q', 'E6:q. D6:e B5:q G5:q', 'E6:q. D6:e C6:q E6:q', 'F#6:q. E6:e D6:q A5:q', 'B5:q D6:q G6:h', 'D6:h. r:q'],
      ['G4:q B4:q E5:h', 'D5:q B4:q G4:h', 'E5:q G5:q C6:h', 'B5:q G5:q E5:h', 'D5:q G5:q B5:q D6:q', 'B5:q A5:q G5:h', 'A5:q F#5:q D5:q F#5:q', 'D6:h A5:q F#5:q']] },
    doubleLead: { inst: 'trumpet', vol: 0.75, layer: 'tension', octave: -12, from: 8 },
    horns: { inst: 'frenchhorn', base: 48, vel: 0.42, vol: 0.8, reverb: 0.35 },
    comp: { inst: 'steelgtr', base: 55, voicing: 'triad', hold: 2, gate: 0.9, vol: 0.45, reverb: 0.2, pan: -0.25, layer: 'combat', pat: {
      verse: 'x..xx.x.x..xx.x.', chorus: 'X.x.X.xxX.x.X.xx', break: 'x.......x.......' }, fill: 'x.x.x.x.xxxxxxxx' },
    bass: { inst: 'bass', base: 31, walk: true, vol: 0.82, pat: {
      verse: [[0, 0.45, 'r', 0.95], [0.5, 0.45, 'r', 0.65], [1, 0.45, '5', 0.8], [1.5, 0.45, 'r', 0.65], [2, 0.45, 'r', 0.9], [2.5, 0.45, 'r', 0.65], [3, 0.45, '5', 0.8]],
      chorus: [[0, 0.9, 'r', 1], [1, 0.45, 'r', 0.6], [1.5, 0.45, '8', 0.7], [2, 0.9, '5', 0.9], [3, 0.45, 'r', 0.65], [3.5, 0.45, '5', 0.7]],
      break: [[0, 1.9, 'r', 0.7], [2, 1.9, '5', 0.6]] } },
    pad: { inst: 'strings', base: 55, vel: 0.36, vol: 0.7, reverb: 0.4 },
    kit: {
      verse: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      chorus: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', openhat: 'x...x...x...x...', tamb: '..x...x...x...x.' },
      break: { kick: 'x.......x.......', stick: 'x...x...x...x...', shaker: 'x.x.x.x.x.x.x.x.' },
      fill: { kick: 'x.......x.......', snare: 'x.x.x.x.xxxxxxxx', lotom: '................' } } },

  kameyu: {
    title: 'KAMEYU STORE', bpm: 118, beats: 4, swing: 0.35, key: 'G', pcs: G_MIN, secs: SECS, level: 1,
    chords: 'Gm7 Gm7 Cm7 Cm7 Dm7 D7 Gm7 Gm7  Bbmaj7 Bbmaj7 Ebmaj7 Ebmaj7 Cm7 D7 Gm7 Gm7  Cm7 D7 Gm7 Gm7 Ebmaj7 Ebmaj7 D7 D7  Gm7 Cm7 Dm7 D7 Gm7 Gm7 D7 D7',
    lead: { inst: 'sax', layer: 'combat', vol: 1, vel: 1.2, reverb: 0.28, pan: 0.1, notes: [
      ['r:e G4 Bb4 D5 F5:q. D5:e', 'Bb4:q. G4:e D5:h', 'C5:e Eb5 G5 Eb5 D5:q C5:q', 'Bb4:h. r:q', 'A4:e D5 F5 A5 G5:q F5:q', 'D5:e F#5 A5 F#5 D5:h', 'G5:q. F5:e D5:q Bb4:q', 'G4:h. r:q'],
      ['D5:q. F5:e A5:q F5:q', 'D5:q Bb4:q F4:h', 'G4:q. Bb4:e D5:q F5:q', 'Eb5:h. r:q', 'G5:q Eb5:q C5:q Eb5:q', 'F#5:q D5:q A4:h', 'Bb4:e D5 G5 D5 Bb4:h', 'G4:h. r:q'],
      ['G5:q. Eb5:e C5:q Eb5:q', 'F#5:q. A5:e F#5:q D5:q', 'D5:q. G5:e F5:q D5:q', 'Bb4:h G4:h', 'G5:q. Eb5:e Bb4:q G4:q', 'D5:q Eb5:q G5:h', 'A5:q F#5:q D5:q F#5:q', 'A4:h. r:q'],
      ['D5:h F5:h', 'Eb5:h G5:h', 'F5:h A5:h', 'F#5:h. r:q', 'G5:q. F5:e D5:q Bb4:q', 'G4:h. r:q', 'A4:e C5 D5 F#5 A5:q F#5:q', 'D5:h. r:q']] },
    doubleLead: { inst: 'trombone', vol: 0.8, layer: 'tension', octave: -12, from: 8 },
    comp: { inst: 'vibes', base: 55, voicing: 'seventh', hold: 2, gate: 0.8, vol: 0.62, reverb: 0.35, pan: -0.3, layer: 'combat', pat: {
      verse: 'x..x......x.....', chorus: 'x..x..x...x..x..', break: 'x.......x.......' }, fill: 'x..x..x.x.x.x.x.' },
    bass: { inst: 'upright', base: 31, walk: true, vol: 0.76, pat: {
      verse: [[0, 0.9, 'r', 0.9], [1, 0.9, '3', 0.7], [2, 0.9, '5', 0.75], [3, 0.8, '8', 0.7]],
      chorus: [[0, 0.9, 'r', 0.95], [1, 0.9, '5', 0.75], [2, 0.9, 'b7', 0.8], [3, 0.8, '5', 0.7]],
      break: [[0, 1.9, 'r', 0.65], [2, 1.9, '5', 0.6]] } },
    pad: { inst: 'strings', base: 50, vel: 0.3, vol: 0.72, reverb: 0.4 },
    kit: {
      verse: { kick: 'x.......x.......', ride: 'x.xx.xx.xx.xx.xx', hat: '....x.......x...' },
      chorus: { kick: 'x..x....x..x....', snare: '....o.......x..o', ride: 'x.xx.xx.xx.xx.xx', hat: '....x.......x...' },
      break: { kick: 'x...............', stick: '....x.......x...', ride: 'x...x...x...x...' },
      fill: { kick: 'x.......x.......', snare: '....o.x.o.xxxxxx', hitom: '........x.x.....', ride: 'x.xx.xx.........' } } },

  queen: {
    title: 'KILLER QUEEN', bpm: 148, beats: 4, swing: 0, key: 'C', pcs: C_MIN, secs: SECS, level: 2,
    chords: 'Cm Cm Ab Ab Bb Bb G G  Cm Cm Fm Fm Ab Ab G G  Ab Bb Cm Cm Ab Bb G G  Cm Cm Gm Gm Ab Ab G G',
    lead: { inst: 'distgtr', layer: 'combat', vol: 0.13, reverb: 0.22, echo: 0.16, drive: 0.35, comp: 0.4, pan: 0.15, notes: [
      ['C5:e C5 Eb5 C5 G5:q F5:q', 'Eb5:e Eb5 F5 Eb5 C5:h', 'Ab4:e Ab4 C5 Ab4 Eb5:q C5:q', 'Ab4:e C5 Eb5 C5 Ab5:h', 'Bb4:e Bb4 D5 Bb4 F5:q D5:q', 'F5:e F5 G5 F5 D5:h', 'G4:e B4 D5 B4 G5:q F5:q', 'D5:h. r:q'],
      ['G5:q. G5:e F5:q Eb5:q', 'C5:h. r:q', 'Ab5:q. Ab5:e G5:q F5:q', 'C5:h F5:q Ab5:q', 'Eb5:q. Eb5:e Ab5:q C6:q', 'Bb5:q Ab5:q G5:h', 'B4:q D5:q G5:q B5:q', 'B5:h. r:q'],
      ['C6:q. Bb5:e Ab5:q Eb5:q', 'Bb5:q. F5:e D5:q F5:q', 'G5:q. C6:e Bb5:q G5:q', 'Eb5:h C5:h', 'C6:q. Bb5:e Ab5:q C6:q', 'Bb5:q. F5:e D5:q Bb4:q', 'B5:q. G5:e D5:q G5:q', 'B4:h. r:q'],
      ['C5:h Eb5:h', 'G5:h. r:q', 'Bb4:h D5:h', 'G5:h. r:q', 'C5:q Eb5:q Ab5:q C6:q', 'Bb5:q Ab5:q Eb5:h', 'D5:q G5:q B5:h', 'B5:h. r:q']] },
    doubleLead: { inst: 'choir', vol: 0.8, layer: 'tension', octave: 0, from: 8 },
    comp: { inst: 'distgtr', base: 45, voicing: 'power', hold: 2, gate: 0.8, vol: 0.075, reverb: 0.12, drive: 0.45, comp: 0.5, pan: -0.25, layer: 'combat', pat: {
      verse: 'X.xx.xx.x.xx.xx.', chorus: 'X...x...X...x...', break: 'x.x.x.x.x.x.x.x.' }, fill: 'x.x.x.x.xxxxxxxx' },
    bass: { inst: 'synthbass', base: 33, walk: false, vol: 0.62, pat: {
      verse: [[0, 0.22, 'r', 1], [0.25, 0.22, 'r', 0.55], [0.5, 0.22, 'r', 0.8], [0.75, 0.22, 'r', 0.55], [1, 0.22, 'r', 0.9], [1.25, 0.22, 'r', 0.55], [1.5, 0.22, '8', 0.8], [1.75, 0.22, 'r', 0.55],
        [2, 0.22, 'r', 0.95], [2.25, 0.22, 'r', 0.55], [2.5, 0.22, 'r', 0.8], [2.75, 0.22, 'b7', 0.6], [3, 0.22, 'r', 0.9], [3.25, 0.22, 'r', 0.55], [3.5, 0.22, '5', 0.8], [3.75, 0.22, 'r', 0.55]],
      chorus: [[0, 0.9, 'r', 1], [1, 0.45, 'r', 0.6], [1.5, 0.45, '8', 0.7], [2, 0.9, 'r', 0.95], [3, 0.45, '5', 0.7], [3.5, 0.45, 'r', 0.65]],
      break: [[0, 0.45, 'r', 0.8], [0.5, 0.45, 'r', 0.5], [1, 0.45, 'r', 0.8], [1.5, 0.45, 'r', 0.5], [2, 0.45, 'r', 0.8], [2.5, 0.45, 'r', 0.5], [3, 0.45, 'r', 0.8], [3.5, 0.45, 'r', 0.5]] } },
    pad: { inst: 'organ', base: 48, vel: 0.36, vol: 0.62, reverb: 0.45 },
    kit: {
      verse: { kick: 'x.xx..x.x.xx..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      chorus: { kick: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...', hat: 'x...x...x...x...', openhat: '..x...x...x...x.' },
      break: { kick: 'x.......x.......', lotom: 'x.x...x.x.x...x.', stick: '....x.......x...' },
      fill2: { kick: 'x.xx..x.x.xx..x.', snare: '....x.......x.xx', hat: 'x.x.x.x.x.x.x.x.' },
      fill: { kick: 'x.x.x.x.x.x.x.x.', snare: 'x.x.x.x.xxxxxxxx', hitom: '........x.x.....', midtom: '............x.x.', lotom: '..............xx' } },
    extra: { name: 'TIMPANI', inst: 'timpani', layer: 'tension', vol: 0.6, reverb: 0.3, hits: 'root' } }
};
