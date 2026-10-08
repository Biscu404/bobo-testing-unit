/* Every number of the fight that is a RULE rather than a move: the input windows, the clocks, the physics.
   docs/stand-battle-tekken-spec.md quotes these; nothing else in the app writes a literal for them.
   Pure data, no imports from the sim, so the sim, the CPU, the HUD and the checks all read one table. */

import { Z_REST, ARENA_MIN, ARENA_MAX } from './arena_bounds.js';

/* the one integer a player is, per frame */
export const BIT = { LEFT: 1, RIGHT: 2, UP: 4, DOWN: 8, LP: 16, RP: 32, LK: 64, RK: 128 };
export const BUTTONS = ['LP', 'RP', 'LK', 'RK'];
export const BTN_MASK = BIT.LP | BIT.RP | BIT.LK | BIT.RK;

export const RULES = {
  HP: 120,
  /* input windows, in sim-clock frames (spec 4.2) */
  BUFFER: 9, SIMUL: 3, TAP: 6, MOTION_WINDOW: 15, MOTION_BUTTON: 6, CHARGE: 36, CHARGE_GAP: 2, CHARGE_RELEASE: 3,
  DASH_WINDOW: 12, DASH_GAP: 6, BREAK: 14,
  /* movement */
  WALK_F: 2.0, WALK_B: 1.5,
  DASH_FRAMES: 18, DASH_DIST: 74, BACKDASH_FRAMES: 22, BACKDASH_DIST: 50,
  SIDESTEP_FLIP: 3, SIDESTEP_FRAMES: 13, LANE_EASE: 8,
  PUSH_W: 26, HURT_HALF: 15, START_GAP: 120, MAX_GAP: 380,
  /* hit reactions */
  COUNTER_DMG: 1.2, COUNTER_STUN: 3,
  SCALING: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3], SCALING_MIN: 0.3, SPLAT_SCALE: 0.8,
  GRAVITY: 0.55, LAUNCH_VY: 9.5, JUGGLE_VY: 5.5, BOUNCE_VY: 6, SLUMP_AFTER: 3, JUGGLE_MAX: 6,
  SPLAT_FRAMES: 34, SPLAT_DIST: 60, SPLAT_DMG: 8, RINGOUT_MARGIN: 24,
  DOWN_FRAMES: 30, RISE_FRAMES: 20, WAKE_QUICK: 34, WAKE_SLOW: 50, ROLL_DIST: 40,
  /* round */
  ROUND_FRAMES: 3600, FINAL_FRAMES: 1800, INTRO_FRAMES: 150, KO_BEAT_FRAMES: 36, KO_SPEED: 0.3, END_FRAMES: 150, WINS: 2,
  KO_HITSTOP: 20
};

/* the two lanes: near is lane 0, far is lane 1 */
export const LANE_Z = [Z_REST - 10, Z_REST + 30];
export const WORLD = { MIN: ARENA_MIN, MAX: ARENA_MAX, MID: (ARENA_MIN + ARENA_MAX) / 2 };

export function hitstopFor(dmg, launch) {
  if (launch) return 12;
  return dmg < 8 ? 6 : dmg < 14 ? 8 : 11;
}
export function scaleFor(n) { return RULES.SCALING[Math.min(n, RULES.SCALING.length - 1)] || RULES.SCALING_MIN; }
