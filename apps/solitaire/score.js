/* Solitaire's music: three tunes for the studio's real instruments, in the mood of a card table late at night.
 *
 * Slow and swung, a little sleazy and a little warm: a wurlitzer leaning on the off-beats, an electric bass that walks and then stops to let a
 * clarinet sing a blues tune over the top, a brushed kit that is more a heartbeat than a beat. It is not a copy of anything: it is the same
 * *kind* of room as a certain poker-and-jokers game's main theme (a slow shuffle, a minor seventh that never quite resolves, a melody that
 * sounds like it was thought of while shuffling) written from scratch for this machine's instruments.
 *
 * Every tune is sixteen bars, a core that is a whole tune on its own and two layers that the game rides the level of (apps/solitaire/music.js,
 * deck.levels): the more of the pack that is home, the more of the band is in the room.
 *
 *   the core   clarinet lead, wurlitzer on the off-beats, a walking electric bass, a ride and a stick (a heartbeat), an organ held under it all
 *   h1         vibes an octave over the lead and a muted trumpet answering it, and a shaker: the first aces are home and somebody has looked up
 *   h2         the full kit swinging, a sax in thirds under the tune, a second wurlitzer on the one: the table is full and the cards are flying
 *
 * Three tunes, three keys that are a fifth apart (C, G and D minor) so any can follow any on a downbeat with a seam that is just a
 * change of colour. `ORDER` is the rotation; the director (apps/director.js) changes tune on a bar line, never mid-phrase.
 */
import { memo, scale, harmonize, octaveUp, bassPattern, comp } from '../scorekit.js';

export const IDS = ['smallblind', 'riverdeal', 'lasthand'];
export const ORDER = ['smallblind', 'riverdeal', 'lasthand'];
export const NAMES = { smallblind: 'SMALL BLIND', riverdeal: 'RIVER DEAL', lasthand: 'LAST HAND' };
export const LAYERS = ['h1', 'h2'];
export const BARS = 16;

const C_MIN = [0, 2, 3, 5, 7, 8, 10], G_MIN = [7, 9, 10, 0, 2, 3, 5], D_MIN = [2, 4, 5, 7, 9, 10, 0];
const BAR = (...b) => b;

