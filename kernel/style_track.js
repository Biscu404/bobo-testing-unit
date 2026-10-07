/* The style meter's song. The meter asks for it the moment it reads HAPPY BIRTHDAY and lets it go when the meter
   does: it is faded out, not cut, and if the meter comes back to the top while it is still fading it simply starts again
   from the beginning, under the tail of the old one. What it plays, when it comes in, and how it comes round again is
   kernel/style_track_plan.js; this is the part that makes the sound.

   The song is a recording, decoded once (the first time the meter reaches the C rank, so it is ready long before it is
   wanted) and played from memory, on a channel of its own in the studio: only the MUS knob sets how loud it is, and the
   glitch that takes over a meter held at the top reaches it like every other sound. TheStack plays the same decoded
   recording as a disc. */
import { Snd } from './snd.js';
import { Studio } from './studio.js';
import * as P from './style_track_plan.js';

/* the first time the meter reads HAPPY BIRTHDAY the song is added to the Stack; this is the memory of that.
   The key keeps the name it has always had, so a machine that has already earned the folder keeps it. */
const KEY = 'templeos.symphony.v1';
export const unlocked = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
export const unlock = () => { try { localStorage.setItem(KEY, '1'); } catch (e) {} };

let loading = null;
/* the recording as an AudioBuffer, fetched and decoded once for everybody (the meter and the Stack) */
export function loadTrack() {
  if (!loading) {
    loading = (async () => {
      Snd.wake();
      if (!Snd.ctx) throw new Error('NO SOUND ON THIS MACHINE');
      const res = await fetch(P.FILE);
      if (!res.ok) throw new Error('THE SONG IS MISSING');
      return Snd.ctx.decodeAudioData(await res.arrayBuffer());
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

const curve = (n, f) => Float32Array.from({ length: n }, (_, i) => f(i / (n - 1)));
const IN = curve(48, x => Math.sin(x * Math.PI / 2)), OUT = curve(48, x => Math.cos(x * Math.PI / 2));   /* an equal-power crossfade */

export const StyleTrack = {
  on: false, failed: false, token: 0, run: null, timer: null, fading: null,

  /* fetch and decode the song now, so that it is there on the very beat the meter gets to the top */
  warm() {
    if (this.failed) return Promise.resolve(null);
    return loadTrack().catch(() => { this.failed = true; return null; });
  },

  async start() {
    if (this.on || this.failed) return;
    this.on = true;
    clearTimeout(this.fading);
    const mine = ++this.token;
    if (window.Music && window.Music.duck) window.Music.duck(true);
    const buf = await this.warm();
    if (!this.on || mine !== this.token) return;
    if (!buf || !Studio.ensure()) { this.on = false; if (window.Music && window.Music.duck) window.Music.duck(false); return; }
    this.begin(buf);
  },

  begin(buf) {
    const ctx = Snd.ctx, t0 = ctx.currentTime + 0.05;
    Studio._follow(true);
    /* out: the whole of this run, which the fade-out rides. song: the song's own level, which is the opening. */
    const out = ctx.createGain(), song = ctx.createGain();
    out.gain.value = P.HEADROOM;
    out.connect(Studio.channel('style').out);
    song.connect(out);
    song.gain.value = 0;
    song.gain.setValueCurveAtTime(P.songCurve(), t0, P.BLEND);
    const run = { ctx, buf, t0, out, song, srcs: [], next: 0 };
    this.run = run;
    this.echoes(run);
    this.schedule(run);
    clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(run), 1000);
  },

  /* the passes of the song, each laid down on the audio clock a few seconds before it is needed */
  schedule(run) {
    if (run !== this.run) return;
    const len = run.buf.duration;
    for (;;) {
      const p = P.pass(run.next, len);
      if (run.ctx.currentTime + P.LEAD < run.t0 + p.at) return;
      run.next++;
      const at = run.t0 + p.at, src = run.ctx.createBufferSource(), g = run.ctx.createGain();
      src.buffer = run.buf;
      src.connect(g); g.connect(run.song);
      g.gain.value = p.fadeIn ? 0 : 1;
      if (p.fadeIn) g.gain.setValueCurveAtTime(IN, at, p.fadeIn);
      g.gain.setValueCurveAtTime(OUT, at + p.dur - p.fadeOut, p.fadeOut);
      src.start(at, p.from, p.dur);
      const rec = { src, g };
      run.srcs.push(rec);
      src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e) {} const i = run.srcs.indexOf(rec); if (i >= 0) run.srcs.splice(i, 1); };
    }
  },

  /* the delete sound of the top rank, again and again, each time quieter and darker, while the song comes up under it */
  echoes(run) {
    const ctx = run.ctx;
    P.ECHOES.forEach(([t, vol], i) => {
      const at = run.t0 + t, lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.value = P.echoCutoff(t);
      lp.connect(run.out);
      const note = (f, delay, ms, type, to, v) => {
        const o = ctx.createOscillator(), a = ctx.createGain(), s = at + delay;
        o.type = type; o.frequency.setValueAtTime(f, s);
        if (to) o.frequency.exponentialRampToValueAtTime(to, s + ms / 1000);
        a.gain.setValueAtTime(0.0001, s);
        a.gain.linearRampToValueAtTime(v * vol, s + 0.006);
        a.gain.exponentialRampToValueAtTime(0.0001, s + ms / 1000);
        o.connect(a); a.connect(lp);
        o.start(s); o.stop(s + ms / 1000 + 0.05);
        o.onended = () => { try { o.disconnect(); a.disconnect(); } catch (e) {} };
      };
      P.NOTES.forEach((f, k) => note(f, k * 0.028, 700, 'square', 0, 0.07));
      if (i < 3) note(140, 0, 380, 'sawtooth', 35, 0.12);
    });
  },

  /* the meter has gone: let it fade out over `secs` */
  fadeOut(secs) {
    if (!this.on) return;
    this.on = false; this.token++;
    this.release(secs);
    this.fading = setTimeout(() => { if (!this.on && window.Music && window.Music.duck) window.Music.duck(false); }, secs * 1000);
  },
  stop() {
    if (!this.on && !this.run) return;
    this.on = false; this.token++;
    clearTimeout(this.fading);
    this.release(0.05);
    if (window.Music && window.Music.duck) window.Music.duck(false);
  },

  release(secs) {
    const run = this.run;
    this.run = null;
    clearInterval(this.timer); this.timer = null;
    if (!run) return;
    const g = run.out.gain, now = run.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.linearRampToValueAtTime(0.0001, now + Math.max(0.03, secs));
    setTimeout(() => {
      run.srcs.slice().forEach(r => { try { r.src.stop(); r.src.disconnect(); r.g.disconnect(); } catch (e) {} });
      run.srcs.length = 0;
      try { run.out.disconnect(); run.song.disconnect(); } catch (e) {}
      Studio._follow(false);
    }, secs * 1000 + 150);
  }
};
