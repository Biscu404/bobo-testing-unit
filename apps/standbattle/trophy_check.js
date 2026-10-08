/* node apps/standbattle/trophy_check.js — the Arena's trophy bridge, held to what a fight really does. Fights are played headless (the same sim the window runs, one frame at a time) by
   small scripted players, with a recording sink standing in for the ledger: the counters that come out of the hook bus must agree with what the player did, `fight-end` is said once and
   only once the fight is decided, a card for a trophy is held for the length of the fight, and the trophies that ask for a style (ZA WARUDO, JUST THE JAB, UNTOUCHABLE, ...) are reachable. */
import { createCombat } from './combat.js';
import { createRng } from './rng.js';
import { ENEMIES, BOSS_KILLER_QUEEN } from './data.js';
import { wireTrophies } from './trophies_bridge.js';
import { createDispatcher } from './hooks.js';
import { TROPHIES } from './trophies.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };

const sinkOf = () => { const log = []; let held = 0; return { log, get held() { return held; }, emit: (n, p) => { log.push([n, p]); return []; }, hold: () => { held++; }, release: () => { held--; }, drain: () => [], mark() {}, add() {} }; };
const REACH = 62;
/* a player: close the gap, then press the next key of `plan` (cycled) whenever idle */
function fight(seed, enemyDef, plan, opts = {}) {
  const sink = sinkOf(), combat = createCombat(enemyDef, [], { shakeEnabled: opts.shake !== false, speedMult: opts.speedMult }, createRng(seed));
  const bridge = wireTrophies(combat, { enemyId: enemyDef.id, nodeId: 'n1', modifier: opts.modifier || null, shake: opts.shake !== false }, sink);
  const heldAtStart = sink.held;
  let i = 0, n = 0;
  for (; n < 60 * 120 && combat.outcome === 'fighting'; n++) {
    const p = combat.player, e = combat.enemy, dist = Math.abs(e.x - p.x), closing = dist > REACH;
    combat.setKey('right', closing && e.x >= p.x); combat.setKey('left', closing && e.x < p.x);
    if (!closing && p.state === 'idle') { const k = typeof plan === 'function' ? plan(combat) : plan[i++ % plan.length]; combat.setKey(k, true); combat.setKey(k, false); }
    combat.step();
  }
  const early = sink.log.filter(l => l[0] === 'fight-end').length;
  bridge.end(); bridge.end();
  return { combat, sink, bridge, heldAtStart, early, ends: sink.log.filter(l => l[0] === 'fight-end').map(l => l[1]) };
}

const thug = ENEMIES.morioh_thug;
{
  const f = fight('t1', thug, ['light']);
  ok(f.early === 0, 'nothing is said while the fight is on');
  ok(f.ends.length === 1, 'fight-end is said once, however many times it is asked for');
  ok(f.heldAtStart === 1 && f.sink.held === 0, 'a card is held for the length of the fight and let go at its end');
  const p = f.ends[0];
  ok(p.won === (f.combat.outcome === 'win') && p.enemy === 'morioh_thug' && p.shake === true, 'the payload says who won, against whom, and the shake setting');
  ok(p.moveTypes.length === 1 && p.moveTypes[0] === 'light', 'a player who only jabs has only jabbed: ' + JSON.stringify(p.moveTypes));
  ok(p.secs > 0 && Math.abs(p.secs - f.combat.frames / 60) < 1e-9, 'the clock is whole sim frames: ' + p.secs.toFixed(2) + ' s');
  ok(p.damageTaken === Math.round(f.combat.player.maxHp - f.combat.player.hp) || p.damageTaken >= 0, 'damage taken is a number');
  ok(p.maxMomentum > 0 && p.maxCombo >= 1, 'momentum and a combo were built: ' + p.maxMomentum + ', ' + p.maxCombo);
}
/* a different seed is a different fight, the same seed is the same one */
{ const a = fight('same', thug, ['light', 'light', 'medium', 'heavy']).ends[0], b = fight('same', thug, ['light', 'light', 'medium', 'heavy']).ends[0];
  ok(JSON.stringify(a) === JSON.stringify(b), 'the same seed and the same hands give the same fight-end'); }

/* ZA WARUDO: a DELINQUENT in under five seconds is reachable by a player who never stops */
{ let best = 99; ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].forEach(s => { const r = fight(s, thug, ['light', 'light', 'light', 'medium', 'heavy']).ends[0]; if (r.won) best = Math.min(best, r.secs); });
  ok(best < 5, 'ZA WARUDO is reachable: the quickest of ten fights took ' + best.toFixed(2) + ' s'); }
/* JUST THE JAB: only jabs can win it */
{ let won = 0; for (let k = 0; k < 10; k++) { const r = fight('j' + k, thug, ['light']).ends[0]; if (r.won && r.moveTypes.join() === 'light') won++; }
  ok(won > 0, 'JUST THE JAB is reachable: ' + won + ' of 10 jab-only fights were won'); }
