/* Magen music check — `node apps/magen/music_check.js`
 *
 * Pure Node: no audio, no window. Three things that cannot be heard from here are held to numbers instead.
 *
 *  THE SCORE   every bar of every melody is exactly as long as the bar; every note is one the studio can play; every layer is a
 *              real part of a real band; the lead sits on its chord on the strong beats (and the rubs against it that are left
 *              are the mode's own, counted); the Shabbat tune has no layers for a click to touch.
 *  THE BAND    the energy a chain earns rises in swells and falls in a sigh: no frame ever moves a layer by more than a quarter,
 *              a held button reaches the whole band in a few seconds, and when the chain breaks the band is still most of the way
 *              there a second later.
 *  THE SEAMS   the rotation is an order and not a dice roll; a tune is heard for about a minute and a half; the change is a segue on
 *              the downbeat and it is arranged once; Shabbat holds its tune and letting go goes on from where it left off;
 *              and nothing in all of it ever restarts the tune that is playing (the old recue).
 */
import { createMagenMusic, heatOf, levelsOf, lean, loopsFor, passSecs, MIN_HEARD, CHAIN } from './music.js';
import { song as scoreOf, IDS, ORDER, TUNES, LAYERS, BARS, melodyOf } from './score.js';
import { PREP } from '../director.js';
import * as Lang from '../../kernel/songtext.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(66) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

/* ---- 1. the score -------------------------------------------------------------------------------- */
console.log('-- the bars --');
for (const id of IDS) {
  const d = TUNES[id], bad = [];
  if (d.melody.length !== BARS) bad.push('has ' + d.melody.length + ' bars');
  d.melody.forEach((b, i) => { const len = Lang.parseNotes(b).length_; if (Math.abs(len - d.beats) > 1e-9) bad.push('bar ' + (i + 1) + ' is ' + len); });
  if (d.chords.split(' ').length !== BARS) bad.push('chords: ' + d.chords.split(' ').length);
  ok(!bad.length, id + ': sixteen bars of ' + d.beats + ' beats, and a chord for each', bad.join('; '));
}

console.log('\n-- the notes --');
const badNote = n => !(n[1] > 0 && n[0] >= 0 && n[2] >= 24 && n[2] <= 108 && n[3] > 0 && n[3] <= 1.0001);
for (const id of IDS) {
  const sg = scoreOf(Lang, id), len = Lang.songLength(sg);
  const wrong = sg.tracks.filter(t => (t.notes || []).some(badNote) || (t.hits || []).some(h => !(h[0] >= 0 && h[0] < len)));
  const over = sg.tracks.filter(t => (t.notes || []).some(n => n[0] >= len || n[0] + n[1] > len + 0.5));
  ok(!wrong.length && !over.length, id + ': every note is playable and starts inside the song and rings no further than half a beat past it', wrong.concat(over).map(t => t.name).join(', '));
}

console.log('\n-- the band --');
for (const id of IDS) {
  const sg = scoreOf(Lang, id), by = k => sg.tracks.filter(t => t.layer === k).length, core = sg.tracks.filter(t => t.layer == null).length;
  if (id === 'zmirot') { ok(sg.tracks.every(t => t.layer == null), "Shabbat's tune has no layers: nothing a click could bring in", sg.tracks.length + ' tracks'); continue; }
  ok(core >= 5 && LAYERS.every(k => by(k) >= 2) && sg.tracks.every(t => t.layer == null || LAYERS.includes(t.layer)),
     id + ': a core of ' + core + ' and layers of ' + LAYERS.map(k => by(k)).join('/'));
}
{
  const insts = new Set(); IDS.forEach(id => scoreOf(Lang, id).tracks.forEach(t => insts.add(t.inst)));
  ok(insts.size >= 12, 'the six tunes use a dozen real instruments between them', [...insts].sort().join(' '));
  ok(new Set(IDS.map(id => scoreOf(Lang, id).bpm)).size === IDS.length, 'and no two share a tempo', IDS.map(id => scoreOf(Lang, id).bpm).join(' '));
}

