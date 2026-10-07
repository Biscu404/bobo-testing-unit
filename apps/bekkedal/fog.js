/* Bekkedal — fog is banks of mist, not a texture.
 *
 * It used to be one ordered stipple of grey laid over the whole picture at a fixed strength, which is a screen door: every
 * pixel of the valley, grass and roof and the walls of a house alike, behind the same regular grid of dots. Waking to it
 * (the weather is rolled when the day turns over) looked like the ground textures had broken out over the whole screen.
 *
 * Mist has a shape. The picture is cut into square blocks and each is stippled at a strength taken from two octaves of
 * smooth value noise that drifts slowly, so the valley is thicker here and thinner there and the banks move. Still only
 * the ordered dither the rest of the machine blends with (no alpha): the blocks are a whole number of dither tiles
 * and the pattern origin is the canvas's, so two neighbours of the same strength join without a seam, and a level step is
 * one sixteenth of coverage, which is below what the eye takes for an edge.
 *
 * Pure: `fogLevel(bx, by, t)` is the strength (0..FOG_MAX, of 16) of block (bx, by) `t` seconds in. `fog_check.js` holds
 * it to its numbers.
 */
export const FOG_BLOCK = 16;      /* screen pixels; two dither tiles at the art scale */
export const FOG_MIN = 1, FOG_MAX = 6;

const hash = (x, y) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = f => f * f * (3 - 2 * f);
function noise(u, v) {
  const x0 = Math.floor(u), y0 = Math.floor(v), fx = smooth(u - x0), fy = smooth(v - y0);
  const a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1);
  return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
}

export function fogLevel(bx, by, t) {
  const n = noise(bx * 0.085 + t * 0.040, by * 0.115 - t * 0.009) * 0.7 + noise(bx * 0.22 - t * 0.05 + 40, by * 0.26 + t * 0.016 + 7) * 0.3;
  return Math.max(FOG_MIN, Math.min(FOG_MAX, Math.round(FOG_MIN + (FOG_MAX - FOG_MIN) * Math.max(0, Math.min(1, (n - 0.2) / 0.6)))));
}
