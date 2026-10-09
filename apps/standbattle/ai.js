/* The CPU (spec 12). It is a player: every frame it produces the one integer a keyboard would, from the same movelist and the same frame data a human has, and it
   sees only what a human sees -- positions, the other fighter's state and the move and frame it is in -- and only as it was `reaction` frames ago.

   `bits()` is asked once per sim frame. A decision (ai_think.js) fills `queue` with the inputs of a move (input_plan.js, the very inputs the checks use) or sets a `mode`
   (hold guard, walk). Being hit throws the plan away. Breaking a throw and the wake-up choice are decided here, once each. */

import { BIT, RULES } from './rules.js';
import { think, alert } from './ai_think.js';

const ABORT = { hitstun: 1, blockstun: 1, air: 1, down: 1, thrown: 1, wake: 1, roll: 1, ko: 1 };

function snap(o) { return { x: o.x, lane: o.lane, state: o.state, moveId: o.move ? o.move.id : null, mf: o.mf, crouch: o.crouch, guard: o.guard, y: o.y }; }

export function createAI(fight, slot, profile, rng) {
  const me = fight.fighters[slot], o = fight.fighters[1 - slot], r = rng || fight.rng.stream('ai' + slot);
  const b = { fight, me, o, P: profile, rng: r, hist: [], seen: null, queue: [], mode: null, rest: 0, tech: null, wake: null, slot };
  const back = () => (me.facing > 0 ? BIT.LEFT : BIT.RIGHT), fwd = () => (me.facing > 0 ? BIT.RIGHT : BIT.LEFT);
  return {
    profile, brain: b,
    bits() {
      b.hist.push(snap(o));
      if (b.hist.length > profile.reaction + 2) b.hist.shift();
      b.seen = b.hist[Math.max(0, b.hist.length - 1 - profile.reaction)];
      if (fight.phase !== 'fight') { b.queue.length = 0; b.mode = null; b.rest = 20; return 0; }
      const st = me.state;
      /* grabbed: break it, if this CPU is going to and has seen it in time */
      if (st === 'thrown') {
        if (b.tech === null) b.tech = r.random() < profile.tech && profile.reaction <= RULES.BREAK - 3;
        if (b.tech && me.t >= profile.reaction) { b.tech = false; return me.throwMove.throw.brk === 'RP' ? BIT.RP : BIT.LP; }
        return 0;
      }
      b.tech = null;
      if (st === 'down') {
        if (me.t > RULES.DOWN_FRAMES) {
          if (!b.wake) { const d = r.random(); b.wake = d < 0.4 ? { bits: 0, n: 1 } : d < 0.6 ? { bits: fwd(), n: 3 } : d < 0.75 ? { bits: back(), n: 3 } : d < 0.9 ? { bits: me.lane ? BIT.DOWN : BIT.UP, n: 3 } : { bits: r.random() < 0.5 ? BIT.LK : BIT.RK, n: 2 }; }
          if (b.wake.n-- > 0) return b.wake.bits;
        }
        return 0;
      }
      b.wake = null;
      if (ABORT[st]) {
        b.queue.length = 0;
        if (st === 'blockstun' && b.mode && b.mode.kind === 'guard') return back() | (b.mode.crouch ? BIT.DOWN : 0);
        if (st !== 'blockstun') b.mode = null;
        return 0;
      }
      if (b.queue.length) { const v = b.queue.shift(); if (!b.queue.length) b.rest = b.restAfter || 0; return v; }
      if (st === 'idle') {
        if (!(b.mode && b.mode.react) && alert(b) && b.queue.length) return b.queue.shift();
        if (b.mode) {
          if (fight.tick >= b.mode.until || (b.mode.proj && fight.projectiles.indexOf(b.mode.proj) < 0)) b.mode = null;
          else if (b.mode.kind === 'guard') return back() | (b.mode.crouch ? BIT.DOWN : 0);
          else if (b.mode.kind === 'walk') return b.mode.dir > 0 ? fwd() : back();
          else return 0;
        }
        const hot = o.comboIn.active && (o.state === 'air' || o.state === 'hitstun');
        if (b.rest > 0 && !hot) { b.rest--; return 0; }
        think(b);
        if (b.queue.length) return b.queue.shift();
        if (b.mode && b.mode.kind === 'guard') return back() | (b.mode.crouch ? BIT.DOWN : 0);
        if (b.mode && b.mode.kind === 'walk') return b.mode.dir > 0 ? fwd() : back();
      }
      return 0;
    }
  };
}
