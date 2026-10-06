/* The studio: songs, a mixer, and a way to hear them.

   A SONG is plain data (see kernel/songtext.js for how to write one):

     { v: 1, title, bpm, key, scale, bars, beats, swing,
       tracks: [ { id, name, inst, vol, pan, reverb, mute, solo,
                   notes: [[start, dur, midi, vel], ...]        start and dur in beats
                   hits:  [[start, 'kick', vel], ...]            (drum tracks only) } ] }

   Every track has its own channel in a mixer: volume, pan, a send to a shared
   room, mute and solo, all of it live while the song plays. The channels meet
   in one master, which follows the MUS knob on the panel and this app's slider
   in the taskbar mixer, and goes through a limiter so a full band cannot clip.

   Studio.play(song, { loop, from, metronome, onEnd }) plays through the machine's
   own speaker, scheduling a little ahead of itself so the timing does not depend
   on this page keeping up. Studio.render(song) plays the same thing into an offline
   context and hands back the audio, to bounce a song to a file. Studio.live() is
   for a key being held down. Nothing in here draws anything. */
import { Snd } from './snd.js';
import * as Ins from './instruments.js';
import * as Lang from './songtext.js';

const SLICE = 0.25, AHEAD = 0.16, TICK = 25;

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

/* master -> limiter -> out, a room beside it, one bus per track */
export function makeMix(ctx, dest, level) {
  const master = ctx.createGain();
  master.gain.value = level;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -9; lim.knee.value = 10; lim.ratio.value = 10; lim.attack.value = 0.003; lim.release.value = 0.2;
  master.connect(lim); lim.connect(dest);
  const rev = room(ctx), wet = ctx.createGain();
  wet.gain.value = 0.8;
  rev.connect(wet); wet.connect(master);
  const buses = new Map();
  const bus = id => {
    let b = buses.get(id);
    if (!b) {
      const input = ctx.createGain(), pan = ctx.createStereoPanner(), send = ctx.createGain();
      input.connect(pan); pan.connect(master); input.connect(send); send.connect(rev);
      b = { input, pan, send };
      buses.set(id, b);
    }
    return b;
  };
  /* levels from the tracks' own settings, solo and mute included */
  const apply = tracks => {
    const solo = tracks.some(t => t.solo), now = ctx.currentTime;
    tracks.forEach(t => {
      const b = bus(t.id), on = solo ? t.solo : !t.mute;
      b.input.gain.setTargetAtTime(on ? Math.pow(Math.max(0, t.vol == null ? 0.8 : t.vol), 1.6) * 1.2 : 0, now, 0.015);
      b.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, t.pan || 0)), now, 0.02);
      b.send.gain.setTargetAtTime(Math.max(0, t.reverb == null ? 0.15 : t.reverb) * 0.9, now, 0.02);
    });
  };
  return { master, bus, apply, setLevel(v) { master.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.04); } };
}

/* everything in beats [b0, b1) of the song, to sound at time t (seconds on ctx's clock) */
function slice(ctx, mix, song, b0, b1, t, spb, track, live) {
  const solo = song.tracks.some(x => x.solo);
  song.tracks.forEach(tr => {
    if (solo ? !tr.solo : tr.mute) return;
    const bank = Ins.ready(tr.inst) ? Ins.cached(tr.inst) : null;
    if (!bank) { Ins.load(tr.inst).catch(() => {}); return; }
    const dest = mix.bus(tr.id).input;
    const when = s => {
      let w = t + (s - b0) * spb;
      if (song.swing && Math.abs(((s * 2) % 2) - 1) < 1e-6) w += song.swing * 0.17 * spb;     /* the off-beat eighths lean late */
      return w;
    };
    if (tr.inst === 'drums') (tr.hits || []).forEach(h => { if (h[0] >= b0 && h[0] < b1) { const x = Ins.hit(ctx, bank, h[1], when(h[0]), h[2], dest); if (x && live) live.add(x); } });
    else (tr.notes || []).forEach(n => {
      if (n[0] >= b0 && n[0] < b1) { const x = Ins.note(ctx, bank, n[2], when(n[0]), n[1] * spb, n[3], dest); if (x && live) live.add(x); }
    });
  });
}

function wav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [];
  for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
  return new Blob([out.buffer], { type: 'audio/wav' });
}

