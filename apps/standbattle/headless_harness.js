/* node apps/standbattle/headless_harness.js [seed]  — the whole game with no canvas, no DOM and no clock (spec 2, 19). A seeded bot plays every mode through the SAME session
   logic the screens use (session.js, ladder.js, flow's pay table): the arcade ladder, versus, versus CPU, survival, time attack and training's dummy, one frame at a time.
   The same seed gives the same game, frame for frame: the harness proves it by playing the first fight twice. Importable (runArcade, playMatch, ...) for the budget bot. */

import { createFight } from './fight.js';
import { createRng } from './rng.js';
import { createAI } from './ai.js';
import { createSession } from './session.js';
import { profileOf, HUMAN } from './ai_profiles.js';
import { defOf, PLAYABLE, ROSTER } from './roster.js';
import { STAGES } from './stages.js';
import { createTrainer, resetFight, DUMMIES } from './training.js';
import { BIT } from './rules.js';
import { TIMING } from './timing.js';

const CAP_TICKS = 60 * 60 * 6;

/* one match from a session's fight config; `human` is the profile that plays slot 0 (a person, as a bot) */
export function playMatch(cfg, human) {
  const fight = createFight({ defs: cfg.defs, stage: cfg.stage, rng: cfg.rng, wins: cfg.wins, timerFrames: cfg.timerFrames, hp: cfg.hp, carry: cfg.carry });
  const ais = [createAI(fight, 0, human || HUMAN), createAI(fight, 1, cfg.profile || profileOf('normal'))];
  let n = 0;
  while (fight.phase !== 'over' && n++ < CAP_TICKS) fight.step(ais[0].bits(), ais[1].bits());
  return fight;
}

/* a ladder, with continues, until it is cleared or the continues are gone */
export function runArcade(char, tier, seed, human) {
  const S = createSession({ mode: 'arcade', p1: char, tier, seed });
  const out = { char, tier, fights: [], screens: 0, fightSecs: 0 };
  let step = 'vs';
  while (!S.over) {
    if (step === 'vs') { out.screens += TIMING.VS_SECS; }
    const cfg = S.fightConfig();
    const fight = playMatch(cfg, human);
    out.fightSecs += fight.realFrames / 60;
    out.screens += TIMING.RESULT_SECS;
    out.fights.push({ opp: S.opponent().id, won: fight.match.winner === 0, rounds: fight.match.rounds, secs: fight.realFrames / 60 });
    const r = S.report(fight.match, fight);
    if (r.next === 'continue') { S.useContinue(); out.screens += TIMING.CONTINUE_TAKEN; step = 'again'; } else step = 'vs';
    if (r.next === 'over') out.screens += TIMING.CONTINUE_SECS;
  }
  out.cleared = S.cleared; out.continues = S.continues; out.score = S.score; out.matches = S.matches;
  if (S.cleared) out.screens += TIMING.CLEAR_SECS + TIMING.INITIALS_SECS;
  return out;
}

export function runSurvival(char, tier, seed, human) {
  const S = createSession({ mode: 'survival', p1: char, tier, seed });
  const out = { char, fightSecs: 0, screens: 0 };
  while (!S.over) { out.screens += TIMING.VS_SECS; const f = playMatch(S.fightConfig(), human); out.fightSecs += f.realFrames / 60; out.screens += TIMING.RESULT_SECS; S.report(f.match, f); }
  out.wins = S.wins; out.score = S.score;
  return out;
}

export function runTimeAttack(char, tier, seed, human) {
  const S = createSession({ mode: 'timeattack', p1: char, tier, seed });
  const out = { char, fightSecs: 0, screens: 0 };
  while (!S.over) { out.screens += TIMING.VS_SECS; const f = playMatch(S.fightConfig(), human); out.fightSecs += f.realFrames / 60; out.screens += TIMING.RESULT_SECS; S.report(f.match, f); }
  out.cleared = S.cleared; out.fights = S.i; out.secs = S.secs;
  return out;
}

/* two people on one keyboard: both are bots at a person's pace */
export function runVersus(a, b, seed, human) {
  const S = createSession({ mode: 'versus', p1: a, p2: b, humans: [true, true], seed, stage: 'street' });
  const cfg = S.fightConfig();
  const fight = createFight({ defs: cfg.defs, stage: cfg.stage, rng: cfg.rng });
  const ais = [createAI(fight, 0, human || HUMAN), createAI(fight, 1, human || HUMAN)];
  let n = 0;
  while (fight.phase !== 'over' && n++ < CAP_TICKS) fight.step(ais[0].bits(), ais[1].bits());
  S.report(fight.match, fight);
  return { winner: fight.match.winner, secs: fight.realFrames / 60, rounds: fight.match.rounds };
}

