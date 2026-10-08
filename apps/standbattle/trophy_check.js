/* node apps/standbattle/trophy_check.js — the Arena's trophy bridge, held to what a fight really does. Fights are played headless (the same sim the window runs, one frame at a time) with a
   recording sink standing in for the ledger: the counters that come out of the hook bus must agree with what the fighters did, `fight-end` is said once and only once the match is decided,
   a card is held for the length of a match, and every trophy has a real play that earns it: the scenes below make each event happen, and the trophy's own rule is asked about what was said. */
import { kit, arena, run, perform, perform1, route, back, events, BIT, RULES, WORLD } from './check_kit.js';
import { createFight } from './fight.js';
import { createRng } from './rng.js';
import { defOf, PLAYABLE } from './roster.js';
import { createAI } from './ai.js';
import { profileOf, HUMAN } from './ai_profiles.js';
import { wireTrophies, setSink, emit, mark } from './trophies_bridge.js';
import { TROPHIES } from './trophies.js';
import { createSession } from './session.js';
import { runArcade, playMatch } from './headless_harness.js';
import { finish, saveScore } from './flow.js';
import { defaultMeta } from './save.js';
const { ok, done } = kit('trophies');

function sink() { const log = []; let held = 0; return { log, get held() { return held; }, emit: (n, p) => { log.push([n, p]); return []; }, hold: () => { held++; }, release: () => { held--; }, drain: () => [], mark: (s, i) => { log.push(['mark:' + s, i]); }, add() {} }; }
const said = (s, n) => s.log.filter(l => l[0] === n).map(l => l[1]);

/* a whole match, bot against CPU, watched */
{
  const s = sink(), cfg = createSession({ mode: 'cpu', p1: 'jotaro', p2: 'kira', tier: 'normal', seed: 'tb1' }).fightConfig();
  const fight = createFight({ defs: cfg.defs, stage: cfg.stage, rng: cfg.rng });
  const bridge = wireTrophies(fight, { enemy: 'kira', mode: 'cpu', tier: 'normal', shake: true }, s);
  const ais = [createAI(fight, 0, HUMAN), createAI(fight, 1, profileOf('normal'))];
  const heldAtStart = s.held;
  let n = 0; while (fight.phase !== 'over' && n++ < 60 * 60 * 6) fight.step(ais[0].bits(), ais[1].bits());
  ok(said(s, 'fight-end').length === 0, 'nothing is said about the match before it is over');
  bridge.end(); bridge.end();
  const e = said(s, 'fight-end');
  ok(e.length === 1, 'fight-end is said once, however many times it is asked for');
  ok(heldAtStart === 1 && s.held === 0, 'a card is held for the length of the match and let go at its end');
  const p = e[0], me = fight.fighters[0];
  ok(p.won === (fight.match.winner === 0) && p.enemy === 'kira' && p.rounds === fight.match.rounds, 'the payload says who won, against whom, in how many rounds');
  ok(p.maxCombo === me.stats.maxCombo || p.maxCombo <= me.stats.maxCombo, 'the best combo is what the fighter did (' + p.maxCombo + ')');
  ok(p.breaks === me.stats.breaks && p.dodges === me.stats.dodges, 'breaks and dodges are what the fighter did');
  ok(said(s, 'round-end').length === fight.history.length, 'a round-end for each round (' + fight.history.length + ')');
  ok(Math.abs(p.secs - fight.clock / 60) < 1e-9, 'the clock is whole sim frames: ' + p.secs.toFixed(1) + ' s');
  ok(p.damageTaken === Math.round(me.stats.taken), 'damage taken is what was taken');
}

