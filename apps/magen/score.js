/* Magen's music: six tunes for the studio's real instruments.
 *
 * The star does not change tune when you click, and it does not get louder in steps: it is one band that
 * leans in. Every tune is sixteen bars and has the same four-part build, and the parts are *layers* the
 * game rides the level of (apps/magen/music.js, deck.levels), so a chain does not cut to another recording,
 * it brings the rest of the band in underneath the one that was already playing:
 *
 *   the core    a lead (clarinet, or a violin for the nigun), a nylon guitar rolling the chord, a cello and an upright bass,
 *               a squeezebox holding the harmony. Always there. It is a whole tune on its own.
 *   h1          the fiddle doubles the lead an octave up, pizzicato on the off-beats, a shaker. A hand has started to clap.
 *   h2          the kit (kick, snare, hats), a second voice in thirds, the squeezebox changes to oom-pah. Standing up.
 *   h3          a choir, the fiddle running arpeggios, timpani under every bar, a crash every four. The whole room.
 *
 * Six tunes, all on D, so any one can follow any other on a downbeat without a key change to make a seam of:
 *   FREYGISH     the mode itself (D Eb F# G A Bb C, the "Ahava Rabboh"), stated plainly at a walking pace
 *   NIGUN        a wordless tune, long notes, a violin; the same four bars grow, because that is the form
 *   HORA         6/8 in three beats, the one everybody stands up for
 *   MISHEBERACH  the Ukrainian dorian (D E F G# A B C), the mode of the prayer for the sick
 *   FREYLEKHS    the only major one: a quick dance, so the band is allowed to be glad
 *   ZMIROT       Shabbat. It does not climb, it does not have layers, and it does not end.
 * Four of them are in Ahava Rabbah, the phrygian dominant: the flattened second and the raised third that make a scale sound Jewish to
 * anybody who has ever been to a wedding. It is the mode of half the Ashkenazi liturgy and most of klezmer, and it is not a costume,
 * it is what the music is actually in. MI SHEBERACH is the Ukrainian dorian, the mode of the prayer for the sick. The tunes were once
 * a table of notes and frequencies in data.js, played by oscillators; the names and the modes are theirs.
 *
 * `ORDER` is the rotation: the music has a shape (walk, sing, dance, pray, celebrate) and not a scatter.
 */
import { memo, scale, harmonize, octaveUp, bassPattern, comp, everyBars } from '../scorekit.js';

export const IDS = ['freygish', 'nigun', 'hora', 'misheberach', 'freylekhs', 'zmirot'];
export const ORDER = ['freygish', 'nigun', 'hora', 'misheberach', 'freylekhs'];
export const NAMES = { freygish: 'FREYGISH', nigun: 'NIGUN', hora: 'HORA', misheberach: 'MI SHEBERACH', freylekhs: 'FREYLEKHS', zmirot: "Z'MIROT" };
export const LAYERS = ['h1', 'h2', 'h3'];
export const BARS = 16;

const FREYGISH = [2, 3, 6, 7, 9, 10, 0], MAJOR = [2, 4, 6, 7, 9, 11, 1];
const BAR = (...b) => b;

