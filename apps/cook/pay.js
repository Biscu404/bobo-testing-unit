/* What The Cook pays: SUN for each medal of a bench, once (a bench already medalled is a thing to come back to, not a tap to leave
   running). It was 30 + 6 a bench for each of the first two medals and 40 + 8 for the third: about two thousand SUN for the whole of
   it, which is three or four hours of puzzles. Three times that is about 35 SUN a minute of a puzzle, in line with the rest of the
   machine (docs/sun-economy.md, scripts/check-sun.mjs). */
export const MEDAL = { 1: [90, 18], 2: [90, 18], 4: [120, 24] };       /* medal bit: [base, per bench number] */
export const medalPay = (bit, id) => MEDAL[bit][0] + MEDAL[bit][1] * id;
/* what the medals earned for the first time on this bench pay (`fresh` is the bits that are new) */
export const benchPay = (id, fresh) => [1, 2, 4].reduce((n, b) => n + ((fresh & b) ? medalPay(b, id) : 0), 0);
export const totalPay = ids => ids.reduce((n, id) => n + benchPay(id, 7), 0);
