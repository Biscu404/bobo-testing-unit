/* AfterEgypt's sound effects, the small instrument they are played on: tones, noise through a moving filter, a buzz, and one
 * continuous loop. Everything goes through ONE gain (`bus`) that is the taskbar mixer's AFTEREGYPT slider, and from it into the machine's SFX
 * bus (Snd.sfx, which the SFX knob and the power switch govern: see `host.on()`), the way the garden's wind and the bottle's pour do.
 *
 * `host` is what the machine gives it, so that this file knows nothing about the machine and can be run against any audio context:
 *   host.ctx()     the AudioContext (or null: no sound card, nothing is played)
 *   host.bus()     the node every effect ends in
 *   host.on()      whether the SFX knob is up and the power is on
 *   host.level()   the mixer slider, 0..1
 * No sound is ever scheduled in the past, and nothing outlives `stop()`.
 */
const FLOOR = 0.0001;
/* the effects are written at the loudness of the machine's own beeps (Snd.tone); a score is playing under these ones, so they sit this much above them */
const TRIM = 1.6;

export function makeSynth(host) {
  const live = new Set();                       /* every source still to end: stop() cuts them */
  let bus = null, busCtx = null, noiseBuf = null, loopNode = null;

  function out() {
    const c = host.ctx();
    if (!c) return null;
    if (!bus || busCtx !== c) {
      busCtx = c; noiseBuf = null;
      bus = c.createGain(); bus.gain.value = host.level() * TRIM;
      bus.connect(host.bus());
    }
    return bus;
  }
  const noiseBuffer = c => {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  };
  /* the start time of a sound `delay` seconds from now (a context that has not been resumed yet is given a hair of lead) */
  const when = (c, delay) => c.currentTime + (c.state === 'running' ? 0 : 0.06) + (delay || 0);
  const track = (src, nodes, end) => {
    live.add(src);
    src.onended = () => { live.delete(src); nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); };
    try { src.stop(end); } catch (e) {}
  };
  /* gain: a percussive swell (linear attack, exponential decay) or, with `env`, [[seconds, 0..1], ...] ridden linearly */
  function shape(g, t0, dur, vol, o) {
    g.setValueAtTime(FLOOR, t0);
    if (o.env) { o.env.forEach(e => g.linearRampToValueAtTime(Math.max(FLOOR, e[1] * vol), t0 + e[0])); return; }
    g.linearRampToValueAtTime(vol, t0 + (o.attack == null ? 0.004 : o.attack));
    g.exponentialRampToValueAtTime(FLOOR, t0 + dur);
  }
  /* source -> [filter] -> amp -> [pan] -> bus, returning the amp's gain param for shaping */
  function chain(c, src, o, filter) {
    const amp = c.createGain(), nodes = [src, amp];
    let head = src;
    if (filter) { head.connect(filter); head = filter; nodes.push(filter); }
    head.connect(amp); head = amp;
    if (o.pan != null && c.createStereoPanner) {
      const p = c.createStereoPanner(); p.pan.value = o.pan;
      if (o.panTo != null) p.pan.linearRampToValueAtTime(o.panTo, when(c, o.delay) + o.dur);
      head.connect(p); head = p; nodes.push(p);
    }
    head.connect(bus);
    return { amp, nodes };
  }

  const S = {
    /* a pitched sound: { f, to, dur, type, vol, delay, attack, env, pan, panTo } */
    tone(o) {
      if (!host.on()) return;
      const c = host.ctx(); if (!c || !out()) return;
      const t0 = when(c, o.delay), osc = c.createOscillator();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.f, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
      const ch = chain(c, osc, o);
      shape(ch.amp.gain, t0, o.dur, o.vol == null ? 0.04 : o.vol, o);
      osc.start(t0);
      track(osc, ch.nodes, t0 + o.dur + 0.05);
    },
    /* noise through a filter that moves from f0 to f1: { dur, f0, f1, q, kind, vol, delay, attack, env, pan, panTo } */
    noise(o) {
      if (!host.on()) return;
      const c = host.ctx(); if (!c || !out()) return;
      const t0 = when(c, o.delay), src = c.createBufferSource(), f = c.createBiquadFilter();
      src.buffer = noiseBuffer(c); src.loop = true;
      f.type = o.kind || 'bandpass'; f.Q.value = o.q || 1;
      f.frequency.setValueAtTime(o.f0, t0);
      if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + o.dur);
      const ch = chain(c, src, o, f);
      shape(ch.amp.gain, t0, o.dur, o.vol == null ? 0.05 : o.vol, o);
      src.start(t0, Math.random());
      track(src, ch.nodes, t0 + o.dur + 0.05);
    },
    /* a buzz: a saw whose loudness is chopped `rate` times a second, through a band: { f, to, rate, dur, vol, pan, panTo, env } */
    buzz(o) {
      if (!host.on()) return;
      const c = host.ctx(); if (!c || !out()) return;
      const t0 = when(c, o.delay), osc = c.createOscillator(), lfo = c.createOscillator(), chop = c.createGain(), depth = c.createGain(), band = c.createBiquadFilter();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(o.f, t0);
      if (o.to) osc.frequency.linearRampToValueAtTime(o.to, t0 + o.dur * 0.8);
      lfo.type = 'square'; lfo.frequency.value = o.rate || 60;
      chop.gain.value = 0.55; depth.gain.value = 0.45;
      lfo.connect(depth); depth.connect(chop.gain);
      band.type = 'bandpass'; band.frequency.value = o.band || 1100; band.Q.value = 1.6;
      osc.connect(chop);
      const ch = chain(c, chop, o, band);
      shape(ch.amp.gain, t0, o.dur, o.vol == null ? 0.05 : o.vol, o);
      osc.start(t0); lfo.start(t0);
      live.add(lfo);
      try { lfo.stop(t0 + o.dur + 0.05); } catch (e) {}
      lfo.onended = () => { live.delete(lfo); };
      track(osc, ch.nodes.concat([chop, depth, lfo]), t0 + o.dur + 0.05);
    },
    /* the one continuous sound: a quiet band of air that follows the ship. set(f, g) moves it, off() lets it go */
    loop() {
      if (loopNode || !host.on()) return;
      const c = host.ctx(); if (!c || !out()) return;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), amp = c.createGain();
      src.buffer = noiseBuffer(c); src.loop = true;
      f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.value = 500; amp.gain.value = FLOOR;
      src.connect(f); f.connect(amp); amp.connect(bus);
      src.start(c.currentTime, Math.random());
      loopNode = { src, f, amp, c };
    },
    set(freq, gain) {
      if (!loopNode) return;
      const t = loopNode.c.currentTime;
      loopNode.f.frequency.setTargetAtTime(freq, t, 0.06);
      loopNode.amp.gain.setTargetAtTime(Math.max(FLOOR, gain), t, 0.06);
    },
    off() {
      if (!loopNode) return;
      const { src, f, amp, c } = loopNode; loopNode = null;
      try { amp.gain.setTargetAtTime(FLOOR, c.currentTime, 0.05); src.stop(c.currentTime + 0.4); } catch (e) {}
      src.onended = () => { try { src.disconnect(); f.disconnect(); amp.disconnect(); } catch (e) {} };
    },
    /* the mixer slider moved */
    relevel() { if (bus && busCtx) bus.gain.setTargetAtTime(Math.max(FLOOR, host.level() * TRIM), busCtx.currentTime, 0.04); },
    /* the window is closing: nothing is left running */
    stop() {
      S.off();
      live.forEach(n => { try { n.stop(); } catch (e) {} });
      live.clear();
      if (bus) { try { bus.disconnect(); } catch (e) {} bus = null; }
    },
    get live() { return live.size + (loopNode ? 1 : 0); }
  };
  return S;
}
