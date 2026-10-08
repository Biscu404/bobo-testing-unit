/* LEAGUE SOLITAIRE's trophies (docs/achievements/games-1.md). Data only; the calls are in trophy_calls.js, which index.js uses. Events: win { moves, redeals, secs, auto, back, firstLane },
   move { n }, auto-ready, cascade. Counter wins; set firstLane (the lane that finished first in a win), set backs (the card backs won with); streak wins (a deal thrown away is a break). */
import { t, rule, stat } from '../trophy_kit.js';
const on = rule.on;

export const TROPHIES = [
  t('sol_first', 'FIRST BLOOD', 'B', 'P', 'Win a game of Solitaire.', on('win')),
  t('sol_iron', 'IRON', 'B', 'P', 'Win 3 games.', rule.stat('wins', 3)),
  t('sol_gold', 'GOLD', 'S', 'P', 'Win 15 games.', rule.stat('wins', 15)),
  t('sol_chall', 'CHALLENGER', 'G', 'P', 'Win 40 games.', rule.stat('wins', 40)),
  t('sol_tight', 'TIGHT MACRO', 'S', 'S', 'Win in 120 moves or fewer.', on('win', p => p.moves <= 120), { scope: 'deal' }),
  t('sol_clean', 'CLEAN MACRO', 'G', 'S', 'Win in 100 moves or fewer.', on('win', p => p.moves <= 100), { scope: 'deal' }),
  t('sol_onepass', 'ONE PASS', 'S', 'S', 'Win without ever recycling the waste pile.', on('win', p => p.redeals === 0), { scope: 'deal' }),
  t('sol_flash', 'FLASH', 'S', 'S', 'Win in under three minutes.', on('win', p => p.secs < 180), { scope: 'deal' }),
  t('sol_team', 'TEAMFIGHT', 'B', 'S', 'Move a run of five or more cards in one drag.', on('move', p => p.n >= 5)),
  t('sol_spree', 'KILLING SPREE', 'S', 'S', 'Win three deals in a row (a deal you throw away breaks it).', rule.streak('wins', 3)),
  t('sol_lane', 'CHOOSE YOUR LANE', 'S', 'C', 'Win four deals, finishing a different lane (MID, BOT, TOP, SUPPORT) first in each.', rule.sets('firstLane', 4)),
  t('sol_skins', 'THREE SKINS', 'B', 'C', 'Win once with each card back: HEXTECH, SILK and RUNE.', rule.sets('backs', 3)),
  t('sol_auto', 'INEVITABLE', 'B', 'E', 'Get the board to where SEND THEM ALL HOME appears.', on('auto-ready')),
  t('sol_bounce', 'THE LONG BOUNCE', 'B', 'J', 'Watch the victory cascade until the last card has left the table.', on('cascade'))
];

/* a winning player's save: games won and the fewest moves it ever took */
export function backfill(read) {
  const s = read('templeos.solitaire'), ids = [];
  if (!s) return ids;
  const w = s.won || 0;
  if (w >= 1) ids.push('sol_first'); if (w >= 3) ids.push('sol_iron'); if (w >= 15) ids.push('sol_gold'); if (w >= 40) ids.push('sol_chall');
  if (s.bestMoves > 0 && s.bestMoves <= 120) ids.push('sol_tight'); if (s.bestMoves > 0 && s.bestMoves <= 100) ids.push('sol_clean');
  if (w > 0) ids.push(stat('solitaire', 'wins', w));
  return ids;
}
