/* The last three ways: who plays, and what is under the tune (tunes.js has the tune; score_parts.js the layers the run shares).
 *
 *   THE ZAR            in three (6/8) at 120, on a drone: a clarinet chanting over a low choir, a cello and a timpani on every bar one, a rattle.
 *                      `build` is strings turning over, bells and the whole frame-drum kit; `swarm` is xylophones shaking a semitone and wood
 *                      ticking, the locusts; `edge` a heartbeat.
 *   KING OF THE DUNES  a trumpet on a tune that leaps, strings that will not sit still (eighths, staccato), an upright bass, timpani on one
 *                      and three and a saidi on the frame drum. `build`: a clarinet a third below, the harp, a choir and the full kit; `gust`: a
 *                      run up the mode, a whistle and a cymbal; `gate` for the last stretch.
 *   THE THIRD TEMPLE   in three, three and two, again and again, at 148: sixteenths from the strings, a bass and a timpani and a kick all on
 *                      the same count, a choir on the drone, a trumpet that does not rest. Thirty-two bars, the approach and the gate. Every layer.
 */
import { bassPattern, everyBars, harmonize } from '../scorekit.js';
import { TUNES } from './tunes.js';
import { HIJAZ, DOUBLE, bars, byChord, soft, pedal, trim, track, layer, drums } from './score_kit.js';
import { edge, swarm, gust, gate } from './score_parts.js';

const hits = (L, ch, bpb, low, list) => { const out = []; ch.forEach((c, b) => { const r = L.chordNotes(c, low)[0]; list.forEach(h => out.push([b * bpb + h[0], h[1], r, h[2]])); }); return out; };

