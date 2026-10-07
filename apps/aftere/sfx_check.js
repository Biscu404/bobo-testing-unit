/* AfterEgypt sound-effects check — `node apps/aftere/sfx_check.js`
 *
 * Pure Node, against a pretend audio context that is as strict as the real one (an exponential ramp to nothing, a stop before a start and a
 * time before zero all throw, as they do in a browser). What is held to numbers:
 *
 *  SILENCE   with the SFX knob down or the power off, or no sound card at all, not one node is made.
 *  EVERY ONE every effect makes sound, every source it starts is told when to stop and that is within five seconds, nothing outlives `stop()`.
 *  PITCH     a coin chain climbs the mode and starts again after a pause; a doorway's note is higher the higher the doorway is; a close one is
 *            marked; the gust sweeps the way it pushes; the locust comes in from the right and goes out on the left.
 *  MIXER     the effects bus is the slider times the one trim, and follows the slider.
 *  THE GLUE  a whole flight of THE THIRD TEMPLE through `audio.js`: every kind of thing the sim says has the effect that is meant for it, once,
 *            and the effects never come faster than a few dozen sources a second; ending the flight and closing the window leaves nothing running.
 */
import { createSfx, hz, degree, CHAIN_GAP } from './sfx.js';
import { createAudio } from './audio.js';
import { createRun, stepRun, SHIP_X } from './sim.js';
import { LEVELS } from './levels.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(72) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const seeded = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* ---- a strict pretend audio context ---- */
function fakeAudio() {
  const A = { currentTime: 10, state: 'running', sampleRate: 8000, made: [] };
  const param = (v0) => ({ value: v0 || 0, set: [], ramps: [],
    setValueAtTime(v, t) { if (t < 0) throw new RangeError('negative time'); this.set.push([v, t]); },
    linearRampToValueAtTime(v, t) { if (t < 0) throw new RangeError('negative time'); this.ramps.push(['lin', v, t]); },
    exponentialRampToValueAtTime(v, t) { if (!(v > 0)) throw new RangeError('exponential ramp to ' + v); this.ramps.push(['exp', v, t]); },
    setTargetAtTime(v, t) { this.value = v; this.target = v; } });
  const mk = (kind, o) => { const n = Object.assign({ kind, out: [], connect(x) { n.out.push(x); return x; }, disconnect() { n.out.length = 0; } }, o); A.made.push(n); return n; };
  const source = (kind, o) => mk(kind, Object.assign({ started: null, stopAt: null, ended: false, onended: null,
    start(t) { if (this.started != null) throw new Error('started twice'); this.started = t; },
    stop(t) { if (this.started == null) throw new Error('stop before start'); if (t != null && t < this.started) throw new RangeError('stop before start time'); this.stopAt = t == null ? A.currentTime : t; if (t == null) { this.ended = true; if (this.onended) this.onended(); } } }, o));
  A.destination = mk('dest');
  A.createOscillator = () => source('osc', { type: 'sine', frequency: param(440) });
  A.createBufferSource = () => source('src', { buffer: null, loop: false });
  A.createGain = () => mk('gain', { gain: param(1) });
  A.createBiquadFilter = () => mk('filter', { type: '', frequency: param(350), Q: param(1) });
  A.createStereoPanner = () => mk('pan', { pan: param(0) });
  A.createBuffer = (ch, len) => ({ getChannelData: () => new Float32Array(len) });
  A.sources = () => A.made.filter(n => n.kind === 'osc' || n.kind === 'src');
  A.at = n => n.started;
  return A;
}
const rig = (o = {}) => {
  const A = fakeAudio(), host = { on: () => o.on !== false, level: () => o.level == null ? 1 : o.level, ctx: () => o.noCard ? null : A, bus: () => A.destination };
  return { A, host, fx: createSfx(host) };
};
const first = (A, kind) => A.made.find(n => n.kind === kind);
const freq0 = o => o.frequency.set[0][0];

console.log('-- silence --');
{
  const off = rig({ on: false }), none = rig({ noCard: true });
  const all = fx => { fx.coin(0); fx.ankh(); fx.shield(); fx.crash('pillar'); fx.crash('locust'); fx.gap(50, 30, 100); fx.gap(50, 2, 200); fx.gustWarn(); fx.gustBlow(1); fx.locust(5); fx.launch(); fx.win(); fx.bonus(); fx.unlock(); fx.death(); fx.fly(1); fx.still(); };
  all(off.fx); all(none.fx);
  ok(off.A.made.length <= 1, 'with the SFX knob down or the power off no node is made', off.A.made.length + ' made');
  ok(none.A.made.length <= 1, 'with no sound card nothing is made and nothing throws');
}

