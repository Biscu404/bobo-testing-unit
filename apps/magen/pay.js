/* What Magen pays in SUN for a mitzvah you complete by playing. SUN is a real-money analogue, orthogonal to mitzvot (the game's own
   currency), so even the two that are "worth nothing" pay a little. Everything else scales with how hard the threshold really is: log2
   for the small everyday milestones (clicks, ownership, golden stars), log10 for the thresholds that run from 1 up past a septillion.
   The whole ladder is three times what it was (about 15,000 SUN for all ninety-eight, over days of a game that mostly plays
   itself): docs/sun-economy.md, held by scripts/check-sun.mjs. */
export const ACH_SCALE = 3;
export function achSun(a) {
  if (a.worth0) return 5;
  let n;
  switch (a.t) {
    case 'total':
    case 'mps':
      n = Math.max(15, Math.round(15 + Math.log10(Math.max(1, a.v)) * 12)); break;
    case 'allb':
    case 'dias':
      n = 120; break;
    case 'flag':
      n = 25; break;
    default:
      n = Math.max(5, Math.round(8 + Math.log2(Math.max(1, a.v)) * 6));
  }
  return n * ACH_SCALE;
}
