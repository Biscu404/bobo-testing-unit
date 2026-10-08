/* Solitaire's score, for the studio's real instruments: two card-room tunes, sixteen bars each, a core that is a tune on its own
   and two layers the game rides while it plays (`h1` once a quarter of the deck is home, `h2` once half is).
   LAMPLIGHT (G major, a music box over an electric piano) and FELT (C major, swung, a piano over an upright bass). `node apps/solitaire/music_check.js`. */
import { bassPattern, comp, memo, scale } from '../scorekit.js';

export const IDS = ['lamplight', 'felt'];
export const NAMES = { lamplight: 'LAMPLIGHT', felt: 'FELT' };
export const BARS = 16;
const T = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
const D = (name, drums, o) => Object.assign({ name, drums }, o);

const TUNES = {
  lamplight: { bpm: 76, key: 'G', swing: 0, inst: 'musicbox', ch: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D', 'C', 'G', 'Am', 'D', 'G', 'Em', 'C', 'G'],
    lead: 'B4:q D5:q G5:h | E5:q D5:q B4:h | C5:q E5:q G5:q E5:q | F#5:h. D5:q | B4:q D5:q G5:q B5:q | A5:q G5:q E5:h | C5:q E5:q A5:q E5:q | F#5:q D5:q A4:h | ' +
          'E5:q G5:q C6:h | D5:q B4:q G4:h | A4:q C5:q E5:q C5:q | D5:q F#5:q A5:h | G5:q F#5:q E5:q D5:q | B4:q E5:q G5:h | E5:q D5:q C5:h | G4:w' },
  felt: { bpm: 96, key: 'C', swing: 0.3, inst: 'piano', ch: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G', 'F', 'C', 'Dm', 'G', 'C', 'F', 'G', 'C'],
    lead: 'E5:e G5 C6:q G5:q E5:q | E5:e A5 C6:q A5:h | C5:e F5 A5:q F5:q C5:q | D5:e G5 B5:q G5:h | C6:q B5:e C6 G5:h | A5:q E5:q C5:h | D5:e F5 A5:q F5:q D5:q | B4:q D5:q G5:h | ' +
          'A5:q C6:q A5:h | G5:q E5:q C5:h | F5:e A5 D6:q A5:q F5:q | G5:q B5:q D6:h | E5:e G5 C6:q E6:h | C6:q A5:q F5:h | D5:q G5:q B5:h | C6:w' }
};
const make = memo((L, id) => {
  const t = TUNES[id], ch = t.ch;
  const arp = (base, k) => scale(L.chordLine(ch, 4, 'arp', base), k);
  const tracks = [
    T('LEAD', t.inst, t.lead, { vol: 0.62, reverb: 0.4, pan: 0.1 }),
    T('KEYS', 'epiano', comp(L, ch, 4, [0, 2], 55, 1.8, 0.4), { vol: 0.4, reverb: 0.3, pan: -0.2 }),
    T('BASS', 'upright', bassPattern(L, ch, 4, [[0, 1.8, 'r', 0.8], [2, 1.8, '5', 0.6]], 38), { vol: 0.62, reverb: 0.1 }),
    D('BRUSH', { stick: '..x...x...x...x.', kick: 'x.......x.......' }, { vol: 0.3, reverb: 0.1, layer: 'h1' }),
    T('PLUCK', 'pizz', comp(L, ch, 4, [1, 3], 60, 0.3, 0.5), { vol: 0.34, reverb: 0.2, pan: 0.3, layer: 'h1' }),
    T('SPARKLE', 'glock', arp(72, 0.4), { vol: 0.3, reverb: 0.5, pan: 0.25, layer: 'h2' }),
    T('STRINGS', 'strings', scale(L.chordLine(ch, 4, 'pad', 52), 0.4), { vol: 0.3, reverb: 0.55, pan: 0.2, layer: 'h2' })
  ];
  return L.buildSong({ title: NAMES[id], bpm: t.bpm, key: t.key, scale: 'major', swing: t.swing, bars: BARS, tracks });
});
export const song = (L, id) => make(L, id);
/* how much of the deck is home (0..52) -> the layers */
export const levelsFor = n => ({ h1: n >= 13 ? 1 : 0, h2: n >= 26 ? 1 : 0 });
