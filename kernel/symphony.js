/* THE SYMPHONY. A hundred bars at 160, two and a half minutes, for an orchestra and a metal band:
   what the machine plays when enough files have died at once for the style meter to read HAPPY
   BIRTHDAY. It begins on the notes of the delete sound itself (C major, a harp and a bell, the
   chord the fanfare ends on) so it grows out of that sound, and then turns dark and becomes its
   own thing: a drop in C minor, a theme for trumpet and violins and choir, a breakdown that
   builds to a stop, the same theme a step higher, a finale, and an arrival in C major on the
   harp and the bell it began with. Everything is a real instrument of the studio. How it is
   written is in symphony_a.js and symphony_b.js; when and how it plays is symphony_play.js. */
import { intro, drop, theme } from './symphony_a.js';
import { breakdown, climax, finale, outro } from './symphony_b.js';

export const BARS = 100, BPM = 160, LOOP_FROM_BAR = 9;

/* the first time the meter reads HAPPY BIRTHDAY the full song is added to the Stack; this is the memory of that */
const KEY = 'templeos.symphony.v1';
export const unlocked = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
export const unlock = () => { try { localStorage.setItem(KEY, '1'); } catch (e) {} };
export const SECONDS = BARS * 4 * 60 / BPM;

/* a note outside what an instrument can sing moves an octave until it is inside */
const fold = (notes, lo, hi) => notes.map(n => { let p = n[2]; while (p > hi) p -= 12; while (p < lo) p += 12; return p === n[2] ? n : [n[0], n[1], p, n[3]]; });

let cache = null;
export function symphony(L) {
  if (cache) return cache;
  const T = {};
  ['drums', 'timp', 'bass', 'cello', 'guitar', 'lead', 'strings', 'violins', 'trumpet', 'choir', 'organ', 'piano', 'pizz', 'harp', 'glock', 'bells'].forEach(k => { T[k] = []; });
  intro(L, T); drop(L, T); theme(L, T); breakdown(L, T); climax(L, T); finale(L, T); outro(L, T);
  const RANGE = { violin: [60, 91], strings: [36, 96], trumpet: [52, 91], choir: [41, 88], glock: [60, 100], harp: [36, 100], organ: [28, 80], piano: [28, 96], bells: [40, 84], eguitar: [40, 88], cello: [31, 76], bass: [28, 52], timpani: [36, 55], pizz: [40, 76] };
  const n = (name, inst, notes, o) => Object.assign(L.newTrack({ name, inst, notes: fold(notes, RANGE[inst][0], RANGE[inst][1]).sort((a, b) => a[0] - b[0]) }), o);
  const song = L.newSong({ title: 'UNWRAPPED', bpm: BPM, key: 'C', scale: 'minor', bars: BARS, beats: 4, tracks: [] });
  song.tracks = [
    Object.assign(L.newTrack({ name: 'DRUMS', inst: 'drums', notes: [], hits: T.drums.sort((a, b) => a[0] - b[0]) }), { vol: 0.82, reverb: 0.1, comp: 0.35 }),
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
    n('PIANO', 'piano', T.piano, { vol: 0.5, reverb: 0.45 }),
    n('PIZZICATO', 'pizz', T.pizz, { vol: 0.5, reverb: 0.3, pan: -0.25 }),
    n('HARP', 'harp', T.harp, { vol: 0.55, reverb: 0.5, pan: 0.25 }),
    n('GLOCK', 'glock', T.glock, { vol: 0.34, reverb: 0.55, pan: -0.2 }),
    n('BELLS', 'bells', T.bells, { vol: 0.46, reverb: 0.6 })
  ];
  cache = song;
  return song;
}