console.log('\n-- every one of them --');
const EFFECTS = { coin: f => f.coin(0), ankh: f => f.ankh(), shield: f => f.shield(), crash: f => f.crash('pillar'), 'crash (locust)': f => f.crash('locust'), gap: f => f.gap(50, 30, 100),
  graze: f => f.gap(50, 2, 100), 'gust warning': f => f.gustWarn(), 'gust, up': f => f.gustBlow(-1), 'gust, down': f => f.gustBlow(1), locust: f => f.locust(5), launch: f => f.launch(),
  win: f => f.win(), 'first clear': f => f.bonus(), unlock: f => f.unlock(), death: f => f.death() };
for (const name of Object.keys(EFFECTS)) {
  const { A, fx } = rig();
  let err = null;
  try { EFFECTS[name](fx); } catch (e) { err = e.message; }
  const src = A.sources(), long = src.filter(n => n.stopAt == null || n.stopAt - A.currentTime > 5);
  const heard = src.some(n => n.out.length);
  fx.stop();
  ok(!err && src.length >= 1 && heard && !long.length && fx.synth.live === 0, name + ': ' + src.length + ' source' + (src.length === 1 ? '' : 's') + ', each told when to stop, none past five seconds, nothing left after stop()', err || '');
}
{
  const { A, fx } = rig();
  fx.fly(0.5); fx.fly(1); fx.fly(0.2);
  const loops = A.sources().filter(n => n.loop);
  ok(loops.length === 1 && fx.synth.live === 1, 'the ship\'s air is one loop however often it is steered', loops.length + ' loop');
  fx.still();
  ok(loops[0].stopAt != null && fx.synth.live === 0, 'and it is let go when the ship is still');
  fx.fly(1); fx.stop();
  ok(fx.synth.live === 0 && A.sources().every(n => n.stopAt != null), 'stop() lets go of it, and of everything');
}

console.log('\n-- pitch and place --');
{
  const { A, fx } = rig();
  const pitches = [];
  for (let i = 0; i < 8; i++) { const n0 = A.made.length; fx.coin(i * 30); pitches.push(freq0(A.made.slice(n0).find(n => n.kind === 'osc'))); }
  ok(pitches.every((p, i) => i === 0 || p > pitches[i - 1]), 'a chain of coins climbs, one step of the mode each', pitches.map(p => Math.round(p)).join(' '));
  const n0 = A.made.length; fx.coin(8 * 30 + CHAIN_GAP + 10);
  ok(Math.abs(freq0(A.made.slice(n0).find(n => n.kind === 'osc')) - pitches[0]) < 1e-6, 'and starts again from the bottom after a pause');
  const steps = [0, 1, 2, 3, 4, 5, 6, 7].map(i => Math.round(12 * Math.log2(hz(degree(i, 74)) / hz(74))));
  ok(steps.join() === '0,1,4,5,7,8,10,12', 'the steps are hijaz: a semitone, then the augmented second', steps.join(' '));
}
{
  const hi = rig(), lo = rig();
  hi.fx.gap(10, 30, 100); lo.fx.gap(180, 30, 100);
  ok(freq0(first(hi.A, 'osc')) > freq0(first(lo.A, 'osc')) * 3, 'a doorway at the top of the sky is a higher note than one at the bottom', Math.round(freq0(first(hi.A, 'osc'))) + ' > ' + Math.round(freq0(first(lo.A, 'osc'))));
  const g = rig(); g.fx.gap(100, 30, 1000); g.fx.gap(100, 30, 1003);
  ok(g.A.sources().length === 1, 'never a machine gun: two doorways within six frames are one note');
  const c = rig(); c.fx.gap(100, 2, 1000); c.fx.gap(100, 2, 1001);
  ok(c.A.sources().length === 4, 'but a close one is always marked, a tick and a note each time', c.A.sources().length + ' sources for two');
  const up = rig(), dn = rig(); up.fx.gustBlow(-1); dn.fx.gustBlow(1);
  const sweep = r => { const f = r.A.made.find(n => n.kind === 'filter'); return f.frequency.ramps[0][1] - f.frequency.set[0][0]; };
  ok(sweep(up) > 0 && sweep(dn) < 0, 'a gust that pushes up sweeps up, one that pushes down sweeps down', 'up ' + sweep(up) + ' Hz, down ' + sweep(dn) + ' Hz');
  const w = rig(); w.fx.gustWarn();
  const wf = w.A.made.find(n => n.kind === 'filter');
  ok(wf.frequency.ramps[0][1] > wf.frequency.set[0][0] * 4 && w.A.made.filter(n => n.kind === 'gain').every(g => g.gain.ramps.every(r => r[2] - w.A.currentTime <= 1.0 + 1e-9)), 'the warning rises, and is over inside the second it announces');
  const l = rig(); l.fx.locust(5.5);
  const pan = first(l.A, 'pan');
  ok(pan.pan.value > 0.8 && pan.pan.ramps[0][1] < 0, 'a locust comes in from the right and goes out on the left', pan.pan.value + ' to ' + pan.pan.ramps[0][1]);
}