export const LATE = {
  priest(L) {
    const d = TUNES.priest, ch = d.chords.split(' '), mel = bars(L, d.melody, 3);
    const turn = byChord(L, ch, 3, { Dm: 'D3:e F3 A3 D4 A3 F3', Eb: 'Eb3:e G3 Bb3 Eb4 Bb3 G3', Cm: 'C3:e Eb3 G3 C4 G3 Eb3', Gm: 'G2:e Bb2 D3 G3 D3 Bb2' });
    const up = mel.map(n => [n[0], n[1], n[2] + 12, n[3] * 0.55]);
    return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: 16, beats: 3, tracks: [
      track('CHANT', 'clarinet', soft(mel, 1.05), { vol: 0.8, reverb: 0.45, pan: -0.05 }),
      track('CHOIR', 'choir', soft(L.chordLine(ch, 3, 'pad', 50), 0.45), { vol: 0.5, reverb: 0.6 }),
      track('DRONE', 'cello', pedal(L, ch, 3, 38, 0.6), { vol: 0.58, reverb: 0.3 }),
      track('TIMPANI', 'timpani', hits(L, ch, 3, 38, [[0, 1, 0.74]]), { vol: 0.5, reverb: 0.35 }),
      drums('SISTRUM', { shaker: 'x.x.x.x.x.x.' }, { vol: 0.3, reverb: 0.15 }),
      layer(track('TURNING', 'strings', soft(turn, 0.8), { vol: 0.46, reverb: 0.35, pan: 0.25 }), 'build'),
      layer(track('SECOND', 'flute', up, { vol: 0.42, reverb: 0.55, pan: 0.3 }), 'build'),
      layer(track('BELLS', 'bells', [0, 4, 8, 12].map(b => [b * 3, 2.5, 74, 0.42]), { vol: 0.34, reverb: 0.6, pan: 0.35 }), 'build'),
      layer(drums('ZAR', { lotom: 'x.....x.x...', stick: '....x.....x.', hat: 'o.o.o.o.o.o.', tamb: 'x.x.x.x.x.x.' }, { vol: 0.58, reverb: 0.12 }), 'build'),
      ...swarm(L, ch, 3, { Dm: ['A5', 'Bb5'], Eb: ['Bb5', 'C6'], Cm: ['Eb5', 'F5'], Gm: ['D5', 'Eb5'] }, 'C6:e r C6 r r C6'),
      ...edge(L, ch, 3, { tick: { Dm: 'A4:e r r A4 r r', Eb: 'Bb4:e r r Bb4 r r', Cm: 'G4:e r r G4 r r', Gm: 'D5:e r r D5 r r' } })] });
  },

  pharaoh(L) {
    const d = TUNES.pharaoh, ch = d.chords.split(' '), mel = bars(L, d.melody, 4);
    const push = byChord(L, ch, 4, { D: 'D3:e D3 A3 D3 F#3 D3 A3 D3', Gm: 'G2:e G2 D3 G2 Bb2 G2 D3 G2', Eb: 'Eb3:e Eb3 Bb3 Eb3 G3 Eb3 Bb3 Eb3', Cm: 'C3:e C3 G3 C3 Eb3 C3 G3 C3' });
    const tick = { D: 'A4:e r A4 r A4 r A4 r', Gm: 'D5:e r D5 r D5 r D5 r', Eb: 'Bb4:e r Bb4 r Bb4 r Bb4 r', Cm: 'G4:e r G4 r G4 r G4 r' };
    return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: 16, beats: 4, swing: 0.04, tracks: [
      track('TRUMPET', 'trumpet', soft(mel, 1.1), { vol: 0.8, reverb: 0.35, pan: -0.05 }),
      track('STRINGS', 'strings', soft(push, 0.78), { vol: 0.5, reverb: 0.3, pan: 0.2 }),
      track('CELLO', 'cello', pedal(L, ch, 4, 38, 0.6), { vol: 0.5, reverb: 0.25 }),
      track('BASS', 'upright', bassPattern(L, ch, 4, [[0, 0.9, 'r', 0.82], [1.5, 0.4, 'r', 0.5], [2, 0.9, '5', 0.7], [3.5, 0.4, 'r', 0.5]], 38), { vol: 0.66, reverb: 0.05 }),
      track('TIMPANI', 'timpani', hits(L, ch, 4, 38, [[0, 1, 0.8], [2, 1, 0.64]]), { vol: 0.5, reverb: 0.35 }),
      drums('FRAME DRUM', { lotom: 'x.....x.x.......', stick: '....x.......x...', tamb: 'x.x.x.x.x.x.x.x.' }, { vol: 0.55, reverb: 0.12 }),
      layer(track('ZURNA', 'clarinet', soft(harmonize(mel, HIJAZ, -2), 0.8), { vol: 0.44, reverb: 0.35, pan: 0.3 }), 'build'),
      layer(track('HARP', 'harp', soft(L.chordLine(ch, 4, 'arp', 62), 0.55), { vol: 0.46, reverb: 0.5, pan: -0.3 }), 'build'),
      layer(track('CHOIR', 'choir', soft(L.chordLine(ch, 4, 'pad', 55), 0.42), { vol: 0.42, reverb: 0.6 }), 'build'),
      layer(drums('KIT', { kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.', crash: everyBars(4, 4) }, { vol: 0.56, reverb: 0.12 }), 'build'),
      ...edge(L, ch, 4, { tick }),
      ...swarm(L, ch, 4, { D: ['A5', 'Bb5'], Gm: ['D5', 'Eb5'], Eb: ['Bb5', 'C6'], Cm: ['Eb5', 'D5'] }, 'C6:e r C6 r r C6 r C6'),
      ...gust(L, ch, 4, 'D4:s Eb4 F#4 G4 A4 Bb4 C5 D5 Eb5 F#5 G5 A5 Bb5 C6 D6 Eb6', 'A5:s Bb5 A5 Bb5 A5 Bb5 A5 Bb5 D6:h'),
      ...gate(L, ch, 4, mel, 83)] });
  },

  temple(L) {
    const d = TUNES.temple, ch = d.chords.split(' '), mel = bars(L, d.melody, 4), n = ch.length;
    /* three, three and two, sixteenth by sixteenth, accented where the count lands */
    const grp = (r, s, t, u, v) => `${r}:s!105 ${r}!70 ${s}!75 ${r}!100 ${r}!70 ${s}!75 ${t}!100 ${u}!70 ${r}!105 ${r}!70 ${s}!75 ${r}!100 ${r}!70 ${s}!75 ${t}!100 ${v}!70`;
    const push = byChord(L, ch, 4, {
      D: grp('D3', 'Eb3', 'A3', 'Bb3', 'G3'), Eb: grp('Eb3', 'D3', 'Bb3', 'A3', 'G3'), Gm: grp('G2', 'A2', 'D3', 'Eb3', 'Bb2'),
      A: grp('A2', 'Bb2', 'C#3', 'D3', 'E3') });
    const tick = { D: 'A4:e r r A4 r r A4 r', Gm: 'D5:e r r D5 r r D5 r', Eb: 'Bb4:e r r Bb4 r r Bb4 r', A: 'E5:e r r E5 r r E5 r' };
    return L.buildSong({ title: d.title, bpm: d.bpm, key: 'D', scale: 'minor', bars: n, beats: 4, tracks: trim([
      track('TRUMPET', 'trumpet', soft(mel, 1.12), { vol: 0.8, reverb: 0.4, pan: -0.05 }),
      track('STRINGS', 'strings', soft(push, 0.78), { vol: 0.52, reverb: 0.25, pan: 0.2 }),
      track('CELLO', 'cello', pedal(L, ch, 4, 38, 0.66), { vol: 0.52, reverb: 0.25 }),
      track('BASS', 'bass', bassPattern(L, ch, 4, [[0, 0.9, 'r', 0.9], [1.5, 0.9, 'r', 0.8], [3, 0.9, 'r', 0.75]], 38), { vol: 0.62, reverb: 0.04, drive: 0.15 }),
      track('TIMPANI', 'timpani', hits(L, ch, 4, 38, [[0, 1, 0.86], [1.5, 1, 0.7], [3, 1, 0.7]]), { vol: 0.56, reverb: 0.35 }),
      track('CHOIR', 'choir', soft(L.chordLine(ch, 4, 'pad', 50), 0.46), { vol: 0.42, reverb: 0.65 }),
      drums('KIT', { kick: 'x.....x.....x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }, { vol: 0.6, reverb: 0.1 }),
      layer(track('SECOND', 'sax', soft(harmonize(mel, DOUBLE, -2), 0.8), { vol: 0.46, reverb: 0.35, pan: 0.3 }), 'build'),
      layer(track('HARP', 'harp', soft(L.chordLine(ch, 4, 'arp', 62), 0.55), { vol: 0.46, reverb: 0.5, pan: -0.3 }), 'build'),
      layer(track('HIGH STRINGS', 'strings', soft(L.chordLine(ch, 4, 'pad', 62), 0.42), { vol: 0.4, reverb: 0.55, pan: -0.15 }), 'build'),
      layer(drums('RIDE', { crash: everyBars(4, 4, 'X'), ride: 'x.x.x.x.x.x.x.x.', tamb: '..x...x...x...x.', clap: '....x.......x...' }, { vol: 0.5, reverb: 0.15 }), 'build'),
      ...edge(L, ch, 4, { tick }),
      ...swarm(L, ch, 4, { D: ['F#5', 'G5'], Gm: ['D5', 'Eb5'], Eb: ['Bb5', 'A5'], A: ['A5', 'Bb5'] }, 'D6:e r D6 r r D6 r D6'),
      ...gust(L, ch, 4, 'D4:s Eb4 F#4 G4 A4 Bb4 C#5 D5 Eb5 F#5 G5 A5 Bb5 C#6 D6 Eb6', 'A5:s Bb5 A5 Bb5 A5 Bb5 A5 Bb5 D6:h'),
      ...gate(L, ch, 4, mel, 83)], 0.8) });
  }
};