/* what each tune is: its tempo, its chords (a bar each), its melody (a bar each) and who plays and how */
export const TUNES = {
  freygish: {
    title: 'FREYGISH', bpm: 96, beats: 4, swing: 0.12, pcs: FREYGISH, lead: 'clarinet', fid: 'violin', two: ['trumpet', 'third'],
    chords: 'D D Gm D D Gm Eb A7 Gm Gm D D Eb A7 Gm A7',
    melody: BAR('D4:q. Eb4:e F#4:q G4', 'A4:q. Bb4:e A4:q F#4', 'G4:q Bb4 A4:e G4 F#4:q', 'F#4:q. Eb4:e D4:h',
                'D5:q. C5:e Bb4:q A4', 'Bb4:q. A4:e G4:q F#4', 'G4:q Bb4 Eb5 D5', 'A4:q C#5 E5 A5',
                'D5:h Bb4:q D5', 'G5:q. F#5:e D5:q Bb4', 'F#5:q. G5:e F#5:q Eb5', 'D5:h r:e A4 Bb4 A4',
                'G4:q Bb4 Eb5 Bb4', 'E5:q. D5:e C#5:q A4', 'D5:q Bb4 A4 G4', 'A4:q. G4:e F#4:q Eb4'),
    bass: [[0, 0.9, 'r'], [1.5, 0.4, 'r', 0.5], [2, 0.9, '5'], [3.5, 0.4, '5', 0.5]], afterbeats: [1, 3],
    kit: { kick: 'x.......x.......', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' },
    hand: { shaker: 'x.x.x.x.x.x.x.x.', tamb: '....o.......o...' }
  },
  nigun: {
    title: 'NIGUN', bpm: 78, beats: 4, swing: 0, pcs: FREYGISH, lead: 'violin', fid: 'clarinet', two: ['strings', 'down'],
    chords: 'D D Gm A7 D D A7 D Gm Gm D D Eb Eb A7 A7',
    melody: BAR('A4:h. Bb4:q', 'A4:q. G4:e F#4:h', 'G4:h Bb4', 'A4:q. G4:e F#4:q Eb4',
                'D4:q. F#4:e A4:q D5', 'C5:h Bb4:q A4', 'A4:h C#5:q E5', 'D5:w',
                'Bb4:h. A4:q', 'G4:q. A4:e Bb4:q D5', 'F#5:h D5', 'Eb5:q. D5:e A4:h',
                'G4:q Bb4 Eb5:h', 'D5:q. C5:e Bb4:h', 'A4:q C#5 E5 C#5', 'A4:h. r:q'),
    bass: [[0, 3.8, 'r']], afterbeats: [2],
    kit: { kick: 'x.......o.......', ride: 'x...x...x...x...' },
    hand: { shaker: 'o.o.o.o.o.o.o.o.' }
  },
  hora: {
    title: 'HORA', bpm: 132, beats: 3, swing: 0, pcs: FREYGISH, lead: 'clarinet', fid: 'violin', two: ['trumpet', 'third'],
    chords: 'D D Gm D D Gm D A7 Eb Eb D D Gm A7 D A7',
    melody: BAR('D5:q A4:e D5 Eb5:q', 'D5:e C5 Bb4:q A4', 'G4:q Bb4 D5', 'F#5:q. G5:e F#5:q',
                'D5:q A4:e D5 Eb5:q', 'D5:e C5 Bb4:q G4', 'A4:q D5 F#5', 'E5:q. D5:e C#5:q',
                'Eb5:q Bb4 G4', 'Bb4:e C5 Eb5:q D5', 'F#5:q A5 F#5', 'D5:q. Eb5:e F#5:q',
                'G5:q F#5:e G5 Bb5:q', 'A5:q E5 C#5', 'D5:q A4:e D5 F#5:q', 'E5:e D5 C#5:q A4'),
    bass: [[0, 0.9, 'r'], [1.5, 0.4, '5', 0.65]], afterbeats: [1, 2.5],
    kit: { kick: 'x.....x.....', snare: '....x.....x.', hat: 'o.o.o.o.o.o.' },
    hand: { shaker: 'x.x.x.x.x.x.', tamb: '....o.....o.' }
  },
  misheberach: {
    title: 'MI SHEBERACH', bpm: 84, beats: 4, swing: 0, pcs: null, lead: 'clarinet', fid: 'violin', two: ['cello', 'down'],
    chords: 'Dm Dm E A7 Dm Dm F C Gm Dm E A7 Dm F E A',
    melody: BAR('D4:q. E4:e F4:q A4', 'D5:h C5:q A4', 'G#4:q. A4:e B4:q G#4', 'A4:h r:q E4',
                'A4:q. F4:e A4:q D5', 'E5:h D5:q C5', 'C5:q. A4:e F4:q A4', 'C5:h E5:q C5',
                'Bb4:q. A4:e G4:q Bb4', 'A4:h D5', 'E5:q. D5:e B4:q G#4', 'A4:q. C#5:e E5:h',
                'D5:q. E5:e F5:q A5', 'A5:h F5:q C5', 'B4:q. G#4:e B4:q E5', 'A4:h. r:q'),
    bass: [[0, 1.8, 'r'], [2, 1.8, '5']], afterbeats: [1, 3],
    kit: { kick: 'x.......x.......', stick: 'o...o...o...o...' },
    hand: { shaker: 'o...o...o...o...', tamb: '....o.......o...' }
  },
  freylekhs: {
    title: 'FREYLEKHS', bpm: 138, beats: 4, swing: 0.2, pcs: MAJOR, lead: 'clarinet', fid: 'violin', two: ['trumpet', 'third'],
    chords: 'D D G D A7 A7 D D Bm Bm G D A7 A7 D A7',
    melody: BAR('D5:q F#5:e A5 F#5:q D5', 'E5:e F#5 G5:q F#5:h', 'G5:q B5:e G5 D5:q B4', 'A4:q D5 F#5:h',
                'E5:q C#5:e E5 A5:q E5', 'G5:q. F#5:e E5:q C#5', 'D5:q F#5 A5 F#5', 'D5:h r:q A4',
                'B4:q D5:e F#5 B5:q F#5', 'A5:q F#5:e D5 B4:h', 'G4:q B4 D5 G5', 'F#5:q. E5:e D5:h',
                'E5:q E5:e G5 A5:q G5', 'F#5:q E5 C#5 A4', 'D5:q F#5:e A5 D6:q A5', 'G5:q E5 C#5 E5'),
    bass: [[0, 0.9, 'r'], [1.5, 0.4, '5', 0.5], [2, 0.9, 'r'], [3.5, 0.4, '5', 0.5]], afterbeats: [1, 3],
    kit: { kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    hand: { shaker: 'x.x.x.x.x.x.x.x.', tamb: 'x...x...x...x...' }
  },
  zmirot: {
    title: 'ZMIROT', bpm: 56, beats: 4, swing: 0, pcs: FREYGISH,
    chords: 'D D Gm D Gm D Eb A D D Gm D Gm Eb A D',
    melody: BAR('A4:h. Bb4:q', 'A4:h F#4', 'G4:h. A4:q', 'F#4:w',
                'Bb4:h G4', 'F#4:h. G4:q', 'Eb4:h G4', 'E4:q A4 C#5:h',
                'A4:h. Bb4:q', 'D5:h A4', 'Bb4:h. A4:q', 'F#4:h. Eb4:q',
                'G4:h Bb4', 'Bb4:h G4', 'A4:q C#5 E5:h', 'D5:w')
  }
};

/* the tune's notes as the studio keeps them: [[start, dur, midi, vel]], the vel being the one the text gave (90/127) */
export const melodyOf = (L, id) => L.parseNotes(TUNES[id].melody.join(' | '));

const track = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
const layer = (t, name) => Object.assign(t, { layer: name });
const drums = (name, drums, o) => Object.assign({ name, drums }, o);

function band(L, id) {
  const d = TUNES[id], bpb = d.beats, ch = d.chords.split(' '), lead = melodyOf(L, id), pcs = d.pcs;
  const two = d.two[1] === 'third' ? harmonize(lead, pcs, -2) : lead.map(n => [n[0], n[1], n[2] - 12, n[3]]);
  const tracks = [
    /* the core */
    track('LEAD', d.lead, scale(lead, 1.15), { vol: 0.86, reverb: 0.3, pan: -0.1 }),
    track('NYLON', 'nylon', scale(L.chordLine(ch, bpb, 'arp', 52), 0.65), { vol: 0.42, reverb: 0.25, pan: -0.35 }),
    track('CELLO', 'cello', bassPattern(L, ch, bpb, [[0, bpb - 0.1, '8', 0.62]]), { vol: 0.52, reverb: 0.2, pan: 0.2 }),
    track('BASS', 'upright', bassPattern(L, ch, bpb, d.bass), { vol: 0.72, reverb: 0.04 }),
    track('SQUEEZEBOX', 'organ', scale(L.chordLine(ch, bpb, 'pad', 55), 0.4), { vol: 0.3, reverb: 0.35, pan: 0.3 }),
    /* h1: the fiddle, the off-beat, a hand */
    layer(track('FIDDLE', d.fid, octaveUp(lead, 91, 0.72), { vol: 0.52, reverb: 0.35, pan: 0.2 }), 'h1'),
    layer(track('PIZZ', 'pizz', comp(L, ch, bpb, d.afterbeats, 55, 0.4, 0.62), { vol: 0.5, reverb: 0.15, pan: -0.25 }), 'h1'),
    layer(drums('SHAKER', d.hand, { vol: 0.34, reverb: 0.08 }), 'h1'),
    /* h2: the kit, a second voice, oom-pah */
    layer(drums('KIT', d.kit, { vol: 0.62, reverb: 0.12 }), 'h2'),
    layer(track('SECOND', d.two[0], scale(two, 0.9), { vol: 0.5, reverb: 0.3, pan: 0.35 }), 'h2'),
    layer(track('OOMPAH', 'organ', comp(L, ch, bpb, d.afterbeats, 58, 0.42, 0.75), { vol: 0.36, reverb: 0.2, pan: 0.15 }), 'h2'),
    /* h3: the whole room */
    layer(track('CHOIR', 'choir', scale(L.chordLine(ch, bpb, 'pad', 64), 0.5), { vol: 0.4, reverb: 0.55 }), 'h3'),
    layer(track('RUNS', 'violin', scale(L.chordLine(ch, bpb, 'arp', 67), 0.62), { vol: 0.4, reverb: 0.3, pan: 0.4 }), 'h3'),
    layer(track('TIMPANI', 'timpani', bassPattern(L, ch, bpb, [[0, 1, 'r', 0.72]], 38), { vol: 0.5, reverb: 0.3 }), 'h3'),
    layer(drums('CRASH', { crash: everyBars(4, bpb), ride: 'x...'.repeat(bpb) }, { vol: 0.34, reverb: 0.25 }), 'h3')
  ];
  return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: BARS, beats: bpb, swing: d.swing, tracks });
}

