/* AfterEgypt — the five ways across, and what each pays. Content only.
 *
 * PILGRIM is the game as it always was (one gap, always in the middle of the sky, the ship wherever the pointer is) and
 * pays what it always paid. Every tier after it is unlocked by clearing the one before, and each asks for something the
 * last did not:
 *
 *   follow   how fast the ship can chase the pointer, in pixels a frame (PILGRIM: instantly). A pointer that is a hand
 *            tells you where you want to be; this is how long it takes you to get there.
 *   wander   how far one gap's middle may sit from the last one's, as a share of the distance the ship can cover between
 *            two pillars. Always under one, so the way through is always a way you could fly.
 *   wobble   how far a gap's middle swings about its own centre while you approach it, in pixels.
 *   locust / wind / squeeze   the three hazards (sim.js says what each is): the share of frames a locust is loosed, whether
 *            gusts blow, and how far the gaps close in by the end.
 *   coins / ankh   the share of pillars with a coin / an ankh in the doorway (an ankh is a second chance).
 *
 * `pay` is for arriving, `coin` is what each coin is worth, `first` is added the first time, and a clear without a single
 * hit pays a quarter more (`FLAWLESS`). `rate()` is what a clear is worth a minute: it has to climb, and the check holds it to that.
 */
export const FLAWLESS = 0.25;
export const DEAD_SHARE = 0.5;       /* of the coins a run is carrying when it ends in the pillars */
export const FPS = 60;

export const LEVELS = [
  { id: 'pilgrim', name: 'PILGRIM', blurb: 'The way it was. Fly through the gaps.',
    speed: 2.4, goal: 2600, gap: [55, 130], space: 90, follow: Infinity, wander: 0, wobble: 0,
    locust: 0, wind: false, squeeze: 0, coins: 0, ankh: 0, pay: 50, coin: 0, first: 0, centred: true },
  { id: 'scribe', name: 'SCRIBE', blurb: 'The gaps wander and the ship takes a moment to arrive.',
    speed: 3.0, goal: 7200, gap: [48, 104], space: 84, follow: 5.2, wander: 0.55, wobble: 5,
    locust: 0, wind: false, squeeze: 0.1, coins: 0.45, ankh: 0.05, pay: 180, coin: 2, first: 120 },
  { id: 'priest', name: 'PRIEST', blurb: 'Locusts out of the east. Gaps that breathe.',
    speed: 3.5, goal: 12600, gap: [42, 88], space: 80, follow: 4.4, wander: 0.65, wobble: 9,
    locust: 0.006, wind: false, squeeze: 0.18, coins: 0.5, ankh: 0.06, pay: 450, coin: 4, first: 300 },
  { id: 'pharaoh', name: 'PHARAOH', blurb: 'Wind off the dunes, and the sky comes down on you.',
    speed: 4.0, goal: 20400, gap: [36, 74], space: 76, follow: 3.8, wander: 0.72, wobble: 12,
    locust: 0.009, wind: true, squeeze: 0.28, coins: 0.5, ankh: 0.07, pay: 1000, coin: 8, first: 800 },
  { id: 'temple', name: 'THE THIRD TEMPLE', blurb: 'All of it, at once, for two minutes. It is not a joke.',
    speed: 4.6, goal: 33100, gap: [32, 62], space: 72, follow: 3.4, wander: 0.78, wobble: 14,
    locust: 0.012, wind: true, squeeze: 0.36, coins: 0.55, ankh: 0.08, pay: 2500, coin: 14, first: 2500 }
];

export const levelById = id => LEVELS.find(l => l.id === id) || LEVELS[0];

/* seconds a clear takes at full speed */
export const secs = L => L.goal / L.speed / FPS;

/* what a clear is worth a minute, picking up half the coins that are out there: the figure the ladder is held to */
export function rate(L) {
  const coins = L.coin * (L.goal / L.space) * L.coins * 0.5;
  return (L.pay + coins) / (secs(L) / 60);
}

/* { total, base, coins, flawless, first } for a run that has ended. `won`, `coins` (collected), `hits`, and whether this is
   the first time this level has been cleared. */
export function payout(L, run, firstClear) {
  const coins = Math.round(run.coins * L.coin * (run.won ? 1 : DEAD_SHARE));
  if (!run.won) return { total: coins, base: 0, coins, flawless: 0, first: 0 };
  const flawless = run.hits === 0 && L.id !== 'pilgrim' ? Math.round(L.pay * FLAWLESS) : 0;
  const first = firstClear ? L.first : 0;
  return { total: L.pay + coins + flawless + first, base: L.pay, coins, flawless, first };
}
