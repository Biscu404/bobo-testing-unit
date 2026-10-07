/* The title and the first two ways: who plays, and what is under the tune (tunes.js has the tune).
 *
 *   NILE DAWN   no layers, no drum: a nay, a harp, a drone and a choir that arrives half way. It is what the machine plays while you choose.
 *   FIRST LIGHT sparse and hopeful: a nay on the tune over an oud and a soft drum, the room nearly empty. `build` is the harp, a kalimba
 *               echoing the nay, a string pad and a rattle (the sky filling up as the temple gets nearer); `edge` is a heartbeat.
 *   PAPYRUS     a violin with something to say: an oud picking a saidi pattern, a marimba, a frame drum with its three strokes. `build` is
 *               the kalimba an octave up, strings and a tambourine; `edge` a heartbeat and a plucked pulse on the chord.
 */
import { bassPattern } from '../scorekit.js';
import { TUNES } from './tunes.js';
import { bars, byChord, soft, within, later, clip, pedal, trim, track, layer, drums } from './score_kit.js';
import { edge } from './score_parts.js';

const octaveUp = (notes, top, k) => notes.map(n => [n[0], n[1], n[2] + 12 <= top ? n[2] + 12 : n[2], Math.min(1, n[3] * k)]);

export const EARLY = {
  title(L) {
    const d = TUNES.title, ch = d.chords.split(' '), mel = bars(L, d.melody, 4);
    const bells = [0, 2, 4, 6, 8, 10, 12, 14].map(b => [b * 4, 3.5, b % 4 ? 86 : 81, 0.34]);       /* A5 on the phrase, D6 between */
    return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: 16, beats: 4, tracks: trim([
      track('NAY', 'flute', soft(mel, 1.05), { vol: 0.8, reverb: 0.55, pan: -0.1 }),
      track('HARP', 'harp', soft(L.chordLine(ch, 4, 'arp', 50), 0.62), { vol: 0.52, reverb: 0.5, pan: 0.3 }),
      track('STRINGS', 'strings', soft(L.chordLine(ch, 4, 'pad', 48), 0.38), { vol: 0.42, reverb: 0.55 }),
      track('DRONE', 'cello', pedal(L, ch, 4, 38, 0.55), { vol: 0.55, reverb: 0.3 }),
      track('CHOIR', 'choir', within(soft(L.chordLine(ch, 4, 'pad', 57), 0.3), 32, 64), { vol: 0.34, reverb: 0.65, pan: -0.2 }),
      track('BELLS', 'bells', bells, { vol: 0.3, reverb: 0.7, pan: 0.35 })], 1.15) });
  },

  pilgrim(L) {
    const d = TUNES.pilgrim, ch = d.chords.split(' '), mel = bars(L, d.melody, 4), len = 32;
    const oud = byChord(L, ch, 4, { D: 'D3:q A3:e D4 r:e F#4 A4:q', Gm: 'G3:q D4:e G4 r:e Bb4 D5:q', Eb: 'Eb3:q Bb3:e Eb4 r:e G4 Bb4:q' });
    return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: 8, beats: 4, tracks: [
      track('NAY', 'flute', soft(mel, 1.05), { vol: 0.8, reverb: 0.45, pan: -0.1 }),
      track('OUD', 'nylon', soft(oud, 0.85), { vol: 0.6, reverb: 0.25, pan: -0.3 }),
      track('BASS', 'upright', bassPattern(L, ch, 4, [[0, 1.4, 'r', 0.72], [2, 1.4, 'r', 0.62]], 38), { vol: 0.6, reverb: 0.05 }),
      drums('FRAME DRUM', { lotom: 'x.......o.......' }, { vol: 0.4, reverb: 0.2 }),
      layer(track('HARP', 'harp', soft(L.chordLine(ch, 4, 'arp', 55), 0.55), { vol: 0.5, reverb: 0.5, pan: 0.3 }), 'build'),
      layer(track('KALIMBA', 'kalimba', clip(later(mel, 1.5, 12, 0.42), len), { vol: 0.46, reverb: 0.45, pan: 0.4 }), 'build'),
      layer(track('PAD', 'strings', soft(L.chordLine(ch, 4, 'pad', 50), 0.4), { vol: 0.4, reverb: 0.5 }), 'build'),
      layer(drums('RATTLE', { stick: '....o.o.....o...', shaker: 'x.x.x.x.x.x.x.x.' }, { vol: 0.34, reverb: 0.1 }), 'build'),
      ...edge(L, ch, 4, { tick: { D: 'A4:e r r A4 r r A4 r', Gm: 'D5:e r r D5 r r D5 r', Eb: 'Bb4:e r r Bb4 r r Bb4 r' } })] });
  },

  scribe(L) {
    const d = TUNES.scribe, ch = d.chords.split(' '), mel = bars(L, d.melody, 4);
    const oud = byChord(L, ch, 4, {
      Dm: 'D3:e r D4 A3 F4 A3 D4 A3', Gm: 'G3:e r G4 D4 Bb4 D4 G4 D4', A: 'A2:e r E4 A3 C#4 E4 A3 E4', A7: 'A2:e r E4 A3 C#4 E4 A3 G4',
      Bb: 'Bb2:e r F4 Bb3 D4 F4 Bb3 F4', Edim: 'E3:e r G4 E4 Bb4 G4 E4 G4' });
    const tick = { Dm: 'A4:e r r A4 r r A4 r', Gm: 'D5:e r r D5 r r D5 r', A: 'E5:e r r E5 r r E5 r', A7: 'E5:e r r E5 r r E5 r', Bb: 'F5:e r r F5 r r F5 r', Edim: 'G5:e r r G5 r r G5 r' };
    return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: 16, beats: 4, swing: 0.06, tracks: [
      track('VIOLIN', 'violin', soft(mel, 1.1), { vol: 0.78, reverb: 0.4, pan: 0.1 }),
      track('OUD', 'steelgtr', soft(oud, 0.85), { vol: 0.6, reverb: 0.2, pan: -0.35 }),
      track('BASS', 'upright', bassPattern(L, ch, 4, [[0, 0.9, 'r', 0.8], [1.5, 0.4, '8', 0.55], [3, 0.9, 'r', 0.66]], 38), { vol: 0.64, reverb: 0.05 }),
      drums('FRAME DRUM', { lotom: 'x.....x.x.......', stick: '....x.......x...' }, { vol: 0.5, reverb: 0.15 }),
      track('MARIMBA', 'marimba', soft(L.chordLine(ch, 4, 'arp', 62), 0.5), { vol: 0.42, reverb: 0.3, pan: 0.35 }),
      layer(track('KALIMBA', 'kalimba', octaveUp(mel, 90, 0.5), { vol: 0.44, reverb: 0.4, pan: 0.4 }), 'build'),
      layer(track('PAD', 'strings', soft(L.chordLine(ch, 4, 'pad', 50), 0.42), { vol: 0.42, reverb: 0.5 }), 'build'),
      layer(drums('TAMBOURINE', { tamb: 'x.x.x.x.x.x.x.x.', shaker: '..o...o...o...o.' }, { vol: 0.36, reverb: 0.1 }), 'build'),
      ...edge(L, ch, 4, { inst: 'pizz', tick })] });
  }
};
