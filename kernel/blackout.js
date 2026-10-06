/* Passing out.

   Not a filter on the monitor: the whole window goes, case and all. The edges
   close in, it is black, and then the machine shows you things it should not
   have: a snowy city, a snowy park, something that runs on blood, a chat that
   will not stop, a skater, a disc, a tape, a very small turtle, a map with
   three lanes, a penguin -- each altered on the way out, the colours wrong,
   the picture cut and sliding, snow on everything. Then the lids come up.

   About 16 seconds, and it cannot be skipped: you are not conscious. For
   anyone who has asked their system for less motion it is slower, and leaves
   out the effects that flash hardest. Nothing flashes more than about three
   times a second either way. */
import { W, H, seeded } from './blackout_draw.js';
import { FX, HARSH, NAMES, snowScreen } from './blackout_fx.js';
import * as A from './blackout_a.js';
import * as B from './blackout_b.js';

const SCENES = [
  ['city', A.city], ['park', A.park], ['ultrakill', A.ultrakill], ['discord', A.discord], ['skate', A.skate],
  ['cd', B.cd], ['vhs', B.vhs], ['turtle', B.turtle], ['lol', B.lol], ['linux', B.linux]
];
export const SCENE_IDS = SCENES.map(s => s[0]);
const T_FALL = 1.0, T_DARK = 2.3, T_WAKE = 13.4, T_END = 15.6;
let running = false;

export const isBlackedOut = () => running;

