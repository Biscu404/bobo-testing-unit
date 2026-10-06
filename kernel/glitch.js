/* The sound coming apart. When the style meter has been at its top for a minute and keeps being
   fed, whatever the machine is playing starts to glitch: the music stutters (the last fraction
   of a second is caught and repeated), bites down to a few bits, wobbles like a tape that is
   being dragged, and drops out in short gates. It starts rare and short and, over the next minute
   and a half, gets frequent and long. A pile of twenty to eighty files deleted at once, while
   it is going, throws a burst of it on the spot.

   Everything that makes a sound is sent through here while it is on: the studio's channels (the
   symphony, a game's music), the machine's own SFX, and the chiptune layer. Off, it is
   unplugged entirely and costs nothing.

   Graph:   in -> dry -> out
               -> crush (a stepped curve) -> crushGain -> out
               -> wobble (a delay whose time is swung) -> wobbleGain -> out
               -> catch (a delay with feedback, fed only until it is told to loop) -> loopGain -> out */
import { Snd } from './snd.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const Glitch = {
  level: 0, ready: false, timer: null, on: false, until: 0, kind: null, hooked: new Set(),

  build() {
    if (this.ready) return true;
    Snd.wake();
    const c = Snd.ctx;
    if (!c) return false;
    const g = () => c.createGain();
    this.in = g(); this.dry = g(); this.out = g(); this.out.connect(c.destination);
    this.in.connect(this.dry); this.dry.connect(this.out);
    this.crush = c.createWaveShaper();
    const curve = new Float32Array(4097), steps = 10;
    for (let i = 0; i < curve.length; i++) curve[i] = Math.round((i / 2048 - 1) * steps) / steps;
    this.crush.curve = curve;
    this.crushGain = g(); this.crushGain.gain.value = 0;
    this.in.connect(this.crush); this.crush.connect(this.crushGain); this.crushGain.connect(this.out);
    this.wobble = c.createDelay(0.5); this.wobble.delayTime.value = 0.03;
    this.wobbleGain = g(); this.wobbleGain.gain.value = 0;
    this.lfo = c.createOscillator(); this.lfoAmt = g(); this.lfo.frequency.value = 5; this.lfoAmt.gain.value = 0;
    this.lfo.connect(this.lfoAmt); this.lfoAmt.connect(this.wobble.delayTime); this.lfo.start();
    this.in.connect(this.wobble); this.wobble.connect(this.wobbleGain); this.wobbleGain.connect(this.out);
    this.catchFeed = g(); this.catchFeed.gain.value = 1;
    this.catch = c.createDelay(0.5); this.catch.delayTime.value = 0.12;
    this.fb = g(); this.fb.gain.value = 0;
    this.loopGain = g(); this.loopGain.gain.value = 0;
    this.in.connect(this.catchFeed); this.catchFeed.connect(this.catch);
    this.catch.connect(this.fb); this.fb.connect(this.catch);
    this.catch.connect(this.loopGain); this.loopGain.connect(this.out);
    this.ready = true;
    return true;
  },

  /* send something that is connected to the speaker through here instead (and back again when it is off) */
  hook(node) { if (node) { this.hooked.add(node); if (this.on) this._route(node, true); } },
  _route(node, through) {
    try { node.disconnect(); } catch (e) {}
    node.connect(through ? this.in : Snd.ctx.destination);
  },
  _plug(on) {
    if (on === this.on) return;
    if (on && !this.build()) return;
    this.on = on;
    this.hooked.forEach(n => this._route(n, on));
    if (window.Studio && window.Studio.setInsert) window.Studio.setInsert(on ? this.in : null);
  },

  /* 0 is off; 1 is the worst it gets */
  setLevel(x) {
    x = clamp(x, 0, 1);
    this.level = x;
    if (x > 0.001) { this._plug(true); this._run(); }
    else if (this.on && !(this.until > performance.now())) { this._clear(); this._plug(false); this._stop(); }
  },
  _run() { if (!this.timer) this.timer = setInterval(() => this._tick(), 70); },
  _stop() { clearInterval(this.timer); this.timer = null; },

  _tick() {
    const now = performance.now();
    if (this.until > now) return;
    if (this.kind) this._clear();
    const L = this.level;
    if (L <= 0.001) { if (this.on) { this._plug(false); this._stop(); } return; }
    /* the chance that something goes wrong in this 70 ms, and how long it lasts, both grow with the level */
    if (Math.random() < 0.018 + L * 0.22) this._event(Math.random(), 60 + Math.random() * (140 + L * 380), L);
  },

  /* one event: a stutter, a crush, a tape drag, or a gate */
  _event(r, ms, L) {
    const c = Snd.ctx, t = c.currentTime, k = r < 0.34 ? 'stutter' : r < 0.58 ? 'crush' : r < 0.8 ? 'tape' : 'gate';
    this.kind = k; this.until = performance.now() + ms;
    if (k === 'stutter') {
      this.catch.delayTime.setValueAtTime([0.06, 0.09, 0.125, 0.18][(Math.random() * 4) | 0], t);
      this.catchFeed.gain.setValueAtTime(0, t); this.fb.gain.setValueAtTime(0.995, t);
      this.dry.gain.setValueAtTime(0, t); this.loopGain.gain.setValueAtTime(1, t);
    } else if (k === 'crush') {
      this.dry.gain.setValueAtTime(1 - 0.85 * L, t); this.crushGain.gain.setValueAtTime(0.5 + 0.45 * L, t);
    } else if (k === 'tape') {
      this.lfoAmt.gain.setValueAtTime(0.006 + 0.02 * L, t); this.lfo.frequency.setValueAtTime(1.5 + Math.random() * 5, t);
      this.dry.gain.setValueAtTime(0.25, t); this.wobbleGain.gain.setValueAtTime(0.85, t);
    } else {
      this.dry.gain.setValueAtTime(0, t); this.dry.gain.setValueAtTime(1, t + ms / 1000 * 0.5);
      const ms2 = ms * 0.5; this.until = performance.now() + ms2;
    }
  },
  _clear() {
    if (!this.ready) return;
    const c = Snd.ctx, t = c.currentTime;
    this.kind = null;
    this.dry.gain.setTargetAtTime(1, t, 0.008); this.crushGain.gain.setTargetAtTime(0, t, 0.01); this.wobbleGain.gain.setTargetAtTime(0, t, 0.02);
    this.lfoAmt.gain.setTargetAtTime(0, t, 0.05);
    this.loopGain.gain.setTargetAtTime(0, t, 0.006); this.fb.gain.setValueAtTime(0, t + 0.01); this.catchFeed.gain.setTargetAtTime(1, t + 0.01, 0.01);
  },

  /* a pile of files was just deleted: something goes wrong right now. n is how many. */
  burst(n) {
    if (!this.on && this.level <= 0) return;
    this._plug(true); this._run();
    const L = clamp(0.35 + n / 120, 0.35, 1), c = Snd.ctx;
    if (!c) return;
    this._clear();
    this._event(Math.random() < 0.5 ? 0.1 : 0.4, 220 + n * 4, L);
  }
};
window.Glitch = Glitch;
