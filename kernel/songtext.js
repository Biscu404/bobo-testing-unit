/* The language music is written in on this machine.

   A song is plain data (see Studio): tracks, each with an instrument and a list
   of notes in beats. This file is how to write that data without writing
   every note by hand, and the small amount of theory that lets a program make
   music that fits: scales, chords, a few chord progressions and a band in a box.

   NOTES, as text. Whitespace-separated tokens, bar lines (|) are ignored:

       C4:q  E4:q  G4:h  |  C4+E4+G4:w  |  r:q  F#3:e!60

     pitch   a letter, # or b, an octave: C4 is middle C. Join pitches with +
             for a chord. r (or -) is a rest.
     :dur    how long, in beats: w=4 h=2 q=1 e=1/2 s=1/4 t=1/3, a . after makes
             it half again as long (q. = 1.5), or a plain number (:0.75). A
             duration sticks until the next one is given, so  C4:q D4 E4 F4  is
             four quarters.
     !vel    how hard, 1-127 (default 90).

   DRUMS, as patterns, one string per piece, one character per sixteenth:

       { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }

     x a hit, X an accent, o a soft one, . nothing. Patterns repeat to fill
     the bars. Pieces: kick snare stick clap hat openhat lotom midtom hitom
     crash ride cowbell tamb shaker.

   buildSong({ title, bpm, key, scale, bars, tracks: [{ name, inst, notes | drums, vol, pan, reverb }] })
   turns that into a song the Studio plays and the Garage opens. */

