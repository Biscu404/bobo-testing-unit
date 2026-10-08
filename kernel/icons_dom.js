/* The icon every file view draws: the desktop, a folder window, the bin.

   An icon used to carry its picture as an inline <svg> of a dozen rects, so two hundred files on the desktop were
   two thousand five hundred elements the browser had to style, lay out and paint, and every redraw built them all
   again. Now a picture is a CSS class that holds the same SVG as a background image (decoded once, shared by every
   icon that wears it), and an icon is a clone of one small template: three elements, whatever it shows.
   spriteFor() still hands out the SVG itself, for the drag ghost. */
import { SPRITES } from './sprites.js';
import './sprites_extra.js';

const APP_SPRITES = {
  hifi: 'disc', notes: 'notes', bottle: 'bottle', elephant: 'elephant',
  magen: 'magen', cook: 'flask', garden: 'garden', sweeper: 'sweeper',
  solitaire: 'solitaire', crayon: 'crayon', shop: 'shop', drawings: 'drawings',
  account: 'account', standbattle: 'arena', garage: 'garage', holyc: 'holyc', trophies: 'trophy', trophybox: 'trophybox'
};

export function spriteFor(type, app) {
  if (type === 'folder')   return SPRITES.folder;
  if (type === 'image')    return SPRITES.image;
  if (type === 'video')    return SPRITES.video;
  if (type === 'terminal') return SPRITES.terminal;
  if (type === 'bin')      return SPRITES.bin;
  if (type === 'binfull')  return SPRITES.binfull;
  if (type === 'song')     return SPRITES.song;
  if (type === 'app')      return SPRITES[APP_SPRITES[app]] || SPRITES.app;
  if (type === 'doc')      return SPRITES.doc;
  if (type === 'code')     return SPRITES.code;
  return SPRITES.text;
}

const kinds = new Map();                 /* key -> template element */
let sheet = null;

/* what picture an icon wears: the same SVG is one rule, however many files show it */
function template(type, app) {
  const svg = spriteFor(type, app);
  let t = kinds.get(svg);
  if (t) return t;
  if (!sheet) {
    const st = document.createElement('style');
    st.id = 'icon-sprites';
    document.head.appendChild(st);
    sheet = st.sheet;
  }
  const cls = 'spr-' + kinds.size;
  sheet.insertRule('.' + cls + '{background-image:url("data:image/svg+xml,' + encodeURIComponent(svg) + '")}', sheet.cssRules.length);
  t = document.createElement('div');
  t.className = 'icon';
  const pic = document.createElement('i');
  pic.className = 'ico ' + cls;
  const lbl = document.createElement('div');
  const span = document.createElement('span');
  span.className = 'lbl';
  lbl.appendChild(span);
  t.appendChild(pic);
  t.appendChild(lbl);
  kinds.set(svg, t);
  return t;
}

/* a finished icon for { name, type, app } */
export function iconEl(item) {
  const el = template(item.type, item.app).cloneNode(true);
  el.dataset.name = item.name;
  el.lastChild.firstChild.textContent = item.name;
  return el;
}
