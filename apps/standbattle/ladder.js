/* The arcade ladder (spec 11.3): six fights. The four other fighters in rising order of danger, your own fighter as a mirror, and the boss. Stages go round the four places of Morioh; the boss is always at the store. */
import { PLAYABLE } from './roster.js';
import { STAGE_IDS } from './stages.js';

/* the order the others are met in: easiest to hardest to read */
const RANK = ['delinquent', 'angelo', 'kira', 'polnareff', 'jotaro'];
export const MIRROR_TINT = '#FF6B9E';
export const LADDER_LENGTH = 6;

export function ladderFor(charId) {
  const others = RANK.filter(id => id !== charId && PLAYABLE.indexOf(id) >= 0);
  const rows = others.map(id => ({ id }));
  rows.push({ id: charId, mirror: true });
  rows.push({ id: 'boss', boss: true });
  return rows.map((r, i) => Object.assign(r, { stage: r.boss ? 'store' : STAGE_IDS[i % 3] }));
}
