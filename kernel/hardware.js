import { Style, Rage } from "./style.js";
import { Snd } from "./snd.js";
import { degauss, paintPurity } from "./degauss.js";
export { degauss };
export const CRT = {
  lens: 1,
  scan: 2,
  phos: 0,
  burn: false,
  on: false,
  mus: 0,
  sfx: 0,
  lobby: false,
  vhold: 5,
  hhold: 5
};

/* Vol is CRT under another name: every knob that touches sound or hold
   lives on the same object, but music.js/style.js/hold.js were written
   against a "Vol" import, so keep both names pointing at it. */
export const Vol = CRT;
window.CRT = CRT;

export const DISP = { scan: true, band: true, vig: true };
window.DISP = DISP;

const LENS_NAME = ['FLAT', 'SOFT', 'FULL'];
/* The LENS button is disabled: every machine runs at SOFT, the curve it shipped with, whatever an old save says. */
const LENS_LOCK = 1;
const PHOS_NAME = ['P1', 'P4', 'P7'];
const LENS_BOW = [0.0, 0.08, 0.22];
/* P1 decays in microseconds (crisp, no bloom); P7 smears for a while
   (bright pixels glow/bleed into their neighbors). */
const PHOS_GLOW = [0, 0.45, 1];

export function phosLevel() {
  return PHOS_GLOW[CRT.phos || 0];
}

export function splashGone() {
  const sp = document.getElementById('splash');
  return !!sp && sp.style.display === 'none';
}

export function sfxGain() { return Math.pow(CRT.sfx / 10, 1.6) * 1.25; }
export function musGain() { return Math.pow(CRT.mus / 10, 1.6) * 0.85; }

/* the lamp browns out for a fifth of a second whenever an app takes power */
let lampT = null;
export function lampDip() {
  const l = document.getElementById('lamp');
  if (!l) return;
  l.classList.add('dip');
  clearTimeout(lampT);
  lampT = setTimeout(() => l.classList.remove('dip'), 200);
}

export function initHardware() {
  loadCRT();
  loadDisp();
  labelKnobs();
  wireChin();
  paintGlass();
  applyBand();
  applyPhosphor();
  applyBurn();
  applyLensShape();
  window.addEventListener("resize", () => { clearTimeout(window._crtT); window._crtT = setTimeout(paintGlass, 100); });
}

function loadDisp() {
  try {
    const raw = localStorage.getItem('templeos.display.v1');
    if (raw) Object.assign(DISP, JSON.parse(raw));
  } catch (e) {}
}

/* the refresh band: one pale bar crawling down the tube every twelve
   seconds, the way a phone camera sees a CRT it is not synced to */
function applyBand() {
  const scr = document.getElementById('screen');
  if (!scr) return;
  let b = document.getElementById('refband');
  if (!b) {
    b = document.createElement('div');
    b.id = 'refband';
    b.setAttribute('aria-hidden', 'true');
    scr.appendChild(b);
  }
  b.style.display = DISP.band ? 'block' : 'none';
}

export function applyDisplay() {
  applyBand();
  paintGlass();
  try { localStorage.setItem('templeos.display.v1', JSON.stringify(DISP)); } catch (e) {}
}

function labelKnobs() {
  const g = document.getElementById('k-lens'); if(g) g.textContent = 'LENS: ' + (CRT.lens===0 ? 'FLAT' : CRT.lens===1 ? 'SOFT' : 'FULL');
  const s = document.getElementById('k-scan'); if(s) s.textContent = 'SCAN: ' + (CRT.scan===5 ? 'OFF' : CRT.scan);
  const p = document.getElementById('k-phos'); if(p) p.textContent = 'PHOS: P' + (CRT.phos===0 ? '1' : CRT.phos===1 ? '4' : '7');
  const b = document.getElementById('k-burn'); if(b) b.textContent = 'BURN: ' + (CRT.burn ? 'ON' : 'OFF');
}

function saveCRT() {
  try { localStorage.setItem('templeos.crt.v1', JSON.stringify(CRT)); } catch (e) {}
}

function loadCRT() {
  try {
    const raw = localStorage.getItem('templeos.crt.v1');
    if (raw) Object.assign(CRT, JSON.parse(raw));
  } catch (e) {}
  CRT.lens = LENS_LOCK;
  delete CRT.dgauss;   /* DEGAUSS was a button once; it is permanent now (kernel/degauss.js) */
  CRT.on = true;
  CRT.vhold = CRT.vhold ?? 5;
  CRT.hhold = CRT.hhold ?? 5;
  CRT.scan = CRT.scan ?? 2;
}

/* PHOS is persistence, not paint: it sets how far bright pixels bloom/smear
   into a glow, not what color anything is. Scoped to the screen content
   (#tube) only, so it never reaches the physical case/badge outside it. */
function applyPhosphor() {
  const tube = document.getElementById('tube');
  if (!tube) return;
  tube.style.setProperty('--phos-px', (phosLevel() * 5).toFixed(2) + 'px');
}
function applyHold() {
  if (window.Hold) window.Hold.apply();
}

