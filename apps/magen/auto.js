/* The auto-press: holding the left button on the star keeps pressing it, but only once it has been earned and bought.

   It is EARNED by pressing the star yourself a thousand times (S.clicks counts those and nothing else), and BOUGHT in
   six levels from the UPGRADES tab, each a shorter gap between presses. A press it makes is an auto press (S.auto) and
   never a click: the achievements that ask for clicks, and the thousand that unlock it, are only ever paid by a hand.
   PURE: no DOM, no clock; `node apps/magen/auto_check.js` holds it. */
export const AUTO_UNLOCK = 1000;
/* gap: seconds between presses while the button is held. cost: mitzvot. */
export const AUTO_LEVELS = [
  { id: 'au1', n: 'THE PATIENT FINGER',   gap: 0.60, cost: 5e4,
    d: 'You have pressed the star a thousand times by hand. Now it learns to be pressed while you rest your wrist.' },
  { id: 'au2', n: 'TWO HANDS, ONE BEAT',  gap: 0.40, cost: 5e5,
    d: 'One hand keeps the time and the other keeps the place.' },
  { id: 'au3', n: 'THE METRONOME',        gap: 0.25, cost: 5e6,
    d: 'A little weight on a stick, ticking. Every cantor owns one and none will admit it.' },
  { id: 'au4', n: 'DAVENING AT SPEED',    gap: 0.16, cost: 5e7,
    d: 'The words run together and the meaning does not. Both are said to count.' },
  { id: 'au5', n: 'THE LEVITES\' SHIFTS', gap: 0.10, cost: 5e8,
    d: 'Song in the Temple never stopped: one choir went off as the next came on.' },
  { id: 'au6', n: 'THE EVERLASTING FLAME', gap: 0.06, cost: 5e9,
    d: 'Ner tamid. It has been lit since before anybody who is here was born.' }
];
export const autoUnlocked = clicks => clicks >= AUTO_UNLOCK;
/* seconds between presses at a level (0 = not bought: it does not press at all) */
export const autoGap = lvl => (lvl > 0 && lvl <= AUTO_LEVELS.length) ? AUTO_LEVELS[lvl - 1].gap : Infinity;
export const autoRate = lvl => lvl > 0 ? 1 / autoGap(lvl) : 0;
/* the next level on sale, or null: only once earned, and only the one after the level you hold */
export const autoNext = (clicks, lvl) => (autoUnlocked(clicks) && lvl < AUTO_LEVELS.length) ? AUTO_LEVELS[lvl] : null;
/* how many presses a held frame of `step` seconds owes, given the timer left over from the last one */
export function owed(timer, step, gap) {
  let t = timer - step, n = 0;
  while (t <= 0 && n < 4) { n++; t += gap; }
  return { n, timer: Math.max(t, 0.001) };
}
