/* The Garage's editing core, held to account: node apps/garage/edit_check.js */
import * as E from './edit.js';
import { makeHistory } from './model.js';
import * as Lang from '../../kernel/songtext.js';

let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const mk = () => Lang.buildSong({ title: 'T', bpm: 120, key: 'C', scale: 'major', bars: 4, tracks: [
  { name: 'LEAD', inst: 'piano', notes: 'C4:q E4 G4 C5 | D4:h F4:h | r:w | C4:w' },
  { name: 'KIT', drums: { kick: 'x...x...x...x...', hat: 'x.x.x.x.x.x.x.x.' } }] });

/* ---- notes */
{
  const s = mk(), tr = s.tracks[0], items = E.itemsOf(tr).slice(0, 2);
  const r = E.move(tr, items, -5, 0);
  ok(r.dBeats === 0 && items[0][0] === 0, 'a move cannot push notes off the front of the song');
  E.move(tr, items, 2, 3);
  ok(items[0][0] === 2 && items[0][2] === 63 && items[1][2] === 67, 'a move shifts time and pitch together');
  const top = E.itemsOf(tr)[0]; top[2] = 127;
  ok(E.move(tr, [top], 0, 5).dPitch === 0 && top[2] === 127, 'nor off the top of the keys');
  E.resize(tr, [items[0]], -9);
  ok(items[0][1] > 0 && items[0][1] < 0.1, 'a note cannot be shortened out of existence');
}
{
  const s = mk(), tr = s.tracks[0], all = E.itemsOf(tr), n0 = all.length;
  const sel = all.slice(0, 3), clip = E.copy(tr, sel);
  ok(clip.items[0][0] === 0 && clip.len === 3, 'a copy is kept relative to its first note');
  const put = E.paste(tr, clip, 20);
  ok(put.length === 3 && E.itemsOf(tr).length === n0 + 3 && put[0][0] === 20 && put[2][0] === 22, 'paste puts it down where it is told, and hands the new notes back');
  ok(E.paste(s.tracks[1], clip, 0) === null, 'notes do not paste into a drum track');
  const d = E.duplicate(tr, sel);
  ok(d[0][0] === 3 && d.length === 3, 'duplicate goes straight after the selection');
  E.remove(tr, d);
  ok(E.itemsOf(tr).length === n0 + 3, 'remove takes out exactly those');
}
{
  const s = mk(), tr = s.tracks[0], it = [[0.07, 0.9, 60, 0.7], [1.2, 0.9, 62, 0.7]]; tr.notes.push(...it);
  E.quantize(tr, it, 0.25, 1);
  ok(it[0][0] === 0 && it[1][0] === 1.25, 'quantize snaps starts to the grid');
  const w = [[0.1, 1, 60, 0.7]]; E.quantize(tr, w, 0.25, 0.5);
  ok(Math.abs(w[0][0] - 0.05) < 1e-9, 'quantize at half strength goes half way');
  const h = [[4, 1, 60, 0.5]]; let k = 0; E.humanize(tr, h, 0.1, 0.2, () => [0.75, 0.25][k++ % 2]);
  ok(h[0][0] > 4 && h[0][3] < 0.5, 'humanize moves timing and velocity (and a test can make it repeatable)');
  const l = [[0, 0.25, 60, 0.7], [1, 0.25, 62, 0.7], [2.5, 0.25, 64, 0.7]]; E.legato(tr, l);
  ok(l[0][1] === 1 && l[1][1] === 1.5 && l[2][1] === 0.25, 'legato reaches each note to the next, and leaves the last');
}
{
  const s = mk(), kit = s.tracks[1], hits = E.itemsOf(kit), n = hits.length;
  const h = hits.find(x => x[1] === 'kick');
  E.move(kit, [h], 0, -1);
  ok(h[1] === 'cowbell' ? false : h[1] !== 'kick', 'a drum hit moves along the kit');
  ok(E.pitchOf(kit, h) === E.rowOf(h[1]), 'its pitch is its row');
  E.move(kit, [h], 0, -99);
  ok(E.rowOf(h[1]) >= 0, 'and stays on the kit');
  ok(hits.length === n, 'nothing lost');
}

