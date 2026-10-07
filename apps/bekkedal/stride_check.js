#!/usr/bin/env node
/* node apps/bekkedal/stride_check.js
 *
 * Walking (stride.js), played at every frame rate a machine can have, against the rules it has to keep:
 *
 *   1. a held key walks at one tile per BEK_STEP_S whatever the frame rate: 144, 60, 30, 20 and 10 frames a second, and
 *      a frame rate that wobbles, a hitch of a third of a second, all land within a tile of the same place;
 *   2. the first tile is taken at once when you are already facing that way, and after BEK_TURN_S when you are not, and a
 *      tap shorter than that only turns you;
 *   3. a long frame takes its tiles one at a time, each through the collision test, so no frame can carry you through a
 *      wall or past a door that a tile-by-tile walk would have stopped at;
 *   4. the newest direction key wins, and letting it go falls back to the one beneath it (hold D, tap W: up, then back to D);
 *      two keys that mean the same direction are two keys;
 *   5. the picture of a walk (the slide) moves at constant speed, never backwards and never by more than a tile, finishes
 *      on the tile the step took, and says nothing once the player has been put somewhere else;
 *   6. every tile on a held walk is a whole tile on the same line: no step sideways, ever, whatever keys were pressed
 *      and let go of on the way.
 */
import { createSteer, createStride, createSlide, walkKey, DX, DY } from './stride.js';
import { BEK_STEP_S, BEK_TURN_S, BEK_T_SRC } from './data.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };

/* a little world: an open row with a wall at `wall`, and a player who bumps */
function world(wall) {
  const w = { x: 0, y: 0, dir: 0, steps: 0, tried: [], wall };
  const steer = createSteer(), stride = createStride(BEK_STEP_S, BEK_TURN_S);
  w.steer = steer; w.stride = stride;
  w.go = (dir) => {
    w.tried.push([w.x, w.y, dir]);
    w.dir = dir;
    const nx = w.x + DX[dir], ny = w.y + DY[dir];
    if (w.wall != null && nx === w.wall) return;
    w.x = nx; w.y = ny; w.steps++;
  };
  w.frame = dt => { const want = steer.want(); const n = stride.tick(dt, want, w.dir, w.go); if (want >= 0 && !n) w.dir = w.dir; return n; };
  return w;
}
/* press, hold for `secs` of frames of `dt`, release (with the frame the key goes up in counted as held, as a browser delivers it) */
function hold(w, id, dir, secs, dt, wobble) {
  w.steer.press(id, dir);
  let t = 0, i = 0;
  while (t < secs - 1e-9) { const d = wobble ? dt * (0.5 + ((i * 7919) % 100) / 100 * 1.5) : dt; const use = Math.min(d, secs - t); w.frame(use); t += use; i++; }
  w.steer.release(id);
  w.frame(0);
}

/* 1. speed, at every frame rate --------------------------------------------------------------------------------- */
for (const fps of [144, 60, 30, 20, 10]) {
  const w = world(null), dt = Math.min(0.1, 1 / fps);
  hold(w, 'd', 3, 10, dt);
  const want = Math.floor(10 / BEK_STEP_S) + 1;                    /* the first tile at 0, then one every step */
  ok(Math.abs(w.steps - want) <= 1, 'held ten seconds at ' + fps + ' fps: ' + w.steps + ' tiles (' + want + ' by the clock)');
}
{
  const w = world(null);
  hold(w, 'd', 3, 10, 1 / 60, true);
  ok(Math.abs(w.steps - 72) <= 1, 'held ten seconds at a frame rate that wobbles from a third to twice: ' + w.steps + ' tiles (72 by the clock)');
}
{
  const w = world(null), a = world(null);
  w.steer.press('d', 3); a.steer.press('d', 3);
  for (let i = 0; i < 100; i++) { w.frame(1 / 60); a.frame(1 / 60); if (i === 50) { w.frame(0.1); w.frame(0.1); w.frame(0.1); } }
  const lost = 3 * 0.1;
  ok(Math.abs((w.steps - a.steps) - Math.round(lost / BEK_STEP_S)) <= 1, 'a hitch is made up in tiles, not lost or doubled: ' + (w.steps - a.steps) + ' tiles for ' + lost.toFixed(1) + ' s');
}

