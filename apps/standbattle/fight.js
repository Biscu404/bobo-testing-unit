/* The fight: two fighters, a stage, a round (spec 2, 10). `createFight(cfg)` then `fight.step(bits0, bits1)` once per 60 Hz frame; or
   `fight.update(dtMs, bitsOf)` which feeds real time to the fixed-step loop (the KO beat runs it slower, `timeScale`).

   cfg: { defs: [defA, defB]  (roster entries, each with .ml, the built movelist), stage: { id, rule: 'walls'|'ring' }, rng,
          training, wins (2), timerFrames (3600; 0 = no clock), hp: [a, b] (carry-over), startFrames }

   phase: 'intro' -> 'fight' -> 'ko' (slow beat) | 'end' -> next round's 'intro' ... -> 'over'.  A round ends on a KO, a ring-out or the clock; a drawn round is a
   win for both; if that gives both their last win at once a final round (30 s) decides, then damage dealt, then player 1. */

import { RULES, WORLD, LANE_Z } from './rules.js';
import { createDispatcher } from './hooks.js';
import { createFixedStepLoop } from './sim_loop.js';
import { createFighter, applyDamage } from './fighter.js';
import { createInput, pushInput } from './input_frames.js';
import { stepFighter, holdInside } from './fight_step.js';
import { detectHits } from './fight_hit.js';
import { tickCombo } from './fight_combo.js';
import { stepStatuses } from './status.js';

