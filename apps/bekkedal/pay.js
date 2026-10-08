/* What Bekkedal pays in SUN (the machine's money, not kroner). The game has its own money and its own long arc, so SUN is for the
   things worth remembering: a request done for a neighbour, the house by the water, the loft. They used to be a sixth of the
   request in kroner (never less than 20 SUN), 500 for the house and 1,000 for the loft, a few thousand SUN for a run of five to
   ten hours; now a request pays 0.6 of its kroner (never less than 120), the house 4,000 and the loft 8,000: docs/sun-economy.md,
   scripts/check-sun.mjs. (Heart events and the loft's wings pay through the trophies, apps/bekkedal/trophies.js.) */
export const QUEST_SHARE = 0.6, QUEST_FLOOR = 120;
export const HOUSE_SUN = 4000, LOFT_SUN = 8000;
export const questSun = kr => Math.max(QUEST_FLOOR, Math.round((kr || 0) * QUEST_SHARE));
