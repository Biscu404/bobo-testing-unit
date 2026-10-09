/* A palette is a small window that belongs to another window: the Crayon's colours, tools, layers and sheet are four of them, and can be put anywhere on the
   desktop. wm.js makes one when createWindow is given `owner` (the owning window's element). The rules, all of them here so wm.js stays what it was:
     - a palette has no taskbar button and no minimise, fullscreen, zoom or scheme control (theme.css hides them); it is never an app of its own (no appId),
       so the mixer, the trophies and "is this app open?" never see it;
     - it is always in front of its owner: raising either raises both, the owner first, and the palette that was touched last;
     - the owner being put away (minimised) or brought back takes its palettes with it, and closing the owner closes them. */
export const isPalette = win => !!(win && win._owner);

export function link(win, owner) {
  win._owner = owner;
  win.classList.add('palette');
  (owner._palettes = owner._palettes || []).push(win);
}

export function unlink(win) {
  const own = win._owner;
  if (own && own._palettes) own._palettes = own._palettes.filter(p => p !== win);
  win._owner = null;
}

/* the windows to put in front, from the back: the owner, its palettes, and the one that was touched last */
export function group(win) {
  const own = win._owner || win, rest = (own._palettes || []).filter(p => p !== win);
  return win._owner ? [own].concat(rest, [win]) : [own].concat(rest);
}

/* the owner was minimised or restored */
export function follow(owner, hidden) { (owner._palettes || []).forEach(p => p.classList.toggle('hidden', hidden)); }

/* the owner is closing: its palettes go first (each says its owner went, so it need not remember it was closed by hand) */
export function closeAll(owner) {
  (owner._palettes || []).slice().forEach(p => { if (p._close) p._close(true); });
  owner._palettes = [];
}
