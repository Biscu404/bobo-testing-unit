/* What the buttons and the keys do to a song. Each action says what it did, in words, so
   nothing happens silently, and every one of them can be taken back with undo. What is
   acted on is always the same, nearest first: the notes you have selected; else the stretch
   of song picked on the ruler (every track, or just this one); else, for the edits that can
   sensibly be, the whole track. */
import * as E from './edit.js';

/* what was last copied, kept for as long as the machine is on, so it can be carried to another song */
export const CLIP = { data: null };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 'S');
const pitched = tr => tr.inst !== 'drums';

export function makeActions(api) {
  const G = api.G, say = t => api.toast(t);
  const tr = () => G.song.tracks[G.sel];
  const sel = () => [...G.items].filter(it => E.itemsOf(tr()).indexOf(it) >= 0);
  const only = () => G.segOnly ? G.sel : null;
  const bars = r => { const b = G.song.beats; const a = Math.floor(r.a / b) + 1, z = Math.ceil(r.b / b); return a === z ? 'BAR ' + a : 'BARS ' + a + '-' + z; };
  const NONE = 'NOTHING PICKED. DRAG A BOX ROUND SOME NOTES, OR DRAG ALONG THE RULER TO PICK A STRETCH OF THE SONG.';
  /* what an edit applies to: [[track, items], ...] and a few words saying so */
  const targets = () => {
    if (G.items.size) return { list: [[tr(), sel()]], what: plural(sel().length, 'NOTE') };
    if (G.range) return { list: G.song.tracks.map((t, i) => (only() == null || i === only()) ? [t, E.itemsOf(t).filter(it => it[0] >= G.range.a - 1e-6 && it[0] < G.range.b - 1e-6)] : [t, []]), what: bars(G.range) };
    return { list: [[tr(), E.itemsOf(tr()).slice()]], what: 'THE WHOLE TRACK' };
  };
  const total = t => t.list.reduce((n, x) => n + x[1].length, 0);
  const A = {
    selectAll() { G.items = new Set(E.itemsOf(tr())); api.changed('sel'); say('SELECTED ' + plural(G.items.size, 'NOTE') + ' IN THIS TRACK.'); },
    clearPick() { if (G.items.size) { G.items.clear(); api.changed('sel'); } else if (G.range) api.setRange(null); },

    copy() {
      if (G.items.size) { CLIP.data = E.copy(tr(), sel()); say('COPIED ' + plural(sel().length, 'NOTE') + '. CTRL+V PUTS THEM DOWN AT THE CURSOR.'); }
      else if (G.range) { CLIP.data = E.copyRange(G.song, G.range.a, G.range.b, only()); say('COPIED ' + bars(G.range) + (only() == null ? ' (ALL TRACKS)' : ' (THIS TRACK)') + '.'); }
      else say(NONE);
      api.changed('clip');
    },
    cut() {
      if (!G.items.size && !G.range) { say(NONE); return; }
      A.copy();
      if (G.items.size) { E.remove(tr(), sel()); G.items.clear(); } else E.clearRange(G.song, G.range.a, G.range.b, only());
      api.changed('edit');
    },
    paste(insert) {
      const c = CLIP.data;
      if (!c) { say('NOTHING TO PASTE. COPY SOMETHING FIRST (CTRL+C).'); return; }
      if (c.kind === 'notes') {
        const made = E.paste(tr(), c, G.cursor);
        if (!made) { say(c.drums ? 'THOSE ARE DRUM HITS: PASTE THEM INTO A DRUM TRACK.' : 'THOSE ARE NOTES: PASTE THEM INTO A TRACK THAT PLAYS NOTES.'); return; }
        E.ensureBars(G.song, E.lastBeat(G.song));
        G.items = new Set(made); G.range = null;
        api.setCursor(G.cursor + c.len);
        say('PASTED ' + plural(made.length, 'NOTE') + '. THEY ARE SELECTED: DRAG, NUDGE WITH THE ARROWS, OR CTRL+Z.');
      } else {
        const into = c.only == null ? null : G.sel, at = G.cursor;
        const r = E.pasteRange(G.song, c, at, { insert: !!insert, into });
        G.items.clear();
        api.setRange(at, at + c.len);
        api.setCursor(at + c.len);
        say('PASTED ' + (insert ? 'AND MADE ROOM' : 'OVER WHAT WAS THERE') + (r.skipped ? ' (' + plural(r.skipped, 'TRACK') + ' SKIPPED: NO MATCH)' : '') + '.');
      }
      api.changed('edit');
    },
    duplicate() {
      if (G.items.size) { const made = E.duplicate(tr(), sel()); E.ensureBars(G.song, E.lastBeat(G.song)); G.items = new Set(made); say('DUPLICATED ' + plural(made.length, 'NOTE') + ' STRAIGHT AFTER THEMSELVES.'); }
      else if (G.range) { const len = G.range.b - G.range.a; E.repeatRange(G.song, G.range.a, G.range.b, 1); api.setRange(G.range.b, G.range.b + len); say(bars(G.range) + ' COPIED, THE REST OF THE SONG MOVED UP.'); }
      else { say(NONE); return; }
      api.changed('edit');
    },
    del(close) {
      if (G.items.size) { const n = sel().length; E.remove(tr(), sel()); G.items.clear(); say('DELETED ' + plural(n, 'NOTE') + '.'); }
      else if (G.range) { const r = G.range; if (close) { E.deleteRange(G.song, r.a, r.b, true); say(bars(r) + ' REMOVED AND THE GAP CLOSED.'); api.setRange(null); } else { E.clearRange(G.song, r.a, r.b, only()); say(bars(r) + ' CLEARED' + (only() == null ? ' IN EVERY TRACK' : ' IN THIS TRACK') + '.'); } }
      else { say(NONE); return; }
      api.changed('edit');
    },
    nudge(steps) {
      if (!G.items.size) { say('SELECT SOME NOTES FIRST, THEN THE ARROWS MOVE THEM.'); return; }
      const st = api.snapStep() || 0.25;
      E.move(tr(), sel(), steps * st, 0); api.changed('edit');
    },
    transpose(semis) {
      const t = targets();
      if (!total(t)) { say('NOTHING TO TRANSPOSE.'); return; }
      if (!G.items.size && G.range && only() == null) E.transposeRange(G.song, G.range.a, G.range.b, semis);
      else t.list.forEach(([tk, items]) => { if (pitched(tk) || !G.items.size) E.move(tk, items.filter(it => pitched(tk)), 0, semis); });
      say('TRANSPOSED ' + t.what + ' ' + (semis > 0 ? 'UP ' : 'DOWN ') + (Math.abs(semis) === 12 ? 'AN OCTAVE' : plural(Math.abs(semis), 'SEMITONE')) + '.');
      api.changed('edit');
    },
    quantize(strength, lengths) {
      const st = api.snapStep(), t = targets();
      if (!(st > 0)) { say('QUANTIZE NEEDS A GRID: SET SNAP TO SOMETHING OTHER THAN OFF.'); return; }
      t.list.forEach(([tk, items]) => E.quantize(tk, items, st, strength, lengths));
      t.list.forEach(([tk]) => E.sortTrack(tk));
      say('QUANTIZED ' + t.what + ' TO THE GRID (' + (strength < 1 ? Math.round(strength * 100) + '%' : 'FULL') + ').');
      api.changed('edit');
    },
    humanize() { const t = targets(); t.list.forEach(([tk, items]) => E.humanize(tk, items, 0.03, 0.12)); say('HUMANIZED ' + t.what + ': A LITTLE LOOSER IN TIME AND TOUCH.'); api.changed('edit'); },
    legato() { const t = targets(); t.list.forEach(([tk, items]) => E.legato(tk, items)); say('LEGATO ON ' + t.what + ': EACH NOTE REACHES THE NEXT.'); api.changed('edit'); },
    stretch(dir) {
      if (!G.items.size) { say('SELECT SOME NOTES FIRST.'); return; }
      const st = api.snapStep() || 0.25; E.resize(tr(), sel(), dir * st); api.changed('edit');
    },
    velocity(factor) { const t = targets(); t.list.forEach(([tk, items]) => E.scaleVel(tk, items, factor)); say((factor > 1 ? 'HARDER' : 'SOFTER') + ' ON ' + t.what + '.'); api.changed('edit'); },
    fade(a, b) { const t = G.items.size ? targets() : null; if (!t) { say('SELECT SOME NOTES FIRST: THE RAMP RUNS ALONG THEM.'); return; } E.ramp(tr(), sel(), a, b); say(a < b ? 'VELOCITY RAMP UP.' : 'VELOCITY RAMP DOWN.'); api.changed('edit'); },

    /* ---- the stretch of song picked on the ruler */
    gap() { if (!G.range) { say(NONE); return; } const len = G.range.b - G.range.a; E.insertGap(G.song, G.range.a, len); say('INSERTED ' + bars(G.range) + ' OF SILENCE. EVERYTHING AFTER MOVED LATER.'); api.changed('edit'); },
    repeat(n) { if (!G.range) { say(NONE); return; } const r = G.range, len = r.b - r.a; E.repeatRange(G.song, r.a, r.b, n); api.setRange(r.a, r.b + len * n); say(bars(r) + ' REPEATED ' + n + ' MORE TIME' + (n === 1 ? '' : 'S') + '.'); api.changed('edit'); },
    loopRange() { if (!G.range) { say('PICK A STRETCH ON THE RULER FIRST, THEN LOOP IT.'); return; } G.loop = true; api.setLoop(true); say('LOOPING ' + bars(G.range) + '.'); },
    wholeSong() { api.setRange(0, G.song.bars * G.song.beats); },
    trim() { const end = E.lastBeat(G.song), n = Math.max(1, Math.ceil(end / G.song.beats - 1e-6)); if (n < G.song.bars) { G.song.bars = n; say('SONG TRIMMED TO ' + plural(n, 'BAR') + '.'); api.changed('edit'); } else say('THE SONG ALREADY ENDS WHERE THE MUSIC DOES.'); }
  };
  return A;
}
