/* Everything that can be done to the notes of a song, as plain functions that change the
   data and know nothing of the screen (so node apps/garage/edit_check.js can hold them
   to account).

   A track holds ITEMS: for a pitched track a note [start, dur, midi, vel], for the drum kit
   a hit [start, key, vel]. Starts and lengths are in beats. "Pitch" below is the midi number
   for a note and the ROW (0 = crash ... down the kit) for a hit, so moving a hit up or down
   moves it along the kit.

   Two scales of editing:
     NOTES     a handful of items in one track: move, resize, copy, paste, duplicate, quantize,
               humanize, transpose, legato, velocity.
     SEGMENTS  a stretch of time, all tracks at once: copy, cut, paste (over or inserting),
               duplicate, delete (leaving a gap or closing it), insert a gap, clear, transpose. */
import { DRUM_ROWS } from './model.js';

const EPS = 1e-6, MIN_LEN = 1 / 24;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r6 = x => Math.round(x * 1e6) / 1e6;

export const isDrum = tr => tr.inst === 'drums';
export const itemsOf = tr => isDrum(tr) ? (tr.hits || (tr.hits = [])) : (tr.notes || (tr.notes = []));
export const rowOf = key => DRUM_ROWS.findIndex(d => d[0] === key);
export const pitchOf = (tr, it) => isDrum(tr) ? rowOf(it[1]) : it[2];
const setPitch = (tr, it, p) => { if (isDrum(tr)) it[1] = DRUM_ROWS[clamp(p, 0, DRUM_ROWS.length - 1)][0]; else it[2] = clamp(Math.round(p), 0, 127); };
export const velOf = (tr, it) => isDrum(tr) ? it[2] : it[3];
export const setVel = (tr, it, v) => { v = clamp(v, 0.04, 1); if (isDrum(tr)) it[2] = v; else it[3] = v; };
/* how long an item is: a hit has no length, so it is given a step to be drawn at */
export const lenOf = (tr, it, step) => isDrum(tr) ? (step > 0 ? step : 0.25) : it[1];
export const endOf = (tr, it, step) => it[0] + lenOf(tr, it, step);
export const sortTrack = tr => { itemsOf(tr).sort((a, b) => a[0] - b[0] || (typeof a[1] === 'string' ? 0 : a[2] - b[2])); };
export const make = (tr, start, len, pitch, vel) => isDrum(tr) ? [r6(start), DRUM_ROWS[clamp(pitch, 0, DRUM_ROWS.length - 1)][0], vel] : [r6(start), Math.max(MIN_LEN, r6(len)), clamp(Math.round(pitch), 0, 127), vel];

/* the item under a point (start in beats, pitch as above), or null */
export function itemAt(tr, start, pitch, step) {
  const L = itemsOf(tr);
  for (let i = L.length - 1; i >= 0; i--) {
    const it = L[i];
    if (pitchOf(tr, it) !== pitch) continue;
    if (isDrum(tr) ? Math.abs(it[0] - start) < (step || 0.25) - EPS && start >= it[0] - EPS : start >= it[0] - EPS && start < it[0] + it[1] - EPS) return it;
  }
  return null;
}
/* the items touched by a rectangle: times a..b (beats), pitches p0..p1 inclusive */
export function itemsIn(tr, a, b, p0, p1, step) {
  const lo = Math.min(p0, p1), hi = Math.max(p0, p1);
  return itemsOf(tr).filter(it => { const p = pitchOf(tr, it); return p >= lo && p <= hi && it[0] < b - EPS && endOf(tr, it, step) > a + EPS; });
}

