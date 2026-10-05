/* The noises a bar makes. All of it goes through the machine's SFX bus, so
   the SFX knob turns it down like everything else. */
export function makeSfx(Snd) {
  const bus = c => Snd.sfx || c.destination;
  let pourNodes = null;
  const sfx = {
    /* the stream: filtered noise whose note rises as the glass fills */
    pourStart() {
      Snd.wake(); if (!Snd.ctx) return;
      const c = Snd.ctx, n = Math.floor(c.sampleRate * 2);
      const b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
      const s = c.createBufferSource(); s.buffer = b; s.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3.4; f.frequency.value = 420;
      const g = c.createGain(); g.gain.value = 0.0001;
      s.connect(f); f.connect(g); g.connect(bus(c));
      s.start();
      pourNodes = { s, f, g, c };
    },
    /* flow 0..1, fill 0..1 */
    pourSet(flow, fill) {
      if (!pourNodes) return;
      const { f, g, c } = pourNodes, t = c.currentTime;
      f.frequency.setTargetAtTime(420 + fill * 760, t, 0.05);
      g.gain.setTargetAtTime(Math.max(0.0001, 0.11 * flow), t, 0.04);
    },
    pourEnd() {
      if (!pourNodes) return;
      const { s, g, c } = pourNodes, t = c.currentTime;
      g.gain.setTargetAtTime(0.0001, t, 0.05);
      try { s.stop(t + 0.3); } catch (e) {}
      pourNodes = null;
    },
    /* air going into the bottle as the liquor comes out: a glug */
    glug(fill) {
      Snd.wake(); if (!Snd.ctx) return;
      const c = Snd.ctx, t = c.currentTime, o = c.createOscillator(), gn = c.createGain();
      const f0 = 130 + fill * 120 + Math.random() * 30;
      o.type = 'sine';
      o.frequency.setValueAtTime(f0 * 1.5, t);
      o.frequency.exponentialRampToValueAtTime(f0, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.8, t + 0.14);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(gn); gn.connect(bus(c));
      o.start(t); o.stop(t + 0.18);
    },
    drip() { Snd.tone(900 + Math.random() * 400, 40, { type: 'sine', to: 500, vol: 0.05 }); },
    drink() {
      Snd.wake(); if (!Snd.ctx) return;
      const c = Snd.ctx;
      /* three swallows, each a little lower than the last */
      [0.15, 0.50, 0.85].forEach((at, i) => {
        const o = c.createOscillator(), gn = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(190 - i * 34, c.currentTime + at);
        o.frequency.exponentialRampToValueAtTime(78 - i * 12, c.currentTime + at + 0.13);
        gn.gain.setValueAtTime(0.0001, c.currentTime + at);
        gn.gain.exponentialRampToValueAtTime(0.16, c.currentTime + at + 0.02);
        gn.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + 0.15);
        o.connect(gn); gn.connect(bus(c));
        o.start(c.currentTime + at); o.stop(c.currentTime + at + 0.2);
      });
      Snd.noise(90, { freq: 700, q: 1.1, vol: 0.05, delay: 1.25 });
      Snd.tone(150, 90, { type: 'triangle', to: 70, vol: 0.07, delay: 1.45 });   /* glass down */
    },
    cork() { Snd.tone(300, 60, { type: 'sine', to: 900, vol: 0.10 }); Snd.noise(50, { freq: 2200, q: 2, vol: 0.05, delay: 0.05 }); },
    cap()  { Snd.tone(420, 40, { type: 'square', to: 300, vol: 0.05 }); Snd.noise(30, { freq: 3000, q: 2, vol: 0.04 }); },
    clink() { Snd.tone(2400, 90, { type: 'sine', to: 2100, vol: 0.05 }); Snd.tone(3300, 60, { type: 'sine', vol: 0.025 }); },
    deny() { Snd.tone(150, 180, { type: 'sawtooth', vol: 0.05 }); }
  };
  return sfx;
}
