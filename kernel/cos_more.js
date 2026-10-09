/* DAVE'S SECOND STOCK: a hundred and forty things, every one inspired by this machine or by a game made on it, and not one for sale. Each is `reward: '<trophy id>'` (the same
   mechanism as kernel/cos_rewards.js: dim on the shelf and saying which trophy gives it, owned the moment that trophy is earned, `Cos.grantFor`) and some are also `secret`
   (`???` on the shelf, named in no list, until the trophy is earned). A new thing is one line in its list, and `node scripts/check-dave.mjs` holds it: the trophy is real
   and not the game's own mirror of an achievement, no two share a name, colours are legible, a pointer is a pointer. Merged into the shelves at the bottom of cos_data.js. */
export { FRAMES_M, DECO_M } from './cos_more_frames.js';
export { LOGOS_M } from './cos_more_logos.js';
export { cursorsM } from './cos_more_cursors.js';
export { SCHEMES_M } from './cos_more_schemes.js';
export { DRINKS_M, ELEPHANT_M } from './cos_more_stock.js';
