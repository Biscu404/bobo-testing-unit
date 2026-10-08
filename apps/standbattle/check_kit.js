/* Shared by the dev-only checks: a counter of passes and failures, and a fight to poke at. Not shipped. */
import { createFight } from './fight.js';
import { defOf } from './roster.js';
import { createRng } from './rng.js';
import { BIT, RULES, WORLD } from './rules.js';
import { planInputs } from './input_plan.js';

export function kit(title) {
  let fails = 0, n = 0;
  const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL - ' + m); } else if (process.env.VERBOSE) console.log('PASS - ' + m); };
  const done = () => { console.log(fails ? fails + ' of ' + n + ' checks failed (' + title + ')' : 'All ' + n + ' checks pass (' + title + ').'); process.exit(fails ? 1 : 0); };
  return { ok, done, count: () => n };
}

/* a fight in training mode (no clock, no rounds) with both fighters still: p0 on the left at `ax`, p1 `gap` to its right */
export function arena(a = 'jotaro', d = 'jotaro', o = {}) {
  const fight = createFight({ defs: [defOf(a, { walk: { f: 0, b: 0 } }), defOf(d, { walk: { f: 0, b: 0 } })], stage: o.stage || { id: 'street', rule: 'walls' }, rng: createRng(o.seed || 'kit'), training: o.training !== false, timerFrames: o.timerFrames, wins: o.wins, hp: o.hp });
  const [A, D] = fight.fighters;
  A.x = o.ax != null ? o.ax : 300; D.x = A.x + (o.gap != null ? o.gap : 34);
  fight.log = [];
  ['onHit', 'onBlock', 'onWhiff', 'onSidestepDodge', 'onThrow', 'onThrowBreak', 'onLaunch', 'onBounce', 'onWallSplat', 'onKnockdown', 'onWake', 'onCombo', 'onKO', 'onRoundEnd', 'onMatchEnd'].forEach(k => fight.bus.on(k, e => fight.log.push({ k, e, tick: fight.tick })));
  return { fight, A, D };
}
export const run = (fight, n, b0 = 0, b1 = 0) => { for (let i = 0; i < n; i++) fight.step(b0, b1); };
export const perform = (fight, A, id, b1 = 0) => planInputs(A.ml.byId.get(id), A.facing).forEach(b => fight.step(b, b1));
export const dirBit = (f, rel) => (rel === 'f') === (f.facing > 0) ? BIT.RIGHT : BIT.LEFT;
export const back = f => (f.facing > 0 ? BIT.LEFT : BIT.RIGHT);
export const events = (fight, k) => fight.log.filter(e => e.k === k);
export { BIT, RULES, WORLD };
