/* node apps/standbattle/ai_check.js — the CPU is a player (spec 12). What it holds:

     inputs      every frame the CPU hands the sim an integer of the eight bits, never both left and right or both up and down, and never touches the fight itself
     delay       what the CPU knows of the other fighter's move is what that move was `reaction` frames ago, not a frame sooner
     things      a thrown thing is not seen until `reaction` frames after it was thrown
     tech        a CPU that never breaks a throw never does, and one that always can, does (when it is quick enough to see the throw in time)
     ordering    on the same movelists, HARD beats NORMAL beats EASY, and each tier's win rate against the next is a real margin
     dice        the same seed gives the same game, a different seed a different one
   There is no check for a health, damage or speed multiplier because there is nowhere to put one (content_check.js: a profile has only the seven numbers). */

import { kit, arena, run, BIT } from './check_kit.js';
import { createFight } from './fight.js';
import { createAI } from './ai.js';
import { createRng } from './rng.js';
import { TIERS, HUMAN } from './ai_profiles.js';
import { defOf, PLAYABLE } from './roster.js';
import { STAGES } from './stages.js';
import { planInputs } from './input_plan.js';

const { ok, done } = kit('ai');
const prof = (o) => Object.assign({}, HUMAN, o);

/* ---- inputs ---- */
{
  let bad = 0, frames = 0, mutated = 0;
  [TIERS.easy, TIERS.normal, TIERS.hard, HUMAN].forEach((P, k) => {
    const fight = createFight({ defs: [defOf(PLAYABLE[k]), defOf(PLAYABLE[(k + 2) % 5])], stage: STAGES.street, rng: createRng('ai-in' + k) });
    const ais = [createAI(fight, 0, P), createAI(fight, 1, P)];
    for (let n = 0; n < 5000 && fight.phase !== 'over'; n++) {
      const before = JSON.stringify([fight.fighters[0].x, fight.fighters[1].x, fight.fighters[0].hp, fight.fighters[1].hp, fight.tick]);
      const b0 = ais[0].bits(), b1 = ais[1].bits();
      if (JSON.stringify([fight.fighters[0].x, fight.fighters[1].x, fight.fighters[0].hp, fight.fighters[1].hp, fight.tick]) !== before) mutated++;
      [b0, b1].forEach(b => { frames++; if (!Number.isInteger(b) || b < 0 || b > 255 || (b & 3) === 3 || (b & 12) === 12) bad++; });
      fight.step(b0, b1);
    }
  });
  ok(bad === 0 && frames > 15000, 'the CPU\'s ' + frames + ' frames of input are all integers of the eight bits with no opposite directions (' + bad + ' bad)');
  ok(mutated === 0, 'asking the CPU for its input changes nothing in the fight');
}

/* ---- delay ---- */
[8, 15, 24].forEach(R => {
  const { fight, A, D } = arena('jotaro', 'kira', { gap: 140 });
  const ai = createAI(fight, 0, prof({ reaction: R }));
  run(fight, 30);
  let started = null, saw = null;
  for (let n = 0; n < 80; n++) {
    if (started == null && D.state === 'attack') started = n;
    const b0 = ai.bits();
    if (saw == null && ai.brain.seen && ai.brain.seen.state === 'attack') saw = n;
    fight.step(b0, n === 3 ? BIT.LP : 0);
  }
  ok(started != null && saw != null && saw - started === R, 'reaction ' + R + ': the CPU sees a move begin ' + (saw - started) + ' frames after it did, to the frame');
});

/* ---- things ---- */
{
  const { fight, A, D } = arena('angelo', 'jotaro', { gap: 260 });
  const R = 20, ai = createAI(fight, 1, prof({ reaction: R, error: 0.0001 }));
  run(fight, 20);
  planInputs(A.ml.byId.get('rock'), A.facing).forEach(b => { ai.bits(); fight.step(b, 0); });
  let thrown = null, answered = null;
  for (let n = 0; n < 120 && !answered; n++) {
    if (thrown == null && fight.projectiles.length) thrown = fight.clock;
    const b1 = ai.bits();
    if (thrown != null && answered == null && ai.brain.mode && ai.brain.mode.proj) answered = fight.clock;
    fight.step(0, b1);
  }
  ok(thrown != null && answered != null && answered - thrown >= R, 'the CPU starts to answer a rock ' + (answered - thrown) + ' frames after it was thrown (reaction ' + R + ')');
}

