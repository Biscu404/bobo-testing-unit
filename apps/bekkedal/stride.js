/* Walking: which way you are going, when the next tile is taken, and where the picture shows you meanwhile.
 *
 * The world is a grid and stays one: collision, doors, what SPACE hits and the clock all see a player who stands on
 * a whole tile. What used to be wrong was everything around that.
 *
 *   - Direction was a priority list (W, then S, then A, then D) rather than "the key you pressed last", so holding D and
 *     brushing W sent you up, and letting go of W while still holding D did not bring you back to D unless W was the
 *     only thing in the way. `createSteer` is a stack: the newest key still held wins, and letting it go falls back to
 *     the one under it.
 *   - A tile was taken when `S.walk` had gathered a step's worth of frame time, and the remainder was then thrown away,
 *     so a step cost a whole number of frames: nine frames (150 ms, not 140) at 60 Hz, eight or nine as the frame
 *     times wobbled, and the player's speed followed the frame rate. `createStride` banks time instead. A tile is taken
 *     every `stepS` of *held time*, whatever the frames were like, and several tiles in one long frame are taken one at
 *     a time, each through the same collision test, so a hitch can never carry you through a wall.
 *   - The first tile waited a full step after the key went down. Now it is taken at once when you are already facing
 *     that way, and after `turnS` when you are not, so a tap shorter than that only turns you on the spot (which is how
 *     you face a free tile to work it).
 *   - The picture jumped forty pixels a step, seven times a second, and the camera with it. `createSlide` is what draws
 *     the walk between two tiles: the player and the camera glide from the old tile to the new one over the same
 *     `stepS` the step cost, at constant speed, so a held key is a straight line at a steady pace and the picture
 *     scrolls a pixel or two a frame. It is only ever a picture: the step it draws has already happened.
 *
 * Pure: no canvas, no `S`, no clock. `stride_check.js` plays it at 144, 60, 30 and 10 frames a second.
 */

/* S.dir: 0 down, 1 up, 2 left, 3 right */
export const DX = [0, 0, -1, 1];
export const DY = [1, -1, 0, 0];

const KEY_DIR = { s: 0, ArrowDown: 0, w: 1, ArrowUp: 1, a: 2, ArrowLeft: 2, d: 3, ArrowRight: 3 };
const CODE_DIR = { KeyS: 0, KeyW: 1, KeyA: 2, KeyD: 3 };

/* The walking key an event is, as { id, dir }, or null. `id` names the *physical* key, so ArrowUp and W held together
   are two keys and letting go of one does not stop the other. With a non-Latin layout active (Cyrillic, Greek...) the
   keys in the W-A-S-D place print letters that mean nothing here, so those are read by position. */
export function walkKey(e) {
  if (!e) return null;
  const k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k != null && KEY_DIR[k] != null) return { id: k, dir: KEY_DIR[k] };
  if (e.code && CODE_DIR[e.code] != null && k && k.length === 1 && k.charCodeAt(0) > 127) return { id: e.code, dir: CODE_DIR[e.code] };
  return null;
}

/* The direction keys held, oldest first. The newest wins; letting it go falls back to the one beneath. */
export function createSteer() {
  const held = [];
  return {
    press(id, dir) { if (!held.some(h => h.id === id)) held.push({ id, dir }); },
    release(id) { const i = held.findIndex(h => h.id === id); if (i >= 0) held.splice(i, 1); },
    clear() { held.length = 0; },
    want() { return held.length ? held[held.length - 1].dir : -1; },
    size() { return held.length; }
  };
}

/* Time, banked. `tick(dt, want, facing, go)` calls `go(dir, lead)` once for every tile that is due, in order, and
   returns how many. `lead` is how long ago, inside this frame, that tile was due: the picture starts that far into
   its slide, which is what keeps a held key at constant speed instead of at a speed that depends on the frame.
   A key that is not held banks nothing and forgets: the next press starts again. */
export function createStride(stepS, turnS) {
  let bank = 0, live = false;
  return {
    live: () => live,
    reset() { live = false; bank = 0; },
    tick(dt, want, facing, go) {
      if (want < 0) { live = false; bank = 0; return 0; }
      if (!live) { live = true; bank = want === facing ? stepS : Math.max(0, stepS - turnS); }
      bank += dt;
      let n = 0;
      while (bank >= stepS && n < 64) { bank -= stepS; n++; go(want, bank); }
      if (n === 64) bank = 0;
      return n;
    }
  };
}

/* The walk between two tiles, as it is drawn. `at()` is where the player is *shown*, in tiles and fractions of a
   tile, snapped to whole source pixels (`grain` per tile: the art is authored on a 20-pixel tile and drawn at twice
   that, so the player, the camera and the ground all move in the same whole pixels and nothing shimmers against
   anything else). It only means anything while the player is still standing on the tile the slide was made for: any
   other way of arriving somewhere (a door, a scene, a new morning) is a jump, not a walk, and is drawn as one. */
export function createSlide(stepS, grain) {
  let s = null;
  const snap = v => Math.round(v * grain) / grain;
  return {
    start(map, ox, oy, nx, ny, lead) { s = { map, ox, oy, nx, ny, t: Math.max(0, Math.min(lead, stepS)) }; },
    drop() { s = null; },
    tick(dt) { if (s) { s.t += dt; if (s.t >= stepS) s = null; } },
    active() { return !!s; },
    at(map, px, py) {
      if (!s || s.map !== map || s.nx !== px || s.ny !== py) return { x: px, y: py, sliding: false };
      const k = 1 - s.t / stepS;
      return { x: snap(px + (s.ox - px) * k), y: snap(py + (s.oy - py) * k), sliding: true };
    }
  };
}
