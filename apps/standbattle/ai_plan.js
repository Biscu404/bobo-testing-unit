/* What every part of the CPU shares: the half-width of a hurtbox, the dice helpers and how a move becomes inputs (spec 12). */
import { RULES } from './rules.js';
import { planInputs } from './input_plan.js';

export const H = RULES.HURT_HALF;
export const rint = (r, a, b) => a + Math.floor(r.random() * (b - a + 1));
export const pick = (r, list) => list[Math.floor(r.random() * list.length)];

export function startPlan(b, m, strings) {
  b.queue = planInputs(m, b.me.facing).slice();
  b.restAfter = rint(b.rng, b.P.think[0], b.P.think[1]);
  /* a string: the next button at the frame the follow-up opens */
  let cur = m;
  for (let k = 0; k < (strings || 0); k++) {
    const kids = b.me.ml.chains[cur.id];
    if (!kids) break;
    const kid = pick(b.rng, kids), at = cur.last.f + cur.last.n;
    if (k === 0) { while (b.queue.length < at - 2) b.queue.push(0); b.queue.push(kid.cmd.buttons); }
    else { b.queue.length = 0; return; }
    cur = kid;
    /* only the first follow-up is queued from here: a longer one is decided again when the first has started */
  }
}