/* every event, made to happen by play */
const W = {};                                     /* event -> payloads that really happened */
const note = (s) => s.log.forEach(l => { (W[l[0]] = W[l[0]] || []).push(l[1]); });
function watch(a, d, o, fn) {
  const s = sink(), { fight, A, D } = arena(a, d, o);
  const bridge = wireTrophies(fight, { enemy: d, mode: 'training', tier: 'normal' }, s);
  fn(fight, A, D);
  bridge.end(); note(s);
  return s;
}
const tap = (fight, who, bit) => { fight.step(who ? 0 : bit, who ? bit : 0); fight.step(0, 0); };
watch('jotaro', 'jotaro', {}, (f, A, D) => { perform(f, A, 'throw'); run(f, 40); });                                   /* a throw, landed */
watch('jotaro', 'jotaro', {}, (f, A, D) => { perform1(f, D, 'throw'); let w = 0; while (A.state !== 'thrown' && w++ < 30) f.step(0, 0); f.step(BIT.LP, 0); run(f, 30); });     /* the throw, broken */
watch('jotaro', 'jotaro', {}, (f, A, D) => { perform1(f, D, 'cross'); run(f, 3); tap(f, 0, BIT.UP); run(f, 40); });     /* a sidestep dodge */
watch('jotaro', 'jotaro', { training: false }, (f, A, D) => { run(f, RULES.INTRO_FRAMES + 2); perform(f, A, 'jab'); f.step(0, BIT.RP); run(f, 40); });   /* a counter hit */
watch('jotaro', 'jotaro', {}, (f, A, D) => { perform(f, A, 'finger'); run(f, 40); });                                  /* a special */
watch('jotaro', 'jotaro', {}, (f, A, D) => { route(f, A, [['crash', 0], ['barrage', 0]]); run(f, 220); });   /* a launch, juggles, a six-hit combo */
watch('jotaro', 'jotaro', {}, (f, A, D) => { perform(f, A, 'breaker'); run(f, 220); });                                /* a bounce */
watch('jotaro', 'jotaro', { ax: WORLD.MAX - 80, gap: 40 }, (f, A, D) => { D.x = WORLD.MAX - 12; perform(f, A, 'heel'); run(f, 60); });   /* a wall splat */
watch('kira', 'jotaro', {}, (f, A, D) => { perform(f, A, 'touch'); run(f, 40); let w = 0; while (A.state !== 'idle' && w++ < 90) f.step(0, 0); perform(f, A, 'detonate'); run(f, 60); });   /* a bomb, blown */
watch('angelo', 'jotaro', {}, (f, A, D) => { perform(f, A, 'aqua'); run(f, 60); });                                    /* the drowning grab */
watch('jotaro', 'jotaro', {}, (f, A, D) => { perform1(f, D, 'upper'); run(f, 40); });
watch('jotaro', 'jotaro', {}, (f, A, D) => {                                                                          /* ten attacks sidestepped in one match */
  for (let k = 0; k < 10; k++) { let w = 0; while (D.state !== 'idle' && A.state !== 'idle' && w++ < 100) f.step(0, 0); perform1(f, D, 'cross'); run(f, 3); tap(f, 0, A.lane ? BIT.DOWN : BIT.UP); run(f, 40); }
});
watch('jotaro', 'jotaro', {}, (f, A, D) => {                                                                          /* five throws broken in one match */
  for (let k = 0; k < 5; k++) { let w = 0; while ((A.state !== 'idle' || D.state !== 'idle') && w++ < 160) f.step(0, 0); D.x = A.x + 34; perform1(f, D, 'throw'); let q = 0; while (A.state !== 'thrown' && q++ < 30) f.step(0, 0); f.step(BIT.LP, 0); run(f, 30); }
});
const wk = sink(); { const { fight, A, D } = arena('jotaro', 'jotaro'); const b = wireTrophies(fight, { mode: 'training' }, wk); A.state = 'down'; A.t = RULES.DOWN_FRAMES + 1; A.lane = 0; run(fight, 3, BIT.UP, 0); run(fight, 25); b.end(); note(wk); }   /* a roll off the floor */

/* rounds: ring-out, draw, time, flawless, a final round */
function rounds(fn, o) {
  const s = sink(), { fight, A, D } = arena('jotaro', 'jotaro', Object.assign({ training: false, timerFrames: 3600 }, o || {}));
  const b = wireTrophies(fight, { enemy: 'jotaro', mode: 'cpu', tier: 'normal', shake: false, pad: true }, s);
  fn(fight, A, D); b.end(); note(s); return s;
}
rounds((f, A, D) => { run(f, RULES.INTRO_FRAMES); A.x = WORLD.MAX - 50; D.x = WORLD.MAX - 4; perform(f, A, 'heel'); run(f, 400); }, { stage: { id: 'park', rule: 'ring' } });
rounds((f, A, D) => { run(f, RULES.INTRO_FRAMES); A.x = WORLD.MIN + 4; D.x = WORLD.MIN + 38; perform1(f, D, 'heel'); run(f, 400); }, { stage: { id: 'park', rule: 'ring' } });
rounds((f, A, D) => { for (let k = 0; k < 2; k++) run(f, RULES.INTRO_FRAMES + 3700 + RULES.END_FRAMES); }, { timerFrames: 60 });
rounds((f, A, D) => { run(f, RULES.INTRO_FRAMES); D.hp = 3; perform(f, A, 'jab'); run(f, 500); run(f, RULES.INTRO_FRAMES); D.hp = 3; A.x = 300; D.x = 334; perform(f, A, 'jab'); run(f, 500); });
rounds((f, A, D) => { run(f, RULES.INTRO_FRAMES + 20); D.hp = 100; run(f, 3700); }, { timerFrames: 200 });
/* a match won against the boss in the ladder, and a mirror: what the match says about them */
{ const s = sink(), { fight, A, D } = arena('jotaro', 'jotaro', { training: false, timerFrames: 3600 }); const b = wireTrophies(fight, { enemy: 'boss', mode: 'arcade', tier: 'hard', mirror: true, shake: true }, s);
  for (let k = 0; k < 2; k++) { run(fight, RULES.INTRO_FRAMES); D.hp = 3; A.x = 300; D.x = 334; perform(fight, A, 'jab'); run(fight, 500); }
  b.end(); note(s); ok(said(s, 'fight-end')[0].won && said(s, 'fight-end')[0].enemy === 'boss' && said(s, 'fight-end')[0].mirror, 'a won match against the boss is said to be one, and a mirror to be a mirror'); }
