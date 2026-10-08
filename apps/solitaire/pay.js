/* What Solitaire pays, as pure functions (scripts/check-sun.mjs holds it to the budget in docs/sun-economy.md).
   A deal takes about ten minutes and is won about one time in four, so it used to pay (40 to 300 SUN for a win and nothing at
   all for the other three) a few hundred SUN an hour, a tenth of what anything else on the machine pays. Now every card that
   gets home pays something as the deal ends (a deal that is won, thrown away for a new one, or left when the window closes), and a
   win pays a good deal more, with a bonus for each move under TIGHT that it was won in. */
export const PER_CARD = 8;            /* SUN for each card that is home in a foundation when the deal ends */
export const WIN_BASE = 1400;         /* SUN for winning at all */
export const TIGHT = 200;             /* moves: a win in fewer than this earns PER_SAVED for each one it is short */
export const PER_SAVED = 8;
export const WIN_FLOOR = 800;

export const cardsPay = n => Math.max(0, n | 0) * PER_CARD;
export const winPay = moves => Math.max(WIN_FLOOR, WIN_BASE + Math.max(0, TIGHT - moves) * PER_SAVED);
/* what a deal pays in the end: the cards that are home, and the win if it was won */
export const dealPay = (cardsHome, moves, won) => cardsPay(cardsHome) + (won ? winPay(moves) : 0);
