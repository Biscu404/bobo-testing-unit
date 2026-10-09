/* Stand Battle's score, for real instruments: seven tunes of thirty-two bars, each with its own band, played through the director (music.js) so that the same eight bars never
   come round and round for a whole fight. It used to be one loop in E minor, eight bars at 148, with a riff somebody had written for something else and a second pass an octave up.

     ARENA LIGHTS      the title and the menus: a flute, an electric piano and strings
     CHOOSE            the fighter select and the versus screen
     BACK ALLEY        the alley: palm-muted guitars
     SHOPPING STREET   the street: funk
     BUDOGAOKA PARK    the park: an anthem
     KAMEYU STORE      the store: jazz fusion
     KILLER QUEEN      the boss

   A tune is a core and two layers that the fight switches on and off while it plays (music.js): `explore` is the floor of it (the pad, the bass held, a kick; in the menus, the
   tune itself), `combat` the band, `tension` the last round and the boss. The notes of the lead are in tunes_a.js and tunes_b.js; what each player does with the chords is
   score_kit.js. */
import { memo, scale } from '../scorekit.js';
import { TUNES_A } from './tunes_a.js';
import { TUNES_B } from './tunes_b.js';
import { BARS, LAYERS, layersFor, chordsOf, leadNotes, bassNotes, compNotes, arpNotes, padNotes, kitDrums, crashEvery, doubleOf } from './score_kit.js';

export { BARS, LAYERS, layersFor };
export const TUNES = Object.assign({}, TUNES_A, TUNES_B);
export const IDS = Object.keys(TUNES);
export const NAMES = IDS.reduce((o, id) => { o[id] = TUNES[id].title; return o; }, {});
export const passSecs = id => BARS * TUNES[id].beats * 60 / TUNES[id].bpm;
/* the lead as the studio keeps it, for the checks */
export const melodyOf = (L, id) => leadNotes(L, TUNES[id]);

/* the tunes of each kind of place, in the order they follow each other: a fight begins with the tune of its own stage and the rest come after it */
export const FIGHT = ['backalley', 'shoppingstreet', 'budogaoka', 'kameyu'];
export const STAGE_TUNE = { alley: 'backalley', street: 'shoppingstreet', park: 'budogaoka', store: 'kameyu' };
export const POOLS = { menu: ['arenalights'], select: ['choose'], boss: ['queen'] };
export function poolFor(place) {
  if (POOLS[place]) return POOLS[place];
  const first = STAGE_TUNE[place] || FIGHT[0], i = FIGHT.indexOf(first);
  return FIGHT.slice(i).concat(FIGHT.slice(0, i));
}

const opt = o => { const r = {}; ['vol', 'pan', 'reverb', 'echo', 'drive', 'comp', 'layer'].forEach(k => { if (o[k] != null) r[k] = o[k]; }); return r; };

function band(L, id) {
  const d = TUNES[id], tracks = [], menu = d.level === 0, lead = leadNotes(L, d);
  const T = (name, inst, notes, o) => tracks.push(Object.assign({ name, inst, notes }, o));
  const D = (name, drums, o) => tracks.push(Object.assign({ name, drums }, o));

  /* the floor: a pad, the bass held on the root, a soft kick */
  T('PAD', d.pad.inst, padNotes(L, d), opt(Object.assign({}, d.pad, { layer: 'explore' })));
  const groove = bassNotes(L, d);
  if (menu) T('BASS', d.bass.inst, groove, opt(Object.assign({}, d.bass, { layer: 'explore' })));
  else {
    const held = chordsOf(d).map((c, bar) => [bar * d.beats, d.beats * 0.96, L.chordNotes(c, d.bass.base || 38)[0], 0.6]);
    T('BASS', d.bass.inst, held, opt(Object.assign({}, d.bass, { layer: 'explore', vol: (d.bass.vol || 0.8) * 0.9 })));
    T('BASS+', d.bass.inst, groove, opt(Object.assign({}, d.bass, { layer: 'combat' })));
  }
  if (d.arp) T('ARP', d.arp.inst, arpNotes(L, d), opt(d.arp));

  /* the tune itself: in the menus it is the floor too; in a fight it is the band */
  T('LEAD', d.lead.inst, scale(lead, d.lead.vel || 1), opt(d.lead));
  if (d.doubleLead) { const dl = d.doubleLead; T('LEAD 2', dl.inst, doubleOf(lead.filter(n => n[0] >= (dl.from || 0) * d.beats), dl.octave || 0, 0.8, 96), opt(dl)); }
  if (d.extra && d.extra.octave != null) T(d.extra.name, d.extra.inst, doubleOf(lead, d.extra.octave, d.extra.k || 0.7, 108), opt(d.extra));
  if (d.comp) T('COMP', d.comp.inst, compNotes(L, d), opt(d.comp));
  if (d.comp2) T('COMP 2', d.comp2.inst, compNotes(L, Object.assign({}, d, { comp: d.comp2 })), opt(d.comp2));

  /* the kit: a kick in the floor, the rest in the band (in the menus, all of it in the floor) */
  const kit = kitDrums(d);
  if (menu) D('KIT', kit, { vol: 0.5, reverb: 0.1, layer: 'explore' });
  else {
    D('KICK', { kick: 'x.......x.......'.repeat(BARS) }, { vol: 0.62, reverb: 0.05, layer: 'explore' });
    D('KIT', kit, { vol: 0.66, reverb: 0.1, layer: 'combat' });
  }

  /* the last round: every section begins on a crash, the pad climbs an octave, and a tune that has one brings a timpani on the roots */
  if (!menu) {
    D('CRASH', { crash: crashEvery(d) }, { vol: 0.55, reverb: 0.2, layer: 'tension' });
    T('HIGH PAD', 'strings', padNotes(L, Object.assign({}, d, { pad: Object.assign({}, d.pad, { base: (d.pad.base || 50) + 12, vel: 0.3 }) })), { vol: 0.4, reverb: 0.45, layer: 'tension' });
  }
  if (d.horns) T('HORNS', d.horns.inst, padNotes(L, Object.assign({}, d, { pad: d.horns })), { vol: d.horns.vol || 0.45, reverb: d.horns.reverb || 0.3, layer: 'tension' });
  if (d.extra && d.extra.hits === 'root') {
    const hits = [];
    chordsOf(d).forEach((c, bar) => { const r = L.chordNotes(c, 40)[0]; hits.push([bar * d.beats, 0.9, r, 0.85]); if (bar % 2 === 1) hits.push([bar * d.beats + 2, 0.5, r, 0.6]); });
    T(d.extra.name, d.extra.inst, hits, opt(d.extra));
  }
  return L.buildSong({ title: d.title, bpm: d.bpm, key: d.key, scale: 'minor', bars: BARS, beats: d.beats, swing: d.swing, tracks });
}

const make = memo((L, id) => band(L, id));
export const song = (L, id) => make(L, id);
