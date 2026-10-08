/* Turning a buffered press into a move, and starting one (spec 4.2). Shared by the stepper (free fighters, dashes, strings) and by the
   knockdown code (a rising kick is a move started from the floor). */

import { dirAt, motionMatch, dirIs } from './input_frames.js';

function stanceOk(m, ctx) { return ctx === 'idle' ? m.stance === 'stand' : ctx === 'dash' ? m.stance === 'run' : ctx === 'down' ? m.stance === 'down' : false; }

function matches(m, st, pp, d, ctx) {
  switch (m.cmd.kind) {
    case 'motion': return motionMatch(st, pp.idx, m.cmd.motion);
    case 'dir': return dirIs(d, m.cmd.dir);
    case 'dash': return ctx === 'dash';
    case 'plain': return true;
    default: return false;
  }
}

/* the move a press means for this fighter right now, or null (the most specific command wins: the lists are sorted that way) */
export function pickMove(f, pp, ctx) {
  const st = f.inp, d = dirAt(st, pp.idx);
  const tries = [pp.buttons];
  if (pp.buttons & (pp.buttons - 1)) [16, 32, 64, 128].forEach(b => { if (pp.buttons & b) tries.push(b); });
  for (let k = 0; k < tries.length; k++) {
    const list = f.ml.byButtons[tries[k]];
    if (!list) continue;
    for (let j = 0; j < list.length; j++) {
      const m = list[j];
      if (stanceOk(m, ctx) && matches(m, st, pp, d, ctx)) return m;
    }
  }
  return null;
}

export function startMove(fight, f, o, m) {
  f.state = 'attack'; f.move = m; f.mf = 1; f.t = 1;
  f.spent = m.hits.map(() => false); f.connected = false; f.walk = 0; f.guard = false; f.crouch = false;
  f.aim = o.lane; f.lane = o.lane; f.lastMove = m; f.laneMissed = false; f.y = 0; f.vy = 0;
  fight.bus.fire('onSwing', { slot: f.slot, move: m });
  if (m.special) fight.bus.fire('onSpecial', { slot: f.slot, move: m });
}

export function free(f) { f.state = 'idle'; f.move = null; f.mf = 0; f.stun = 0; f.stunKind = null; f.t = 0; f.air = null; }
