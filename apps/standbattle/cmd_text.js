/* How a command and an advantage read on the move list and in the props folder: from the move's row, nowhere else. */

const ARROW = { f: 'F', b: 'B', d: 'D', df: 'D/F', db: 'D/B' };
export const cmdText = m => {
  const c = m.cmd;
  if (c.kind === 'chain') return c.parent.toUpperCase().replace(/_/g, ' ') + ' > ' + btn(c.buttons);
  const b = btn(c.buttons);
  if (c.kind === 'motion') return { qcf: 'QCF', qcb: 'QCB', ch: 'CHARGE B~F' }[c.motion] + '+' + b;
  if (c.kind === 'dash') return 'F,F+' + b;
  return (c.dir ? ARROW[c.dir] + '+' : '') + b;
};
const btn = mask => ['LP', 'RP', 'LK', 'RK'].filter((n, i) => mask & (16 << i)).join('+');
export const advText = v => (v == null ? '--' : v > 0 ? '+' + v : String(v));
