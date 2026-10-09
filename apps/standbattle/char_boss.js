/* KILLER QUEEN, the boss — Kira's whole movelist, and two things only he has: SHEER HEART ATTACK, a slow bomb that follows your lane, and BITES THE DUST, a counter that gives a hit back
   to whoever lands one on it. More moves, not more health and not more damage (spec 12): everything he does is on this page, in the open. */
import KIRA from './char_kira.js';
export default [
  ...KIRA,
  ['sha',  'SHEER HEART ATTACK', 'qcf+LK', 'm', 30, 1, 32, 4, -9, 18, 60, 'finger', { proj: { speed: 1.5, life: 200, r: 16, kind: 'bomb', homing: true } }],
  ['btd',  'BITES THE DUST',     'qcb+LK', 'm', 26, 1, 30, -2, -14, 14, 56, 'finger', { rev: { from: 8, to: 24, dmg: 30 } }]
];
