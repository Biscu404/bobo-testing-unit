/* node scripts/check-sun.mjs -- the SUN budget (pure Node). docs/sun-economy.md says what it is and why; this holds every game to it.
   Each game gets a *model of an hour of playing it* (the assumptions are written next to the numbers, and they are the part to argue with),
   run through the game's real tables (the pay.js / levels.js / data.js it pays from, never a copy), and the answer has to sit in the band.
   A game that is changed so that it pays ten times what it did, or a tenth, fails here before anybody finds out by playing it.
   The garden is the machine's engine and is held by apps/garden/garden_check.js (99,999 SUN in 15 minutes to 2.8 hours depending on how
   equipped the player is and how often they visit); everything else is here. */
import { dealPay, winPay, cardsPay } from '../apps/solitaire/pay.js';
import { LEVELS, rate, payout, secs } from '../apps/aftere/levels.js';
import { totalPay, benchPay } from '../apps/cook/pay.js';
import { achSun } from '../apps/magen/pay.js';
import { MG_ACH } from '../apps/magen/data.js';
import { questSun, HOUSE_SUN, LOFT_SUN } from '../apps/bekkedal/pay.js';
import { BEK_QUESTS } from '../apps/bekkedal/data.js';
import { fightSun, RUN_CLEAR } from '../apps/standbattle/pay.js';
import { classicPay, roomPay, parOf, SUN_PER_GEO } from '../apps/sweeper/pay.js';
import { CLASSIC, NODES } from '../apps/sweeper/data.js';
import * as COS from '../kernel/cos_data.js';

let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };
const rows = [];
const row = (app, model, perHour, lo, hi) => {
  rows.push([app, model, Math.round(perHour)]);
  ok(perHour >= lo && perHour <= hi, app + ': ' + Math.round(perHour) + ' SUN an hour (' + model + ') is outside ' + lo + ' to ' + hi);
};

/* ---- the bands: an hour of active play, in SUN. The floor is what makes a game worth the hour at all, the ceiling is what keeps the
   shop (about 96,000 SUN of things that are not the 99,999 frame) from being bought in an afternoon by whichever game is easiest. ---- */
const LO = 1500, HI = 12000;

/* SOLITAIRE: a deal is ten minutes, won one time in four in about 150 moves; a lost deal is thrown away with about fourteen cards home. */
{
  const win = dealPay(52, 150, true), lost = dealPay(14, 180, false), perDeal = 0.25 * win + 0.75 * lost;
  row('SOLITAIRE', 'a deal every 10 min, 1 in 4 won in 150 moves, 14 cards home otherwise', perDeal * 6, 2500, 6000);
  ok(winPay(150) > 5 * cardsPay(14), 'SOLITAIRE: a win is worth far more than a pile of cards that did not get there');
}

/* AFTEREGYPT: a player flies the dearest way they can clear about as often as they fail it, collecting half the coins. The rate is
   what a clear is worth a minute of flying; `rate` is held to climb by apps/aftere/aftere_check.js. */
{
  const success = { pilgrim: 1, scribe: 0.9, priest: 0.75, pharaoh: 0.5, temple: 0.15 };      /* of attempts, for someone who plays that way at all */
  LEVELS.forEach(L => {
    const perMin = rate(L) * success[L.id];
    row('AFTEREGYPT ' + L.name, 'flown back to back, cleared ' + Math.round(success[L.id] * 100) + '% of the time', perMin * 60, L.id === 'pilgrim' ? 1500 : 2000, 9000);
  });
  const first = LEVELS.reduce((n, L) => n + L.first, 0);
  ok(first > 1500 && first < 3500, 'AFTEREGYPT: the first-clear prizes of the ladder are ' + first + ' SUN, a few thousand, once');
  const perfect = payout(LEVELS[4], { won: true, coins: 40, hits: 0 }, true);
  ok(perfect.total > LEVELS[4].pay * 2, 'AFTEREGYPT: a first, flawless clear of the temple is worth well over a plain one (' + perfect.total + ')');
  ok(secs(LEVELS[0]) < 25, 'AFTEREGYPT: a PILGRIM flight is under 25 s, so it is not the thing to farm');
}

