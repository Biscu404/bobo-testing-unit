/* Bekkedal — which house is which.
 *
 * Every building in the valley used to be one of two things: log under turf out on the farms and at the water, red board under
 * dark tile in the town. Six houses in a square were one house six times. A house here is now *authored*: a wall, a roof, a
 * chimney, a door, a pair of shutters, a flower box, a lantern, a window — each one picked from a short shelf below, and each
 * building named in `FACADES` by the square its top-left corner stands on. Two houses on the same street never share a wall
 * colour, and the one you build by the water is whitewashed, which is not what the farm is.
 *
 * Everything here is a colour out of a table `palette_marks.js` declares (so `palette_check.js` reads what the art draws) and a
 * number the profile functions in `building.js` and `roof.js` already take: this file adds no drawing, only choices. A map whose
 * building has no entry keeps the two old dressings, so nothing that was not named changes.
 */
import { MARKS, SHADOWS, FEATURES } from './palette_marks.js';
import { TURF, TILE } from './roof.js';

/* ---- walls: the rhythm of the courses, three steps of one material, the stone it stands on, its trim -------------------------- */
const wall = (mk, eave, plinth, plinthTop, trim, o) => Object.assign({
  course: 7, lit: MARKS[mk].cols[0], body: MARKS[mk].cols[1], gap: MARKS[mk].cols[2],
  deep: SHADOWS[eave].cols[0], shade: SHADOWS[eave].cols[1], plinth: plinth, plinthTop: plinthTop,
  trim: FEATURES[trim].cols, glass: FEATURES.WINDOW_GLASS.cols, log: 0
}, o || {});

export const WALLS = {
  /* the two it always had */
  log: { course: 12, lit: MARKS.WALL_LOG.cols[0], body: MARKS.WALL_LOG.cols[1], gap: MARKS.WALL_LOG.cols[2],
         deep: SHADOWS.EAVE_LOG.cols[0], shade: SHADOWS.EAVE_LOG.cols[1],
         plinth: MARKS.PLINTH_LOG.cols[0], plinthTop: MARKS.PLINTH_LOG.cols[1],
         trim: FEATURES.TRIM_LOG.cols, glass: MARKS.WINDOW_LOG.cols, log: 1 },
  falu: { course: 7, lit: MARKS.WALL_BOARD.cols[0], body: MARKS.WALL_BOARD.cols[1], gap: MARKS.WALL_BOARD.cols[2],
          deep: SHADOWS.EAVE_BOARD.cols[0], shade: SHADOWS.EAVE_BOARD.cols[1],
          plinth: MARKS.PLINTH_BOARD.cols[0], plinthTop: MARKS.PLINTH_BOARD.cols[1],
          trim: FEATURES.TRIM_BOARD.cols, glass: FEATURES.WINDOW_BOARD.cols, log: 0 },
  /* and the rest of the shelf */
  ochre:  wall('WALL_OCHRE', 'EAVE_OCHRE', SHADOWS.PLINTH_OCHRE.cols[0], SHADOWS.PLINTH_OCHRE.cols[1], 'TRIM_OCHRE'),
  white:  wall('WALL_WHITE', 'EAVE_WHITE', SHADOWS.PLINTH_WHITE.cols[0], SHADOWS.PLINTH_WHITE.cols[1], 'TRIM_WHITE'),
  blue:   wall('WALL_BLUE', 'EAVE_BLUE', MARKS.PLINTH_BLUE.cols[0], MARKS.PLINTH_BLUE.cols[1], 'TRIM_BLUE'),
  green:  wall('WALL_GREEN', 'EAVE_GREEN', MARKS.PLINTH_GREEN.cols[0], MARKS.PLINTH_GREEN.cols[1], 'TRIM_GREEN'),
  /* tarred log, black as a boat, and an old storehouse grown silver: both are log, so both cross at the corners */
  tar:    wall('WALL_TAR', 'EAVE_TAR', MARKS.PLINTH_TAR.cols[0], MARKS.PLINTH_TAR.cols[1], 'TRIM_TAR', { course: 12, log: 1, glass: MARKS.WINDOW_LOG.cols }),
  silver: wall('WALL_SILVER', 'EAVE_SILVER', SHADOWS.PLINTH_DARK.cols[0], SHADOWS.PLINTH_DARK.cols[1], 'TRIM_SILVER', { course: 12, log: 1 })
};

/* ---- roofs: the course, the three steps of the pitch, the eave and the ridge ------------------------------------------------ */
const roof = (mk, eave, ridge, course) => ({
  course: course, lit: MARKS[mk].cols[0], body: MARKS[mk].cols[1], low: MARKS[mk].cols[2], gap: MARKS[mk].cols[2],
  eaveLit: MARKS[mk].cols[0], fascia: SHADOWS[eave].cols[0], deep: SHADOWS[eave].cols[1], ridge: FEATURES[ridge].cols
});
export const ROOFS = {
  turf: TURF, tile: TILE,
  red: roof('ROOF_RED', 'EAVE_RED', 'RIDGE_RED', 5),
  slate: roof('ROOF_SLATE', 'EAVE_SLATE', 'RIDGE_SLATE', 6),
  shingle: roof('ROOF_SHINGLE', 'EAVE_SHINGLE', 'RIDGE_SHINGLE', 4)
};

