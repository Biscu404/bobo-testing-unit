/* The folders in TheStack.

   One for the lobby (the four moods of the hymn) and one for every other app
   on the machine that scores itself with music. Nothing here is recorded:
   each entry is the app's own score, lifted out of the module that plays it
   live and described as a disc spec — the same shape discs.js presses — so
   the app and its folder can never drift apart. A disc is pressed the first
   time somebody plays it (see ensureBuf in index.js), not when the window
   opens, because forty offline renders at once would stall the whole box. */
import { VARIANTS, variantSpec } from '../../kernel/music_variants.js';
import * as MG from '../magen/score.js';
import { CK_SONGS, CK_HZ } from '../cook/data.js';
import * as ELE from '../elephant/score.js';
import * as BEK from '../bekkedal/score.js';
import * as SB from '../standbattle/score.js';
import * as Lang from '../../kernel/songtext.js';
import { symphony, unlocked, BARS as SYM_BARS, BPM as SYM_BPM } from '../../kernel/symphony.js';
import { demoSongs } from '../garage/songs.js';

const TARGET_SECS = 75;                     /* roughly how long a pressed disc plays */

/* an app's score is in eighths against `bpm`; a disc is in sixteenths */
function fromEighths(song, hzTable, tint, artist) {
  const f = list => (list || []).map(n => [hzTable[n[0]] || n[0], n[1] * 2, n[2] * 2]);
  const spec = {
    bpm: song.bpm, len: (song.len || 32) * 2, tint: tint, artist: artist,
    lead: f(song.lead), bass: f(song.bass), pad: f(song.pad), arp: song.arp ? f(song.arp) : null,
    kick: [], hat: [], snare: []
  };
  if (song.wave) spec.timbre = { lead: song.wave };
  return spec;
}
const reps = spec => Math.max(3, Math.round(TARGET_SECS / (spec.len * 15 / spec.bpm)));

/* a game's own song (a studio song: real instruments), pressed as it is, with every layer on or the ones asked for */
const pure = (song, layers) => {
  const c = JSON.parse(JSON.stringify(song));
  c.tracks.forEach(t => { t.solo = false; t.mute = layers && t.layer != null ? !layers[t.layer] : false; });
  return c;
};
const disc = (song, tint, artist, layers) => { const c = pure(song, layers); return { song: c, bpm: c.bpm, len: c.bars * c.beats * 4, tint, artist }; };

const TITLE = {
  /* lobby */ hymn: 'HYMN', mellow: 'HYMN (MELLOW)', dynamic: 'HYMN (DYNAMIC)', glitch: 'HYMN (GLITCH)'
};

/* [folder name, folder tint, [[disc name, spec], ...]] */
export function stackFolders() {
  const out = [];

  out.push(['LOBBY MUSIC', 'white', VARIANTS.map(v => {
    const sp = variantSpec(v.id, v.id === 'dynamic' ? 2 : 3);
    sp.tint = v.id === 'mellow' ? 'cyan' : v.id === 'dynamic' ? 'amber' : v.id === 'glitch' ? 'red' : 'white';
    sp.artist = 'HOLYTRON SIGNAL / ' + v.mood;
    sp.rel = Object.assign({}, sp.rel);
    return [TITLE[v.id], sp];
  })]);

  out.push(['MAGEN', 'cyan', MG.IDS.map(k => [MG.NAMES[k], disc(MG.song(Lang, k), 'cyan', 'MAGEN BAND')])]);

  out.push(['THE COOK', 'amber', Object.keys(CK_SONGS).map(k =>
    [k.toUpperCase(), fromEighths(CK_SONGS[k], CK_HZ, 'amber', 'THE COOK RADIO')])]);

  out.push(['ELEPHANT', 'green', ELE.IDS.map(k => [ELE.NAMES[k], disc(ELE.song(Lang, k), 'green', 'ELEPHANT')])]);

  out.push(['BEKKEDAL', 'green', BEK.IDS.map(k => [BEK.NAMES[k], disc(BEK.song(Lang, k), 'green', 'BEKKEDAL')])]);

  const sb = SB.song(Lang);
  out.push(['STAND BATTLE', 'red', [['MORIOH (EXPLORE)', SB.layersFor(0)], ['MORIOH (COMBAT)', SB.layersFor(1)], ['MORIOH (TENSION)', SB.layersFor(2)]]
    .map(([n, lay]) => [n, disc(sb, 'red', 'STAND BATTLE ARENA', lay)])]);

  /* the Garage's own songs: real instruments, bounced by the studio rather than synthesised here */
  out.push(['THE GARAGE', 'white', demoSongs(Lang).map(sg => [sg.title, {
    song: sg, bpm: sg.bpm, len: sg.bars * sg.beats * 4, tint: 'white', artist: 'THE GARAGE BAND'
  }])]);

  /* the style meter's symphony: here once the meter has read HAPPY BIRTHDAY for the first time, whole, and once through */
  if (unlocked()) out.push(['STYLE METER', 'white', [['UNWRAPPED', { song: symphony(Lang), bpm: SYM_BPM, len: SYM_BARS * 16, tint: 'white', artist: 'HOLYTRON / THE STYLE METER', once: true, level: 0.5, limit: -6 }]]]);

  out.forEach(f => f[2].forEach(d => { d[1].reps = d[1].once ? 1 : reps(d[1]); }));
  return out;
}
