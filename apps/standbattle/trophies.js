/* STAND BATTLE ARENA's trophies (docs/achievements/games-2.md). Data only: trophies_bridge.js is what watches a fight through the hook bus, read-only, and tells the ledger what happened.
   Events: fight-end { won, enemy, node, modifier, shake, secs, hpLeft, damageTaken, maxCombo, maxMomentum, dodges, perfectClashes, staggers, guardHits, guardBroke, moveTypes[], finishedBy },
   phase, perfect, event-choice { pet, buff }, run-end { cleared, buffs[] }, debug-on. Set: buffs (the three run buffs each given at least once). The game keeps nothing between runs and the
   trophies are the machine's, not the game's: its "zero meta-progression" rule is about the fighter, and none of this changes a fight. */
import { t, secret, rule } from '../trophy_kit.js';
const on = rule.on;
const win = f => p => p.won && f(p);

export const TROPHIES = [
  t('sb_first', 'STAR PLATINUM, ATTACK', 'B', 'P', 'Win a fight.', on('fight-end', p => p.won)),
  t('sb_angelo', 'ANGELO DOWN', 'B', 'P', 'Defeat ANGELO in BUDOGAOKA PARK.', on('fight-end', win(p => p.enemy === 'angelo'))),
  t('sb_queen', 'KILLER QUEEN, STOPPED', 'S', 'P', 'Defeat Killer Queen and clear Act 1.', on('run-end', p => p.cleared)),
  t('sb_phase', 'I JUST WANT TO LIVE QUIETLY', 'B', 'P', 'Push Killer Queen into his second phase.', on('phase')),
  t('sb_untouch', 'UNTOUCHABLE', 'S', 'S', 'Win a fight without taking damage.', on('fight-end', win(p => p.damageTaken === 0)), { scope: 'fight' }),
  t('sb_scratch', 'NOT A SCRATCH', 'G', 'S', 'Defeat Killer Queen without taking damage.', on('fight-end', win(p => p.enemy === 'killer_queen' && p.damageTaken === 0)), { scope: 'fight' }),
  t('sb_aggr', 'TOO FAST TO HIT', 'S', 'S', 'Win the SHOPPING STREET fight (the aggressive one) without taking damage.', on('fight-end', win(p => p.modifier === 'aggressive' && p.damageTaken === 0)), { scope: 'fight' }),
  t('sb_perfect', 'ORA, NOT TODAY', 'S', 'S', 'Land a Perfect Clash.', on('perfect')),
  t('sb_perfect3', 'FRAME PERFECT', 'G', 'S', 'Land three Perfect Clashes in one fight.', on('fight-end', p => p.perfectClashes >= 3), { scope: 'fight' }),
  t('sb_step', 'STEP STEP', 'S', 'S', 'Dodge ten attacks with Step in one fight.', on('fight-end', p => p.dodges >= 10), { scope: 'fight' }),
  t('sb_poise', 'BREAK THEIR POISE', 'B', 'S', 'Stagger an enemy three times in one fight.', on('fight-end', p => p.staggers >= 3), { scope: 'fight' }),
  t('sb_guard', 'BRICK WALL', 'S', 'S', 'Absorb eight hits with Guard in one fight without a guard break.', on('fight-end', p => p.guardHits >= 8 && !p.guardBroke), { scope: 'fight' }),
  t('sb_momentum', 'FULL MOMENTUM', 'B', 'S', 'Fill the Momentum bar to 100.', on('fight-end', p => p.maxMomentum >= 100), { scope: 'fight' }),
  t('sb_combo', 'ORA ORA ORA, TWENTY', 'S', 'S', 'Land a 20-hit combo (hits less than a second apart, with nothing landing on you in between).', on('fight-end', p => p.maxCombo >= 20), { scope: 'fight' }),
  t('sb_rush', 'ORA ORA ORA ORA', 'B', 'S', 'Defeat an enemy with the Stand Rush.', on('fight-end', win(p => p.finishedBy === 'rush')), { scope: 'fight' }),
  t('sb_stand', 'STAND PROUD', 'S', 'S', 'Win a fight with 10 HP or less left.', on('fight-end', win(p => p.hpLeft <= 10)), { scope: 'fight' }),
  t('sb_za', 'ZA WARUDO', 'G', 'S', 'Defeat a DELINQUENT in under five seconds.', on('fight-end', win(p => p.enemy === 'morioh_thug' && p.secs < 5)), { scope: 'fight' }),
  t('sb_bare', 'BARE KNUCKLES', 'G', 'S', 'Clear Act 1 without taking a buff: walk away from the cat.', on('run-end', p => p.cleared && p.buffs.length === 0), { scope: 'run' }),
  t('sb_jab', 'JUST THE JAB', 'S', 'C', 'Win a fight against a DELINQUENT using only JABs.', on('fight-end', win(p => p.enemy === 'morioh_thug' && p.moveTypes.length === 1 && p.moveTypes[0] === 'light')), { scope: 'fight' }),
  t('sb_gifts', 'THREE GIFTS FROM THE ALLEY', 'S', 'E', 'Be given each of the three run buffs, over any number of runs.', rule.sets('buffs', 3)),
  secret('sb_cat', 'THE CAT HAS A PAW OF METAL', 'B', 'E', 'A cat in a quiet street is not what it seems.', 'Pet the cat.', on('event-choice', p => p.pet)),
  t('sb_shake', 'A STEADY CAMERA', 'B', 'C', 'Turn SHAKE off and win a fight.', on('fight-end', win(p => p.shake === false))),
  t('sb_debug', 'HITBOX VISION', 'B', 'J', 'Switch on the DEBUG overlay.', on('debug-on')),
  secret('sb_yare', 'YARE YARE DAZE', 'B', 'J', 'Sometimes the only thing left to say is a sigh.', 'Lose a fight.', on('fight-end', p => !p.won))
];

/* a cleared Act 1 proves the fights up to and including the boss */
export function backfill(read) {
  const m = read('app_standbattle_meta'), ids = [];
  if (m && m.data && m.data.cleared) ids.push('sb_first', 'sb_angelo', 'sb_queen', 'sb_phase');
  return ids;
}
