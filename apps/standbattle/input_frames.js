/* The input layer of the fight (spec 4): a player is one integer per frame (rules.js BIT). This file turns the stream of integers into what a
   fighter can act on, and it is the only place that knows the windows:

     - a history ring of the last 80 ticks (direction as a numpad digit RELATIVE to facing, buttons held, buttons newly pressed),
     - taps and holds on the vertical (a lone tap is a sidestep, a hold is a crouch),
     - dashes (forward-forward, back-back),
     - the button buffer (a press is good for BUFFER frames, two buttons within SIMUL are one press),
     - motions (quarter-circles, a charge) read from the history, never from key events.

   Windows are measured in the fight's CLOCK (frames that count: hit-stop freezes the clock, the ring keeps recording), so a press made during
   hit-stop is still there when the fighters thaw. Pure: no DOM, no time. */

import { BIT, BTN_MASK, RULES } from './rules.js';

const HIST = 80;

export function createInput() {
  return {
    tick: 0, clock: 0, bits: 0, prev: 0, hist: [], consumed: 0,
    downHeld: 0, downTaint: false, upHeld: 0, upTaint: false, tap: null, crouch: false, dash: 0,
    fwdOn: false, backOn: false, fwdPress: -99, fwdRel: -99, backPress: -99, backRel: -99
  };
}

/* Called once per tick, always (also during hit-stop and the intro), with the facing the fighter has this tick. */
export function pushInput(st, bits, facing, clock) {
  st.prev = st.bits; st.bits = bits; st.tick++; st.clock = clock;
  const fwdBit = facing > 0 ? BIT.RIGHT : BIT.LEFT, backBit = facing > 0 ? BIT.LEFT : BIT.RIGHT;
  const fwd = !!(bits & fwdBit) && !(bits & backBit), back = !!(bits & backBit) && !(bits & fwdBit);
  const dn = !!(bits & BIT.DOWN) && !(bits & BIT.UP), up = !!(bits & BIT.UP) && !(bits & BIT.DOWN);
  const h = fwd ? 6 : back ? 4 : 5;
  const d = dn ? (fwd ? 3 : back ? 1 : 2) : up ? (fwd ? 9 : back ? 7 : 8) : h;
  const press = bits & ~st.prev & BTN_MASK;
  st.hist.push({ i: st.tick, c: clock, d, down: bits & BTN_MASK, press, fwd, back });
  if (st.hist.length > HIST) st.hist.shift();

  /* a lone tap on the vertical is a sidestep; held past TAP it is a crouch (down) */
  st.tap = null;
  const chord = h !== 5 || (bits & BTN_MASK) !== 0;
  const rawDown = !!(bits & BIT.DOWN), rawUp = !!(bits & BIT.UP);
  if (rawDown) { st.downHeld++; if (chord || rawUp) st.downTaint = true; }
  else { if (st.downHeld > 0 && !st.downTaint && st.downHeld <= RULES.TAP) st.tap = 'down'; st.downHeld = 0; st.downTaint = false; }
  if (rawUp) { st.upHeld++; if (chord || rawDown) st.upTaint = true; }
  else { if (st.upHeld > 0 && !st.upTaint && st.upHeld <= RULES.TAP) st.tap = 'up'; st.upHeld = 0; st.upTaint = false; }
  st.crouch = dn && st.downHeld > RULES.TAP;

  /* forward-forward and back-back */
  st.dash = 0;
  if (fwd && !st.fwdOn) {
    if (clock - st.fwdPress <= RULES.DASH_WINDOW && clock - st.fwdRel <= RULES.DASH_GAP && st.fwdRel > st.fwdPress) { st.dash = 1; st.fwdPress = -99; } else st.fwdPress = clock;
  }
  if (!fwd && st.fwdOn) st.fwdRel = clock;
  if (back && !st.backOn) {
    if (clock - st.backPress <= RULES.DASH_WINDOW && clock - st.backRel <= RULES.DASH_GAP && st.backRel > st.backPress) { st.dash = -1; st.backPress = -99; } else st.backPress = clock;
  }
  if (!back && st.backOn) st.backRel = clock;
  st.fwdOn = fwd; st.backOn = back;
}

/* The button press waiting to be used, or null. Presses older than BUFFER clock frames, or already used, are gone. */
export function pendingPress(st) {
  const h = st.hist, minC = st.clock - RULES.BUFFER + 1;
  let idx = -1;
  for (let k = h.length - 1; k >= 0; k--) {
    const e = h[k];
    if (e.c < minC || e.i <= st.consumed) break;
    if (e.press) { idx = k; break; }
  }
  if (idx < 0) return null;
  const c1 = h[idx].c;
  let buttons = h[idx].press;
  for (let k = idx - 1; k >= 0; k--) {
    const e = h[k];
    if (e.c < c1 - RULES.SIMUL + 1 || e.i <= st.consumed) break;
    buttons |= e.press;
  }
  return { buttons, idx, i: h[idx].i, c: c1 };
}
export function consume(st) { st.consumed = st.tick; }

