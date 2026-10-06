/* How the roll looks. One canvas holds the ruler, the notes and (at the bottom) the
   velocity lane, so they can never disagree about where a beat is. Everything is
   fillRect, in the machine's sixteen colours; the only text is the machine's own face. */
import { HEX, TRACK_COLORS, DRUM_ROWS, isRoot, isBlack } from './model.js';
import * as E from './edit.js';

export const GUT = 78, RULER = 22, VELH = 58, FONT = '15px VT323, monospace';

/* where everything is, for a song, a track and the way the roll is zoomed and scrolled */
export function layout(api, H, W, st) {
  const G = api.G, song = G.song, tr = song.tracks[G.sel], drum = !!tr && tr.inst === 'drums';
  const rows = drum ? DRUM_ROWS.map(r => r[0]) : (tr ? api.rowsFor(tr) : []);
  const rowH = Math.round((drum ? 26 : 16) * G.zoomY), top = RULER, bottom = H - VELH - 3;
  return { song, tr, drum, rows, rowH, top, bottom, velTop: bottom + 3, pxb: G.zoomX, beats: song.bars * song.beats,
    visRows: Math.max(1, Math.floor((bottom - top) / rowH)), visBeats: (W - GUT) / G.zoomX, W, H };
}
export const beatX = (v, b) => GUT + (b - v.scrollX) * v.pxb;
export const xBeat = (v, x) => (x - GUT) / v.pxb + v.scrollX;

