/* Projectiles (spec 13): a move whose row has `proj` throws something instead of touching: it leaves the thrower on the move's hit frame and flies along the lane it was aimed at,
   a rock, a bomb, until it hits, is blocked, flies past the stage or runs out of life. It hits with the move's own height, damage and advantage (the advantage in the table is for a
   contact on the frame it was thrown: one that connects k frames later leaves k more, as with any late hit). A homing one follows the other fighter's lane. */

import { RULES, WORLD } from './rules.js';
import { evalContact, applyContact } from './fight_hit.js';

export function stepProjectiles(fight, live) {
  const P = fight.projectiles;
  for (let k = P.length - 1; k >= 0; k--) {
    const p = P[k], a = fight.fighters[p.owner], d = fight.fighters[1 - p.owner];
    p.x += p.facing * p.speed; p.life--;
    if (p.homing) p.aim = d.lane;
    if (live) {
      const c = evalContact(fight, a, d, p.move, p.i, p);
      if (c) { applyContact(fight, c); P.splice(k, 1); continue; }
    }
    if (p.life <= 0 || p.x < WORLD.MIN - 60 || p.x > WORLD.MAX + 60) P.splice(k, 1);
  }
}
