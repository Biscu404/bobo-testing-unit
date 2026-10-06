/* The sampler: real instruments, played from recordings.

   assets/instruments/ holds, for each of thirty instruments, a recording of
   one note every few semitones (index.json says which, and for the ones
   that are held -- strings, winds, organ, choir -- where each recording can be
   looped without a click). To play a note the nearest recording is found and
   bent the rest of the way by changing its speed; a held note loops until it is
   let go of, a plucked or struck one rings out by itself. The drum kit is
   one recording per piece.

   Nothing here knows about songs or screens. It turns "this instrument, this
   note, now, for this long" into sound on whatever AudioContext it is given,
   which is the live one for playing and an offline one for bouncing a song. */
import { Snd } from './snd.js';

const BASE = 'assets/instruments/';
let manifest = null, manifestP = null;
const banks = new Map();                            /* id -> Promise<bank> */

export function index() {
  if (manifest) return Promise.resolve(manifest);
  if (!manifestP) manifestP = fetch(BASE + 'index.json').then(r => r.json()).then(m => (manifest = m));
  return manifestP;
}
/* what is known without waiting, once index() has come back */
export const listed = () => manifest ? manifest.instruments.concat([Object.assign({ kind: 'drums' }, manifest.drums)]) : [];
export const find = id => listed().find(i => i.id === id) || null;

/* decode every recording of one instrument, once */
export function load(id) {
  if (banks.has(id)) return banks.get(id);
  const p = (async () => {
    await index();
    const meta = id === 'drums' ? manifest.drums : manifest.instruments.find(i => i.id === id);
    if (!meta) throw new Error('NO SUCH INSTRUMENT: ' + id);
    Snd.wake();
    if (!Snd.ctx) throw new Error('NO AUDIO');
    const bin = await (await fetch(BASE + id + '.bin')).arrayBuffer();
    const list = id === 'drums' ? meta.hits : meta.samples;
    const bufs = await Promise.all(list.map(s => Snd.ctx.decodeAudioData(bin.slice(s.off, s.off + s.len))));
    const items = list.map((s, i) => Object.assign({}, s, { buf: bufs[i] }));
    return { id, meta, items, gain: meta.gain || 1, kind: meta.kind || 'drums' };
  })();
  p.then(b => done.set(id, b), () => banks.delete(id));
  banks.set(id, p);
  return p;
}
const done = new Map();                              /* id -> the decoded bank, once it is in */
export const ready = id => done.has(id);
export const cached = id => done.get(id) || null;

const nearest = (items, midi) => items.reduce((a, b) => Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a, items[0]);
const vgain = v => Math.pow(Math.max(0.02, Math.min(1, v)), 1.35);       /* velocity 0..1 -> loudness */

/* one note. `dur` in seconds, or Infinity for a key that is held until stop(t) is called.
   Returns { stop(t), kill(), src }. `dest` is where it goes (a track's input). */
export function note(ctx, bank, midi, when, dur, vel, dest) {
  const s = nearest(bank.items, midi);
  const src = ctx.createBufferSource();
  src.buffer = s.buf;
  src.playbackRate.value = Math.pow(2, (midi - s.midi) / 12);
  const held = bank.kind === 'hold' && s.loop;
  if (held) { src.loop = true; src.loopStart = s.loop[0]; src.loopEnd = s.loop[1]; }
  const g = ctx.createGain();
  const amp = bank.gain * vgain(vel == null ? 0.8 : vel);
  const atk = held ? 0.035 : 0.002, rel = held ? 0.2 : 0.22;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(amp, when + atk);
  src.connect(g); g.connect(dest);
  src.start(when);
  let ended = false;
  const stop = t => {
    if (ended) return;
    ended = true;
    const at = Math.max(t, when + atk);
    g.gain.cancelScheduledValues(at);
    g.gain.setValueAtTime(g.gain.value > 0 ? amp : amp, at);
    g.gain.setTargetAtTime(0.0001, at, rel / 3);
    try { src.stop(at + rel * 2); } catch (e) {}
  };
  if (isFinite(dur)) stop(when + dur);
  src.onended = () => { try { g.disconnect(); } catch (e) {} };
  return { stop, src, kill() { ended = true; try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.01); src.stop(ctx.currentTime + 0.06); } catch (e) {} } };
}

/* one piece of the kit */
export function hit(ctx, bank, key, when, vel, dest) {
  const s = bank.items.find(i => i.key === key);
  if (!s) return null;
  const src = ctx.createBufferSource();
  src.buffer = s.buf;
  const g = ctx.createGain();
  g.gain.value = vgain(vel == null ? 0.85 : vel) * 0.6;
  src.connect(g); g.connect(dest);
  src.start(when);
  src.onended = () => { try { g.disconnect(); } catch (e) {} };
  return { stop() {}, src, kill() { try { src.stop(); } catch (e) {} } };
}
