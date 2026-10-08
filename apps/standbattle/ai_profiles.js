/* The CPU's difficulty is these numbers and the seeded dice, and nothing else (spec 12): how stale its view of you is, how often it errs, how often it takes a punish that is
   there, how often it breaks a throw or steps a linear attack, how long a route it will try, and how much it advances. No health, damage or speed multiplier exists for it. */

export const TIERS = {
  easy:   { reaction: 24, error: 0.20,  punish: 0.35, tech: 0.10, step: 0.10, combo: 3,  aggro: 0.35, think: [24, 60] },
  normal: { reaction: 15, error: 0.09,  punish: 0.70, tech: 0.45, step: 0.30, combo: 6,  aggro: 0.55, think: [10, 30] },
  hard:   { reaction: 8,  error: 0.025, punish: 0.97, tech: 0.85, step: 0.55, combo: 12, aggro: 0.70, think: [3, 12] }
};
/* what the top of a ladder reaches: the next tier up (hard goes a little beyond itself) */
const TOP = { easy: TIERS.normal, normal: TIERS.hard, hard: { reaction: 6, error: 0.01, punish: 1, tech: 0.95, step: 0.65, combo: 14, aggro: 0.78, think: [2, 8] } };
/* a person at human pace, for the budget bot (budget_bot.js): slower than NORMAL in every number, and it never routes more than three hits */
export const HUMAN = { reaction: 18, error: 0.10, punish: 0.55, tech: 0.35, step: 0.20, combo: 3, aggro: 0.55, think: [12, 40] };

const lerp = (a, b, t) => a + (b - a) * t;

/* the profile for fight `n` (0-based) of a ladder of `of` fights: the tier's own at the first, the next tier's at the last */
export function ladderProfile(tier, n, of) {
  const a = TIERS[tier] || TIERS.normal, b = TOP[tier] || TOP.normal, t = of <= 1 ? 0 : Math.max(0, Math.min(1, n / (of - 1)));
  return {
    reaction: Math.round(lerp(a.reaction, b.reaction, t)), error: lerp(a.error, b.error, t), punish: lerp(a.punish, b.punish, t), tech: lerp(a.tech, b.tech, t),
    step: lerp(a.step, b.step, t), combo: Math.round(lerp(a.combo, b.combo, t)), aggro: lerp(a.aggro, b.aggro, t), think: [Math.round(lerp(a.think[0], b.think[0], t)), Math.round(lerp(a.think[1], b.think[1], t))]
  };
}
export const profileOf = (tier, n, of) => (tier === 'human' ? HUMAN : ladderProfile(tier, n || 0, of || 1));
