/* The COLOUR panel: the seven swatches, and a blocky hue/saturation wheel with a brightness strip under it for any colour the swatches don't have. Its own window
   (panels.js), so it can stand anywhere on the desktop; it knows the sheet only through the session (session.js). */
import { scopedListeners, whenGone } from '../lifecycle.js';

const WN = 17, WCELL = 5;

export function hsvToHex(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return '#' + [r + m, g + m, b + m].map(u => Math.round(u * 255).toString(16).padStart(2, '0')).join('');
}

export function buildColour(body, sess, env) {
  const wl = scopedListeners(body);
  const box = document.createElement('div');
  box.className = 'drawtools drawpanel';
  body.appendChild(box);

  const sw = document.createElement('div');
  sw.className = 'drawswatch';
  const swatchEls = sess.palette.map((p, i) => {
    const el = document.createElement('i');
    el.style.background = p.c;
    el.title = p.n;
    el.addEventListener('mousedown', ev => { ev.stopPropagation(); sess.pickSwatch(i); env.click(); });
    sw.appendChild(el);
    return el;
  });
  box.appendChild(sw);

  const wheelWrap = document.createElement('div');
  wheelWrap.className = 'drawwheel';
  const wheelCv = document.createElement('canvas');
  wheelCv.width = wheelCv.height = WN * WCELL;
  wheelCv.className = 'wheelcv';
  const wheelDot = document.createElement('div');
  wheelDot.className = 'wheeldot';
  const briteCv = document.createElement('canvas');
  briteCv.width = WN * WCELL; briteCv.height = 8;
  briteCv.className = 'britecv';
  const wheelBox = document.createElement('div');
  wheelBox.className = 'wheelbox';
  wheelBox.appendChild(wheelCv); wheelBox.appendChild(wheelDot);
  wheelWrap.appendChild(wheelBox);
  wheelWrap.appendChild(briteCv);
  box.appendChild(wheelWrap);

  const wg = wheelCv.getContext('2d');
  wg.imageSmoothingEnabled = false;
  for (let cy = 0; cy < WN; cy++) {
    for (let cx = 0; cx < WN; cx++) {
      const dx = (cx - (WN - 1) / 2) / ((WN - 1) / 2), dy = (cy - (WN - 1) / 2) / ((WN - 1) / 2);
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1.04) continue;
      wg.fillStyle = hsvToHex(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360, Math.min(1, r), 1);
      wg.fillRect(cx * WCELL, cy * WCELL, WCELL, WCELL);
    }
  }
  const paintBrite = () => {
    const bg = briteCv.getContext('2d'), steps = 24, w = sess.wheel;
    bg.imageSmoothingEnabled = false;
    for (let i = 0; i < steps; i++) {
      bg.fillStyle = hsvToHex(w.h, w.s, i / (steps - 1));
      bg.fillRect(Math.round(i * briteCv.width / steps), 0, Math.ceil(briteCv.width / steps), 8);
    }
  };

  /* what is lit follows the session, whoever changed it */
  const show = () => {
    swatchEls.forEach((e, k) => e.classList.toggle('on', k === sess.swatch));
    const w = sess.wheel;
    wheelDot.style.display = w.on ? 'block' : 'none';
    if (w.on) {
      wheelDot.style.left = (50 + Math.cos(w.h * Math.PI / 180) * w.s * 50) + '%';
      wheelDot.style.top = (50 + Math.sin(w.h * Math.PI / 180) * w.s * 50) + '%';
      wheelDot.style.background = sess.hex;
    }
    paintBrite();
  };
  const off = sess.on(what => { if (what === 'colour') show(); });
  whenGone(box, off);                                      /* the window was closed: stop listening to the session */
  show();

  const pickFromWheel = ev => {
    const r = wheelCv.getBoundingClientRect();
    const cx = (ev.clientX - r.left) / r.width * WN - (WN - 1) / 2 - 0.5;
    const cy = (ev.clientY - r.top) / r.height * WN - (WN - 1) / 2 - 0.5;
    const rad = Math.sqrt(cx * cx + cy * cy) / ((WN - 1) / 2);
    if (rad > 1.15) return false;
    const h = ((Math.atan2(cy, cx) * 180 / Math.PI) + 360) % 360, s = Math.min(1, rad), v = sess.wheel.v;
    sess.pickWheel(h, s, v, hsvToHex(h, s, v));
    return true;
  };
  let drag = false;
  wheelCv.addEventListener('mousedown', ev => { ev.stopPropagation(); if (pickFromWheel(ev)) { drag = true; env.click(); } });
  wl.on(window, 'mousemove', ev => { if (drag) pickFromWheel(ev); });
  wl.on(window, 'mouseup', () => { drag = false; });
  briteCv.addEventListener('mousedown', ev => {
    ev.stopPropagation();
    const r = briteCv.getBoundingClientRect(), w = sess.wheel;
    const v = Math.max(0.08, Math.min(1, (ev.clientX - r.left) / r.width));
    sess.pickWheel(w.h, w.s, v, hsvToHex(w.h, w.s, v));
    env.click();
  });
}