function applyBurn() {
  const root = document.documentElement;
  if (CRT.burn) root.classList.add('burn');
  else root.classList.remove('burn');
}

function lensInset() { const k = LENS_BOW[CRT.lens]; return k / (1 - k); }

function applyLensShape() {
  const t = document.getElementById('tube');
  if (!t) return;
  if (CRT.lens === 0) {
    t.style.borderRadius = '0';
    document.documentElement.style.setProperty('--inset', '0');
    return;
  }
  const f = CRT.lens === 1 ? '10%' : '18%';
  t.style.borderRadius = `50% / ${f}`;
  document.documentElement.style.setProperty('--inset', CRT.lens === 1 ? '2%' : '4%');
}

function paintGlass() {
  const cv = document.getElementById('glass');
  const screen = document.getElementById('screen');
  if (!cv || !screen) return;
  const r = screen.getBoundingClientRect();
  if (!r.width || !r.height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.round(r.width), H = Math.round(r.height);
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';

  const g = cv.getContext('2d');
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const k = 0.010 + LENS_BOW[CRT.lens];
  const norm = 1 - k;
  const toScreen = (u, v) => {
    const m = (1 - (u * u + v * v) * k) / norm;
    return [(u * m + 1) / 2 * W, (v * m + 1) / 2 * H];
  };

  g.lineWidth = 1;
  g.strokeStyle = 'rgba(0,0,0,0.34)';
  const steps = 34;
  if (DISP.scan) {
    for (let y = 0; y < H; y += CRT.scan + 1) {
      const v = (y / H) * 2 - 1;
      g.beginPath();
      for (let s = 0; s <= steps; s++) {
        const u = (s / steps) * 2 - 1;
        const p = toScreen(u, v);
        if (s === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
      }
      g.stroke();
    }
  }

  g.globalAlpha = 0.055;
  for (let x = 0; x < W; x += 3) {
    g.fillStyle = ['#FF0000', '#00FF00', '#0000FF'][(x / 3) % 3];
    g.fillRect(x, 0, 1, H);
  }
  g.globalAlpha = 1;

  const fringe = g.createLinearGradient(0, 0, W, 0);
  fringe.addColorStop(0,    'rgba(255,60,60,0.10)');
  fringe.addColorStop(0.14, 'rgba(255,60,60,0)');
  fringe.addColorStop(0.86, 'rgba(60,140,255,0)');
  fringe.addColorStop(1,    'rgba(60,140,255,0.10)');
  g.fillStyle = fringe;
  g.fillRect(0, 0, W, H);
  paintPurity(g, W, H);

  if (DISP.vig) {
    const vig = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28,
                                       W / 2, H / 2, Math.max(W, H) * 0.78);
    vig.addColorStop(0,    'rgba(0,0,0,0)');
    vig.addColorStop(0.62, 'rgba(0,0,0,0.16)');
    vig.addColorStop(1,    'rgba(0,0,0,0.82)');
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);
  }

  g.save();
  g.translate(W * 0.30, H * 0.20);
  g.rotate(-0.42);
  const gl = g.createRadialGradient(0, 0, 0, 0, 0, Math.max(W, H) * 0.42);
  gl.addColorStop(0,   'rgba(255,255,255,0.085)');
  gl.addColorStop(0.5, 'rgba(255,255,255,0.028)');
  gl.addColorStop(1,   'rgba(255,255,255,0)');
  g.fillStyle = gl;
  g.scale(1, 0.42);
  g.beginPath();
  g.arc(0, 0, Math.max(W, H) * 0.42, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function setLobby(on) {
  CRT.lobby = !!on;
  const sw = document.getElementById('lobby');
  if (sw) {
    sw.classList.toggle('on', CRT.lobby);
    sw.setAttribute('aria-checked', CRT.lobby ? 'true' : 'false');
  }
  saveCRT();
  if (window.Music && window.Music.sync) window.Music.sync();
  Rage.sync();
  if (window.Snd) {
    if (CRT.lobby && window.Snd.clackOn) window.Snd.clackOn();
    else if (!CRT.lobby && window.Snd.clackOff) window.Snd.clackOff();
  }
}

function wireChin() {

  wirePot('pot-mus', 'lbl-mus', 'MUS', v => {
    CRT.mus = v; saveCRT();
    if (window.Music && window.Music.sync) window.Music.sync();
    Rage.sync();
  });
  wirePot('pot-sfx', 'lbl-sfx', 'SFX', v => { CRT.sfx = v; saveCRT(); });
  wirePot('pot-vhold', 'lbl-vhold', 'VHLD', v => { CRT.vhold = v; saveCRT(); applyHold(); });
  wirePot('pot-hhold', 'lbl-hhold', 'HHLD', v => { CRT.hhold = v; saveCRT(); applyHold(); });

  const getEl = id => document.getElementById(id);

  const lobbySw = getEl('lobby');
  if (lobbySw) {
    lobbySw.classList.toggle('on', CRT.lobby);
    lobbySw.setAttribute('aria-checked', CRT.lobby ? 'true' : 'false');
    lobbySw.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (window.Snd && window.Snd.wake) window.Snd.wake();
      lobbySw.focus();
      setLobby(!CRT.lobby);
    });
    lobbySw.addEventListener('keydown', ev => {
      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); setLobby(!CRT.lobby); }
    });
  }

  /* LENS is disabled (see LENS_LOCK): a button that is shown, dimmed, and does nothing */
  const lens = getEl('k-lens');
  if (lens) { lens.disabled = true; lens.title = 'Tube curvature (locked)'; }

  if (getEl('k-scan')) getEl('k-scan').addEventListener('click', () => {
    CRT.scan = CRT.scan >= 4 ? 0 : CRT.scan + 1;
    labelKnobs();
    paintGlass();
    saveCRT();
    if (window.Snd && window.Snd.click) window.Snd.click();
  });
  
  if (getEl('k-phos')) getEl('k-phos').addEventListener('click', () => {
    CRT.phos = ((CRT.phos || 0) + 1) % 3;
    labelKnobs();
    applyPhosphor();
    saveCRT();
    if (window.Snd && window.Snd.click) window.Snd.click();
  });
  
  if (getEl('k-burn')) getEl('k-burn').addEventListener('click', () => {
    CRT.burn = !CRT.burn;
    labelKnobs();
    applyBurn();
    saveCRT();
    if (window.Snd && window.Snd.click) window.Snd.click();
  });
  
  if (getEl('power')) getEl('power').addEventListener('click', () => {
    if (CRT.on) {
      if (window.Snd && window.Snd.thunk) window.Snd.thunk();
      if (window.Music && window.Music.stop) window.Music.stop();
      Style.reset();
      Rage.stop();
      if (window.powerOff) window.powerOff();
      saveCRT();
    } else {
      if (window.Snd && window.Snd.click) window.Snd.click();
      if (window.powerOn) window.powerOn();
      saveCRT();
    }
  });
}

