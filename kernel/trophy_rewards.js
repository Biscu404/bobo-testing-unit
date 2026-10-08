/* WHAT THE BIG TROPHIES PAY, AND WHAT ELSE THEY GIVE. Pure data and two small functions (no window, no storage): `node scripts/check-trophies.mjs` holds it.

   A bronze, silver or gold trophy pays 15, 40 or 100 SUN whatever it asked of you (kernel/trophies_core.js). That is right for "win without a hit", and wrong for
   "finish the whole of Bekkedal's storehouse" or "solve all fifty-six puzzles", which are hours, sometimes tens of them. So the completions are listed here with what
   they are worth: a long list in one game a few hundred to a few thousand SUN, finishing a whole thing (the loft, the compass, the ledger) several thousand, the
   whole ledger twenty-five. And a game's MASTERY SEAL, which wants every trophy of that game, pays by how many that is: 500 and a hundred a trophy, to a cap.

   The very biggest also give something a price cannot buy: an item for Dave's shelves that is not for sale (kernel/cos_rewards.js: `reward: '<trophy id>'`), a frame,
   a logo, a pointer, a colour scheme, something for the elephant to wear, a bottle. And a mastery opens a folder on the desktop with that game's own pictures in it
   (kernel/trophy_props.js). `applyRewards(T)` is called once, after every trophy is registered. */
import { FRAMES, LOGOS, CURSORS, SCHEMES, ELEPHANT, DRINKS } from './cos_data.js';

export const COMPLETION = {
  /* the machine */
  sys_bare: 3000, sys_days30: 1500, sys_earned3: 2000, sys_spent3: 2500, sys_rank_top: 250,
  /* Dungeon Sweeper */
  sw_rooms18: 1500, sw_compass_found: 4000, sw_charms: 1000, sw_hollow: 800, sw_final_clean: 600, sw_king: 1500, sw_under9: 3000, sw_king_clean: 2000, sw_bare_below: 1500,
  /* Solitaire, AfterEgypt, the Garden, the Cook, Magen, Stand Battle */
  sol_chall: 800,
  ae_temple: 700, ae_five: 1200, ae_f_temple: 1000, ae_purse: 500,
  gd_herb11: 900, gd_perfect5: 1200, gd_hands: 1500, gd_sun3: 2000,
  ck_knock: 500, ck_oneshot: 500,
  mg_chain60: 500, mg_tree: 700, mg_news: 800, mg_double: 400,
  sb_bare: 700, sb_scratch: 400,
  /* Bekkedal */
  bk_loft: 3000, bk_scenes: 1500, bk_fr8: 1200, bk_fish10: 1000, bk_crops12: 700, bk_legends: 800, bk_mine15: 600, bk_house24: 400, bk_loft100: 1500,
  /* the Bottle, the Elephant, the tools */
  bt_flight9: 1000, bt_dreams: 1000, el_200: 1200, el_wardrobe: 1500, cr_riot: 600, gr_l8: 600, gr_genreall: 1800,
  hc_lesson7: 700, hc_pall: 3000, hc_chapters: 1000, hc_ownall: 3500,
  /* the ledger */
  meta_200: 4000, meta_secret10: 1000, meta_grand: 1500, meta_all: 25000
};

export const MASTERY_BASE = 500, MASTERY_PER = 100, MASTERY_CAP = 8000;
export const masteryPay = n => Math.min(MASTERY_CAP, MASTERY_BASE + MASTERY_PER * n);

/* trophy id -> [{ cat, id, name }]: what Dave's shelves give for it */
export function rewardsByTrophy() {
  const out = {}, lists = { frame: FRAMES, logo: LOGOS, cursor: CURSORS, scheme: SCHEMES, elephant: ELEPHANT, drink: DRINKS };
  Object.keys(lists).forEach(cat => lists[cat].forEach(it => { if (it.reward) (out[it.reward] = out[it.reward] || []).push({ cat: cat, id: it.id, name: it.name }); }));
  return out;
}
export const CAT_NAME = { frame: 'FRAME', logo: 'LOGO', cursor: 'POINTER', scheme: 'SCHEME', elephant: 'ELEPHANT', drink: 'DRINK' };
/* "THE HALO (ELEPHANT)" for the card and the ledger */
export const rewardText = d => (d.reward || []).map(r => r.name + ' (' + CAT_NAME[r.cat] + ')').join(', ');

/* what is for the person who earns it, once every trophy is registered: the pay of the completions and the items on Dave's shelves */
export function applyRewards(T) {
  const missing = [];
  Object.keys(COMPLETION).forEach(id => { const d = T.get(id); if (!d) { missing.push(id); return; } d.pay = COMPLETION[id]; d.epic = true; });
  const items = rewardsByTrophy();
  Object.keys(items).forEach(id => { const d = T.get(id); if (!d) { missing.push(id); return; } d.reward = items[id]; });
  return missing;
}