/* 2. the first tile, and the tap that only turns -------------------------------------------------------------- */
{
  const w = world(null); w.dir = 3;
  w.steer.press('d', 3); w.frame(1 / 60);
  ok(w.steps === 1, 'already facing right: the first tile is taken in the frame the key goes down');
}
{
  const w = world(null); w.dir = 0;
  hold(w, 'd', 3, BEK_TURN_S * 0.8, 1 / 60);
  ok(w.steps === 0 && w.x === 0, 'a tap shorter than ' + BEK_TURN_S + ' s while facing another way only turns (' + w.steps + ' tiles)');
  const v = world(null); v.dir = 0;
  hold(v, 'd', 3, BEK_TURN_S + 0.05, 1 / 60);
  ok(v.steps === 1, 'held a little past ' + BEK_TURN_S + ' s while facing another way: one tile (' + v.steps + ')');
}
{
  const w = world(null); w.dir = 3;
  hold(w, 'd', 3, 0.05, 1 / 60); hold(w, 'd', 3, 0.05, 1 / 60); hold(w, 'd', 3, 0.05, 1 / 60);
  ok(w.steps === 3, 'three quick taps toward the way you face: three tiles, not none (' + w.steps + ')');
}

/* 3. no frame carries you through a wall ------------------------------------------------------------------------- */
for (const dt of [0.1, 0.25, 1, 5]) {
  const w = world(3);
  w.steer.press('d', 3);
  w.frame(dt);
  ok(w.x <= 2, 'one frame of ' + dt + ' s into a wall three tiles away: stopped at x=' + w.x + ' (tried ' + w.tried.length + ' tiles, one at a time)');
  ok(w.tried.every((q, i) => i === 0 || q[0] >= w.tried[i - 1][0]), '  ...each tile tried from where the last one left you');
}

/* 4. which key wins ------------------------------------------------------------------------------------------- */
{
  const s = createSteer();
  s.press('d', 3); ok(s.want() === 3, 'D held: right');
  s.press('w', 1); ok(s.want() === 1, 'D held, W pressed after: up (newest wins)');
  s.press('d', 3); ok(s.want() === 1, 'D pressed again while held (key repeat): still up');
  s.release('w'); ok(s.want() === 3, 'W let go while D is still held: back to right');
  s.press('ArrowRight', 3); s.release('d'); ok(s.want() === 3, 'D and the right arrow are two keys: letting go of one does not stop the other');
  s.release('ArrowRight'); ok(s.want() === -1, 'everything let go: nothing');
  s.press('a', 2); s.press('s', 0); s.clear(); ok(s.want() === -1, 'clear() (the canvas lost the focus): nothing, whatever was down');
  ok(walkKey({ key: 'W' }).dir === 1 && walkKey({ key: 'W' }).id === 'w', 'a capital W (shift or caps lock) is W');
  ok(walkKey({ key: 'ц', code: 'KeyW' }).dir === 1, 'W-position key on a Cyrillic layout is read by position');
  ok(walkKey({ key: 'z', code: 'KeyW' }) === null, '...but a Latin letter keeps its own meaning (AZERTY Z is not W)');
  ok(walkKey({ key: ' ' }) === null && walkKey({ key: 'Escape' }) === null, 'space and escape are not walking keys');
}
{
  /* hold D, tap W for a quarter of a second, let go: right for a while, up for a tile or two, then straight on to the right */
  const w = world(null); w.dir = 3;
  w.steer.press('d', 3);
  for (let i = 0; i < 30; i++) w.frame(1 / 60);
  const x0 = w.x;
  w.steer.press('w', 1);
  for (let i = 0; i < 15; i++) w.frame(1 / 60);
  w.steer.release('w');
  const y1 = w.y;
  for (let i = 0; i < 60; i++) w.frame(1 / 60);
  ok(y1 <= -1 && w.y === y1, 'W tapped over a held D: up ' + -y1 + ' tile(s) while it was down, none after');
  ok(w.x > x0 + 2, 'and D walked on after it (' + (w.x - x0) + ' tiles)');
  ok(w.tried.every(q => [0, 1, 3].indexOf(q[2]) >= 0), '  ...never a tile in a direction nobody asked for');
}