export function runCpu(char, opp, tier, seed, human) {
  const S = createSession({ mode: 'cpu', p1: char, p2: opp, tier, seed });
  const f = playMatch(S.fightConfig(), human);
  S.report(f.match, f);
  return { won: f.match.winner === 0, secs: f.realFrames / 60, rounds: f.match.rounds };
}

/* training's dummies and recorder, driven for a while: every dummy mode acts, a recording replays what was pressed */
export function runTraining(seed, frames) {
  const rng = createRng(seed);
  const fight = createFight({ defs: [defOf('jotaro'), defOf('kira')], stage: STAGES.street, rng, training: true });
  const tr = createTrainer(fight, rng), me = createAI(fight, 0, HUMAN);
  const seen = {};
  DUMMIES.forEach((name, k) => {
    tr.dummy = k; resetFight(fight, 'right');
    for (let i = 0; i < (frames || 900); i++) { const hb = me.bits(); fight.step(hb, tr.bits(hb)); seen[name] = (seen[name] || 0) + (fight.fighters[1].state !== 'idle' || fight.fighters[1].crouch || fight.fighters[1].guard ? 1 : 0); }
  });
  tr.dummy = 0; resetFight(fight, 'right'); tr.startRecord();
  for (let i = 0; i < 120; i++) { const hb = i % 40 === 0 ? BIT.LP : 0; fight.step(0, tr.bits(hb)); }
  tr.stopRecord(); const recorded = tr.rec.length; resetFight(fight, 'right'); tr.play();
  const p0 = fight.tick; for (let i = 0; i < 120; i++) fight.step(0, tr.bits(0));
  return { dummies: seen, recorded, replayed: tr.pos > 0 || tr.again };
}

const digest = f => JSON.stringify(f.fighters.map(x => [x.x.toFixed(2), x.hp, x.state, x.stats.hits]));

if (typeof process !== 'undefined' && import.meta.url === 'file://' + process.argv[1]) {
  const seed = process.argv[2] || 'harness-seed';
  const a = playMatch(createSession({ mode: 'cpu', p1: 'jotaro', p2: 'kira', tier: 'normal', seed }).fightConfig()), b = playMatch(createSession({ mode: 'cpu', p1: 'jotaro', p2: 'kira', tier: 'normal', seed }).fightConfig());
  console.log('determinism: the same seed played twice ->', digest(a) === digest(b) ? 'identical (' + digest(a) + ')' : 'DIFFERENT');
  let bad = digest(a) !== digest(b) ? 1 : 0;
  PLAYABLE.forEach(id => {
    const r = runArcade(id, 'normal', seed + ':' + id);
    console.log('ARCADE  ' + id.padEnd(11), r.cleared ? 'cleared' : 'game over', 'in', r.fights.length, 'matches,', r.continues, 'continues, score', r.score, '(' + (r.fightSecs / 60).toFixed(1) + ' min of fighting)');
    if (!r.fights.length) bad++;
  });
  const sv = runSurvival('angelo', 'normal', seed); console.log('SURVIVAL angelo: ' + sv.wins + ' wins, score ' + sv.score);
  const ta = runTimeAttack('polnareff', 'normal', seed); console.log('TIME ATTACK polnareff:', ta.cleared ? 'cleared' : 'failed at fight ' + (ta.fights + 1), 'in', ta.secs.toFixed(0), 's');
  const vs = runVersus('delinquent', 'jotaro', seed); console.log('VERSUS 2P: player ' + (vs.winner + 1) + ' won in ' + vs.rounds + ' rounds, ' + vs.secs.toFixed(0) + ' s');
  const cp = runCpu('kira', 'angelo', 'hard', seed); console.log('VERSUS CPU (hard): ' + (cp.won ? 'won' : 'lost') + ' in ' + cp.secs.toFixed(0) + ' s');
  const tr = runTraining(seed); console.log('TRAINING: dummies acted ' + JSON.stringify(tr.dummies) + '; recorded ' + tr.recorded + ' frames, replayed: ' + tr.replayed);
  if (!(tr.dummies.CROUCH > 100 && tr.dummies.RANDOM > 50 && tr.recorded === 120)) bad++;
  console.log(bad ? 'HARNESS FAILED' : '\nThe harness played every mode.');
  process.exit(bad ? 1 : 0);
}
