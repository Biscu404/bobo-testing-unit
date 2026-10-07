/* Bekkedal music check — `node apps/bekkedal/music_check.js`
 *
 * The director (music.js) decides *when* the valley changes tune and *what* it changes to, and it does that against a
 * clock it does not own, so the check hands it a pretend studio whose deck counts bars the way the real one does and
 * records what it was asked. Then:
 *   - the first tune is drawn from the pool for where you stand, never always `dag`;
 *   - a tune is heard through MIN_LOOPS times before another follows it, whatever the clock says;
 *   - the change is arranged inside the last PREP seconds of a pass, as a segue, never mid-phrase;
 *   - it is arranged once (no second request for the same change);
 *   - the next tune is the next one in the pool, not a dice roll: the same hour always gives the same order;
 *   - a change of place does not wait out a long pass (a crossfade on the bar), and does not cut a nearly-finished one;
 *   - going quiet at night is a layer switch, not a new tune. */
import { createSongs, MIN_LOOPS, LOOPS, OVERLAP, GLIDE, PREP, URGENT_REST } from './music.js';
import { song as scoreOf, IDS } from './score.js';
import * as Lang from '../../kernel/songtext.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(60) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

/* a studio that is a clock: songs have a length in seconds, a deck plays the one it was last given, and `tick(dt)` advances */
function rig() {
  const R = { t: 0, calls: [], player: null, ctx: 'day', season: 'sommer', playing: true, layers: [], glides: [] };
  const lenOf = id => Lang.songLength(scoreOf(Lang, id)) * 60 / scoreOf(Lang, id).bpm;
  const mkPlayer = (id, startT) => ({
    id, startT, len: lenOf(id),
    beat() { const e = Math.max(0, R.t - startT) % this.len; return e * scoreOf(Lang, id).bpm / 60; },
    remaining() { return this.len - (Math.max(0, R.t - startT) % this.len); },
    toBar() { const per = scoreOf(Lang, id).beats || 4, b = this.beat(); return Math.max(0, (Math.ceil(b / per - 1e-6) * per - b) * 60 / scoreOf(Lang, id).bpm); }
  });
  const deck = {
    get playing() { return !!R.player; }, get player() { return R.player; },
    async play(sg, o) { R.calls.push({ how: 'play', id: sg.title.toLowerCase(), t: R.t, o }); R.player = mkPlayer(sg.title.toLowerCase(), R.t); return R.player; },
    async segue(sg, o) {
      const old = R.player, rest = old.remaining();
      const when = (rest > 0.9 && !o.now) ? 'end' : 'bar';
      const startT = R.t + (when === 'end' ? rest : old.toBar());
      R.calls.push({ how: 'segue', when, id: sg.title.toLowerCase(), t: R.t, rest, o });
      R.player = mkPlayer(sg.title.toLowerCase(), startT); return R.player;
    },
    layers(m) { R.layers.push(m); },
    /* the valley glides its layers: a level is the same switch, over a few seconds */
    levels(m, o) { R.glides.push(o && o.glide); R.layers.push(Object.keys(m).reduce((r, k) => { r[k] = m[k] > 0; return r; }, {})); },
    stop() { R.player = null; }
  };
  const S = { deck: () => deck, lang: Lang };
  R.songs = createSongs({ studio: () => S, playing: () => R.playing, context: () => R.ctx, season: () => R.season });
  R.tick = async (dt) => { R.t += dt; R.songs.sync(); R.songs.rotStep(dt); await Promise.resolve(); await Promise.resolve(); };
  R.run = async (secs, dt = 0.25) => { for (let i = 0; i < secs / dt; i++) await R.tick(dt); };
  return R;
}

/* ---- 1. where you start ---------------------------------------------------- */
console.log('-- the first tune --');
for (const [ctx, want] of [['mine', ['gruva']], ['high', ['vidda', 'dag']], ['night', ['kveld']], ['townday', ['folkedans', 'dag']], ['day', ['dag']]]) {
  const R = rig(); R.ctx = ctx; await R.tick(0.1);
  ok(R.calls.length === 1 && R.calls[0].how === 'play' && want.includes(R.calls[0].id), 'in "' + ctx + '" it starts with a tune from its own pool', R.calls[0] && R.calls[0].id);
}

/* ---- 2. a tune is heard through before it is changed -------------------------- */
console.log('\n-- how long a tune lasts --');
{
  const R = rig(); R.ctx = 'day'; await R.tick(0.1);
  const first = R.calls[0].id, len = scoreOf(Lang, first); const secs = Lang.songLength(len) * 60 / len.bpm;
  await R.run(secs * MIN_LOOPS - PREP - 2);
  ok(R.calls.length === 1, 'nothing is arranged until it has been heard ' + MIN_LOOPS + ' times and is nearly round again', 'calls ' + R.calls.length);
  await R.run(PREP + 2);
  ok(R.calls.length === 2 && R.calls[1].how === 'segue', 'then one change is arranged, as a segue', JSON.stringify(R.calls.slice(1).map(c => c.how + ':' + c.id)));
  ok(R.calls[1].rest > 1.2 && R.calls[1].rest <= PREP, 'inside the last ' + PREP + ' seconds of the pass', 'with ' + R.calls[1].rest.toFixed(1) + ' s left');
  ok(R.calls[1].when === 'end', 'it lands at the end of the pass', R.calls[1].when);
  await R.run(2);
  ok(R.calls.length === 2, 'and is arranged once', 'calls ' + R.calls.length);
}

