/* Bekkedal's five tunes, for real instruments.

   The tunes are the ones the valley has always had (dag, kveld, gruva, vidda, folkedans), with the
   same notes and the same chords; what changed is who plays them. A flute or a violin carries the
   melody over nylon guitar, harp, a section of strings, a cello or an upright bass, and the odd
   bell; each tune is now eight bars (the old four, then a second time round that goes somewhere
   else) so that it does not come round so soon. Every part a night does without is tagged with
   a layer, ('lead' and 'arp'), and the game switches those off after dark, as it always did. */
import { eighths, shifted, scale, above, memo } from '../scorekit.js';

/* the melodic bones, as they were written: eighth notes against the tempo */
const T = {
  dag: { lead: [['Fs4', 0, 4], ['A4', 4, 3], ['B4', 8, 3], ['D5', 12, 5]], arp: [['A4', 2, 1], ['D5', 10, 1], ['Fs5', 18, 1], ['A4', 26, 1]] },
  kveld: { lead: [['B3', 0, 6], ['Fs4', 8, 5], ['D4', 16, 4]], arp: [['B4', 4, 2], ['D4', 14, 2], ['Fs4', 24, 2]] },
  gruva: { lead: [['E3', 0, 8], ['A3', 12, 4]], bass: [['E3', 0, 8], ['E3', 8, 8], ['Cs3', 16, 8], ['A2', 24, 8]],
    pad: [['E3', 0, 16], ['B3', 0, 16], ['A3', 16, 16], ['E3', 16, 16]], arp: [['G4', 12, 2], ['E4', 24, 2]] },
  vidda: { lead: [['A4', 0, 4], ['E5', 4, 4], ['D5', 10, 4]], arp: [['A5', 0, 1], ['E5', 9, 1], ['D5', 18, 1], ['E5', 26, 1]] },
  folkedans: { lead: [['D5', 0, 2], ['A4', 2, 1], ['D5', 3, 1], ['Fs5', 4, 2], ['E5', 6, 2], ['D5', 16, 4], ['A4', 20, 2], ['Fs4', 22, 2]],
    arp: [['D5', 0, 1], ['Fs5', 4, 1], ['A4', 8, 1], ['D5', 16, 1], ['Fs5', 20, 1]] }
};
export const IDS = ['dag', 'kveld', 'gruva', 'vidda', 'folkedans'];
export const NAMES = { dag: 'DAG', kveld: 'KVELD', gruva: 'GRUVA', vidda: 'VIDDA', folkedans: 'FOLKEDANS' };
/* the pool each game situation draws from keeps asking for these ids; whether a tune is one that goes quiet at night: */
export const NIGHT = { kveld: true, gruva: true };

const text = (L, s, at, vel) => L.parseNotes(s).map(n => [n[0] + at, n[1], n[2], vel == null ? n[3] : vel]);
const track = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);

