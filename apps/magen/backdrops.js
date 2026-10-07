import { makeKit, TW, TH, rgb, hash } from './scene_kit.js';
import { addProps } from './scene_props.js';
import { SCENES_A } from './scenes_a.js';
import { SCENES_B } from './scenes_b.js';
import { SCENES_C } from './scenes_c.js';
import { SCENES_D } from './scenes_d.js';
import { SCENES_E } from './scenes_e.js';
import { mgIcon } from './icons.js';

/* ---- the store's backdrops -------------------------------------------------
   Every row of every list has a picture behind it, the way a Cookie Clicker
   building does: a tile of pixel art in the sixteen (scene_kit.js and the
   scenes_*.js files), painted ONCE the first time its row is shown, pushed
   into a CSS rule as a data: URL, and tiled across the row by the browser at
   twice its size with `image-rendering: pixelated`. So a row of any width
   (the window resized, fullscreen, zoomed) is crisp and costs nothing per
   frame, and an affordable row is simply the picture, a row you cannot afford
   has an ordered dither of black laid over it and one you have not met yet a
   dither of blue (style.css; the dithers are tiles made here).

   A building row also has a zone: the little icon of the building, once for
   every one you own, standing across the picture, as the farms stand in the
   fields. That is the only thing painted per row, and only when the pane is
   rebuilt or resized.
   ========================================================================== */
const HUD_HILLS = K => { K.ridge(9, 3, 2, 0.5, 9); K.ridge(6, 3, 3, 1.7, 3); K.ridge(3, 2, 2, 0.2, 2); K.r(0, 22, 160, 2, 2); };
const REG = Object.assign({}, SCENES_A, SCENES_B, SCENES_C, SCENES_D, SCENES_E, { hud_hills: HUD_HILLS });
export const MG_SCENES = Object.keys(REG);

const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const tiles = new Map();
function tile(id) {
  if (!REG[id]) id = 'm_stars';
  let t = tiles.get(id);
  if (!t) {
    const K = makeKit(); addProps(K);
    try { REG[id](K); } catch (e) { /* a scene that fails is a blank tile, not a broken store */ }
    t = { id: id, cv: K.cv, url: null };
    tiles.set(id, t);
  }
  if (!t.url) t.url = t.cv.toDataURL('image/png');
  return t;
}
export const mgSceneTile = id => tile(id).cv;

/* a pattern tile for the CSS: draw(g) paints it, the result is a url() */
function cssTile(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return 'url(' + c.toDataURL('image/png') + ')';
}
const dots = (g, w, h, c, lvl) => { g.fillStyle = rgb(c); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (BAY[y & 3][x & 3] < lvl) g.fillRect(x, y, 1, 1); };
const fill = (g, c, x, y, w, h) => { g.fillStyle = rgb(c); g.fillRect(x, y, w, h); };

let hudCache = null;
function hud() {
  if (hudCache) return hudCache;
  const H = {};
  /* the room: deep blue with a sprinkle of stars, so the window is a night and not a hole */
  H.night = cssTile(48, 48, (g, w, h) => {
    fill(g, 1, 0, 0, w, h); dots(g, w, h, 9, 1);
    for (let i = 0; i < 9; i++) { const v = hash(i * 17 + 5); fill(g, i % 4 === 0 ? 15 : i % 2 ? 11 : 9, v % w, (v >>> 8) % h, 1, 1); }
  });
  /* planks: brown, a lighter grain, a dark seam */
  H.wood = cssTile(32, 8, (g, w, h) => {
    fill(g, 6, 0, 0, w, h); dots(g, w, 3, 14, 3); dots(g, w, h, 4, 1);
    fill(g, 4, 0, 7, w, 1); fill(g, 14, 0, 0, w, 1);
    fill(g, 4, 9, 3, 3, 1); fill(g, 4, 22, 4, 2, 1);
  });
  /* what sits behind a name and a price so they can be read over any picture: mostly deep blue, a little black */
  H.scrim = cssTile(4, 4, (g, w, h) => { dots(g, w, h, 1, 10); dots(g, w, h, 0, 2); });
  H.poor = cssTile(4, 4, (g, w, h) => dots(g, w, h, 0, 5));
  H.veil = cssTile(4, 4, (g, w, h) => { dots(g, w, h, 1, 12); dots(g, w, h, 0, 4); });
  /* every other line of a list is a shade lighter */
  H.band = cssTile(4, 4, (g, w, h) => { fill(g, 1, 0, 0, w, h); dots(g, w, h, 9, 2); });
  H.plaque = cssTile(4, 4, (g, w, h) => { fill(g, 1, 0, 0, w, h); dots(g, w, h, 9, 1); });
  /* the valley, along the foot of the left column */
  const K = makeKit(); addProps(K); HUD_HILLS(K);
  H.hills = 'url(' + K.cv.toDataURL('image/png') + ')';
  /* the four flashes of a bought row, each a dither of one colour, stepping down */
  H.f1 = cssTile(4, 4, (g, w, h) => dots(g, w, h, 15, 16));
  H.f2 = cssTile(4, 4, (g, w, h) => dots(g, w, h, 14, 11));
  H.f3 = cssTile(4, 4, (g, w, h) => dots(g, w, h, 10, 6));
  H.f4 = cssTile(4, 4, (g, w, h) => dots(g, w, h, 4, 8));
  hudCache = H;
  return H;
}

