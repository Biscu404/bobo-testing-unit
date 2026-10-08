/* The rules a genre is held to in the Studio Course. Each factory returns (song, c) => boolean, where c = { L, R, g }:
   L is the language (kernel/songtext.js), R is roles(song) (who is the bass, the chords, the lead, the drums) and g is the genre.
   They read the song and nothing else, so the course can be proved against a model answer without a screen. */
import { notesOf, hitsOf, near, pc, avg, drumsOf, inBar, hitAt, velOf, inKey, keyPc, chordRoots, chordTones, barOf } from './course_util.js';

const bars = (song, from, to) => { const a = []; for (let b = from; b < Math.min(to == null ? song.bars : to, song.bars); b++) a.push(b); return a; };

/* ---- tracks that exist ----------------------------------------------------------------------------------------------------------- */
export const hasInst = insts => song => song.tracks.some(x => insts.indexOf(x.inst) >= 0);
export const noDrumKit = song => !drumsOf(song) || hitsOf(drumsOf(song)).length === 0;

/* ---- drums ------------------------------------------------------------------------------------------------------------------------- */
/* the pattern of one bar: need = { kick: [0, 8], snare: [4, 12] } in sixteenths; every = all bars, or just the first */
export const kit = (need, every) => song => {
  const d = drumsOf(song); if (!d) return false;
  return (every ? bars(song, 0) : [0]).every(b => Object.keys(need).every(p => need[p].every(pos => hitAt(d, p, pos, b, song))));
};
export const hats = (n, pieces) => song => { const d = drumsOf(song); return !!d && hitsOf(d).filter(h => pieces.indexOf(h[1]) >= 0 && h[0] < song.beats).length >= n; };
/* percussion played as notes (timpani): a note on the first beat of every bar */
export const downbeats = song => { const t = song.tracks.find(x => x.inst === 'timpani'); return !!t && bars(song, 0).every(b => inBar(t, song, b).some(n => near(n[0], b * song.beats, 0.1))); };

/* ---- the bass --------------------------------------------------------------------------------------------------------------------- */
const rootsOK = (song, c, missAllowed, test) => {
  const t = c.R.bass; if (!t) return false;
  const roots = chordRoots(c.L, song, c.g.prog); let ok = 0;
  bars(song, 0).forEach(b => { const n = inBar(t, song, b).find(x => near(x[0], b * song.beats, 0.3) && pc(x[2]) === roots[b]); if (n && test(n, inBar(t, song, b))) ok++; });
  return ok >= song.bars - missAllowed;
};
export const bassRoots = miss => (song, c) => rootsOK(song, c, miss || 0, () => true);
export const bassHeld = minDur => (song, c) => rootsOK(song, c, 0, n => n[1] >= minDur);
export const bassBusy = per => (song, c) => rootsOK(song, c, 0, (n, all) => all.length >= per);
export const bassOffbeat = per => (song, c) => { const t = c.R.bass; return !!t && bars(song, 0).every(b => inBar(t, song, b).filter(n => near(n[0] % 1, 0.5, 0.08)).length >= per); };

/* ---- the chords ------------------------------------------------------------------------------------------------------------------ */
/* a chord struck at each of these beats of every bar, with at least minPcs different notes, nearly all of them the chord's own (or its sevenths) */
export const chordsOn = (offsets, minPcs) => (song, c) => {
  const t = c.R.chords; if (!t) return false;
  const tones = chordTones(c.L, song, c.g.prog), roots = chordRoots(c.L, song, c.g.prog);
  return bars(song, 0).every(b => offsets.every(o => {
    const at = inBar(t, song, b).filter(n => near(n[0], b * song.beats + o, 0.1));
    const pcs = new Set(at.map(n => pc(n[2]))), allowed = new Set(tones[b].concat([pc(roots[b] + 10), pc(roots[b] + 11), pc(roots[b] + 2)]));
    return pcs.size >= minPcs && at.filter(n => allowed.has(pc(n[2]))).length >= at.length * 0.9;
  }));
};
export const noChordOn = offset => (song, c) => { const t = c.R.chords; return !!t && bars(song, 0).every(b => !inBar(t, song, b).some(n => near(n[0], b * song.beats + offset, 0.1))); };
export const sevenths = frac => (song, c) => {
  const t = c.R.chords; if (!t) return false;
  const roots = chordRoots(c.L, song, c.g.prog); let k = 0;
  bars(song, 0).forEach(b => { const pcs = inBar(t, song, b).map(n => pc(n[2])); if (pcs.indexOf(pc(roots[b] + 10)) >= 0 || pcs.indexOf(pc(roots[b] + 11)) >= 0) k++; });
  return k >= song.bars * frac;
};
export const chordsHeld = minDur => (song, c) => { const t = c.R.chords; return !!t && bars(song, 0).every(b => inBar(t, song, b).some(n => n[1] >= minDur)); };
export const chordsRolled = per => (song, c) => { const t = c.R.chords; return !!t && bars(song, 0).every(b => inBar(t, song, b).length >= per); };

