/* GARDEN — what the model is told about the world, and the saved state it runs on. */
import { SPECIES } from '../../kernel/cos_data.js';
import { ROOM_DEFS } from './rooms.js';
import * as M from './model.js';
import { POTS_PER_ROOM } from './synergy.js';

/* the garden's view of what Dave sells: seeds by id, pots by id, and the pot a room stands in unless it was told another
   (the one equipped in the shop, which previews while the mouse is over a card there) */
export function makeWorld() {
  const Cos = window.Cos;
  const pots = Cos.COS_CATS.pot.list;
  return {
    rooms: ROOM_DEFS,
    species: id => SPECIES.find(s => s.id === id) || null,
    pot: id => pots.find(p => p.id === id) || pots[0],
    get defaultPot() { return Cos.live('pot'); }
  };
}

const sanitizePots = (arr, species, now) => {
  const out = Array.isArray(arr) ? arr.slice(0, POTS_PER_ROOM) : [];
  while (out.length < POTS_PER_ROOM) out.push(null);
  return out.map(p => (!p || !p.sp || !species(p.sp)) ? null : { sp: p.sp, planted: now, watered: 0, grown: 0, acc: 0, tok: 0, ...p });
};

/* a save from any earlier garden loads: the old single rack becomes the yard, and every field added since is filled in */
export async function loadState(ctx, w, now = Date.now()) {
  const saved = await ctx.load('st') || {};
  const st = { active: 0, lastTick: now, planted: 0, ...saved };
  if (!Array.isArray(saved.rooms)) {
    const legacy = Array.isArray(saved.pots) ? saved.pots : [];
    st.rooms = ROOM_DEFS.map((r, i) => ({ unlocked: i === 0, pots: i === 0 ? legacy : [] }));
    delete st.pots;
  }
  while (st.rooms.length < ROOM_DEFS.length) st.rooms.push({ unlocked: false, pots: [] });
  st.rooms.length = ROOM_DEFS.length;
  const owned = window.Cos.owned('pot');
  st.rooms = st.rooms.map((r, i) => ({
    unlocked: i === 0 ? true : !!(r && r.unlocked),
    pot: r && typeof r.pot === 'string' && owned.indexOf(r.pot) >= 0 ? r.pot : null,
    drip: !!(r && r.drip),
    pots: sanitizePots(r && r.pots, w.species, now)
  }));
  const up = saved.up || {};
  st.up = { basket: Math.max(0, Math.min(M.CAPS.length - 1, up.basket | 0)), gather: Math.max(0, Math.min(M.GATHER.length - 1, up.gather | 0)) };
  if (!(st.active >= 0 && st.active < ROOM_DEFS.length) || !st.rooms[st.active].unlocked) st.active = 0;
  return st;
}
