/* What Dungeon Sweeper pays in SUN, as pure functions (scripts/check-sun.mjs holds it to the budget in docs/sun-economy.md).
   The plain game used to pay 15, 60 and 200 SUN a win (a few hundred SUN an hour) and the campaign paid half a room's geo
   (a handful) and never said so: the panel showed geo and the SUN arrived, unannounced, a second later. Now a win pays
   about 5,000 SUN an hour at the plain game's easy sizes and more as the boards get bigger, a room of the campaign pays four SUN for
   every geo it is worth, and every line of it is on the panel you click through. */
export const CLASSIC_SUN = { e: 80, m: 400, h: 1200 };
export const SUN_PER_GEO = 4;
export const REPEAT = 0.4;                   /* a room you have already cleared pays this share: worth coming back to, not worth farming */
export const FIRST = 100, FIRST_GUARDIAN = 400, FLAWLESS = 0.25;
export const parOf = n => n.c * n.r * 1.2;   /* seconds: the time bonus runs out here */
/* PERFECT is what the Wayward Compass is found by: a room cleared with no larva hatched at all (a shell or a lifeblood mask that took the
   blow does not count: it hatched) and in 0.75 s a tile, the Hollow One's 286 tiles in 215 s. Spells are allowed, and have to be: on the
   later boards a plain solver with no guess wins 17 % of the Moss Warden, 7 % of the Lamplighter, 0.5 % of the Void and none of the Hollow
   One (apps/sweeper/board_check.js measures it), so a perfect clear there is a matter of when to spend soul, and of speed. */
export const PERFECT_PER_CELL = 0.75;
export const perfectPar = n => Math.round(n.c * n.r * PERFECT_PER_CELL);
export const isPerfect = (n, S, secs) => S.hits === 0 && secs <= perfectPar(n);

/* The plain game can be won over and over as fast as the hand can click, so a win pays less for each one of its size already won in
   the last half hour (10 % a win, down to 15 %): a player who wins a few an hour never feels it, one who wins the smallest board every fifteen
   seconds is held to a few thousand SUN an hour, and nobody has to be told to stop. `stamps` are the times (ms) of those wins; `now` is injectable so the check can run an hour of it in a blink. */
export const FARM_WINDOW = 30 * 60 * 1000, FARM_STEP = 0.1, FARM_FLOOR = 0.15, BONUS_FLOOR = 0.25;
export const farmFactor = (stamps, now) => Math.max(FARM_FLOOR, 1 - FARM_STEP * (stamps || []).filter(t => now - t < FARM_WINDOW).length);
export function classicPay(lv, secs, stamps, now) {
  const base = CLASSIC_SUN[lv.id] || lv.pay || 0;
  const bonus = Math.max(0, Math.round(base * (1 - Math.max(secs, lv.par * BONUS_FLOOR) / lv.par)));
  const f = farmFactor(stamps, now == null ? Date.now() : now);
  return { base, bonus, factor: f, total: Math.round((base + bonus) * f) };
}
/* a room of the campaign: o = { first, flawless, sprint, greed }; every part of it is a line on the panel */
export function roomPay(n, secs, o) {
  o = o || {};
  const share = o.first ? 1 : REPEAT;
  const base = Math.round(n.geo * SUN_PER_GEO * share);
  let bonus = Math.max(0, Math.round(n.geo * SUN_PER_GEO * 0.5 * (1 - secs / parOf(n)))) * (o.sprint ? 2 : 1);
  bonus = Math.round(bonus * share);
  const greed = o.greed ? Math.round((base + bonus) * 0.3) : 0;
  const flawless = o.flawless ? Math.round(n.geo * SUN_PER_GEO * FLAWLESS * share) : 0;
  const first = o.first ? (n.boss ? FIRST_GUARDIAN : FIRST) : 0;
  return { base, bonus, greed, flawless, first, total: base + bonus + greed + flawless + first };
}
