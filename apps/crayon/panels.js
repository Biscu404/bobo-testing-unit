/* The Crayon's panels: COLOUR, TOOLS, LAYERS and SHEET, each its own small window (kernel/palette.js) that can stand anywhere on the desktop, over the sheet or
   far from it, and be put away and brought back from the bar of the main window. Where each stands, and which are open, is remembered (templeos.crayon.panels.v1);
   RESET PANELS lays them out beside the sheet again. They close with the sheet and come back with it. */
import { buildColour } from './panel_colour.js';
import { buildTools } from './panel_tools.js';
import { buildLayers } from './panel_layers.js';
import { buildSheet } from './panel_sheet.js';
import { arrange, clampAt } from './panels_layout.js';

const KEY = 'templeos.crayon.panels.v1';
export const DEFS = [
  { id: 'colour', title: 'COLOUR', w: 180, h: 232, col: 0, build: buildColour },
  { id: 'sheet',  title: 'SHEET',  w: 204, h: 122, col: 0, build: buildSheet },
  { id: 'tools',  title: 'TOOLS',  w: 232, h: 286, col: 1, build: buildTools },
  { id: 'layers', title: 'LAYERS', w: 232, h: 224, col: 1, build: buildLayers }
];

const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };

/* o: { owner: the sheet window's element, sess, env, makeWindow(opts), desk() -> {w,h}, ownerRect() -> {x,y,w,h} } */
export function createPanels(o) {
  const st = read();
  st.open = st.open || {}; st.at = st.at || {};
  const wins = {}, subs = [];
  const tell = () => subs.slice().forEach(f => f());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* kept for this sitting */ } };
  /* from the style, which a window keeps after it has left the page (its offsets are zero then) */
  const where = made => ({ x: parseInt(made.win.style.left, 10) || 0, y: parseInt(made.win.style.top, 10) || 0 });
  const remember = () => { DEFS.forEach(d => { if (wins[d.id]) st.at[d.id] = where(wins[d.id]); }); save(); };

  const place = (d, fresh) => {
    const desk = o.desk();
    if (st.at[d.id] && !fresh) return clampAt(st.at[d.id], d, desk);
    return arrange(DEFS, o.ownerRect(), desk)[d.id];
  };

  function open(id, fresh) {
    const d = DEFS.find(x => x.id === id);
    if (!d || wins[id]) return;
    const made = o.makeWindow({
      kind: 'app', title: d.title, w: d.w, h: d.h, resizable: false, owner: o.owner, at: place(d, fresh),
      build: body => d.build(body, o.sess, o.env),
      onClose: ({ withOwner }) => {
        if (wins[id]) st.at[id] = where(wins[id]);                       /* the window is gone but its place is still on it */
        delete wins[id];
        if (!withOwner) st.open[id] = false;                              /* put away by hand: it stays away next time */
        save(); tell();
      }
    });
    wins[id] = made;
    st.open[id] = true;
    if (fresh) st.at[id] = where(made);
    save(); tell();
  }

  const close = id => { if (wins[id]) wins[id].close(); };
  return {
    defs: DEFS,
    isOpen: id => !!wins[id],
    toggle(id) { if (wins[id]) close(id); else open(id); },
    open, close,
    /* the first time, or when asked: every one beside the sheet */
    reset() { DEFS.forEach(d => { if (wins[d.id]) wins[d.id].close(); }); DEFS.forEach(d => open(d.id, true)); },
    /* when the sheet opens: the ones that were open (all of them, the very first time) */
    restore() { DEFS.forEach(d => { if (st.open[d.id] !== false) open(d.id, st.at[d.id] ? false : true); }); },
    watch() { return remember; },
    remember,
    onChange(fn) { subs.push(fn); }
  };
}
