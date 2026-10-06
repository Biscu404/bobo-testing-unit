/* The keyboard: transport and editing keys, and (what is left over) the piano keys. A key
   only counts while the Garage has the focus and you are not typing in a box. */
export function keyboard(root, api, keys) {
  const G = api.G, A = api.act;
  root.addEventListener('keydown', ev => {
    const tag = ev.target.tagName, typing = /input|textarea|select/i.test(tag) && ev.target.type !== 'range' && ev.target.type !== 'checkbox';
    if (typing) return;
    const ctrl = ev.ctrlKey || ev.metaKey, k = ev.key, lk = k.toLowerCase();
    const eat = () => { ev.preventDefault(); ev.stopPropagation(); };
    if (ctrl) {
      const map = { z: () => (ev.shiftKey ? api.redo() : api.undo()), y: () => api.redo(), s: () => api.save(ev.shiftKey), o: () => api.openSongs(), a: () => A.selectAll(), c: () => A.copy(), x: () => A.cut(),
        v: () => A.paste(ev.shiftKey), d: () => A.duplicate(), l: () => api.setLoop(!G.loop) };
      if (map[lk]) { eat(); map[lk](); }
      return;
    }
    if (ev.altKey) return;
    if (k === ' ' && !/button/i.test(tag)) { eat(); if (!ev.repeat) api.toggle(); return; }
    if (k === 'F1') { eat(); api.help(); return; }
    if (k === 'Home') { eat(); api.toStart(); return; }
    if (k === 'Delete' || k === 'Backspace') { eat(); A.del(ev.shiftKey); return; }
    if (k === 'Escape') { A.clearPick(); return; }
    if (k === 'Tab') { eat(); api.setDock(G.dock === 'keys' ? 'mixer' : 'keys'); return; }
    if (k === 'ArrowLeft' || k === 'ArrowRight') { eat(); A.nudge(k === 'ArrowLeft' ? -1 : 1); return; }
    if (k === 'ArrowUp' || k === 'ArrowDown') { if (G.items.size) { eat(); A.transpose((k === 'ArrowUp' ? 1 : -1) * (ev.shiftKey ? 12 : 1)); } return; }
    if (k === '[' || k === ']') { eat(); A.stretch(k === ']' ? 1 : -1); return; }
    const quick = { '1': () => api.setTool('draw'), '2': () => api.setTool('select'), '3': () => api.setTool('erase'), q: () => A.quantize(1, false), m: () => api.setMetro(!G.metro),
      '-': () => api.zoom(0.8, 1), '=': () => api.zoom(1.25, 1), '+': () => api.zoom(1.25, 1) };
    if (quick[lk]) { eat(); quick[lk](); return; }
    if (keys.keydown(ev)) ev.preventDefault();
  });
}
