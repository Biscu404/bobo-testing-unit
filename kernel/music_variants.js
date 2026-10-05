/* One song, four moods.

   Every variant is built out of the same notes as the hymn in music_data.js —
   the same lead line, the same bass roots, the same four chords — and only
   what is done to them changes: how long they are held, which octave they
   are doubled in, what is underneath, and how much of it is left to chance.

     HYMN     the original, as it has always played.
     MELLOW   slow and mellow: sines, held long enough to overlap, a music
              box picking the chord tones, an echo behind all of it.
     DYNAMIC  fast and dynamic: the same line cut short and sawn, an eighth-
              note bass, an arpeggio at double time, four on the floor, and
              a build that grows over the first loops.
     GLITCH   random and glitchy: the same line again, but every note might
              stutter, slide, jump an octave or drop out, and the drums are
              wherever the dice put them. A new roll every pass.

   variantSpec() hands back a plain description in sixteenth-note steps, in
   the same shape the TheStack discs use, so the lobby (live, on the machine's
   own speaker) and the disc (pressed offline for the hi-fi) are one source.
   A note is [name | hertz, at, length, extras?]; extras are { g: glide ratio,
   v: volume, d: detune in cents, t: oscillator type, o: octave multiplier }. */
import { HZ, HYMN } from './music_data.js';

export const VARIANTS = [
  { id: 'hymn',    name: 'HYMN',    mood: 'THE ORIGINAL' },
  { id: 'mellow',  name: 'MELLOW',  mood: 'SLOW & MELLOW' },
  { id: 'dynamic', name: 'DYNAMIC', mood: 'FAST & DYNAMIC' },
  { id: 'glitch',  name: 'GLITCH',  mood: 'RANDOM & GLITCHY' }
];
export const variantName = id => (VARIANTS.find(v => v.id === id) || VARIANTS[0]).name;

export const hz = n => (typeof n === 'number' ? n : HZ[n]);
const LEN = 64;                                       /* 32 eighths = 64 sixteenths */

/* the hymn, in sixteenths */
const dbl = list => list.map(n => [n[0], n[1] * 2, n[2] * 2]);
const BASE = { lead: dbl(HYMN.lead), bass: dbl(HYMN.bass), pad: dbl(HYMN.pad) };

/* the four chords, as name lists by bar of sixteen sixteenths */
function chords() {
  const out = [];
  for (let s = 0; s < LEN; s += 16) {
    out.push({ at: s, tones: BASE.pad.filter(n => n[1] === s).map(n => n[0]) });
  }
  return out;
}
/* the chord a given step sits in */
const chordAt = (cs, step) => cs[Math.min(cs.length - 1, Math.floor(step / 16))];

