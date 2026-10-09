import { createWindow, raise, sysDialog, toast, askName, openWindow } from '../../kernel/wm.js';
import { Snd } from '../../kernel/snd.js';
import { Cos } from '../../kernel/cos.js';
import { lampDip } from '../../kernel/hardware.js';
import { Vault, VaultURL } from '../../kernel/vault.js';
import { scopedListeners } from '../lifecycle.js';
import { createLayers } from './layers.js';
import { CRAYON } from '../../kernel/cos_data.js';
import { createCalls } from './trophy_calls.js';
import { createSession, SIZE_NAMES } from './session.js';
import { createStroke } from './stroke.js';
import { createPanels } from './panels.js';

/* DRAW.EXE. The sheet is the window; what you draw with (colour, tools, layers, the sheet's own buttons) is four panels that are windows of their own and stand
   anywhere on the desktop (panels.js). The brushes are stroke.js, the shared state is session.js. */
const DRAW_KEY = 'templeos.draw';
const DRAW_CAP = 120;
const CRAYON_PAL = [
  { n: 'PAPER',  c: '#e8e2d4' },
  { n: 'BONE',   c: '#c9bfa8' },
  { n: 'ASH',    c: '#6b6357' },
  { n: 'CHAR',   c: '#1a1a1a' },
  { n: 'BLOOD',  c: '#8b1a1a' },
  { n: 'RUST',   c: '#b23a2a' },
  { n: 'BRUISE', c: '#4a2c3d' }
];
const PAPER = '#e8e2d4';
const DRAW_W = 672, DRAW_H = 448;

let paperCv = null;
function makePaper() {
  if (paperCv) return paperCv;
  paperCv = document.createElement('canvas');
  paperCv.width = DRAW_W; paperCv.height = DRAW_H;
  const g = paperCv.getContext('2d');
  g.fillStyle = PAPER;
  g.fillRect(0, 0, DRAW_W, DRAW_H);
  const img = g.getImageData(0, 0, DRAW_W, DRAW_H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() * 14 - 7) | 0;
    d[i] += n; d[i + 1] += n; d[i + 2] += n - 1;
  }
  g.putImageData(img, 0, 0);
  /* fibres: short pale and dark hairs lying in the sheet */
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * DRAW_W, y = Math.random() * DRAW_H;
    const a = Math.random() * Math.PI, l = 2 + Math.random() * 7;
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.30)' : 'rgba(120,110,90,0.16)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return paperCv;
}

const Crayon = {
  st: null,
  boot() {
    let raw = localStorage.getItem(DRAW_KEY);
    this.st = raw ? JSON.parse(raw) : { items: [], seq: 1 };
    if (!Array.isArray(this.st.items)) this.st.items = [];
  },
  save() { localStorage.setItem(DRAW_KEY, JSON.stringify(this.st)); }
};
Crayon.boot();

window.Crayon = Crayon;

