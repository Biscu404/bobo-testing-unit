/* The CPU's neutral game (spec 12): nobody is hitting anybody and it is free to choose. Like a person it plays the distance first.

     out of everyone's reach   walk in, or wait;
     it reaches, they do not   a free poke: take it nearly every time;
     they reach, it does not   back off or guard: walking in is how pokes are lost;
     both reach                a race: attack as often as the profile's `aggro`, otherwise guard (sometimes crouching, when the other fighter has a low that reaches),
                               step back, or stand still.

   "Reaches" is the table's own: the longest reach among a fighter's quick moves (startup 17 or less), measured the way contact is (centre to the other's hurtbox edge).
   Nothing here reads a move id; difficulty is the profile's numbers and the seeded dice. */

import { BIT, RULES } from './rules.js';
import { hasStatus } from './status.js';
import { H, rint, pick, startPlan } from './ai_plan.js';

const QUICK = 17;
const cache = new WeakMap();

/* how far a movelist's quick strikes reach, and whether it has a low that reaches `gap` */
function quickReach(ml) {
  if (!cache.has(ml)) cache.set(ml, ml.list.reduce((r, m) => (m.stance === 'stand' && !m.chainOnly && !m.proj && !m.detonate && m.h !== 't' && m.startup <= QUICK ? Math.max(r, m.reach) : r), 0));
  return cache.get(ml);
}
const lowsAt = (o, gap) => o.ml.list.some(m => m.h === 'l' && m.stance === 'stand' && !m.chainOnly && m.reach + 4 >= gap);

/* every move worth choosing from here, with a weight: what reaches, what is safe, what reads the other fighter's stance */
function pool(b, gap, dist) {
  const { me } = b, out = [], o = b.seenStance;
  const hasTouch = me.ml.list.find(m => m.status && m.status.id === 'bomb');
  me.ml.list.forEach(m => {
    if (m.stance !== 'stand' || m.chainOnly || m.detonate) return;
    if (m.proj) { if (dist > 100 && dist < 360) out.push([m, 2.2, false]); return; }
    if (m.h === 't') { if (dist < 56) out.push([m, o.guard ? 2.4 : 1.2, true]); return; }
    if (m.reach + 3 < gap) return;
    let w = m.adv.block >= -3 ? 3 : m.adv.block >= -9 ? 1.8 : 0.7;
    if (m.h === 'l') w *= 0.8;
    if (m.special) w *= 0.7;
    if (m.launching && m.adv.block <= -12) w *= 0.5;
    if (hasTouch === m && !hasStatus(b.o, 'bomb')) w *= 5;
    if (m.cmd.kind === 'dash') w *= 0.5;
    if (me.ml.chains[m.id]) w *= 1.4;
    if (m.startup <= 12 && dist < 90) w *= 1.6;
    if (b.last === m.id) w *= 0.25;
    /* read the stance it can see: lows and throws beat a standing guard, mids beat a crouching one */
    if (o.guard && !o.crouch && (m.h === 'l' || m.h === 't')) w *= 2.5;
    if (o.crouch && m.h === 'm') w *= 2;
    if (o.crouch && m.h === 'h') w *= 0.3;
    out.push([m, w, true]);
  });
  return out;
}

export function neutral(b, dist) {
  const { me, o, P, rng, fight } = b;
  const think = () => rint(rng, P.think[0], P.think[1]);
  const gap = dist - H;
  /* it walked up to grab a guarding fighter: now it is close enough */
  const grab = me.ml.byId.get('throw');
  if (b.wantThrow && grab) {
    b.wantThrow = false;
    if (dist < 54) { startPlan(b, b.seen && b.seen.guard && rng.random() < 0.5 ? me.ml.byId.get('throw_f') || grab : grab, 0); return; }
  }
  if (grab && b.seen && b.seen.guard && o.state === 'idle' && dist > 52 && dist < 130 && rng.random() < 0.2 * P.aggro) {
    b.wantThrow = true; b.mode = { kind: 'walk', dir: 1, until: fight.tick + Math.max(4, Math.ceil((dist - 44) / RULES.WALK_F)) }; return;
  }
  /* a bomb on the other fighter is a clock for the one who put it there */
  const det = me.ml.list.find(m => m.detonate);
  if (det && hasStatus(o, 'bomb') && rng.random() < 0.5) { startPlan(b, det, 0); return; }

  /* what it can tell of the other fighter's stance is what it saw a moment ago */
  b.seenStance = { guard: b.seen ? b.seen.guard : o.guard, crouch: b.seen ? b.seen.crouch : o.crouch };
  const moves = pool(b, gap, dist), strikes = moves.filter(p => p[2]);
  const danger = gap <= quickReach(o.ml) + 2, canHit = strikes.some(p => p[0].reach >= gap - 3);
  const attackP = !canHit ? 0 : danger ? P.aggro : Math.min(0.92, P.aggro + 0.3);
  if (moves.length && rng.random() < attackP + (canHit ? 0 : P.aggro * 0.3)) return attack(b, moves);

  /* not attacking */
  const r = rng.random();
  if (danger) {
    const back = { kind: 'walk', dir: -1, until: fight.tick + rint(rng, 5, 12) };
    b.mode = r < 0.55 ? { kind: 'guard', crouch: lowsAt(o, gap) && rng.random() < 0.4, until: fight.tick + think() } : r < (canHit ? 0.7 : 0.85) ? back : { kind: 'still', until: fight.tick + think() };
    return;
  }
  if (dist > 200 && rng.random() < 0.5) { b.queue = [me.facing > 0 ? BIT.RIGHT : BIT.LEFT, 0, me.facing > 0 ? BIT.RIGHT : BIT.LEFT]; b.restAfter = 6; return; }
  b.mode = r < 0.75 ? { kind: 'walk', dir: 1, until: fight.tick + rint(rng, 8, 22) } : { kind: 'still', until: fight.tick + think() };
}

function attack(b, moves) {
  const { me, rng, P } = b;
  if (rng.random() < P.error) {
    const any = me.ml.list.filter(m => m.stance === 'stand' && !m.chainOnly && !m.detonate && m.h !== 't');
    startPlan(b, pick(rng, any), 0);
    return;
  }
  const total = moves.reduce((s, p) => s + p[1], 0);
  let roll = rng.random() * total, chosen = moves[0][0];
  for (const [m, w] of moves) { roll -= w; if (roll <= 0) { chosen = m; break; } }
  b.last = chosen.id;
  startPlan(b, chosen, me.ml.chains[chosen.id] && rng.random() < 0.55 ? 1 : 0);
}
