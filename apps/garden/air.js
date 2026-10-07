/* GARDEN — the wind and the birds. One loop of brown noise through a slow low-pass, and a bird now and then; both ride the
   taskbar mixer's GARDEN channel. */
import { CRT, Vol } from '../../kernel/hardware.js';
import { Mixer } from '../../kernel/mixer.js';

export const GardenAir = {
  src: null, gain: null, lfo: null, birdT: null,
  start() {
    window.Snd.wake();
    if (!window.Snd.ctx || this.src) return;
    const ctx = window.Snd.ctx;
    let buf;
    try {
      const n = ctx.sampleRate * 3;
      buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        /* brown-ish noise: white, integrated, so it is wind and not hiss */
        last = (last + (Math.random() * 2 - 1) * 0.06);
        if (last > 1) last = 1; if (last < -1) last = -1;
        d[i] = last * 0.6;
      }
    } catch (e) { return; }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.0;
    src.connect(f); f.connect(g); g.connect(window.Snd.sfx || ctx.destination);
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 0.06; lg.gain.value = 180;
    lfo.connect(lg); lg.connect(f.frequency);
    try { src.start(); lfo.start(); } catch (e) {}
    g.gain.setTargetAtTime(0.22 * Mixer.get('garden'), ctx.currentTime, 2.2);
    this.src = src; this.gain = g; this.lfo = lfo;
    this.birdT = setInterval(() => {
      if (!CRT.on || Vol.sfx <= 0) return;
      if (Math.random() > 0.32) return;
      const base = 1500 + Math.random() * 900;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        window.Snd.tone(base * (1 + i * 0.12), 55, { type: 'sine', vol: 0.012, delay: i * 0.09, to: base * (1 + i * 0.12) * 1.3 });
      }
    }, 5200);
  },
  stop() {
    clearInterval(this.birdT);
    this.birdT = null;
    if (this.gain && window.Snd.ctx) {
      try { this.gain.gain.setTargetAtTime(0, window.Snd.ctx.currentTime, 0.4); } catch (e) {}
    }
    const src = this.src, lfo = this.lfo;
    setTimeout(() => {
      try { if (src) src.stop(); } catch (e) {}
      try { if (lfo) lfo.stop(); } catch (e) {}
    }, 1400);
    this.src = null; this.gain = null; this.lfo = null;
  }
};
