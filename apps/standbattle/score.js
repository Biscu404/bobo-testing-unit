/* Stand Battle's score, for real instruments: one combat loop in E minor at 148, eight bars, built
   in three layers that the fight switches on and off while it plays.

     EXPLORE   a soft pad, the bass on the strong beats, a kick.
     COMBAT    the rest of the bass, the riff on a driven guitar, a back-beat and hats.
     TENSION   crash, snare doubling, a tom fill, and the strings stabbing the chord.

   The riff and the bass line are the ones the arena has always had (degrees above E2, in sixteenths),
   carried round the changes Em, Em, C, D, Em, Em, C, B7, with the second pass an octave up. */
import { memo } from '../scorekit.js';

export const BPM = 148, ROOT = 40;                  /* E2 */
const BASS = [0, null, 0, null, 7, null, 5, null, 0, null, 0, null, 10, null, 7, null];
const LEAD = [12, null, 15, 12, null, 19, 17, null, 15, null, 12, null, 10, null, null, null,
  12, null, 15, 12, null, 19, 22, null, 19, 17, 15, null, 12, null, null, null];
const ROOTS = [0, 0, -4, -2, 0, 0, -4, 7];          /* the chord of each bar, as steps from E */
export const LAYERS = ['explore', 'combat', 'tension'];
export const layersFor = level => ({ explore: true, combat: level >= 1, tension: level >= 2 });

/* sixteenth-step degrees -> notes: each lasts until the next, at most a beat */
function riff(steps, base, at, vel) {
  const out = [];
  steps.forEach((d, i) => {
    if (d == null) return;
    let j = i + 1; while (j < steps.length && steps[j] == null && j - i < 4) j++;
    out.push([at + i / 4, (j - i) / 4 * 0.92, base + d, vel]);
  });
  return out;
}

const make = memo(L => {
  const bass0 = [], bass1 = [], lead = [], chords = [];
  ROOTS.forEach((r, b) => {
    BASS.forEach((d, i) => {
      if (d == null) return;
      const n = [b * 4 + i / 4, 0.4, ROOT + r + d, i % 4 === 0 ? 0.9 : 0.75];
      (i % 8 === 0 ? bass0 : bass1).push(n);
    });
    const half = b < 4 ? 0 : 12;                              /* the second pass sings an octave up */
    const bar = LEAD.slice((b % 2) * 16, (b % 2) * 16 + 16);
    lead.push(...riff(bar, ROOT + r + half, b * 4, 0.82));
    const root = 52 + r;                                       /* the chord, above the bass */
    const mm = b === 7 ? [0, 4, 7] : (r === -4 ? [0, 4, 7] : r === -2 ? [0, 4, 7] : [0, 3, 7]);
    mm.forEach(k => chords.push([b * 4, 4, root + k, 0.5]));
  });
  const stabs = [];
  chords.forEach(c => { for (const t of [0, 1.5, 2.5]) stabs.push([c[0] + t, 0.4, c[2] + 12, 0.7]); });
  const tr = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
  return L.buildSong({ title: 'MORIOH', bpm: BPM, key: 'E', scale: 'minor', bars: 8, tracks: [
    tr('PAD', 'strings', chords.map(c => [c[0], c[1], c[2], 0.32]), { vol: 0.4, reverb: 0.4, layer: 'explore' }),
    tr('BASS', 'bass', bass0, { vol: 0.82, reverb: 0.03, drive: 0.18, layer: 'explore' }),
    tr('BASS+', 'bass', bass1, { vol: 0.8, reverb: 0.03, drive: 0.18, layer: 'combat' }),
    { name: 'KICK', drums: { kick: 'x.......x.......' }, vol: 0.8, reverb: 0.05, layer: 'explore' },
    tr('RIFF', 'eguitar', lead, { vol: 0.72, reverb: 0.2, echo: 0.18, drive: 0.5, comp: 0.4, pan: -0.2, layer: 'combat' }),
    { name: 'BEAT', drums: { snare: '........x.......', kick: '..x.....x.x.....', hat: '.x.x.x.x.x.x.x.x' }, vol: 0.62, reverb: 0.08, layer: 'combat' },
    tr('STABS', 'strings', stabs, { vol: 0.5, reverb: 0.25, pan: 0.2, layer: 'tension' }),
    { name: 'DRIVE', drums: { crash: 'x...............', snare: '....x.x.....x.xx', hitom: '............x...', lotom: '..............x.' }, vol: 0.6, reverb: 0.1, layer: 'tension' }] });
});
export const song = L => make(L, 'morioh');
