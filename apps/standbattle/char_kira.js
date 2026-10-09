/* YOSHIKAGE KIRA / KILLER QUEEN — the trickster. The best lows, a mark (TOUCH puts a bomb on the other fighter, DETONATE blows it inside five seconds) and a rush that
   mixes high and low. He wins by making you guess; he loses when you guess right. */
import { throws, risers } from './char_common.js';
export default [
  ['jab',      'JAB',            'LP',     'h', 10, 1, 14,  7,  0,  6, 44, 'jab',        { combo: true }],
  ['slap',     'BACKHAND SLAP',  'RP',     'h', 12, 1, 19, 6, -4, 11, 52, 'hook',       { track: 'far' }],
  ['flick',    'FLICK KICK',     'LK',     'm', 12, 1, 17,  5, -3,  8, 56, 'frontkick',  {}],
  ['high',     'HIGH SWING',     'RK',     'h', 16, 2, 22,  8, -10, 14, 64, 'roundhouse', { track: 'both', ch: 'launch' }],
  ['claw',     'CLAW',           'f+LP',   'm', 13, 1, 18, 8, -2, 12, 50, 'elbow',      {}],
  ['heart',    'HEART PUNCH',    'f+RP',   'm', 17, 2, 25, 10, -11, 22, 56, 'cross',      {juggle: true, splat: true }],
  ['knee',     'KNEE',           'f+LK',   'm', 14, 1, 21,  4, -7, 12, 46, 'knee',       {}],
  ['axe',      'AXE HEEL',       'f+RK',   'm', 21, 2, 27, null, -15, 22, 60, 'spinheel', { hit: 'down', track: 'near' }],
  ['swat',     'SWAT',           'b+LP',   'h', 11, 1, 16,  3, -2,  7, 46, 'backfist',   {}],
  ['hop',      'HOP KICK',       'b+RK',   'm', 17, 1, 22, 2, -10, 14, 68, 'sidekick',   {}],
  ['jab_slap',     'JAB, SLAP',        'jab>RP',      'h', 7, 1, 17, 6, -3, 8, 52, 'hook',     { combo: true }],
  ['jab_slap_low', 'JAB, SLAP, TRIP',  'jab_slap>LK', 'l', 9, 1, 20, 1, -9, 7, 54, 'lowkick',  {}],
  ['slap_knee',    'SLAP, KNEE',       'slap>LK',     'm', 9, 1, 20, 4, -6, 11, 46, 'knee',     {}],
  ['d_jab',    'LOW JAB',        'd+LP',   'm', 11, 1, 14,  4, -1,  5, 42, 'jab',        {}],
  ['gut',      'UPPER SLASH',    'd+RP',   'm', 15, 1, 21,  5, -7, 12, 48, 'gutpunch',   {}],
  ['trip',     'TRIP',           'd+LK',   'l', 14, 1, 17, 5, -6, 10, 58, 'lowkick',    {}],
  ['sweep',    'LOW SWEEP',      'd+RK',   'l', 17, 2, 28, null, -17, 14, 64, 'sweep',    { hit: 'down', track: 'both' }],
  ['slide',    'SLIDE',          'db+LK',  'l', 15, 2, 24, 2, -12, 12, 66, 'lowkick',    {}],
  ['flip',     'FLIP KICK',      'df+RP',  'm', 16, 1, 28, null, -13, 18, 54, 'uppercut', { hit: 'launch' }],
  ['riseknee', 'RISING KNEE',    'df+LK',  'm', 18, 1, 24,  1, -10, 13, 50, 'knee',      {juggle: true, ch: 'launch' }],
  ['dashslash', 'PRESSURE DASH', 'ff+RP',  'm', 19, 2, 24,  7, -9, 17, 64, 'lunge',      { juggle: true }],
  ['touch',    'TOUCH',          'qcf+LP', 'm', 20, 1, 26, 3, -10, 8, 54, 'finger',     { status: { id: 'bomb', stacks: 1 } }],
  ['rush',     'KILLER RUSH',    'qcf+RP', 'm', 17, 13, 24, 2, -11, 19, 58, 'barrage',   {juggle: true, hits: [[17, 4], [21, 4], [25, 4], [29, 6]] }],
  ['detonate', 'DETONATE',       'qcb+LP', 'm', 24, 1, 30, null, -14, 26, 0, 'finger',   { detonate: { dmg: 26 }, hit: 'launch' }],
  ['blast',    'BLAST KICK',     'qcb+RK', 'm', 21, 2, 26, null, -15, 22, 66, 'roundhouse', {juggle: true, hit: 'launch', track: 'both' }],
  ['skull',    'SKULL SMASH',    'ch+RP',  'm', 24, 1, 30, null, -19, 26, 54, 'uppercut', { hit: 'bounce', splat: true }],
  ...throws(30, 34, 28, 34), ...risers()
];
