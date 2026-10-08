/* The Cook's score, for the studio's real instruments (it used to be four oscillator loops, a pad, a bass and a square-wave lead,
   thirty-two beats of the same thing).
   Four tunes, all on D so any can follow any, sixteen bars each: DESERT (the RV: a harmonica over a nylon guitar and a bowed bass,
   a lot of air), COOK (the bench: a clean electric guitar and a bass in a lazy funk groove, vibes on top), HEAT (when the pours run
   out: a cello and a nylon guitar driving, a trumpet), and FALL (the end of it: a cello alone, a held piano, strings, a slow choir).
   Each one is a core that is a tune on its own, and two layers the game rides while it plays:
     h1 comes in when the bench is going wrong (more pours than par)       a marimba ostinato and a ticking clock
     h2 comes in when the sweep is close                                    a heartbeat on the timpani and a nervous bowed pulse
   and two stingers: WIN (a major-key resolution, vibes over strings) and RUIN (a drop, a low drum, a falling diminished chord).
   `node apps/cook/cook_check.js` holds the bars, the notes, the key, the layers and the instruments. */
import { bassPattern, comp, memo, scale } from '../scorekit.js';

export const IDS = ['desert', 'cook', 'heat', 'fall'];
export const LAYERS = ['h1', 'h2'];
export const NAMES = { desert: 'THE RV', cook: 'THE BENCH', heat: 'OVER PAR', fall: 'THE LAST ONE' };
export const BARS = 16;

const T = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
const D = (name, drums, o) => Object.assign({ name, drums }, o);
const ostinato = (L, ch, base, pick, per) => ch.flatMap((c, b) => { const n = L.chordNotes(c, base); return Array.from({ length: per }, (_, i) => [b * 4 + i * (4 / per), 0.4, pick(n, i), 0.5]); });
const lowRoot = (L, c) => L.chordNotes(c, 38)[0];