/* the lead against its chord: on the strong beats it is a chord tone, and the rubs that are left are counted */
console.log('\n-- the lead on its chords --');
/* what each tune may use besides its mode: C# and E are the dominant chord's third and fifth; Bb and G the prayer's borrowed Gm */
const OUT = { freygish: [1, 4], nigun: [1, 4], hora: [1, 4], misheberach: [1, 10, 7], freylekhs: [], zmirot: [1, 4] };
for (const id of IDS) {
  const d = TUNES[id], ch = d.chords.split(' '), mel = melodyOf(Lang, id), per = d.beats;
  let strong = 0, on = 0, rubs = 0, held = 0;
  const outside = new Set();
  mel.forEach(n => {
    const bar = Math.min(BARS - 1, Math.floor(n[0] / per)), tones = Lang.chordNotes(ch[bar], 60).map(x => x % 12), pc = n[2] % 12, at = n[0] - bar * per;
    if (d.pcs && d.pcs.indexOf(pc) < 0 && (OUT[id] || []).indexOf(pc) < 0) outside.add(pc);
    if (Math.abs(at % 1) < 1e-6 && (at === 0 || (per === 4 && at === 2))) { strong++; if (tones.includes(pc)) on++; }
    if (Math.abs(at % 1) < 1e-6 && n[1] >= 1) {                 /* a held note on a beat: does it grind against a chord tone? */
      held++;
      if (!tones.includes(pc) && tones.some(t => { const dd = Math.abs(t - pc); return dd === 1 || dd === 11; })) rubs++;
    }
  });
  ok(strong ? on / strong >= 0.7 : true, id + ': ' + on + ' of ' + strong + ' strong-beat notes are chord tones', ((on / strong) * 100).toFixed(0) + '%');
  ok(held ? rubs / held <= 0.25 : true, id + ': ' + rubs + ' of ' + held + ' held beat notes rub a chord tone by a semitone (the mode\'s own)', ((rubs / held) * 100).toFixed(0) + '%');
  ok(!outside.size, id + ': no pitch outside its mode and its leading tones', [...outside].join(','));
}

/* ---- 2. the band leans ---------------------------------------------------------------------------- */
console.log('\n-- the band leans in --');
{
  const marks = CHAIN.map(c => c[0]), heats = CHAIN.map(c => c[1]);
  ok(heatOf(0) === 0 && heatOf(-3) === 0 && heatOf(NaN) === 0, 'no chain, no heat');
  ok(marks.every((m, i) => heatOf(m) === heats[i]) && heatOf(500) === 3, 'the marks of the chain earn the heats they name; nothing earns more than 3');
  let up = true, prev = -1; for (let c = 0; c <= 60; c++) { const h = heatOf(c); if (h < prev) up = false; prev = h; }
  ok(up, 'a longer chain never earns less than a shorter one');
  const l = levelsOf(0), m = levelsOf(1.5), t = levelsOf(3);
  ok(LAYERS.every(k => l[k] === 0) && LAYERS.every(k => t[k] === 1) && m.h1 === 1 && m.h2 === 0.5 && m.h3 === 0, 'the layers come in one after another: the next starts as the last is full');

  /* hold the button: the chain climbs ~12 a second (a press every 85 ms) at 30 frames a second */
  const dt = 1 / 30; let e = 0, combo = 0, worst = 0, at3 = -1, last = levelsOf(0);
  for (let f = 0; f < 30 * 8; f++) {
    if (f % 3 === 0 || f % 3 === 1) { /* a press about every 2.55 frames */ }
    combo = Math.min(90, f * dt * 11.7);
    e = lean(e, heatOf(combo), dt);
    const lv = levelsOf(e); LAYERS.forEach(k => { worst = Math.max(worst, Math.abs(lv[k] - last[k])); });
    last = lv; if (at3 < 0 && e >= 2.9) at3 = f * dt;
  }
  ok(worst < 0.25, 'held down, no frame moves any layer by more than a quarter', 'worst step ' + worst.toFixed(3));
  ok(at3 > 0 && at3 < 9, 'and the whole band is in within a few seconds', at3.toFixed(1) + ' s');
  let e2 = 3; for (let f = 0; f < 30; f++) e2 = lean(e2, 0, dt);
  ok(e2 > 2.2, 'when the chain breaks the band is still most of the way there a second later', e2.toFixed(2) + ' of 3');
  let e3 = 3; for (let f = 0; f < 30 * 12; f++) e3 = lean(e3, 0, dt);
  ok(e3 < 0.15, 'and sits right back down within twelve seconds', e3.toFixed(2));
}

