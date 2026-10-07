/* AfterEgypt music check — `node apps/aftere/music_check.js`
 *
 * Pure Node: no audio, no window. What cannot be heard from here is held to numbers instead.
 *
 *  THE SCORE   every melody bar is exactly as long as the bar and has a chord; the lead sits on its chord on the strong beats; nothing anywhere is
 *              outside the tune's mode or the chord of its bar; every instrument exists; every note is playable and rings no further than half a
 *              beat past the end; every layer is tagged, is one the way can ask for, and is a real part of a real band; the drum patterns tile the bar.
 *  THE WAYS    five tempos, no two the same; each tier a bigger band than the last at its core and with more layers; the first way is one pass long; the
 *              five end where they began (the last bar's chord is the tonic, the last note is on it) so that the loop has a seam to hide.
 *  THE STINGS  three short pieces on D, none under two seconds or over eleven.
 *  THE SKY     `danger.js` flown by a bot over every tier: each number is in 0..1, the way comes in as the flight goes, the gate is the last fifth only,
 *              the wind is asked for exactly when there is wind, the locusts when there are locusts, the heartbeat when the ship is at the stone.
 *  THE BAND    the music controller against a fake deck: nothing plays with the sound off, the title first, a flight starts its own tune from the first
 *              bar with every layer out, the layers ride the sky in small steps and nothing is ever restarted by them, the ends of the flight take their
 *              stinger and give the title back, the sound going off stops it and going on again picks the flight up.
 */
import { readFileSync } from 'node:fs';
import * as Lang from '../../kernel/songtext.js';
import { IDS, WAYS, LAYERS, LAYERS_OF, STINGS, song as scoreOf, sting as stingOf, secsOf, passSecs, TUNES } from './score.js';
import { MODES, misfit } from './score_kit.js';
import { createRun, stepRun, SHIP_X } from './sim.js';
import { LEVELS, secs } from './levels.js';
import { heat, edgeOf, FEEL, lean } from './danger.js';
import { createAfterMusic, PUSH, TAIL } from './music.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(72) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const INSTRUMENTS = new Set(JSON.parse(readFileSync(new URL('../../assets/instruments/index.json', import.meta.url))).instruments.map(i => i.id).concat(['drums']));
const DRUMS = new Set(['kick', 'snare', 'stick', 'clap', 'hat', 'openhat', 'lotom', 'midtom', 'hitom', 'crash', 'ride', 'cowbell', 'tamb', 'shaker']);
const seeded = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const modeOf = { title: 'hijaz', pilgrim: 'hijaz', scribe: 'nahawand', priest: 'phrygian', pharaoh: 'hijaz', temple: 'double' };
const pcs = id => MODES[modeOf[id]];

/* ---- 1. the score ------------------------------------------------------------------------------------ */
console.log('-- the bars --');
for (const id of IDS) {
  const d = TUNES[id], ch = d.chords.split(' '), bad = [];
  d.melody.forEach((b, i) => { const len = Lang.parseNotes(b).length_; if (Math.abs(len - d.beats) > 1e-9) bad.push('bar ' + (i + 1) + ' is ' + len); });
  if (ch.length !== d.melody.length) bad.push('chords: ' + ch.length);
  ch.forEach(c => { try { Lang.chordNotes(c, 48); } catch (e) { bad.push('chord ' + c); } });
  const sg = scoreOf(Lang, id);
  if (sg.bars !== d.melody.length || sg.beats !== d.beats || sg.bpm !== d.bpm) bad.push('song does not match its tune');
  ok(!bad.length, id + ': ' + d.melody.length + ' bars of ' + d.beats + ' beats, a chord for each, the song is the tune', bad.join('; '));
}

