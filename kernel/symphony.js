/* THE SYMPHONY. A hundred bars at 160, two and a half minutes, for an orchestra and a broken beat: what the machine plays when enough
   files have died at once for the style meter to read HAPPY BIRTHDAY. It begins on the notes of the delete sound itself (C major, a
   harp and a bell, the chord the fanfare ends on) so it grows out of that sound, and then turns dark and becomes its own thing: an
   ignition in C minor, a long sad tune over a fast beat, a breath, a lift into the one major key it allows itself, a climb back down
   and a silence, the tune again at full cry and then a step up, a last stand, and an arrival in C major on the harp and the bell it
   began with. Everything is a real instrument of the studio. What it is made of (the chords, the tune, the drums) is
   symphony_theme.js; how it is played is symphony_a.js, symphony_b.js and symphony_c.js; when it plays is symphony_play.js. */
import { intro, drop, theme } from './symphony_a.js';
import { breath, lift, climb } from './symphony_b.js';
import { climax, finale, outro } from './symphony_c.js';

export const BARS = 100, BPM = 160, LOOP_FROM_BAR = 9;

/* the first time the meter reads HAPPY BIRTHDAY the full song is added to the Stack; this is the memory of that */
const KEY = 'templeos.symphony.v1';
export const unlocked = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
export const unlock = () => { try { localStorage.setItem(KEY, '1'); } catch (e) {} };
export const SECONDS = BARS * 4 * 60 / BPM;

/* How hard the band plays, bar by bar: a multiplier on every velocity. A hundred bars played at one volume is a wall, and the master's
   limiter flattens a loud mix to the same level whatever it is (the band's raw peaks are over twice full scale): so the places that are
   meant to be smaller are made smaller *before* it, and the climax and the finale are the only places it is allowed to be at full cry.
   [bar, multiplier] marks, linear between them. */
const ARC = [[1, 1], [8, 1], [9, 0.43], [16, 0.43], [17, 0.36], [24, 0.36], [25, 0.46], [32, 0.46], [33, 1], [36, 1], [37, 0.42], [40, 0.8], [41, 0.5], [48, 0.5], [49, 0.36], [52, 0.36], [53, 0.3], [56, 1], [57, 1], [100, 1]];
const arc = beat => {
  const bar = beat / 4 + 1;
  for (let i = 1; i < ARC.length; i++) if (bar <= ARC[i][0]) { const a = ARC[i - 1], b = ARC[i]; return b[0] === a[0] ? b[1] : a[1] + (b[1] - a[1]) * (bar - a[0]) / (b[0] - a[0]); }
  return 1;
};
const scaled = (notes, key) => notes.map(n => { const k = arc(n[0]); return k === 1 ? n : (key ? [n[0], n[1], Math.min(1, n[2] * k)] : [n[0], n[1], n[2], Math.min(1, Math.max(0.05, n[3] * k))]); });

/* The two places the music stops dead for a beat: the last beat before the climax (bar 57) and before the arrival in C major (bar 93).
   A pad held across it would fill the silence that is the whole point of it, so anything that is sounding there is cut short and
   nothing begins in it. */
const STOPS = [57, 93];
const gap = list => {
  STOPS.forEach(bar => {
    const edge = (bar - 1) * 4 - 1;
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n[0] >= edge && n[0] < edge + 1) list.splice(i, 1);
      else if (n[0] < edge && typeof n[1] === 'number' && n[0] + n[1] > edge) n[1] = edge - n[0];
    }
  });
};

/* a note outside what an instrument can sing moves an octave until it is inside */
const fold = (notes, lo, hi) => notes.map(n => { let p = n[2]; while (p > hi) p -= 12; while (p < lo) p += 12; return p === n[2] ? n : [n[0], n[1], p, n[3]]; });

let cache = null;
export function symphony(L) {
  if (cache) return cache;
  const T = {};
  ['drums', 'timp', 'bass', 'cello', 'guitar', 'lead', 'strings', 'violins', 'trumpet', 'choir', 'organ', 'piano', 'pizz', 'harp', 'glock', 'bells'].forEach(k => { T[k] = []; });
  intro(L, T); drop(L, T); theme(L, T); breath(L, T); lift(L, T); climb(L, T); climax(L, T); finale(L, T); outro(L, T);
  Object.keys(T).forEach(k => { if (k !== 'drums') gap(T[k]); });
  T.drums = T.drums.filter(h => !STOPS.some(b => h[0] >= (b - 1) * 4 - 1 && h[0] < (b - 1) * 4));
  const RANGE = { violin: [55, 100], strings: [36, 96], trumpet: [55, 86], choir: [41, 88], glock: [72, 108], harp: [36, 96], organ: [28, 80], piano: [28, 96], bells: [55, 90], eguitar: [40, 88], cello: [36, 76], bass: [28, 52], timpani: [36, 55], pizz: [40, 76] };
  const n = (name, inst, notes, o) => Object.assign(L.newTrack({ name, inst, notes: scaled(fold(notes, RANGE[inst][0], RANGE[inst][1]), false).sort((a, b) => a[0] - b[0]) }), o);
  const song = L.newSong({ title: 'UNWRAPPED', bpm: BPM, key: 'C', scale: 'minor', bars: BARS, beats: 4, tracks: [] });
  song.tracks = [
    Object.assign(L.newTrack({ name: 'DRUMS', inst: 'drums', notes: [], hits: scaled(T.drums, true).sort((a, b) => a[0] - b[0]) }), { vol: 0.82, reverb: 0.1, comp: 0.35 }),
    n('TIMPANI', 'timpani', T.timp, { vol: 0.62, reverb: 0.3, pan: -0.15 }),
    n('BASS', 'bass', T.bass, { vol: 0.82, reverb: 0.02, drive: 0.3, comp: 0.3 }),
    n('CELLO', 'cello', T.cello, { vol: 0.56, reverb: 0.15, pan: 0.15 }),
    n('GUITAR', 'eguitar', T.guitar, { vol: 0.6, reverb: 0.12, drive: 0.78, comp: 0.5, eq: [2, -2, 3], pan: -0.3 }),
    n('LEAD GTR', 'eguitar', T.lead, { vol: 0.6, reverb: 0.25, echo: 0.2, drive: 0.6, comp: 0.4, pan: 0.3 }),
    n('STRINGS', 'strings', T.strings, { vol: 0.55, reverb: 0.4 }),
    n('VIOLINS', 'violin', T.violins, { vol: 0.5, reverb: 0.4, pan: 0.2 }),
    n('TRUMPETS', 'trumpet', T.trumpet, { vol: 0.6, reverb: 0.35, pan: -0.15 }),
    n('CHOIR', 'choir', T.choir, { vol: 0.52, reverb: 0.6 }),
    n('ORGAN', 'organ', T.organ, { vol: 0.42, reverb: 0.5 }),
    n('PIANO', 'piano', T.piano, { vol: 0.5, reverb: 0.45, echo: 0.28 }),
    n('PIZZICATO', 'pizz', T.pizz, { vol: 0.5, reverb: 0.3, pan: -0.25 }),
    n('HARP', 'harp', T.harp, { vol: 0.55, reverb: 0.5, echo: 0.18, pan: 0.25 }),
    n('GLOCK', 'glock', T.glock, { vol: 0.34, reverb: 0.55, echo: 0.25, pan: -0.2 }),
    n('BELLS', 'bells', T.bells, { vol: 0.46, reverb: 0.6 })
  ];
  cache = song;
  return song;
}