/* ---- 3. the seams ---------------------------------------------------------------------------------- */
console.log('\n-- the tunes follow each other --');
function rig() {
  const R = { t: 0, calls: [], player: null, allowed: true, levels: [], layers: [] };
  const lenOf = id => passSecs(id);
  const idOf = sg => Object.keys(TUNES).find(k => TUNES[k].title === sg.title);
  const mk = (id, startT) => ({
    id, startT, len: lenOf(id),
    beat() { return (Math.max(0, R.t - startT) % this.len) * TUNES[id].bpm / 60; },
    remaining() { return this.len - (Math.max(0, R.t - startT) % this.len); },
    toBar() { const per = TUNES[id].beats, b = this.beat(); return Math.max(0, (Math.ceil(b / per - 1e-6) * per - b) * 60 / TUNES[id].bpm); }
  });
  const deck = {
    get playing() { return !!R.player; }, get player() { return R.player; },
    async play(sg, o) { R.calls.push({ how: 'play', id: idOf(sg), t: R.t, o }); R.player = mk(idOf(sg), R.t); return R.player; },
    async segue(sg, o) {
      const old = R.player, rest = old.remaining(), when = (rest > 0.9 && !o.now) ? 'end' : 'bar';
      R.calls.push({ how: 'segue', when, id: idOf(sg), t: R.t, rest, o });
      R.player = mk(idOf(sg), R.t + (when === 'end' ? rest : old.toBar())); return R.player;
    },
    levels(m, o) { R.levels.push({ t: R.t, m, o }); }, layers(m) { R.layers.push(m); }, preload() { return Promise.resolve(); }, stop() { R.player = null; }
  };
  R.music = createMagenMusic({ studio: () => ({ deck: () => deck, lang: Lang }), playing: () => R.allowed });
  R.tick = async dt => { R.t += dt; R.music.sync(); R.music.step(dt); await Promise.resolve(); await Promise.resolve(); };
  R.run = async (secs, dt = 0.25) => { for (let i = 0; i < secs / dt; i++) await R.tick(dt); };
  return R;
}
{
  ok(ORDER.every(id => loopsFor(id) * passSecs(id) >= MIN_HEARD) && ORDER.every(id => loopsFor(id) * passSecs(id) < MIN_HEARD + passSecs(id)),
     'every tune is heard for about a minute and a half, in whole passes', ORDER.map(id => id + ' ' + loopsFor(id) + '×' + passSecs(id).toFixed(0) + 's').join('  '));
  const R = rig(); await R.tick(0.1);
  ok(R.calls.length === 1 && R.calls[0].how === 'play' && R.calls[0].id === ORDER[0], 'it starts on the first of the rotation', R.calls[0] && R.calls[0].id);
  ok(R.calls[0].o.levels && LAYERS.every(k => R.calls[0].o.levels[k] === 0), 'at rest it starts as the bare core', JSON.stringify(R.calls[0].o.levels));
  await R.run(60 * 15);
  const seq = R.calls.map(c => c.id);
  ok(seq.length >= 8 && seq.every((id, i) => id === ORDER[i % ORDER.length]), 'then the rotation, in order, round and round', seq.join(' > '));
  ok(R.calls.slice(1).every(c => c.how === 'segue' && c.when === 'end' && c.rest > 1.2 && c.rest <= PREP), 'each change is a segue arranged in the last ' + PREP + ' s of a pass and landing at its end');
  const gaps = R.calls.slice(1).map((c, i) => c.t - R.calls[i].t), mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  ok(gaps.every(g => g > 60) && mean > 85, 'no tune lasts under a minute, and they average over a minute and a half', 'shortest ' + Math.min(...gaps).toFixed(0) + ' s, mean ' + mean.toFixed(0) + ' s');
}

