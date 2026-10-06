/* The mixing desk. One strip per track, and a master:

     track -> [drive] -> low shelf -> mid -> high shelf -> [compressor] -> pan -> master
                   `---- send to the room        `---- send to the echo ----'

   master -> limiter -> out, with a meter on each side of the limiter's output.

   Every setting is a plain field on the track (see Studio): vol, pan, reverb,
   echo, eq [low, mid, high] in dB, comp 0..1, drive 0..1, mute, solo. A strip with
   nothing asked of it is not in the way: the drive and the compressor are only
   wired in while they are used, and the three EQ bands at 0 dB do nothing. The
   same desk is built on the live audio context to listen and on an offline one to
   bounce, so what you hear is what the file holds. */

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* a room: noise that dies away, darker as it goes */
function room(ctx) {
  const n = Math.floor(ctx.sampleRate * 1.8), buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      lp += ((Math.random() * 2 - 1) - lp) * (0.85 - 0.7 * t);
      d[i] = lp * Math.pow(1 - t, 2.6) * 1.4;
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

/* an echo, three eighths long at the song's own tempo, each repeat a little duller */
function echo(ctx) {
  const input = ctx.createGain(), dly = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), out = ctx.createGain();
  dly.delayTime.value = 0.36; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 3400; out.gain.value = 0.7;
  input.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(out);
  return { input, out, dly };
}

/* a soft clip: the harder the drive, the earlier it bends */
function driveCurve(ctx, amt) {
  const k = 1 + amt * 24, n = 1024, c = new Float32Array(n), norm = Math.tanh(k);
  for (let i = 0; i < n; i++) c[i] = Math.tanh(k * (i / (n - 1) * 2 - 1)) / norm;
  return c;
}

export const DEFAULT_EQ = [0, 0, 0];

/* the settings of one strip, filled in where a song did not say */
export const strip = t => ({
  /* `lv` is a level on top of the fader that a game rides while a song plays (kernel/deck.js levels()): 1 is the fader as set,
     0 is out. `glide` is how long, in seconds, the strip takes to get there. */
  vol: (t.vol == null ? 0.8 : t.vol) * (t.lv == null ? 1 : t.lv), pan: t.pan || 0, reverb: t.reverb == null ? 0.15 : t.reverb, echo: t.echo || 0,
  eq: t.eq || DEFAULT_EQ, comp: t.comp || 0, drive: t.drive || 0
});

