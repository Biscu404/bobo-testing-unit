/* What the CPU decides when it is free (spec 12). In order: answer what it sees coming (guard at the right height, or step a linear move), punish what it sees
   recovering, carry on a combo it has started, and otherwise play the neutral: wait, walk, poke, mix up. Everything it knows about a move is the row (moves.js): height,
   startup, reach, recovery, advantage. Difficulty enters only as the profile `P` and the seeded dice `rng`. */

import { BIT, RULES } from './rules.js';
import { planInputs } from './input_plan.js';
import { hasStatus } from './status.js';

const H = RULES.HURT_HALF;
const rint = (r, a, b) => a + Math.floor(r.random() * (b - a + 1));
const pick = (r, list) => list[Math.floor(r.random() * list.length)];

/* the move the other fighter is in, as this CPU sees it now (a stale snapshot plus the frames since) */
function threat(b) {
  const { seen, o, P, fight } = b;
  const out = [];
  if (seen && seen.state === 'attack' && seen.moveId) {
    const m = o.ml.byId.get(seen.moveId);
    if (m && !m.proj && !m.detonate) {
      const mf = Math.min(m.total, seen.mf + P.reaction);
      const next = m.hits.find(h => h.f + h.n - 1 >= mf);
      out.push({ m, mf, eta: next ? Math.max(0, next.f - mf) : null, recover: mf > m.last.f + m.last.n - 1, remaining: m.total - mf, last: m.last.f });
    }
  }
  fight.projectiles.forEach(p => {
    if (p.owner === o.slot) { const mm = p.move; out.push({ m: mm, mf: 0, eta: Math.max(0, Math.ceil((Math.abs(p.x - b.me.x) - 27) / p.speed)), recover: false, remaining: 0, last: 0, proj: true }); }
  });
  return out.sort((x, y) => (x.eta == null ? 99 : x.eta) - (y.eta == null ? 99 : y.eta))[0] || null;
}

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

function react(b, th, dist) {
  const { me, rng, P, fight } = b, m = th.m;
  if (th.eta == null || th.eta > 30) return false;
  const lead = m.stance === 'run' ? 40 : 6;
  if (th.proj ? false : dist > m.reach + H + lead) return false;
  if (th.proj && Math.abs(b.o.x - me.x) > 260) return false;
  if (m.h === 't') {
    if (rng.random() < P.step && th.eta >= 5) { b.queue = [me.lane ? BIT.DOWN : BIT.UP, 0]; b.restAfter = 12; return true; }
    return false;
  }
  if (m.track === 'none' && th.eta >= 6 && rng.random() < P.step && b.o.lane === me.lane) { b.queue = [me.lane ? BIT.DOWN : BIT.UP, 0]; b.restAfter = 12; return true; }
  let crouch = m.h === 'l' ? true : m.h === 'h' ? rng.random() < 0.3 : false;
  if (rng.random() < P.error) crouch = !crouch;
  if (rng.random() < P.error * 0.5) return false;
  b.mode = { kind: 'guard', crouch, until: fight.tick + th.eta + Math.max(0, th.last - th.mf) + 8 };
  return true;
}

function punish(b, th, dist) {
  const { me, rng, P } = b;
  if (!th || !th.recover || th.remaining < 10 || th.proj) return false;
  if (rng.random() > P.punish) return false;
  let best = null, score = -1;
  me.ml.list.forEach(m => {
    if (m.stance !== 'stand' || m.chainOnly || m.h === 't' && false) return;
    if (m.detonate || m.proj) return;
    if (m.startup > th.remaining - 1 || m.reach + H + 2 < dist) return;
    const s = m.dmg + (m.launching ? 12 : 0) - m.startup * 0.3;
    if (s > score) { score = s; best = m; }
  });
  if (!best) return false;
  startPlan(b, best, best.combo ? 1 : 0);
  return true;
}

/* where an airborne fighter will be, and when they land, by the same physics the sim runs */
function flight(o, frames) {
  let y = o.y, vy = o.vy, x = o.x, vx = o.vx, g = RULES.GRAVITY * (o.air && o.air.slump ? 2 : 1), t = 0, at = null;
  while (t < 90) {
    vy -= g; y += vy; x += vx; vx *= 0.985; t++;
    if (t === frames) at = { x, y };
    if (y <= 0 && vy < 0) return { land: t, at: at || { x, y: 0 } };
  }
  return { land: 90, at: at || { x, y } };
}

function carryOn(b, dist) {
  const { me, o, P, rng } = b;
  if (o.comboIn.hits >= P.combo) return false;
  let best = null, score = -1;
  if (o.state === 'hitstun' && o.stunKind !== 'break') {
    me.ml.list.forEach(m => {
      if (m.stance !== 'stand' || m.chainOnly || m.detonate || m.proj || m.h === 't') return;
      if (m.startup > o.stun - 1 || m.reach + H + 1 < dist) return;
      const s = m.dmg + (m.launching ? 8 : 0);
      if (s > score) { score = s; best = m; }
    });
  } else if (o.state === 'air' && o.air && !o.air.low) {
    const fl = o.air;
    me.ml.list.forEach(m => {
      if (!m.juggle || m.stance !== 'run' && m.stance !== 'stand' || m.stance === 'run') return;
      const f = flight(o, m.startup);
      if (m.startup + 1 > f.land || Math.abs(f.at.x - me.x) > m.reach + H) return;
      const s = m.dmg;
      if (s > score) { score = s; best = m; }
    });
  }
  if (!best) return false;
  if (rng.random() < P.error * 0.6) return false;
  startPlan(b, best, 0);
  b.restAfter = 0;
  return true;
}

