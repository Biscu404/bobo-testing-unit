/* DEGAUSS. It used to be a button on the chin that played a flash and then, because a later CSS rule
   overrode the part that was meant to stay, left nothing. It is part of the glass now:

     purity   a tube that has been magnetised a little shows patches of the wrong colour toward its
              corners. They are painted into the glass canvas (kernel/hardware.js paintGlass) once per
              resize, so being permanent costs no frame time at all: nothing animated sits over the picture.
     pulse    the DEGAUSS command in the terminal still fires the coil: the thunk and a flash of colour
              that grows and fades (the element is #degauss, hidden between pulses). */
import { Snd } from './snd.js';

/* one soft round patch of colour, lit at its centre and gone at its edge */
function patch(g, W, H, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
  gr.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

export function paintPurity(g, W, H) {
  const R = Math.max(W, H);
  patch(g, W, H, W * 0.05, H * 0.10, R * 0.36, '255,0,255', 0.17);
  patch(g, W, H, W * 0.97, H * 0.16, R * 0.30, '0,255,90', 0.13);
  patch(g, W, H, W * 0.08, H * 0.94, R * 0.30, '0,90,255', 0.16);
  patch(g, W, H, W * 0.95, H * 0.95, R * 0.36, '255,190,0', 0.11);
  patch(g, W, H, W * 0.50, H * 0.00, R * 0.22, '255,60,120', 0.07);
}

export function degauss() {
  const r = document.getElementById('degauss');
  if (!r) return;
  Snd.thunk();
  Snd.noise(420, { mech: true, freq: 90, q: 0.5, vol: 0.32 });
  Snd.tone(52, 900, { mech: true, type: 'triangle', to: 30, vol: 0.14 });
  Snd.tone(104, 700, { mech: true, type: 'sine', to: 61, vol: 0.07, delay: 0.05 });
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.remove('pulse');
  void r.offsetWidth;
  r.classList.add('pulse');
  r.addEventListener('animationend', () => r.classList.remove('pulse'), { once: true });
}