console.log('\n-- the notes --');
const badNote = n => !(n[1] > 0 && n[0] >= 0 && n[2] >= 24 && n[2] <= 108 && n[3] > 0 && n[3] <= 1.0001);
const everything = [].concat(IDS.map(id => [id, scoreOf(Lang, id)]), STINGS.map(id => [id, stingOf(Lang, id)]));
for (const [id, sg] of everything) {
  const len = Lang.songLength(sg);
  const wrong = sg.tracks.filter(t => (t.notes || []).some(badNote) || (t.hits || []).some(h => !(h[0] >= 0 && h[0] < len && DRUMS.has(h[1]))));
  const over = sg.tracks.filter(t => (t.notes || []).some(n => n[0] >= len || n[0] + n[1] > len + 0.5));
  const unk = sg.tracks.filter(t => !INSTRUMENTS.has(t.inst));
  const ids = new Set(sg.tracks.map(t => t.id));
  ok(!wrong.length && !over.length && !unk.length && ids.size === sg.tracks.length, id + ': every note is playable, starts inside the song and rings no further than half a beat past it',
     wrong.concat(over, unk).map(t => t.name + ':' + t.inst).join(', '));
}
for (const id of IDS.concat(STINGS)) {
  const sg = STINGS.includes(id) ? stingOf(Lang, id) : scoreOf(Lang, id);
  const silent = sg.tracks.filter(t => (t.inst === 'drums' ? t.hits : t.notes).length === 0);
  ok(!silent.length, id + ': no track is silent', silent.map(t => t.name).join(', '));
}
ok(!misfit.length, 'every bar of every part is exactly as long as a bar (a short one would slide everything after it)', misfit.slice(0, 3).join(' / '));

console.log('\n-- the mode --');
for (const id of IDS.concat(STINGS)) {
  const sg = STINGS.includes(id) ? stingOf(Lang, id) : scoreOf(Lang, id), d = TUNES[id];
  const mode = d ? pcs(id) : MODES.hijaz, chords = d ? d.chords.split(' ') : null, extra = new Set();
  const out = new Set();
  sg.tracks.forEach(t => (t.notes || []).forEach(n => {
    const pc = n[2] % 12, bar = Math.floor(n[0] / sg.beats);
    if (mode.includes(pc)) return;
    const sym = chords ? chords[Math.min(bar, chords.length - 1)] : null;
    if (sym && Lang.chordNotes(sym, 60).some(x => x % 12 === pc)) return;
    if (!chords && [1, 4].includes(pc)) return;                     /* a stinger's leading tones */
    out.add(Lang.pcName(pc) + ' in ' + t.name + ' bar ' + (bar + 1));
  }));
  ok(!out.size, id + ': nothing outside its mode or the chord of its bar', [...out].slice(0, 4).join(', '));
}

console.log('\n-- the lead on its chords --');
for (const id of IDS) {
  const d = TUNES[id], ch = d.chords.split(' '), mel = Lang.parseNotes(d.melody.join(' | ')), per = d.beats;
  let strong = 0, on = 0;
  mel.forEach(n => {
    const bar = Math.min(ch.length - 1, Math.floor(n[0] / per)), at = n[0] - bar * per;
    if (Math.abs(at % 1) < 1e-6 && (at === 0 || (per === 4 && at === 2))) { strong++; if (Lang.chordNotes(ch[bar], 60).some(x => x % 12 === n[2] % 12)) on++; }
  });
  ok(on / strong >= 0.7, id + ': ' + on + ' of ' + strong + ' strong-beat notes are chord tones', ((on / strong) * 100).toFixed(0) + '%');
}