export const Studio = {
  lang: Lang, ins: Ins, user: 1, mix: null, follow: 0, followT: null,

  /* the level the master should sit at: the MUS knob, the taskbar mixer, and this app's own slider */
  level() {
    const crt = window.CRT;
    const knob = crt ? Math.pow((crt.mus || 0) / 10, 1.6) * 0.85 : 0.5;
    return knob * (window.Mixer ? window.Mixer.get('garage') : 1) * this.user;
  },
  knob() { return window.CRT ? window.CRT.mus || 0 : 0; },
  /* turn the MUS pot up on the panel, the way a hand would: arrow keys on the pot */
  turnUp(to) {
    const pot = document.getElementById('pot-mus');
    if (!pot || !window.CRT) return;
    for (let i = 0; i < 12 && (window.CRT.mus || 0) < to; i++) pot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    this.relevel();
  },
  ensure() {
    Snd.wake();
    if (!Snd.ctx) return false;
    if (!this.mix) this.mix = makeMix(Snd.ctx, Snd.ctx.destination, this.level());
    return true;
  },
  relevel() { if (this.mix) this.mix.setLevel(this.level()); },
  /* while anything is playing, keep following the knob */
  _follow(on) {
    this.follow += on ? 1 : -1;
    if (this.follow > 0 && !this.followT) this.followT = setInterval(() => this.relevel(), 200);
    if (this.follow <= 0) { this.follow = 0; clearInterval(this.followT); this.followT = null; }
  },
  async preload(song) {
    await Ins.index();
    await Promise.all(song.tracks.map(t => Ins.load(t.inst).catch(() => null)));
  },

  /* play a song through the speaker. Returns a player. */
  play(song, o) {
    o = o || {};
    if (!this.ensure()) return null;
    const ctx = Snd.ctx, mix = this.mix, live = new Set();
    this._follow(true);
    this.relevel();
    const loop = o.loop !== false, len = () => Lang.songLength(song);
    let nextBeat = o.from || 0, nextTime = ctx.currentTime + 0.1, done = false, finishAt = 0;
    const marks = [[nextTime, nextBeat]];
    const p = {
      playing: true,
      beat() {
        const now = ctx.currentTime;
        let m = marks[0];
        for (const k of marks) if (k[0] <= now) m = k;
        return m[1] + Math.max(0, now - m[0]) / (60 / song.bpm);
      },
      refresh() { mix.apply(song.tracks); },
      stop() {
        if (!p.playing) return;
        p.playing = false;
        clearInterval(timer);
        live.forEach(h => h.kill());
        live.clear();
        Studio._follow(false);
      }
    };
    song.tracks.forEach(t => mix.bus(t.id));
    mix.apply(song.tracks);
    const tick = () => {
      if (!p.playing) return;
      const spb = 60 / song.bpm;
      if (done) { if (ctx.currentTime > finishAt) { p.stop(); if (o.onEnd) o.onEnd(); } return; }
      while (nextTime < ctx.currentTime + AHEAD) {
        mix.apply(song.tracks);
        slice(ctx, mix, song, nextBeat, nextBeat + SLICE, nextTime, spb, null, live);
        if (o.metronome && Math.abs(nextBeat - Math.round(nextBeat)) < 1e-6) {
          const strong = Math.round(nextBeat) % song.beats === 0;
          Studio._click(ctx, nextTime, strong);
        }
        marks.push([nextTime, nextBeat]);
        if (marks.length > 24) marks.shift();
        nextBeat += SLICE; nextTime += SLICE * spb;
        if (nextBeat >= len() - 1e-6) {
          if (loop) nextBeat = 0;
          else { done = true; finishAt = nextTime + 1.5; break; }
        }
      }
    };
    const timer = setInterval(tick, TICK);
    tick();
    return p;
  },
  _click(ctx, t, strong) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = strong ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(this.mix.master); o.start(t); o.stop(t + 0.06);
  },

  /* a key held down: sounds until off() */
  live(inst, midi, vel, track) {
    if (!this.ensure()) return null;
    const ctx = Snd.ctx, bank = Ins.ready(inst) ? Ins.cached(inst) : null;
    const tr = Object.assign({ id: '__live', vol: 0.9, pan: 0, reverb: 0.2 }, track || {});
    this.mix.apply([tr]);
    this._follow(true);
    this.relevel();
    let h = null, off = false;
    const start = b => {
      if (off) return;
      const dest = this.mix.bus('__live').input, t = ctx.currentTime + 0.005;
      h = inst === 'drums' ? Ins.hit(ctx, b, midi, t, vel, dest) : Ins.note(ctx, b, midi, t, Infinity, vel, dest);
    };
    if (bank) start(bank); else Ins.load(inst).then(start).catch(() => {});
    return { off() { if (off) return; off = true; if (h) h.stop(ctx.currentTime + 0.01); Studio._follow(false); } };
  },
  /* a single note of a given length, for a button to demonstrate with */
  async tap(inst, midi, seconds, vel, track) {
    await Ins.load(inst);
    const k = this.live(inst, midi, vel, track);
    if (!k) return;
    if (inst === 'drums') { setTimeout(() => k.off(), 50); return; }
    setTimeout(() => k.off(), (seconds || 0.6) * 1000);
  },

  /* the song, as audio, played into an offline context */
  async render(song, o) {
    o = o || {};
    await this.preload(song);
    const sr = 44100, reps = o.repeat || 1, beats = Lang.songLength(song) * reps, spb = 60 / song.bpm;
    const oc = new OfflineAudioContext(2, Math.ceil((beats * spb + 3) * sr), sr);
    const mix = makeMix(oc, oc.destination, o.level == null ? 0.9 : o.level);
    mix.apply(song.tracks);
    /* the song repeated: shift by whole songs */
    for (let r = 0; r < reps; r++) slice(oc, mix, song, 0, Lang.songLength(song), r * Lang.songLength(song) * spb, spb, null, null);
    return oc.startRendering();
  },
  wav
};
window.Studio = Studio;
window.addEventListener('mixer-changed', ev => { if (ev.detail && ev.detail.channel === 'garage') Studio.relevel(); });