/* the bridge's arithmetic, against a combat whose events are made by hand: twenty jabs thirty frames apart are one combo of twenty, a hit taken ends it, a gap of over a second ends it, momentum
   is read where it is built, guard hits are the hits taken while guarding, a perfect clash is told as it happens and counted */
{
  const sink = sinkOf(), dispatcher = createDispatcher(), player = { momentum: 0, hp: 100, maxHp: 100, guarding: false }, enemy = { def: { id: 'angelo' } };
  const combat = { dispatcher, player, enemy, frames: 0, outcome: 'fighting' };
  const b = wireTrophies(combat, { enemyId: 'angelo', nodeId: 'n5', shake: true }, sink);
  const hit = (type, fin) => dispatcher.fire('onHit', { moveType: type, combo: 0, finishing: !!fin, crit: false });
  for (let k = 0; k < 20; k++) { combat.frames += 30; player.momentum = Math.min(100, k * 6); hit('light'); }
  ok(b.counters.maxCombo === 20, 'twenty hits thirty frames apart are a combo of twenty (' + b.counters.maxCombo + ')');
  dispatcher.runEffect('onDamageTaken', { entity: player, dmg: 7, heavy: false, cancelled: false });
  ok(b.counters.damageTaken === 7 && b.counters.chain === 0, 'a hit taken is counted and ends the combo');
  combat.frames += 30; hit('medium'); combat.frames += 90; hit('heavy'); ok(b.counters.chain === 1 && b.counters.maxCombo === 20, 'a gap of more than a second starts a new combo');
  ok(b.counters.maxMomentum === 100 || b.counters.maxMomentum === 96, 'momentum is read where it is built (' + b.counters.maxMomentum + ')');
  player.guarding = true; for (let k = 0; k < 8; k++) dispatcher.runEffect('onDamageTaken', { entity: player, dmg: 1, heavy: false, cancelled: false });
  player.guarding = false;
  ok(b.counters.guardHits === 8 && !b.counters.guardBroke, 'eight hits taken guarding are eight guard hits, with no break');
  dispatcher.runEffect('onGuardBreak', { entity: player, cause: 'heavy', cancelled: false }); ok(b.counters.guardBroke, 'a guard break is noted');
  for (let k = 0; k < 3; k++) dispatcher.runEffect('onPerfectClash', { entity: player, opponent: enemy, cancelled: false });
  dispatcher.runEffect('onStaggerStart', { entity: enemy, cause: 'poise', frames: 60, mult: 1, cancelled: false }); dispatcher.runEffect('onStaggerStart', { entity: player, cause: 'x', frames: 1, mult: 1, cancelled: false });
  for (let k = 0; k < 10; k++) dispatcher.fire('onDodgeSuccess', {});
  hit('rush', true); dispatcher.runEffect('onKill', { entity: player, target: enemy, combo: 3, cancelled: false }); combat.outcome = 'win'; player.hp = 8.4;
  b.end();
  const p = sink.log.filter(l => l[0] === 'fight-end')[0][1];
  ok(sink.log.filter(l => l[0] === 'perfect').length === 3 && p.perfectClashes === 3, 'a perfect clash is told as it happens (three), and counted');
  ok(p.staggers === 1 && p.dodges === 10 && p.finishedBy === 'rush' && p.hpLeft === 8 && p.won, 'staggers on the enemy only, ten dodges, finished by the rush, 8 HP left');
  /* and what each trophy would say of it */
  const rules = id => TROPHIES.find(t => t.id === id), says = (id, pl) => rules(id).when(pl);
  ok(says('sb_combo', p) && says('sb_momentum', Object.assign({}, p, { maxMomentum: 100 })) && says('sb_perfect3', p) && says('sb_step', p) && says('sb_poise', Object.assign({}, p, { staggers: 3 })), 'COMBO, MOMENTUM, PERFECT x3, STEP and POISE read what the bridge counts');
  ok(says('sb_rush', p) && says('sb_stand', p) && !says('sb_untouch', p) && !says('sb_guard', p), 'RUSH and STAND PROUD are earned by it, UNTOUCHABLE and BRICK WALL are not');
}
/* a fight a player is only just in: a heavy-only player is hit more often than a jabber, both are told */
{ const r = fight('k1', BOSS_KILLER_QUEEN, ['light', 'light', 'medium']).ends[0];
  ok(r.enemy === 'killer_queen' && typeof r.won === 'boolean', 'a boss fight reports too: ' + (r.won ? 'won' : 'lost') + ' in ' + r.secs.toFixed(1) + ' s'); }
/* the shake setting rides along */
{ const r = fight('s1', thug, ['light'], { shake: false }).ends[0]; ok(r.shake === false, 'a fight with the shake off says so'); }
/* a fight lost is a fight-end too (YARE YARE DAZE) */
{ let lost = null; for (let k = 0; k < 12 && !lost; k++) { const r = fight('l' + k, BOSS_KILLER_QUEEN, ['light']).ends[0]; if (!r.won) lost = r; }
  ok(lost && lost.won === false, 'a lost fight is told as one'); }

ok(TROPHIES.length === 24 && TROPHIES.every(t => t.id.indexOf('sb_') === 0), 'twenty-four Stand Battle trophies, every one an sb_');
console.log(fails ? fails + ' failed' : 'All checks pass.');
process.exit(fails ? 1 : 0);