/* ---- the tune ---------------------------------------------------------------------------------------------------------------------- */
export const melody = o => (song, c) => {
  const t = c.R.lead; if (!t) return false;
  const end = (o.within || c.g.bars) * song.beats, ns = notesOf(t).filter(n => n[0] < end).slice().sort((a, b) => a[0] - b[0]);
  if (ns.length < (o.min || 8) || ns.length > (o.max || 99)) return false;
  if (new Set(ns.map(n => barOf(song, n[0]))).size < (o.bars || 3)) return false;
  if (ns.filter(n => inKey(n[2], song.key, song.scale)).length < ns.length * 0.85) return false;
  if (new Set(ns.map(n => n[2])).size < 3 || new Set(ns.map(n => Math.round(n[1] * 4))).size < 2) return false;
  if (o.range && !(avg(ns.map(n => n[2])) >= o.range[0] && avg(ns.map(n => n[2])) <= o.range[1])) return false;
  const iv = ns.slice(1).map((n, i) => n[2] - ns[i][2]);
  if (o.leap && !iv.some(v => Math.abs(v) >= o.leap)) return false;
  if (o.stepwise && avg(iv.map(Math.abs)) > o.stepwise) return false;
  if (o.shortest && ns.some(n => n[1] < o.shortest - 1e-6)) return false;
  if (o.longNote && !ns.some(n => n[1] >= o.longNote)) return false;
  if (o.rest && bars(song, 0, c.g.bars).filter(b => !inBar(t, song, b).length).length < o.rest) return false;
  if (o.repeat) { const w = iv.slice(0, 3).join(','); let again = false; for (let i = 3; i + 2 < iv.length; i++) if (iv.slice(i, i + 3).join(',') === w) again = true; if (!again) return false; }
  return true;
};
export const ends = (song, c) => {
  const t = c.R.lead; if (!t) return false;
  const ns = notesOf(t).filter(n => n[0] < c.g.bars * song.beats).sort((a, b) => a[0] - b[0]); if (!ns.length) return false;
  const last = ns[ns.length - 1], b = Math.min(barOf(song, last[0]), song.bars - 1);
  return chordTones(c.L, song, c.g.prog)[b].indexOf(pc(last[2])) >= 0 || pc(last[2]) === keyPc(song.key);
};

