/* Dungeon Sweeper's trophies (docs/achievements/games-1.md, with what the rename and the new rules asked for). Data only; the call sites are in index.js (a win, a loss, a bench, a spell
   learnt, the compass found) and the facts they carry are counters on the run (run.js: flagsPlaced, maskLoss, hits, spells, webBlocks, clicks). Events: win, lose, bench, learn, compass.
   `win` carries { classic, lv, node, secs, par, flags, boss, maskLoss, hits, spells, learnt, hpLeft, mod, mods, act, charms, webBlocks, shadeFound, shards, perfect, owned }. */
import { t, secret, rule } from '../trophy_kit.js';
import { baseCount, CHARMS } from './data.js';
const on = rule.on;
const only = id => p => p.charms && p.charms.length === 1 && p.charms[0] === id;

export const TROPHIES = [
  t('sw_first', 'FIRST BREATH', 'B', 'P', 'Win any game of Dungeon Sweeper.', on('win')),
  t('sw_three', 'ALL THREE DEPTHS', 'S', 'P', 'Win SHALLOWS, THE HIVE and THE DEEP.', rule.sets('wins', 3)),
  t('sw_rooms6', 'CARTOGRAPHER I', 'B', 'P', 'Clear 6 rooms of the campaign.', rule.stat('clearedRooms', 6)),
  t('sw_rooms12', 'CARTOGRAPHER II', 'S', 'P', 'Clear 12 rooms.', rule.stat('clearedRooms', 12)),
  t('sw_rooms18', 'CARTOGRAPHER III', 'G', 'P', 'Clear all 18 rooms.', rule.stat('clearedRooms', 18)),
  t('sw_gate', 'THE FIRST GUARDIAN', 'B', 'P', 'Defeat THE HOLLOW GATE.', on('win', p => p.node === 'gate')),
  t('sw_learn1', 'THE FIRST LESSON', 'B', 'P', 'Learn FOCUS by clearing the Crossway.', on('learn', p => p.kind === 'focus')),
  t('sw_learn2', 'SEEING THROUGH', 'B', 'P', 'Learn SCRY by clearing Green Depths or Fungal Fog.', on('learn', p => p.kind === 'scry')),
  t('sw_learn3', 'THE DEEP DIVE', 'S', 'P', 'Learn DIVE by clearing the City of Rain.', on('learn', p => p.kind === 'dive')),
  t('sw_vessel', 'FULL VESSEL', 'S', 'P', 'Take all four mask shards: nine masks.', on('win', p => p.shards >= 4)),
  t('sw_hollow', 'THE HOLLOW ONE IS STILL', 'G', 'P', 'Defeat THE HOLLOW ONE.', on('win', p => p.node === 'hollow')),
  t('sw_charms', 'WELL DRESSED', 'G', 'P', 'Own all fifteen charms.', on('bench', p => p.owned >= CHARMS.length)),
  t('sw_perfect', 'NOT A LARVA STIRRED', 'B', 'S', 'Clear a campaign room PERFECT: no larva hatched, in under 0.75 s a tile.', on('win', p => p.perfect)),
  t('sw_perfect6', 'SIX PERFECT ROOMS', 'S', 'S', 'Clear six different rooms PERFECT.', rule.sets('perfectRooms', 6)),
  t('sw_compass_found', 'THE WAYWARD COMPASS', 'G', 'S', 'Clear all eighteen rooms PERFECT, and find the Wayward Compass.', on('compass')),
  t('sw_hive3', 'HIVE MIND', 'S', 'S', 'Win THE HIVE three times in a row.', rule.streak('hiveWins', 3)),
  t('sw_deep2', 'DEEP BREATHS', 'G', 'S', 'Win THE DEEP twice in a row.', rule.streak('deepWins', 2)),
  t('sw_par_e', 'QUICK HANDS', 'B', 'S', 'Win SHALLOWS in under 30 seconds (half its par).', on('win', p => p.classic && p.lv === 'e' && p.secs < p.par / 2)),
  t('sw_par_m', 'QUICKER HANDS', 'S', 'S', 'Win THE HIVE in under 2 minutes (half its par).', on('win', p => p.classic && p.lv === 'm' && p.secs < p.par / 2)),
  t('sw_par_h', 'QUICKEST HANDS', 'G', 'S', 'Win THE DEEP in under 5 minutes (half its par).', on('win', p => p.classic && p.lv === 'h' && p.secs < p.par / 2)),
  t('sw_noflag', 'FEEL IT OUT', 'S', 'S', 'Win THE HIVE without placing a flag.', on('win', p => p.classic && p.lv === 'm' && p.flags === 0), { scope: 'run' }),
  t('sw_noflag_deep', 'BLIND FAITH', 'G', 'S', 'Win THE DEEP without placing a flag.', on('win', p => p.classic && p.lv === 'h' && p.flags === 0), { scope: 'run' }),
  t('sw_untouched', 'UNTOUCHED', 'S', 'S', 'Defeat a guardian without losing a mask.', on('win', p => p.boss && p.maskLoss === 0), { scope: 'room' }),
  t('sw_final_clean', 'NOT A MARK ON HIM', 'G', 'S', 'Defeat THE HOLLOW ONE without losing a mask.', on('win', p => p.node === 'hollow' && p.maskLoss === 0), { scope: 'room' }),
  t('sw_soulless', 'NO SOUL SPENT', 'S', 'S', 'Clear a room with FOCUS, SCRY or DIVE learnt and cast none of them.', on('win', p => !p.classic && p.learnt >= 1 && p.spells === 0), { scope: 'room' }),
  t('sw_compass_only', 'COMPASS ONLY', 'G', 'S', 'Defeat a guardian with only the WAYWARD COMPASS equipped.', on('win', p => p.boss && only('compass')(p)), { scope: 'room' }),
  t('sw_thread', 'HANGING BY A THREAD', 'S', 'S', 'Win a campaign room with exactly one mask left.', on('win', p => !p.classic && p.hpLeft === 1), { scope: 'room' }),
  t('sw_dark', 'BY LANTERNLIGHT', 'S', 'S', 'Clear a DARK room (the Deepnest) without losing a mask.', on('win', p => p.mod === 'lantern' && p.maskLoss === 0), { scope: 'room' }),
  t('sw_tangle', 'UNTANGLED', 'B', 'S', 'Clear a WEBBED room without clicking a webbed tile once.', on('win', p => p.mod === 'web' && p.webBlocks === 0), { scope: 'room' }),
  t('sw_mods', 'FOUR WAYS TO BE LOST', 'S', 'E', 'Clear a room under each region rule: BRAMBLE, SPORES, WEBBED, DARK.', rule.sets('mods', 4)),
  t('sw_benches', 'SIT DOWN', 'S', 'E', 'Rest at the bench in all six regions.', rule.sets('benches', 6)),
  t('sw_shade', 'WELCOME BACK', 'B', 'E', 'Die, then win the room where your shade fell and take its geo back.', on('win', p => p.shadeFound)),
  t('sw_builds', 'A CHARM FOR EVERYTHING', 'S', 'C', 'Win a room with each of the fifteen charms equipped, one at a time is fine.', rule.sets('charmWins', CHARMS.length)),
  t('sw_pain', 'PAIN IS A TEACHER', 'S', 'C', 'Win a room with THORNS OF AGONY and GRUBSONG both equipped and two larvae hatched.', on('win', p => p.charms && p.charms.indexOf('thorns') >= 0 && p.charms.indexOf('grubsong') >= 0 && p.hits >= 2), { scope: 'room' }),
  /* ---- the Underdeep: nine rooms under the Hollow One, where a larva costs two masks and nobody gets through bare ---- */
  t('sw_under1', 'THE STAIR BELOW', 'B', 'P', 'Clear THE OSSUARY, the first room of the Underdeep.', on('win', p => p.node === 'ossuary')),
  t('sw_keeper', 'THE ORCHARD KEEPER IS DOWN', 'S', 'P', 'Defeat THE ORCHARD KEEPER.', on('win', p => p.node === 'keeper')),
  t('sw_smith', 'THE LAST SMITH, LAID TO REST', 'S', 'P', 'Defeat THE LAST SMITH.', on('win', p => p.node === 'smith')),
  t('sw_king', 'THE PALE KING IS STILL', 'G', 'P', 'Defeat THE PALE KING.', on('win', p => p.node === 'king')),
  t('sw_under9', 'THE UNDERDEEP, COMPLETE', 'G', 'P', 'Clear all nine rooms of the Underdeep.', rule.stat('underRooms', 9)),
  t('sw_built', 'BUILT FOR IT', 'S', 'C', 'Clear an Underdeep room wearing the IRON WARD, the LIFEBLOOD HEART and the STALWART SHELL together.', on('win', p => p.act === 2 && ['ward', 'lifeblood', 'stalwart'].every(id => p.charms.indexOf(id) >= 0)), { scope: 'room' }),
  t('sw_cold', 'COLD COMFORT', 'S', 'S', 'Clear a COLD room of the Underdeep without losing a mask.', on('win', p => p.act === 2 && p.mods && p.mods.indexOf('cold') >= 0 && p.maskLoss === 0), { scope: 'room' }),
  t('sw_bare_below', 'BARE-HANDED BELOW', 'G', 'S', 'Defeat a guardian of the Underdeep with no charm equipped.', on('win', p => p.act === 2 && p.boss && p.charms.length === 0), { scope: 'room' }),
  t('sw_king_clean', 'PALE AND UNTOUCHED', 'G', 'S', 'Defeat THE PALE KING without losing a mask.', on('win', p => p.node === 'king' && p.maskLoss === 0), { scope: 'room' }),
  secret('sw_rude', 'RUDE AWAKENING', 'B', 'J', 'The hive is not always asleep.', 'Lose on your second click.', on('lose', p => p.clicks === 2))
];

/* what the saves already prove: the plain game's wins, the campaign's rooms and shards and charms */
export function backfill(read) {
  const ids = [], sw = read('templeos.sweeper');
  if (!sw) return ids;
  if (sw.won > 0) ids.push('sw_first');
  const best = sw.best || {}; if (best.e != null && best.m != null && best.h != null) ids.push('sw_three');
  if (best.e != null && best.e < 30) ids.push('sw_par_e');
  const c = sw.camp;
  if (c) {
    const rooms = baseCount(c.cleared);
    if (rooms >= 6) ids.push('sw_rooms6'); if (rooms >= 12) ids.push('sw_rooms12'); if (rooms >= 18) ids.push('sw_rooms18');
    if (c.cleared && c.cleared.gate != null) ids.push('sw_gate');
    if (c.cleared && c.cleared.hollow != null) ids.push('sw_hollow');
    if ((c.shards || 0) >= 4) ids.push('sw_vessel');
    if ((c.owned || []).length >= CHARMS.length) ids.push('sw_charms');
    if (c.cleared && ['stair', 'cistern', 'gate'].every(id => c.cleared[id] != null)) ids.push('sw_learn1');
  }
  return ids;
}