export function drawRoll(g, api, v, st) {
  const G = api.G, { song, tr, W, H } = v, col = HEX[TRACK_COLORS[G.sel % TRACK_COLORS.length]];
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.font = FONT; g.textBaseline = 'middle';
  const bpb = song.beats, snapStep = st.step > 0 ? st.step : 0;
  /* ---- the ruler: bars and beats, then the segment and the loop on it */
  g.fillStyle = '#333'; g.fillRect(0, 0, W, RULER);
  g.fillStyle = '#555'; g.fillRect(0, RULER - 1, W, 1);
  const b0 = Math.max(0, Math.floor(v.scrollX)), b1 = Math.min(v.beats, Math.ceil(v.scrollX + v.visBeats));
  for (let b = b0; b <= b1; b++) {
    const x = Math.round(beatX(v, b)), bar = b % bpb === 0;
    if (x < GUT) continue;
    g.fillStyle = bar ? '#FFF' : '#888'; g.fillRect(x, bar ? 2 : 13, 1, bar ? RULER - 2 : RULER - 13);
    if (bar && (v.pxb * bpb > 34 || (b / bpb) % 4 === 0)) { g.fillStyle = '#FFFF55'; g.fillText(String(b / bpb + 1), x + 4, 8); }
  }
  if (G.loop) {
    const a = G.range ? G.range.a : 0, z = G.range ? G.range.b : v.beats;
    g.fillStyle = '#00AA00'; g.fillRect(Math.max(GUT, beatX(v, a)), RULER - 5, Math.max(2, Math.min(W, beatX(v, z)) - Math.max(GUT, beatX(v, a))), 4);
  }
  /* ---- the rows */
  const first = Math.floor(v.scrollY);
  for (let r = 0; r < v.visRows + 1; r++) {
    const idx = r + first;
    if (idx >= v.rows.length) break;
    const y = v.top + (idx - v.scrollY) * v.rowH, key = v.rows[idx];
    if (y + v.rowH < v.top || y > v.bottom) continue;
    const root = !v.drum && isRoot(api.lang, song, key), blk = !v.drum && isBlack(key);
    g.fillStyle = v.drum ? (idx % 2 ? '#111' : '#1a1a1a') : root ? '#1c2a4a' : blk ? '#0b0b0b' : '#151515';
    g.fillRect(GUT, y, W - GUT, v.rowH);
    /* the key in the gutter: white and black as on a piano; the roots of the key in the track's own colour */
    if (v.drum) { g.fillStyle = '#AAAAAA'; g.fillRect(0, y, GUT - 2, v.rowH - 1); g.fillStyle = '#000'; g.fillText(DRUM_ROWS[idx][1], 5, y + v.rowH / 2); }
    else {
      g.fillStyle = blk ? '#222' : '#DDD'; g.fillRect(0, y, GUT - 2, v.rowH - 1);
      if (root) { g.fillStyle = col; g.fillRect(GUT - 14, y, 12, v.rowH - 1); }
      if (key % 12 === 0 || root || v.rowH >= 20) { g.fillStyle = blk ? '#999' : '#000'; g.fillText(api.lang.midiToName(key), 5, y + v.rowH / 2); }
    }
    g.fillStyle = '#222'; g.fillRect(GUT, y + v.rowH - 1, W - GUT, 1);
  }
  /* ---- the grid in time: bar, beat, then whatever the snap is, if there is room for it */
  const steps = [[1, '#444'], [snapStep, '#2a2a2a']];
  g.fillStyle = '#262626';
  if (snapStep > 0 && snapStep < 1 && snapStep * v.pxb >= 5) for (let b = Math.floor(b0 / snapStep) * snapStep; b <= b1; b += snapStep) { const x = Math.round(beatX(v, b)); if (x >= GUT) g.fillRect(x, v.top, 1, v.bottom - v.top); }
  for (let b = b0; b <= b1; b++) { const x = Math.round(beatX(v, b)); if (x < GUT) continue; g.fillStyle = b % bpb === 0 ? '#777' : '#3a3a3a'; g.fillRect(x, v.top, 1, v.bottom - v.top); }
  void steps;
  if (v.beats * v.pxb + GUT < W) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(Math.round(beatX(v, v.beats)), v.top, W, v.bottom - v.top); }
  /* ---- the segment, behind the notes */
  if (G.range) {
    const x0 = Math.max(GUT, beatX(v, G.range.a)), x1 = Math.min(W, beatX(v, G.range.b));
    if (x1 > x0) { g.fillStyle = 'rgba(85,255,255,0.13)'; g.fillRect(x0, 0, x1 - x0, H); g.fillStyle = '#55FFFF'; g.fillRect(x0, 0, 2, RULER); g.fillRect(x1 - 2, 0, 2, RULER); g.fillRect(x0, RULER - 3, x1 - x0, 3); }
  }
  /* ---- the other tracks, faintly, so you can see what you are playing with */
  const step = st.step;
  if (!v.drum) song.tracks.forEach((t, ti) => {
    if (ti === G.sel || t.mute || t.inst === 'drums') return;
    g.fillStyle = HEX[TRACK_COLORS[ti % TRACK_COLORS.length]]; g.globalAlpha = 0.26;
    E.itemsOf(t).forEach(n => {
      const r = v.rows.indexOf(n[2]);
      if (r < 0 || n[0] > v.scrollX + v.visBeats || n[0] + n[1] < v.scrollX) return;
      const y = v.top + (r - v.scrollY) * v.rowH;
      if (y < v.top - v.rowH || y > v.bottom) return;
      g.fillRect(beatX(v, n[0]), y + 3, Math.max(2, n[1] * v.pxb - 1), v.rowH - 6);
    });
    g.globalAlpha = 1;
  });
  /* ---- this track's own */
  if (tr) {
    const sel = G.items;
    E.itemsOf(tr).forEach(it => {
      const p = E.pitchOf(tr, it), r = v.drum ? p : v.rows.indexOf(p);
      if (r < 0 || it[0] > v.scrollX + v.visBeats) return;
      const w = Math.max(v.drum ? 9 : 3, E.lenOf(tr, it, step) * v.pxb - 1);
      const x = Math.round(beatX(v, it[0])), y = Math.round(v.top + (r - v.scrollY) * v.rowH);
      if (x + w < GUT || y < v.top - v.rowH || y > v.bottom) return;
      const on = sel.has(it), vel = E.velOf(tr, it);
      const h = v.rowH - (v.drum ? 5 : 3), yy = y + (v.drum ? 3 : 1);
      g.fillStyle = on ? '#FFFFFF' : col; g.globalAlpha = 0.45 + vel * 0.55; g.fillRect(x, yy, w, h); g.globalAlpha = 1;
      g.fillStyle = on ? col : '#FFF'; g.fillRect(x, yy, w, 2); g.fillRect(x, yy, 2, h);
      if (on) { g.fillStyle = '#FFFF55'; g.fillRect(x + w - 3, yy, 3, h); }
      if (!v.drum && w > 30 && v.rowH >= 14) { g.fillStyle = on ? '#000' : '#000'; g.fillText(api.lang.midiToName(p), x + 5, yy + h / 2); }
    });
  }
  /* ---- the marquee being dragged out, and the hover cell */
  if (st.marquee) { const m = st.marquee; g.strokeStyle = '#55FFFF'; g.lineWidth = 1; g.fillStyle = 'rgba(85,255,255,0.12)'; g.fillRect(m.x0, m.y0, m.x1 - m.x0, m.y1 - m.y0); g.strokeRect(Math.round(m.x0) + 0.5, Math.round(m.y0) + 0.5, m.x1 - m.x0, m.y1 - m.y0); }
  else if (st.hover && G.tool === 'draw') { g.strokeStyle = '#FFFF55'; g.lineWidth = 1; g.strokeRect(st.hover.x + 0.5, st.hover.y + 0.5, st.hover.w, st.hover.h); }
  /* ---- the velocity lane */
  g.fillStyle = '#0a0a14'; g.fillRect(0, v.velTop, W, VELH);
  g.fillStyle = '#555'; g.fillRect(0, v.velTop - 1, W, 1);
  g.fillStyle = '#888'; g.fillText('VELOCITY', 5, v.velTop + 9);
  g.fillStyle = '#333'; g.fillRect(GUT, v.velTop + VELH / 2, W - GUT, 1);
  if (tr) E.itemsOf(tr).forEach(it => {
    const x = Math.round(beatX(v, it[0]));
    if (x < GUT || x > W) return;
    const vel = E.velOf(tr, it), h = Math.round((VELH - 8) * vel), on = G.items.has(it);
    g.fillStyle = on ? '#FFFFFF' : col; g.fillRect(x, v.velTop + VELH - 3 - h, 4, h);
    g.fillStyle = on ? '#FFFF55' : '#FFF'; g.fillRect(x - 1, v.velTop + VELH - 4 - h, 6, 3);
  });
  /* ---- the cursor, and the playhead */
  const cx = beatX(v, G.cursor);
  if (cx >= GUT && cx <= W) { g.fillStyle = '#FFFF55'; for (let y = RULER; y < v.bottom; y += 6) g.fillRect(Math.round(cx), y, 1, 3); g.fillRect(Math.round(cx) - 3, RULER - 6, 7, 3); g.fillRect(Math.round(cx) - 1, RULER - 3, 3, 3); }
  if (st.head >= 0) { const x = beatX(v, st.head); if (x >= GUT && x < W) { g.fillStyle = '#FFFFFF'; g.fillRect(Math.round(x), 0, 2, H); } }
  if (v.beats > v.visBeats || v.rows.length > v.visRows) { g.fillStyle = '#888'; g.fillText('WHEEL: UP/DOWN   SHIFT+WHEEL: SIDEWAYS   CTRL+WHEEL: ZOOM', GUT + 8, v.bottom - 9); }
}

