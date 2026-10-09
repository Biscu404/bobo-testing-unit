/* Stand Battle's tunes, part one: the two for the screens between fights, and the Back Alley. Thirty-two bars each, four sections of eight, every bar of the lead written out
   (score_kit.js says what the rest of the band does with it). All of them are in a minor key so that any can follow any: the director (music.js) changes tune on a bar line.

   ARENA LIGHTS   the title and the menus: D minor, 92, a flute over electric piano and strings, city lights at dusk
   CHOOSE         the fighter select and the versus screen: A minor, 108, a piano and a saw lead, a pick-your-fighter strut
   BACK ALLEY     E minor, 124, palm-muted guitars and a bass that stays on the root, a lead that comes in late and says it twice */

const E_MIN = [4, 6, 7, 9, 11, 0, 2], D_MIN = [2, 4, 5, 7, 9, 10, 0], A_MIN = [9, 11, 0, 2, 4, 5, 7];
const SECS = ['verse', 'verse', 'chorus', 'break'];

export const TUNES_A = {
  arenalights: {
    title: 'ARENA LIGHTS', bpm: 92, beats: 4, swing: 0.12, key: 'D', pcs: D_MIN, secs: SECS, level: 0,
    chords: 'Dm7 Dm7 Bbmaj7 Bbmaj7 Fmaj7 Fmaj7 C C  Dm7 Dm7 Bbmaj7 Bbmaj7 Gm7 Gm7 A7 A7  Gm7 Gm7 Dm7 Dm7 Bbmaj7 Bbmaj7 A7 A7  Dm7 Bbmaj7 Fmaj7 C Gm7 Dm7 Asus4 A7',
    lead: { inst: 'flute', layer: 'explore', vol: 0.92, vel: 1.35, reverb: 0.4, pan: -0.1, notes: [
      ['A4:q. D5:e F5:q E5:q', 'D5:h r:q A4:e C5', 'Bb4:q. D5:e F5:q A5:q', 'G5:h F5:q D5:q', 'C5:q. F5:e A5:q G5:q', 'F5:h E5:q C5:q', 'G4:q. C5:e E5:q G5:q', 'E5:q D5:e C5 D5:h'],
      ['A4:q. D5:e F5:q E5:q', 'D5:q F5:q A5:h', 'Bb5:q. A5:e F5:q D5:q', 'F5:h D5:q Bb4:q', 'D5:q. G5:e Bb5:q A5:q', 'G5:h F5:q D5:q', 'E5:q. G5:e A5:q C#6:q', 'A5:h. r:q'],
      ['Bb5:q. A5:e G5:q Bb5:q', 'A5:q. G5:e F5:h', 'F5:q. A5:e D6:q C6:q', 'A5:h G5:q F5:q', 'D6:q. C6:e Bb5:q A5:q', 'G5:h F5:q D5:q', 'E5:q G5:e A5 C#6:q E6:q', 'D6:w'],
      ['D5:h F5:h', 'Bb4:h D5:h', 'A4:h C5:h', 'G4:h E5:h', 'Bb4:q D5:q G5:q F5:q', 'E5:q D5:q A4:h', 'D5:q. E5:e D5:q A4:q', 'C#5:q E5:q A5:h']] },
    arp: { inst: 'epiano', base: 57, pattern: [0, 1, 2, 3, 2, 1, 2, 3], vol: 0.6, reverb: 0.3, pan: -0.3, layer: 'explore' },
    bass: { inst: 'bass', base: 38, walk: false, vol: 0.86, pat: {
      verse: [[0, 1.4, 'r', 0.85], [1.5, 0.4, 'r', 0.5], [2, 1.4, '5', 0.7], [3.5, 0.4, '8', 0.55]],
      chorus: [[0, 0.9, 'r', 0.9], [1, 0.4, 'r', 0.5], [1.5, 0.4, '5', 0.6], [2, 0.9, 'r', 0.8], [3, 0.9, '5', 0.7]],
      break: [[0, 3.8, 'r', 0.6]] } },
    pad: { inst: 'strings', base: 50, vel: 0.34, vol: 0.63, reverb: 0.45 },
    kit: {
      verse: { kick: 'x.......x.o.....', stick: '....o.......o...', hat: 'o.o.o.o.o.o.o.o.' },
      chorus: { kick: 'x.....x.x.......', snare: '....o.......x...', hat: 'x.o.x.o.x.o.x.o.' },
      break: { kick: 'x...............', hat: 'o...o...o...o...' },
      fill: { kick: 'x.......x.......', snare: '........o.o.x.xx', hat: 'o.o.o.o.........' } },
    extra: { name: 'CELESTA', inst: 'celesta', layer: 'combat', vol: 0.8, reverb: 0.5, pan: 0.3, octave: 12, k: 0.9 } },

  choose: {
    title: 'CHOOSE', bpm: 108, beats: 4, swing: 0, key: 'A', pcs: A_MIN, secs: SECS, level: 1,
    chords: 'Am7 Am7 Fmaj7 Fmaj7 C C G G  Am7 Am7 Fmaj7 Fmaj7 Dm7 Dm7 E7 E7  F G Am7 Am7 F G E7 E7  Am7 Fmaj7 Dm7 E7 Am7 Fmaj7 G E7',
    lead: { inst: 'piano', layer: 'combat', vol: 1, vel: 1.35, reverb: 0.25, pan: -0.1, notes: [
      ['E5:q. A5:e G5:q E5:q', 'C5:q E5:q A4:h', 'A4:q. C5:e F5:q E5:q', 'C5:q A4:q F4:h', 'G4:q. C5:e E5:q G5:q', 'E5:h C5:h', 'D5:q. G5:e B5:q A5:q', 'G5:h D5:q B4:q'],
      ['E5:q. A5:e G5:q E5:q', 'C5:q E5:q A5:h', 'C6:q. A5:e F5:q C5:q', 'A5:h G5:q F5:q', 'D5:q. F5:e A5:q F5:q', 'D5:q. E5:e F5:h', 'E5:q G#5:q B5:q E6:q', 'E6:h. r:q'],
      ['F5:q. A5:e C6:q A5:q', 'G5:q. B5:e D6:q B5:q', 'A5:q. C6:e E6:q C6:q', 'A5:h E5:h', 'F5:q. A5:e C6:q F6:q', 'E6:q. D6:e B5:q G5:q', 'G#5:q B5:e E6 G#6:h', 'A6:w'],
      ['A5:q E5:q C5:h', 'A4:q C5:q F5:h', 'D5:q F5:q A5:q F5:q', 'E5:q G#5:q B5:h', 'A5:q. C6:e E6:q C6:q', 'A5:q. F5:e C5:q F5:q', 'G5:q B5:q D6:q B5:q', 'E6:q. D6:e B5:q G#5:q']] },
    doubleLead: { inst: 'synthlead', vol: 0.55, layer: 'tension', octave: -12, from: 8 },
    arp: { inst: 'vibes', base: 62, pattern: [0, 2, 1, 3, 2, 1, 3, 2], vol: 0.8, reverb: 0.4, pan: 0.3, layer: 'tension' },
    comp: { inst: 'epiano', base: 57, voicing: 'seventh', hold: 2, gate: 0.8, vol: 0.34, reverb: 0.18, pan: -0.25, layer: 'combat', pat: {
      verse: 'x..x..x...x.x...', chorus: 'x..x..x.x..x..x.', break: 'x.......x.......' }, fill: 'x..x..x.xxxxxxxx' },
    bass: { inst: 'synthbass', base: 33, walk: true, vol: 0.76, pat: {
      verse: [[0, 0.7, 'r', 0.9], [1, 0.45, 'r', 0.6], [1.5, 0.45, '8', 0.6], [2, 0.7, 'r', 0.85], [3, 0.45, '5', 0.65]],
      chorus: [[0, 0.45, 'r', 0.95], [0.5, 0.45, 'r', 0.6], [1, 0.45, '8', 0.7], [1.5, 0.45, 'r', 0.6], [2, 0.45, '5', 0.85], [2.5, 0.45, 'r', 0.6], [3, 0.45, '8', 0.7], [3.5, 0.45, '5', 0.65]],
      break: [[0, 1.9, 'r', 0.7], [2, 1.9, '5', 0.6]] } },
    pad: { inst: 'synthpad', base: 52, vel: 0.3, vol: 0.5, reverb: 0.4 },
    kit: {
      verse: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      chorus: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx', openhat: '......o.......o.' },
      break: { kick: 'x.......x.......', stick: '....x.......x...', hat: 'x...x...x...x...' },
      fill: { kick: 'x.......x.......', snare: '....x.x.x.xxxxxx', hitom: '........x.x.....' } } },

  backalley: {
    title: 'BACK ALLEY', bpm: 124, beats: 4, swing: 0, key: 'E', pcs: E_MIN, secs: SECS, level: 1,
    chords: 'Em Em Em Em Cmaj7 Cmaj7 D D  Em Em G G Cmaj7 Cmaj7 B7 B7  C D Em Em C D B7 B7  Am Am Em Em C C B7 B7',
    lead: { inst: 'distgtr', layer: 'combat', vol: 0.13, reverb: 0.2, echo: 0.14, drive: 0.3, comp: 0.4, pan: 0.15, notes: [
      ['r:w', 'r:w', 'r:w', 'r:h B4:q D5:q', 'E5:q. D5:e B4:q G4:q', 'E5:q D5:e E5 G5:h', 'F#5:q. E5:e D5:q A4:q', 'B4:h r:q B4:e D5'],
      ['E5:q. B4:e G4:q B4:q', 'E5:q D5:e B4 G4:h', 'D5:q. G5:e F#5:q D5:q', 'B4:h G4:q B4:q', 'C5:q. E5:e G5:q B5:q', 'A5:q G5:e E5 G5:h', 'D#5:q. F#5:e A5:q F#5:q', 'B4:h. r:q'],
      ['G5:q. E5:e C5:q E5:q', 'F#5:q. A5:e F#5:q D5:q', 'G5:q. B5:e G5:q E5:q', 'B5:h A5:q G5:q', 'G5:q. E5:e C5:q E5:q', 'F#5:q. A5:e B5:q A5:q', 'B5:q. A5:e F#5:q D#5:q', 'B4:h. r:q'],
      ['A4:h C5:h', 'E5:h. r:q', 'G4:h B4:h', 'E5:h. r:q', 'E5:q G5:q C6:q B5:q', 'A5:q G5:q E5:h', 'D#5:q F#5:q A5:q B5:q', 'B5:h. r:q']] },
    comp: { inst: 'distgtr', base: 45, voicing: 'power', hold: 2, gate: 0.8, vol: 0.09, reverb: 0.12, drive: 0.4, comp: 0.45, pan: -0.25, layer: 'combat', pat: {
      verse: 'X.xx.xx.x.xx.xx.', chorus: 'X.......X.......', break: 'x...x...x...x...' }, fill: 'x.x.x.x.xxxxxxxx' },
    bass: { inst: 'bass', base: 33, walk: false, vol: 0.86, pat: {
      verse: [[0, 0.45, 'r', 0.95], [0.5, 0.45, 'r', 0.7], [1, 0.45, 'r', 0.8], [1.5, 0.45, '8', 0.65], [2, 0.45, 'r', 0.9], [2.5, 0.45, 'r', 0.7], [3, 0.45, 'r', 0.8], [3.5, 0.45, '5', 0.65]],
      chorus: [[0, 1.9, 'r', 1], [2, 0.9, '5', 0.85], [3, 0.9, 'r', 0.85]],
      break: [[0, 3.9, 'r', 0.7]] } },
    pad: { inst: 'strings', base: 45, vel: 0.3, vol: 0.68, reverb: 0.4, len: 1 },
    kit: {
      verse: { kick: 'x..x....x.x.....', snare: '....x..o....x.o.', hat: 'x.x.x.x.x.x.x.x.' },
      chorus: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', openhat: '......o.......o.' },
      break: { kick: 'x.......x.......', stick: '....x.......x...', hat: 'x...x...x...x...' },
      fill2: { kick: 'x.......x.......', snare: '....x.......x.xx', hat: 'x.x.x.x.x.x.x.x.' },
      fill: { kick: 'x.......x.......', snare: '....x.x.x.......', hitom: '........x.x.....', midtom: '............x...', lotom: '..............x.' } },
    extra: { name: 'TIMPANI', inst: 'timpani', layer: 'tension', vol: 0.6, reverb: 0.3, hits: 'root' } }
};
