/* The note grid: a piano roll for the tracks that play notes, a row of drum
   pads for the kit. Every cell is a sixteenth of a bar. Tap an empty cell to
   put a note there, drag sideways to make it longer, tap a note to take it
   away. With MAGIC NOTES on, the only rows are notes of the song's key, so
   there is no wrong cell to tap. */
import { HEX, TRACK_COLORS, DRUM_ROWS, rowsFor, isRoot, noteAt, hitAt, sortTrack } from './model.js';

const GUT = 70, RULER = 18, STEP = 0.25;

export function makeGrid(host, api) {
  const cv = document.createElement('canvas');
  cv.className = 'g-grid';
  host.appendChild(cv);
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  let W = 0, H = 0, dirty = true, head = -1, scrollX = 0, scrollY = 0, drag = null, hover = null;
  const view = () => {
    const G = api.G, song = G.song, tr = song.tracks[G.sel];
    const steps = song.bars * song.beats * 4;
    const drum = tr && tr.inst === 'drums';
    const rows = drum ? DRUM_ROWS.map(r => r[0]) : (tr ? rowsFor(api.lang, song, tr.lo, tr.lo + 36, G.magic) : []);
    const rowH = Math.max(drum ? 20 : 12, Math.min(drum ? 40 : 44, Math.floor((H - RULER) / Math.max(1, rows.length))));
    const cellW = Math.max(8, Math.floor((W - GUT) / steps));
    const vis = Math.floor((W - GUT) / cellW);
    return { song, tr, steps, drum, rows, rowH, cellW, vis, visRows: Math.floor((H - RULER) / rowH) };
  };

  function draw() {
    const v = view();
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (!v.tr) return;
    scrollX = Math.max(0, Math.min(scrollX, Math.max(0, v.steps - v.vis)));
    scrollY = Math.max(0, Math.min(scrollY, Math.max(0, v.rows.length - v.visRows)));
    const col = HEX[TRACK_COLORS[api.G.sel % TRACK_COLORS.length]];
    const x0 = GUT, y0 = RULER;
    /* the ruler: bar numbers, beat ticks */
    g.fillStyle = '#555'; g.fillRect(0, 0, W, RULER);
    g.font = '14px VT323, monospace'; g.textBaseline = 'middle';
    for (let s = scrollX; s < Math.min(v.steps, scrollX + v.vis + 1); s++) {
      const x = x0 + (s - scrollX) * v.cellW;
      if (s % 4 === 0) { g.fillStyle = s % (v.song.beats * 4) === 0 ? '#FFF' : '#AAA'; g.fillRect(x, s % (v.song.beats * 4) === 0 ? 2 : 10, 1, RULER); }
      if (s % (v.song.beats * 4) === 0) { g.fillStyle = '#FFFF55'; g.fillText(String(s / (v.song.beats * 4) + 1), x + 4, 8); }
    }
    for (let r = 0; r < v.visRows; r++) {
      const idx = r + scrollY;
      if (idx >= v.rows.length) break;
      const y = y0 + r * v.rowH, key = v.rows[idx];
      const root = !v.drum && isRoot(api.lang, v.song, key);
      g.fillStyle = v.drum ? (r % 2 ? '#111' : '#1a1a1a') : root ? '#1c2a4a' : (r % 2 ? '#0c0c0c' : '#151515');
      g.fillRect(x0, y, W - x0, v.rowH);
      /* the label gutter: a key, coloured by the track on the roots */
      g.fillStyle = root ? col : (v.drum ? '#AAAAAA' : '#555');
      g.fillRect(0, y, GUT - 2, v.rowH - 1);
      g.fillStyle = root ? '#000' : (v.drum ? '#000' : '#FFF');
      g.fillText(v.drum ? DRUM_ROWS.find(d => d[0] === key)[1] : api.lang.midiToName(key), 6, y + v.rowH / 2);
      for (let s = scrollX; s < Math.min(v.steps, scrollX + v.vis); s++) {
        const x = x0 + (s - scrollX) * v.cellW;
        g.fillStyle = s % (v.song.beats * 4) === 0 ? '#777' : s % 4 === 0 ? '#444' : '#262626';
        g.fillRect(x, y, 1, v.rowH);
      }
      g.fillStyle = '#222'; g.fillRect(x0, y + v.rowH - 1, W - x0, 1);
    }
    /* the other tracks, faintly, so you can see what you are playing with */
    v.song.tracks.forEach((t, ti) => {
      if (ti === api.G.sel || t.mute || t.inst === 'drums' || v.drum) return;
      g.globalAlpha = 0.28; g.fillStyle = HEX[TRACK_COLORS[ti % TRACK_COLORS.length]];
      t.notes.forEach(n => {
        const r = v.rows.indexOf(n[2]) - scrollY;
        if (r < 0 || r >= v.visRows) return;
        g.fillRect(x0 + (n[0] * 4 - scrollX) * v.cellW, y0 + r * v.rowH + 2, Math.max(2, n[1] * 4 * v.cellW - 1), v.rowH - 4);
      });
      g.globalAlpha = 1;
    });
    /* this track's notes */
    g.fillStyle = col;
    if (v.drum) (v.tr.hits || []).forEach(h => {
      const r = v.rows.indexOf(h[1]) - scrollY;
      if (r < 0 || r >= v.visRows) return;
      const x = x0 + (h[0] * 4 - scrollX) * v.cellW;
      g.fillStyle = col; g.fillRect(x + 1, y0 + r * v.rowH + 2, v.cellW - 2, v.rowH - 4);
      g.fillStyle = '#FFF'; g.fillRect(x + 1, y0 + r * v.rowH + 2, v.cellW - 2, 2);
    });
    else v.tr.notes.forEach(n => {
      const r = v.rows.indexOf(n[2]) - scrollY;
      if (r < 0 || r >= v.visRows) return;
      const x = x0 + (n[0] * 4 - scrollX) * v.cellW, w = Math.max(v.cellW - 1, n[1] * 4 * v.cellW - 1);
      g.fillStyle = col; g.fillRect(x, y0 + r * v.rowH + 1, w, v.rowH - 3);
      g.fillStyle = '#FFF'; g.fillRect(x, y0 + r * v.rowH + 1, w, 2); g.fillRect(x, y0 + r * v.rowH + 1, 2, v.rowH - 3);
    });
    if (hover && hover.r >= 0 && hover.r < v.visRows) {
      g.strokeStyle = '#FFFF55'; g.lineWidth = 1;
      g.strokeRect(x0 + (hover.s - scrollX) * v.cellW + 0.5, y0 + hover.r * v.rowH + 0.5, v.cellW - 1, v.rowH - 2);
    }
    /* the playhead */
    if (head >= 0) {
      const x = x0 + (head * 4 - scrollX) * v.cellW;
      if (x >= x0 && x < W) { g.fillStyle = '#FFFFFF'; g.fillRect(Math.round(x), 0, 2, H); }
    }
    if (v.steps > v.vis || v.rows.length > v.visRows) { g.fillStyle = '#FFFF55'; g.fillText('SCROLL: MOUSE WHEEL (SHIFT = SIDEWAYS)', GUT + 8, H - 8); }
  }

  const cell = ev => {
    const r = cv.getBoundingClientRect(), v = view();
    const x = (ev.clientX - r.left) * (cv.width / r.width), y = (ev.clientY - r.top) * (cv.height / r.height);
    const row = Math.floor((y - RULER) / v.rowH), s = Math.floor((x - GUT) / v.cellW) + scrollX;
    return { v, x, y, row, s, key: v.rows[row + scrollY], r: row };
  };
  const inGrid = c => c.row >= 0 && c.row < c.v.visRows && c.key != null && c.s >= 0 && c.s < c.v.steps && c.x >= GUT;
  const prev = (tr, key) => api.studio.tap(tr.inst, key, 0.5, 0.85, { vol: tr.vol, pan: tr.pan, reverb: tr.reverb });

  cv.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const c = cell(ev), tr = c.v.tr;
    if (!tr) return;
    if (c.x < GUT && c.row >= 0 && c.key != null) { prev(tr, c.key); return; }          /* the label: hear that note */
    if (!inGrid(c)) return;
    const start = c.s * STEP;
    cv.setPointerCapture(ev.pointerId);
    if (c.v.drum) {
      const i = hitAt(tr, start, c.key);
      drag = { drum: true, on: i < 0, key: c.key };
      if (i >= 0) tr.hits.splice(i, 1); else { tr.hits = tr.hits || []; tr.hits.push([start, c.key, 0.85]); prev(tr, c.key); }
    } else {
      const i = noteAt(tr, start, c.key);
      if (i >= 0) { tr.notes.splice(i, 1); drag = { erase: true }; }
      else {
        const note = [start, Math.max(STEP, api.G.noteLen), c.key, 0.85];
        tr.notes.push(note); prev(tr, c.key);
        drag = { note, start: c.s };
      }
    }
    sortTrack(tr);
    api.changed('edit');
    dirty = true;
  });
  cv.addEventListener('pointermove', ev => {
    const c = cell(ev);
    const was = hover;
    hover = inGrid(c) ? { r: c.row, s: c.s } : null;
    if (JSON.stringify(was) !== JSON.stringify(hover)) dirty = true;
    if (!drag || !c.v.tr) return;
    if (drag.note) {
      const len = Math.max(api.G.noteLen, (c.s - drag.start + 1) * STEP);
      if (len !== drag.note[1]) { drag.note[1] = len; dirty = true; api.changed('drag'); }
    } else if (drag.drum && inGrid(c) && c.key === drag.key) {
      const i = hitAt(c.v.tr, c.s * STEP, c.key);
      if (drag.on && i < 0) { c.v.tr.hits.push([c.s * STEP, c.key, 0.85]); sortTrack(c.v.tr); dirty = true; api.changed('drag'); }
      if (!drag.on && i >= 0) { c.v.tr.hits.splice(i, 1); dirty = true; api.changed('drag'); }
    }
  });
  const end = () => { if (drag) { drag = null; api.changed('edit'); } };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { hover = null; dirty = true; });
  cv.addEventListener('wheel', ev => {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) return;
    if (ev.shiftKey) scrollX += ev.deltaY > 0 ? 4 : -4; else scrollY += ev.deltaY > 0 ? 1 : -1;
    dirty = true;
  }, { passive: false });

  const size = () => {
    const w = Math.max(200, Math.floor(host.clientWidth)), h = Math.max(120, Math.floor(host.clientHeight));
    if (w !== W || h !== H) { W = cv.width = w; H = cv.height = h; g.imageSmoothingEnabled = false; dirty = true; }
  };
  const ro = new ResizeObserver(size);
  ro.observe(host);
  size();
  let raf = 0, alive = true;
  const loop = () => { if (!alive) return; raf = requestAnimationFrame(loop); if (dirty) { dirty = false; draw(); } };
  loop();
  return {
    redraw() { dirty = true; },
    setHead(b) { if (b !== head) { head = b; dirty = true; } },
    /* keep the playhead in view while it moves */
    follow(b) { const v = view(); const s = b * 4; if (s < scrollX || s >= scrollX + v.vis) { scrollX = Math.floor(s / v.vis) * v.vis; } },
    resetScroll() { scrollX = scrollY = 0; dirty = true; },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); }
  };
}