const TUNES = {
  desert: { bpm: 64, ch: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'Dm', 'A', 'Dm', 'Dm', 'Bb', 'C', 'Gm', 'A', 'Dm', 'Dm'],
    lead: 'r:h D5:h | F5:q. E5:e D5:h | r:h Bb4:h | C5:q E5 G5:h | D5:q F5 A5:h | G5:q F5 D5:h | F5:q. E5:e D5:h | E5:h C#5:q E5:q | ' +
          'D5:q. F5:e A5:h | G5:h F5:q E5:q | D5:h Bb4:h | C5:h E5:h | Bb4:q D5 G5:h | A4:q C#5 E5:h | D5:w | r:h A4:h' },
  cook: { bpm: 88, ch: ['Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'A', 'Dm', 'Dm', 'Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'C', 'A', 'A'],
    lead: 'D5:e F5 A5:q r:q F5:q | G5:e F5 D5:q r:h | Bb4:e D5 G5:q r:q D5:q | F5:e D5 Bb4:q r:h | D5:e F5 Bb5:q A5:q F5:q | E5:e G5 A5:q r:h | F5:q D5 A4:h | D5:w | ' +
          'A5:e D6 F6:q r:q D6:q | C6:e A5 F5:q r:h | G5:e Bb5 D6:q r:q Bb5:q | A5:e G5 D5:q r:h | F5:e Bb5 D6:q C6:q Bb5:q | G5:e C6 E6:q r:h | C#6:e E6 A5:q r:q E5:q | A5:h r:h' },
  heat: { bpm: 112, ch: ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'A', 'Dm', 'A', 'Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'A', 'Dm', 'Dm'],
    lead: 'D5:e D5 F5 D5 A5:q G5:q | F5:e F5 A5 F5 D5:h | Bb4:e Bb4 D5 Bb4 F5:q D5:q | D5:e D5 F5 D5 Bb4:h | G5:e G5 Bb5 G5 D6:q C6:q | E5:e E5 G5 E5 C#6:q A5:q | D6:q. C6:e A5:h | A5:q E5 A5 E5 | ' +
          'D5:e D5 F5 D5 A5:q G5:q | F5:e F5 A5 F5 D5:h | Bb4:e Bb4 D5 Bb4 F5:q D5:q | D5:e D5 F5 D5 Bb4:h | G5:e G5 Bb5 G5 D6:q C6:q | E5:e E5 G5 E5 C#6:q A5:q | D6:q A5 F5 D5 | D5:w' },
  fall: { bpm: 54, ch: ['Dm', 'Dm', 'Bb', 'Bb', 'F', 'C', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'A', 'Dm'],
    lead: 'D4:h. F4:q | A4:w | Bb4:h. A4:q | G4:w | F4:h A4:h | G4:h. E4:q | D4:h Bb3:h | E4:h. C#4:q | D4:h. F4:q | D4:h Bb3:h | Bb3:h D4:h | E4:w | D4:h. A3:q | Bb3:h D4:h | C#4:h E4:h | D4:w' }
};
/* a single tune per id: the same notes in the core and in the layers, so a layer can only ever be in the key */
const make = memo((L, id) => {
  const t = TUNES[id], ch = t.ch, len = ch.length * 4;
  const arp = (base, k) => scale(L.chordLine(ch, 4, 'arp', base), k).map(n => [n[0], Math.min(n[1], len - n[0]), n[2], n[3]]);
  let tracks;
  if (id === 'desert') tracks = [
    T('HARMONICA', 'harmonica', t.lead, { vol: 0.62, reverb: 0.5, pan: 0.12 }),
    T('GUITAR', 'nylon', arp(52, 0.55), { vol: 0.5, reverb: 0.35, pan: -0.2 }),
    T('BASS', 'upright', bassPattern(L, ch, 4, [[0, 1.8, 'r', 0.75], [2.5, 1, '5', 0.55]], 38), { vol: 0.7, reverb: 0.1 }),
    T('PAD', 'strings', scale(L.chordLine(ch, 4, 'pad', 50), 0.5), { vol: 0.3, reverb: 0.55, pan: 0.2 }),
    T('OSTINATO', 'marimba', ostinato(L, ch, 62, (n, i) => [n[0], n[2], n[0] + 12, n[2]][i % 4], 8), { vol: 0.34, reverb: 0.3, layer: 'h1' }),
    D('CLOCK', { stick: '..x...x...x...x.' }, { vol: 0.3, layer: 'h1' }),
    T('HEARTBEAT', 'timpani', ch.flatMap((c, b) => [[b * 4, 0.5, lowRoot(L, c), 0.9], [b * 4 + 0.75, 0.5, lowRoot(L, c), 0.65]]), { vol: 0.55, reverb: 0.4, layer: 'h2' }),
    T('NERVES', 'cello', ostinato(L, ch, 45, (n, i) => n[i % 2 ? 2 : 0], 8), { vol: 0.34, reverb: 0.2, layer: 'h2' })];
  else if (id === 'cook') tracks = [
    T('VIBES', 'vibes', t.lead, { vol: 0.56, reverb: 0.4, pan: 0.15 }),
    T('GUITAR', 'eguitar', bassPattern(L, ch, 4, [[0, 0.5, 'r', 0.7], [0.5, 0.5, 'r', 0.5], [1.5, 0.5, '5', 0.6], [2, 0.5, 'r', 0.7], [3, 0.5, 'r', 0.5], [3.5, 0.5, '5', 0.6]], 50), { vol: 0.42, reverb: 0.15, pan: -0.3 }),
    T('BASS', 'bass', bassPattern(L, ch, 4, [[0, 1.5, 'r', 0.85], [2, 1, 'r', 0.7], [3, 0.5, '5', 0.6], [3.5, 0.5, 'r', 0.7]], 38), { vol: 0.7, reverb: 0.05 }),
    D('KIT', { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' }, { vol: 0.5, reverb: 0.1 }),
    T('ORGAN', 'organ', scale(L.chordLine(ch, 4, 'pad', 52), 0.28), { vol: 0.3, reverb: 0.4 }),
    T('MARIMBA', 'marimba', arp(64, 0.4), { vol: 0.34, reverb: 0.3, pan: 0.3, layer: 'h1' }),
    D('TAMB', { tamb: 'x...x...x...x...' }, { vol: 0.3, layer: 'h1' }),
    T('STABS', 'trumpet', comp(L, ch, 4, [1.5, 3], 62, 0.4, 0.65), { vol: 0.34, reverb: 0.3, layer: 'h2' }),
    D('PULSE', { shaker: 'xoxoxoxoxoxoxoxo' }, { vol: 0.3, layer: 'h2' })];
  else if (id === 'heat') tracks = [
    T('TRUMPET', 'trumpet', t.lead, { vol: 0.55, reverb: 0.4, pan: 0.1 }),
    T('CELLO', 'cello', bassPattern(L, ch, 4, [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(x => [x, 0.4, 'r', x % 1 ? 0.55 : 0.7]), 38), { vol: 0.6, reverb: 0.15 }),
    T('GUITAR', 'nylon', scale(L.chordLine(ch, 4, 'strum', 55), 0.5), { vol: 0.42, reverb: 0.25, pan: -0.25 }),
    D('KIT', { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xoxoxoxoxoxoxoxo' }, { vol: 0.55, reverb: 0.1 }),
    T('PIZZ', 'pizz', comp(L, ch, 4, [0.5, 1.5, 2.5, 3.5], 57, 0.3, 0.5), { vol: 0.36, reverb: 0.2, pan: 0.3, layer: 'h1' }),
    D('RIDE', { ride: 'x.x.x.x.x.x.x.x.' }, { vol: 0.3, layer: 'h1' }),
    T('TIMPANI', 'timpani', ch.flatMap((c, b) => [[b * 4, 1, lowRoot(L, c), 0.85], [b * 4 + 2, 1, lowRoot(L, c), 0.7]]), { vol: 0.5, reverb: 0.4, layer: 'h2' }),
    T('TREMOLO', 'strings', ostinato(L, ch, 64, (n, i) => n[2], 16).map(n => [n[0], 0.22, n[2], 0.42]), { vol: 0.32, reverb: 0.3, layer: 'h2' })];
  else tracks = [
    T('CELLO', 'cello', t.lead, { vol: 0.85, reverb: 0.5 }),
    T('PIANO', 'piano', comp(L, ch, 4, [0], 52, 3.2, 0.35), { vol: 0.55, reverb: 0.5, pan: -0.1 }),
    T('STRINGS', 'strings', scale(L.chordLine(ch, 4, 'pad', 50), 0.5), { vol: 0.36, reverb: 0.55, pan: 0.2 }),
    T('BASS', 'upright', bassPattern(L, ch, 4, [[0, 3.8, 'r', 0.6]], 36), { vol: 0.6, reverb: 0.15 }),
    T('CHOIR', 'voiceoohs', scale(L.chordLine(ch, 4, 'pad', 57), 0.5), { vol: 0.3, reverb: 0.6, pan: 0.15, layer: 'h1' }),
    T('HARP', 'harp', arp(69, 0.35), { vol: 0.3, reverb: 0.5, pan: 0.3, layer: 'h2' }),
    T('DRUM', 'timpani', ch.flatMap((c, b) => (b % 2 ? [] : [[b * 4, 2, lowRoot(L, c), 0.8]])), { vol: 0.45, reverb: 0.5, layer: 'h2' })];
  return L.buildSong({ title: NAMES[id], bpm: t.bpm, key: 'D', scale: 'minor', bars: BARS, tracks });
});
export const song = (L, id) => make(L, id);
/* which layers to have on at each level of trouble: 0 nothing wrong, 1 over par, 2 the sweep is close */
export const layersFor = heat => ({ h1: heat >= 1, h2: heat >= 2 });
export const levelsFor = heat => ({ h1: heat >= 1 ? 1 : 0, h2: heat >= 2 ? 1 : 0 });
export const TUNE_OF = n => (n >= 9 ? 'fall' : n >= 6 ? 'heat' : n >= 3 ? 'cook' : 'desert');

/* two stingers, a few seconds each, laid over whatever is playing */
const sting = memo((L, id) => id === 'win'
  ? L.buildSong({ title: 'BATCH COMPLETE', bpm: 92, key: 'D', scale: 'major', bars: 2, tracks: [
      T('VIBES', 'vibes', 'D5:e F#5 A5 D6:q A5:e D6 F#6:h.', { vol: 0.7, reverb: 0.5 }),
      T('STRINGS', 'strings', 'D3+A3+D4+F#4:w D3+A3+D4+F#4:w', { vol: 0.45, reverb: 0.55 }),
      T('BASS', 'upright', 'D2:h. r:q D2:w', { vol: 0.6 })] })
  : L.buildSong({ title: 'BATCH RUINED', bpm: 76, key: 'D', scale: 'minor', bars: 2, tracks: [
      T('CELLO', 'cello', 'D3:h. Ab2:q D2:w', { vol: 0.7, reverb: 0.4 }),
      T('STRINGS', 'strings', 'D3+F3+Ab3+B3:w D3+F3+Ab3:w', { vol: 0.4, reverb: 0.5 }),
      T('DRUM', 'timpani', 'D2:h r:h | D2:w', { vol: 0.8, reverb: 0.4 })] }));
export const stinger = (L, id) => sting(L, id);