/* 5. the picture of a walk -------------------------------------------------------------------------------------- */
{
  const sl = createSlide(BEK_STEP_S, BEK_T_SRC);
  sl.start('farm', 4, 4, 5, 4, 0);
  const xs = [];
  for (let t = 0; t < BEK_STEP_S + 0.05; t += 1 / 144) { xs.push(sl.at('farm', 5, 4).x); sl.tick(1 / 144); }
  let mono = true, maxJump = 0;
  for (let i = 1; i < xs.length; i++) { if (xs[i] < xs[i - 1]) mono = false; maxJump = Math.max(maxJump, xs[i] - xs[i - 1]); }
  ok(mono, 'a slide only ever moves forward');
  ok(xs[0] === 4 && xs[xs.length - 1] === 5, 'it starts on the tile left behind (' + xs[0] + ') and finishes on the one taken (' + xs[xs.length - 1] + ')');
  ok(maxJump <= 1 / BEK_T_SRC * 6, 'at 144 fps it never moves by more than ' + (maxJump * BEK_T_SRC).toFixed(0) + ' source pixels a frame');
  ok(Math.abs(xs.filter(x => x > 4 && x < 5).length / 144 - BEK_STEP_S) < 3 / 144, 'and takes ' + BEK_STEP_S + ' s from one tile to the next');
  const q = xs.every(x => Math.abs(x * BEK_T_SRC - Math.round(x * BEK_T_SRC)) < 1e-9);
  ok(q, 'every position it shows is a whole source pixel (nothing is ever drawn between two)');
}
{
  const sl = createSlide(BEK_STEP_S, BEK_T_SRC);
  sl.start('farm', 4, 4, 5, 4, 0.07);
  ok(Math.abs(sl.at('farm', 5, 4).x - 4.5) < 1 / BEK_T_SRC, 'a slide begun 70 ms into the step (a long frame) starts half way');
  ok(sl.at('town', 5, 4).sliding === false && sl.at('farm', 6, 4).sliding === false && sl.at('farm', 5, 5).sliding === false,
     'put somewhere else (another map, another tile): no slide, the jump is drawn as a jump');
  sl.drop(); ok(sl.at('farm', 5, 4).x === 5, 'a dropped slide shows the tile');
}
{
  /* a walk, drawn: constant speed over many tiles, across a change of frame rate */
  const w = world(null), sl = createSlide(BEK_STEP_S, BEK_T_SRC);
  let px = 0, last = null, worst = 0, t = 0;
  w.steer.press('d', 3);
  const go = (dir, lead) => { const ox = px; px += 1; sl.start('m', ox, 0, px, 0, lead); };
  for (let i = 0; i < 600; i++) {
    const dt = i < 200 ? 1 / 144 : i < 400 ? 1 / 30 : 1 / 60;
    sl.tick(dt); w.stride.tick(dt, 3, 3, go); t += dt;
    const x = sl.at('m', px, 0).x;
    if (last != null) worst = Math.max(worst, Math.abs(x - last - dt / BEK_STEP_S));
    last = x;
  }
  ok(worst <= 1.5 / BEK_T_SRC + 1e-9, 'shown position over ' + t.toFixed(0) + ' s of walking, at 144, 30 and 60 fps in turn, never strays more than a source pixel from constant speed (' + (worst * BEK_T_SRC).toFixed(2) + ' px)');
}

/* 6. a straight line stays one -------------------------------------------------------------------------------- */
{
  const w = world(null); w.dir = 3;
  w.steer.press('d', 3);
  let x = 0;
  for (let i = 0; i < 2000; i++) {
    /* every so often a second key goes down and comes up, but never in a way that should turn the walk */
    if (i % 97 === 0) w.steer.press('ArrowRight', 3);
    if (i % 97 === 40) w.steer.release('ArrowRight');
    w.frame(1 / 60 + (i % 5) * 0.002);
  }
  ok(w.y === 0 && w.tried.every(q => q[2] === 3), 'two keys for the same way, one let go now and then: still a straight line (' + w.steps + ' tiles, y=' + w.y + ')');
}

console.log(fails ? '\n' + fails + ' FAILED' : '\nSTRIDE OK');
process.exit(fails ? 1 : 0);