/* ---- notes ----------------------------------------------------------------------------- */
export function move(tr, items, dBeats, dPitch, o) {
  o = o || {};
  const first = items.reduce((m, it) => Math.min(m, it[0]), Infinity);
  const d = Math.max(dBeats, -first);                           /* nothing is pushed off the front of the song */
  const ps = items.map(it => pitchOf(tr, it) + dPitch);
  const lo = isDrum(tr) ? 0 : (o.lo == null ? 0 : o.lo), hi = isDrum(tr) ? DRUM_ROWS.length - 1 : (o.hi == null ? 127 : o.hi);
  const dp = ps.some(p => p < lo || p > hi) ? 0 : dPitch;       /* ... nor off the top or bottom of the keys */
  items.forEach(it => { it[0] = r6(it[0] + d); if (dp) setPitch(tr, it, pitchOf(tr, it) + dp); });
  return { dBeats: d, dPitch: dp };
}
export function resize(tr, items, dDur) {
  if (isDrum(tr)) return;
  items.forEach(it => { it[1] = Math.max(MIN_LEN, r6(it[1] + dDur)); });
}
export function remove(tr, items) {
  const L = itemsOf(tr), dead = new Set(items);
  for (let i = L.length - 1; i >= 0; i--) if (dead.has(L[i])) L.splice(i, 1);
}
/* a copy of the items, kept relative to the first of them so it can be put down anywhere */
export function copy(tr, items) {
  if (!items.length) return null;
  const t0 = items.reduce((m, it) => Math.min(m, it[0]), Infinity), end = items.reduce((m, it) => Math.max(m, endOf(tr, it, 0.25)), 0);
  return { kind: 'notes', drums: isDrum(tr), len: r6(end - t0), items: items.map(it => { const c = it.slice(); c[0] = r6(it[0] - t0); return c; }) };
}
/* put a copy down at `at`; returns the new items */
export function paste(tr, clip, at) {
  if (!clip || clip.kind !== 'notes' || clip.drums !== isDrum(tr)) return null;
  const L = itemsOf(tr), out = clip.items.map(c => { const it = c.slice(); it[0] = r6(c[0] + at); return it; });
  out.forEach(it => L.push(it));
  sortTrack(tr);
  return out;
}
/* straight after the items themselves */
export function duplicate(tr, items) {
  const c = copy(tr, items);
  if (!c) return [];
  const t0 = items.reduce((m, it) => Math.min(m, it[0]), Infinity);
  return paste(tr, c, t0 + c.len);
}
export function quantize(tr, items, step, strength, lengths) {
  if (!(step > 0)) return;
  const k = strength == null ? 1 : strength;
  items.forEach(it => {
    const s = Math.round(it[0] / step) * step;
    it[0] = r6(Math.max(0, it[0] + (s - it[0]) * k));
    if (lengths && !isDrum(tr)) { const e = Math.max(step, Math.round(it[1] / step) * step); it[1] = r6(it[1] + (e - it[1]) * k); }
  });
}
/* loosen it: timing (beats) and velocity (0..1) wander by up to that much. `rnd` is injectable so a test can be repeatable. */
export function humanize(tr, items, timing, velocity, rnd) {
  const R = rnd || Math.random;
  items.forEach(it => {
    it[0] = r6(Math.max(0, it[0] + (R() * 2 - 1) * timing));
    setVel(tr, it, velOf(tr, it) + (R() * 2 - 1) * velocity);
  });
}
/* each note reaches right up to the next one on the same pitch family: no gaps, no overlaps */
export function legato(tr, items) {
  if (isDrum(tr)) return;
  const all = items.slice().sort((a, b) => a[0] - b[0]);
  all.forEach((it, i) => { const nx = all.slice(i + 1).find(n => n[0] > it[0] + EPS); if (nx) it[1] = Math.max(MIN_LEN, r6(nx[0] - it[0])); });
}
export function scaleVel(tr, items, factor) { items.forEach(it => setVel(tr, it, velOf(tr, it) * factor)); }
/* every item to the one velocity, or to a ramp from `a` to `b` along the selection in time */
export function ramp(tr, items, a, b) {
  if (!items.length) return;
  const s = items.slice().sort((x, y) => x[0] - y[0]), t0 = s[0][0], t1 = s[s.length - 1][0];
  s.forEach(it => setVel(tr, it, t1 > t0 ? a + (b - a) * (it[0] - t0) / (t1 - t0) : a));
}

