/* Bekkedal — how a room is dressed.
 *
 * `BEK_MAPS` says where the walls are; `BEK_DECOR` says what stands in the room; this says what the room is *made of*. A room is
 * a set of rectangles (zones), and each zone has a floor and a wall paper, so a house is no longer one brown texture laid over a
 * floor plan: the bedroom has pine boards, the sitting room has parquet, the kitchen has terracotta tile, the hall has flagstones —
 * and each of those is a pattern that visibly *repeats* (a plank, a joint every four courses, a diamond in a rug, a stripe in a
 * paper), because a repeated texture is what a made floor looks like. The art is `interior_floors.js`.
 *
 *   floor   plank | parquet | tile | flag | wash          paper   stripe | tiled | panel | white
 *   rug     red | blue | green  (the colourway of any `z` rug in the zone)
 *   name    for the checks and for the status line
 *
 * A map with no entry here (the loft) keeps the old aperiodic boards and the log wall: nothing that was not named changes.
 * `windows` are the squares of wall (x, y) that have a window in them, and `curtain` the colourway of the cloth at it: chosen, so
 * a window is in the middle of a room's north wall and not wherever a hash fell.
 */
export const BEK_ROOMS = {
  /* THE CABIN: the farm house, where the work happens. Pine and terracotta, a hearth in the sitting room, a kitchen that is used. */
  farmhouse: {
    zones: [
      { name: 'HALL',    x0: 2,  y0: 9, x1: 21, y1: 12, floor: 'flag',    paper: 'panel',  rug: 'green' },
      { name: 'BEDROOM', x0: 2,  y0: 2, x1: 7,  y1: 8,  floor: 'plank',   paper: 'stripe', rug: 'blue' },
      { name: 'STUE',    x0: 9,  y0: 2, x1: 14, y1: 9,  floor: 'parquet', paper: 'stripe', rug: 'red' },
      { name: 'KITCHEN', x0: 16, y0: 2, x1: 21, y1: 8,  floor: 'tile',    paper: 'tiled',  rug: 'blue' },
      { name: 'DOORWAY', x0: 8,  y0: 5, x1: 8,  y1: 6,  floor: 'plank',   paper: 'stripe', rug: 'blue' },
      { name: 'DOORWAY', x0: 15, y0: 5, x1: 15, y1: 6,  floor: 'parquet', paper: 'stripe', rug: 'red' }
    ],
    /* the bed has a window either side of it, the hearth has one either side, the sink has one over it */
    windows: [{ x: 3, y: 1, c: 'blue' }, { x: 6, y: 1, c: 'blue' }, { x: 10, y: 1, c: 'red' }, { x: 13, y: 1, c: 'red' }, { x: 18, y: 1, c: 'green' }],
    wall: 'stripe'
  },
  /* HOME: the house by the water, the one you build to be quiet in. A sleeping room off one long room that runs from the hearth to
     the door, whitewash and pale boards, blue cloth, the lake in the windows. */
  lakehouse: {
    zones: [
      { name: 'ENTRY',   x0: 2,  y0: 9, x1: 21, y1: 12, floor: 'wash',  paper: 'white', rug: 'green' },
      { name: 'SLEEP',   x0: 2,  y0: 2, x1: 8,  y1: 8,  floor: 'wash',  paper: 'white', rug: 'blue' },
      { name: 'LIVING',  x0: 9,  y0: 2, x1: 21, y1: 8,  floor: 'wash',  paper: 'white', rug: 'blue' },
      { name: 'KITCHEN', x0: 16, y0: 2, x1: 21, y1: 3,  floor: 'tile',  paper: 'white', rug: 'blue' },
      { name: 'DOORMAT', x0: 8,  y0: 11, x1: 14, y1: 12, floor: 'flag',  paper: 'white', rug: 'green' }
    ],
    windows: [{ x: 5, y: 1, c: 'blue' }, { x: 9, y: 1, c: 'blue' }, { x: 14, y: 1, c: 'blue' }, { x: 17, y: 1, c: 'blue' }],
    wall: 'white'
  }
};

/* the zone a square belongs to, or null (the loft). Later entries win, so a doorway or a corner of a room can be written after the
   room it cuts across. */
const PLAIN = { name: '?', floor: 'plank', paper: 'stripe', rug: 'blue' };
export function zoneAt(mapId, x, y) {
  const r = BEK_ROOMS[mapId];
  if (!r) return null;
  let hit = null;
  for (const z of r.zones) if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) hit = z;
  return hit || PLAIN;       /* a floor square nobody named is plain pine: `world_check.js` fails on one, so this is only a net */
}
export const zoned = mapId => !!BEK_ROOMS[mapId];
export const paperOf = mapId => (BEK_ROOMS[mapId] || {}).wall || 'stripe';
export const windowAt = (mapId, x, y) => {
  const r = BEK_ROOMS[mapId];
  return r ? (r.windows.filter(w => w.x === x && w.y === y)[0] || null) : null;
};
