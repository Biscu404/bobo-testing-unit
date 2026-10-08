/* The stage on the screen: what stage.js holds, drawn. A thing on the stage keeps its element from one drawing to the next (a box you are typing in is
   never rebuilt under your fingers); a button calls back into the program through stage.click; the 16 by 16 board is one tiny canvas, scaled up with hard
   edges, in the machine's sixteen colours. Errors from inside a button, and what the stage warns about, are shown here, under the things. */
export const VGA = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA', '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

export function makeStageView(host, o) {
  o = o || {};
  const root = el('div', 'hc-stage'), items = el('div', 'hc-items'), side = el('div', 'hc-side'), cv = el('canvas', 'hc-board'), warn = el('div', 'hc-warn'), err = el('div', 'hc-serr'), empty = el('div', 'hc-empty');
  cv.width = 16; cv.height = 16;
  empty.textContent = 'NOTHING ON THE STAGE YET. LABEL, BUTTON, FIELD, BAR, PIXEL AND NOTE PUT THINGS HERE.';
  side.append(cv);
  root.append(items, side, warn, err);
  host.appendChild(root);
  const V = { el: root, stage: null, raf: 0, els: new Map(), showBoard: !!o.board };

  function build(stage, it) {
    let e;
    if (it.kind === 'button') {
      e = el('button', 'hc-sbtn', it.text);
      e.addEventListener('mousedown', ev => { if (ev.button !== 0) return; ev.stopPropagation(); if (o.onPress) o.onPress(it); const r = stage.click(it.id); if (!r.ok && o.onFail) o.onFail(r); });
      e.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); const r = stage.click(it.id); if (o.onPress) o.onPress(it); if (!r.ok && o.onFail) o.onFail(r); } });
    } else if (it.kind === 'field') {
      e = el('label', 'hc-fieldw'); const t = el('span', 'hc-fhint', it.hint); const inp = el('input', 'hc-field');
      inp.type = 'text'; inp.spellcheck = false; inp.addEventListener('input', () => { it.value = inp.value; if (o.onChange) o.onChange(); });
      inp.addEventListener('keydown', ev => { ev.stopPropagation(); });
      e.append(t, inp);
    } else if (it.kind === 'bar') {
      e = el('div', 'hc-bar'); e.appendChild(el('div', 'hc-barfill')); e.appendChild(el('span', 'hc-barn'));
    } else e = el('div', 'hc-label');
    e.dataset.id = it.id;
    return e;
  }
  function paintBoard(stage) {
    const g = cv.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = VGA[stage.grid[y * 16 + x] & 15]; g.fillRect(x, y, 1, 1); }
  }
  V.refresh = () => {
    const stage = V.stage; V.raf = 0;
    if (!stage) return;
    const seen = new Set();
    stage.items.forEach(it => {
      seen.add(it.id);
      let e = V.els.get(it.id);
      if (!e) { e = build(stage, it); V.els.set(it.id, e); items.appendChild(e); }
      const col = it.color >= 0 ? VGA[it.color] : '';
      if (it.kind === 'label') { e.textContent = it.text || ' '; e.style.color = col; }
      else if (it.kind === 'button') { e.textContent = it.text; if (col) e.style.color = col; }
      else if (it.kind === 'field') { const inp = e.querySelector('input'); if (document.activeElement !== inp && inp.value !== it.value) inp.value = it.value; }
      else if (it.kind === 'bar') { const f = e.firstChild; f.style.width = Math.round(100 * it.value / it.max) + '%'; if (col) f.style.background = col; e.lastChild.textContent = it.value + ' / ' + it.max; }
    });
    V.els.forEach((e, id) => { if (!seen.has(id)) { e.remove(); V.els.delete(id); } });
    const nothing = !stage.items.length && !stage.painted && !stage.notes.length;
    if (nothing && !items.contains(empty)) items.appendChild(empty); else if (!nothing && empty.parentNode) empty.remove();
    const showB = V.showBoard || stage.painted > 0;
    side.style.display = showB ? '' : 'none';
    if (showB) paintBoard(stage);
    warn.textContent = stage.warnings.slice(-2).join('  ');
    warn.style.display = stage.warnings.length ? '' : 'none';
    err.textContent = stage.err ? 'A BUTTON FAILED: ' + stage.err.message + (stage.err.line ? ' (LINE ' + stage.err.line + ')' : '') : '';
    err.style.display = stage.err ? '' : 'none';
  };
  V.attach = stage => {
    V.stage = stage; V.els.forEach(e => e.remove()); V.els.clear();
    stage.onChange(() => { if (!V.raf) V.raf = requestAnimationFrame(V.refresh); if (o.onChange) o.onChange(); });
    V.refresh();
  };
  V.clear = () => { V.stage = null; V.els.forEach(e => e.remove()); V.els.clear(); items.appendChild(empty); side.style.display = V.showBoard ? '' : 'none'; warn.style.display = 'none'; err.style.display = 'none'; };
  V.setBoard = on => { V.showBoard = !!on; if (V.stage) V.refresh(); else side.style.display = on ? '' : 'none'; };
  V.destroy = () => { if (V.raf) cancelAnimationFrame(V.raf); };
  items.appendChild(empty); side.style.display = V.showBoard ? '' : 'none'; warn.style.display = 'none'; err.style.display = 'none';
  return V;
}