/* ---- tech ---- */
function techTrials(P, n) {
  let broke = 0;
  for (let i = 0; i < n; i++) {
    const { fight, A, D } = arena('jotaro', 'kira', { seed: 'tech' + i, gap: 30 });
    const ai = createAI(fight, 1, P);
    run(fight, 12);
    planInputs(A.ml.byId.get('throw'), A.facing).forEach(b => fight.step(b, ai.bits()));
    let w = 0, did = false;
    fight.bus.on('onThrowBreak', () => { did = true; });
    while (w++ < 60) fight.step(0, ai.bits());
    if (did) broke++;
  }
  return broke;
}
{
  ok(techTrials(prof({ reaction: 8, tech: 0, step: 0, error: 0, aggro: 0 }), 30) === 0, 'a CPU with tech 0 never breaks a throw');
  const n = techTrials(prof({ reaction: 8, tech: 1, step: 0, error: 0, aggro: 0 }), 30);
  ok(n >= 27, 'a quick CPU with tech 1 breaks nearly every throw (' + n + ' of 30)');
  ok(techTrials(prof({ reaction: 18, tech: 1, step: 0, error: 0, aggro: 0 }), 30) === 0, 'a CPU too slow to see a throw in time cannot break it, however much it wants to');
}

/* ---- ordering ---- */
function duel(pa, pb, N, tag) {
  let w = 0;
  for (let i = 0; i < N; i++) {
    const ca = PLAYABLE[i % 5], cb = PLAYABLE[(i * 3 + 1) % 5];
    const fight = createFight({ defs: [defOf(ca), defOf(cb, ca === cb ? { tint: '#FF6B9E' } : null)], stage: STAGES.street, rng: createRng(tag + i) });
    const ais = [createAI(fight, 0, pa), createAI(fight, 1, pb)];
    let n = 0; while (fight.phase !== 'over' && n++ < 400000) fight.step(ais[0].bits(), ais[1].bits());
    if (fight.match.winner === 0) w++;
  }
  return w / N;
}
{
  const N = 120;
  const he = duel(TIERS.hard, TIERS.easy, N, 'he'), hn = duel(TIERS.hard, TIERS.normal, N, 'hn'), ne = duel(TIERS.normal, TIERS.easy, N, 'ne'), mirror = duel(TIERS.normal, TIERS.normal, N, 'nn');
  ok(he >= 0.85, 'HARD beats EASY (' + Math.round(he * 100) + '%)');
  ok(hn >= 0.6, 'HARD beats NORMAL by a margin (' + Math.round(hn * 100) + '%)');
  ok(ne >= 0.6, 'NORMAL beats EASY by a margin (' + Math.round(ne * 100) + '%)');
  ok(mirror > 0.35 && mirror < 0.65, 'the same tier on both sides is an even match (' + Math.round(mirror * 100) + '%)');
}

/* ---- dice ---- */
{
  const digest = seed => { const fight = createFight({ defs: [defOf('jotaro'), defOf('polnareff')], stage: STAGES.street, rng: createRng(seed) }); const ais = [createAI(fight, 0, HUMAN), createAI(fight, 1, HUMAN)]; for (let n = 0; n < 3000 && fight.phase !== 'over'; n++) fight.step(ais[0].bits(), ais[1].bits()); return JSON.stringify(fight.fighters.map(f => [f.x.toFixed(2), f.hp, f.stats.hits])); };
  ok(digest('same') === digest('same'), 'the same seed plays the same game');
  ok(digest('one') !== digest('two'), 'a different seed plays a different one');
}
done();
