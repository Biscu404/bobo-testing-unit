/* One play through a mode (spec 11): which fight is next, what it is made of, what happened, what it scored. Pure -- no canvas, no clock -- so the budget bot walks the very same
   modes the screens do. The shell asks `fightConfig()`, plays it, and hands the finished match to `report(match, fight)`, which says where to go next:

     'vs'        the next fight   'continue'  a lost fight with continues left   'clear'  a ladder or a run finished   'over'  nothing left   'again'  versus: another?  */

import { createRng } from './rng.js';
import { defOf, PLAYABLE } from './roster.js';
import { STAGE_IDS, STAGES } from './stages.js';
import { ladderFor, MIRROR_TINT, LADDER_LENGTH } from './ladder.js';
import { profileOf } from './ai_profiles.js';
import { RULES } from './rules.js';

export const CONTINUES = { easy: 5, normal: 3, hard: 1 };
export const TIER_MULT = { easy: 0.5, normal: 1, hard: 2 };
const SURVIVAL_FRAMES = 45 * 60, HEAL = 30, TA_FIGHTS = 5;

export function scoreMatch(match, tier) {
  let s = 0, prev = 0;
  match.history.forEach(r => {
    const frames = (r.clock || 0) - prev; prev = r.clock || prev;
    if (r.winner === 0) {
      s += 1000 + Math.max(0, 60 - frames / 60) * 20;
      if (r.hp && r.hp[0] >= RULES.HP) s += 2000;
      if (r.how === 'ring') s += 500;
    }
  });
  s += Math.max(0, (match.stats[0].maxCombo || 0) - 3) * 50;
  return Math.round(s * (TIER_MULT[tier] || 1));
}

export function createSession(cfg) {
  const rng = createRng(cfg.seed || 'session'), tier = cfg.tier || 'normal';
  const S = {
    mode: cfg.mode, tier, p1: cfg.p1, p2: cfg.p2 || null, humans: cfg.humans || [true, false], rng, i: 0, score: 0, secs: 0, continues: 0, over: false, cleared: false,
    maxContinues: CONTINUES[tier] || 3, results: [], carry: null, wins: 0, stageId: cfg.stage || null, lastMatch: null, ladder: null, order: null, matches: 0
  };
  if (S.mode === 'arcade') S.ladder = ladderFor(S.p1);
  if (S.mode === 'survival') S.order = [];
  if (S.mode === 'timeattack') S.ladder = ladderFor(S.p1).filter(r => !r.mirror).slice(0, TA_FIGHTS - 1).concat([{ id: 'boss', boss: true, stage: 'store' }]);
  S.total = S.ladder ? S.ladder.length : 0;

  function survivalOpponent() {
    const n = S.wins;
    if (n > 0 && n % 6 === 0) return { id: 'boss', boss: true, stage: 'store' };
    const pool = PLAYABLE.filter(id => id !== S.p1 || n % 5 === 4);
    const id = pool[Math.floor(rng.stream('surv').random() * pool.length)];
    return { id, mirror: id === S.p1, stage: STAGE_IDS[Math.floor(rng.stream('surv-st').random() * STAGE_IDS.length)] };
  }

  S.opponent = function () {
    if (S.mode === 'arcade' || S.mode === 'timeattack') return S.ladder[S.i];
    if (S.mode === 'survival') return S.pending || (S.pending = survivalOpponent());
    return { id: S.p2, mirror: S.p2 === S.p1, stage: S.stageId || STAGE_IDS[0] };
  };

  S.fightConfig = function () {
    const op = S.opponent(), human2 = S.humans[1];
    const d0 = defOf(S.p1), d1 = defOf(op.id, op.mirror ? { tint: MIRROR_TINT } : null);
    const stage = STAGES[S.stageId && (S.mode === 'versus' || S.mode === 'cpu') ? S.stageId : op.stage] || STAGES.street;
    const cfg2 = { defs: [d0, d1], stage, humans: [true, !!human2], rng: createRng((cfg.seed || 'session') + ':fight' + S.matches), label: S.label(), boss: !!op.boss };
    if (!human2) cfg2.profile = S.mode === 'arcade' || S.mode === 'timeattack' ? profileOf(tier, S.i, Math.max(2, S.total)) : S.mode === 'survival' ? profileOf(tier, Math.min(S.wins, 11), 12) : profileOf(tier, 0, 1);
    if (S.mode === 'survival' || S.mode === 'timeattack') { cfg2.wins = 1; cfg2.timerFrames = SURVIVAL_FRAMES; }
    if (S.mode === 'survival' && S.carry != null) cfg2.hp = [S.carry, null];
    if (S.mode === 'survival') cfg2.carry = true;
    return cfg2;
  };

  S.label = () => (S.mode === 'arcade' ? 'STAGE ' + (S.i + 1) + ' OF ' + S.total : S.mode === 'timeattack' ? 'FIGHT ' + (S.i + 1) + ' OF ' + S.total : S.mode === 'survival' ? 'WIN ' + (S.wins + 1) : S.mode === 'cpu' ? 'VERSUS CPU' : 'VERSUS');

  S.report = function (match, fight) {
    S.matches++;
    S.lastMatch = match;
    S.secs += fight ? fight.realFrames / 60 : match.frames / 60;
    const human = match.winner === 0;
    if (S.mode === 'arcade' || S.mode === 'timeattack') {
      if (human) {
        S.score += scoreMatch(match, tier);
        S.results.push({ opp: S.opponent().id, rounds: match.rounds, hp: match.hp[0] });
        S.i++;
        S.pending = null;
        if (S.i >= S.total) { S.cleared = true; S.over = true; if (S.continues) S.score = Math.round(S.score * Math.pow(0.95, S.continues)); return { next: 'clear' }; }
        return { next: 'vs' };
      }
      if (S.mode === 'arcade' && S.continues < S.maxContinues) return { next: 'continue' };
      S.over = true;
      return { next: 'over' };
    }
    if (S.mode === 'survival') {
      if (human) { S.wins++; S.score += scoreMatch(match, tier); S.carry = Math.min(RULES.HP, match.hp[0] + HEAL); S.pending = null; return { next: 'vs' }; }
      S.over = true; return { next: 'clear' };
    }
    return { next: 'again' };
  };

  S.useContinue = function () { S.continues++; return S.continues <= S.maxContinues; };
  return S;
}