console.log('\n-- Shabbat --');
{
  const R = rig(); await R.tick(0.1); await R.run(20);
  const before = R.calls[R.calls.length - 1].id;
  R.music.want('zmirot'); await R.run(1);
  const c = R.calls[R.calls.length - 1];
  ok(c.id === 'zmirot' && c.how === 'segue' && c.when === 'bar', 'the rest day takes its own tune, in on the next bar line', c.id + ' ' + c.when);
  const n = R.calls.length; await R.run(60 * 6);
  ok(R.calls.length === n, "and holds it: Shabbat's tune does not rotate", 'calls ' + R.calls.length);
  R.music.want(null); await R.run(1);
  const back = R.calls[R.calls.length - 1];
  ok(back.id === ORDER[(ORDER.indexOf(before) + 1) % ORDER.length] && back.when === 'bar', 'letting go goes on from where the music was, not back to the start', before + ' > ' + back.id);
  R.music.chain(60); await R.run(10);
  R.music.want('zmirot'); await R.run(1); R.music.chain(60); await R.run(20);
  ok(R.music.energy < 0.3, 'and a click on the rest day does not bring the band in', R.music.energy.toFixed(2));
}

console.log('\n-- a click is never a restart --');
{
  const R = rig(); await R.tick(0.1); await R.run(5);
  const calls0 = R.calls.length, lv0 = R.levels.length;
  R.music.chain(10); await R.run(2);
  R.music.chain(30); await R.run(2);
  R.music.chain(60); await R.run(5);
  ok(R.calls.length === calls0, 'a chain from nothing to the top starts and stops nothing', 'calls ' + R.calls.length);
  ok(R.levels.length > lv0 + 5, 'it only rides the layers', (R.levels.length - lv0) + ' level changes');
  const steps = R.levels.slice(lv0), seen = steps.map(s => s.m);
  let big = 0; seen.forEach((m, i) => { const p = i ? seen[i - 1] : levelsOf(0); LAYERS.forEach(k => { big = Math.max(big, Math.abs(m[k] - p[k])); }); });
  ok(big < 0.45, 'and each change is a small one, glided to by the desk', 'largest ' + big.toFixed(2) + ', glide ' + steps[0].o.glide + ' s');
  ok(steps.every((s, i) => i === 0 || s.t - steps[i - 1].t >= 0.17), 'at a steady pace, not once per frame', steps.length + ' pushes in ' + (steps[steps.length - 1].t - steps[0].t).toFixed(1) + ' s');
  R.music.chain(0); await R.run(30);
  const end = R.levels[R.levels.length - 1].m;
  ok(LAYERS.every(k => end[k] === 0), 'and when it is over every layer has gone back out', JSON.stringify(end));
  ok(R.calls.length === calls0, 'still the same tune', R.calls.length + ' calls');
}
{
  const R = rig(); await R.tick(0.1); R.music.chain(60); await R.run(10);
  const mid = R.music.energy; R.music.stop();
  ok(R.music.on === false, 'switching the sound off stops it');
  R.allowed = true; await R.tick(0.1);
  ok(R.calls[R.calls.length - 1].how === 'play' && R.calls[R.calls.length - 1].o.levels.h1 > 0 && mid > 2, 'and switching it back on picks the band up where the chain has it', JSON.stringify(R.calls[R.calls.length - 1].o.levels));
}

console.log('\n' + (fails ? fails + ' of ' + checks + ' Magen music checks FAILED' : 'All ' + checks + ' Magen music checks pass.'));
process.exit(fails ? 1 : 0);