/* ---- segments: a stretch of time, across the tracks -------------------------------------- */
export const songBeats = song => song.bars * song.beats;
/* the song grows to hold what is put in it, a bar at a time */
export function ensureBars(song, endBeat) {
  const need = Math.ceil(endBeat / song.beats - EPS);
  if (need > song.bars) song.bars = Math.min(512, need);
}
/* a copy of what starts in [a, b), in every track (or just track `only`) */
export function copyRange(song, a, b, only) {
  const tracks = [];
  song.tracks.forEach((tr, ix) => {
    if (only != null && ix !== only) return;
    const items = itemsOf(tr).filter(it => it[0] >= a - EPS && it[0] < b - EPS).map(it => {
      const c = it.slice(); c[0] = r6(it[0] - a);
      if (!isDrum(tr)) c[1] = Math.max(MIN_LEN, r6(Math.min(it[1], b - it[0])));   /* a note does not leave its segment */
      return c;
    });
    tracks.push({ ix, name: tr.name, drums: isDrum(tr), items });
  });
  return { kind: 'segment', len: r6(b - a), tracks, only: only == null ? null : only };
}
const shiftFrom = (song, from, d) => song.tracks.forEach(tr => itemsOf(tr).forEach(it => { if (it[0] >= from - EPS) it[0] = r6(it[0] + d); }));
export function insertGap(song, at, len) { shiftFrom(song, at, len); ensureBars(song, songBeats(song) + len); }
/* put a segment down at `at`: laid over what is there, or (insert) pushing it later. Tracks are matched by position,
   then by name; one that is a different kind of thing (drums for notes) is skipped and counted. */
export function pasteRange(song, clip, at, o) {
  o = o || {};
  if (!clip || clip.kind !== 'segment') return { skipped: 0, ok: false };
  if (o.insert) insertGap(song, at, clip.len);
  let skipped = 0;
  clip.tracks.forEach(ct => {
    let tr = o.into != null ? song.tracks[o.into] : (song.tracks[ct.ix] && isDrum(song.tracks[ct.ix]) === ct.drums ? song.tracks[ct.ix] : song.tracks.find(t => t.name === ct.name && isDrum(t) === ct.drums));
    if (!tr || isDrum(tr) !== ct.drums) { if (ct.items.length) skipped++; return; }
    const L = itemsOf(tr);
    ct.items.forEach(c => { const it = c.slice(); it[0] = r6(c[0] + at); L.push(it); });
    sortTrack(tr);
  });
  ensureBars(song, at + clip.len);
  return { skipped, ok: true };
}
/* take out what starts in [a, b) (and cut a note that runs into it short). With `close` everything after moves up to meet it. */
export function clearRange(song, a, b, only) {
  song.tracks.forEach((tr, ix) => {
    if (only != null && ix !== only) return;
    const L = itemsOf(tr);
    for (let i = L.length - 1; i >= 0; i--) {
      const it = L[i];
      if (it[0] >= a - EPS && it[0] < b - EPS) L.splice(i, 1);
      else if (!isDrum(tr) && it[0] < a - EPS && it[0] + it[1] > a + EPS) it[1] = Math.max(MIN_LEN, r6(a - it[0]));
    }
  });
}
export function deleteRange(song, a, b, close) {
  clearRange(song, a, b);
  if (close) song.tracks.forEach(tr => itemsOf(tr).forEach(it => { if (it[0] >= b - EPS) it[0] = r6(it[0] - (b - a)); }));
}
/* the segment again, n times straight after itself, the rest of the song moving up to make room */
export function repeatRange(song, a, b, n) {
  const clip = copyRange(song, a, b), len = b - a;
  shiftFrom(song, b, len * n);
  for (let i = 1; i <= n; i++) pasteRange(song, clip, a + len * i, {});
  ensureBars(song, songBeats(song) + len * n);
}
export function transposeRange(song, a, b, semis) {
  song.tracks.forEach(tr => { if (!isDrum(tr)) itemsOf(tr).forEach(it => { if (it[0] >= a - EPS && it[0] < b - EPS) it[2] = clamp(it[2] + semis, 0, 127); }); });
}
/* the last moment anything sounds, in beats */
export function lastBeat(song) {
  return song.tracks.reduce((m, tr) => Math.max(m, itemsOf(tr).reduce((x, it) => Math.max(x, endOf(tr, it, 0.25)), 0)), 0);
}
