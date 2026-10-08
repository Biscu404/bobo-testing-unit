/* JEAN PIERRE POLNAREFF / SILVER CHARIOT — the fencer. The longest reach and the fastest pokes in the game, thrusts that follow a sidestep to one lane, and not much damage in any
   of them. He wins at the tip of the blade and loses if you get inside it. */
import { throws, risers } from './char_common.js';
export default [
  ['jab',      'JAB',             'LP',     'h', 10, 1, 14,  6,  1,  4, 62, 'thrust',     { track: 'far' }],
  ['cross',    'STRAIGHT THRUST', 'RP',     'h', 12, 1, 17,  7, -2,  7, 70, 'thrust',     { track: 'near' }],
  ['kick',     'SNAP KICK',       'LK',     'm', 12, 1, 17,  4, -3,  7, 58, 'frontkick',  {}],
  ['high',     'HIGH KICK',       'RK',     'h', 15, 2, 22,  9, -9, 12, 66, 'roundhouse', { track: 'both', ch: 'launch' }],
  ['lunge',    'LUNGE THRUST',    'f+LP',   'm', 14, 1, 20,  6, -4,  9, 84, 'thrust',     {}],
  ['double',   'DOUBLE THRUST',   'f+RP',   'm', 16, 6, 20,  5, -8, 12, 70, 'thrust',     {juggle: true, hits: [[16, 5], [21, 7]] }],
  ['knee',     'KNEE',            'f+LK',   'm', 15, 1, 22,  4, -8, 10, 48, 'knee',       {}],
  ['heel',     'HEEL FLICK',      'f+RK',   'm', 19, 2, 27, null, -14, 15, 64, 'spinheel', { hit: 'down', track: 'far' }],
  ['parry',    'PARRY JAB',       'b+LP',   'h', 11, 1, 16,  3, -2,  5, 64, 'thrust',     {}],
  ['side',     'SIDE KICK',       'b+RK',   'm', 16, 1, 22,  2, -9, 10, 68, 'sidekick',   {}],
  ['jab_cross',     'JAB, THRUST',        'jab>RP',        'h', 7, 1, 17, 6, -2, 7, 70, 'thrust',    { combo: true, track: 'near' }],
  ['jab_cross_low', 'JAB, THRUST, KICK',  'jab_cross>LK',  'l', 10, 1, 20, 2, -9, 6, 56, 'lowkick',  {}],
  ['cross_kick',    'THRUST, KICK',       'cross>LK',      'm', 9, 1, 20, 4, -6, 8, 58, 'frontkick', {}],
  ['d_jab',    'LOW THRUST',      'd+LP',   'm', 11, 1, 14,  4, -1,  4, 60, 'thrust',     {}],
  ['gut',      'UPPER THRUST',    'd+RP',   'm', 15, 1, 21,  4, -6,  8, 66, 'thrust',     {}],
  ['shin',     'SHIN KICK',       'd+LK',   'l', 14, 1, 18,  3, -8,  6, 56, 'lowkick',    {}],
  ['sweep',    'SWEEP',           'd+RK',   'l', 19, 2, 29, null, -20, 12, 62, 'sweep',    { hit: 'down', track: 'both' }],
  ['upper',    'RISING THRUST',   'df+RP',  'm', 15, 1, 28, null, -13, 13, 60, 'uppercut', { hit: 'launch' }],
  ['riseknee', 'RISING KNEE',     'df+LK',  'm', 17, 1, 25,  2, -11, 10, 48, 'knee',      {juggle: true, ch: 'launch' }],
  ['fleche',   'FLECHE',          'ff+RP',  'm', 17, 2, 26,  6, -12, 12, 96, 'lunge',     { juggle: true }],
  ['hora',     'HORA HORA',       'qcf+LP', 'm', 18, 13, 24, 2, -12, 16, 70, 'barrage',   {juggle: true, hits: [[18, 3], [22, 3], [26, 3], [30, 4]] }],
  ['pierce',   'PIERCE',          'qcf+RP', 'm', 23, 1, 28,  4, -11, 12, 108, 'thrust',   {}],
  ['chariot',  'CHARIOT KICK',    'qcb+RK', 'm', 22, 2, 26, null, -15, 17, 68, 'roundhouse', {juggle: true, hit: 'launch', track: 'both' }],
  ['silver',   'SILVER STRIKE',   'ch+RP',  'm', 25, 1, 30, null, -19, 20, 60, 'uppercut', { hit: 'bounce', splat: true }],
  ...throws(26, 30, 24, 34), ...risers()
];
