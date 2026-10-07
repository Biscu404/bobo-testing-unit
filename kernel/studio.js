/* The studio: songs, a mixer, and a way to hear them.

   A SONG is plain data (see kernel/songtext.js for how to write one):

     { v: 1, title, bpm, key, scale, bars, beats, swing,
       tracks: [ { id, name, inst, vol, pan, reverb, echo, eq: [lo, mid, hi], comp, drive, mute, solo,
                   notes: [[start, dur, midi, vel], ...]        start and dur in beats
                   hits:  [[start, 'kick', vel], ...]            (drum tracks only) } ] }

   Every track has its own strip on a desk (kernel/studio_mix.js): volume, pan, a
   room, an echo, three bands of EQ, a compressor and a drive, all of it live while
   the song plays, with mute and solo. The strips meet in one master and a limiter.

   Whoever plays a song does it on a CHANNEL (the Garage on 'garage', Bekkedal on
   'bekkedal'): the machine's MUS knob and that channel's slider in the taskbar mixer
   set how loud it is, and nothing else's. Every player has a desk of its own, so two
   songs can be on one channel at once (a crossfade) and each can be faded on its own.

   Studio.play(song, { loop, loopFrom, loopTo, from, countIn, metronome, channel, onEnd })
   plays through the machine's own speaker, scheduling a little ahead of itself so the
   timing does not depend on this page keeping up. Studio.render(song) plays the same
   thing into an offline context and hands back the audio, to bounce a song to a file.
   Studio.live() is for a key being held down. Nothing in here draws anything. */
import { Snd } from './snd.js';
import * as Ins from './instruments.js';
import * as Lang from './songtext.js';
import { makeMix } from './studio_mix.js';
import { wavBlob } from './wavfile.js';
import * as Midi from './midi.js';
import { makeDeck } from './deck.js';

const SLICE = 0.25, AHEAD = 0.16, TICK = 25;

/* everything in beats [b0, b1) of the song, to sound at time t (seconds on ctx's clock) */
function slice(ctx, mix, song, b0, b1, t, spb, live) {
  const solo = song.tracks.some(x => x.solo);
  const keep = x => {
    if (!x || !live) return;
    live.add(x);
    const was = x.src.onended;
    x.src.onended = () => { live.delete(x); if (was) was(); };
  };
  song.tracks.forEach(tr => {
    if (solo ? !tr.solo : tr.mute) return;
    const bank = Ins.ready(tr.inst) ? Ins.cached(tr.inst) : null;
    if (!bank) { Ins.load(tr.inst).catch(() => {}); return; }
    if (tr.lv === 0 && ctx.currentTime > (tr.lvOff || 0)) return;        /* a layer that has faded right out plays nothing at all */
    const dest = mix.bus(tr.id).input;
    const when = s => {
      let w = t + (s - b0) * spb;
      if (song.swing && Math.abs(((s * 2) % 2) - 1) < 1e-6) w += song.swing * 0.17 * spb;     /* the off-beat eighths lean late */
      return w;
    };
    if (tr.inst === 'drums') (tr.hits || []).forEach(h => { if (h[0] >= b0 && h[0] < b1) keep(Ins.hit(ctx, bank, h[1], when(h[0]), h[2], dest)); });
    else (tr.notes || []).forEach(n => { if (n[0] >= b0 && n[0] < b1) keep(Ins.note(ctx, bank, n[2], when(n[0]), n[1] * spb, n[3], dest)); });
  });
}