/* ---- 2. the ways -------------------------------------------------------------------------------------- */
console.log('\n-- the band --');
for (const id of IDS) {
  const sg = scoreOf(Lang, id), have = [...new Set(sg.tracks.map(t => t.layer).filter(Boolean))].sort(), want = LAYERS_OF[id].slice().sort();
  const by = k => sg.tracks.filter(t => t.layer === k).length, core = sg.tracks.filter(t => t.layer == null).length;
  ok(JSON.stringify(have) === JSON.stringify(want) && have.every(k => LAYERS.includes(k)), id + ': its layers are the ones the sky can ask for there', have.join(' ') || 'none');
  ok(want.every(k => by(k) >= 2) && core >= (id === 'title' ? 6 : id === 'pilgrim' ? 4 : 5), id + ': a core of ' + core + ' (a tune alone) and layers of ' + want.map(k => k + ' ' + by(k)).join(', '));
}
{
  const insts = new Set(); IDS.forEach(id => scoreOf(Lang, id).tracks.forEach(t => insts.add(t.inst)));
  ok(insts.size >= 15, 'between them the six use fifteen real instruments or more', [...insts].sort().join(' '));
  ok(new Set(WAYS.map(id => TUNES[id].bpm)).size === WAYS.length, 'no two ways share a tempo', WAYS.map(id => TUNES[id].bpm).join(' '));
  const size = id => scoreOf(Lang, id).tracks.length, dens = id => { const s = scoreOf(Lang, id); return s.tracks.reduce((a, t) => a + (t.notes || t.hits || []).length, 0) / passSecs(id); };
  let up = true, d = true; for (let i = 1; i < WAYS.length; i++) { if (size(WAYS[i]) < size(WAYS[i - 1])) up = false; if (dens(WAYS[i]) < dens(WAYS[i - 1])) d = false; }
  ok(up, 'each way is a bigger band than the one before', WAYS.map(size).join(' < '));
  ok(d, 'and plays more notes a second', WAYS.map(id => dens(id).toFixed(1)).join(' < '));
  ok(Math.abs(passSecs('pilgrim') - secs(LEVELS[0])) < 4, 'PILGRIM is one pass of its tune: ' + passSecs('pilgrim').toFixed(1) + ' s against a flight of ' + secs(LEVELS[0]).toFixed(1));
  ok(WAYS.every((id, i) => passSecs(id) >= 20 && passSecs(id) <= 60), 'every pass is between twenty seconds and a minute', WAYS.map(id => passSecs(id).toFixed(0) + 's').join(' '));
}

console.log('\n-- the loop --');
for (const id of IDS) {
  const d = TUNES[id], ch = d.chords.split(' '), mel = Lang.parseNotes(d.melody.join(' | ')), last = mel[mel.length - 1];
  ok(/^Dm?$/.test(ch[ch.length - 1]) && /^(Dm?|Bb|Gm|Eb|A7?)$/.test(ch[0]), id + ': it ends on the tonic chord and begins on a chord that follows it', ch[ch.length - 1] + ' > ' + ch[0]);
  ok(last[2] % 12 === 2 || (id === 'priest' && mel.filter(n => n[0] >= (d.melody.length - 1) * d.beats).every(n => n[2] % 12 === 2)), id + ': and its last note is the D');
}

console.log('\n-- the stingers --');
for (const id of STINGS) {
  const s = secsOf(stingOf(Lang, id));
  ok(s >= 2 && s <= 11, id + ': ' + s.toFixed(1) + ' seconds');
}
ok(secsOf(stingOf(Lang, 'unlock')) > secsOf(stingOf(Lang, 'clear')), 'a way opening is longer than a clear');

