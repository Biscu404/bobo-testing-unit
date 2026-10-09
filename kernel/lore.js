/* LORE ACCURATE: the mode in which the first sip of anything with alcohol in it knocks whoever is drinking out. It is earned (pass out five times, and own every bottle there is
   to find: every drink Dave sells and the one a trophy gives, not the ones that are somebody's gift) and then it is a switch in THE BOTTLE. The count of blackouts and the switch
   are kept here (templeos.lore.v1); kernel/drunk.js counts a blackout when the lights go out. Pure but for the storage handed in (node scripts/check-lore.mjs). */
export const NEED_BLACKOUTS = 5;
export const KEY = 'templeos.lore.v1';

/* the bottles that count: every drink that is not a gift (the credits' presents are secrets of their own and need not be found for this) */
export const counts = d => !d.gift;

/* `drinks` is Dave's list (kernel/cos_data.js DRINKS), `has(id)` whether it is owned */
export function status(blackouts, drinks, has) {
  const need = drinks.filter(counts), owned = need.filter(d => has(d.id)).length;
  return { blackouts: Math.min(blackouts, NEED_BLACKOUTS), needBlackouts: NEED_BLACKOUTS, bottles: owned, of: need.length, unlocked: blackouts >= NEED_BLACKOUTS && owned === need.length };
}

export function load(storage) {
  try { const v = JSON.parse(storage.getItem(KEY)); return { blackouts: Math.max(0, Math.floor(+v.blackouts || 0)), on: !!v.on }; } catch (e) { return { blackouts: 0, on: false }; }
}
export function save(storage, st) { try { storage.setItem(KEY, JSON.stringify({ blackouts: st.blackouts, on: !!st.on })); } catch (e) { /* kept for this sitting */ } }