function drawTicks(svg) {
  if (!svg) return;
  const n = 11;
  const rIn = 15;
  const rOut = 18;
  const cx = 20;
  const cy = 20;
  let html = '';
  for (let i = 0; i < n; i++) {
    const angle = Math.PI * 0.75 + (Math.PI * 1.5 * i) / (n - 1);
    const x1 = cx + rIn * Math.cos(angle);
    const y1 = cy + rIn * Math.sin(angle);
    const x2 = cx + rOut * Math.cos(angle);
    const y2 = cy + rOut * Math.sin(angle);
    html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#aaaaaa" stroke-width="1.5" />`;
  }
  svg.innerHTML = html;
}

function wirePot(id, lblId, name, write) {
  const el = document.getElementById(id);
  if (!el) return;
  const lbl = document.getElementById(lblId);
  drawTicks(el.querySelector('.ticks'));

  
  let pos = 5;
  if (id === 'pot-vhold') pos = CRT.vhold ?? 5;
  else if (id === 'pot-hhold') pos = CRT.hhold ?? 5;
  else if (id === 'pot-mus') pos = CRT.mus ?? 0;
  else if (id === 'pot-sfx') pos = CRT.sfx ?? 0;

  let turning = false, lastA = 0;

  function paint() {
    const step = Math.round(pos);
    el.style.setProperty('--deg', (-135 + (pos / 10) * 270).toFixed(1) + 'deg');
    el.setAttribute('aria-valuenow', String(step));
    if (lbl) lbl.textContent = name + ' ' + step;
  }

  function commit(next) {
    const clamped = Math.max(0, Math.min(10, next));
    const changed = Math.round(pos) !== Math.round(clamped);
    pos = clamped;
    paint();
    if (changed) {
      if (window.Snd && window.Snd.click) window.Snd.click();
      write(Math.round(pos));
    }
  }

  paint();

  const m2a = ev => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.atan2(ev.clientY - cy, ev.clientX - cx);
  };

  el.addEventListener('mousedown', ev => {
    ev.preventDefault();
    turning = true;
    lastA = m2a(ev);
    document.body.style.cursor = 'ew-resize';
  });
  el.addEventListener('wheel', ev => {
    ev.preventDefault();
    if (ev.deltaY < 0) commit(pos + 1);
    else if (ev.deltaY > 0) commit(pos - 1);
  });

  document.addEventListener('mousemove', ev => {
    if (!turning) return;
    const a = m2a(ev);
    let delta = (a - lastA) * 180 / Math.PI;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastA = a;
    commit(pos + delta / 27);
  });

  document.addEventListener('mouseup', () => {
    if (turning) {
      turning = false;
      document.body.style.cursor = '';
    }
  });

  el.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { ev.preventDefault(); commit(pos + 1); }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { ev.preventDefault(); commit(pos - 1); }
  });
}

/* the glass breathes: three per cent over seven seconds, set a few times a second rather than animated (see #glass in theme.css) */
(function hum() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now();
  setInterval(() => {
    const g = document.getElementById('glass');
    if (g) g.style.setProperty('--hum', (0.985 + 0.015 * Math.sin((performance.now() - t0) / 7000 * Math.PI * 2)).toFixed(3));
  }, 400);
})();