/* ---- shape and dynamics --------------------------------------------------------------------------------------------------- */
const avgVel = (song, a, b, only) => avg(song.tracks.filter(t => t.inst !== 'drums' && (!only || only(t))).flatMap(t => notesOf(t).filter(n => n[0] >= a && n[0] < b).map(velOf)));
export const lift = semis => (song, c) => {
  const t = c.R.lead, h = (c.g.bars / 2) * song.beats; if (!t) return false;
  const a = notesOf(t).filter(n => n[0] < h).map(n => n[2]), b = notesOf(t).filter(n => n[0] >= h && n[0] < c.g.bars * song.beats).map(n => n[2]);
  return a.length > 2 && b.length > 2 && avg(b) - avg(a) >= semis;
};
export const fill = n => song => { const d = drumsOf(song); if (!d) return false; const lastBar = (Math.min(song.bars, 8) - 1) * song.beats; return hitsOf(d).filter(h => h[0] >= lastBar - 1e-6 && h[0] < lastBar + song.beats && /tom/.test(h[1])).length >= n; };
export const buildUp = n => song => { const d = drumsOf(song); if (!d) return false; const lastBar = (Math.min(song.bars, 8) - 1) * song.beats; return hitsOf(d).filter(h => h[0] >= lastBar - 1e-6 && h[0] < lastBar + song.beats).length >= n; };
export const crescendo = delta => (song, c) => { const e = c.g.bars * song.beats, w = 2 * song.beats; return avgVel(song, e - w, e) - avgVel(song, 0, w) >= delta; };
export const accent = delta => song => {
  const all = song.tracks.filter(t => t.inst !== 'drums').flatMap(t => notesOf(t)), on = all.filter(n => near(n[0] % song.beats, 0, 0.05)).map(velOf), off = all.filter(n => !near(n[0] % song.beats, 0, 0.05)).map(velOf);
  return on.length > 3 && off.length > 3 && avg(on) - avg(off) >= delta;
};
export const quiet = max => song => avgVel(song, 0, song.bars * song.beats) <= max && song.tracks.some(t => notesOf(t).length);
export const offGrid = frac => (song, c) => { const t = c.R.lead; if (!t) return false; const ns = notesOf(t); return ns.length > 3 && ns.filter(n => Math.abs(n[0] * 4 - Math.round(n[0] * 4)) > 0.02).length >= ns.length * frac; };

/* ---- the desk ---------------------------------------------------------------------------------------------------------------------- */
const field = (t, k) => { const e = t.eq || [0, 0, 0]; return k === 'eq0' ? e[0] || 0 : k === 'eq1' ? e[1] || 0 : k === 'eq2' ? e[2] || 0 : k === 'vol' ? (t.vol == null ? 0.8 : t.vol) : k === 'reverb' ? (t.reverb == null ? 0.15 : t.reverb) : (t[k] || 0); };
/* items: [role, field, '<='|'>=', value]; role 'master' reads the limiter (a number of dB, null for off, which counts as 0) */
export const mix = items => (song, c) => items.every(([role, k, op, v]) => {
  let x;
  if (role === 'master') x = song.limit === undefined ? -9 : (song.limit == null ? 0 : song.limit);
  else if (role === 'all') { const ts = song.tracks.filter(t => notesOf(t).length || hitsOf(t).length); return ts.length >= 2 && ts.every(t => op === '<=' ? field(t, k) <= v + 1e-6 : field(t, k) >= v - 1e-6); }
  else { const t = c.R[role]; if (!t) return false; x = field(t, k); }
  return op === '==' ? x === v : op === '<=' ? x <= v + 1e-6 : x >= v - 1e-6;
});
/* the lead is louder than the chords by this much */
export const louder = by => (song, c) => !!c.R.lead && !!c.R.chords && field(c.R.lead, 'vol') - field(c.R.chords, 'vol') >= by - 1e-6;
export const all = (...fs) => (song, c) => fs.every(f => f(song, c));
/* every bass note is a tone of the chord that bar */
export const bassTones = (song, c) => { const t = c.R.bass; if (!t || !notesOf(t).length) return false; const tones = chordTones(c.L, song, c.g.prog); return notesOf(t).every(n => tones[Math.min(song.bars - 1, barOf(song, n[0]))].indexOf(pc(n[2])) >= 0); };
/* every chord note is a tone of the chord that bar (an arpeggio, a roll) and there are at least `per` of them in each bar */
export const chordsOnly = per => (song, c) => { const t = c.R.chords; if (!t) return false; const tones = chordTones(c.L, song, c.g.prog); return bars(song, 0).every(b => inBar(t, song, b).length >= per && inBar(t, song, b).every(n => tones[b].indexOf(pc(n[2])) >= 0)); };
export const longer = bars_ => song => song.bars >= bars_;
export const everyBarPlays = song => { const t = song.tracks.filter(x => notesOf(x).length || hitsOf(x).length); const last = song.bars - 1; return t.length >= 3 && t.filter(x => [...notesOf(x), ...hitsOf(x)].some(n => barOf(song, n[0]) === last)).length >= t.length - 0; };
