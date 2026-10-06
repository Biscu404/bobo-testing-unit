import { Snd } from './snd.js';
import { CRT, Vol, musGain } from './hardware.js';
import { Mixer } from './mixer.js';
import { VARIANTS, variantSpec, hz } from './music_variants.js';

const VKEY = 'templeos.lobby.variant.v1';
const BOOT_FLOOR = Math.pow(0.5, 1.6) * 0.85;      /* the boot never plays quieter than the knob at 5 */
const BASE_VOL = { lead: 0.08, bass: 0.07, pad: 0.05, arp: 0.045, drum: 0.5 };

function loadVariant() {
  try {
    const v = localStorage.getItem(VKEY);
    if (VARIANTS.some(x => x.id === v)) return v;
  } catch (e) {}
  return 'hymn';
}

/* The lobby music. Two ways to be allowed to play:
     - in the boot, always: the splash is the lobby, and it has its own song
       (the hymn) whatever the switch on the chin says;
     - on the desktop, only when the LOBBY switch is on and MUS is up.
   Which of the four variants plays outside of the boot is the listener's
   choice, kept in the mixer panel. */
export const Music = {
  on: false,
  bus: null,
  timer: null,
  when: 0,
  n: 0,             /* how many passes of the loop, for the variants that move */
  voices: [],       /* every oscillator still in the queue, so stop() means stop */
  inBoot: false,
  variant: loadVariant(),
  active: 'hymn',   /* what is actually being played right now */
  ensure() {
    Snd.wake();
    if (!Snd.ctx) return false;
    if (!this.bus) {
      const c = Snd.ctx;
      this.bus = c.createGain();
      this.bus.gain.value = 0.0001;
      this.bus.connect(c.destination);
      /* everything tonal goes in at `input`: a lowpass, and an echo beside it */
      this.input = c.createGain();
      this.lp = c.createBiquadFilter();
      this.lp.type = 'lowpass'; this.lp.frequency.value = 20000; this.lp.Q.value = 0.4;
      this.input.connect(this.lp); this.lp.connect(this.bus);
      this.dly = c.createDelay(1.5);
      this.fb = c.createGain(); this.wet = c.createGain();
      this.wet.gain.value = 0; this.fb.gain.value = 0;
      this.lp.connect(this.dly); this.dly.connect(this.wet); this.wet.connect(this.bus);
      this.dly.connect(this.fb); this.fb.connect(this.dly);
      this.noiseBuf = null;
    }
    return true;
  },
  /* the chosen variant is applied to the node chain once per pass */
  fx(sp, t) {
    const lp = (this.struggle && this.struggle.until > t) ? Math.min(sp.fx.lp, this.struggle.lp(t)) : sp.fx.lp;
    this.lp.frequency.setTargetAtTime(lp, t, 0.05);
    this.dly.delayTime.setValueAtTime(Math.min(1.4, sp.step * 3), t);
    this.wet.gain.setTargetAtTime(sp.fx.delay, t, 0.1);
    this.fb.gain.setTargetAtTime(sp.fx.fb, t, 0.1);
  },
  voice(f, at, dur, type, vol, ex) {
    if (!f || vol <= 0) return;
    const c = Snd.ctx;
    ex = ex || {};
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = ex.t || type;
    o.frequency.setValueAtTime(f, at);
    if (ex.g) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * ex.g), at + dur * 0.9);
    if (ex.d) o.detune.setValueAtTime(ex.d, at);
    const atk = Math.min(0.03, dur * 0.3);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + atk);
    g.gain.setValueAtTime(vol, at + Math.max(atk, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(this.input);
    o.start(at);
    o.stop(at + dur + 0.05);
    /* A loop is scheduled up to ten seconds ahead. Fading the bus hides
       those notes but does not cancel them, and the next start() raised
       the fader right back over the top of them — which is where the
       doubled music came from on a power cycle. Hold onto them. */
    this.voices.push(o);
    o.onended = () => {
      const i = this.voices.indexOf(o);
      if (i >= 0) this.voices.splice(i, 1);
    };
  },
  noise() {
    if (this.noiseBuf) return this.noiseBuf;
    const c = Snd.ctx, n = Math.floor(c.sampleRate * 0.25);
    const b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    return (this.noiseBuf = b);
  },
  hit(at, ms, freq, q, vol) {
    const c = Snd.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise(); s.playbackRate.value = 250 / ms;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.bus);
    s.start(at); s.stop(at + ms / 1000 + 0.05);
    this.voices.push(s);
    s.onended = () => { const i = this.voices.indexOf(s); if (i >= 0) this.voices.splice(i, 1); };
  },
  kick(at, vol) {
    const c = Snd.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, at);
    o.frequency.exponentialRampToValueAtTime(46, at + 0.15);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    o.connect(g); g.connect(this.bus);
    o.start(at); o.stop(at + 0.25);
    this.voices.push(o);
    o.onended = () => { const i = this.voices.indexOf(o); if (i >= 0) this.voices.splice(i, 1); };
  },
  loop(t0) {
    const sp = variantSpec(this.active, this.n++);
    const st = 15 / sp.bpm;                         /* one sixteenth */
    sp.step = st;
    this.fx(sp, t0);
    const play = (list, layer, amp) => (list || []).forEach(n => {
      const ex = n[3] || null;
      const f = hz(n[0]) * (ex && ex.o ? ex.o : 1);
      const vol = BASE_VOL[layer] * sp.rel[layer] * (amp || 1) * (ex && ex.v ? ex.v : 1);
      this.voice(f, t0 + n[1] * st, n[2] * st * 0.92, sp.timbre[layer], vol, ex);
      /* a second oscillator a few cents sharp, the way a real chip drifted */
      if (layer === 'lead' && sp.double) this.voice(f, t0 + n[1] * st, n[2] * st * 0.92, sp.timbre.lead, vol * 0.33, { d: 8 });
    });
    play(sp.pad, 'pad');
    play(sp.bass, 'bass');
    play(sp.lead, 'lead');
    play(sp.arp, 'arp');
    const dv = BASE_VOL.drum * sp.rel.drum;
    (sp.kick || []).forEach(s => this.kick(t0 + s * st, dv * 0.9));
    (sp.snare || []).forEach(s => this.hit(t0 + s * st, 140, 1850, 0.9, dv * 0.6));
    (sp.hat || []).forEach(s => this.hit(t0 + s * st, 28, 8200, 1.7, dv * 0.35));
    return sp.len * st;
  },
  /* where the fader should sit: the boot ignores the switch and the pot's
     floor; the desktop obeys both and the mixer's lobby slider */
  target() {
    if (this.inBoot) return Math.max(0.0002, Math.max(musGain(), BOOT_FLOOR));
    return Math.max(0.0002, musGain() * Mixer.get('lobby') * (this.ducked ? 0.1 : 1));
  },
  /* something bigger is playing (the symphony): the lobby goes to the back, and comes up again after */
  duck(on) { this.ducked = !!on; this.level(); },
  allowed() {
    if (!CRT.on) return false;
    return this.inBoot || (Vol.lobby && Vol.mus > 0);
  },
  announce() { try { window.dispatchEvent(new CustomEvent('music-state')); } catch (e) {} },
  start() {
    if (this.on || !this.allowed()) return;
    if (!this.ensure()) return;
    this.on = true;
    this.active = this.inBoot ? 'hymn' : this.variant;
    this.n = 0;
    const g = this.bus.gain, now = Snd.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0.0001, now);
    g.exponentialRampToValueAtTime(this.target(), now + (this.inBoot ? 0.5 : 1.1));
    this.when = now + 0.15;
    this.tick();
    this.announce();
  },
  /* the MUS pot, riding the loop while it plays */
  level() {
    if (!this.bus || !Snd.ctx) return;
    const g = this.bus.gain, now = Snd.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(this.target(), now + 0.14);
  },
  /* the single place that decides whether the lobby is playing */
  sync() {
    if (!this.allowed()) { this.stop(); return; }
    /* leaving the boot onto a different variant: change the tune, not just the level */
    const want = this.inBoot ? 'hymn' : this.variant;
    if (this.on && want !== this.active) { this.swap(); return; }
    if (this.on) this.level(); else this.start();
  },
  /* the boot is the lobby, and it has its own song */
  bootStart() { this.inBoot = true; this.sync(); },
  bootEnd() { this.inBoot = false; this.struggle = null; this.sync(); },
  /* a machine that is struggling: the song comes through a wall and stutters
     until the boot has got its breath back */
  bootStruggle(seconds) {
    if (!this.ensure()) return;
    const c = Snd.ctx, t0 = c.currentTime;
    this.struggle = { until: t0 + seconds, lp: t => 260 + Math.pow(Math.max(0, (t - t0) / seconds), 2.2) * 19000 };
    this.lp.frequency.cancelScheduledValues(t0);
    this.lp.frequency.setValueAtTime(260, t0);
    this.lp.frequency.exponentialRampToValueAtTime(20000, t0 + seconds);
    /* brown-outs: the bus dips and comes back, a few times, less as it recovers */
    [0.9, 1.7, 2.1, 3.4, 4.6, 5.2].forEach(s => {
      if (s >= seconds) return;
      const g = this.bus.gain, a = t0 + s, tgt = this.target();
      g.setValueAtTime(Math.max(0.0001, tgt), a);
      g.exponentialRampToValueAtTime(0.0003, a + 0.03);
      g.setValueAtTime(0.0003, a + 0.28 - s * 0.03);
      g.exponentialRampToValueAtTime(tgt, a + 0.34 - s * 0.03);
    });
  },
  setVariant(id) {
    if (!VARIANTS.some(v => v.id === id)) return;
    this.variant = id;
    try { localStorage.setItem(VKEY, id); } catch (e) {}
    this.announce();
    this.sync();
  },
  swap() {
    this.stop();
    clearTimeout(this.rt);
    this.rt = setTimeout(() => this.sync(), 700);
  },
  tick() {
    if (!this.on || !Snd.ctx) return;
    const now = Snd.ctx.currentTime;
    if (this.when < now) this.when = now + 0.05;   /* the tab was asleep */
    const len = this.loop(this.when);
    this.when += len;
    this.timer = setTimeout(() => this.tick(), Math.max(250, len * 1000 - 400));
  },
  stop() {
    const was = this.on;
    this.on = false;
    clearTimeout(this.timer);
    if (!this.bus || !Snd.ctx) { this.voices = []; if (was) this.announce(); return; }
    const g = this.bus.gain, now = Snd.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(0.0001, now + 0.6);
    /* silence the queue behind the fade, not just the fader in front of it */
    this.voices.forEach(o => { try { o.stop(now + 0.62); } catch (e) {} });
    this.voices = [];
    if (was) this.announce();
  }
};
Music.VARIANTS = VARIANTS;

window.addEventListener('mixer-changed', ev => {
  if (ev.detail && ev.detail.channel === 'lobby') Music.level();
});
