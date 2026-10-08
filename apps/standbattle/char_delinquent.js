/* THE MORIOH DELINQUENT — rushdown. Fast pokes, a hard low, a headbutt that comes from nowhere and a haymaker that puts you through the wall. Simple to learn and easy to guard
   once you have read it; the whole of his game is getting the first hit and not letting go. */
import { throws, risers } from './char_common.js';
export default [
  ['jab',      'JAB',             'LP',     'h', 10, 1, 14,  8,  1,  6, 44, 'jab',        { combo: true }],
  ['cross',    'STRAIGHT',        'RP',     'h', 11, 1, 18,  9, -2,  9, 50, 'cross',      {}],
  ['kick',     'SNAP KICK',       'LK',     'm', 12, 1, 17,  4, -3,  8, 56, 'frontkick',  {}],
  ['high',     'HIGH KICK',       'RK',     'h', 14, 2, 22,  9, -8, 13, 64, 'roundhouse', { track: 'both', ch: 'launch' }],
  ['headbutt', 'HEADBUTT',        'f+LP',   'm', 15, 1, 22,  8, -6, 14, 38, 'elbow',      {}],
  ['haymaker', 'HAYMAKER',        'f+RP',   'm', 18, 2, 26, 12, -12, 20, 58, 'hook',      {juggle: true, splat: true, push: [16, 18] }],
  ['knee',     'KNEE',            'f+LK',   'm', 14, 1, 21,  5, -7, 11, 46, 'knee',       {}],
  ['dropkick', 'DROP KICK',       'f+RK',   'm', 19, 2, 28, null, -15, 18, 62, 'sidekick', { hit: 'launch' }],
  ['slap',     'SLAP',            'b+LP',   'h', 11, 1, 16,  4, -2,  6, 46, 'backfist',   {}],
  ['mule',     'MULE KICK',       'b+RK',   'm', 16, 1, 22,  3, -9, 12, 68, 'sidekick',   {}],
  ['jab_cross',      'JAB, STRAIGHT',       'jab>RP',       'h', 7, 1, 17, 8, -1, 8, 50, 'cross',    { combo: true }],
  ['jab_cross_hook', 'JAB, STRAIGHT, HOOK', 'jab_cross>LP', 'm', 8, 1, 21, 6, -6, 11, 48, 'hook',    {}],
  ['jab_low',        'JAB, LOW KICK',       'jab>LK',       'l', 10, 1, 19, 3, -8, 7, 56, 'lowkick',  {}],
  ['d_jab',    'LOW JAB',         'd+LP',   'm', 10, 1, 14,  5, -1,  5, 42, 'jab',        {}],
  ['gut',      'GUT PUNCH',       'd+RP',   'm', 14, 1, 20,  5, -5,  9, 48, 'gutpunch',   {}],
  ['shin',     'SHIN KICK',       'd+LK',   'l', 14, 1, 18,  5, -5,  7, 56, 'lowkick',    {}],
  ['sweep',    'SWEEP',           'd+RK',   'l', 18, 2, 27, null, -19, 13, 64, 'sweep',    { hit: 'down', track: 'both' }],
  ['upper',    'UPPERCUT',        'df+RP',  'm', 14, 1, 28, null, -12, 15, 52, 'uppercut', { hit: 'launch' }],
  ['riseknee', 'RISING KNEE',     'df+LK',  'm', 16, 1, 24,  2, -10, 11, 48, 'knee',      {juggle: true, ch: 'launch' }],
  ['charge',   'CHARGING PUNCH',  'ff+RP',  'm', 17, 2, 24,  9, -10, 15, 64, 'lunge',     { juggle: true }],
  ['lunge',    'LUNGE',           'qcf+LP', 'm', 17, 2, 22,  5, -8, 12, 80, 'lunge',      {}],
  ['flurry',   'FLURRY',          'qcf+RP', 'm', 15, 13, 22, 3, -11, 18, 52, 'barrage',   {juggle: true, hits: [[15, 3], [19, 3], [23, 3], [27, 4]] }],
  ['spin',     'SPINNING KICK',   'qcb+RK', 'm', 21, 2, 26, null, -15, 18, 66, 'spinheel', {juggle: true, hit: 'launch', track: 'both' }],
  ['slam',     'HAYMAKER SLAM',   'ch+RP',  'm', 24, 1, 30, null, -19, 22, 56, 'hook',     { hit: 'bounce', splat: true }],
  ...throws(30, 34, 28, 32), ...risers()
];
