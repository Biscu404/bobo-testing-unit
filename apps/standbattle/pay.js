/* What the arena pays in SUN. It paid nothing, which made it the one game on the machine that a person could spend a quarter of an
   hour on and come away from with nothing to show for it on ACCOUNT.EXE. "Zero meta-progression" is a rule about the game (nothing
   carries between runs: no unlocks, no stats), and SUN is the machine's money, not the game's, so this changes nothing it promised.
   A won fight pays by who was in it; a fight won without being touched pays half as much again; clearing Act 1 pays a bonus on top
   (docs/sun-economy.md, scripts/check-sun.mjs). Nothing is paid for a fight lost. */
export const FIGHT = { morioh_thug: 90, angelo: 300, killer_queen: 800 };
export const AGGRESSIVE = 1.6;          /* the SHOPPING STREET thug moves faster and hits harder */
export const FLAWLESS = 0.5;
export const RUN_CLEAR = 500;
export function fightSun(enemyId, aggressive, flawless) {
  const base = (FIGHT[enemyId] || 90) * (aggressive ? AGGRESSIVE : 1);
  return Math.round(base * (1 + (flawless ? FLAWLESS : 0)));
}
