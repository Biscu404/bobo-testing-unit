/* The roll: where notes are put, moved, stretched, selected and taken away.

   Three tools. DRAW puts a note where you click and lets you drag it longer; clicking a
   note you already have selects it instead, and dragging it moves it, so nothing is
   ever deleted by accident (on the drum kit DRAW is a step sequencer: click a cell to
   switch it on or off). SELECT drags a box. ERASE sweeps notes away. In every tool
   the right button erases, Shift adds to the selection, and Ctrl while you start a drag
   copies instead of moves. The ruler selects a stretch of time (a SEGMENT) for every
   track at once; the strip at the bottom edits how hard each note is hit. */
import { GUT, RULER, VELH, layout, beatX, xBeat, drawRoll, drawOverview } from './grid_draw.js';
import { snapTo } from './model.js';
import * as E from './edit.js';

const OVH = 30;

export function makeGrid(host, ovHost, api) {
  const cv = document.createElement('canvas'), ov = document.createElement('canvas');
  cv.className = 'g-grid'; ov.className = 'g-ov';
  host.appendChild(cv); ovHost.appendChild(ov);
  const g = cv.getContext('2d'), og = ov.getContext('2d');
  const G = api.G;
  let W = 0, H = 0, OW = 0, scrollX = 0, scrollY = 0, dirty = true, head = -1, drag = null, hover = null, marquee = null, ovK = 1, alive = true, raf = 0;
  const step = () => api.snapStep();
  const V = () => {
    const v = layout(api, H, W);
    v.scrollX = Math.max(0, Math.min(scrollX, Math.max(0, v.beats - v.visBeats + 2)));
    v.scrollY = Math.max(0, Math.min(scrollY, Math.max(0, v.rows.length - v.visRows)));
    scrollX = v.scrollX; scrollY = v.scrollY;
    return v;
  };
  const P = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; };
  const zoneOf = (p, v) => p.y < RULER ? 'ruler' : p.y >= v.velTop ? (p.x < GUT ? 'gutter' : 'vel') : p.x < GUT ? 'gutter' : 'roll';
  const rowAt = (p, v) => Math.floor((p.y - v.top) / v.rowH + v.scrollY);
  const pitchOfRow = (r, v) => v.drum ? (r >= 0 && r < v.rows.length ? r : null) : (v.rows[r] == null ? null : v.rows[r]);
  const tol = v => Math.max(step() || 0.25, 9 / v.pxb);
  const itemAtP = (p, v) => { const pi = pitchOfRow(rowAt(p, v), v); return pi == null || !v.tr ? null : E.itemAt(v.tr, xBeat(v, p.x), pi, v.drum ? tol(v) : 0); };
  const onEdge = (it, p, v) => !v.drum && Math.abs(p.x - beatX(v, it[0] + it[1])) <= 7 && it[1] * v.pxb > 14;
  const done = kind => { dirty = true; api.changed(kind); };
  const velAt = (y, v) => Math.max(0.04, Math.min(1, 1 - (y - (v.velTop + 4)) / (VELH - 8)));

  /* ---- what a press does ------------------------------------------------------------------ */
  cv.addEventListener('pointerdown', ev => {
    const p = P(ev), v = V(), z = zoneOf(p, v), right = ev.button === 2;
    if (ev.button !== 0 && !right) return;
    api.focus();
    cv.setPointerCapture(ev.pointerId);
    const b = xBeat(v, p.x);
    if (z === 'ruler') {
      const s = step() > 0 ? Math.min(step(), 1) : 0;
      if (G.range && Math.abs(p.x - beatX(v, G.range.a)) < 6) drag = { k: 'edge', side: 'a' };
      else if (G.range && Math.abs(p.x - beatX(v, G.range.b)) < 6) drag = { k: 'edge', side: 'b' };
      else drag = { k: 'range', a0: Math.max(0, snapTo(b, s)), x0: p.x, moved: false };
      return;
    }
    if (z === 'gutter') { if (!v.tr) return; const pi = pitchOfRow(rowAt(p, v), v); if (pi != null) api.audition(v.tr, v.drum ? v.rows[pi] : pi); return; }
    if (!v.tr) return;
    if (z === 'vel') {
      const items = E.itemsOf(v.tr);
      let it = null, best = 8;
      items.forEach(i => { const d = Math.abs(beatX(v, i[0]) + 2 - p.x); if (d < best) { best = d; it = i; } });
      if (!it) return;
      const multi = G.items.has(it) && G.items.size > 1;
      drag = { k: 'vel', it, multi, orig: new Map(items.map(i => [i, E.velOf(v.tr, i)])), lx: p.x, ly: p.y };
      applyVel(p, v);
      return;
    }
    const it = itemAtP(p, v), pi = pitchOfRow(rowAt(p, v), v);
    if (right || G.tool === 'erase') {
      drag = { k: 'erase' };
      if (it) { G.items.delete(it); E.remove(v.tr, [it]); done('drag'); }
      return;
    }
    if (it) {
      if (G.tool === 'draw' && v.drum && !ev.shiftKey && !G.items.has(it)) {                    /* the step sequencer: a hit that is there goes */
        E.remove(v.tr, [it]); drag = { k: 'steps', on: false, row: pi }; done('drag'); return;
      }
      if (ev.shiftKey) { if (G.items.has(it)) G.items.delete(it); else G.items.add(it); api.changed('sel'); drag = null; return; }
      if (!G.items.has(it)) { G.items.clear(); G.items.add(it); api.changed('sel'); }
      const sel = [...G.items];
      drag = { k: onEdge(it, p, v) ? 'resize' : 'move', it, sel, orig: sel.map(i => i.slice()), b0: b, a0: it[0], p0: pitchOfRow(rowAt(p, v), v), ap: E.pitchOf(v.tr, it), end0: it[0] + (v.drum ? 0 : it[1]),
        copy: (ev.ctrlKey || ev.metaKey) && !onEdge(it, p, v), moved: false };
      if (!v.drum) api.audition(v.tr, it[2]);
      return;
    }
    if (G.tool === 'draw' && pi != null) {
      const st = step(), start = Math.max(0, st > 0 ? Math.floor(b / st + 1e-6) * st : b);
      if (v.drum) { const n = E.make(v.tr, start, 0, pi, 0.85); E.itemsOf(v.tr).push(n); E.sortTrack(v.tr); G.items.clear(); G.items.add(n); drag = { k: 'steps', on: true, row: pi }; api.audition(v.tr, v.rows[pi]); done('drag'); return; }
      const n = E.make(v.tr, start, G.noteLen > 0 ? G.noteLen : (st > 0 ? st : 0.25), pi, 0.85);
      E.itemsOf(v.tr).push(n); E.sortTrack(v.tr); G.items.clear(); G.items.add(n);
      drag = { k: 'create', n, start };
      api.audition(v.tr, pi); done('drag'); return;
    }
    /* SELECT, or DRAW on the empty: a box */
    drag = { k: 'box', x0: p.x, y0: p.y, add: ev.shiftKey, prev: new Set(G.items), moved: false };
    if (!ev.shiftKey && G.items.size) { G.items.clear(); api.changed('sel'); }
  });

  function applyVel(p, v) {
    const d = drag, val = velAt(p.y, v), tr = v.tr;
    if (d.multi) { const dv = val - d.orig.get(d.it); G.items.forEach(i => E.setVel(tr, i, d.orig.get(i) + dv)); }
    else {
      const x0 = Math.min(d.lx, p.x), x1 = Math.max(d.lx, p.x);
      E.itemsOf(tr).forEach(i => {
        const x = beatX(v, i[0]) + 2;
        if (x >= x0 - 4 && x <= x1 + 4) { const f = x1 > x0 ? (x - d.lx) / (p.x - d.lx) : 1; E.setVel(tr, i, velAt(d.ly + (p.y - d.ly) * Math.max(0, Math.min(1, f)), v)); }
      });
      E.setVel(tr, d.it, val);
    }
    d.lx = p.x; d.ly = p.y; done('drag');
  }

  cv.addEventListener('pointermove', ev => {
    const p = P(ev), v = V();
    if (!drag) {
      const z = zoneOf(p, v), it = z === 'roll' ? itemAtP(p, v) : null;
      cv.style.cursor = z === 'ruler' ? 'col-resize' : z === 'gutter' ? 'pointer' : z === 'vel' ? 'ns-resize' : it ? (onEdge(it, p, v) ? 'ew-resize' : 'grab') : G.tool === 'erase' ? 'not-allowed' : G.tool === 'draw' ? 'crosshair' : 'default';
      const h = z === 'roll' && !it && v.tr && G.tool === 'draw' && pitchOfRow(rowAt(p, v), v) != null ? (() => { const st = step(), b = xBeat(v, p.x), s0 = st > 0 ? Math.floor(b / st + 1e-6) * st : b; return { x: Math.round(beatX(v, s0)), y: Math.round(v.top + (rowAt(p, v) - v.scrollY) * v.rowH), w: Math.max(6, (v.drum ? (st || 0.25) : (G.noteLen || st || 0.25)) * v.pxb - 1), h: v.rowH - 1 }; })() : null;
      if (JSON.stringify(h) !== JSON.stringify(hover)) { hover = h; dirty = true; }
      return;
    }
    const d = drag, b = xBeat(v, p.x), st = step();
    if (d.k === 'range') {
      if (Math.abs(p.x - d.x0) > 3) d.moved = true;
      if (d.moved) { const s = st > 0 ? Math.min(st, 1) : 0, e = Math.max(0, snapTo(b, s)); api.setRange(Math.min(d.a0, e), Math.max(d.a0, e) + (e === d.a0 ? Math.max(s, 0.25) : 0)); }
    } else if (d.k === 'edge') {
      const e = Math.max(0, snapTo(b, st > 0 ? Math.min(st, 1) : 0)), r = G.range;
      if (r) api.setRange(d.side === 'a' ? Math.min(e, r.b - 0.25) : r.a, d.side === 'b' ? Math.max(e, r.a + 0.25) : r.b);
    } else if (d.k === 'create') {
      const minLen = G.noteLen > 0 ? G.noteLen : (st > 0 ? st : 0.1), n = Math.max(minLen, (st > 0 ? snapTo(b, st) : b) - d.start);
      if (Math.abs(n - d.n[1]) > 1e-6) { d.n[1] = n; done('drag'); }
    } else if (d.k === 'move') {
      const pn = pitchOfRow(rowAt(p, v), v);
      const dB = snapTo(d.a0 + (b - d.b0), st) - d.a0, dP = pn == null || d.p0 == null ? 0 : pn - d.p0;
      if (!d.moved && dB === 0 && dP === 0) return;                      /* a click is not a drag: it has to travel */
      if (!d.moved) {
        d.moved = true;
        if (d.copy) { const cp = d.sel.map(i => i.slice()); cp.forEach(i => E.itemsOf(v.tr).push(i)); d.sel = cp; d.orig = cp.map(i => i.slice()); G.items.clear(); cp.forEach(i => G.items.add(i)); }
      }
      d.sel.forEach((i, k) => { i.length = 0; i.push(...d.orig[k]); });
      E.move(v.tr, d.sel, dB, dP);
      done('drag');
    } else if (d.k === 'resize') {
      const end = Math.max(d.a0 + 1 / 24, snapTo(b, st)), dd = end - d.end0;
      d.sel.forEach((i, k) => { i.length = 0; i.push(...d.orig[k]); });
      E.resize(v.tr, d.sel, dd);
      d.moved = true; done('drag');
    } else if (d.k === 'box') {
      if (Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) > 4) d.moved = true;
      if (!d.moved) return;
      const x0 = Math.min(d.x0, p.x), x1 = Math.max(d.x0, p.x), y0 = Math.min(d.y0, p.y), y1 = Math.max(d.y0, p.y);
      marquee = { x0, y0, x1, y1 };
      const ra = Math.max(0, Math.floor((y0 - v.top) / v.rowH + v.scrollY)), rb = Math.min(v.rows.length - 1, Math.floor((y1 - v.top) / v.rowH + v.scrollY));
      if (v.tr && rb >= ra) {
        const lo = v.drum ? ra : v.rows[rb], hi = v.drum ? rb : v.rows[ra];
        const hit = E.itemsIn(v.tr, xBeat(v, x0), xBeat(v, x1), lo, hi, tol(v));
        G.items.clear(); if (d.add) d.prev.forEach(i => G.items.add(i)); hit.forEach(i => G.items.add(i));
      }
      api.changed('sel'); dirty = true;
    } else if (d.k === 'erase') {
      const it = itemAtP(p, v);
      if (it) { G.items.delete(it); E.remove(v.tr, [it]); done('drag'); }
    } else if (d.k === 'steps') {
      const pn = d.row, it = E.itemAt(v.tr, b, pn, tol(v));
      if (d.on && !it && pn != null) { const s = step() > 0 ? Math.floor(b / step() + 1e-6) * step() : b; E.itemsOf(v.tr).push(E.make(v.tr, s, 0, pn, 0.85)); E.sortTrack(v.tr); done('drag'); }
      else if (!d.on && it) { E.remove(v.tr, [it]); done('drag'); }
    } else if (d.k === 'vel') applyVel(p, v);
  });
  const end = ev => {
    if (!drag) return;
    const d = drag; drag = null; marquee = null; dirty = true;
    if (d.k === 'range' && !d.moved) { const v = V(), b = Math.max(0, snapTo(xBeat(v, P(ev).x), step() > 0 ? Math.min(step(), 1) : 0)); api.setCursor(b, true); return; }
    if (d.k === 'box' && !d.moved) { api.changed('sel'); return; }
    if (d.k === 'move' && !d.moved) return;
    if (d.k === 'edge' || d.k === 'range') return;
    if (['create', 'move', 'resize', 'erase', 'steps', 'vel'].indexOf(d.k) >= 0) { const v = V(); E.sortTrack(v.tr); E.ensureBars(api.G.song, E.lastBeat(api.G.song)); api.changed('edit'); }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { if (hover) { hover = null; dirty = true; } });
  cv.addEventListener('contextmenu', ev => ev.preventDefault());
  cv.addEventListener('dblclick', ev => {
    const p = P(ev), v = V();
    if (zoneOf(p, v) === 'ruler') { const bar = Math.floor(xBeat(v, p.x) / v.song.beats) * v.song.beats; api.setRange(bar, bar + v.song.beats); }
  });
  cv.addEventListener('wheel', ev => {
    ev.preventDefault();
    const v = V(), p = P(ev), dir = ev.deltaY > 0 ? 1 : -1;
    if (ev.ctrlKey || ev.metaKey) {
      ev.stopPropagation();
      if (ev.shiftKey) { G.zoomY = Math.max(0.6, Math.min(2.6, G.zoomY * (dir > 0 ? 0.9 : 1.1))); }
      else { const at = xBeat(v, p.x); G.zoomX = Math.max(5, Math.min(260, G.zoomX * (dir > 0 ? 0.88 : 1.14))); scrollX = at - (p.x - GUT) / G.zoomX; }
      api.changed('view');
    } else if (ev.shiftKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) scrollX += (ev.deltaX || ev.deltaY) > 0 ? v.visBeats * 0.12 : -v.visBeats * 0.12;
    else scrollY += dir * 3;
    dirty = true;
  }, { passive: false });
  ov.addEventListener('pointerdown', ev => { ov.setPointerCapture(ev.pointerId); ovGo(ev); ov._d = true; });
  ov.addEventListener('pointermove', ev => { if (ov._d) ovGo(ev); });
  ov.addEventListener('pointerup', () => { ov._d = false; });
  const ovGo = ev => { const r = ov.getBoundingClientRect(), x = (ev.clientX - r.left) * OW / r.width, v = V(); scrollX = (x - GUT) / ovK - v.visBeats / 2; dirty = true; };

  /* ---- the size, and the frame --------------------------------------------------------------- */
  const size = () => {
    const w = Math.max(240, Math.floor(host.clientWidth)), h = Math.max(140, Math.floor(host.clientHeight));
    if (w !== W || h !== H) { W = cv.width = w; H = cv.height = h; g.imageSmoothingEnabled = false; dirty = true; }
    const ow = Math.max(240, Math.floor(ovHost.clientWidth));
    if (ow !== OW) { OW = ov.width = ow; ov.height = OVH; og.imageSmoothingEnabled = false; dirty = true; }
  };
  const ro = new ResizeObserver(size);
  ro.observe(host); ro.observe(ovHost);
  size();
  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!dirty) return;
    dirty = false;
    const v = V();
    drawRoll(g, api, v, { step: step(), head, hover, marquee });
    ovK = drawOverview(og, api, v, OW, OVH, head);
  };
  loop();
  const centreOn = () => {
    const v = V(), tr = v.tr;
    if (!tr || v.drum) { scrollY = 0; return; }
    const ps = E.itemsOf(tr).map(n => n[2]), mid = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : (tr.lo || 48) + 12;
    const r = v.rows.findIndex(x => x <= mid);
    scrollY = Math.max(0, (r < 0 ? 0 : r) - v.visRows / 2);
  };
  return {
    redraw() { dirty = true; },
    setHead(b) { if (b !== head) { head = b; dirty = true; } },
    /* keep the playhead in view while it moves, a page at a time */
    follow(b) { const v = V(); if (b < scrollX || b >= scrollX + v.visBeats - 0.5) { scrollX = Math.max(0, b - 0.5); dirty = true; } },
    scrollTo(b) { scrollX = Math.max(0, b); dirty = true; },
    resetScroll() { scrollX = 0; centreOn(); dirty = true; },
    centreOn() { centreOn(); dirty = true; },
    view: V,
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); }
  };
}
