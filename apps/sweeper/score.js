/* Dungeon Sweeper's score: five dungeon-synth tunes for the studio's real instruments, built from the data in tunes_a.js and tunes_b.js.
 *
 * Every tune is a studio song: a lead, a pad that holds the chords, an organ drone, a bass that walks the roots, and where the tune asks
 * for it an arpeggio and the timpani. Nothing is a layer, so each tune is a whole piece on its own (the director in music.js changes
 * between them by place: a tune is chosen for where you are, not for how far you have got). */
import { memo, scale } from '../scorekit.js';
import { TUNES_A } from './tunes_a.js';
import { TUNES_B } from './tunes_b.js';

export const TUNES = Object.assign({}, TUNES_A, TUNES_B);
export const IDS = ['gate', 'crossway', 'moss', 'hollow', 'underdeep'];
export const NAMES = Object.fromEntries(IDS.map(id => [id, TUNES[id].title]));
export const BARS = 16, BPB = 4;

/* where the game is -> the tune that plays there (see music.js: a place change is a crossfade on a bar line) */
export const PLACE_TUNE = { gate: 'gate', camp: 'crossway', moss: 'moss', hollow: 'hollow', under: 'underdeep' };

const track = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);

/* the timpani: a hit on each of the beats named, in every bar, on the root of its chord (an octave down from the bass's root) */
const booms = (L, ch, beats) => {
  const out = [];
  ch.forEach((c, b) => { const r = L.chordNotes(c, 38)[0]; beats.forEach(k => out.push([b * BPB + k, 1.2, r, 0.6])); });
  return out;
};

function band(L, id) {
  const d = TUNES[id], ch = d.chords.split(' '), lead = L.parseNotes(d.melody.join(' | '));
  const tracks = [
    track('LEAD', d.lead, scale(lead, 0.9), { vol: 0.8, reverb: 0.4, pan: -0.1 }),
    track('PAD', d.pad, scale(L.chordLine(ch, BPB, 'pad', 52), 0.55), { vol: 0.5, reverb: 0.55, pan: 0.25 }),
    track('DRONE', 'organ', scale(L.chordLine(ch, BPB, 'pad', 36), 0.3), { vol: 0.3, reverb: 0.5, pan: -0.25 }),
    track('BASS', d.bass, L.bassLine(ch, BPB, 'root'), { vol: 0.7, reverb: 0.12 })
  ];
  if (d.arp) tracks.push(track('ARP', d.arp, scale(L.chordLine(ch, BPB, 'arp', 60), 0.5), { vol: 0.35, reverb: 0.5, pan: 0.35 }));
  if (d.booms.length) tracks.push(track('TIMPANI', 'timpani', booms(L, ch, d.booms), { vol: 0.5, reverb: 0.2 }));
  return L.buildSong({ title: d.title, bpm: d.bpm, key: d.key, scale: d.scale, bars: BARS, beats: BPB, swing: 0.5, tracks });
}

const make = memo(band);
export const song = (L, id) => make(L, id);
