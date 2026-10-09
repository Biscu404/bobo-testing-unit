/* The inputs that perform a move, as the integers a player would produce, one per frame (spec 4). The CPU, the training dummy and the checks all ask
   for a move this way, so the command a row names is the command the sim reads and nothing is typed twice. `facing` is +1 when the fighter looks right. */

import { BIT } from './rules.js';

export function planInputs(m, facing) {
  const F = facing > 0 ? BIT.RIGHT : BIT.LEFT, B = facing > 0 ? BIT.LEFT : BIT.RIGHT, D = BIT.DOWN;
  const btn = m.cmd.buttons;
  const c = m.cmd;
  if (c.kind === 'motion') {
    if (c.motion === 'qcf') return [D, D | F, F, F | btn];
    if (c.motion === 'qcb') return [D, D | B, B, B | btn];
    return new Array(40).fill(B).concat([F | btn]);
  }
  if (c.kind === 'dash') return [F, 0, F, 0, 0, 0, btn];
  const dir = { f: F, b: B, d: D, df: D | F, db: D | B }[c.dir] || 0;
  return [dir | btn];
}

/* how many frames of input before the move's frame 1 (the press frame is frame 1) */
export function leadFrames(m) { return planInputs(m, 1).length - 1; }
