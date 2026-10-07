/* Bekkedal — what has been given to somebody, and when it shows.
 *
 * The record is `S.look[npcId] = { wear: [{ item, glyph }], hold: itemId | null }`, written by exactly one thing: a gift
 * the person did not dislike (`noteGift`). Everything about when it is *seen* is derived (`lookNow`) from the day, the
 * hour, the season and what their hands are doing, and stored nowhere, the way the loft's payouts are: a sweater is worn
 * in the cold and in some of the weather that is not, a cup is in the hand on a break, and neither is a thing that has to
 * be kept in step with the other.
 *
 * Pure. What each item looks like (the table) is `life_data.js`'s LOOKS; how it is drawn is `actors_look.js`.
 */
import { LOOKS, ACT_TOOL } from './life_data.js';
import { hash } from './life.js';

const MAX_WORN = 2;

/* the record after a gift. `tier` is the reaction the gift got: a disliked one is put away and never seen. */
export function noteGift(rec, itemId, tier) {
  const look = LOOKS[itemId];
  if (!look || tier === 'disliked') return rec || null;
  const out = { wear: ((rec && rec.wear) || []).slice(), hold: rec ? rec.hold || null : null };
  if (look.wear) {
    out.wear = out.wear.filter(w => w.glyph !== look.wear && w.item !== itemId);
    out.wear.push({ item: itemId, glyph: look.wear });
    while (out.wear.length > MAX_WORN) out.wear.shift();
  }
  if (look.hold) out.hold = itemId;
  return out;
}

const COLD = { host: true, vinter: true };

/* what to draw on this person now: { wear: [{ glyph, tint }], hold: glyph | null }, or null for nothing
   `act` is what their hands are at (life.js): a person at a chore holds what the chore holds, and one at rest holds
   what they were given. `dark` is 0..1, how dark it is outside. */
export function lookNow(npc, rec, day, minute, season, dark, act) {
  if (!rec) return null;
  const cold = COLD[season] || false, out = { wear: [], hold: null };
  (rec.wear || []).forEach(w => {
    if (w.glyph === 'pendant') { out.wear.push({ glyph: 'pendant' }); return; }
    /* the sweater and the scarf: always in the cold, and on perhaps half the hours of a warm day */
    const share = w.glyph === 'knit' ? 55 : 40;
    if (cold || hash(npc.id, w.item, day, Math.floor(minute / 180)) % 100 < share) out.wear.push({ glyph: w.glyph });
  });
  if (rec.hold) {
    const L = LOOKS[rec.hold];
    const A = act ? ACT_TOOL[act] : null;
    const idle = !A || A.sit || (!A.tool && !A.item);
    /* in the hand when it is free (a break, a sit, a stand), and sometimes when it is not: the person at a chore that
       carries the same thing is carrying theirs */
    const show = (L && L.dark && dark < 0.25) ? false
               : idle ? hash(npc.id, 'hold', day, Math.floor(minute / 120)) % 100 < 80
               : A.item === rec.hold;
    if (show && L) out.hold = L.hold;
  }
  return out.wear.length || out.hold ? out : null;
}

/* the sweater is also the one garment `person()` already knows how to draw as its own thing */
export const wearsKnit = look => !!(look && look.wear.some(w => w.glyph === 'knit'));