/* ---- 3. the sky ---------------------------------------------------------------------------------------- */
console.log('\n-- the sky --');
/* a player who sees everything: aims at the middle of the next doorway, and for a second now and then hugs its edge */
const aimAt = (r, hug) => {
  const p = r.pillars.filter(q => !q.off && q.x > (r.L.centred ? 14 : 6)).sort((a, b) => a.x - b.x)[0];
  if (!p) return r.y;
  const c = r.L.centred ? 100 : p.base + (p.wob ? p.wob * Math.sin(p.ph + (r.t + Math.max(0, (p.x - SHIP_X) / r.L.speed)) * 0.045) : 0);
  return hug ? c + Math.max(0, p.gap / 2 - 8) * hug : c;
};
const sky = {};
LEVELS.forEach(L => {
  const s = sky[L.id] = { max: { build: 0, edge: 0, swarm: 0, gust: 0, gate: 0 }, range: true, buildUp: true, gateEarly: false, windOn: 0, windOff: 0, gustFrames: 0, swarmFrames: 0, locFrames: 0, edgeNear: 0, edgeMid: 1, n: 0 };
  for (let seed = 1; seed <= 6; seed++) {
    const r = createRun(L, seeded(seed)); let prev = 0;
    for (let n = 0; n < 60 * 200 && !r.dead && !r.won; n++) {
      const hug = (n >> 7) % 4 === 3 ? 1 : 0;
      stepRun(r, { aim: aimAt(r, hug), dir: 0 });
      const h = heat(r); s.n++;
      Object.keys(h).forEach(k => { if (!(h[k] >= 0 && h[k] <= 1)) s.range = false; s.max[k] = Math.max(s.max[k], h[k]); });
      if (h.build < prev - 1e-9) s.buildUp = false; prev = h.build;
      if (h.gate > 0 && r.dist / L.goal < 0.8) s.gateEarly = true;
      if (r.gust) { s.gustFrames++; if (h.gust < 0.25) s.windOff++; } else if (h.gust > 0) s.windOn++;
      if (r.locusts.length) { s.locFrames++; if (h.swarm < 0.7) s.windOff++; } else if (h.swarm > 0) s.windOn++;
      if (hug && r.pillars.some(p => !p.off && p.x > SHIP_X - 6 && p.x < SHIP_X + 20)) s.edgeNear = Math.max(s.edgeNear, h.edge);
      if (!hug && r.pillars.every(p => p.off || p.x < SHIP_X - 12 || p.x > SHIP_X + 16 + 60) === false) s.edgeMid = Math.min(s.edgeMid, h.edge);
    }
  }
});
LEVELS.forEach(L => {
  const s = sky[L.id];
  ok(s.range && s.buildUp, L.name + ': every number stays in 0..1 and the way only ever comes in', s.n + ' frames');
  ok(!s.gateEarly && s.max.gate > 0.99 && s.max.build > 0.99, L.name + ': the gate is the last fifth and both of them reach the top', 'build ' + s.max.build.toFixed(2) + ' gate ' + s.max.gate.toFixed(2));
  ok(L.wind ? s.max.gust === 1 : s.max.gust === 0, L.name + ': the wind is asked for ' + (L.wind ? 'when it blows' : 'never, there is none'), 'peak ' + s.max.gust);
  ok(L.locust ? s.max.swarm >= 0.85 : s.max.swarm === 0, L.name + ': the swarm is asked for ' + (L.locust ? 'with the locusts' : 'never, there are none'), 'peak ' + s.max.swarm.toFixed(2));
  ok(s.windOn === 0 && s.windOff === 0, L.name + ': never asked for with nothing there, never missing when it is', s.windOn + ' / ' + s.windOff);
  ok(L.id === 'pilgrim' ? s.max.edge >= 0 : s.edgeNear > 0.5, L.name + ': the heartbeat comes when the ship hugs the stone', 'peak ' + s.edgeNear.toFixed(2));
});
{
  const L = LEVELS[1], r = createRun(L, seeded(3));
  for (let i = 0; i < 400; i++) stepRun(r, { aim: aimAt(r, 0), dir: 0 });
  const p = r.pillars.filter(q => !q.off && q.x > SHIP_X - 12).sort((a, b) => a.x - b.x)[0], c = p.base + (p.wob ? p.wob * Math.sin(p.ph + r.t * 0.045) : 0);
  r.y = c; p.x = SHIP_X + 20; const mid = edgeOf(r);
  r.y = c + p.gap / 2 - 1; const edge = edgeOf(r);
  p.x = SHIP_X + 16 + 200; r.y = c + p.gap / 2 - 1; const far = edgeOf(r);
  ok(mid < 0.05 && edge > 0.9 && far === 0, 'in the middle of a doorway the heart is quiet, at its edge it is full, and a doorway far off does not ask for it', mid.toFixed(2) + ' ' + edge.toFixed(2) + ' ' + far.toFixed(2));
  let e = 0, e2 = 0; for (let f = 0; f < 60; f++) e = lean(e, 1, 1 / 60, FEEL.edge); for (let f = 0; f < 60; f++) e2 = lean(1, 0, 1 / 60, FEEL.edge);
  ok(e > 0.99 && lean(1, 0, 1, FEEL.edge) > 0.2 && FEEL.edge[0] < FEEL.edge[1] && FEEL.swarm[0] < FEEL.swarm[1], 'a layer comes in faster than it goes out, the heart in a tenth of a second', 'in ' + e.toFixed(2) + ' after a second, still ' + lean(1, 0, 1, FEEL.edge).toFixed(2) + ' a second after');
}