/* master -> limiter -> out, a room beside it, one strip per track. `o.limit` is the limiter's threshold in dB (null: none). */
export function makeMix(ctx, dest, level, o) {
  o = o || {};
  const master = ctx.createGain();
  master.gain.value = level;
  const lim = ctx.createDynamicsCompressor();
  const setLimit = db => {
    if (db == null) { lim.threshold.value = 0; lim.ratio.value = 1; return; }
    lim.threshold.value = db; lim.knee.value = 10; lim.ratio.value = 10; lim.attack.value = 0.003; lim.release.value = 0.2;
  };
  setLimit(o.limit === undefined ? -9 : o.limit);
  /* the meter reads what the limiter lets out, one analyser a side */
  const split = ctx.createChannelSplitter(2), mL = ctx.createAnalyser(), mR = ctx.createAnalyser();
  mL.fftSize = mR.fftSize = 1024;
  master.connect(lim); lim.connect(dest); lim.connect(split); split.connect(mL, 0); split.connect(mR, 1);
  const rev = room(ctx), wet = ctx.createGain();
  wet.gain.value = 0.8;
  rev.connect(wet); wet.connect(master);
  const ech = echo(ctx);
  ech.out.connect(master);
  const buses = new Map();
  const bus = id => {
    let b = buses.get(id);
    if (b) return b;
    const input = ctx.createGain(), lo = ctx.createBiquadFilter(), mid = ctx.createBiquadFilter(), hi = ctx.createBiquadFilter();
    const pan = ctx.createStereoPanner(), send = ctx.createGain(), esend = ctx.createGain(), meter = ctx.createAnalyser();
    lo.type = 'lowshelf'; lo.frequency.value = 140;
    mid.type = 'peaking'; mid.frequency.value = 1400; mid.Q.value = 0.8;
    hi.type = 'highshelf'; hi.frequency.value = 6500;
    meter.fftSize = 512;
    input.gain.value = 0;                                  /* silent until the first apply(): a new strip must not start at full */
    input.connect(lo); lo.connect(mid); mid.connect(hi); hi.connect(pan); pan.connect(master);
    pan.connect(meter);
    input.connect(send); send.connect(rev);
    input.connect(esend); esend.connect(ech.input);
    b = { input, lo, mid, hi, pan, send, esend, meter, shaper: null, comp: null, last: '' };
    buses.set(id, b);
    return b;
  };
  /* put a node into the line between two others, or take it out again */
  const splice = (a, mid, z, on) => { try { a.disconnect(z); } catch (e) {} try { a.disconnect(mid); } catch (e) {} try { mid.disconnect(z); } catch (e) {} if (on) { a.connect(mid); mid.connect(z); } else a.connect(z); };
  /* levels from the tracks' own settings, solo and mute included; only what changed is written */
  const apply = (tracks, bpm, instant) => {
    const solo = tracks.some(t => t.solo), now = ctx.currentTime;
    /* `instant` is for a bounce, which has no time to glide: the settings are simply there from the start */
    const to = (param, v, tc) => { if (instant) param.setValueAtTime(v, now); else param.setTargetAtTime(v, now, tc); };
    if (bpm) to(ech.dly.delayTime, clamp(0.75 * 60 / bpm, 0.05, 1.9), 0.05);
    tracks.forEach(t => {
      const b = bus(t.id), s = strip(t), on = solo ? t.solo : !t.mute;
      const key = (on ? 1 : 0) + '|' + s.vol + '|' + s.pan + '|' + s.reverb + '|' + s.echo + '|' + s.eq.join(',') + '|' + s.comp + '|' + s.drive;
      if (key === b.last) return;
      b.last = key;
      to(b.input.gain, on ? Math.pow(Math.max(0, s.vol), 1.6) * 1.2 : 0, t.glide ? Math.max(0.015, t.glide / 3) : 0.015);
      to(b.pan.pan, clamp(s.pan, -1, 1), 0.02);
      to(b.send.gain, Math.max(0, s.reverb) * 0.9, 0.02);
      to(b.esend.gain, Math.max(0, s.echo) * 0.8, 0.02);
      to(b.lo.gain, clamp(s.eq[0], -18, 18), 0.02);
      to(b.mid.gain, clamp(s.eq[1], -18, 18), 0.02);
      to(b.hi.gain, clamp(s.eq[2], -18, 18), 0.02);
      if (s.drive > 0 && !b.shaper) { b.shaper = ctx.createWaveShaper(); b.shaper.oversample = '2x'; splice(b.input, b.shaper, b.lo, true); }
      if (b.shaper) { if (s.drive > 0) b.shaper.curve = driveCurve(ctx, s.drive); else { splice(b.input, b.shaper, b.lo, false); b.shaper = null; } }
      if (s.comp > 0 && !b.comp) { b.comp = ctx.createDynamicsCompressor(); b.comp.knee.value = 12; b.comp.attack.value = 0.008; b.comp.release.value = 0.18; splice(b.hi, b.comp, b.pan, true); }
      if (b.comp) {
        if (s.comp > 0) { b.comp.threshold.value = -8 - s.comp * 26; b.comp.ratio.value = 1.5 + s.comp * 9; }
        else { splice(b.hi, b.comp, b.pan, false); b.comp = null; }
      }
    });
  };
  /* what is going through now, 0..1 and in dB: peak and loudness, per strip and out of the master */
  const buf = new Float32Array(1024);
  const read = an => {
    an.getFloatTimeDomainData(buf);
    let pk = 0, sq = 0;
    for (let i = 0; i < an.fftSize; i++) { const v = Math.abs(buf[i]); if (v > pk) pk = v; sq += buf[i] * buf[i]; }
    return { peak: pk, rms: Math.sqrt(sq / an.fftSize) };
  };
  const meters = () => {
    const tr = {};
    buses.forEach((b, id) => { tr[id] = read(b.meter); });
    return { tracks: tr, l: read(mL), r: read(mR), reduction: lim.reduction };
  };
  return {
    master, bus, apply, meters, setLimit, ctx,
    setLevel(v) { master.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.04); },
    /* what a mix does on one speaker: the two sides summed, to hear whether anything cancels */
    setMono(on) { lim.channelCountMode = on ? 'explicit' : 'max'; lim.channelCount = on ? 1 : 2; },
    /* the analyser on the master, for a spectrum */
    spectrum() { return mL; }
  };
}