/* ---- which picture is behind what ---------------------------------------- */
const ACH_FLAG = { lit: 'nerot', clot: 'k2', arg: 's_pil', yiz: 'l_cand', rest: 'm_shabbat' };
const ACH_CLICK = { 1: 'c1', 100: 'c2', 1000: 'c3', 10000: 'c4', 613: 'c10' };
export function mgAchScene(a) {
  switch (a.t) {
    case 'own':   return a.b;
    case 'click': return ACH_CLICK[a.v] || 'c1';
    case 'total': return 'm_stars';
    case 'mps':   return 'l_off';
    case 'shab':  return 'm_shabbat';
    case 'gold':  return 'm_gold';
    case 'asc':   return 'l_chain';
    case 'arg':   return 's_pil';
    case 'ups':   return 'm_books';
    case 'dias':  return 'galut';
    case 'allb':  return 'yerushalayim';
    case 'flag':  return ACH_FLAG[a.v] || 'm_stars';
    default:      return 'm_stars';
  }
}

/* ---- the little icons that stand across a building's picture --------------- */
const IW = 26;
const atlas = new Map();
function iconCanvas(bid) {
  let c = atlas.get(bid);
  if (c) return c;
  c = document.createElement('canvas'); c.width = IW + 2; c.height = IW + 2;
  const g = c.getContext('2d');
  /* a hard one-pixel shadow under the picture, then the picture; the three icons that are a
     black square with a drawing in it give the square back so the scene shows round them */
  const pass = (dx, dy, flat) => (x, y, w, h, col) => {
    if (col === 0 && w * h >= 300) return;
    g.fillStyle = rgb(flat == null ? col : flat);
    g.fillRect(Math.round(x) + dx, Math.round(y) + dy, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  mgIcon(pass(1, 1, 0), bid); mgIcon(pass(0, 0), bid);
  atlas.set(bid, c);
  return c;
}
function paintZone(z) {
  const cv = z.firstChild, n = +z.dataset.n || 0;
  const cw = z.clientWidth, ch = z.clientHeight;
  if (!cv || !cw || !ch) return;
  if (cv.width !== cw) cv.width = cw;
  if (cv.height !== ch) cv.height = ch;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, cw, ch);
  if (!n || cw < IW) return;
  const ic = iconCanvas(z.dataset.bz);
  const fit = Math.max(1, Math.floor((cw - IW) / 3) + 1);
  const draw = Math.min(n, fit, 140);
  const step = draw > 1 ? Math.min(IW + 3, (cw - IW) / (draw - 1)) : 0;
  const packed = step < IW;
  const base = ch - IW - 3;
  /* far rows first so the near ones stand in front of them */
  for (let k = 2; k >= 0; k--) {
    for (let i = 0; i < draw; i++) {
      const lane = packed ? (i * 5 + (i >> 2)) % 3 : 0;
      if (lane !== k) continue;
      g.drawImage(ic, Math.round(i * step), Math.max(0, base - k * 4));
    }
  }
}

/* ---- one window's worth ---------------------------------------------------- */
export function mgBackdrops(root) {
  const style = document.createElement('style');
  root.appendChild(style);
  const known = new Set();
  const addRule = text => {
    if (style.sheet) { try { style.sheet.insertRule(text, style.sheet.cssRules.length); return; } catch (e) { /* fall through */ } }
    style.appendChild(document.createTextNode(text));
  };
  /* the window's own stylesheet, and the textures it uses */
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = 'apps/magen/style.css';
  root.style.visibility = 'hidden';
  const show = () => { root.style.visibility = ''; };
  link.onload = show; link.onerror = show; setTimeout(show, 1500);
  root.appendChild(link);
  const H = hud();
  Object.keys(H).forEach(k => root.style.setProperty('--mg-' + k, H[k]));

  let ro = null, warmT = 0, warm = Object.keys(REG);
  const api = {
    /* the class that puts a scene behind an element; its rule is written the first time it is asked for */
    cls(id) {
      const t = tile(id);
      if (!known.has(t.id)) { known.add(t.id); addRule('.mgroot .sc-' + t.id + ' { background-image: url(' + t.url + '); }'); }
      return 'sc sc-' + t.id;
    },
    /* the strip a building's owned icons are painted on */
    zone(bid, n) { return '<span class="mgzone" data-bz="' + bid + '" data-n="' + n + '"><canvas></canvas></span>'; },
    paint(pane) { pane.querySelectorAll('.mgzone').forEach(paintZone); },
    watch(pane) {
      if (typeof ResizeObserver === 'undefined') return;
      let w = 0;
      ro = new ResizeObserver(() => { const nw = pane.clientWidth; if (nw !== w) { w = nw; api.paint(pane); } });
      ro.observe(pane);
    },
    /* make the pictures nobody has asked for yet, one a tick, so the first visit to a tab is not a hitch */
    warm() {
      const step = () => { warmT = 0; const id = warm.pop(); if (!id) return; const im = new Image(); im.src = tile(id).url; warmT = setTimeout(step, 30); };
      warmT = setTimeout(step, 400);
    },
    dispose() { if (ro) ro.disconnect(); ro = null; if (warmT) clearTimeout(warmT); warmT = 0; }
  };
  return api;
}
export { TW, TH };