export const TUNES = {
  smallblind: {
    title: 'SMALL BLIND', bpm: 88, beats: 4, swing: 0.55, key: 'C', pcs: C_MIN, lead: 'clarinet', answer: 'trumpet',
    chords: 'Cm7 Cm7 Fm7 Fm7 Cm7 Cm7 G7 G7 Abmaj7 Abmaj7 Fm7 G7 Cm7 Fm7 G7 G7',
    melody: BAR('r:e G4 Bb4:q C5:e Bb4 G4:q', 'Eb5:q. D5:e C5:q Bb4', 'Ab4:e C5 Eb5:q D5:e C5 Ab4:q', 'G4:h r:q Bb4:e C5',
                'C5:q Bb4:e G4 Bb4:q G4', 'Eb4:q G4:e Bb4 C5:h', 'D5:q. B4:e G4:q B4', 'D5:h F5:q D5',
                'Eb5:q. C5:e Ab4:q C5', 'Eb5:e D5 C5:q Bb4:h', 'Ab4:q C5:e Eb5 F5:q Eb5', 'D5:q B4 G4:e B4 D5:q',
                'C5:q. Bb4:e G4:q Eb4', 'F4:q Ab4:e C5 Eb5:q C5', 'D5:q F5:e D5 B4:q G4', 'C5:h. r:q'),
    bass: [[0, 0.9, 'r'], [1.5, 0.4, 'r', 0.5], [2, 0.9, '5'], [3, 0.9, '8', 0.6]], stabs: [1.5, 3.5],
    kit: { kick: 'x.......x.o.....', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' },
    tick: { ride: 'x..xx..xx..xx..x', stick: '....o.......o...' }
  },
  riverdeal: {
    title: 'RIVER DEAL', bpm: 80, beats: 4, swing: 0.6, key: 'G', pcs: G_MIN, lead: 'clarinet', answer: 'trumpet',
    chords: 'Gm7 Gm7 Cm7 Cm7 Gm7 Gm7 D7 D7 Ebmaj7 Ebmaj7 Cm7 D7 Gm7 Cm7 D7 D7',
    melody: BAR('D5:q. Bb4:e G4:q Bb4', 'D5:e Eb5 D5:q Bb4:h', 'Eb5:q. D5:e C5:q G4', 'C5:h Eb5:q D5',
                'Bb4:q D5:e F5 D5:q Bb4', 'G4:h. r:q', 'A4:q. C5:e F#5:q D5', 'A4:h r:e C5 D5:q',
                'G5:q. F5:e Eb5:q D5', 'Bb4:h Eb5:q Bb4', 'C5:q Eb5:e G5 F5:q Eb5', 'D5:q F#5 A5:h',
                'G5:q. F5:e D5:q Bb4', 'Eb5:q C5:e G4 C5:q Eb5', 'F#5:q D5:e A4 C5:q D5', 'G4:h. r:q'),
    bass: [[0, 0.9, 'r'], [1, 0.4, 'r', 0.45], [2, 0.9, '5'], [3.5, 0.4, '5', 0.5]], stabs: [1, 3],
    kit: { kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.o.x.o.x.o.x.o.' },
    tick: { ride: 'x.x.x.x.x.x.x.x.', stick: '....o...o.......' }
  },
  lasthand: {
    title: 'LAST HAND', bpm: 94, beats: 4, swing: 0.5, key: 'D', pcs: D_MIN, lead: 'clarinet', answer: 'trumpet',
    chords: 'Dm7 Dm7 Gm7 Gm7 Dm7 Dm7 A7 A7 Bbmaj7 Bbmaj7 Gm7 A7 Dm7 Gm7 A7 A7',
    melody: BAR('A4:e D5 F5:q E5:e D5 A4:q', 'G5:q. F5:e E5:q D5', 'Bb4:q D5:e G5 F5:q D5', 'Bb4:h r:q A4:e Bb4',
                'D5:q. E5:e F5:q A5', 'G5:e F5 E5:q D5:h', 'C#5:q E5:e G5 E5:q C#5', 'A4:h r:q E5',
                'D5:q. F5:e Bb5:q A5', 'G5:h F5:q D5', 'G5:e F5 D5:q Bb4:q G4', 'C#5:q E5 G5:e A5 G5:q',
                'A5:q. G5:e F5:q E5', 'D5:q Bb4:e G4 Bb4:q D5', 'E5:q C#5:e A4 C#5:q E5', 'D5:h. r:q'),
    bass: [[0, 0.9, 'r'], [1.5, 0.4, '5', 0.5], [2.5, 0.4, 'r', 0.5], [3, 0.9, '5', 0.6]], stabs: [1.5, 3],
    kit: { kick: 'x...x.......x...', snare: '....x.......x..o', hat: 'o.o.o.o.o.o.o.o.' },
    tick: { ride: 'x..x..x.x..x..x.', stick: '....o.......o...' }
  }
};

/* the tune's notes as the studio keeps them: [[start, dur, midi, vel]] */
export const melodyOf = (L, id) => L.parseNotes(TUNES[id].melody.join(' | '));

const track = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
const layer = (t, name) => Object.assign(t, { layer: name });
const drums = (name, d, o) => Object.assign({ name, drums: d }, o);

function band(L, id) {
  const d = TUNES[id], bpb = d.beats, ch = d.chords.split(' '), lead = melodyOf(L, id);
  /* the answer: the lead's last two beats of each pair of bars, an octave up, muted, so the trumpet speaks where the clarinet has stopped */
  const answer = lead.filter(n => { const b = Math.floor(n[0] / bpb); return b % 2 === 1 && n[0] - b * bpb >= 2; }).map(n => [n[0], n[1], n[2] + 12, n[3] * 0.8]);
  const third = harmonize(lead, d.pcs, -2);
  const tracks = [
    /* the core */
    track('LEAD', d.lead, scale(lead, 1.1), { vol: 0.8, reverb: 0.32, pan: -0.1 }),
    track('WURLITZER', 'epiano', scale(comp(L, ch, bpb, d.stabs, 58, 0.42, 0.7), 0.85), { vol: 0.52, reverb: 0.22, pan: -0.3, eq: undefined }),
    track('BASS', 'bass', bassPattern(L, ch, bpb, d.bass, 36), { vol: 0.74, reverb: 0.04 }),
    track('ORGAN', 'organ', scale(L.chordLine(ch, bpb, 'pad', 52), 0.34), { vol: 0.3, reverb: 0.35, pan: 0.3 }),
    drums('HEARTBEAT', d.tick, { vol: 0.34, reverb: 0.1 }),
    /* h1: the first aces are home */
    layer(track('VIBES', 'vibes', octaveUp(lead, 96, 0.62), { vol: 0.46, reverb: 0.4, pan: 0.25 }), 'h1'),
    layer(track('ANSWER', d.answer, answer, { vol: 0.5, reverb: 0.3, pan: 0.35 }), 'h1'),
    layer(drums('SHAKER', { shaker: 'x.x.x.x.x.x.x.x.' }, { vol: 0.3, reverb: 0.08 }), 'h1'),
    /* h2: the table is full */
    layer(drums('KIT', d.kit, { vol: 0.6, reverb: 0.12 }), 'h2'),
    layer(track('SAX', 'sax', scale(third, 0.9), { vol: 0.46, reverb: 0.3, pan: 0.3 }), 'h2'),
    layer(track('WURLITZER 2', 'epiano', scale(comp(L, ch, bpb, [0], 62, 0.9, 0.6), 0.8), { vol: 0.36, reverb: 0.25, pan: -0.15 }), 'h2')
  ];
  tracks.forEach(t => { if (t.eq === undefined) delete t.eq; });
  return L.buildSong({ title: d.title, bpm: d.bpm, key: d.key, scale: 'minor', bars: BARS, beats: bpb, swing: d.swing, tracks });
}

const make = memo((L, id) => band(L, id));
export const song = (L, id) => make(L, id);