console.log('\n-- the mixer --');
{
  const r = rig({ level: 0.5 });
  r.fx.coin(0);
  const bus = r.A.made.find(n => n.kind === 'gain' && n.out.includes(r.A.destination));
  ok(bus && Math.abs(bus.gain.value - 0.5 * 1.6) < 1e-9, 'the effects bus is the slider times one trim', bus && bus.gain.value);
  r.host.level = () => 0.25; r.fx.synth.relevel();
  ok(Math.abs(bus.gain.target - 0.25 * 1.6) < 1e-9, 'and follows the slider when it moves', bus.gain.target);
  const z = rig({ level: 0 }); z.fx.coin(0); z.fx.synth.relevel();
  ok(z.A.made.find(n => n.kind === 'gain' && n.out.includes(z.A.destination)).gain.target > 0, 'at nothing it is still a legal gain, not a ramp to zero');
}

console.log('\n-- a flight through audio.js --');
{
  globalThis.window = { CRT: { on: true, mus: 0, sfx: 8 } };
  const L = LEVELS[4], r = createRun(L, seeded(21)), { A, host } = rig();
  const audio = createAudio({ studio: null }, host);
  const aim = rr => { const p = rr.pillars.filter(q => !q.off && q.x > 6).sort((a, b) => a.x - b.x)[0]; if (!p) return rr.y; const f = Math.max(0, (p.x - SHIP_X) / rr.L.speed); const c = p.base + (p.wob ? p.wob * Math.sin(p.ph + (rr.t + f) * 0.045) : 0); let best = c, risk0 = Infinity; for (let k = -4; k <= 4; k++) { const y = c + k * Math.max(0, p.gap / 2 - 8) / 4; let risk = Math.abs(k) * 0.01; rr.locusts.forEach(l => { const ff = (l.x - SHIP_X) / l.v; if (ff > -4 && ff < 70 && Math.abs(l.y - y) < 13) risk += 10 - ff * 0.1; }); if (risk < risk0) { risk0 = risk; best = y; } } return best; };
  const seen = {}, perSec = [];
  audio.takeoff(L);
  let steps = 0, prev = A.sources().length;
  for (; steps < 60 * 200 && !r.dead && !r.won; steps++) {
    A.currentTime = 10 + steps / 60;
    stepRun(r, { aim: aim(r), dir: 0 });
    r.ev.forEach(e => { seen[e] = (seen[e] || 0) + 1; });
    audio.events(r); audio.frame(1 / 60, r, 'run');
    if (steps % 60 === 59) { perSec.push(A.sources().length - prev); prev = A.sources().length; }
  }
  ok(r.won || r.dead, 'the bot flew THE THIRD TEMPLE', steps + ' steps, ' + (r.won ? 'won' : 'dead') + ', ' + JSON.stringify(seen));
  ok(Object.keys(seen).every(e => ['coin', 'ankh', 'shield', 'dead', 'gap', 'graze', 'gust', 'gust-on', 'gust-off', 'locust', 'win'].includes(e)), 'the sim says nothing the sound has not heard of');
  const rate = A.sources().length / (steps / 60), worst = Math.max(...perSec);
  ok(rate < 30 && worst < 80, 'the effects stay a few dozen sources a second at their worst', rate.toFixed(1) + ' a second on average, ' + worst + ' at worst');
  const bufs = A.sources().filter(n => n.kind === 'src'), oscs = A.sources().filter(n => n.kind === 'osc');
  ok(bufs.length > 0 && oscs.length > 0, 'noise and tones both', bufs.length + ' noise, ' + oscs.length + ' tone sources');
  audio.finish({ won: r.won, first: true, unlocked: false });
  audio.stop();
  ok(audio.sfx.synth.live === 0 && A.sources().every(n => n.stopAt != null), 'ending the flight and closing the window leaves nothing running', A.sources().filter(n => n.stopAt == null).length + ' unstopped');
  const before = A.made.length; audio.events(r); audio.frame(1, r, 'run'); audio.takeoff(L);
  ok(A.made.length === before, 'and a closed window makes no more sound');
}

console.log('\n' + (fails ? fails + ' of ' + checks + ' AfterEgypt sound checks FAILED' : 'All ' + checks + ' AfterEgypt sound checks pass.'));
process.exit(fails ? 1 : 0);