/* ---- segments */
{
  const s = mk(), A = JSON.parse(JSON.stringify(s));
  const clip = E.copyRange(s, 0, 4);
  ok(clip.len === 4 && clip.tracks.length === 2 && clip.tracks[0].items.length === 4, 'a segment copy takes every track');
  const r = E.pasteRange(s, clip, 8, {});
  ok(r.ok && s.bars >= 4 && E.itemsOf(s.tracks[0]).filter(i => i[0] >= 8 && i[0] < 12).length === 4, 'pasting a segment lays it down');
  ok(s.bars === 4, 'inside the song, the song does not grow');
  E.pasteRange(s, clip, 16, {});
  ok(s.bars === 5 && E.songBeats(s) === 20, 'past the end the song grows a bar at a time');
  const t = JSON.parse(JSON.stringify(A));
  E.pasteRange(t, E.copyRange(t, 0, 4), 4, { insert: true });
  const later = E.itemsOf(t.tracks[0]).filter(i => i[0] >= 8);
  ok(later.length === 3 && later[0][0] === 8 && t.bars === 5, 'insert pastes by pushing everything after it later');
  const u = JSON.parse(JSON.stringify(A));
  E.deleteRange(u, 4, 8, true);
  ok(E.itemsOf(u.tracks[0]).every(i => i[0] < 4 || i[0] >= 4) && !E.itemsOf(u.tracks[0]).some(i => i[0] >= 4 && i[0] < 5 && i[2] === 62), 'delete takes the segment out');
  const v = JSON.parse(JSON.stringify(A));
  const before = E.itemsOf(v.tracks[0]).find(i => i[0] === 12);
  E.deleteRange(v, 4, 8, true);
  ok(E.itemsOf(v.tracks[0]).some(i => i[0] === 8 && i[2] === before[2]), 'closing the gap moves what follows up to meet it');
  const w = JSON.parse(JSON.stringify(A));
  E.repeatRange(w, 0, 4, 2);
  ok(E.itemsOf(w.tracks[0]).filter(i => i[2] === 60 && i[0] % 4 === 0).length >= 4 && w.bars === 6, 'repeat lays the segment down again, twice, and grows the song');
  const x = JSON.parse(JSON.stringify(A));
  E.transposeRange(x, 0, 2, 12);
  ok(E.itemsOf(x.tracks[0]).filter(i => i[0] < 2).every(i => i[2] >= 72) && E.itemsOf(x.tracks[0]).filter(i => i[0] >= 2).some(i => i[2] < 72), 'transposing a segment leaves the rest alone');
  const y = JSON.parse(JSON.stringify(A)), n0 = E.itemsOf(y.tracks[1]).length;
  E.clearRange(y, 0, 2, 0);
  ok(E.itemsOf(y.tracks[1]).length === n0 && E.itemsOf(y.tracks[0]).filter(i => i[0] < 2).length === 0, 'clearing one track leaves the others');
  const z = JSON.parse(JSON.stringify(A));
  z.tracks[0].notes = [[3, 4, 60, 0.8]];
  const c2 = E.copyRange(z, 2, 4);
  ok(c2.tracks[0].items[0][1] === 1, 'a copied note is cut at the end of its segment');
  E.clearRange(z, 4, 6);
  ok(z.tracks[0].notes[0][1] === 1, 'and a note running into a cleared stretch is cut short');
  const one = E.copyRange(A, 0, 4, 0), q = JSON.parse(JSON.stringify(A));
  const rr = E.pasteRange(q, one, 4, { into: 0 });
  ok(rr.ok && E.itemsOf(q.tracks[1]).length === E.itemsOf(A.tracks[1]).length, 'a single-track segment goes into the track asked for and no other');
  const mism = E.pasteRange(q, E.copyRange(A, 0, 4, 1), 0, { into: 0 });
  ok(mism.skipped === 1, 'drums into a pitched track are skipped, and counted');
  ok(E.lastBeat(A) === 16, 'the last beat is where the music stops');
}

/* ---- history */
{
  const h = makeHistory(), s = mk();
  h.reset(s);
  const a = JSON.parse(JSON.stringify(s)); a.title = 'A'; h.push(a);
  const b = JSON.parse(JSON.stringify(s)); b.title = 'B'; h.push(b);
  ok(h.can() && !h.canRedo(), 'undo is there, redo is not, until something is undone');
  ok(h.undo().title === 'A' && h.canRedo(), 'undo goes back one');
  ok(h.redo().title === 'B', 'redo goes forward again');
  h.undo(); const c = JSON.parse(JSON.stringify(s)); c.title = 'C'; h.push(c);
  ok(!h.canRedo(), 'a new edit after an undo ends the redo trail');
  for (let i = 0; i < 200; i++) { const t = JSON.parse(JSON.stringify(s)); t.title = 'x' + i; h.push(t); }
  let n = 0; while (h.undo()) n++;
  ok(n === 79, 'undo is limited to eighty steps (' + n + ')');
}
console.log(bad ? bad + ' FAILED' : 'all good');
process.exit(bad ? 1 : 0);