function neutral(b, dist) {
  const { me, o, P, rng, fight } = b;
  const think = () => rint(rng, P.think[0], P.think[1]);
  /* it walked up to grab a guarding fighter: now it is close enough */
  const grab = me.ml.byId.get('throw');
  if (b.wantThrow && grab) {
    b.wantThrow = false;
    if (dist < 54) { startPlan(b, o.guard && rng.random() < 0.5 ? me.ml.byId.get('throw_f') || grab : grab, 0); return; }
  }
  if (grab && o.guard && o.state === 'idle' && dist > 52 && dist < 130 && rng.random() < 0.2 * P.aggro) {
    b.wantThrow = true; b.mode = { kind: 'walk', dir: 1, until: fight.tick + Math.max(4, Math.ceil((dist - 44) / RULES.WALK_F)) }; return;
  }
  /* a bomb on the other fighter is a clock for the one who put it there */
  const det = me.ml.list.find(m => m.detonate);
  if (det && hasStatus(o, 'bomb') && rng.random() < 0.5) { startPlan(b, det, 0); return; }
  /* not every moment is an attack: stand still a little, or give a step back */
  if (rng.random() > P.aggro) {
    const r = rng.random();
    /* with the other fighter close, mostly stand guarded: a CPU that never blocks is no opponent */
    b.mode = dist < 120 && r < 0.5 ? { kind: 'guard', crouch: false, until: fight.tick + think() }
      : r < 0.62 && dist < 90 ? { kind: 'walk', dir: -1, until: fight.tick + rint(rng, 5, 12) } : { kind: 'still', until: fight.tick + think() };
    return;
  }
  const reach = dist - H;
  let pool = [];
  const hasTouch = me.ml.list.find(m => m.status && m.status.id === 'bomb');
  me.ml.list.forEach(m => {
    if (m.stance !== 'stand' || m.chainOnly || m.detonate) return;
    if (m.proj) { if (dist > 100 && dist < 360) pool.push([m, 2.2]); return; }
    if (m.h === 't') { if (dist < 56) pool.push([m, o.guard ? 2.4 : 1.2]); return; }
    if (m.reach + 3 < reach) return;
    let w = m.adv.block >= -3 ? 3 : m.adv.block >= -9 ? 1.8 : 0.7;
    if (m.h === 'l') w *= 0.8;
    if (m.special) w *= 0.7;
    if (m.launching && m.adv.block <= -12) w *= 0.5;
    if (hasTouch === m && !hasStatus(o, 'bomb')) w *= 2;
    if (m.cmd.kind === 'dash') w *= 0.5;
    if (me.ml.chains[m.id]) w *= 1.4;
    if (m.startup <= 12 && dist < 90) w *= 1.6;
    if (b.last === m.id) w *= 0.25;
    /* read the stance it can see: lows and throws beat a standing guard, mids beat a crouching one */
    if (o.guard && !o.crouch && (m.h === 'l' || m.h === 't')) w *= 2.5;
    if (o.crouch && m.h === 'm') w *= 2;
    if (o.crouch && m.h === 'h') w *= 0.3;
    pool.push([m, w]);
  });
  if (!pool.length || (dist > 95 && rng.random() < 0.45)) {
    if (dist > 200 && rng.random() < 0.5) { b.queue = [me.facing > 0 ? BIT.RIGHT : BIT.LEFT, 0, me.facing > 0 ? BIT.RIGHT : BIT.LEFT]; b.restAfter = 6; return; }
    b.mode = { kind: 'walk', dir: 1, until: fight.tick + rint(rng, 8, 22) };
    return;
  }
  if (rng.random() < P.error) { const any = me.ml.list.filter(m => m.stance === 'stand' && !m.chainOnly && !m.detonate && m.h !== 't'); startPlan(b, pick(rng, any), 0); return; }
  const total = pool.reduce((s, p) => s + p[1], 0);
  let roll = rng.random() * total, chosen = pool[0][0];
  for (const [m, w] of pool) { roll -= w; if (roll <= 0) { chosen = m; break; } }
  b.last = chosen.id;
  startPlan(b, chosen, me.ml.chains[chosen.id] && rng.random() < 0.55 ? 1 : 0);
}

export function think(b) {
  const { me, o } = b;
  const dist = Math.abs(o.x - me.x);
  const th = threat(b);
  if (th && react(b, th, dist)) return;
  if (punish(b, th, dist)) return;
  if (carryOn(b, dist)) return;
  neutral(b, dist);
}
