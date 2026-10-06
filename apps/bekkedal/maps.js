/* Bekkedal — the eleven places, and the seams between them.
 *
 * The valley used to be eleven rooms you reached from a menu, because every
 * map was one screen and a screen is not a place. The maps themselves now
 * live in `maps_valley.js` and `maps_wild.js`; what lives here is the thing
 * that makes them one valley — the edge runs, declared once each, as a
 * pairing rather than as two lists of exits that have to be kept agreeing by
 * hand.
 *
 * A seam is not a new mechanism. It is the exits mechanism BEK_MAPS has
 * always had, applied to a whole run of an edge instead of one tile of it:
 * walk east off the farm on any of five rows and you are in the square, on the
 * row that answers it. Because both sides are generated from the same
 * declaration, the two runs are always the same length and always land one
 * tile inside the rim they came through, so there is no row you can leave by
 * and no row you can fall through.
 *
 * The travel menu is not gone, but it is down to the two places it was ever
 * honest about: the setra and the vidda are up the mountain, and the walk is
 * the point (see BEK_HOME in index.js, and what Sigrid and Gunnar say about
 * the track in BEK_TALK). Everything on the valley floor you walk to.
 */
import { VALLEY } from './maps_valley.js';
import { WILD } from './maps_wild.js';

export const BEK_MAPS = Object.assign({}, VALLEY, WILD);

/* ---- the seams -----------------------------------------------------------
   [ map, side, from, length, partner, partner's from, gate? ]

   `side` is which edge of the first map the run lies on; the answering run is
   on the opposite edge of the partner, `length` tiles long, starting at the
   partner's own `from`. A `gate` is carried on the first map's side only —
   the wind and the dark are reasons not to go up and in, never reasons you
   cannot come back down and out.
   ========================================================================== */
const WARM = { need: 'warm', why: {
  no: 'Vinden der oppe skjærer gjennom deg. Skaff noe ullent først.',
  en: 'The wind up top will cut through you. Get something woollen first.' } };
const LAMP = { need: 'lamp', why: {
  no: 'Beksvart der inne. Lars har lyktene.',
  en: 'Pitch dark in there. Lars keeps the lanterns.' } };

export const SEAMS = [
  ['farm',   'E', 11, 5, 'town',   13],        /* the road east, into the square          */
  ['farm',   'S', 34, 5, 'enga',    5],        /* down the field track to the hay          */
  ['town',   'E', 13, 5, 'lake',   13],        /* the road on down to the water            */
  ['town',   'N', 20, 5, 'forest', 24],        /* the road north out of the square         */
  ['town',   'S', 20, 5, 'enga',   35],        /* and south, past the meadow               */
  ['forest', 'N',  8, 2, 'setra',   8],        /* the trail up — two tiles wide            */
  ['setra',  'N',  8, 2, 'vidda',   8, WARM],
  ['setra',  'E', 12, 2, 'gruva',  12, LAMP]
];

const OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
const size = m => [m.rows[0].length, m.rows.length];
/* the i-th tile of a run along `side`, and the square just inside it */
function rim(m, side, from, i) {
  const [cols, rows] = size(m);
  return side === 'N' ? [from + i, 0] : side === 'S' ? [from + i, rows - 1]
       : side === 'W' ? [0, from + i] : [cols - 1, from + i];
}
function inward(m, side, x, y) {
  const [cols, rows] = size(m);
  return side === 'N' ? [x, 1] : side === 'S' ? [x, rows - 2]
       : side === 'W' ? [1, y] : [cols - 2, y];
}

for (const [aId, side, aFrom, len, bId, bFrom, gate] of SEAMS) {
  const a = BEK_MAPS[aId], b = BEK_MAPS[bId], back = OPP[side];
  for (let i = 0; i < len; i++) {
    const [ax, ay] = rim(a, side, aFrom, i), [bx, by] = rim(b, back, bFrom, i);
    const [aix, aiy] = inward(a, side, ax, ay), [bix, biy] = inward(b, back, bx, by);
    a.exits.push(Object.assign({ x: ax, y: ay, to: bId, tx: bix, ty: biy }, gate || {}));
    b.exits.push({ x: bx, y: by, to: aId, tx: aix, ty: aiy });
  }
}

/* ---- where everything is -------------------------------------------------
   The seams are the only statement of how the valley fits together, so its
   geography is *derived* from them rather than kept as a second list that
   could disagree: put the farm at the origin, and every seam says where the
   map on its other side must stand (the whole width of the one it leaves, and
   the difference of the two `from` offsets along the edge). If two paths to
   the same map disagree, that is a loop that cannot exist on a plane, and it
   is recorded in `conflicts` for world_check.js to fail on. The valley used
   to have two of them: the forest was west of the farm and north of the town,
   and the meadow was south of both at once, which no arrangement of
   rectangles allows. The lake and the fjord are not joined by a seam but by a
   boat across the water, so the fjord is placed across the lake. */
export const BEK_WORLD = (() => {
  const dims = id => size(BEK_MAPS[id]);
  const at = { farm: [0, 0] }, conflicts = [];
  const delta = (a, side, aFrom, b, bFrom) => {
    const [ac, ar] = dims(a), [bc, br] = dims(b);
    const along = side === 'E' || side === 'W' ? [0, aFrom - bFrom] : [aFrom - bFrom, 0];
    return side === 'E' ? [ac + along[0], along[1]] : side === 'W' ? [-bc + along[0], along[1]]
         : side === 'S' ? [along[0], ar] : [along[0], -br];
  };
  let grew = true;
  while (grew) {
    grew = false;
    for (const [a, side, aFrom, , b, bFrom] of SEAMS) {
      const d = delta(a, side, aFrom, b, bFrom);
      const known = (id, x, y) => {
        if (!at[id]) { at[id] = [x, y]; grew = true; }
        else if (at[id][0] !== x || at[id][1] !== y) conflicts.push(id + ' at ' + at[id] + ' and at ' + [x, y]);
      };
      if (at[a]) known(b, at[a][0] + d[0], at[a][1] + d[1]);
      if (at[b]) known(a, at[b][0] - d[0], at[b][1] - d[1]);
    }
  }
  /* the water between the lake and the fjord: a boat's crossing, not a seam */
  if (at.lake && BEK_MAPS.fjord) at.fjord = [at.lake[0] + dims('lake')[0] + 8, at.lake[1]];
  return { at, conflicts: Array.from(new Set(conflicts)) };
})();
