/* GARDEN — what a plant, the pot it stands in and the room that pot is in do for each other. Pure: no canvas, no clock.
 *
 * The pot and the room each lend every plant in them a multiplier (that is `POTS[].buff` and `ROOM_DEFS[].buff`: the old
 * garden stopped there, which is why the late game was the same twelve clicks done faster). On top of those, the choice of
 * what grows where is worth something of its own, five ways, all multiplying and all shown to the player by name:
 *
 *   HOME     a plant in the room it comes from           +30% SUN   +10% growth
 *   KIN      a plant in the pot it likes                 +15% SUN
 *   ROOTED   both at once                                +10% SUN on top
 *   SET      the room is standing in its own pot          every plant in it +8% SUN, +10% growth
 *   BED      each neighbour (left, right, above, below)   +5% SUN apiece for a neighbour of its own kind, up to four
 *   MATE     each neighbour that is its mate              +8% SUN, +8% growth apiece
 *
 * A neighbour is one of the four pots touching on the rack (four across, three down). Nothing here changes what a pot
 * costs or what a species costs; it changes which of the things you already own is the right one to put where.
 */
export const COLS = 4, ROWS = 3, POTS_PER_ROOM = COLS * ROWS;

export const HOME = { yield: 1.3, grow: 1.1 };
export const KIN = { yield: 1.15 };
export const ROOTED = { yield: 1.1 };
export const SET = { yield: 1.08, grow: 1.1 };
export const BED = { yield: 0.05 };
export const MATE = { yield: 0.08, grow: 0.08 };

/* the pots that touch pot i, as indexes into the rack */
export function neighbours(i) {
  const c = i % COLS, r = (i / COLS) | 0, out = [];
  if (c > 0) out.push(i - 1);
  if (c < COLS - 1) out.push(i + 1);
  if (r > 0) out.push(i - COLS);
  if (r < ROWS - 1) out.push(i + COLS);
  return out;
}

/* { grow, yield, tags[] } for the plant in pot i of a room.
     room     the room's own record: { pot, pots[] } (pot is the id of the pot it stands in, never null here)
     def      the room's definition: { id, kinPot }
     species  id -> { id, home, kin, mate }                                                                              */
export function bonusFor(room, def, species, i) {
  const p = room.pots[i];
  const sp = p && species(p.sp);
  const out = { grow: 1, yield: 1, tags: [] };
  if (!sp) return out;
  const home = sp.home === def.id, kin = sp.kin === room.pot;
  if (home) { out.yield *= HOME.yield; out.grow *= HOME.grow; out.tags.push('HOME ROOM'); }
  if (kin) { out.yield *= KIN.yield; out.tags.push('KIN POT'); }
  if (home && kin) { out.yield *= ROOTED.yield; out.tags.push('ROOTED'); }
  if (def.kinPot && room.pot === def.kinPot) { out.yield *= SET.yield; out.grow *= SET.grow; out.tags.push('ROOM SET'); }
  let bed = 0, mate = 0;
  neighbours(i).forEach(n => {
    const q = room.pots[n];
    if (!q) return;
    if (q.sp === p.sp) bed++;
    else if (sp.mate && q.sp === sp.mate) mate++;
  });
  if (bed) { out.yield *= 1 + BED.yield * bed; out.tags.push(bed + ' OF ITS KIND'); }
  if (mate) { out.yield *= 1 + MATE.yield * mate; out.grow *= 1 + MATE.grow * mate; out.tags.push(mate + (mate > 1 ? ' MATES' : ' MATE')); }
  return out;
}

/* the plain sentence for a tag list, for the line under the garden: what is helping this plant */
export const describe = tags => tags.length ? tags.join('  +  ') : 'NO SYNERGY. TRY ITS HOME ROOM, ITS KIN POT, OR A NEIGHBOUR.';
