/* Songs in and out as standard MIDI files, so the Garage can talk to anything else a
   musician owns. Format 1, 480 ticks to the quarter note: one track for the tempo
   and the metre, one per track of the song (the drum kit on channel 10, as General
   MIDI has it), each with the instrument as a program change. Reading takes format 0
   and 1 and turns whatever instruments it finds into the nearest of ours. */
import * as Lang from './songtext.js';

const PPQ = 480;
/* General MIDI program -> our instrument, and back */
const TO_GM = { piano: 0, epiano: 4, harpsichord: 6, organ: 19, musicbox: 10, marimba: 12, xylophone: 13, vibes: 11, glock: 9, steeldrum: 114,
  kalimba: 108, nylon: 24, steelgtr: 25, eguitar: 27, harp: 46, pizz: 45, bass: 33, upright: 32, violin: 40, cello: 42, strings: 48,
  flute: 73, clarinet: 71, trumpet: 56, sax: 65, ocarina: 79, choir: 52, bells: 14, timpani: 47, woodblock: 115 };
const GM_KIT = { kick: 36, stick: 37, snare: 38, clap: 39, hat: 42, lotom: 45, openhat: 46, midtom: 47, crash: 49, hitom: 50, ride: 51, tamb: 54, cowbell: 56, shaker: 70 };
const FROM_KIT = {};
Object.keys(GM_KIT).forEach(k => { FROM_KIT[GM_KIT[k]] = k; });
/* program ranges, by family */
const FROM_GM = [[0, 3, 'piano'], [4, 5, 'epiano'], [6, 6, 'harpsichord'], [7, 7, 'piano'], [8, 8, 'glock'], [9, 9, 'glock'], [10, 10, 'musicbox'], [11, 11, 'vibes'],
  [12, 12, 'marimba'], [13, 13, 'xylophone'], [14, 15, 'bells'], [16, 20, 'organ'], [21, 23, 'organ'], [24, 24, 'nylon'], [25, 25, 'steelgtr'], [26, 31, 'eguitar'],
  [32, 32, 'upright'], [33, 39, 'bass'], [40, 41, 'violin'], [42, 43, 'cello'], [44, 44, 'strings'], [45, 45, 'pizz'], [46, 46, 'harp'], [47, 47, 'timpani'],
  [48, 55, 'strings'], [52, 54, 'choir'], [56, 63, 'trumpet'], [64, 67, 'sax'], [68, 71, 'clarinet'], [72, 79, 'flute'], [80, 103, 'epiano'], [104, 104, 'kalimba'],
  [105, 111, 'steelgtr'], [112, 112, 'bells'], [113, 114, 'steeldrum'], [115, 115, 'woodblock'], [116, 119, 'timpani'], [120, 127, 'piano']];
const instFor = p => { let r = 'piano'; FROM_GM.forEach(f => { if (p >= f[0] && p <= f[1]) r = f[2]; }); return r; };

const vlq = n => { const b = [n & 127]; while ((n >>= 7) > 0) b.unshift((n & 127) | 128); return b; };
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = n => [(n >> 8) & 255, n & 255];
const text = s => Array.from(unescape(encodeURIComponent(s))).map(c => c.charCodeAt(0));
const chunk = (id, bytes) => [...text(id), ...u32(bytes.length), ...bytes];

/* a song as the bytes of a .mid file */
export function toMidi(song) {
  const head = [...u16(1), ...u16(song.tracks.length + 1), ...u16(PPQ)];
  const tempo = [];
  const uspq = Math.round(60e6 / song.bpm);
  tempo.push(0, 255, 0x03, ...[song.title || 'SONG'].map(t => [t.length, ...text(t)]).flat());
  tempo.push(0, 255, 0x51, 3, (uspq >> 16) & 255, (uspq >> 8) & 255, uspq & 255);
  tempo.push(0, 255, 0x58, 4, song.beats || 4, 2, 24, 8);
  tempo.push(0, 255, 0x2f, 0);
  const out = [...chunk('MThd', head), ...chunk('MTrk', tempo)];
  let ch = 0;
  song.tracks.forEach(t => {
    const drums = t.inst === 'drums';
    let c = 9;
    if (!drums) { if (ch === 9) ch = 10; c = ch % 16; ch++; }
    const ev = [];                                           /* [tick, order, bytes] : offs sort before ons at a tick */
    const vel = v => Math.max(1, Math.min(127, Math.round((v == null ? 0.7 : v) * 127)));
    if (drums) (t.hits || []).forEach(h => {
      const k = GM_KIT[h[1]]; if (k == null) return;
      const a = Math.round(h[0] * PPQ);
      ev.push([a, 1, [0x90 | c, k, vel(h[2])]], [a + 60, 0, [0x80 | c, k, 0]]);
    });
    else (t.notes || []).forEach(n => {
      const a = Math.round(n[0] * PPQ), b = Math.max(a + 1, Math.round((n[0] + n[1]) * PPQ));
      ev.push([a, 1, [0x90 | c, n[2], vel(n[3])]], [b, 0, [0x80 | c, n[2], 0]]);
    });
    ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const nm = (t.name || 'TRACK').slice(0, 20);
    const bytes = [0, 255, 0x03, nm.length, ...text(nm)];
    if (!drums) bytes.push(0, 0xC0 | c, TO_GM[t.inst] == null ? 0 : TO_GM[t.inst]);
    let last = 0;
    ev.forEach(e => { bytes.push(...vlq(e[0] - last), ...e[2]); last = e[0]; });
    bytes.push(0, 255, 0x2f, 0);
    out.push(...chunk('MTrk', bytes));
  });
  return new Uint8Array(out);
}