let drawWin = null;
export default {
  open(loadItem) {
  if (drawWin && document.body.contains(drawWin.win)) {
    raise(drawWin.win);
    if (loadItem && drawWin.loadInto) drawWin.loadInto(loadItem);
    return;
  }
  let cv, panels = null, nowEl = null, toggles = {};
  const sess = createSession(CRAYON_PAL);
  const tro = createCalls(CRAYON_PAL.map(p => p.c)), EXTRA = CRAYON.filter(c => c.kind === 'brush').map(c => c.id);
  let drawing = false, lastX = 0, lastY = 0, lastT = 0;
  let undo = [], scratchT = 0;
  let current = null;         /* the saved record this canvas came from */
  let layers = null;
  const owns = id => Cos.has('crayon', id);
  const toDave = what => { Snd.deny(); toast('DAVE SELLS ' + what + '.'); openWindow('shop', { tab: 'crayon' }).catch(() => {}); };
  const g = () => layers.ctx();

  const made = createWindow({
    kind: 'app', title: 'DRAW.EXE', w: 712, h: 556, appId: 'crayon',
    build: body => {
      const root = document.createElement('div');
      root.className = 'drawroot';
      /* the bar: which panels are out, and what is in the hand */
      const bar = document.createElement('div');
      bar.className = 'drawbar';
      ['colour', 'tools', 'layers', 'sheet'].forEach(id => {
        const b = document.createElement('button');
        b.className = 'tl'; b.textContent = id.toUpperCase();
        b.title = 'Show or put away the ' + id.toUpperCase() + ' panel. Every panel is a window: drag it anywhere on the desktop.';
        b.addEventListener('mousedown', ev => { ev.stopPropagation(); Snd.click(); panels.toggle(id); });
        toggles[id] = b; bar.appendChild(b);
      });
      const rs = document.createElement('button');
      rs.className = 'tl'; rs.textContent = 'RESET PANELS';
      rs.title = 'Lay all four panels out beside the sheet again.';
      rs.addEventListener('mousedown', ev => { ev.stopPropagation(); Snd.click(); panels.reset(); });
      bar.appendChild(rs);
      const sp = document.createElement('span'); sp.className = 'sp'; bar.appendChild(sp);
      nowEl = document.createElement('span'); nowEl.className = 'now'; nowEl.innerHTML = '<i></i><b></b><u></u>';
      bar.appendChild(nowEl);

      const wrap = document.createElement('div');
      wrap.className = 'drawwrap';
      cv = document.createElement('canvas');
      cv.width = DRAW_W; cv.height = DRAW_H;
      cv.className = 'drawcv';
      wrap.appendChild(cv);
      const mid = document.createElement('div');
      mid.className = 'drawbody';
      mid.appendChild(wrap);
      root.appendChild(bar); root.appendChild(mid);
      body.appendChild(root);
    }
  });
  drawWin = made;
  const cg = cv.getContext('2d', { willReadFrequently: true });
  if (!cg) return;
  layers = createLayers(DRAW_W, DRAW_H, cg);
  const stroke = createStroke({ g, layers: () => layers, paper: makePaper, tool: () => sess.tool, hex: () => sess.hex, nib: sess.nib, W: DRAW_W, H: DRAW_H });

  function push() {
    try { undo.push({ li: layers.active, img: g().getImageData(0, 0, DRAW_W, DRAW_H) }); } catch (e) { return; }
    if (undo.length > 24) undo.shift();
  }
  function doUndo() {
    const s = undo.pop();
    if (!s) { toast('NOTHING LEFT TO TAKE BACK.'); return; }
    layers.setActive(s.li);
    g().putImageData(s.img, 0, 0);
    layers.redraw(); sess.emit('layers');
  }
  function newSheet() {
    layers.reset();
    g().drawImage(makePaper(), 0, 0);
    layers.redraw(); sess.emit('layers');
    undo = [];
    current = null; tro.begin(false);
    made.title.textContent = 'DRAW.EXE';
  }

  /* ---- the panels -------------------------------------------------------- */
  const env = {
    click: () => Snd.click(), owns, toDave,
    brushes: CRAYON.filter(c => c.kind === 'brush'),
    layerItem: i => CRAYON.find(x => x.id === 'layer' + (i + 1)),
    layers: () => layers,
    setLayer: i => { layers.setActive(i); sess.emit('layers'); },
    toggleLayer: i => { layers.toggle(i); layers.redraw(); sess.emit('layers'); },
    clearLayer: () => {
      const i = layers.active;
      if (i === 0) { toast('THE SHEET HAS NEW. THIS ONE IS THE PAPER.'); return; }
      push(); layers.clear(i); layers.redraw(); Snd.page();
    },
    mergeDown: () => {
      const i = layers.active;
      if (i === 0) { toast('NOTHING UNDER THE PAPER.'); return; }
      push(); layers.mergeDown(i); layers.setActive(i - 1); layers.redraw(); sess.emit('layers'); Snd.page();
    },
    sheet: {
      undo: doUndo, newSheet, save, exportPng,
      background: () => import('../../kernel/wallpaper.js').then(m => { m.setWallpaperFromSrc(cv.toDataURL('image/png'), 'fill'); tro.background(); }),
      drawings: () => openWindow('drawings').catch(() => {})
    }
  };
  const desk = () => { const d = document.getElementById('desktop'); return { w: d.clientWidth, h: d.clientHeight }; };
  panels = createPanels({
    owner: made.win, sess, env, makeWindow: createWindow, desk,
    ownerRect: () => ({ x: made.win.offsetLeft, y: made.win.offsetTop, w: made.win.offsetWidth, h: made.win.offsetHeight })
  });
  const lit = () => panels.defs.forEach(d => toggles[d.id].classList.toggle('on', panels.isOpen(d.id)));
  panels.onChange(lit);
  const readout = () => {
    nowEl.querySelector('i').style.background = sess.hex;
    nowEl.querySelector('b').textContent = sess.tool.toUpperCase();
    nowEl.querySelector('u').textContent = SIZE_NAMES[sess.size];
  };
  sess.on(what => { if (what === 'colour' || what === 'tool' || what === 'size') readout(); });
  readout(); lit();

  /* ---- the sheet ---------------------------------------------------------- */
  function pos(ev) {
    const r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (DRAW_W / r.width), y: (ev.clientY - r.top) * (DRAW_H / r.height) };
  }

  cv.addEventListener('mousedown', ev => {
    ev.stopPropagation();
    raise(made.win);
    if (ev.button !== 0) return;
    const p = pos(ev);
    push();
    tro.mark(sess.tool, layers.active, sess.hex, EXTRA);
    if (sess.tool === 'fill') { stroke.fill(p.x | 0, p.y | 0); layers.redraw(); Snd.page(); return; }
    drawing = true;
    stroke.begin();
    lastX = p.x; lastY = p.y; lastT = performance.now();
    stroke.seg(p.x, p.y, p.x + 0.01, p.y, 0);
    layers.redraw();
  });
  const L = scopedListeners(made.win);
  L.on(window, 'mousemove', ev => {
    if (!drawing) return;
    const p = pos(ev);
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const speed = Math.hypot(p.x - lastX, p.y - lastY) / dt;
    stroke.seg(lastX, lastY, p.x, p.y, speed);
    layers.redraw();
    lastX = p.x; lastY = p.y; lastT = now;
    if (now - scratchT > 55) { scratchT = now; Snd.scratch(speed); }
  });
  L.on(window, 'mouseup', () => { drawing = false; panels.remember(); });
  L.on(window, 'keydown', ev => {
    if (!document.body.contains(cv)) return;
    if (document.activeElement && /input|textarea/i.test(document.activeElement.tagName)) return;
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      Snd.click();
      doUndo();
    }
  });

  /* ---- saving ------------------------------------------------------------ */
  function thumb() {
    const t = document.createElement('canvas');
    t.width = 160; t.height = 107;
    const tg = t.getContext('2d');
    tg.drawImage(cv, 0, 0, 160, 107);
    return t.toDataURL('image/jpeg', 0.6);
  }

  async function store(name) {
    const full = cv.toDataURL('image/jpeg', 0.78);
    const rec = current || { id: 'd' + Date.now().toString(36), name: name, t: Date.now() };
    rec.name = name;
    rec.t = Date.now();
    rec.thumb = thumb();
    /* the picture itself goes in the vault the machine already had; only the key travels in the JSON that localStorage holds */
    const key = await Vault.putData(full, rec.vault || null);
    if (key) { rec.vault = key; delete rec.data; }
    else { rec.data = full; }
    if (!current) Crayon.st.items.push(rec);
    current = rec;
    Crayon.st.seq = (Crayon.st.seq || 1) + 1;
    Crayon.save(); tro.saved(Crayon.st.items.length);
    made.title.textContent = 'DRAW.EXE  --  ' + name;
    Snd.save();
    toast('SAVED TO MY DRAWINGS: ' + name);
    window.dispatchEvent(new Event('crayon-saved'));
  }

  function save() {
    if (!current && Crayon.st.items.length >= DRAW_CAP) {
      sysDialog('DISK FULL', 'MY DRAWINGS HOLDS ' + DRAW_CAP + ' SHEETS AND HOLDS ' +
        Crayon.st.items.length + '.\n\nTHROW ONE AWAY BEFORE YOU MAKE ANOTHER.');
      return;
    }
    if (!current && Crayon.st.items.length === DRAW_CAP - 1) {
      toast('THAT IS THE LAST SHEET IN THE DRAWER.');
    }
    const def = current ? current.name : 'UNTITLED-' + String(Crayon.st.seq || 1).padStart(2, '0');
    askName('SAVE DRAWING', def, n => {
      const name = (n || def).trim().toUpperCase().slice(0, 22) || def;
      store(name);
    });
  }

  function exportPng() {
    try {
      const a = document.createElement('a');
      a.download = ((current && current.name) || 'DRAWING') + '.png';
      a.href = cv.toDataURL('image/png');
      a.click();
      toast('WRITTEN TO YOUR DOWNLOADS.'); tro.exported();
    } catch (e) { toast('THE BROWSER WOULD NOT LET GO OF IT.'); }
  }

  made.loadInto = async function (rec) {
    let src = rec.data;
    if (!src && rec.vault) src = await VaultURL.url(rec.vault);
    if (!src) { toast('THAT SHEET IS GONE.'); return; }
    const img = new Image();
    img.onload = () => {
      push();
      layers.reset();
      g().drawImage(makePaper(), 0, 0);
      g().drawImage(img, 0, 0, DRAW_W, DRAW_H);
      layers.redraw(); sess.emit('layers');
      current = rec; tro.begin(true);
      made.title.textContent = 'DRAW.EXE  --  ' + rec.name;
    };
    img.src = src;
  };

  newSheet();
  panels.restore();
  if (loadItem && (loadItem.vault || loadItem.data)) made.loadInto(loadItem);       /* the window opened with nothing in it is a new sheet */
  lampDip();
  }
};