/* the Shabbat tune: no layers, nothing for a click to bring in. A flute and a choir over strings, a harp, a low bell on the first bar of each four. */
function zmirot(L) {
  const d = TUNES.zmirot, ch = d.chords.split(' '), lead = melodyOf(L, 'zmirot');
  const bells = [0, 4, 8, 12].map(b => [b * 4, 3.5, 74, 0.45]);
  return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: BARS, beats: 4, tracks: [
    track('FLUTE', 'flute', scale(lead, 0.95), { vol: 0.74, reverb: 0.5, pan: -0.1 }),
    track('CHOIR', 'choir', scale(L.chordLine(ch, 4, 'pad', 60), 0.42), { vol: 0.4, reverb: 0.6 }),
    track('STRINGS', 'strings', scale(L.chordLine(ch, 4, 'pad', 52), 0.5), { vol: 0.4, reverb: 0.5, pan: 0.2 }),
    track('HARP', 'harp', scale(L.chordLine(ch, 4, 'arp', 55), 0.55), { vol: 0.46, reverb: 0.5, pan: -0.3 }),
    track('CELLO', 'cello', bassPattern(L, ch, 4, [[0, 3.9, '8', 0.6]]), { vol: 0.5, reverb: 0.25 }),
    track('BASS', 'upright', bassPattern(L, ch, 4, [[0, 3.9, 'r', 0.7]]), { vol: 0.55, reverb: 0.06 }),
    track('CHIME', 'bells', bells, { vol: 0.34, reverb: 0.7, pan: 0.3 })] });
}

/* a mode with no clean second voice in thirds (the prayer's borrowed Gm) is given its own: see `two` in TUNES */
const make = memo((L, id) => id === 'zmirot' ? zmirot(L) : band(L, id));
export const song = (L, id) => make(L, id);
