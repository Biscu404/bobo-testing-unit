import { createWindow, raise, sysDialog, toast, askName, openWindow } from '../../kernel/wm.js';
import { Snd } from '../../kernel/snd.js';
import { Cos } from '../../kernel/cos.js';
import { fs as vfs } from '../../kernel/vfs.js';
import { lampDip } from '../../kernel/hardware.js';
import { Vault, VaultURL } from '../../kernel/vault.js';
import { scopedListeners } from '../lifecycle.js';
import { BRUSHES } from './brushes.js';
import { createLayers, MAX_LAYERS } from './layers.js';
import { CRAYON } from '../../kernel/cos_data.js';
import { createCalls } from './trophy_calls.js';


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
  let cv, g, root, sizeBtns = [], toolBtns = [], swatchEls = [];
  let color = 3, colorHex = CRAYON_PAL[3].c, size = 1, tool = 'crayon';
  const tro = createCalls(CRAYON_PAL.map(p => p.c)), EXTRA = CRAYON.filter(c => c.kind === 'brush').map(c => c.id);
  let wheelH = 0, wheelS = 0, wheelV = 1;
  const SIZES = [4, 9, 17];
  let drawing = false, lastX = 0, lastY = 0, lastT = 0, lastW = SIZES[1];
  let undo = [], scratchT = 0;
  let current = null;         /* the saved record this canvas came from */
  let layers = null, strokeState = {}, lockEls = [], layerEls = [];
  const owns = id => Cos.has('crayon', id);
  const toDave = what => { Snd.deny(); toast('DAVE SELLS ' + what + '.'); openWindow('shop', { tab: 'crayon' }).catch(() => {}); };

  const made = createWindow({
    kind: 'app', title: 'DRAW.EXE', w: 800, h: 600, appId: 'crayon',
    build: body => {
      const wl = scopedListeners(body);
      root = document.createElement('div');
      root.className = 'drawroot';

      const tools = document.createElement('div');
      tools.className = 'drawtools';

      const sw = document.createElement('div');
      sw.className = 'drawswatch';
      CRAYON_PAL.forEach((p, i) => {
        const el = document.createElement('i');
        el.style.background = p.c;
        el.title = p.n;
        el.className = (i === color) ? 'on' : '';
        el.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          color = i; colorHex = p.c;
          swatchEls.forEach((e, k) => e.classList.toggle('on', k === i));
          if (wheelDot) wheelDot.style.display = 'none';
          if (tool === 'eraser') setTool('crayon');
          Snd.click();
        });
        swatchEls.push(el);
        sw.appendChild(el);
      });
      tools.appendChild(sw);

      /* ---- the wheel: a blocky hue/saturation disc, plus a brightness
         strip underneath it, for any colour the seven swatches don't have */
      const wheelWrap = document.createElement('div');
      wheelWrap.className = 'drawwheel';
      const wheelCv = document.createElement('canvas');
      const WN = 17, WCELL = 5;
      wheelCv.width = wheelCv.height = WN * WCELL;
      wheelCv.className = 'wheelcv';
      const wheelDot = document.createElement('div');
      wheelDot.className = 'wheeldot';
      wheelDot.style.display = 'none';
      const briteCv = document.createElement('canvas');
      briteCv.width = WN * WCELL; briteCv.height = 8;
      briteCv.className = 'britecv';
      const wheelBox = document.createElement('div');
      wheelBox.className = 'wheelbox';
      wheelBox.appendChild(wheelCv); wheelBox.appendChild(wheelDot);
      wheelWrap.appendChild(wheelBox);
      wheelWrap.appendChild(briteCv);
      tools.appendChild(wheelWrap);

      function hsvToHex(h, s, v) {
        const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
        let r, gg, b;
        if (h < 60) [r, gg, b] = [c, x, 0];
        else if (h < 120) [r, gg, b] = [x, c, 0];
        else if (h < 180) [r, gg, b] = [0, c, x];
        else if (h < 240) [r, gg, b] = [0, x, c];
        else if (h < 300) [r, gg, b] = [x, 0, c];
        else [r, gg, b] = [c, 0, x];
        const R = Math.round((r + m) * 255), G = Math.round((gg + m) * 255), B = Math.round((b + m) * 255);
        return '#' + [R, G, B].map(v2 => v2.toString(16).padStart(2, '0')).join('');
      }
      const wg = wheelCv.getContext('2d');
      wg.imageSmoothingEnabled = false;
      for (let cy = 0; cy < WN; cy++) {
        for (let cx = 0; cx < WN; cx++) {
          const dx = (cx - (WN - 1) / 2) / ((WN - 1) / 2);
          const dy = (cy - (WN - 1) / 2) / ((WN - 1) / 2);
          const r = Math.sqrt(dx * dx + dy * dy);
          if (r > 1.04) continue;
          const h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
          wg.fillStyle = hsvToHex(h, Math.min(1, r), 1);
          wg.fillRect(cx * WCELL, cy * WCELL, WCELL, WCELL);
        }
      }
      function paintBrite() {
        const bg = briteCv.getContext('2d');
        bg.imageSmoothingEnabled = false;
        const steps = 24;
        for (let i = 0; i < steps; i++) {
          bg.fillStyle = hsvToHex(wheelH, wheelS, i / (steps - 1));
          bg.fillRect(Math.round(i * briteCv.width / steps), 0, Math.ceil(briteCv.width / steps), 8);
        }
      }
      paintBrite();
      function pickFromWheel(ev) {
        const r = wheelCv.getBoundingClientRect();
        const cx = (ev.clientX - r.left) / r.width * WN - (WN - 1) / 2 - 0.5;
        const cy = (ev.clientY - r.top) / r.height * WN - (WN - 1) / 2 - 0.5;
        const rad = Math.sqrt(cx * cx + cy * cy) / ((WN - 1) / 2);
        if (rad > 1.15) return false;
        wheelH = ((Math.atan2(cy, cx) * 180 / Math.PI) + 360) % 360;
        wheelS = Math.min(1, rad);
        colorHex = hsvToHex(wheelH, wheelS, wheelV);
        color = -1;
        swatchEls.forEach(e => e.classList.remove('on'));
        wheelDot.style.display = 'block';
        wheelDot.style.left = (50 + Math.cos(wheelH * Math.PI / 180) * wheelS * 50) + '%';
        wheelDot.style.top = (50 + Math.sin(wheelH * Math.PI / 180) * wheelS * 50) + '%';
        wheelDot.style.background = colorHex;
        paintBrite();
        if (tool === 'eraser') setTool('crayon');
        return true;
      }
      let wheelDrag = false;
      wheelCv.addEventListener('mousedown', ev => { ev.stopPropagation(); if (pickFromWheel(ev)) { wheelDrag = true; Snd.click(); } });
      wl.on(window, 'mousemove', ev => { if (wheelDrag) pickFromWheel(ev); });
      wl.on(window, 'mouseup', () => { wheelDrag = false; });
      briteCv.addEventListener('mousedown', ev => {
        ev.stopPropagation();
        const r = briteCv.getBoundingClientRect();
        wheelV = Math.max(0.08, Math.min(1, (ev.clientX - r.left) / r.width));
        colorHex = hsvToHex(wheelH, wheelS, wheelV);
        color = -1;
        swatchEls.forEach(e => e.classList.remove('on'));
        wheelDot.style.display = 'block';
        wheelDot.style.background = colorHex;
        if (tool === 'eraser') setTool('crayon');
        Snd.click();
      });

      const hd = t => { const d = document.createElement('div'); d.className = 'hd'; d.textContent = t; tools.appendChild(d); };

      hd('TOOL');
      [['crayon', 'CRAYON'], ['marker', 'MARKER'], ['pencil', 'PENCIL'], ['spray', 'SPRAY'],
       ['eraser', 'ERASER'], ['fill', 'FILL']].forEach(t => {
        const b = document.createElement('button');
        b.className = 'tl' + (t[0] === tool ? ' on' : '');
        b.textContent = t[1];
        b.dataset.tool = t[0];
        b.addEventListener('mousedown', ev => { ev.stopPropagation(); setTool(t[0]); Snd.click(); });
        toolBtns.push(b);
        tools.appendChild(b);
      });
      /* what Dave sells: shown for everybody, so it can be found; dim until it is bought, and then it is a tool like the others */
      CRAYON.filter(c => c.kind === 'brush').forEach(c => {
        const b = document.createElement('button');
        b.className = 'tl';
        b.textContent = c.name;
        b.dataset.tool = c.id;
        b.title = c.blurb;
        b.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          if (!owns(c.id)) { toDave('THE ' + c.name + ' FOR ' + c.price + ' SUN'); return; }
          setTool(c.id); Snd.click();
        });
        toolBtns.push(b); lockEls.push([b, c]);
        tools.appendChild(b);
      });

      hd('LAYERS');
      const layerBox = document.createElement('div');
      layerBox.className = 'drawlayers';
      for (let i = 0; i < MAX_LAYERS; i++) {
        const row = document.createElement('div');
        row.className = 'lyrow';
        const pick = document.createElement('button'); pick.className = 'tl lypick';
        const eye = document.createElement('button'); eye.className = 'tl lyeye'; eye.textContent = 'ON';
        pick.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          const c = CRAYON.find(x => x.id === 'layer' + (i + 1));
          if (i > 0 && !owns(c.id)) { toDave('LAYER ' + (i + 1) + ' FOR ' + c.price + ' SUN'); return; }
          g = layers.setActive(i); refreshLayers(); Snd.click();
        });
        eye.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          if (i === 0 || !owns('layer' + (i + 1))) return;
          layers.toggle(i); layers.redraw(); refreshLayers(); Snd.click();
        });
        row.appendChild(pick); if (i > 0) row.appendChild(eye);
        layerBox.appendChild(row); layerEls.push({ pick, eye, row });
      }
      tools.appendChild(layerBox);
      const lyBtn = (label, fn) => { const b = document.createElement('button'); b.className = 'tl'; b.textContent = label; b.addEventListener('mousedown', ev => { ev.stopPropagation(); fn(); }); tools.appendChild(b); return b; };
      lyBtn('CLEAR LAYER', () => {
        const i = layers.active;
        if (i === 0) { toast('THE SHEET HAS NEW. THIS ONE IS THE PAPER.'); return; }
        push(); layers.clear(i); layers.redraw(); Snd.page();
      });
      lyBtn('MERGE DOWN', () => {
        const i = layers.active;
        if (i === 0) { toast('NOTHING UNDER THE PAPER.'); return; }
        push(); layers.mergeDown(i); g = layers.setActive(i - 1); layers.redraw(); refreshLayers(); Snd.page();
      });

      hd('SIZE');
      ['SMALL', 'MEDIUM', 'LARGE'].forEach((n, i) => {
        const b = document.createElement('button');
        b.className = 'tl' + (i === size ? ' on' : '');
        b.textContent = n;
        b.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          size = i;
          sizeBtns.forEach((e, k) => e.classList.toggle('on', k === i));
          Snd.click();
        });
        sizeBtns.push(b);
        tools.appendChild(b);
      });

      hd('SHEET');
      const mk = (label, fn) => {
        const b = document.createElement('button');
        b.className = 'tl';
        b.textContent = label;
        b.addEventListener('mousedown', ev => { ev.stopPropagation(); Snd.click(); fn(); });
        tools.appendChild(b);
        return b;
      };
      mk('UNDO', doUndo);
      mk('NEW', newSheet);
      mk('SAVE', save);
      mk('EXPORT PNG', exportPng);
      mk('BACKGROUND', () => import('../../kernel/wallpaper.js').then(m => { m.setWallpaperFromSrc(cv.toDataURL('image/png'), 'fill'); tro.background(); }));
      mk('DRAWINGS', () => openWindow('drawings').catch(() => {}));

      const wrap = document.createElement('div');
      wrap.className = 'drawwrap';
      cv = document.createElement('canvas');
      cv.width = DRAW_W; cv.height = DRAW_H;
      cv.className = 'drawcv';
      wrap.appendChild(cv);

      root.appendChild(tools);
      root.appendChild(wrap);
      body.appendChild(root);
    }
  });
  drawWin = made;
  const cg = cv.getContext('2d', { willReadFrequently: true });
  if (!cg) return;
  layers = createLayers(DRAW_W, DRAW_H, cg);
  g = layers.ctx();

  /* which tools and layers are Dave's and not yet yours */
  function refreshLayers() {
    lockEls.forEach(([b, c]) => { const have = owns(c.id); b.classList.toggle('locked', !have); b.title = have ? c.blurb : c.blurb + '  --  ' + c.price + ' SUN AT DAVE\'S'; });
    layerEls.forEach((e, i) => {
      const c = CRAYON.find(x => x.id === 'layer' + (i + 1)), have = i === 0 || owns(c.id);
      e.pick.textContent = i === 0 ? 'SHEET' : 'LAYER ' + (i + 1);
      e.pick.title = have ? '' : c.blurb + '  --  ' + c.price + ' SUN AT DAVE\'S';
      e.pick.classList.toggle('locked', !have);
      e.pick.classList.toggle('on', have && layers.active === i);
      e.eye.textContent = layers.visible(i) ? 'ON' : 'OFF';
      e.eye.classList.toggle('locked', !have);
    });
  }
  refreshLayers();
  const L0 = scopedListeners(made.win);
  L0.on(window, 'cos-changed', () => { if (!document.body.contains(cv)) return; refreshLayers(); });

  function setTool(t) {
    tool = t;
    toolBtns.forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  }

  function newSheet() {
    layers.reset();
    g = layers.ctx();
    g.drawImage(makePaper(), 0, 0);
    layers.redraw();
    refreshLayers();
    undo = [];
    current = null; tro.begin(false);
    made.title.textContent = 'DRAW.EXE';
  }

  function push() {
    try { undo.push({ li: layers.active, img: g.getImageData(0, 0, DRAW_W, DRAW_H) }); } catch (e) { return; }
    if (undo.length > 24) undo.shift();
  }
  function doUndo() {
    const s = undo.pop();
    if (!s) { toast('NOTHING LEFT TO TAKE BACK.'); return; }
    g = layers.setActive(s.li);
    g.putImageData(s.img, 0, 0);
    layers.redraw(); refreshLayers();
  }

  /* ---- the stroke -------------------------------------------------------
     A grain of wax, stamped. Every dot is offset by a random amount inside
     the nib, drawn at a random alpha, and skipped one time in six, which is
     what gives the edge its bite and the drag its texture.
     ====================================================================== */
  function stamp(x, y, w, col, alpha) {
    const n = Math.max(5, Math.round(w * 2.4));
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.11) continue;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (w / 2);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      g.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
      g.fillStyle = col;
      const s = 1 + (Math.random() < 0.3 ? 1 : 0);
      g.fillRect(px | 0, py | 0, s, s);
    }
    g.globalAlpha = 1;
  }

  function seg(x0, y0, x1, y1, speed) {
    const base = SIZES[size];
    /* speed arrives in pixels per millisecond: a considered line is under
       one, a flick is three or more. Fast goes thin and faint, slow goes
       dense, and the whole range has to sit inside a normal hand. */
    const fast = Math.min(1, speed / 2.4);
    const dx = x1 - x0, dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (BRUSHES[tool]) {
      BRUSHES[tool](g, { x0, y0, x1, y1, dist, fast, base, col: colorHex, s: strokeState });
      lastW = base;
      return;
    }

    if (tool === 'eraser') {
      const w = Math.max(3, base * (1 - fast * 0.45));
      const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.3)));
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        const jx = (Math.random() - 0.5) * w * 0.22, jy = (Math.random() - 0.5) * w * 0.22;
        const px = x0 + dx * t + jx, py = y0 + dy * t + jy;
        /* the eraser has the same texture and reveals paper, not white */
        const n = Math.max(4, Math.round(w * 1.8));
        for (let k = 0; k < n; k++) {
          if (Math.random() < 0.12) continue;
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * (w / 2);
          const ex = (px + Math.cos(a) * r) | 0, ey = (py + Math.sin(a) * r) | 0;
          if (layers.active === 0) g.drawImage(makePaper(), ex, ey, 2, 2, ex, ey, 2, 2);
          else { g.globalCompositeOperation = 'destination-out'; g.fillRect(ex, ey, 2, 2); g.globalCompositeOperation = 'source-over'; }
        }
      }
      lastW = w;
      return;
    }

    if (tool === 'marker') {
      /* flat and opaque, almost no grain -- a wide felt tip, not wax */
      const w = Math.max(5, base * 1.1);
      const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.4)));
      g.globalAlpha = 0.92 - fast * 0.1;
      g.fillStyle = colorHex;
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        g.beginPath(); g.arc(x0 + dx * t, y0 + dy * t, w / 2, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      lastW = w;
      return;
    }

    if (tool === 'pencil') {
      /* thin and crisp: small jitter, a hard rather than waxy edge */
      const w = Math.max(1, base * 0.3);
      const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.5)));
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        const px = x0 + dx * t + (Math.random() - 0.5) * 0.4, py = y0 + dy * t + (Math.random() - 0.5) * 0.4;
        stamp(px, py, w, colorHex, 0.85 - fast * 0.2);
      }
      lastW = w;
      return;
    }

    if (tool === 'spray') {
      /* a scatter of single pixels over a much wider radius than the nib */
      const w = Math.max(12, base * 2.4);
      const stepN = Math.max(1, Math.ceil(dist / 3));
      g.fillStyle = colorHex;
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        const px = x0 + dx * t, py = y0 + dy * t;
        for (let k = 0; k < 6; k++) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (w / 2);
          g.globalAlpha = 0.45 + Math.random() * 0.3;
          g.fillRect((px + Math.cos(a) * r) | 0, (py + Math.sin(a) * r) | 0, 1, 1);
        }
      }
      g.globalAlpha = 1;
      lastW = w;
      return;
    }

    /* crayon: waxy grain, the machine's default nib */
    const w = Math.max(3, base * (1 - fast * 0.45));
    const alpha = 0.96 - fast * 0.34;
    const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.3)));
    for (let i = 0; i <= stepN; i++) {
      const t = i / stepN;
      const jx = (Math.random() - 0.5) * w * 0.22;
      const jy = (Math.random() - 0.5) * w * 0.22;
      const px = x0 + dx * t + jx, py = y0 + dy * t + jy;
      stamp(px, py, w, colorHex, alpha);
    }
    lastW = w;
  }

  /* a flood fill with a deliberately ragged edge: the frontier stops one
     pixel early about a third of the time, so the boundary is not a machine
     line but something that was coloured in */
  function fill(sx, sy) {
    const img = g.getImageData(0, 0, DRAW_W, DRAW_H);
    const d = img.data;
    const at = (x, y) => (y * DRAW_W + x) * 4;
    const s = at(sx, sy);
    const t = [d[s], d[s + 1], d[s + 2]], ta = d[s + 3];
    const hex = colorHex;
    const nc = [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
    if (ta === 255 && Math.abs(t[0] - nc[0]) + Math.abs(t[1] - nc[1]) + Math.abs(t[2] - nc[2]) < 12) return;
    /* the tolerance itself is jittered, so the frontier stops unevenly and
       the boundary comes out hand-coloured rather than machine-cut. Jitter
       the FRONTIER, never the interior: a random skip inside the region
       leaves unfilled speckles, which is a bug and not a texture. */
    const near = i => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) + Math.abs(d[i + 3] - ta) * 2
      < 46 + (Math.random() * 22 - 11);
    const seen = new Uint8Array(DRAW_W * DRAW_H);
    const q = [sy * DRAW_W + sx];
    seen[q[0]] = 1;
    let head = 0;
    while (head < q.length) {
      const p = q[head++];
      const x = p % DRAW_W, y = (p / DRAW_W) | 0;
      const i = p * 4;
      const jit = (Math.random() * 13 - 6) | 0;
      d[i] = Math.max(0, Math.min(255, nc[0] + jit));
      d[i + 1] = Math.max(0, Math.min(255, nc[1] + jit));
      d[i + 2] = Math.max(0, Math.min(255, nc[2] + jit));
      d[i + 3] = 255;
      const push = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= DRAW_W || ny >= DRAW_H) return;
        const np = ny * DRAW_W + nx;
        if (seen[np]) return;
        if (!near(np * 4)) { seen[np] = 1; return; }
        seen[np] = 1;
        q.push(np);
      };
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    g.putImageData(img, 0, 0);
  }

  function pos(ev) {
    const r = cv.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (DRAW_W / r.width),
      y: (ev.clientY - r.top) * (DRAW_H / r.height)
    };
  }

  cv.addEventListener('mousedown', ev => {
    ev.stopPropagation();
    if (ev.button !== 0) return;
    const p = pos(ev);
    push();
    tro.mark(tool, layers.active, colorHex, EXTRA);
    if (tool === 'fill') { fill(p.x | 0, p.y | 0); layers.redraw(); Snd.page(); return; }
    drawing = true;
    strokeState = {};
    lastX = p.x; lastY = p.y; lastT = performance.now();
    seg(p.x, p.y, p.x + 0.01, p.y, 0);
    layers.redraw();
  });
  const L = scopedListeners(made.win);
  L.on(window, 'mousemove', ev => {
    if (!drawing) return;
    const p = pos(ev);
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const dist = Math.hypot(p.x - lastX, p.y - lastY);
    const speed = dist / dt;
    seg(lastX, lastY, p.x, p.y, speed);
    layers.redraw();
    lastX = p.x; lastY = p.y; lastT = now;
    if (now - scratchT > 55) { scratchT = now; Snd.scratch(speed); }
  });
  L.on(window, 'mouseup', () => { drawing = false; });
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
    /* the picture itself goes in the vault the machine already had; only the
       key travels in the JSON that localStorage holds */
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
      layers.reset(); g = layers.ctx();
      g.drawImage(makePaper(), 0, 0);
      g.drawImage(img, 0, 0, DRAW_W, DRAW_H);
      layers.redraw(); refreshLayers();
      current = rec; tro.begin(true);
      made.title.textContent = 'DRAW.EXE  --  ' + rec.name;
    };
    img.src = src;
  };

  newSheet();
  if (loadItem) made.loadInto(loadItem);
  lampDip();
  }
};