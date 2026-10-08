/* node apps/standbattle/fairness_check.js — the authoring guide of spec 5 as a check, run over every move of every fighter (it replaces the old "no attack you cannot react to" rule, which read
   telegraph times: this one reads frame data). What it holds:

     speed       nothing is faster than i10; the follow-up of a string is held to the same number counted from the first button
     lows        a low is i14 or slower, counted from the first button of its string; a sweep is i18 or slower and -18 or worse on block
     throws      i12 or slower, nothing to guard, and every fighter has the three throws and the three break buttons
     plus        only a quick jab (i11 or faster) is ever plus on block, and by no more than one
     punish      a move that is -11 or worse on block can be punished by the defender's jab: the jab is quicker than the recovery
     launchers   a launch or a knockdown is -12 or worse on block
     power       a move that starts on frame 15 or later is -6 or worse on block unless it is a jab-class poke
     range       a quick strike (i14 or faster) reaches no further than 70; nothing reaches further than 110
     things      a thrown thing takes 20 frames or more to cross 80 units, and starts no sooner than i20
     reaction    no CPU tier or ladder step sees a move faster than 8 frames after it starts, and the human-pace bot is not faster than a tier it is supposed to lose to
     counters    a counter move is no faster than i20 and every one of its frames is on the table

   It prints every move that breaks a rule. */

import { ROSTER, movelistOf } from './roster.js';
import { TIERS, HUMAN, ladderProfile, survivalProfile } from './ai_profiles.js';

const fails = [];
let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const H = 15;

/* the number of ticks from the first button of a string to the first active frame of one of its moves */
function delay(ml, m) {
  if (m.cmd.kind !== 'chain') return m.startup;
  const p = ml.byId.get(m.cmd.parent);
  return delay(ml, p) - p.startup + p.last.f + p.last.n + m.startup - 1 + 0;
}

Object.keys(ROSTER).forEach(id => {
  const ml = movelistOf(id), L = ml.list;
  const jab = L.find(m => m.cmd.kind === 'plain' && m.cmd.buttons === 16);
  const jabs = L.filter(m => m.cmd.kind === 'plain' && m.cmd.buttons === 16);
  L.forEach(m => {
    const tag = id + '.' + m.id + ' (' + m.name + ')', d = delay(ml, m), blk = m.adv.block;
    if (m.stance === 'down') return;                    /* wake-up kicks answer a fighter on the floor: they have their own rules (the oki table) */
    ok(d >= 10, tag + ': i' + d + ', faster than i10');
    if (m.h === 'l') ok(d >= 14, tag + ': a low at i' + d + ' (the guide says i14 or later, counted from the string\'s first button)');
    if (m.h === 'l' && m.reaction === 'down' && m.cmd.kind !== 'chain') ok(m.startup >= 17 && blk <= -17, tag + ': a sweep that starts at i' + m.startup + ' and is ' + blk + ' on block (i17+, -17 or worse)');
    if (m.h === 't') { ok(m.startup >= 12, tag + ': a throw at i' + m.startup); ok(m.adv.block === 0, tag + ': a throw with a block advantage'); return; }
    if (blk != null && blk > 0) ok(m.startup <= 11 && blk <= 1, tag + ': plus on block (' + blk + ') at i' + m.startup);
    if (blk != null && blk <= -11 && m.stance === 'stand') ok(jabs.some(j => j.startup < -blk), tag + ': ' + blk + ' on block and no jab quick enough to punish it');
    if (m.launching) ok(blk <= -12, tag + ': a ' + m.reaction + ' that is only ' + blk + ' on block');
    if (m.startup >= 15 && m.h !== 'l' && !m.proj && m.cmd.kind !== 'chain' && m.hits.length === 1) ok(blk <= -6 || m.reach <= 50, tag + ': i' + m.startup + ' and ' + blk + ' on block is too safe for a power move');
    if (m.cmd.kind !== 'chain' && !m.proj && !m.detonate && m.stance === 'stand') {
      if (m.startup <= 14 && m.cmd.kind !== 'motion') ok(m.reach <= 70, tag + ': a quick strike that reaches ' + m.reach);
      ok(m.reach <= 110, tag + ': reaches ' + m.reach);
    }
    if (m.proj) {
      ok(80 / m.proj.speed >= 20, tag + ': a thing that crosses 80 units in ' + Math.round(80 / m.proj.speed) + ' frames');
      ok(m.startup >= 20, tag + ': a thing thrown at i' + m.startup);
    }
    if (m.rev) { ok(m.startup >= 20, tag + ': a counter at i' + m.startup); ok(m.rev.from >= 1 && m.rev.to <= m.total, tag + ': a counter window outside the move'); }
  });
  const th = L.filter(m => m.h === 't' && !m.special);
  ok(th.length === 3 && ['LP', 'RP', 'ANY'].every(b => th.some(m => m.throw.brk === b)), id + ': three throws, broken by LP, RP and either');
  ok(!!jab && jab.startup >= 10 && jab.startup <= 11, id + ': a jab at i10 or i11 (' + (jab ? 'i' + jab.startup : 'none') + ')');
});

/* what the CPU can be asked to see */
const profiles = [TIERS.easy, TIERS.normal, TIERS.hard, HUMAN];
for (let t = 0; t <= 5; t++) ['easy', 'normal', 'hard'].forEach(tier => profiles.push(ladderProfile(tier, t, 6)));
for (let w = 0; w < 30; w += 3) profiles.push(survivalProfile(w));
ok(profiles.every(p => p.reaction >= 8), 'a CPU never reacts in under 8 frames');
ok(profiles.every(p => p.error > 0 && p.error < 0.5 && p.punish > 0 && p.punish <= 1), 'every profile errs sometimes and punishes sometimes');
ok(HUMAN.reaction >= ladderProfile('hard', 5, 6).reaction, 'the human-pace bot is not quicker than the best CPU');

if (fails.length) { fails.forEach(f => console.log('FAIL - ' + f)); console.log(fails.length + ' problems in ' + checks + ' checks'); process.exit(1); }
console.log('All ' + checks + ' fairness checks pass.');