export function runBlackout(done, opts) {
  if (running) return;
  running = true;
  opts = opts || {};
  const calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = seeded((Date.now() >>> 0) ^ 0x5bd1e995);
  const root = document.createElement('div');
  root.id = 'blackout';
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#000;cursor:none;overflow:hidden;opacity:0';
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:0';
  const lidT = document.createElement('div'), lidB = document.createElement('div');
  const lid = 'position:absolute;left:0;right:0;background:#000;height:0;z-index:3;';
  lidT.style.cssText = lid + 'top:0'; lidB.style.cssText = lid + 'bottom:0';
  const vig = document.createElement('div');
  vig.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none';
  root.append(cv, vig, lidT, lidB);
  document.body.appendChild(root);
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const og = off.getContext('2d'); og.imageSmoothingEnabled = false;

  const block = ev => { ev.preventDefault(); ev.stopPropagation(); };
  ['keydown', 'keyup', 'keypress'].forEach(k => window.addEventListener(k, block, true));

  /* the order the pictures come in: all of them once, shuffled, then again */
  const order = [];
  const deal = () => { const a = SCENES.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } order.push(...a); };
  deal(); deal();
  let seg = null, nextAt = T_DARK, n = 0;
  const pickFx = () => {
    const pool = NAMES.filter(k => !(calm && HARSH.has(k)));
    const out = [];
    for (let i = 0; i < 2 + (rnd() < 0.4); i++) { const k = pool[rnd() * pool.length | 0]; if (!out.includes(k)) out.push(k); }
    return out;
  };
  const newSeg = t => {
    const [id, fn] = order[n % order.length]; n++;
    const long = rnd() < 0.55;
    const dur = calm ? 0.55 + rnd() * 0.5 : long ? 0.45 + rnd() * 0.5 : 0.16 + rnd() * 0.12;
    const second = rnd() < 0.28 ? order[(n + 3) % order.length][1] : null;
    seg = { id, fn, second, start: t, end: t + dur, fx: pickFx(), st: {}, t0: rnd() * 5 };
    nextAt = seg.end + (calm ? 0.6 + rnd() * 0.6 : 0.12 + rnd() * 0.5);
    if (opts.onFlash) opts.onFlash(id);
    sound('flash');
  };

  const Snd = window.Snd;
  function sound(kind) {
    if (!Snd) return;
    try {
      if (kind === 'flash') {
        Snd.noise(60 + rnd() * 120, { freq: 300 + rnd() * 3000, q: 1 + rnd() * 3, vol: 0.05 });
        Snd.tone(150 + rnd() * 1600, 90, { type: rnd() < 0.5 ? 'square' : 'sawtooth', to: 80 + rnd() * 900, vol: 0.02 });
      } else if (kind === 'beat') {
        Snd.tone(62, 120, { type: 'sine', to: 38, vol: 0.2 }); Snd.tone(52, 130, { type: 'sine', to: 34, vol: 0.14, delay: 0.19 });
      } else if (kind === 'ring') {
        Snd.tone(3150, 2400, { type: 'sine', vol: 0.012 });
      } else if (kind === 'breath') {
        Snd.noise(900, { freq: 500, q: 0.6, vol: 0.05 });
      }
    } catch (e) {}
  }

  let raf = 0, last = 0, beatAt = 0.9, ringAt = 0.5, frame = 0, breathed = false;
  const t0 = performance.now();
  const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  function paint(t) {
    if (!seg && t >= nextAt && t < T_WAKE) newSeg(t);
    if (seg && t >= seg.end) { seg = null; if (t < T_WAKE && rnd() < 0.3 && !calm) { snowScreen(g, rnd); cv.style.opacity = '1'; return; } }
    if (!seg) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
    const lt = t - seg.start + seg.t0;
    seg.fn(g, lt);
    if (seg.second) { og.clearRect(0, 0, W, H); seg.second(og, lt * 1.3); g.globalAlpha = 0.5; g.drawImage(off, 0, 0); g.globalAlpha = 1; }
    seg.fx.forEach(k => FX[k](g, rnd, seg.st, lt));
  }

  function tick(now) {
    const t = (now - t0) / 1000;
    raf = requestAnimationFrame(tick);
    if (now - last < (calm ? 60 : 41)) return;
    last = now; frame++;
    /* the edges close in, and everything goes */
    if (t < T_FALL) {
      const k = ease(t / T_FALL);
      root.style.opacity = String(Math.min(1, k * 1.6));
      root.style.backdropFilter = 'blur(' + (k * 7).toFixed(1) + 'px)';
      vig.style.background = 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) ' + ((1 - k) * 70) + '%, #000 ' + ((1 - k) * 70 + 22) + '%)';
    } else { root.style.opacity = '1'; vig.style.background = 'none'; }
    if (t >= beatAt && t < T_WAKE) { sound('beat'); beatAt += 0.85; }
    if (t >= ringAt && t < T_WAKE) { sound('ring'); ringAt += 2.4; }
    if (t >= T_DARK - 0.2 && t < T_WAKE) cv.style.opacity = '1';
    if (t >= T_DARK - 0.2 && t < T_WAKE) paint(t);
    else if (t >= T_DARK - 0.6 && t < T_DARK) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    /* waking: the picture drains, the lids come up */
    if (t >= T_WAKE) {
      if (!breathed) { breathed = true; sound('breath'); }
      const k = ease((t - T_WAKE) / (T_END - T_WAKE));
      cv.style.opacity = String(Math.max(0, 1 - k * 2));
      const lids = (1 - k) * 50 + (k < 0.9 ? Math.sin(t * 9) * 3 * (1 - k) : 0);
      lidT.style.height = lidB.style.height = Math.max(0, lids) + '%';
      root.style.background = 'rgba(0,0,0,' + Math.max(0, 1 - Math.max(0, k - 0.35) * 1.6) + ')';
      root.style.backdropFilter = 'blur(' + ((1 - k) * 8).toFixed(1) + 'px)';
    }
    if (t >= T_END) finish();
  }

  function finish() {
    cancelAnimationFrame(raf);
    ['keydown', 'keyup', 'keypress'].forEach(k => window.removeEventListener(k, block, true));
    root.remove();
    running = false;
    try { window.dispatchEvent(new CustomEvent('blackout-end')); } catch (e) {}
    if (done) done();
  }
  raf = requestAnimationFrame(tick);
  /* a hook for tests: how to stop early without waiting sixteen seconds */
  return { stop: finish, root };
}
