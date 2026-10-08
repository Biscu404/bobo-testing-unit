/* Where the Garage tells the trophies what happened (the list is trophies.js). It reads the song itself: at a save it works out what the song holds (drums, bass, chords, a lead, how many
   families, a bought pack, whether it was put in by ear), on an edit whether a phrase was played with MAGIC NOTES, on a mix change whether one track uses the whole desk. `api.trophy` is
   this, so the files that need it (keys, band, export, lessons, course) say one line. None of it can throw into the app. */
import { trophies } from '../trophy_scope.js';
import { packOf } from './packs.js';
import { FAMILIES_NEEDED } from './trophies.js';

const TR = trophies('garage');
const guard = f => { try { return f(); } catch (e) { return undefined; } };
const pitched = t => t.inst !== 'drums';
const count = song => song.tracks.reduce((n, t) => n + (pitched(t) ? (t.notes || []).length : (t.hits || []).length), 0);
const SEGMENT = ['paste', 'duplicate', 'repeat', 'gap', 'del', 'cut'];

/* a track with chords in it: some moment where three or more notes begin together, twice */
const chordy = t => { const at = {}; (t.notes || []).forEach(n => { const k = Math.round(n[0] * 8); at[k] = (at[k] || 0) + 1; }); return Object.keys(at).filter(k => at[k] >= 3).length >= 2; };

export function createCalls(api) {
  const G = api.G;
  let last = 0, magicAdds = 0, byHandAdds = 0, baseBars = null, segOps = 0, takeNotes = 0, told = {};
  const once = (k, f) => { if (!told[k]) { told[k] = 1; f(); } };

  function summary() {
    const song = G.song, studio = api.studio, lang = api.lang;
    const live = song.tracks.filter(t => (pitched(t) ? (t.notes || []).length : (t.hits || []).length) > 0);
    const fam = id => { const i = studio.ins.find(id); return i ? i.family : null; };
    const roles = live.filter(pitched), bass = roles.filter(t => fam(t.inst) === 'BASS'), others = roles.filter(t => fam(t.inst) !== 'BASS');
    const chords = others.filter(chordy), leads = others.filter(t => !chordy(t) && (t.notes || []).length >= 8);
    const notes = roles.reduce((a, t) => a.concat(t.notes || []), []);
    const out = notes.filter(n => !lang.inScale(n[2], song.key, song.scale)).length;
    return {
      bars: song.bars, beats: song.beats, drums: live.some(t => t.inst === 'drums' && (t.hits || []).length >= 4), bass: bass.some(t => t.notes.length >= 4), chords: chords.length > 0, lead: leads.length > 0,
      families: new Set(live.map(t => fam(t.inst)).filter(Boolean)).size,
      pack: live.some(t => { const p = packOf(t.inst); return !!p && window.Cos && window.Cos.has('garage', p.id); }),
      byEar: song.bars >= 8 && notes.length >= 8 && out === 0 && byHandAdds >= 8 && !G.magic
    };
  }
  /* after something that is not a hand's doing (a song opened, a band added): do not count what it brought */
  const sync = () => { last = count(G.song); magicAdds = 0; byHandAdds = 0; baseBars = last ? G.song.bars : null; segOps = 0; told = {}; };

  return {
    sync,
    changed(kind) {
      guard(() => {
        if (kind === 'edit') {
          const n = count(G.song), d = n - last; last = n;
          if (n > 0) { once('note', () => TR.emit('note', {})); if (baseBars == null) baseBars = G.song.bars; }
          if (d >= 1 && d <= 2) { if (G.magic) { magicAdds += d; if (magicAdds >= 4) once('magic', () => TR.emit('magic', {})); } else byHandAdds += d; }
          if (segOps >= 3 && G.song.bars >= 32 && baseBars != null && baseBars <= 8) once('grown', () => TR.emit('grown', {}));
        }
        if (kind === 'mix' || kind === 'edit') {
          if (G.song.tracks.some(t => t.eq && t.eq.some(v => v !== 0) && t.comp > 0 && t.drive > 0 && t.reverb != null && Math.abs(t.reverb - 0.15) > 0.01)) once('desk', () => TR.emit('desk', {}));
        }
      });
    },
    segment: name => guard(() => { if (SEGMENT.indexOf(name) >= 0) segOps++; }),
    band: () => guard(() => TR.emit('band', {})),
    saved: () => guard(() => TR.emit('save-song', summary())),
    recNote: () => guard(() => { takeNotes++; }),
    takeEnd() { guard(() => { if (takeNotes > 0) TR.emit('rec-take', { notes: takeNotes }); takeNotes = 0; }); },
    exported: (kind, peak) => guard(() => { if (kind === 'midi') TR.mark('midi', 'out'); TR.emit('export', { kind: kind, peak: peak }); }),
    imported: () => guard(() => TR.mark('midi', 'in')),
    lesson: n => guard(() => TR.max('lessons', n)),
    course: o => guard(() => TR.emit('course', o))
  };
}
void FAMILIES_NEEDED;
