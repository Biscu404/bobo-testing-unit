/* JOTARO KUJO / STAR PLATINUM — the brawler. Big mids, strong throws, the Stand lends a hand on the heavy ones. Few moves track a sidestep, so he is
   beaten by patience and by the lane; he wins by being first to the next exchange.
   [id, name, command, height, startup, active, recovery, onHit, onBlock, damage, reach, anim, extras]  — see moves.js.  null on hit = it launches/knocks down. */
export default [
  /* standing */
  ['jab',       'JAB',             'LP',     'h', 10, 1, 14,  8,   1,  6, 46, 'jab',        { combo: true }],
  ['cross',     'STRAIGHT',        'RP',     'h', 12, 1, 18,  7,  -3,  9, 54, 'cross',      {}],
  ['snap',      'FRONT SNAP',      'LK',     'm', 13, 1, 17,  4,  -4,  8, 58, 'frontkick',  {}],
  ['high',      'HIGH ROUNDHOUSE', 'RK',     'h', 15, 2, 22, 10,  -9, 14, 66, 'roundhouse', { track: 'both', ch: 'launch' }],
  /* forward */
  ['elbow',     'STAR ELBOW',      'f+LP',   'm', 14, 1, 19,  6,  -3, 10, 50, 'elbow',      {}],
  ['drive',     'DRIVE PUNCH',     'f+RP',   'm', 16, 2, 24, 11, -10, 18, 58, 'hook',       { stand: true, splat: true, push: [16, 18] }],
  ['knee',      'KNEE LIFT',       'f+LK',   'm', 15, 1, 22,  5,  -8, 12, 48, 'knee',       {}],
  ['heel',      'SPINNING HEEL',   'f+RK',   'm', 20, 2, 26, null, -14, 20, 64, 'spinheel', { hit: 'down', track: 'near' }],
  /* back */
  ['backfist',  'BACKFIST',        'b+LP',   'h', 12, 1, 17,  5,  -3,  8, 52, 'backfist',   { track: 'far' }],
  ['sidekick',  'SIDE KICK',       'b+RK',   'm', 16, 1, 22,  3,  -9, 12, 70, 'sidekick',   {}],
  /* strings */
  ['jab_cross',    'JAB, STRAIGHT',         'jab>RP',        'h',  7, 1, 17,  7,  -3,  8, 54, 'cross',   { combo: true }],
  ['jab_cross_lk', 'JAB, STRAIGHT, KICK',   'jab_cross>LK',  'l', 10, 1, 20,  2, -10,  7, 56, 'lowkick', {}],
  ['cross_knee',   'STRAIGHT, KNEE',        'cross>LK',      'm',  9, 1, 20,  4,  -7, 10, 50, 'knee',    {}],
  /* crouching */
  ['d_jab',     'LOW JAB',         'd+LP',   'm', 11, 1, 14,  5,  -2,  5, 44, 'jab',        {}],
  ['gut',       'GUT PUNCH',       'd+RP',   'm', 14, 1, 20,  4,  -6,  9, 50, 'gutpunch',   {}],
  ['shin',      'SHIN KICK',       'd+LK',   'l', 14, 1, 18,  3,  -9,  7, 56, 'lowkick',    {}],
  ['sweep',     'SWEEP',           'd+RK',   'l', 19, 2, 30, null, -21, 14, 66, 'sweep',    { hit: 'down', track: 'both' }],
  /* launchers */
  ['upper',     'STAR UPPERCUT',   'df+RP',  'm', 15, 1, 28, null, -13, 16, 54, 'uppercut', { hit: 'launch', stand: true }],
  ['riseknee',  'RISING KNEE',     'df+LK',  'm', 17, 1, 26,  2, -11, 12, 50, 'knee',       { ch: 'launch' }],
  /* run */
  ['dashpunch', 'ORA CHARGE',      'ff+RP',  'm', 18, 2, 24,  8, -10, 16, 66, 'lunge',      { stand: true }],
  /* specials */
  ['finger',    'STAR FINGER',     'qcf+LP', 'm', 20, 1, 24,  4,  -9, 12, 96, 'finger',     { stand: true }],
  ['barrage',   'ORA BARRAGE',     'qcf+RP', 'm', 16, 17, 22,  3, -12, 22, 60, 'barrage',   { stand: true, hits: [[16, 4], [20, 4], [24, 4], [28, 4], [32, 6]] }],
  ['crash',     'STAR CRASH',      'qcb+RK', 'm', 22, 2, 26, null, -16, 20, 68, 'roundhouse', { hit: 'launch', track: 'both' }],
  ['breaker',   'STAR BREAKER',    'ch+RP',  'm', 26, 1, 30, null, -20, 26, 56, 'uppercut',  { hit: 'bounce', stand: true, splat: true }],
  /* throws */
  ['throw',     'STAR THROW',      'LP+RP',   't', 12, 1, 34, null, 0, 30, 28, 'throw',     { brk: 'LP' }],
  ['throw_f',   'HAMMER THROW',    'f+LP+RP', 't', 12, 1, 36, null, 0, 34, 28, 'throw',     { brk: 'RP' }],
  ['throw_b',   'REAR THROW',      'b+LP+RP', 't', 14, 1, 30, null, 0, 28, 28, 'throw',     { brk: 'ANY' }],
  /* off the floor */
  ['rise_lo',   'RISING LOW KICK', 'LK',     'l', 16, 1, 22,  2, -12,  8, 54, 'lowkick',    { stance: 'down' }],
  ['rise_mid',  'RISING KICK',     'RK',     'm', 18, 1, 24,  3, -10, 10, 60, 'frontkick',  { stance: 'down' }]
];
