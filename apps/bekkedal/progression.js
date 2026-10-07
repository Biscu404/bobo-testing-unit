/* Bekkedal — the money-sink formulas that used to live as closures inside
 * index.js's mount(), pulled out so a check script can read the exact same
 * numbers the game does rather than a second, hand-copied set of them. Pure
 * functions of S throughout, same convention as seasons.js/quests.js.
 */
import { BEK_BARN_SLOTS, BEK_BARN_SLOTS2 } from './data.js';

/* the house itself. Two build paths chosen once (S.flag.build), each with
 * its own kr/tømmer/stein price; S.flag.rabatt2 (Håkon's own fr>=4 discount,
 * skog path only) knocks 2000 kr off. Unchanged by Act II — this is the
 * milestone that unlocks it, not a thing Act II repriced.
 *
 * The kr figures are the last and largest step of Act I's ladder, and they
 * are what sets its length: at the measured ~7 kr per energy and a 200-point
 * bar, a first playthrough clears the pick, the lot and this between day 24
 * and day 37 (act2_check_balance.js). Move either number and that window
 * moves with it. */
export function houseCost(S) {
  const skog = S.flag.build === 'skog';
  let kr = skog ? 42000 : 52000;
  if (S.flag.rabatt2) kr -= 2000;
  return { kr: kr, tommer: skog ? 30 : 12, stein: skog ? 20 : 10 };
}

/* Act II: the one purchasable house upgrade tier, priced under the house
 * itself (a room added to a house you already live in costs less than the
 * house did) but still a real materials-and-kr sink, same shape as
 * houseCost() so hakonBuild() can check it the same way. */
export function houseTierCost() {
  return { kr: 9000, tommer: 10, stein: 8 };
}

/* The single gate hakonTilbygg() (index.js) checks before offering the
 * upgrade — pulled out to a pure predicate so act2_check.js can assert the
 * upgrade is unreachable before act2Unlocked without driving the real UI. */
export function houseTierAvailable(S) {
  return !!S.act2Unlocked && !!S.built && !S.houseTier;
}

/* the pen's capacity, tier1 plus tier2 once S.flag.barn2 is bought — the one
 * place that concatenation happens, so buyAnimal()'s capacity check and the
 * slot a new animal is placed at can never drift from each other. */
export function barnSlots(S) {
  return S.flag.barn2 ? BEK_BARN_SLOTS.concat(BEK_BARN_SLOTS2) : BEK_BARN_SLOTS;
}

/* P20: the greenhouse, priced and gated in the exact shape houseTierCost()/
 * houseTierAvailable() already are above — see BEK_GREENHOUSE_PLOT (data.js)
 * and hakonGreenhouse() (index.js). Independent of S.houseTier: it is its
 * own late unlock, not a second annex. */
export function greenhouseCost() {
  return { kr: 15000, tommer: 20, stein: 15 };
}
export function greenhouseAvailable(S) {
  return !!S.act2Unlocked && !!S.built && !S.flag.greenhouse;
}