/* THE COOK: every medal of every bench, once, over about three and a half hours of puzzles. */
{
  const all = totalPay([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  row('THE COOK', 'all eleven benches, three medals each, once, in 3.5 hours', all / 3.5, 1500, 3500);
  ok(benchPay(1, 7) > 0 && benchPay(11, 7) > benchPay(1, 7) && benchPay(3, 0) === 0, 'THE COOK: later benches pay more, and a medal already earned pays nothing');
}

/* MAGEN: ninety-eight mitzvot over an idle game that is looked at for about six hours before most of them are in. */
{
  const all = MG_ACH.reduce((n, a) => n + achSun(a), 0);
  row('MAGEN', MG_ACH.length + ' mitzvot, all of them, in 6 hours of attention (' + all + ' SUN)', all / 6, 1500, 5000);
}

/* BEKKEDAL: the seven requests of the board, the house and the loft, over a run of eight real hours. (The board's repeatable requests are on top.) */
{
  const q = BEK_QUESTS.reduce((n, x) => n + questSun(x.kr), 0), all = q + HOUSE_SUN + LOFT_SUN;
  row('BEKKEDAL', BEK_QUESTS.length + ' requests (' + q + '), the house (' + HOUSE_SUN + ') and the loft (' + LOFT_SUN + '), in 8 hours', all / 8, 1500, 3500);
  ok(LOFT_SUN > HOUSE_SUN && HOUSE_SUN > questSun(1000), 'BEKKEDAL: the loft pays more than the house, the house more than any one request');
}

/* STAND BATTLE: a run of Act 1 is a thug, an aggressive thug, Angelo and Kira, a quarter of an hour, cleared one time in two; a fight won
   without being touched is half as much again; a fight lost pays nothing. */
{
  const clear = fightSun('morioh_thug', false, false) + fightSun('morioh_thug', true, false) + fightSun('angelo', false, false) + fightSun('killer_queen', false, false) + RUN_CLEAR;
  const flawless = fightSun('morioh_thug', false, true) + fightSun('morioh_thug', true, true) + fightSun('angelo', false, true) + fightSun('killer_queen', false, true) + RUN_CLEAR;
  const lostAtAngelo = fightSun('morioh_thug', false, false) + fightSun('morioh_thug', true, false);
  const perRun = 0.5 * clear + 0.3 * lostAtAngelo + 0.2 * 90;
  row('STAND BATTLE', 'a run every 15 min, cleared half the time (a clear is ' + clear + ', flawless ' + flawless + ')', perRun * 4, 3000, 9000);
}

/* DUNGEON SWEEPER, the plain game: THE HIVE won in about four minutes, one game in two, back to back. The farm factor (pay.js) is in it. */
{
  const hv = CLASSIC.find(l => l.id === 'm'), sh = CLASSIC.find(l => l.id === 'e'), dp = CLASSIC.find(l => l.id === 'h');
  const hour = (lv, secsPerWin, winsPerHour) => { let st = [], sum = 0; for (let i = 0; i < winsPerHour; i++) { const t = i * 3600000 / winsPerHour; sum += classicPay(lv, secsPerWin, st, t).total; st.push(t); } return sum; };
  row('SWEEPER THE HIVE', 'wins 8 of 16 games in an hour, 4 min each', hour(hv, 240, 8), 2000, 6000);
  row('SWEEPER THE DEEP', '5 wins an hour, 10 min each', hour(dp, 600, 5), 2500, 8000);
  row('SWEEPER SHALLOWS', 'an expert: a win every 20 s for an hour (the farm factor is what holds it)', hour(sh, 15, 180), 1000, 5000);
}
/* the campaign: eighteen rooms, a first walk of about four hours, then repeats at 40 % */
{
  let first = 0, again = 0;
  Object.values(NODES).forEach(n => { first += roomPay(n, parOf(n) * 0.8, { first: true }).total; again += roomPay(n, parOf(n) * 0.8, {}).total; });
  row('SWEEPER THE DESCENT', 'a first walk: eighteen rooms and six guardians in 4 hours', first / 4, 2000, 5000);
  row('SWEEPER THE DESCENT AGAIN', 'the same eighteen rooms again in 2.5 hours, at 40 %', again / 2.5, 800, 3000);
  ok(SUN_PER_GEO === 4, 'SWEEPER: four SUN a geo');
}

/* ---- the shop: what there is to buy, and how long it is to buy it ------------------------------------------------------------------ */
{
  let total = 0, frame = 0;
  ['FRAMES', 'LOGOS', 'CURSORS', 'SCHEMES', 'POTS', 'SPECIES', 'WALLS', 'CRAYON', 'GARAGE', 'DRINKS', 'ELEPHANT'].forEach(k => COS[k].forEach(it => { total += it.price || 0; if ((it.price || 0) >= 99999) frame = it.price; }));
  const rest = total - frame, steady = rows.filter(r => /^(SOLITAIRE|THE COOK|MAGEN|BEKKEDAL|STAND BATTLE|SWEEPER THE HIVE)/.test(r[0])).map(r => r[2]);
  const mean = steady.reduce((a, b) => a + b, 0) / steady.length;
  ok(frame === 99999, 'the third temple frame is the 99,999 joke');
  ok(rest > 60000 && rest < 140000, 'the rest of the shelves cost ' + rest + ' SUN');
  console.log('  the shop is ' + total + ' SUN; without the 99,999 frame ' + rest + '; at the mean of the games here (' + Math.round(mean) + ' an hour) the rest is ' + (rest / mean).toFixed(1) + ' hours of play outside the garden');
  ok(rest / mean > 8 && rest / mean < 40, 'the rest of the shop is between 8 and 40 hours of games other than the garden');
}

console.log('\n' + rows.map(r => '  ' + r[0].padEnd(28) + String(r[2]).padStart(7) + ' SUN/hr   ' + r[1]).join('\n'));
console.log(bad ? '\nFAILED ' + bad : '\nok  - the SUN budget holds (' + rows.length + ' models, band ' + LO + ' to ' + HI + ' unless a game says otherwise)');
process.exit(bad ? 1 : 0);
