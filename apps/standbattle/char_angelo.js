/* ANGELO / AQUA NECKLACE — the zoner. Long limbs, the longest pokes after the fencer's, rocks thrown along the floor and through the air, and a grab that starts him drowning you.
   He wants you at the end of his arms and has little to say once you are on top of him. */
import { throws, risers } from './char_common.js';
export default [
  ['jab',      'JAB',            'LP',     'h', 11, 1, 15,  6,  0,  5, 52, 'jab',        {}],
  ['cross',    'STRAIGHT',       'RP',     'h', 13, 1, 19,  7, -3,  8, 60, 'cross',      {}],
  ['kick',     'LONG KICK',      'LK',     'm', 13, 1, 18,  4, -4,  8, 66, 'frontkick',  {}],
  ['high',     'HIGH SWEEP',     'RK',     'h', 16, 2, 24,  9, -10, 13, 72, 'roundhouse', { track: 'both', ch: 'launch' }],
  ['elbow',    'LONG ELBOW',     'f+LP',   'm', 14, 1, 20,  5, -3,  9, 54, 'elbow',      {}],
  ['whip',     'WHIP PUNCH',     'f+RP',   'm', 17, 2, 25,  9, -9, 15, 68, 'hook',       {juggle: true, track: 'far', splat: true }],
  ['knee',     'SNAP KNEE',      'f+LK',   'm', 15, 1, 22,  4, -8, 10, 52, 'knee',       {}],
  ['scissor',  'SCISSOR KICK',   'f+RK',   'm', 20, 2, 28, null, -14, 17, 70, 'spinheel', { hit: 'down', track: 'near' }],
  ['swat',     'SWAT',           'b+LP',   'h', 12, 1, 17,  4, -2,  6, 56, 'backfist',   {}],
  ['mule',     'MULE KICK',      'b+RK',   'm', 16, 1, 23,  3, -9, 11, 74, 'sidekick',   {}],
  ['jab_cross',     'JAB, STRAIGHT',         'jab>RP',        'h', 8, 1, 18, 6, -2, 7, 60, 'cross',   { combo: true }],
  ['jab_cross_low', 'JAB, STRAIGHT, KICK',   'jab_cross>LK',  'l', 10, 1, 21, 2, -9, 7, 62, 'lowkick', {}],
  ['cross_knee',    'STRAIGHT, KNEE',        'cross>LK',      'm', 10, 1, 21, 4, -7, 9, 52, 'knee',    {}],
  ['d_jab',    'LOW JAB',        'd+LP',   'm', 11, 1, 15,  4, -2,  4, 50, 'jab',        {}],
  ['gut',      'GUT PUNCH',      'd+RP',   'm', 15, 1, 21,  5, -6,  9, 54, 'gutpunch',   {}],
  ['shin',     'SHIN KICK',      'd+LK',   'l', 15, 1, 19,  3, -8,  7, 62, 'lowkick',    {}],
  ['sweep',    'LONG SWEEP',     'd+RK',   'l', 20, 2, 30, null, -21, 13, 70, 'sweep',    { hit: 'down', track: 'both' }],
  ['upper',    'UPPERCUT',       'df+RP',  'm', 16, 1, 29, null, -13, 15, 56, 'uppercut', { hit: 'launch' }],
  ['riseknee', 'RISING KNEE',    'df+LK',  'm', 18, 1, 26,  2, -11, 11, 52, 'knee',      {juggle: true, ch: 'launch' }],
  ['charge',   'LUNGING PUNCH',  'ff+RP',  'm', 19, 2, 25,  7, -10, 14, 72, 'lunge',     { juggle: true }],
  ['rock',     'ROCK TOSS',      'qcf+LP', 'm', 22, 1, 26,  3, -6, 10, 60, 'finger',     { proj: { speed: 3.4, life: 80, r: 12, kind: 'rock' } }],
  ['lowrock',  'ROLLING ROCK',   'qcf+RP', 'l', 24, 1, 28,  2, -8,  9, 60, 'lowkick',    { proj: { speed: 2.6, life: 90, r: 12, kind: 'rock' } }],
  ['aqua',     'AQUA NECKLACE',  'qcb+LP+RP', 't', 13, 1, 36, null, 0, 18, 30, 'throw',  { brk: 'ANY', status: { id: 'drown', stacks: 2 } }],
  ['rake',     'RAKING KICK',    'qcb+RK', 'm', 21, 2, 26, null, -15, 17, 72, 'roundhouse', {juggle: true, hit: 'launch', track: 'both' }],
  ['blast',    'WATER BLAST',    'ch+RP',  'm', 25, 1, 30, null, -20, 22, 62, 'uppercut', { hit: 'bounce', splat: true }],
  ...throws(26, 30, 24, 34), ...risers()
];
