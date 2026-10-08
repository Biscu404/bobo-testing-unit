/* What the CPU decides when it is free (spec 12). In order: answer what it sees coming (guard at the right height, or step a linear move), punish what it sees
   recovering, carry on a combo it has started, and otherwise play the neutral: wait, walk, poke, mix up. Everything it knows about a move is the row (moves.js): height,
   startup, reach, recovery, advantage. Difficulty enters only as the profile `P` and the seeded dice `rng`. */

import { BIT, RULES } from './rules.js';
import { H, startPlan } from './ai_plan.js';
import { neutral } from './ai_neutral.js';

/* the move the other fighter is in, as this CPU sees it now (a stale snapshot plus the frames since) */
function threat(b) {
  const { seen, o, P, fight } = b;
  const out = [];
  if (seen && seen.state === 'attack' && seen.moveId) {
    const m = o.ml.byId.get(seen.moveId);
    if (m && !m.proj && !m.detonate) {
      const mf = Math.min(m.total, seen.mf + P.reaction);
      const next = m.hits.find(h => h.f + h.n - 1 >= mf);
      out.push({ m, mf, eta: next ? Math.max(0, next.f - mf) : null, recover: mf > m.last.f + m.last.n - 1, remaining: m.total - mf, last: m.last.f, key: m.id + '@' + (fight.tick - P.reaction - (seen.mf - 1)) });
    }
  }
  fight.projectiles.forEach(p => {
    if (p.owner === o.slot) { const mm = p.move; out.push({ m: mm, mf: 0, eta: Math.max(0, Math.ceil((Math.abs(p.x - b.me.x) - 27) / p.speed)), recover: false, remaining: 0, last: 0, proj: true, key: p }); }
  });
  return out.sort((x, y) => (x.eta == null ? 99 : x.eta) - (y.eta == null ? 99 : y.eta))[0] || null;
}

function react(b, th, dist) {
  const { me, rng, P, fight } = b, m = th.m;
  if (th.eta == null || th.eta > (th.proj ? 60 : 30)) return false;
  const lead = m.stance === 'run' ? 40 : 6;
  if (th.proj ? false : dist > m.reach + H + lead) return false;
  if (th.proj && Math.abs(b.o.x - me.x) > 260) return false;
  /* one decision per threat: the dice are rolled once, not once a frame */
  if (b.decided === th.key) return false;
  b.decided = th.key;
  /* a thing that was thrown: a person steps out of one that flies straight and holds back against one that follows, and never crouches under a mid */
  if (th.proj) {
    if (!m.proj.homing && th.eta >= 8 && rng.random() < P.step * 2 && b.o.lane === me.lane) { b.queue = [me.lane ? BIT.DOWN : BIT.UP, 0]; b.restAfter = 12; return true; }
    b.mode = { kind: 'guard', crouch: rng.random() < P.error, until: fight.tick + 400, react: true, proj: th.key };
    return true;
  }
  if (m.h === 't') {
    if (rng.random() < P.step && th.eta >= 5) { b.queue = [me.lane ? BIT.DOWN : BIT.UP, 0]; b.restAfter = 12; return true; }
    return false;
  }
  if (m.track === 'none' && th.eta >= 6 && rng.random() < P.step && b.o.lane === me.lane) { b.queue = [me.lane ? BIT.DOWN : BIT.UP, 0]; b.restAfter = 12; return true; }
  let crouch = m.h === 'l' ? true : m.h === 'h' ? rng.random() < 0.3 : false;
  if (rng.random() < P.error) crouch = !crouch;
  if (rng.random() < P.error * 0.5) return false;
  b.mode = { kind: 'guard', crouch, until: fight.tick + th.eta + Math.max(0, th.last - th.mf) + 8, react: true };
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

/* asked every free frame, whatever else the CPU is doing (standing still, walking, resting): has something started that it should answer? */
export function alert(b) {
  const th = threat(b);
  return !!th && react(b, th, Math.abs(b.o.x - b.me.x));
}

export function think(b) {
  const { me, o } = b;
  const dist = Math.abs(o.x - me.x);
  const th = threat(b);
  if (punish(b, th, dist)) return;
  if (carryOn(b, dist)) return;
  neutral(b, dist);
}