export function createFight(cfg) {
  const bus = createDispatcher();
  const fight = {
    cfg, bus, stage: cfg.stage || { id: 'street', rule: 'walls' }, rng: cfg.rng, training: !!cfg.training,
    clock: 0, tick: 0, phase: 'intro', phaseT: 0, hitstop: 0, timer: 0, timed: !cfg.training && cfg.timerFrames !== 0, round: 1, wins: [0, 0],
    need: cfg.wins || RULES.WINS, final: false, result: null, history: [], match: null, timeScale: 1, koT: 0,
    fighters: null, projectiles: []
  };
  const mid = WORLD.MID, half = RULES.START_GAP / 2;
  fight.fighters = [
    createFighter(cfg.defs[0], 0, mid - half, 0, cfg.defs[0].ml),
    createFighter(cfg.defs[1], 1, mid + half, 0, cfg.defs[1].ml)
  ];
  if (cfg.hp) fight.fighters.forEach((f, k) => { if (cfg.hp[k] != null) f.hp = cfg.hp[k]; });

  fight.ringOut = f => { if (fight.phase === 'fight') endRound(1 - f.slot, 'ring'); f.air && (f.air.ko = true); };

  function startRound() {
    const F = fight.fighters;
    F.forEach((f, k) => {
      f.x = mid + (k ? half : -half); f.lane = 0; f.z = LANE_Z[0]; f.facing = k ? -1 : 1;
      f.state = 'intro'; f.t = 0; f.move = null; f.mf = 0; f.stun = 0; f.slide = 0; f.vx = 0; f.vy = 0; f.y = 0; f.air = null; f.walk = 0; f.guard = false; f.crouch = false;
      f.statuses.length = 0; f.comboIn = { hits: 0, dmg: 0, juggles: 0, bounced: false, active: false, mult: 1 }; f.comboOut = { hits: 0, dmg: 0, shown: 0 };
      f.inp = createInput(); f.hurtFlash = 0;
      if (!(fight.round === 1 && cfg.hp) && !cfg.carry) f.hp = f.maxHp;
    });
    fight.projectiles.length = 0;
    fight.phase = fight.training ? 'fight' : 'intro'; fight.phaseT = 0; fight.hitstop = 0; fight.timeScale = 1; fight.result = null; fight.koT = 0;
    fight.timer = fight.final ? RULES.FINAL_FRAMES : (cfg.timerFrames != null ? cfg.timerFrames : RULES.ROUND_FRAMES);
    if (fight.training) F.forEach(f => { f.state = 'idle'; });
    bus.fire('onRoundStart', { round: fight.round, final: fight.final });
  }

  function endRound(winner, how) {
    if (fight.phase !== 'fight') return;
    fight.result = { winner, how, round: fight.round, hp: fight.fighters.map(f => f.hp), frames: fight.history.length };
    fight.phase = how === 'time' ? 'end' : 'ko';
    fight.phaseT = 0; fight.koT = 0;
    fight.timeScale = how === 'time' ? 1 : RULES.KO_SPEED;
    if (how === 'time') settleWinner();
    bus.fire('onKO', { winner, how, round: fight.round });
  }

  function settleWinner() {
    const w = fight.result.winner;
    fight.fighters.forEach(f => { if (f.slot === w && (f.state === 'idle' || f.state === 'attack')) { f.state = 'win'; f.move = null; f.t = 0; } });
  }

  function finishRound() {
    const r = fight.result;
    if (r.winner < 0) { fight.wins[0]++; fight.wins[1]++; } else fight.wins[r.winner]++;
    fight.history.push(r);
    bus.fire('onRoundEnd', { result: r, wins: fight.wins.slice() });
    const a = fight.wins[0] >= fight.need, b = fight.wins[1] >= fight.need;
    if (fight.final && !(r.winner >= 0)) { endMatch(tiebreak(), 'damage'); return; }
    if (a && b && !fight.final) { fight.final = true; fight.round++; startRound(); return; }
    if (a || b) { endMatch(a && b ? r.winner : a ? 0 : 1, 'rounds'); return; }
    fight.round++; startRound();
  }

  function tiebreak() {
    const d = fight.fighters.map(f => f.stats.dealt);
    return d[0] === d[1] ? 0 : d[0] > d[1] ? 0 : 1;
  }

  function endMatch(winner, how) {
    fight.phase = 'over'; fight.timeScale = 1;
    fight.match = { winner, how, rounds: fight.history.length, wins: fight.wins.slice(), frames: fight.clock, hp: fight.fighters.map(f => f.hp), stats: fight.fighters.map(f => f.stats), history: fight.history.slice() };
    bus.fire('onMatchEnd', fight.match);
  }

  function separate() {
    const [A, B] = fight.fighters;
    const ground = f => f.state !== 'air' && f.state !== 'thrown' && f.state !== 'ko';
    holdInside(fight, A, B); holdInside(fight, B, A);
    if (A.lane !== B.lane || !ground(A) || !ground(B)) return;
    const gap = B.x - A.x, ag = Math.abs(gap);
    if (ag >= RULES.PUSH_W) return;
    const dir = gap >= 0 ? (gap === 0 ? 1 : 1) : -1, need = RULES.PUSH_W - ag;
    A.x -= dir * need / 2; B.x += dir * need / 2;
    holdInside(fight, A, B); holdInside(fight, B, A);
    const left = RULES.PUSH_W - Math.abs(B.x - A.x);
    if (left > 0.001) { if (A.x <= WORLD.MIN || A.x >= WORLD.MAX) B.x += dir * left; else A.x -= dir * left; }
  }

  function checkEnd() {
    const [A, B] = fight.fighters;
    if (fight.training) {
      if (A.hp <= 0 || (!A.comboIn.active && A.hp < A.maxHp && fight.clock % 1 === 0 && A.state === 'idle' && fight.refill)) A.hp = A.maxHp;
      return;
    }
    if (A.hp <= 0 || B.hp <= 0) { endRound(A.hp <= 0 && B.hp <= 0 ? -1 : A.hp <= 0 ? 1 : 0, 'ko'); return; }
    if (fight.timed && fight.timer <= 0) {
      const pa = A.hp / A.maxHp, pb = B.hp / B.maxHp;
      endRound(Math.abs(pa - pb) < 1e-9 ? -1 : pa > pb ? 0 : 1, 'time');
    }
  }

  function simTick(live) {
    if (fight.hitstop > 0) { fight.hitstop--; return; }
    fight.clock++;
    if (fight.phase === 'fight' && fight.timed) fight.timer--;
    const [A, B] = fight.fighters;
    stepFighter(fight, A, B); stepFighter(fight, B, A);
    separate();
    if (live) detectHits(fight);
    A.statuses.length && stepStatuses(A); B.statuses.length && stepStatuses(B);
    tickCombo(A); tickCombo(B);
  }

  fight.step = function (bits0, bits1) {
    fight.tick++;
    const F = fight.fighters, ph = fight.phase, live = ph === 'fight';
    pushInput(F[0].inp, live ? bits0 : 0, F[0].facing, fight.clock);
    pushInput(F[1].inp, live ? bits1 : 0, F[1].facing, fight.clock);
    if (ph === 'over') return;
    if (ph === 'intro') {
      fight.phaseT++;
      if (fight.phaseT >= RULES.INTRO_FRAMES) { fight.phase = 'fight'; F.forEach(f => { f.state = 'idle'; f.t = 0; }); bus.fire('onFight', { round: fight.round }); }
      return;
    }
    simTick(ph === 'fight' || ph === 'ko');
    if (ph === 'fight') checkEnd();
    else if (ph === 'ko') {
      if (fight.hitstop === 0) fight.koT++;
      if (fight.koT >= RULES.KO_BEAT_FRAMES) { fight.phase = 'end'; fight.phaseT = 0; fight.timeScale = 1; settleWinner(); }
    } else if (ph === 'end') {
      fight.phaseT++;
      if (fight.phaseT >= RULES.END_FRAMES) finishRound();
    }
  };

  const loop = createFixedStepLoop(() => fight.step(fight._bits0(), fight._bits1()));
  fight._bits0 = () => 0; fight._bits1 = () => 0;
  /* real time in: `bitsOf(slot)` is asked once per sim frame */
  fight.update = function (dtMs, bitsOf) {
    fight._bits0 = () => bitsOf(0); fight._bits1 = () => bitsOf(1);
    return loop.advance(dtMs * fight.timeScale);
  };
  /* what the real clock would have shown for the frames so far: the KO beat is slow */
  fight.realFrames = 0;
  const baseStep = fight.step;
  fight.step = function (b0, b1) { fight.realFrames += 1 / (fight.phase === 'ko' ? RULES.KO_SPEED : 1); baseStep(b0, b1); };

  startRound();
  return fight;
}