/* ---- 4. the controller -------------------------------------------------------------------------------------- */
console.log('\n-- the music follows the flight --');
function rig() {
  const R = { t: 0, calls: [], levels: [], stops: 0, allowed: true, player: null };
  const idOf = sg => IDS.concat(STINGS).find(k => (STINGS.includes(k) ? stingOf(Lang, k) : scoreOf(Lang, k)).title === sg.title);
  const deck = {
    get playing() { return !!R.player; }, get player() { return R.player; },
    async play(sg, o) { R.calls.push({ id: idOf(sg), t: R.t, o }); R.player = { id: idOf(sg) }; return R.player; },
    levels(m, o) { R.levels.push({ t: R.t, m, o }); }, layers() {}, preload() { return Promise.resolve(); }, stop() { R.stops++; R.player = null; }
  };
  R.music = createAfterMusic({ studio: () => ({ deck: () => deck, lang: Lang }), playing: () => R.allowed });
  R.tick = async (dt, run) => { R.t += dt; R.music.sync(); R.music.step(dt, run); await Promise.resolve(); await Promise.resolve(); };
  R.wait = async (secs, run, dt = 1 / 30) => { for (let i = 0; i < secs / dt; i++) await R.tick(dt, run); };
  return R;
}
{
  const R = rig(); R.allowed = false;
  await R.wait(2);
  ok(R.calls.length === 0 && !R.music.on, 'with the sound off nothing is played');
  R.allowed = true; await R.tick(0.1);
  ok(R.calls.length === 1 && R.calls[0].id === 'title' && !R.calls[0].o.levels, 'switched on, the title plays', R.calls.map(c => c.id).join());
  R.music.menu(); await R.wait(1);
  ok(R.calls.length === 1, 'asking for the title again while it plays does nothing');
  R.music.run('scribe'); await R.tick(0.05);
  const c = R.calls[1];
  ok(c && c.id === 'scribe' && c.o.fade <= 0.3 && !c.o.loop && c.o.levels && Object.keys(c.o.levels).sort().join() === 'build,edge' && Object.values(c.o.levels).every(v => v === 0),
     'taking off starts the way\'s own tune at once with every layer out', c && JSON.stringify(c.o.levels));

  /* fly a whole PHARAOH with a bot, at 60 steps a second and a frame of 1/60 */
  const L = LEVELS[3], r = createRun(L, seeded(5));
  R.music.run('pharaoh'); await R.tick(0.02);
  const calls0 = R.calls.length, lv0 = R.levels.length;
  for (let n = 0; n < 60 * 300 && !r.dead && !r.won; n++) { stepRun(r, { aim: aimAt(r, (n >> 7) % 4 === 3 ? 1 : 0), dir: 0 }); await R.tick(1 / 60, r); }
  const steps = R.levels.slice(lv0), maps = steps.map(s => s.m);
  ok(R.calls.length === calls0, 'a whole flight starts and stops nothing: it only rides the layers', R.calls.length - calls0 + ' new calls, ' + steps.length + ' level changes');
  ok(steps.length > 20 && maps.every(m => Object.keys(m).every(k => LAYERS_OF.pharaoh.includes(k))), 'what is sent is only what PHARAOH has');
  let big = 0; maps.forEach((m, i) => { const p = i ? maps[i - 1] : { build: 0, edge: 0, swarm: 0, gust: 0, gate: 0 }; Object.keys(m).forEach(k => { big = Math.max(big, Math.abs(m[k] - (p[k] || 0))); }); });
  ok(big < 0.5, 'each change is a small one, glided to by the desk', 'largest ' + big.toFixed(2) + ', glide ' + steps[0].o.glide + ' s');
  ok(steps.every((s, i) => i === 0 || s.t - steps[i - 1].t >= PUSH - 1e-6), 'at a steady pace, not once per frame', steps.length + ' pushes in ' + (steps[steps.length - 1].t - steps[0].t).toFixed(0) + ' s');
  ok(r.won && steps.some(s => s.m.gust > 0.9) && steps.some(s => s.m.swarm > 0.9) && steps[steps.length - 1].m.gate > 0.8, 'the wind, the locusts and the gate all came in on the way', 'won ' + r.won);

  R.music.end('clear');
  await R.tick(0.05);
  const s1 = R.calls[R.calls.length - 1];
  ok(s1.id === 'clear' && s1.o.loop === false && s1.o.fadeIn === 0 && s1.o.fade <= 0.15, 'the arrival takes its stinger, once, with the flight going out in a tenth of a second', s1.id);
  const secs1 = secsOf(stingOf(Lang, 'clear'));
  await R.wait(secs1 + TAIL - 0.5);
  ok(R.calls[R.calls.length - 1].id === 'clear', 'it is let finish');
  await R.wait(1);
  const t1 = R.calls[R.calls.length - 1];
  ok(t1.id === 'title' && t1.o.fade >= 1.5, 'and then the title comes back, slowly', t1.id + ' ' + t1.o.fade);
  R.music.run('temple'); await R.tick(0.05); R.music.end('death'); await R.tick(0.05);
  ok(R.calls[R.calls.length - 1].id === 'death', 'a death takes its own');
  R.music.run('pilgrim'); await R.tick(0.05);
  ok(R.calls[R.calls.length - 1].id === 'pilgrim', 'and taking off again cuts the stinger short and flies');
  R.music.end('unlock'); await R.tick(0.05);
  ok(R.calls[R.calls.length - 1].id === 'unlock', 'a way opening has its own');

  R.music.run('priest'); await R.wait(2);
  const n = R.calls.length; R.allowed = false; await R.tick(0.05);
  ok(R.stops >= 1 && !R.music.on && !R.player, 'switching the sound off mid-flight stops it');
  R.allowed = true; await R.tick(0.05);
  ok(R.calls.length === n + 1 && R.calls[n].id === 'priest', 'and on again it picks the flight up');
  R.music.stop();
  ok(R.stops >= 2, 'stop() lets go of the deck');
}
{
  /* a stinger that is over while the sound is off does not come back to life later */
  const R = rig(); R.allowed = false; R.music.end('death'); await R.wait(secsOf(stingOf(Lang, 'death')) + TAIL + 1);
  R.allowed = true; await R.tick(0.1);
  ok(R.calls.length === 1 && R.calls[0].id === 'title', 'a stinger that ended while the sound was off is not played late: the title is', R.calls.map(c => c.id).join());
}

console.log('\n' + (fails ? fails + ' of ' + checks + ' AfterEgypt music checks FAILED' : 'All ' + checks + ' AfterEgypt music checks pass.'));
process.exit(fails ? 1 : 0);
