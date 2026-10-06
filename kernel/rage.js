import { Snd } from "./snd.js";
import { CRT, Vol, musGain } from "./hardware.js";
import { Glitch } from "./glitch.js";
/* ---- the layer over the hymn ---------------------------------------------
   D minor, same key as the boot hymn, at twice its tempo, on its own bus
   under the MUS pot. One instrument joins per rank and a lowpass opens as
   you climb, so the track does not change - it stops being held back. At
   the top rank the symphony takes over and this layer is hushed.
   ========================================================================== */
const RZ = {
  D1: 36.71, A1: 55.00, D2: 73.42, F2: 87.31, A2: 110.00, Bb2: 116.54, C3: 130.81,
  D3: 146.83, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16,
  C5: 523.25, D5: 587.33, F5: 698.46, A5: 880.00
};

export const Rage = {
  on: false,
  tier: -1,           /* set by the style meter before it calls sync() */
  hushed: false,      /* the symphony is playing: this layer is not wanted */
  bus: null,
  filt: null,
  when: 0,
  timer: null,
  voices: [],
  bpm: (typeof HYMN !== 'undefined' ? HYMN.bpm : 92) * 2,
  step() { return 15 / this.bpm; },              /* one sixteenth, in seconds */

  ensure() {
    Snd.wake();
    if (!Snd.ctx) return false;
    if (!this.bus) {
      this.filt = Snd.ctx.createBiquadFilter();
      this.filt.type = 'lowpass';
      this.filt.frequency.value = 800;
      this.filt.Q.value = 0.6;
      this.bus = Snd.ctx.createGain();
      this.bus.gain.value = 0.0001;
      this.filt.connect(this.bus);
      this.bus.connect(Snd.ctx.destination);
      Glitch.hook(this.bus);
    }
    return true;
  },

  keep(o) {
    this.voices.push(o);
    o.onended = () => {
      const i = this.voices.indexOf(o);
      if (i >= 0) this.voices.splice(i, 1);
    };
  },

  note(f, at, dur, type, vol, to) {
    const c = Snd.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(this.filt);
    o.start(at); o.stop(at + dur + 0.04);
    this.keep(o);
  },

  drum(at, ms, freq, q, vol) {
    const c = Snd.ctx;
    const n = Math.max(1, Math.floor(c.sampleRate * ms / 1000));
    let buf;
    try { buf = c.createBuffer(1, n, c.sampleRate); } catch (e) { return; }
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.filt);
    s.start(at);
  },

  kick(at)  { this.note(130, at, 0.16, 'sine', 0.30, 42); },
  snare(at) { this.drum(at, 130, 1900, 0.8, 0.16); this.note(190, at, 0.09, 'triangle', 0.09, 90); },
  hat(at, v){ this.drum(at, 26, 8000, 1.6, v); },

  /* one bar of sixteen sixteenths, drawn according to how high we are */
  bar(t0, tier) {
    const s = this.step();
    const at = i => t0 + i * s;

    for (let i = 0; i < 16; i += (tier >= 5 ? 1 : 2)) this.hat(at(i), tier >= 5 ? 0.05 : 0.07);
    if (tier >= 1) [0, 4, 7, 10, 12].forEach(i => this.kick(at(i)));
    if (tier >= 6) [4, 12].forEach(i => this.snare(at(i)));

    if (tier >= 2) {
      const riff = ['D2','D2','D2','F2','D2','D2','C3','D2','D2','D2','Bb2','D2','A2','A2','C3','D2'];
      riff.forEach((n, i) => this.note(RZ[n], at(i), s * 0.85, 'square', 0.11));
    }
    if (tier >= 3) {
      [2, 6, 9, 14].forEach(i => {
        ['D3','F3','A3'].forEach(n => this.note(RZ[n], at(i), s * 1.6, 'sawtooth', 0.045));
      });
    }
    if (tier >= 4) {
      const lead = [['D4',0,2],['F4',2,2],['A4',4,2],['G4',6,1],['F4',7,1],
                    ['E4',8,2],['D4',10,1],['F4',11,1],['A4',12,2],['D5',14,2]];
      lead.forEach(n => {
        this.note(RZ[n[0]], at(n[1]), s * n[2] * 0.9, 'square', 0.075);
        if (tier >= 5) this.note(RZ[n[0]] * 2, at(n[1]), s * n[2] * 0.9, 'square', 0.03);
      });
    }
    if (tier >= 6) {
      this.note(RZ.A4, t0, s * 16, 'sawtooth', 0.028, RZ.A5);
    }
    if (tier >= 7) {
      [['D5',0,3],['D5',3,1],['E4',4,4],['D5',8,4],['A5',12,4]].forEach(n =>
        this.note(RZ[n[0]], at(n[1]), s * n[2] * 0.9, 'square', 0.07));
    }
    return 16 * s;
  },

  level() {
    if (!this.bus || !Snd.ctx) return;
    const t = Math.max(0, this.tier);
    const now = Snd.ctx.currentTime;
    const target = Math.max(0.0002, musGain() * (0.30 + 0.085 * t));
    const g = this.bus.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(target, now + 0.25);
    const cut = 700 * Math.pow(1.48, t);          /* 700 Hz at D, wide open at the top */
    this.filt.frequency.cancelScheduledValues(now);
    this.filt.frequency.setValueAtTime(this.filt.frequency.value, now);
    this.filt.frequency.linearRampToValueAtTime(Math.min(15000, cut), now + 0.45);
  },

  /* the one place that decides whether the layer is playing */
  sync() {
    if (!(CRT.on && Vol.mus > 0 && this.tier >= 0) || this.hushed) { this.stop(); return; }
    if (this.on) this.level(); else this.start();
  },

  start() {
    if (this.on || !this.ensure()) return;
    this.on = true;
    this.when = Snd.ctx.currentTime + 0.12;
    this.level();
    this.tick();
  },

  tick() {
    if (!this.on || !Snd.ctx) return;
    const now = Snd.ctx.currentTime;
    if (this.when < now) this.when = now + 0.05;
    const len = this.bar(this.when, Math.max(0, this.tier));
    this.when += len;
    this.timer = setTimeout(() => this.tick(), Math.max(120, len * 1000 - 300));
  },

  stop() {
    if (!this.on) return;
    this.on = false;
    clearTimeout(this.timer);
    if (!this.bus || !Snd.ctx) { this.voices = []; return; }
    const now = Snd.ctx.currentTime;
    const g = this.bus.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(0.0001, now + 0.45);
    this.voices.forEach(o => { try { o.stop(now + 0.47); } catch (e) {} });
    this.voices = [];
  }
};