/* ---- chimneys: the lit face and the shaded body, in stone, in brick or in render ---------------------------------------------- */
export const CHIMS = {
  stone: { lit: MARKS.CHIMNEY.cols[0], body: MARKS.CHIMNEY.cols[1] },
  brick: { lit: MARKS.CHIMNEY_BRICK.cols[0], body: MARKS.CHIMNEY_BRICK.cols[1] },
  white: { lit: MARKS.CHIMNEY_WHITE.cols[0], body: MARKS.CHIMNEY_WHITE.cols[1] }
};

/* ---- doors: boards, the paint on them (or none), shutters --------------------------------------------------------------------- */
export const DOORS = {
  plank: MARKS.DOOR_BOARD.cols,
  red: FEATURES.DOOR_RED.cols, green: FEATURES.DOOR_GREEN.cols, blue: FEATURES.DOOR_BLUE.cols, dark: FEATURES.DOOR_DARK.cols
};
export const SHUTS = { green: FEATURES.SHUTTER_GREEN.cols, blue: FEATURES.SHUTTER_BLUE.cols, red: FEATURES.SHUTTER_RED.cols, dark: FEATURES.SHUTTER_DARK.cols };

/* ---- the houses -----------------------------------------------------------------------------------------------------------------
   Keyed by map, then by the building's top-left square (the first roof tile of its top row). `wall` and `roof` are required;
   `chim` (none to leave the roof bare), `door`, `shut`, `box` (flowers under the windows), `lantern` (beside the door) and `win`
   (`cross` is the old four-pane, `plain` one big pane, `six` two columns of three) are what make two houses of one colour
   different houses. */
export const FACADES = {
  /* the home: dark log under turf, as the farm always was */
  /* the shack: grey, weathered log under sod, one pane, no chimney (a stove-pipe is not a chimney), no lantern, no flowers, nothing painted. Four squares wide: the smallest house in the valley */
  farm:  [{ x: 6, y: 4, wall: 'silver', roof: 'turf', door: 'plank', win: 'plain' }],
  town: [
    /* the street of falu red the town was, with a white corner board and green shutters on the best of it */
    { x: 31, y: 7, wall: 'falu', roof: 'tile', chim: 'stone', door: 'green', shut: 'green', win: 'cross' },
    /* yellow, under red tile, with a red door and a brick stack: the shop */
    { x: 7, y: 8, wall: 'ochre', roof: 'red', chim: 'brick', door: 'red', shut: 'green', win: 'six', box: 1 },
    /* the old storehouse on the square that Astrid keeps the key to: silver log, a turf roof with no stack */
    { x: 38, y: 11, wall: 'silver', roof: 'turf', chim: null, door: 'dark', win: 'plain' },
    /* whitewash, slate and dark frames: the newest house */
    { x: 9, y: 17, wall: 'white', roof: 'slate', chim: 'white', door: 'blue', win: 'plain', lantern: 1 },
    /* blue with white trim, flowers at every sill */
    { x: 8, y: 21, wall: 'blue', roof: 'tile', chim: 'stone', door: 'red', shut: 'red', win: 'six', box: 1 },
    /* pale green board under shingle */
    { x: 30, y: 21, wall: 'green', roof: 'shingle', chim: 'brick', door: 'red', win: 'cross', lantern: 1 }
  ],
  enga:  [{ x: 11, y: 5, wall: 'tar', roof: 'shingle', chim: null, door: 'dark', win: 'plain' }],
  setra: [{ x: 4, y: 4, wall: 'silver', roof: 'turf', chim: 'stone', door: 'plank', win: 'cross' }],
  fjord: [{ x: 4, y: 3, wall: 'ochre', roof: 'slate', chim: 'stone', door: 'blue', shut: 'dark', win: 'six', box: 1 }],
  /* the house you build by the water: whitewashed, a grey roof, a blue door, and flowers (what Marit asked for) */
  lake:  [{ x: 3, y: 2, wall: 'white', roof: 'tile', chim: 'white', door: 'blue', shut: 'blue', win: 'six', box: 1, lantern: 1 }]
};

/* one entry, resolved to the objects the drawing takes. A building the table does not name wears what its map always wore. */
export function facadeOf(mapId, x, y, rustic) {
  const e = (FACADES[mapId] || []).filter(f => f.x === x && f.y === y)[0];
  const w = e ? e.wall : rustic ? 'log' : 'falu', r = e ? e.roof : rustic ? 'turf' : 'tile';
  return {
    wall: WALLS[w], roof: ROOFS[r],
    chim: e && e.chim === null ? null : CHIMS[(e && e.chim) || 'stone'],
    door: DOORS[(e && e.door) || 'plank'], plank: !e || !e.door || e.door === 'plank',
    shut: e && e.shut ? SHUTS[e.shut] : null, box: !!(e && e.box), lantern: !!(e && e.lantern), win: (e && e.win) || 'cross'
  };
}
