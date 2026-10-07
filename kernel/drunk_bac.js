/* How drunk the machine's owner is, as arithmetic and nothing else.

   A measure is not felt at once, and it is not forgotten at once either. It sits
   in the stomach and arrives in the blood with a time constant of half a minute;
   the body then clears the blood at a steady rate, one measure a minute, however
   much there is. What the screen shows is what is felt: the blood, and half of
   what is still on its way. At LIMIT the lights go.

   So the journey has a shape that no amount of clicking can bend, and it fits in
   one bottle (seventeen measures). The app lets a measure go down about every ten
   seconds at the very quickest (a pour, a drink and a breather), and at that pace
   it is a little under two minutes and thirteen measures to the floor, through
   every stage on the way; anybody who keeps at it, one every twenty seconds or so,
   is out before the bottle is; one measure a minute holds a mild glow indefinitely;
   and stopping lets it drain, slowly. (scripts/check-drunk.mjs holds all of that
   to the numbers.) */
export const BAC = { LIMIT: 9, ABSORB: 30, CLEAR: 60, GUT_FEEL: 0.5, WAKE: 4 };

/* the stages the app can name, by how much of the limit is felt */
export const STAGES = [
  [0.0, 'SOBER'], [0.08, 'WARM'], [0.2, 'TIPSY'], [0.36, 'LOOSE'],
  [0.54, 'SLOSHED'], [0.74, 'HAMMERED'], [0.9, 'ABOUT TO GO']
];

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const newBlood = () => ({ gut: 0, blood: 0 });
/* one measure of Jägermeister; `units` is how many measures of it a drink is worth (a gentler bottle counts for less, a stronger for more, water for none) */
export const swallow = (b, units = 1) => { b.gut += units; };
export function step(b, dt) {
  const a = b.gut * (1 - Math.exp(-dt / BAC.ABSORB));
  b.gut -= a;
  b.blood = Math.max(0, b.blood + a - dt / BAC.CLEAR);
  if (b.gut < 1e-4) b.gut = 0;
}
export const felt = b => b.blood + b.gut * BAC.GUT_FEEL;
export const over = b => felt(b) >= BAC.LIMIT;
/* 0..1, how hard the screen is hit: the early drinks barely show, the late ones do */
export const levelOf = b => clamp(Math.pow(felt(b) / BAC.LIMIT, 0.85), 0, 1);
export function stageOf(b) {
  const f = felt(b) / BAC.LIMIT;
  let name = STAGES[0][1];
  STAGES.forEach(s => { if (f >= s[0]) name = s[1]; });
  return name;
}
/* what is left in the blood when somebody comes round */
export const wake = b => { b.gut = 0; b.blood = BAC.WAKE; };