/* ---- 3. the order is an order ---------------------------------------------------- */
console.log('\n-- the order --');
{
  const run = async ctx => { const R = rig(); R.ctx = ctx; await R.tick(0.1); await R.run(60 * 12); return R.calls.map(c => c.id); };
  const a = await run('day'), b = await run('day');
  ok(JSON.stringify(a) === JSON.stringify(b), 'the same place gives the same order every time', a.join(' > '));
  ok(a.length >= 4 && a.every((id, i) => i === 0 || id !== a[i - 1]), 'and never the same tune twice running', a.join(' > '));
  const town = await run('townday');
  ok(town.every(id => ['folkedans', 'dag'].includes(id)), 'the square draws from its own pool', town.join(' > '));
  const mine = await run('mine');
  ok(mine.length === 1 && mine[0] === 'gruva', 'a place with one tune goes on with it', mine.join(' > '));
}

/* ---- 4. a change of place ---------------------------------------------------------- */
console.log('\n-- a change of place --');
{
  const R = rig(); R.ctx = 'day'; await R.tick(0.1); await R.run(5);
  R.ctx = 'mine'; await R.run(1);
  const c = R.calls[R.calls.length - 1];
  ok(c.how === 'segue' && c.id === 'gruva' && c.when === 'bar', 'going down the mine early in a pass crossfades on the bar', c.how + ' ' + c.id + ' ' + c.when + ' rest ' + (c.rest || 0).toFixed(1));
  const R2 = rig(); R2.ctx = 'day'; await R2.tick(0.1);
  const sg = scoreOf(Lang, R2.calls[0].id), secs = Lang.songLength(sg) * 60 / sg.bpm;
  await R2.run(secs - URGENT_REST + 3);
  const before = R2.calls.length; R2.ctx = 'mine'; await R2.run(1);
  const c2 = R2.calls[R2.calls.length - 1];
  ok(R2.calls.length === before + 1 && c2.when === 'end', 'with the pass nearly over it waits for the end instead', c2.when + ' rest ' + (c2.rest || 0).toFixed(1));
}

/* ---- 5. night is a layer, not a tune ----------------------------------------------- */
console.log('\n-- the night --');
{
  const R = rig(); R.ctx = 'night'; await R.tick(0.1);
  const id = R.calls[0].id;
  ok(R.calls[0].o.layers && R.calls[0].o.layers.lead === false, 'a tune that goes quiet at night starts without its lead', id);
  R.ctx = 'day'; R.songs.cur = 'kveld'; await R.run(1);
  ok(R.layers.length >= 1 || R.calls.length > 1, 'and the dawn brings it back by layer or by a change');
}

/* ---- 5b. a change is not a feature of walking --------------------------------------- */
console.log('\n-- how gently it changes --');
{
  /* walking from the farm into the square, up the mountain, or the evening coming in: the tune you were hearing goes on */
  for (const [from, to] of [['day', 'townday'], ['day', 'high'], ['day', 'night'], ['townday', 'night']]) {
    const R = rig(); R.ctx = from; await R.tick(0.1);
    const was = R.calls[0].id;
    if (!(R.songs.pool().indexOf(was) >= 0)) continue;
    R.ctx = to; await R.run(12);
    const stays = R.calls.length === 1 && R.player && R.player.id === was;
    ok(stays, 'going from "' + from + '" to "' + to + '" does not change the tune at that step', R.calls.map(c => c.id).join(' > '));
  }
  /* the mine is the one place that takes the music away, and it takes it slowly */
  { const R = rig(); R.ctx = 'day'; await R.tick(0.1); R.ctx = 'mine'; await R.run(3);
    const c = R.calls[1];
    ok(c && c.id === 'gruva' && c.o.fade >= 5, 'the mine takes the music away over a crossfade of ' + (c && c.o.fade) + ' s', c && c.how + ' ' + c.when); }
  /* a natural change is laid over the end of the old tune, and a tune is heard for minutes */
  { const R = rig(); R.ctx = 'day'; await R.tick(0.1);
    const first = R.calls[0].id, sg = scoreOf(Lang, first), pass = Lang.songLength(sg) * 60 / sg.bpm;
    await R.run(pass * (LOOPS[first] || MIN_LOOPS) + 5);
    const c = R.calls.filter(x => x.how === 'segue')[0];
    ok(c && c.o.overlap === OVERLAP && c.o.fade >= 5, 'the change is laid over the last ' + OVERLAP + ' s of the old tune, in a crossfade of ' + (c && c.o.fade) + ' s', c && c.id);
    ok(pass * (LOOPS[first] || MIN_LOOPS) >= 100, 'and the first tune is heard for ' + Math.round(pass * (LOOPS[first] || MIN_LOOPS)) + ' s before it'); }
  /* after dark the lead and the arpeggios leave as a swell, not a switch */
  { const R = rig(); R.ctx = 'day'; await R.tick(0.1); R.songs.cur = 'kveld'; R.player.id = 'kveld'; R.ctx = 'night'; await R.run(1);
    ok(R.glides.length >= 1 && R.glides.every(g => g === GLIDE), 'after dark the lead and the arpeggios go out over ' + GLIDE + ' s', 'glides ' + R.glides.join(',')); }
}

/* ---- 6. every tune is one the director can ask for -------------------------------- */
console.log('\n-- the tunes --');
ok(IDS.every(id => { const s = scoreOf(Lang, id); return s.tracks.length && Lang.songLength(s) > 0; }), 'all five tunes exist and have a length', IDS.join(' '));

console.log('\n' + (fails ? fails + ' of ' + checks + ' music checks FAILED' : 'All ' + checks + ' music checks pass.'));
process.exit(fails ? 1 : 0);
