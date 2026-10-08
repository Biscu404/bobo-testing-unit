/* STAND BATTLE ARENA's trophies (docs/achievements/games-2.md). Data only: trophies_bridge.js is what watches a fight through the hook bus, read-only, and tells the ledger what happened.
   Events: fight-end { won, enemy, mode, tier, mirror, secs, rounds, lostRound, hpLeft, damageTaken, maxCombo, breaks, dodges, throws, counters, splats, bounces, specials, who, shake, pad },
   round-end { won, draw, lost, how, secs, hpLeft, full, ring }, combo { hits, dmg, juggles }, throw, throw-break, dodge, counter, special, status { id }, detonate { who }, launch { kind }, bounce,
   wall-splat, roll, final-round, ladder-clear { char, tier, continues, secs, score }, timeattack-clear { char, secs }, survival-end { wins }, hiscore { rank }, training-open, record-play,
   movelist-open, versus, rebind, debug-on. Sets: cleared (the fighters whose ladder has been cleared), won_with (the fighters a match has been won with). The game keeps nothing between
   fights that makes a fighter stronger: these are the machine's, and none of them changes a fight. */
import { t, secret, rule } from '../trophy_kit.js';
const on = rule.on;
const win = f => p => p.won && f(p);

export const TROPHIES = [
  t('sb_first', 'FIRST MATCH WON', 'B', 'P', 'Win a match in any mode.', on('fight-end', p => p.won)),
  t('sb_round', 'ROUND ONE', 'B', 'P', 'Win a round.', on('round-end', p => p.won)),
  t('sb_arcade', 'ARCADE: CLEARED', 'S', 'P', 'Clear the arcade ladder with any fighter.', on('ladder-clear', () => true)),
  t('sb_boss', 'KILLER QUEEN, STOPPED', 'S', 'P', 'Defeat the boss at the end of the arcade ladder.', on('fight-end', win(p => p.enemy === 'boss' && p.mode === 'arcade'))),
  t('sb_all5', 'FIVE LADDERS', 'G', 'P', 'Clear the arcade ladder with each of the five fighters.', rule.sets('cleared', 5)),
  t('sb_each', 'ONE OF EACH', 'S', 'E', 'Win a match with each of the five fighters.', rule.sets('won_with', 5)),
  t('sb_hard', 'HARD, AND STILL STANDING', 'G', 'S', 'Clear the arcade ladder on HARD.', on('ladder-clear', p => p.tier === 'hard')),
  t('sb_nocont', 'NO CONTINUES', 'S', 'S', 'Clear the arcade ladder without using a continue.', on('ladder-clear', p => p.continues === 0)),
  t('sb_flawless', 'FLAWLESS ROUND', 'S', 'S', 'Win a round without taking any damage.', on('round-end', p => p.won && p.full)),
  t('sb_perfect', 'PERFECT MATCH', 'G', 'S', 'Win a match without losing a round or taking any damage.', on('fight-end', win(p => p.damageTaken === 0 && !p.lostRound)), { scope: 'fight' }),
  t('sb_throw', 'GOT YOU', 'B', 'E', 'Land a throw.', on('throw', () => true)),
  t('sb_break', 'NOT TODAY', 'B', 'S', 'Break a throw.', on('throw-break', () => true)),
  t('sb_break5', 'THE TECH MASTER', 'S', 'S', 'Break five throws in one match.', on('fight-end', p => p.breaks >= 5), { scope: 'fight' }),
  t('sb_dodge', 'SIDESTEP', 'B', 'S', 'Make an attack miss by sidestepping.', on('dodge', () => true)),
  t('sb_dodge10', 'THE LANE IS A WEAPON', 'S', 'S', 'Make ten attacks miss by sidestepping in one match.', on('fight-end', p => p.dodges >= 10), { scope: 'fight' }),
  t('sb_counter', 'COUNTER HIT', 'B', 'S', 'Land a counter hit.', on('counter', () => true)),
  t('sb_combo5', 'FIVE AND COUNTING', 'B', 'S', 'Land a combo of five hits.', on('combo', p => p.hits >= 5)),
  t('sb_combo6', 'SIX-HIT COMBO', 'S', 'S', 'Land a combo of six hits.', on('combo', p => p.hits >= 6)),
  t('sb_launch', 'UP IN THE AIR', 'B', 'E', 'Launch a fighter into the air.', on('launch', p => p.kind === 'launch')),
  t('sb_juggle', 'JUGGLER', 'S', 'S', 'Land a combo with at least three juggle hits after a launch.', on('combo', p => p.juggles >= 3)),
  t('sb_bounce', 'BOUNCE HOUSE', 'S', 'E', 'Bounce a fighter off the floor.', on('bounce', () => true)),
  t('sb_splat', 'WALL SPLAT', 'B', 'E', 'Pin a fighter to the wall.', on('wall-splat', () => true)),
  t('sb_ring', 'RING OUT', 'S', 'E', 'Win a round by ring-out.', on('round-end', p => p.won && p.ring)),
  t('sb_ringed', 'OVER THE EDGE', 'B', 'J', 'Lose a round by ring-out.', on('round-end', p => p.lost && p.ring)),
  t('sb_draw', 'A DRAW IS A WIN FOR BOTH', 'B', 'J', 'End a round in a draw.', on('round-end', p => p.draw)),
  t('sb_final', 'THE FINAL ROUND', 'S', 'E', 'Fight a final round after two drawn rounds.', on('final-round', () => true)),
  t('sb_time', 'THE CLOCK RUNS OUT', 'B', 'E', 'Win a round on time.', on('round-end', p => p.won && p.how === 'time')),
  t('sb_bomb', 'IT WAS A BOMB ALL ALONG', 'S', 'E', 'Blow up a bomb with Kira\'s DETONATE.', on('detonate', p => p.who === 'kira')),
  t('sb_drown', 'AQUA NECKLACE', 'B', 'E', 'Land Angelo\'s AQUA NECKLACE grab.', on('status', p => p.id === 'drown')),
  t('sb_special', 'SPECIAL DELIVERY', 'B', 'E', 'Land a special move that needs a motion input.', on('special', () => true)),
  t('sb_roll', 'ROLL WITH IT', 'B', 'S', 'Get up from a knockdown with a roll.', on('roll', () => true)),
  t('sb_surv5', 'FIVE AT A TIME', 'S', 'P', 'Win five fights in a row in Survival.', on('survival-end', p => p.wins >= 5)),
  t('sb_surv12', 'IRON MAN', 'G', 'P', 'Win twelve fights in a row in Survival.', on('survival-end', p => p.wins >= 12)),
  t('sb_ta', 'AGAINST THE CLOCK', 'S', 'P', 'Clear Time Attack.', on('timeattack-clear', () => true)),
  t('sb_tafast', 'FIVE IN FOUR', 'G', 'S', 'Clear Time Attack in under four minutes.', on('timeattack-clear', p => p.secs < 240)),
  t('sb_train', 'IN THE LAB', 'B', 'E', 'Open training mode.', on('training-open', () => true)),
  t('sb_tape', 'TAPE IT, LOOP IT', 'B', 'C', 'Record the dummy in training and play it back.', on('record-play', () => true)),
  t('sb_list', 'READ THE MOVE LIST', 'B', 'E', 'Open the move list.', on('movelist-open', () => true)),
  t('sb_versus', 'TWO PEOPLE, ONE KEYBOARD', 'B', 'E', 'Start a two-player versus match.', on('versus', () => true)),
  t('sb_hiscore', 'YOUR INITIALS', 'B', 'P', 'Enter your initials in the high-score table.', on('hiscore', () => true)),
  t('sb_mirror', 'THE OTHER YOU', 'B', 'E', 'Beat your own fighter in the ladder\'s mirror match.', on('fight-end', win(p => p.mirror && p.mode === 'arcade'))),
  t('sb_rebind', 'MY KEYS', 'B', 'C', 'Change a key binding.', on('rebind', () => true)),
  t('sb_pad', 'PAD, NOT PAPER', 'B', 'C', 'Win a match with a gamepad plugged in.', on('fight-end', win(p => p.pad))),
  t('sb_shake', 'A STEADY CAMERA', 'B', 'C', 'Turn SHAKE off and win a match.', on('fight-end', win(p => p.shake === false))),
  t('sb_debug', 'HITBOX VISION', 'B', 'J', 'Switch on the BOXES overlay.', on('debug-on', () => true)),
  secret('sb_za', 'ZA WARUDO', 'G', 'S', 'Some rounds are over before anyone has had time to think.', 'Win a round in under fifteen seconds.', on('round-end', p => p.won && p.secs < 15)),
  secret('sb_yare', 'YARE YARE DAZE', 'B', 'J', 'Sometimes the only thing left to say is a sigh.', 'Lose a match.', on('fight-end', p => !p.won))
];

/* a ladder cleared on any tier proves the fighters it went through, and the old game's cleared flag proves the first fights */
export function backfill(read) {
  const m = read('app_standbattle_meta'), ids = [];
  const cleared = m && m.data && m.data.cleared;
  if (cleared === true || (cleared && typeof cleared === 'object' && Object.keys(cleared).length)) ids.push('sb_first', 'sb_arcade', 'sb_round');
  return ids;
}