export const Studio = {
  lang: Lang, ins: Ins, midi: Midi, user: 1, follow: 0, followT: null, chans: new Map(), lives: new Map(), decks: new Map(), insert: null,
  /* the deck for a game's own channel: see kernel/deck.js */
  deck(id) { let d = this.decks.get(id); if (!d) { d = makeDeck(this, id); this.decks.set(id, d); } return d; },

  /* the level a channel should sit at: the MUS knob, the taskbar mixer's slider for it, and (the Garage) its own slider */
  level(id) {
    id = id || 'garage';
    const crt = window.CRT;
    const knob = crt ? Math.pow((crt.mus || 0) / 10, 1.6) * 0.85 : 0.5;
    return knob * (window.Mixer ? window.Mixer.get(id) : 1) * (id === 'garage' ? this.user : 1);
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
    return !!Snd.ctx;
  },
  audioContext() { return Snd.ctx; },
  /* a channel: one gain that everything playing on it goes through */
  channel(id) {
    id = id || 'garage';
    let c = this.chans.get(id);
    if (!c) {
      const out = Snd.ctx.createGain();
      out.gain.value = this.level(id);
      out.connect(this.insert || Snd.ctx.destination);
      c = { id, out };
      this.chans.set(id, c);
    }
    return c;
  },
  relevel() { this.chans.forEach((c, id) => c.out.gain.setTargetAtTime(Math.max(0.0001, this.level(id)), Snd.ctx.currentTime, 0.04)); },
  /* send every channel through `node` (or back to the speaker): where the glitch lives */
  setInsert(node) {
    this.insert = node || null;
    this.chans.forEach(c => { try { c.out.disconnect(); } catch (e) {} c.out.connect(this.insert || Snd.ctx.destination); });
  },
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
    const ctx = Snd.ctx, chan = this.channel(o.channel), mix = makeMix(ctx, chan.out, 1, { limit: o.limit }), live = new Set();
    this._follow(true);
    this.relevel();
    let loop = o.loop !== false, loopFrom = o.loopFrom || 0, loopTo = o.loopTo == null ? null : o.loopTo;
    const len = () => Lang.songLength(song), end = () => loopTo == null ? len() : Math.min(loopTo, len());
    const from = o.from || 0, cin = o.countIn || 0;
    /* `startAt` is a time on the audio clock: the first note sounds then, and not before (a song can be queued to begin
       exactly when another one ends). `ahead` is how far in front of the clock notes are put on it: the default is
       tight enough for a key held down to feel live; a score nobody is playing by hand wants far more, because a
       stalled page (a cache rebuild, a long frame) that cannot refill the queue in time makes notes bunch up late. */
    const ahead = o.ahead || AHEAD;
    let nextBeat = from - cin, nextTime = o.startAt != null ? Math.max(ctx.currentTime + 0.05, o.startAt) : ctx.currentTime + 0.1,
        done = false, finishAt = 0, stopAt = 0, counting = cin > 0;
    let marks = [[nextTime, nextBeat]];
    const p = {
      playing: true, mix,
      beat() {
        const now = ctx.currentTime;
        let m = marks[0];
        for (const k of marks) if (k[0] <= now) m = k;
        return m[1] + Math.max(0, now - m[0]) / (60 / song.bpm);
      },
      refresh() { mix.apply(song.tracks, song.bpm); },
      /* jump to a beat, now: whatever was scheduled ahead is dropped */
      seek(beat) {
        live.forEach(h => h.kill()); live.clear();
        nextBeat = Math.max(0, beat); nextTime = ctx.currentTime + 0.05; done = false; counting = false;
        marks = [[nextTime, nextBeat]];
      },
      setLoop(on, a, b) { loop = on; loopFrom = a || 0; loopTo = b == null ? null : b; },
      setMetronome(on) { o.metronome = on; },
      levels() { return mix.meters(); },
      /* ride the whole player's level: `to` is 0..1, over `secs`; `at` (a time on the audio clock) starts the ride later */
      fade(to, secs, at) {
        const g = mix.master.gain, now = ctx.currentTime, t0 = Math.max(now, at == null ? now : at);
        g.cancelScheduledValues(now); g.setValueAtTime(Math.max(0.0001, g.value), now);
        if (t0 > now) g.setValueAtTime(Math.max(0.0001, g.value), t0);
        g.linearRampToValueAtTime(Math.max(0.0001, to), t0 + Math.max(0.01, secs));
      },
      /* seconds until the song next reaches the end of its loop (or its end), and until its next bar line */
      remaining() { return Math.max(0, (end() - p.beat()) * (60 / song.bpm)); },
      toBar() { const per = song.beats || 4, b = p.beat(); return Math.max(0, (Math.ceil(b / per - 1e-6) * per - b) * (60 / song.bpm)); },
      get bpm() { return song.bpm; },
      /* stop, optionally after fading out over `secs`, the fade beginning at audio time `at` if one is given */
      stop(secs, at) {
        if (!p.playing) return;
        p.playing = false;
        clearInterval(timer);
        const finish = () => { live.forEach(h => h.kill()); live.clear(); try { mix.master.disconnect(); } catch (e) {} };
        if (secs > 0) { p.fade(0, secs, at); stopAt = setTimeout(finish, (Math.max(0, (at || 0) - ctx.currentTime) + secs) * 1000 + 80); } else finish();
        Studio._follow(false);
      }
    };
    song.tracks.forEach(t => mix.bus(t.id));
    mix.apply(song.tracks, song.bpm);
    /* a song queued to begin later fades in from when it begins, not from now */
    if (o.fadeIn > 0) { mix.master.gain.value = 0.0001; p.fade(1, o.fadeIn, o.startAt); }
    const tick = () => {
      if (!p.playing) return;
      const spb = 60 / song.bpm;
      if (done) { if (ctx.currentTime > finishAt) { p.stop(1.2); if (o.onEnd) o.onEnd(); } return; }      /* the tail dies away rather than being cut */
      while (nextTime < ctx.currentTime + ahead) {
        mix.apply(song.tracks, song.bpm);
        if (counting && nextBeat >= from - 1e-6) counting = false;      /* the count-in is clicks only: nothing sounds until the music starts */
        if (!counting) slice(ctx, mix, song, nextBeat, nextBeat + SLICE, nextTime, spb, live);
        const onBeat = Math.abs(nextBeat - Math.round(nextBeat)) < 1e-6;
        if (onBeat && (o.metronome || counting)) {
          const strong = (((Math.round(nextBeat) % song.beats) + song.beats) % song.beats) === 0;
          Studio._click(ctx, mix, nextTime, strong);
        }
        marks.push([nextTime, nextBeat]);
        if (marks.length > 24) marks.shift();
        nextBeat += SLICE; nextTime += SLICE * spb;
        if (nextBeat >= end() - 1e-6) {
          if (loop) nextBeat = loopFrom;
          else { done = true; finishAt = nextTime + 1.5; break; }
        }
      }
    };
    const timer = setInterval(tick, TICK);
    tick();
    return p;
  },
  _click(ctx, mix, t, strong) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = strong ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(mix.master); o.start(t); o.stop(t + 0.06);
  },

  /* a key held down: sounds until off(). Keys on a channel share one small desk. */
  live(inst, midi, vel, track, channel) {
    if (!this.ensure()) return null;
    const ctx = Snd.ctx, bank = Ins.ready(inst) ? Ins.cached(inst) : null;
    const cid = channel || 'garage';
    let lm = this.lives.get(cid);
    if (!lm) { lm = makeMix(ctx, this.channel(cid).out, 1); this.lives.set(cid, lm); }
    const tr = Object.assign({ id: '__live', vol: 0.9, pan: 0, reverb: 0.2 }, track || {}, { id: '__live', mute: false, solo: false });
    lm.apply([tr]);
    this._follow(true);
    this.relevel();
    let h = null, off = false;
    const start = b => {
      if (off) return;
      const dest = lm.bus('__live').input, t = ctx.currentTime + 0.005;
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

  /* the song, as audio, played into an offline context.
     o: { repeat, level, from, to (beats: just that part), only: a track id (a stem), tail (seconds), limit (dB or null), sampleRate }
     A long piece is not built as one great graph (every note of it would be a node the whole time, and the
     render would crawl): it is rendered in stretches of about twenty seconds, each with a few seconds of tail,
     and the stretches laid end to end with their tails added into whatever follows. */
  async render(song, o) {
    o = o || {};
    await this.preload(song);
    const sr = o.sampleRate || 44100, spb = 60 / song.bpm, reps = o.repeat || 1, tailS = o.tail == null ? 3 : o.tail;
    const b0 = o.from || 0, b1 = o.to == null ? Lang.songLength(song) : o.to, span = b1 - b0, total = span * reps;
    const tracks = o.only ? song.tracks.map(t => Object.assign({}, t, { solo: t.id === o.only, mute: false })) : song.tracks;
    const copy = Object.assign({}, song, { tracks });
    const out = new AudioBuffer({ numberOfChannels: 2, length: Math.ceil((total * spb + tailS) * sr), sampleRate: sr });
    const chunk = Math.max(8, Math.round(20 / spb / 4) * 4), CT = 3.5;
    for (let t0 = 0; t0 < total - 1e-9; t0 += chunk) {
      const t1 = Math.min(total, t0 + chunk), last = t1 >= total - 1e-9;
      const oc = new OfflineAudioContext(2, Math.ceil(((t1 - t0) * spb + (last ? tailS : CT)) * sr), sr);
      const mix = makeMix(oc, oc.destination, o.level == null ? 0.9 : o.level, { limit: o.limit });
      mix.apply(tracks, song.bpm, true);
      /* each repeat of the part that falls inside this stretch, shifted to where it sits in it */
      for (let r = 0; r < reps; r++) {
        const lo = Math.max(t0, r * span), hi = Math.min(t1, (r + 1) * span);
        if (hi > lo) slice(oc, mix, copy, b0 + lo - r * span, b0 + hi - r * span, (lo - t0) * spb, spb, null);
      }
      const buf = await oc.startRendering(), at = Math.round(t0 * spb * sr);
      for (let c = 0; c < 2; c++) {
        const dst = out.getChannelData(c), src = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)), n = Math.min(src.length, dst.length - at);
        for (let i = 0; i < n; i++) dst[at + i] += src[i];
      }
    }
    return out;
  },
  wav(buf, o) { return wavBlob(buf, o); },
  seconds(song) { return Lang.songLength(song) * 60 / song.bpm; }
};
if (typeof window !== 'undefined') {
  window.Studio = Studio;
  /* smoke.mjs loads apps under a stub window that cannot listen */
  if (window.addEventListener) window.addEventListener('mixer-changed', () => Studio.relevel());
}