const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteToMidi = s => {
  const m = /^([A-Ga-g][#b]?)(-?\d)$/.exec(String(s).trim());
  if (!m) throw new Error('NOT A NOTE: ' + s);
  const pc = PC[m[1][0].toUpperCase() + m[1].slice(1)];
  if (pc == null) throw new Error('NOT A NOTE: ' + s);
  return pc + (parseInt(m[2], 10) + 1) * 12;
};
export const midiToName = n => NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
export const pcName = n => NAMES[((n % 12) + 12) % 12];

export const SCALES = {
  major: { name: 'MAJOR', steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'MINOR', steps: [0, 2, 3, 5, 7, 8, 10] },
  pentatonic: { name: 'MAGIC 5 (HAPPY)', steps: [0, 2, 4, 7, 9] },
  pentaminor: { name: 'MAGIC 5 (MOODY)', steps: [0, 3, 5, 7, 10] },
  blues: { name: 'BLUES', steps: [0, 3, 5, 6, 7, 10] },
  dorian: { name: 'DORIAN', steps: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian: { name: 'MIXOLYDIAN', steps: [0, 2, 4, 5, 7, 9, 10] },
  chromatic: { name: 'EVERY NOTE', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
};
/* every note of a scale between two MIDI numbers, lowest first */
export function scaleNotes(key, scale, lo, hi) {
  const root = PC[key] == null ? 0 : PC[key], steps = (SCALES[scale] || SCALES.major).steps, out = [];
  for (let n = lo; n <= hi; n++) if (steps.indexOf((((n - root) % 12) + 12) % 12) >= 0) out.push(n);
  return out;
}
export const inScale = (n, key, scale) => (SCALES[scale] || SCALES.major).steps.indexOf((((n - (PC[key] || 0)) % 12) + 12) % 12) >= 0;

/* ---- durations and notes ------------------------------------------------------ */
const DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3 };
function durOf(d) {
  if (/^[whqest]\.?$/.test(d)) return DUR[d[0]] * (d.length > 1 ? 1.5 : 1);
  const n = parseFloat(d);
  if (!(n > 0)) throw new Error('NOT A LENGTH: ' + d);
  return n;
}
/* text -> [[start, dur, midi, vel 0..1], ...], also returns the length in beats */
export function parseNotes(text, o) {
  const out = [];
  let at = (o && o.from) || 0, dur = 1;
  String(text).split(/\s+/).forEach(tok => {
    if (!tok || tok === '|') return;
    const vm = /!(\d+)$/.exec(tok), vel = vm ? Math.max(1, Math.min(127, +vm[1])) / 127 : 90 / 127;
    if (vm) tok = tok.slice(0, vm.index);
    const [pitch, d] = tok.split(':');
    if (d) dur = durOf(d);
    if (pitch !== 'r' && pitch !== '-' && pitch) pitch.split('+').forEach(p => out.push([at, dur, noteToMidi(p), vel]));
    at += dur;
  });
  out.length_ = at;
  return out;
}
export const textLength = notes => notes.length_ || notes.reduce((a, n) => Math.max(a, n[0] + n[1]), 0);

/* drum patterns -> [[start, key, vel], ...] filling `beats` beats (sixteenths) */
export function parseDrums(pat, beats) {
  const out = [], v = { x: 0.85, X: 1, o: 0.45 };
  Object.keys(pat).forEach(key => {
    const p = pat[key].replace(/[\s|]/g, '');
    if (!p.length) return;
    for (let i = 0; i < beats * 4; i++) { const c = p[i % p.length]; if (v[c]) out.push([i / 4, key, v[c]]); }
  });
  return out.sort((a, b) => a[0] - b[0]);
}

/* ---- songs --------------------------------------------------------------------- */
let seq = 0;
export function newTrack(o) {
  return Object.assign({ id: 't' + Date.now().toString(36) + (seq++), name: 'TRACK', inst: 'piano', vol: 0.8, pan: 0, reverb: 0.15, mute: false, solo: false, notes: [] }, o || {});
}
export function newSong(o) {
  return Object.assign({ v: 1, title: 'MY SONG', bpm: 100, key: 'C', scale: 'pentatonic', bars: 4, beats: 4, swing: 0, tracks: [] }, o || {});
}
export function buildSong(spec) {
  const song = newSong({ title: spec.title, bpm: spec.bpm, key: spec.key, scale: spec.scale, bars: spec.bars, beats: spec.beats, swing: spec.swing });
  Object.keys(song).forEach(k => { if (song[k] === undefined) delete song[k]; });
  const full = newSong(song);
  const len = full.bars * full.beats;
  (spec.tracks || []).forEach(t => {
    const tr = newTrack({ name: t.name, inst: t.drums ? 'drums' : t.inst, vol: t.vol, pan: t.pan, reverb: t.reverb });
    Object.keys(tr).forEach(k => { if (tr[k] === undefined) delete tr[k]; });
    const tt = newTrack(tr);
    if (t.drums) { tt.inst = 'drums'; tt.hits = parseDrums(t.drums, len); tt.notes = []; }
    else tt.notes = typeof t.notes === 'string' ? parseNotes(t.notes) : (t.notes || []);
    full.tracks.push(tt);
  });
  return full;
}
export const songLength = s => s.bars * s.beats;
export const serialize = s => JSON.stringify(s);
export function deserialize(text) {
  const s = JSON.parse(text);
  if (!s || !Array.isArray(s.tracks)) throw new Error('NOT A SONG');
  return Object.assign(newSong(), s, { tracks: s.tracks.map(t => newTrack(t)) });
}

/* ---- chords and a band in a box -------------------------------------------------- */
export const CHORDS = { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 6: [0, 4, 7, 9] };
export function chordNotes(sym, base) {
  const m = /^([A-G][#b]?)(maj7|m7|dim|aug|sus2|sus4|add9|m|7|6|)$/.exec(sym);
  if (!m) throw new Error('NOT A CHORD: ' + sym);
  const root = PC[m[1]], iv = CHORDS[m[2]] || CHORDS[''];
  /* put the root as near `base` as it goes, then stack */
  let r = base - (((base - root) % 12) + 12) % 12;
  if (base - r > 6) r += 12;
  return iv.map(i => r + i);
}
const TRIAD = { major: ['', 'm', 'm', '', '', 'm', 'dim'], minor: ['m', 'dim', '', 'm', 'm', '', ''] };
export const PROGRESSIONS = {
  pop: { name: 'POP', degrees: [0, 4, 5, 3] },
  sunny: { name: 'SUNNY', degrees: [0, 3, 0, 4] },
  rock: { name: 'ROCK', degrees: [0, 3, 4, 3] },
  sad: { name: 'SAD', degrees: [5, 3, 0, 4] },
  epic: { name: 'EPIC', degrees: [5, 4, 3, 4] }
};
/* the chord symbols for each bar of a song in this key */
export function progression(key, scale, which, bars) {
  const minor = scale === 'minor' || scale === 'pentaminor' || scale === 'dorian' || scale === 'blues';
  const steps = SCALES[minor ? 'minor' : 'major'].steps, root = PC[key] || 0, tri = TRIAD[minor ? 'minor' : 'major'];
  const degs = (PROGRESSIONS[which] || PROGRESSIONS.pop).degrees.map(d => minor ? [0, 5, 6, 3][d % 4 === d ? d : 0] : d);
  const out = [];
  for (let b = 0; b < bars; b++) {
    const d = minor ? [0, 5, 2, 6][(b % 4)] : degs[b % degs.length];
    out.push(pcName(root + steps[d]).replace('#', '#') + tri[d]);
  }
  return out;
}

export const STYLES = {
  pop: { name: 'POP', kit: { kick: 'x...x.x.x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }, bass: 'root5', chords: { inst: 'strings', mode: 'pad' }, vol: 1 },
  lullaby: { name: 'LULLABY', kit: null, bass: 'root', chords: { inst: 'musicbox', mode: 'arp' }, pad: 'strings', vol: 0.8 },
  rock: { name: 'ROCK', kit: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', crash: 'x...............' }, bass: 'eighths', chords: { inst: 'eguitar', mode: 'stab' }, vol: 1 },
  dance: { name: 'DANCE', kit: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.' }, bass: 'offbeat', chords: { inst: 'epiano', mode: 'stab' }, vol: 1 },
  march: { name: 'MARCH', kit: { kick: 'x.......x.......', snare: 'x.x.x.x.x.x.x.x.', hat: 'x...x...x...x...' }, bass: 'root5', chords: { inst: 'organ', mode: 'pad' }, vol: 1 }
};
/* a bass line for a list of chord symbols, one per bar */
export function bassLine(chords, bpb, mode) {
  const out = [];
  chords.forEach((c, b) => {
    const root = chordNotes(c, 40)[0], fifth = root + 7, t = b * bpb;
    if (mode === 'root') out.push([t, bpb, root, 0.8]);
    else if (mode === 'root5') for (let i = 0; i < bpb; i++) out.push([t + i, 0.9, i % 2 ? fifth : root, 0.8]);
    else if (mode === 'eighths') for (let i = 0; i < bpb * 2; i++) out.push([t + i / 2, 0.45, root, i % 2 ? 0.6 : 0.85]);
    else for (let i = 0; i < bpb; i++) out.push([t + i + 0.5, 0.45, i % 2 ? fifth : root, 0.85]);
  });
  return out;
}
/* chords for a list of chord symbols: 'pad' holds them, 'arp' rolls them, 'stab' hits them,
   'strum' rolls them down once a beat */
export function chordLine(chords, bpb, mode, base) {
  const out = [];
  chords.forEach((c, b) => {
    const ns = chordNotes(c, base || 60), t = b * bpb;
    if (mode === 'pad') ns.forEach(n => out.push([t, bpb, n, 0.55]));
    else if (mode === 'arp') for (let i = 0; i < bpb * 2; i++) out.push([t + i / 2, 0.6, ns[i % ns.length] + (i % 4 > 1 ? 12 : 0), 0.6]);
    else if (mode === 'strum') for (let i = 0; i < bpb; i++) ns.forEach((n, k) => out.push([t + i + k * 0.03, 0.9, n, 0.6]));
    else for (let i = 0; i < bpb; i += 2) ns.forEach(n => out.push([t + i, 0.9, n, 0.7]));
  });
  return out;
}
/* drums + bass + chords for a song's key. Returns tracks, ready to add. */
export function accompany(song, style, prog) {
  const st = STYLES[style] || STYLES.pop, bars = song.bars, bpb = song.beats, len = bars * bpb;
  const chords = progression(song.key, song.scale, prog || 'pop', bars);
  const tracks = [];
  if (st.kit) tracks.push(newTrack({ name: 'DRUMS', inst: 'drums', hits: parseDrums(st.kit, len), notes: [], vol: 0.8, reverb: 0.08 }));
  tracks.push(newTrack({ name: 'BASS', inst: st.bass === 'root' ? 'upright' : 'bass', notes: bassLine(chords, bpb, st.bass), vol: 0.85, reverb: 0.02 }));
  tracks.push(newTrack({ name: 'CHORDS', inst: st.chords.inst, notes: chordLine(chords, bpb, st.chords.mode), vol: 0.55, reverb: 0.3 }));
  if (st.pad) tracks.push(newTrack({ name: 'PAD', inst: st.pad, notes: chordLine(chords, bpb, 'pad', 55).map(n => [n[0], n[1], n[2], 0.4]), vol: 0.4, reverb: 0.4 }));
  return tracks;
}