/* the direction at a press, forgiving one frame of letting go just before it */
export function dirAt(st, idx) {
  const h = st.hist;
  let d = h[idx].d;
  if (d === 5 && idx > 0 && h[idx - 1].d !== 5 && h[idx].c - h[idx - 1].c <= 1) d = h[idx - 1].d;
  return d;
}

function runs(st, endIdx) {
  const out = [], h = st.hist;
  for (let k = 0; k <= endIdx; k++) {
    const e = h[k], last = out[out.length - 1];
    if (last && last.d === e.d) last.end = e.c; else out.push({ d: e.d, start: e.c, end: e.c });
  }
  return out;
}
const isFwd = d => d === 6 || d === 3 || d === 9;
const isBack = d => d === 4 || d === 1 || d === 7;

/* kind: 'qcf' (2,3,6), 'qcb' (2,1,4) or 'ch' (hold back CHARGE frames, then forward). `idx` is the press, from pendingPress. */
export function motionMatch(st, idx, kind) {
  const R = runs(st, idx), press = st.hist[idx].c;
  if (kind === 'ch') {
    let f = -1;
    for (let k = R.length - 1; k >= 0; k--) {
      if (isFwd(R[k].d) && press - R[k].start <= RULES.MOTION_BUTTON) { f = k; break; }
      if (press - R[k].end > RULES.MOTION_BUTTON + 4) return false;
    }
    if (f < 1) return false;
    let total = 0, gap = 0, seen = false;
    for (let k = f - 1; k >= 0; k--) {
      const len = R[k].end - R[k].start + 1;
      if (isBack(R[k].d)) {
        if (!seen && R[f].start - R[k].end > RULES.CHARGE_RELEASE + 1) return false;
        seen = true; total += len + gap; gap = 0;
      } else if (!seen) { gap += len; if (gap > RULES.CHARGE_RELEASE) return false; gap = 0; }
      else { gap += len; if (gap > RULES.CHARGE_GAP) break; }
    }
    return seen && total >= RULES.CHARGE;
  }
  const fin = kind === 'qcf' ? 6 : 4, mid = kind === 'qcf' ? 3 : 1;
  let f = -1;
  for (let k = R.length - 1; k >= 0; k--) {
    if (R[k].d === fin) { if (press - R[k].start <= RULES.MOTION_BUTTON) f = k; break; }
    if (press - R[k].end > RULES.MOTION_BUTTON + 6) return false;
  }
  if (f < 1) return false;
  let kd = -1;
  for (let k = f - 1; k >= 0; k--) { if (R[k].d === 2) { kd = k; break; } if (R[f].start - R[k].end > RULES.MOTION_WINDOW) return false; }
  if (kd < 0 || R[f].start - R[kd].start > RULES.MOTION_WINDOW) return false;
  let sawMid = false;
  for (let k = kd + 1; k < f; k++) if (R[k].d === mid) sawMid = true;
  return sawMid || R[f].start - R[kd].end <= 3;
}

/* ---- the command notation of a movelist row ------------------------------------------------------------------------------------------------------
   'LP'  'LP+RP'  'f+LP'  'd+RK'  'df+RP'  'qcf+LP'  'qcb+RK'  'ch+RP' (charge)  'ff+RP' (out of a dash)  'jab>RP' (the follow-up of the move jab) */
export function parseCmd(s) {
  const out = { src: s, kind: 'plain', dir: null, motion: null, buttons: 0, parent: null };
  let rest = s;
  const chain = rest.split('>');
  if (chain.length === 2) { out.kind = 'chain'; out.parent = chain[0]; rest = chain[1]; }
  rest.split('+').forEach(tok => {
    if (BIT[tok] && (BIT[tok] & BTN_MASK)) out.buttons |= BIT[tok];
    else if (tok === 'qcf' || tok === 'qcb' || tok === 'ch') { out.kind = 'motion'; out.motion = tok; }
    else if (tok === 'ff') { out.kind = 'dash'; }
    else if (['f', 'b', 'd', 'df', 'db'].indexOf(tok) >= 0) { if (out.kind === 'plain') out.kind = 'dir'; out.dir = tok; }
    else throw new Error('[input] unknown token "' + tok + '" in "' + s + '"');
  });
  if (!out.buttons) throw new Error('[input] "' + s + '" has no button');
  return out;
}

/* does a numpad direction satisfy a direction token */
export function dirIs(d, tok) {
  switch (tok) {
    case 'f': return d === 6;
    case 'b': return d === 4;
    case 'd': return d === 2 || d === 1;
    case 'df': return d === 3;
    case 'db': return d === 1;
    default: return true;
  }
}