const BUILD = {
  /* the day: D major, a slow walk down a lane */
  dag(L) {
    const ch = ['D', 'A', 'Bm', 'G', 'D', 'Bm', 'G', 'A'];
    const lead = eighths(T.dag.lead, 0.64).concat(text(L, 'D5:q. B4:e A4:h | B4:q A4 F#4:h | G4:q A4 B4 D5 | A4:w', 16, 0.6));
    const harp = eighths(T.dag.arp, 0.45).concat(shifted(eighths(T.dag.arp, 0.45), 16, 0));
    return L.buildSong({ title: 'DAG', bpm: 59, key: 'D', scale: 'major', bars: 8, tracks: [
      track('FLUTE', 'flute', lead, { vol: 0.78, reverb: 0.4, layer: 'lead' }),
      track('NYLON', 'nylon', scale(L.chordLine(ch, 4, 'arp', 55), 0.5), { vol: 0.62, reverb: 0.3, pan: -0.25, layer: 'arp' }),
      track('HARP', 'harp', harp, { vol: 0.5, reverb: 0.5, pan: 0.3, layer: 'arp' }),
      track('STRINGS', 'strings', scale(L.chordLine(ch, 4, 'pad', 50), 0.55), { vol: 0.42, reverb: 0.5 }),
      track('BASS', 'upright', L.bassLine(ch, 4, 'root'), { vol: 0.6, reverb: 0.05 }),
      { name: 'BRUSHES', drums: { shaker: '..x...x...x...x.', kick: 'x.......x.......' }, vol: 0.2, reverb: 0.1, layer: 'arp' }] });
  },
  /* the evening: B minor, one candle and the cello. After dark only the pad and the bass remain. */
  kveld(L) {
    const ch = ['Bm', 'Gmaj7', 'Em7', 'F#sus4', 'Bm', 'G', 'D', 'F#7'];
    const lead = eighths(T.kveld.lead, 0.5).concat(text(L, 'D4:h F#4:h | B3:w | A3:q. B3:e D4:h | F#4:w', 16, 0.5));
    const bells = eighths(T.kveld.arp, 0.4).concat(shifted(eighths(T.kveld.arp, 0.4), 16, 12));
    return L.buildSong({ title: 'KVELD', bpm: 44, key: 'B', scale: 'minor', bars: 8, tracks: [
      track('PIANO', 'piano', lead, { vol: 0.7, reverb: 0.5, layer: 'lead' }),
      track('MUSIC BOX', 'musicbox', bells, { vol: 0.45, reverb: 0.55, pan: 0.3, layer: 'arp' }),
      track('CHOIR', 'choir', scale(L.chordLine(ch, 4, 'pad', 52), 0.4), { vol: 0.34, reverb: 0.6 }),
      track('STRINGS', 'strings', scale(L.chordLine(ch, 4, 'pad', 46), 0.45), { vol: 0.32, reverb: 0.55 }),
      track('CELLO', 'cello', L.bassLine(ch, 4, 'root'), { vol: 0.62, reverb: 0.3 })] });
  },
  /* the mine: E minor, low and slow, a drip somewhere */
  gruva(L) {
    const pad = eighths(T.gruva.pad, 0.5).concat(scale(L.chordLine(['Em', 'Am', 'C', 'B7'], 4, 'pad', 46), 0.5).map(n => [n[0] + 16, n[1], n[2], n[3]]));
    const bass = eighths(T.gruva.bass, 0.7).concat(L.bassLine(['Em', 'Am', 'C', 'B7'], 4, 'root').map(n => [n[0] + 16, n[1], n[2], n[3]]));
    const bells = eighths(T.gruva.arp, 0.4).concat(shifted(eighths(T.gruva.arp, 0.4), 16, -5));
    const drips = [[3, 0.2, 83], [7.5, 0.2, 76], [12, 0.2, 83], [19, 0.2, 80], [24.5, 0.2, 76], [28, 0.2, 83]].map(n => [n[0], n[1], n[2], 0.3]);
    const hits = [[0, 4, 40, 0.5], [8, 4, 40, 0.45], [16, 4, 36, 0.5], [24, 4, 35, 0.5]];
    return L.buildSong({ title: 'GRUVA', bpm: 39, key: 'E', scale: 'minor', bars: 8, tracks: [
      track('LOW STRINGS', 'strings', pad, { vol: 0.42, reverb: 0.55 }),
      track('CHOIR', 'choir', scale(pad, 0.5), { vol: 0.26, reverb: 0.65 }),
      track('CELLO', 'cello', bass, { vol: 0.62, reverb: 0.4 }),
      track('TIMPANI', 'timpani', hits, { vol: 0.35, reverb: 0.6 }),
      track('BELLS', 'bells', bells, { vol: 0.3, reverb: 0.6, pan: 0.35, layer: 'arp' }),
      track('PICK', 'woodblock', drips, { vol: 0.4, reverb: 0.5, pan: -0.3, layer: 'arp' }),
      track('FLUTE', 'flute', eighths(T.gruva.lead, 0.45).concat(text(L, 'B4:w | G4:h. E4:q', 20, 0.4)), { vol: 0.5, reverb: 0.6, layer: 'lead' })] });
  },
  /* the high ground: A major, wide and bright */
  vidda(L) {
    const ch = ['A', 'D', 'G', 'A', 'A', 'F#m', 'D', 'E'];
    const lead = eighths(T.vidda.lead, 0.62).concat(text(L, 'E5:h C#5:h | A4:q B4 C#5 E5 | F#5:h. D5:q | E5:w', 16, 0.6));
    const harp = eighths(T.vidda.arp, 0.5).concat(L.chordLine(ch.slice(4), 4, 'arp', 76).map(n => [n[0] + 16, n[1], n[2], 0.38]));
    return L.buildSong({ title: 'VIDDA', bpm: 49, key: 'A', scale: 'major', bars: 8, tracks: [
      track('FLUTE', 'flute', lead, { vol: 0.76, reverb: 0.55, layer: 'lead' }),
      track('HARP', 'harp', harp, { vol: 0.5, reverb: 0.55, pan: 0.3, layer: 'arp' }),
      track('STRINGS', 'strings', scale(L.chordLine(ch, 4, 'pad', 52), 0.5), { vol: 0.42, reverb: 0.6 }),
      track('CHOIR', 'choir', scale(L.chordLine(ch, 4, 'pad', 57), 0.35), { vol: 0.28, reverb: 0.7 }),
      track('CELLO', 'cello', L.bassLine(ch, 4, 'root'), { vol: 0.55, reverb: 0.3 }),
      track('OCARINA', 'ocarina', text(L, 'r:w r:w | r:w r:h E5:q D5 | C#5:h. B4:q A4:w', 8, 0.4).filter(n => n[0] >= 16), { vol: 0.35, reverb: 0.6, pan: -0.4, layer: 'arp' })] });
  },
  /* the square: a dance in three, D major. Fiddle, guitar, bass, and feet. */
  folkedans(L) {
    const ch = ['D', 'G', 'A', 'D', 'D', 'G', 'A', 'D'];
    const lead = eighths(T.folkedans.lead, 0.78).concat(shifted(eighths(T.folkedans.lead, 0.78), 12, 0));
    const second = above(eighths(T.folkedans.lead, 0.6), -3, 0.5).map(n => [n[0] + 12, n[1], n[2], n[3]]);
    return L.buildSong({ title: 'FOLKEDANS', bpm: 72, key: 'D', scale: 'major', bars: 8, beats: 3, swing: 0.15, tracks: [
      track('FIDDLE', 'violin', lead, { vol: 0.82, reverb: 0.25 }),
      track('2ND FIDDLE', 'violin', second, { vol: 0.5, reverb: 0.3, pan: 0.35 }),
      track('GUITAR', 'steelgtr', scale(L.chordLine(ch, 3, 'strum', 52), 0.7), { vol: 0.6, reverb: 0.2, pan: -0.3 }),
      track('SQUEEZEBOX', 'organ', scale(L.chordLine(ch, 3, 'pad', 55), 0.4), { vol: 0.3, reverb: 0.3 }),
      track('BASS', 'upright', L.bassLine(ch, 3, 'root5'), { vol: 0.7, reverb: 0.05 }),
      { name: 'FEET', drums: { kick: 'x...........', stick: '....x...x...', tamb: 'x.x.x.x.x.x.' }, vol: 0.4, reverb: 0.1 }] });
  }
};

/* the five songs, built once */
const make = memo((L, id) => BUILD[id](L));
export const song = (L, id) => make(L, id);