function rng(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- hymn -- */
function hymn() {
  return {
    bpm: HYMN.bpm, len: LEN,
    lead: BASE.lead, bass: BASE.bass, pad: BASE.pad, arp: null,
    kick: [], hat: [], snare: [],
    timbre: { lead: 'square', bass: 'square', pad: 'triangle', arp: 'triangle' },
    rel: { lead: 1, bass: 1, pad: 1, arp: 1, drum: 1 },
    double: true,
    fx: { lp: 20000, delay: 0, fb: 0 }
  };
}

/* -------------------------------------------------------------- mellow -- */
function mellow() {
  /* bass: the repeated roots are one long note now */
  const bass = [];
  BASE.bass.forEach(n => {
    const last = bass[bass.length - 1];
    if (last && last[0] === n[0] && last[1] + last[2] === n[1]) last[2] += n[2];
    else bass.push([n[0], n[1], n[2]]);
  });
  /* lead: held into the next note, so each one is still ringing when the
     next arrives; the long ones get a soft octave shimmer above */
  const lead = [], shim = [];
  BASE.lead.forEach(n => {
    lead.push([n[0], n[1], n[2] * 1.6, { v: 1.1 }]);
    if (n[2] >= 4) shim.push([n[0], n[1] + 1, n[2] * 1.2, { o: 2, v: 0.18 }]);
  });
  /* the music box: three tones of whichever chord, slowly */
  const arp = shim;
  chords().forEach(c => {
    const t = c.tones;
    [2, 6, 10, 13].forEach((off, i) => arp.push([t[i % t.length], c.at + off, 5, { o: 2, v: 0.55 }]));
  });
  return {
    bpm: 56, len: LEN,
    lead, bass, pad: BASE.pad.map(n => [n[0], n[1], n[2] * 1.05]), arp,
    kick: [], hat: [], snare: [],
    timbre: { lead: 'sine', bass: 'sine', pad: 'sine', arp: 'sine' },
    rel: { lead: 1.25, bass: 1.5, pad: 1.8, arp: 0.9, drum: 0.5 },
    double: false,
    fx: { lp: 2100, delay: 0.42, fb: 0.5 }
  };
}

/* ------------------------------------------------------------- dynamic -- */
function dynamic(loop) {
  const lvl = Math.min(2, loop);                      /* it builds, then it stays built */
  const cs = chords();
  /* lead: the same notes, clipped, the long ones doubled an octave up */
  const lead = [];
  BASE.lead.forEach(n => {
    lead.push([n[0], n[1], Math.max(1.2, n[2] * 0.72)]);
    if (n[2] >= 3 && lvl > 0) lead.push([n[0], n[1], Math.max(1.2, n[2] * 0.6), { o: 2, v: 0.4, t: 'square' }]);
  });
  /* bass: every eighth, the root, with the octave on the offbeats of the bar */
  const bass = [];
  BASE.bass.forEach(n => {
    for (let k = 0, s = n[1]; s < n[1] + n[2]; s += 2, k++) {
      bass.push([n[0], s, 1.7, k % 4 === 3 ? { o: 2, v: 0.8 } : null]);
    }
  });
  bass.forEach(b => { if (!b[3]) b.length = 3; });
  /* pad: stabs, on the offbeat eighths */
  const pad = [];
  cs.forEach(c => { for (let off = 2; off < 16; off += 4) c.tones.forEach(t => pad.push([t, c.at + off, 1.6])); });
  /* the arp: sixteenths through the chord and back, from the second loop */
  const arp = [];
  if (lvl > 0) {
    cs.forEach(c => {
      const t = c.tones.concat([c.tones[0]]);
      const seq = [0, 1, 2, 3, 2, 1];
      for (let s = 0; s < 16; s++) arp.push([t[seq[s % seq.length]], c.at + s, 1, { o: 2 }]);
    });
  }
  const kick = [], snare = [], hat = [];
  for (let bar = 0; bar < LEN; bar += 16) {
    if (lvl > 0 || bar >= 32) [0, 4, 8, 12].forEach(s => kick.push(bar + s));
    else kick.push(bar, bar + 8);
    [4, 12].forEach(s => snare.push(bar + s));
    for (let s = 0; s < 16; s += 2) hat.push(bar + s);
  }
  if (lvl > 1) [56, 58, 60, 61, 62, 63].forEach(s => snare.push(s));       /* the fill into the top */
  return {
    bpm: 150, len: LEN, lead, bass, pad, arp,
    kick, hat, snare,
    timbre: { lead: 'sawtooth', bass: 'sawtooth', pad: 'square', arp: 'triangle' },
    rel: { lead: 0.62, bass: 0.78, pad: 0.55, arp: 0.7, drum: 1 },
    double: false,
    fx: { lp: 9000, delay: 0.12, fb: 0.18 }
  };
}

/* -------------------------------------------------------------- glitch -- */
function glitch(loop) {
  const R = rng(loop * 7919 + 13);
  const cs = chords();
  const jit = () => Math.round((R() - 0.5) * 60);
  /* lead: every note rolls the dice */
  const lead = [];
  BASE.lead.forEach(n => {
    const r = R();
    if (r < 0.4) lead.push([n[0], n[1], n[2], { d: jit() }]);
    else if (r < 0.62) {                               /* stutter: the note, chopped into 2-5 */
      const k = 2 + Math.floor(R() * 4), sl = n[2] / k;
      for (let i = 0; i < k; i++) lead.push([n[0], n[1] + i * sl, Math.max(0.5, sl * 0.55), { v: 1 - i * 0.08 }]);
    } else if (r < 0.74) lead.push([n[0], n[1], n[2], { o: R() < 0.5 ? 2 : 0.5, t: 'sawtooth' }]);
    else if (r < 0.86) lead.push([n[0], n[1], n[2], { g: R() < 0.5 ? 0.5 : 2 }]);      /* it slides off */
    else if (r < 0.93) { /* it is gone */ }
    else { for (let i = 0; i < 3; i++) lead.push([n[0], n[1] + i * 0.5, 0.45, { o: [1, 2, 4][i], t: 'square', v: 0.8 }]); }
  });
  /* bass: sometimes cut, sometimes it falls through the floor */
  const bass = [];
  BASE.bass.forEach(n => {
    const r = R();
    if (r < 0.7) bass.push([n[0], n[1], n[2]]);
    else if (r < 0.85) bass.push([n[0], n[1], n[2] * 0.4]);
    else bass.push([n[0], n[1], n[2], { g: 0.5 }]);
  });
  /* pad: gated into chops, some of them missing */
  const pad = [];
  BASE.pad.forEach(n => {
    const slice = [2, 4, 8][Math.floor(R() * 3)];
    for (let s = n[1]; s < n[1] + n[2]; s += slice) if (R() < 0.7) pad.push([n[0], s, slice * 0.6, { v: 0.9 }]);
  });
  /* arp: pings wherever */
  const arp = [];
  for (let i = 0; i < 16; i++) {
    const s = Math.floor(R() * LEN * 2) / 2;
    const c = chordAt(cs, s);
    arp.push([c.tones[Math.floor(R() * c.tones.length)], s, 0.5, { o: R() < 0.5 ? 2 : 4, t: 'square', v: 0.7 }]);
  }
  /* drums: a 4-step grid, each beat maybe, each offset by the dice */
  const kick = [], snare = [], hat = [];
  for (let s = 0; s < LEN; s += 4) {
    if (R() < 0.6) kick.push(s + (R() < 0.25 ? 1.5 : 0));
    if (R() < 0.3) snare.push(s + 2 + (R() < 0.3 ? 0.5 : 0));
  }
  for (let i = 0; i < 26; i++) hat.push(Math.floor(R() * LEN * 4) / 4);
  return {
    bpm: 108, len: LEN, lead, bass, pad, arp,
    kick, hat, snare,
    timbre: { lead: 'square', bass: 'square', pad: 'triangle', arp: 'square' },
    rel: { lead: 0.9, bass: 0.95, pad: 0.8, arp: 0.5, drum: 0.7 },
    double: false,
    fx: { lp: 6500, delay: 0.09, fb: 0.55 }
  };
}

export function variantSpec(id, loop) {
  loop = loop | 0;
  switch (id) {
    case 'mellow':  return mellow();
    case 'dynamic': return dynamic(loop);
    case 'glitch':  return glitch(loop);
    default:        return hymn();
  }
}
