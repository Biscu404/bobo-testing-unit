/* The CPU's difficulty is these numbers and the seeded dice, and nothing else (spec 12): how stale its view of you is, how often it errs, how often it takes a punish that is
   there, how often it breaks a throw or steps a linear attack, how long a route it will try, and how much it advances. No health, damage or speed multiplier exists for it. */

export const TIERS = {
  easy:   { reaction: 30, error: 0.24,  punish: 0.20, tech: 0.05, step: 0.05, combo: 2,  aggro: 0.35, think: [30, 70] },
  normal: { reaction: 24, error: 0.16,  punish: 0.35, tech: 0.20, step: 0.10, combo: 2,  aggro: 0.50, think: [16, 50] },
  hard:   { reaction: 18, error: 0.10,  punish: 0.55, tech: 0.35, step: 0.20, combo: 3,  aggro: 0.55, think: [12, 40] }
};
/* what the top of a ladder reaches: the next tier up (hard goes on to a player who has played many fighting games) */
const TOP = { easy: TIERS.normal, normal: TIERS.hard, hard: { reaction: 10, error: 0.04, punish: 0.9, tech: 0.7, step: 0.45, combo: 8, aggro: 0.65, think: [4, 16] } };
/* a person at human pace, for the budget bot (budget_bot.js): the middle of the scale, which is where NORMAL's last fight and HARD's first one sit */
export const HUMAN = { reaction: 18, error: 0.10, punish: 0.55, tech: 0.35, step: 0.20, combo: 3, aggro: 0.55, think: [12, 40] };

/* a player who has not played a fighting game, and one who has played many (the budget bot reports both beside HUMAN, so the band can be read as a range) */
export const NOVICE = TIERS.normal;
export const SKILLED = { reaction: 12, error: 0.05, punish: 0.85, tech: 0.65, step: 0.40, combo: 8, aggro: 0.6, think: [6, 20] };

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => ({
  reaction: Math.round(lerp(a.reaction, b.reaction, t)), error: lerp(a.error, b.error, t), punish: lerp(a.punish, b.punish, t), tech: lerp(a.tech, b.tech, t),
  step: lerp(a.step, b.step, t), combo: Math.round(lerp(a.combo, b.combo, t)), aggro: lerp(a.aggro, b.aggro, t), think: [Math.round(lerp(a.think[0], b.think[0], t)), Math.round(lerp(a.think[1], b.think[1], t))]
});
const unit = t => Math.max(0, Math.min(1, t));

/* the profile for fight `n` (0-based) of a ladder of `of` fights: the tier's own at the first, the next tier's at the last */
export function ladderProfile(tier, n, of) {
  return mix(TIERS[tier] || TIERS.normal, TOP[tier] || TOP.normal, of <= 1 ? 0 : unit(n / (of - 1)));
}
/* survival and time attack are about lasting and about the clock, not about the CPU: survival climbs from EASY to the top of HARD over twenty wins,
   time attack from EASY to NORMAL over its five fights, whatever the arcade tier is (the tier only scales the score) */
export function survivalProfile(wins) {
  return wins < 7 ? mix(TIERS.easy, TIERS.normal, wins / 7) : wins < 14 ? mix(TIERS.normal, TIERS.hard, (wins - 7) / 7) : mix(TIERS.hard, TOP.hard, unit((wins - 14) / 8));
}
export const timeAttackProfile = (n, of) => ladderProfile('easy', n, of);
export const profileOf = (tier, n, of) => (tier === 'human' ? HUMAN : ladderProfile(tier, n || 0, of || 1));
