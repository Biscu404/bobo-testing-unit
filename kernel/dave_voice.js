/* Dave's voice, made of nothing: one `sound` of kernel/dave_plan.js (a vowel, a pop, a hiss, a hum) as a few milliseconds of
   Web Audio on the machine's own SFX bus, so the SFX knob and the power switch govern it like every other click and chirp
   (kernel/snd.js), and the SFX knob at nought, or the set switched off, makes no sound at all. No sample files. */
import { Snd } from './snd.js';
import { CRT } from './hardware.js';

let noiseBuf = null, noiseRate = 0;
function noise(ctx) {
  if (noiseBuf && noiseRate === ctx.sampleRate) return noiseBuf;
  const n = Math.floor(ctx.sampleRate * 0.3);
  noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  noiseRate = ctx.sampleRate;
  return noiseBuf;
}

export const Voice = {
  /* can he be heard at all right now: the set is on, and the SFX knob is above nought */
  audible() { return !!CRT.on && CRT.sfx > 0; },
  calls: 0,                                  /* how many sounds have been made (a check reads this) */

  /* make one sound; false if nothing was made */
  play(s) {
    if (!s || !this.audible()) return false;
    Snd.wake();
    const ctx = Snd.ctx, bus = Snd.sfx;
    if (!ctx || !bus) return false;
    this.calls++;
    const t0 = Snd.at({});
    const end = t0 + s.dur;
    const amp = ctx.createGain();
    const peak = Math.max(0.0002, 0.065 * s.gain);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.01, s.dur * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    amp.connect(bus);

    if (s.k === 'v' || s.k === 'n') {
      /* the buzz of the throat (two saws a hair apart, so it is a voice and not a tone) through the mouth (two band-pass filters) */
      const mix = ctx.createGain();
      mix.gain.value = 1;
      [1, 1.009].forEach(det => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(s.f0 * det, t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(40, s.f0 * det * s.bend), end);
        o.connect(mix);
        o.start(t0);
        o.stop(end + 0.03);
      });
      [[s.f1, 1, 5], [s.f2, 0.55, 7]].forEach(([f, g, q]) => {
        const b = ctx.createBiquadFilter();
        b.type = 'bandpass';
        b.frequency.value = f;
        b.Q.value = q;
        const gg = ctx.createGain();
        gg.gain.value = g * (s.k === 'n' ? 0.8 : 1.6);
        mix.connect(b); b.connect(gg); gg.connect(amp);
      });
    } else {
      /* a puff of noise through one band-pass filter, and for a plosive a low pop under it */
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const b = ctx.createBiquadFilter();
      b.type = 'bandpass';
      b.frequency.value = s.f1;
      b.Q.value = s.k === 'p' ? 1.4 : 0.9;
      src.connect(b); b.connect(amp);
      src.start(t0, Math.random() * 0.2, s.dur + 0.02);
      if (s.k === 'p') {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(s.f0, t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(40, s.f0 * 0.5), end);
        const og = ctx.createGain();
        og.gain.value = 0.9;
        o.connect(og); og.connect(amp);
        o.start(t0);
        o.stop(end + 0.03);
      }
    }
    return true;
  }
};
