/* Rows every fighter shares in shape: the three throws and the two kicks from the floor. A fighter's own file spreads these in with its own damage and recovery (the first row of each is the
   damage and the break the fighter gets). Same row format as moves.js. */
export const throws = (d, dF, dB, R) => [
  ['throw',   'THROW',         'LP+RP',   't', 12, 1, R,     null, 0, d,  28, 'throw', { brk: 'LP' }],
  ['throw_f', 'FORWARD THROW', 'f+LP+RP', 't', 12, 1, R + 2, null, 0, dF, 28, 'throw', { brk: 'RP' }],
  ['throw_b', 'REAR THROW',    'b+LP+RP', 't', 14, 1, R - 4, null, 0, dB, 28, 'throw', { brk: 'ANY' }]
];
export const risers = () => [
  ['rise_lo',  'RISING LOW KICK', 'LK', 'l', 16, 1, 22, 2, -12, 8,  54, 'lowkick',   { stance: 'down' }],
  ['rise_mid', 'RISING KICK',     'RK', 'm', 18, 1, 24, 3, -10, 10, 60, 'frontkick', { stance: 'down' }]
];