/* the bytes of a .mid file as a song, or an Error saying what was wrong with them */
export function fromMidi(bytes, name) {
  const d = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let p = 0;
  const rd32 = () => { const v = (d[p] << 24 | d[p + 1] << 16 | d[p + 2] << 8 | d[p + 3]) >>> 0; p += 4; return v; };
  const rd16 = () => { const v = d[p] << 8 | d[p + 1]; p += 2; return v; };
  const tag = () => String.fromCharCode(d[p], d[p + 1], d[p + 2], d[p + 3]);
  if (tag() !== 'MThd') throw new Error('THAT IS NOT A MIDI FILE.');
  p += 4; const hl = rd32(); rd16(); const ntr = rd16(); const div = rd16(); p += hl - 6;
  if (div & 0x8000) throw new Error('THAT MIDI FILE KEEPS TIME IN FRAMES, NOT BEATS.');
  let bpm = 0, beats = 4;
  const lanes = new Map();                                    /* channel -> { prog, notes, name } */
  for (let t = 0; t < ntr && p < d.length; t++) {
    if (tag() !== 'MTrk') break;
    p += 4; const len = rd32(), end = p + len;
    let tick = 0, run = 0, tname = '';
    const open = new Map();
    const rdv = () => { let v = 0, b; do { b = d[p++]; v = (v << 7) | (b & 127); } while (b & 128 && p < end); return v; };
    while (p < end) {
      tick += rdv();
      let s = d[p];
      if (s < 128) s = run; else { p++; if (s < 0xF0) run = s; }
      if (s === 255) {
        const ty = d[p++], l = rdv();
        if (ty === 0x51 && !bpm) bpm = Math.round(60e6 / (d[p] << 16 | d[p + 1] << 8 | d[p + 2]));
        if (ty === 0x58) beats = d[p] || 4;
        if (ty === 0x03) tname = String.fromCharCode(...d.slice(p, p + l));
        p += l;
      } else if (s === 0xF0 || s === 0xF7) { p += rdv(); }
      else {
        const k = s & 0xF0, c = s & 15;
        const one = k === 0xC0 || k === 0xD0;
        const a = d[p++], b = one ? 0 : d[p++];
        const key = t + '/' + c;
        if (!lanes.has(key)) lanes.set(key, { c, prog: 0, notes: [], name: tname });
        const L = lanes.get(key);
        if (k === 0xC0) L.prog = a;
        else if (k === 0x90 && b > 0) open.set(c + ':' + a, [tick, b]);
        else if (k === 0x80 || (k === 0x90 && b === 0)) {
          const o = open.get(c + ':' + a);
          if (o) { L.notes.push([o[0] / div, Math.max(1 / 48, (tick - o[0]) / div), a, o[1] / 127]); open.delete(c + ':' + a); }
        }
      }
    }
    p = end;
  }
  const song = Lang.newSong({ title: String(name || 'IMPORTED').replace(/\.[^.]*$/, '').toUpperCase().slice(0, 24), bpm: bpm || 120, beats, key: 'C', scale: 'chromatic' });
  const snap = x => Math.round(x * 48) / 48;
  let endBeat = 0;
  lanes.forEach(L => {
    if (!L.notes.length) return;
    const drums = L.c === 9;
    const tr = Lang.newTrack({ name: (L.name || (drums ? 'DRUMS' : 'TRACK')).toUpperCase().slice(0, 12), inst: drums ? 'drums' : instFor(L.prog) });
    if (drums) { tr.hits = []; L.notes.forEach(n => { const k = FROM_KIT[n[2]]; if (k) tr.hits.push([snap(n[0]), k, n[3]]); }); tr.notes = []; }
    else tr.notes = L.notes.map(n => [snap(n[0]), Math.max(1 / 12, snap(n[1])), n[2], n[3]]);
    tr.notes.concat(tr.hits || []).forEach(n => { endBeat = Math.max(endBeat, n[0] + (n.length === 4 ? n[1] : 0.25)); });
    song.tracks.push(tr);
  });
  if (!song.tracks.length) throw new Error('THERE IS NO MUSIC IN THAT FILE.');
  song.bars = Math.max(1, Math.ceil(endBeat / beats - 1e-6));
  return song;
}
