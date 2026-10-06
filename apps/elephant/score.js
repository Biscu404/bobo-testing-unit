/* The elephant's five songs, for real instruments.

   Not lullabies: every one is in a major key, every one climbs, and every one lands somewhere
   brighter than it started. The notes are the ones he has always had (quotes.js still holds
   the tables, which this reads), but a flute or a violin or a piano now sings the tune over
   strings, a cello, a harp, a choir; and each song is eight bars, not four, because the second time
   round is the climb: the same tune again with a voice an octave above it and a choir
   arriving underneath. Which song goes with which place is ELE_PLACES, in quotes.js. */
import { ELE_SONGS } from './quotes.js';
import { eighths, shifted, scale, above, memo } from '../scorekit.js';

export const IDS = ['first', 'wide', 'carry', 'above', 'home'];
export const NAMES = { first: 'FIRST LIGHT', wide: 'WIDE', carry: 'CARRY', above: 'ABOVE', home: 'HOME' };
const TITLE = { first: 'FIRST LIGHT', wide: 'WIDE', carry: 'CARRY', above: 'ABOVE', home: 'HOME' };
const KEY = { first: ['D', 'major'], wide: ['A', 'major'], carry: ['G', 'major'], above: ['E', 'major'], home: ['C', 'major'] };

/* who plays what, and how loud; hi is the voice that joins the tune an octave up the second time round */
const BAND = {
  first: { lead: 'flute', hi: 'violin', pad: 'strings', bass: 'cello', arp: 'harp', extra: ['glock', 0.3] },
  wide: { lead: 'clarinet', hi: 'flute', pad: 'strings', bass: 'cello', arp: 'kalimba', extra: ['bells', 0.25] },
  carry: { lead: 'trumpet', hi: 'violin', pad: 'nylon', bass: 'upright', arp: 'marimba', drums: { kick: 'x.......x.......', shaker: 'x.x.x.x.x.x.x.x.', tamb: '....x.......x...' } },
  above: { lead: 'violin', hi: 'glock', pad: 'choir', bass: 'cello', arp: 'musicbox', extra: ['harp', 0.4] },
  home: { lead: 'piano', hi: 'flute', pad: 'organ', bass: 'cello', arp: 'harp', extra: ['strings', 0.3] }
};

const make = memo((L, id) => {
  const d = ELE_SONGS[id], b = BAND[id], len = d.len / 2;
  const lead = eighths(d.lead, 0.74), pad = eighths(d.pad, 0.5), bass = eighths(d.bass, 0.68), arp = d.arp ? eighths(d.arp, 0.46) : [];
  const twice = n => n.concat(shifted(n, len, 0));
  const t = (name, inst, notes, o) => Object.assign({ name, inst, notes }, o);
  const tracks = [
    t('TUNE', b.lead, twice(lead), { vol: 0.8, reverb: 0.35 }),
    t('CLIMB', b.hi, shifted(above(lead, 12, 0.5), len, 0), { vol: 0.5, reverb: 0.45, pan: 0.3 }),
    t('PAD', b.pad, twice(scale(pad, b.pad === 'nylon' ? 0.9 : 0.8)), { vol: b.pad === 'nylon' ? 0.5 : 0.42, reverb: 0.45, pan: -0.15 }),
    t('CHOIR', 'choir', shifted(scale(pad, 0.55), len, 0), { vol: 0.34, reverb: 0.6 }),
    t('BASS', b.bass, twice(bass), { vol: 0.62, reverb: 0.1 }),
    t('ARP', b.arp, twice(arp), { vol: 0.5, reverb: 0.5, pan: 0.25 })];
  if (b.extra) tracks.push(t('SPARKLE', b.extra[0], twice(arp).filter((n, i) => i % 3 === 0).map(n => [n[0], n[1] * 1.5, n[2] + 12, 0.4]), { vol: b.extra[1], reverb: 0.6, pan: -0.3 }));
  if (b.drums) tracks.push({ name: 'BRUSHES', drums: b.drums, vol: 0.32, reverb: 0.1 });
  return L.buildSong({ title: TITLE[id], bpm: d.bpm, key: KEY[id][0], scale: KEY[id][1], bars: 8, tracks });
});
export const song = (L, id) => make(L, id);
