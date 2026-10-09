/* What the sheet and its panels agree on: the colour, the tool, the size. One object and one small list of listeners: a panel changes it through the setters and every
   panel (and the readout in the main window's bar) hears of it, so what is lit in one place is lit in all of them, wherever the panels have been put on the desktop. */
export const SIZES = [4, 9, 17];
export const SIZE_NAMES = ['SMALL', 'MEDIUM', 'LARGE'];

export function createSession(palette) {
  const subs = [];
  const s = {
    palette, tool: 'crayon', swatch: 3, hex: palette[3].c, size: 1,
    wheel: { h: 0, s: 0, v: 1, on: false },          /* a colour taken from the wheel instead of a swatch */
    on(fn) { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
    emit(what) { subs.slice().forEach(f => { try { f(what); } catch (e) { /* a panel that is gone */ } }); },
    setTool(t) { if (s.tool === t) return; s.tool = t; s.emit('tool'); },
    /* picking a colour with the eraser in hand puts the crayon back in it */
    pickSwatch(i) { s.swatch = i; s.hex = palette[i].c; s.wheel.on = false; if (s.tool === 'eraser') s.tool = 'crayon'; s.emit('colour'); s.emit('tool'); },
    pickWheel(h, sat, v, hex) { s.swatch = -1; s.hex = hex; s.wheel = { h, s: sat, v, on: true }; if (s.tool === 'eraser') s.tool = 'crayon'; s.emit('colour'); s.emit('tool'); },
    setSize(i) { s.size = i; s.emit('size'); },
    nib: () => SIZES[s.size]
  };
  return s;
}
