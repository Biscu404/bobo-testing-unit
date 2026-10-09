/* Bekkedal — the geese on its waters (Thea's present, once the credits have given you one). Two or three float on the lake and on the fjord and one or two on the tarn up on the vidda: they
   paddle about the deep water (`W`, never the shore, never the pier), put their heads under now and then, keep out of your way, and honk at some interval between six and twenty-two seconds, quietly,
   if you are within earshot. They live only in the picture: nothing is saved, nothing is asked of `S`, and a map with no deep water has none. They are the shared goose (apps/goose_art.js,
   goose_life.js), the small frames, in the valley's own colours (palette.js) so the hour of the day dresses them like everything else. Pure but for `draw`; apps/bekkedal/geese_check.js holds it. */
import { BEK_MAPS, BEK_T_SRC } from './data.js';
import { SNO, STO, WAR, WAT } from './palette.js';
import { swimmer, stepSwimmer, swimFrame, honker, stepHonker } from '../goose_life.js';
import { drawGoose } from '../goose_art.js';
import { playHonk } from '../goose_voice.js';
import { gifts } from '../gifts_scope.js';

export const MAX_GEESE = 3, NEAR = [4, 12], SHY = 3.2, EARSHOT = 18, VMAX = 0.35;          /* how many; how far from you they are first seen (tiles); how close is too close; how far a honk carries */
const TILE = 'W';
export const FRAME = { swim: 'swimS', honk: 'honkS', dabble: 'dabbleS' };
/* what each digit of a goose frame is in the valley's ramps */
export const COLOUR = { 0: STO[0], 15: SNO[1], 7: STO[4], 14: WAR[3], 6: WAR[2], 4: WAR[1] };

const tileIs = (map, x, y) => { const r = (BEK_MAPS[map] || {}).rows; return !!r && y >= 0 && y < r.length && x >= 0 && x < r[y].length && r[y][x] === TILE; };
/* a goose floats where the whole of it is over deep water: the tile under its middle, half a tile to each side, and a little way fore and aft */
export const floats = (map, x, y) => [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.35], [-0.6, 0.35], [0.6, 0.35], [0, -0.35]].every(([dx, dy]) => tileIs(map, Math.floor(x + dx), Math.floor(y + dy)));

const spots = {};
/* every square of a map a goose could be put on, as tile-centre pairs */
export function waterOf(map) {
  if (spots[map]) return spots[map];
  const rows = (BEK_MAPS[map] || {}).rows || [], out = [];
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (floats(map, x + 0.5, y + 0.5)) out.push([x + 0.5, y + 0.5]); });
  return (spots[map] = out);
}

/* up to MAX_GEESE places for geese to start, within NEAR of (px, py), a few tiles from each other; none if there is no water near enough to see */
export function placesFor(map, px, py, rng = Math.random) {
  const near = waterOf(map).filter(([x, y]) => { const d = Math.hypot(x - px, y - py); return d >= NEAR[0] && d <= NEAR[1]; });
  if (!near.length) return [];
  const want = Math.min(MAX_GEESE, 1 + Math.floor(near.length / 14)), out = [];
  for (let tries = 0; tries < 60 && out.length < want; tries++) {
    const c = near[Math.floor(rng() * near.length)];
    if (out.every(o => Math.hypot(o[0] - c[0], o[1] - c[1]) >= 2.6)) out.push(c);
  }
  return out;
}

export function createGeese(GG, C) {
  const G = gifts();
  let map = null, birds = [], clock = honker(Math.random()), retry = 0;
  const R = (x, y, w, h, d) => { const g = GG(); g.fillStyle = C(COLOUR[d] != null ? COLOUR[d] : STO[0]); g.fillRect(x, y, w, h); };

  return {
    /* every frame: the seconds since the last, where you are (a map and tile coordinates) */
    step(dt, mapId, px, py) {
      if (!G.has('goose') || !waterOf(mapId).length) { if (map) { map = null; birds = []; } return; }
      if (mapId !== map) { map = mapId; birds = []; retry = 0; clock = honker(Math.random()); }
      if (!birds.length) {
        retry -= dt;
        if (retry > 0) return;
        retry = 1.5;
        placesFor(map, px, py).forEach(([x, y]) => {
          const w = swimmer(Math.random, x, y, { vmax: VMAX });
          w.inside = (nx, ny) => floats(map, nx, ny);
          birds.push(w);
        });
        return;
      }
      const fear = { x: px + 0.5, y: py + 0.5, r: SHY };
      birds.forEach(b => stepSwimmer(b, dt, b.inside, Math.random, fear));
      const plan = stepHonker(clock, dt);
      if (plan) {
        const b = birds[Math.floor(Math.random() * birds.length)];
        b.honk = clock.open;
        if (Math.hypot(b.x - px, b.y - py) <= EARSHOT) playHonk(plan);
      }
    },
    /* the geese on this map, for the one pass that draws everything standing on the ground in order of how far down the screen it is */
    here: mapId => (mapId === map ? birds : []),
    /* one goose, in source pixels, bottom-centre on the water */
    draw(b) {
      const cx = Math.round(b.x * BEK_T_SRC), by = Math.round(b.y * BEK_T_SRC) + 6 + (Math.sin(b.t * 1.7) > 0.5 ? 1 : 0);
      R(cx - 10, by, 20, 1, WAT[5]); R(cx - 6, by + 1, 12, 1, WAT[4]);
      drawGoose(R, cx, by, FRAME[swimFrame(b)], 1, b.face < 0);
    }
  };
}
