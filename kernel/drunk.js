/* Drinking in the bottle app used to mean a blur of a pixel and a half on the
   tube, which on a busy desktop was not a thing anyone could see. It leans on
   the whole screen now, in stages, and eases off as the level burns down:

     a little   the picture sways; the colours go warm and swim
     some       the glass bends: slow waves run through everything (an SVG
                displacement map over the tube), the blur arrives
     a lot      double vision, the room tilting, the edges closing in
     too much   the eyelids come down every few seconds, and stay a moment

   Every swallow also lands as a kick that rides over the level and dies away
   in a second, so each measure is felt when it goes down.

   It is the whole interface that is drunk, not just the picture: the filter and
   the transform go on #room (the case, the well, the chin and the knobs as well
   as the tube), and the edges closing in and the eyelids are an overlay fixed to
   the viewport, so nothing on the screen stays sober. (#tube is left alone: the
   hold knobs, the saver and the power animation own it.)

   How drunk that is comes from kernel/drunk_bac.js: a measure takes half a
   minute to arrive and the body clears one every 45 seconds, so the way to the
   floor is a journey of minutes and nothing that is clicked can hurry it. At the
   limit the whole window goes (kernel/blackout.js). */
import { newBlood, swallow, step, over, levelOf, stageOf, wake } from './drunk_bac.js';
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;pointer-events:none" aria-hidden="true">' +
  '<filter id="drunkfx" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">' +
  '<feTurbulence id="dfT" type="fractalNoise" baseFrequency="0.005 0.016" numOctaves="1" seed="4" result="n"/>' +
  '<feOffset id="dfN" in="n" dx="0" dy="0" result="n2"/>' +
  '<feDisplacementMap id="dfD" in="SourceGraphic" in2="n2" scale="0" xChannelSelector="R" yChannelSelector="G" result="w"/>' +
  '<feOffset id="dfO" in="w" dx="0" dy="0" result="o"/>' +
  '<feComposite id="dfC" in="w" in2="o" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"/>' +
  '</filter></svg>';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const Drunk = {
  level: 0,
  kick: 0,
  raf: null,
  blood: newBlood(), out: false,
  svg: null, over: null, vig: null, lids: null, fx: {},
  /* one measure, drunk; `units` is what it is worth against the Jägermeister the machine was calibrated on (1), 0 for something with nothing in it */
  drink(units = 1) {
    if (units <= 0) { this.kick = Math.max(this.kick, 0.15); this._ensureLoop(); return; }
    swallow(this.blood, units);
    this.kick = 1;
    this._ensureLoop();
  },
  /* a swallow on the way down: the screen gives a small lurch */
  gulp() { this.kick = Math.max(this.kick, 0.4); this._ensureLoop(); },
  stage() { return stageOf(this.blood); },
  blackedOut() { return this.out; },
  async blackout() {
    if (this.out) return;
    this.out = true;
    try {
      const m = await import('./blackout.js');
      m.runBlackout(() => {
        this.out = false;
        wake(this.blood);
        this.level = levelOf(this.blood);
        this.kick = 1;
        this._ensureLoop();
      });
    } catch (e) { this.out = false; throw e; }
  },
  _build() {
    if (this.svg) return;
    const h = document.createElement('div');
    h.innerHTML = SVG;
    this.svg = h.firstChild;
    document.body.appendChild(this.svg);
    ['dfT', 'dfN', 'dfD', 'dfO', 'dfC'].forEach(id => { this.fx[id] = this.svg.querySelector('#' + id); });
    if (!this.over) {
      /* one overlay for the whole viewport: the vignette, and the lids */
      const d = document.createElement('div');
      d.id = 'drunkover';
      d.setAttribute('aria-hidden', 'true');
      d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2000;display:none';
      d.innerHTML = '<div style="position:absolute;inset:0"></div>' +
                    '<div style="position:absolute;left:0;right:0;top:0;height:0;background:#000"></div>' +
                    '<div style="position:absolute;left:0;right:0;bottom:0;height:0;background:#000"></div>';
      document.body.appendChild(d);
      this.over = d;
      this.vig = d.children[0];
      this.lids = [d.children[1], d.children[2]];
    }
  },
  _ensureLoop() {
    if (this.raf) return;
    this._build();
    let last = performance.now();
    const tick = now => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      step(this.blood, dt);
      this.level = levelOf(this.blood);
      this.kick = Math.max(0, this.kick - dt * 1.6);
      if (over(this.blood) && !this.out) this.blackout();
      this._apply(now);
      if (this.level > 0.001 || this.out) this.raf = requestAnimationFrame(tick);
      else { this.raf = null; this._clear(); }
    };
    this.raf = requestAnimationFrame(tick);
  },
  _apply(now) {
    const room = document.getElementById('room');
    if (!room) return;
    const L = clamp(this.level + this.kick * 0.14, 0, 1), f = this.fx;
    /* the glass bending: waves running through, and a second picture beside the first */
    const warp = L > 0.08 ? (L - 0.05) * 46 : 0;
    const ghost = clamp((L - 0.35) * 0.85, 0, 0.46);
    if (f.dfD) {
      f.dfD.setAttribute('scale', warp.toFixed(1));
      f.dfN.setAttribute('dy', ((now / 28) % 400).toFixed(1));
      f.dfN.setAttribute('dx', (Math.sin(now / 1900) * 60).toFixed(1));
      f.dfO.setAttribute('dx', (Math.sin(now / 760) * L * 16).toFixed(1));
      f.dfO.setAttribute('dy', (Math.cos(now / 980) * L * 6).toFixed(1));
      f.dfC.setAttribute('k2', (1 - ghost).toFixed(3));
      f.dfC.setAttribute('k3', ghost.toFixed(3));
    }
    const hue = Math.sin(now / 900) * L * 34;
    const sat = 1 + L * 0.9 + Math.sin(now / 650) * L * 0.2;
    const blur = L * L * 2.4 + this.kick * 1;
    room.style.filter = (warp > 0 ? 'url(#drunkfx) ' : '') + 'blur(' + blur.toFixed(2) + 'px) saturate(' + sat.toFixed(2) +
      ') hue-rotate(' + hue.toFixed(1) + 'deg) contrast(' + (1 + L * 0.18).toFixed(2) + ')';
    /* the room tilting, the picture drifting, breathing in and out */
    const rot = Math.sin(now / 1300) * L * 2.4 + Math.sin(now / 470) * L * 0.5;
    const tx = Math.sin(now / 1700) * L * 16, ty = Math.cos(now / 1100) * L * 9;
    const z = 1 + Math.sin(now / 2300) * L * 0.03 + this.kick * 0.012;
    room.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + z.toFixed(3) + ')';
    /* the edges close in, and (late) the lids */
    if (this.over) {
      this.over.style.display = L > 0.12 ? 'block' : 'none';
      this.vig.style.boxShadow = 'inset 0 0 ' + (60 + L * 150).toFixed(0) + 'px ' + (L * 46).toFixed(0) + 'px rgba(0,0,0,' + (L * 0.75).toFixed(2) + ')';
      let lid = 0;
      if (L > 0.55) {
        const cyc = Math.pow(Math.max(0, Math.sin(now / (2100 - L * 700) + 1)), 7);
        lid = cyc * clamp((L - 0.5) * 1.1, 0, 0.55);
        if (L > 0.9 && Math.sin(now / 5300) > 0.985) lid = 0.62;
      }
      const h = lid > 0.004 ? (lid * 100).toFixed(1) + '%' : '0';
      this.lids[0].style.height = h; this.lids[1].style.height = h;
    }
  },
  _clear() {
    const room = document.getElementById('room');
    if (room) { room.style.filter = ''; room.style.transform = ''; }
    if (this.over) { this.over.style.display = 'none'; this.lids[0].style.height = '0'; this.lids[1].style.height = '0'; }
  }
};
window.Drunk = Drunk;