/* the whole song, small, with the part in view outlined: click or drag it to go there */
export function drawOverview(g, api, v, W, H, head) {
  const G = api.G, song = G.song;
  g.fillStyle = '#080808'; g.fillRect(0, 0, W, H);
  const total = v.beats, k = (W - GUT - 6) / Math.max(1, total);
  g.fillStyle = '#888'; g.font = FONT; g.textBaseline = 'middle'; g.fillText('SONG', 5, H / 2);
  for (let b = 0; b <= total; b += song.beats) { g.fillStyle = b % (song.beats * 4) === 0 ? '#444' : '#222'; g.fillRect(GUT + b * k, 0, 1, H); }
  song.tracks.forEach((t, ti) => {
    if (t.mute) return;
    g.fillStyle = HEX[TRACK_COLORS[ti % TRACK_COLORS.length]]; g.globalAlpha = ti === G.sel ? 1 : 0.55;
    const items = E.itemsOf(t), drum = t.inst === 'drums';
    for (let i = 0; i < items.length; i++) {
      const it = items[i], y = drum ? 3 + ((DRUM_ROWS.findIndex(d => d[0] === it[1])) % 14) * (H - 6) / 14 : H - 4 - ((it[2] - 24) / 84) * (H - 8);
      g.fillRect(GUT + it[0] * k, Math.max(1, Math.min(H - 3, y)), Math.max(1, (drum ? 0.25 : it[1]) * k), 2);
    }
    g.globalAlpha = 1;
  });
  if (G.range) { g.fillStyle = 'rgba(85,255,255,0.3)'; g.fillRect(GUT + G.range.a * k, 0, (G.range.b - G.range.a) * k, H); }
  g.strokeStyle = '#FFFF55'; g.lineWidth = 1;
  g.strokeRect(Math.round(GUT + v.scrollX * k) + 0.5, 0.5, Math.max(4, Math.min(total, v.visBeats) * k), H - 1);
  if (head >= 0) { g.fillStyle = '#FFF'; g.fillRect(Math.round(GUT + head * k), 0, 2, H); }
  return k;
}