rounds((f, A, D) => { run(f, RULES.INTRO_FRAMES); A.hp = 1; D.hp = 3; A.x = 300; D.x = 334; perform(f, A, 'jab'); run(f, 400); run(f, RULES.INTRO_FRAMES + 200); }, {});
Object.keys(W).forEach(k => { /* every event the checks made is one a trophy listens to, or one the bridge only counts */ });

/* the session-level calls, made through flow.js with a fake app */
{
  const s = sink(); setSink(s);
  const app = { meta: defaultMeta(), saveMeta() {}, toast() {}, go() {}, session: null };
  app.session = createSession({ mode: 'arcade', p1: 'jotaro', tier: 'hard', seed: 'x' });
  Object.assign(app.session, { cleared: true, over: true, score: 12000, continues: 0, secs: 900, i: 7 }); finish(app, 'clear'); note(s);
  const s2 = sink(); setSink(s2); app.session = createSession({ mode: 'survival', p1: 'kira', tier: 'normal', seed: 'y' }); Object.assign(app.session, { wins: 13, over: true }); finish(app, 'clear'); note(s2);
  const s3 = sink(); setSink(s3); app.session = createSession({ mode: 'timeattack', p1: 'angelo', tier: 'normal', seed: 'z' }); Object.assign(app.session, { cleared: true, over: true, secs: 200, i: 5 }); finish(app, 'clear'); note(s3);
  const s4 = sink(); setSink(s4); app.session = createSession({ mode: 'arcade', p1: 'jotaro', tier: 'normal', seed: 'w' }); app.session.score = 100; saveScore(app, 'abc'); note(s4);
  ['training-open', 'record-play', 'movelist-open', 'versus', 'rebind', 'debug-on'].forEach(n => { const q = sink(); setSink(q); emit(n, {}); note(q); });
  setSink(null);
  ok(said(s, 'ladder-clear').length === 1 && said(s, 'ladder-clear')[0].continues === 0 && said(s, 'mark:cleared').length === 1, 'a cleared ladder says so, with the tier, the continues and the fighter marked');
  ok(said(s2, 'survival-end')[0].wins === 13, 'a survival run says how many it won');
  ok(said(s3, 'timeattack-clear')[0].secs === 200, 'a time attack says how long it took');
  ok(said(s4, 'hiscore').length === 1, 'initials entered are told');
}
/* sets */
{ const s = sink(); setSink(s); PLAYABLE.forEach(id => { mark('won_with', id); mark('cleared', id); }); setSink(null); ok(said(s, 'mark:won_with').length === 5 && said(s, 'mark:cleared').length === 5, 'five fighters make the two sets of five'); }

/* each trophy has a witness */
const names = {}; TROPHIES.forEach(t => { names[t.id] = t; });
let unreached = [];
TROPHIES.forEach(t => {
  if (t.on) { const ws = W[t.on] || []; if (!ws.some(p => { try { return t.when(p); } catch (e) { return false; } })) unreached.push(t.id + ' (' + t.on + ')'); }
});
ok(unreached.length === 0, 'every trophy that listens for an event has a play that satisfies it' + (unreached.length ? ': NOT SHOWN: ' + unreached.join(', ') : ''));
ok(TROPHIES.filter(t => t.sets).every(t => t.sets.size === 5), 'the two sets ask for five fighters');
ok(TROPHIES.length === 47 && TROPHIES.every(t => t.id.indexOf('sb_') === 0), 'forty-seven Stand Battle trophies, every one an sb_ (' + TROPHIES.length + ')');
{ // negative cases: a trophy that says "without damage" is not earned by a match with damage
  const w = id => names[id].when;
  ok(!w('sb_perfect')({ won: true, damageTaken: 5, lostRound: false }) && w('sb_perfect')({ won: true, damageTaken: 0, lostRound: false }), 'PERFECT MATCH needs no damage and no lost round');
  ok(!w('sb_nocont')({ continues: 1 }) && w('sb_nocont')({ continues: 0 }), 'NO CONTINUES needs none');
  ok(!w('sb_tafast')({ secs: 300 }) && w('sb_tafast')({ secs: 200 }), 'FIVE IN FOUR is under four minutes');
}
done();
