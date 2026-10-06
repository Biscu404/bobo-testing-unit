/* The folders in TheStack.

   One for the lobby (the four moods of the hymn) and one for every other app
   on the machine that scores itself with music. Nothing here is recorded:
   each entry is the app's own score, lifted out of the module that plays it
   live and described as a disc spec — the same shape discs.js presses — so
   the app and its folder can never drift apart. A disc is pressed the first
   time somebody plays it (see ensureBuf in index.js), not when the window
   opens, because forty offline renders at once would stall the whole box. */
import { VARIANTS, variantSpec } from '../../kernel/music_variants.js';
import { MG_SONGS, MG_HZ } from '../magen/data.js';
import { CK_SONGS, CK_HZ } from '../cook/data.js';
import { ELE_SONGS, ELE_HZ } from '../elephant/quotes.js';
import { SONGS as BEK_SONGS, NOTE as BEK_NOTE } from '../bekkedal/music.js';
import { BPM as SB_BPM, ROOT as SB_ROOT, BASS as SB_BASS, LEAD as SB_LEAD } from '../standbattle/music.js';
import * as Lang from '../../kernel/songtext.js';
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

function standBattle() {
  const lead = [], bass = [], kick = [], hat = [], snare = [];
  SB_LEAD.forEach((d, i) => { if (d != null) lead.push([SB_ROOT * Math.pow(2, d / 12), i, 1.35]); });
  [0, 16].forEach(o => SB_BASS.forEach((d, i) => { if (d != null) bass.push([SB_ROOT * Math.pow(2, d / 12), i + o, 1.8]); }));
  for (let s = 0; s < 32; s++) {
    if (s % 8 === 0) kick.push(s);
    if (s % 2 === 1) hat.push(s);
    if (s % 16 === 4 || s % 16 === 12) snare.push(s);
  }
  return { bpm: SB_BPM, len: 32, tint: 'red', artist: 'STAND BATTLE ARENA', lead, bass, pad: null, arp: null,
           kick, hat, snare, timbre: { bass: 'triangle' }, rel: { drum: 0.7 } };
}

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

  const mg = ['freygish', 'nigun', 'misheberach', 'hora', 'zmirot'].filter(k => MG_SONGS[k]);
  out.push(['MAGEN', 'cyan', mg.map(k => [k.toUpperCase(), fromEighths(MG_SONGS[k], MG_HZ, 'cyan', 'MAGEN BAND')])]);

  out.push(['THE COOK', 'amber', Object.keys(CK_SONGS).map(k =>
    [k.toUpperCase(), fromEighths(CK_SONGS[k], CK_HZ, 'amber', 'THE COOK RADIO')])]);

  const names = { first: 'FIRST LIGHT', wide: 'WIDE', carry: 'CARRY', above: 'ABOVE', home: 'HOME' };
  out.push(['ELEPHANT', 'green', Object.keys(ELE_SONGS).map(k =>
    [names[k] || k.toUpperCase(), fromEighths(ELE_SONGS[k], ELE_HZ, 'green', 'ELEPHANT')])]);

  const bek = { dag: 'DAG', kveld: 'KVELD', gruva: 'GRUVA', vidda: 'VIDDA', folkedans: 'FOLKEDANS' };
  out.push(['BEKKEDAL', 'green', Object.keys(BEK_SONGS).map(k =>
    [bek[k] || k.toUpperCase(), fromEighths(BEK_SONGS[k], BEK_NOTE, 'green', 'BEKKEDAL')])]);

  out.push(['STAND BATTLE', 'red', [['MORIOH (COMBAT LOOP)', standBattle()]]]);

  /* the Garage's own songs: real instruments, bounced by the studio rather than synthesised here */
  out.push(['THE GARAGE', 'white', demoSongs(Lang).map(sg => [sg.title, {
    song: sg, bpm: sg.bpm, len: sg.bars * sg.beats * 4, tint: 'white', artist: 'THE GARAGE BAND'
  }])]);

  out.forEach(f => f[2].forEach(d => { d[1].reps = reps(d[1]); }));
  return out;
}
