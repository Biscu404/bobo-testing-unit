/* Where the garden tells the trophies what happened (the list is trophies.js). `scan` looks at the whole garden about once a second and says only what changed (the rack, the rooms,
   the drip lines, the plants that have grown); the rest are one call each from index.js. None of it can throw into the game. */
import { trophies } from '../trophy_scope.js';
import * as M from './model.js';
import { POTS_PER_ROOM } from './synergy.js';

const TR = trophies('garden');
const guard = f => { try { return f(); } catch (e) { return undefined; } };
const EIGHT_HOURS = 8 * 3600 * 1000;

export function createCalls(w, st, rooms) {
  let sig = '', blessedSeen = st.blessedN || 0, pokes = [];
  return {
    earned: n => guard(() => TR.add('gardenSun', n)),
    scan() {
      guard(() => {
        let rooted = false, bed = false, mates = false, perfect = 0, drips = 0;
        st.rooms.forEach((room, ri) => {
          if (!room.unlocked) return;
          if (room.drip) drips++;
          let all = 0, set = false;
          room.pots.forEach((p, i) => {
            if (!p) return;
            const tags = M.stats(w, st, ri, i).tags;
            if (tags.indexOf('ROOTED') >= 0) { rooted = true; all++; }
            if (tags.indexOf('4 OF ITS KIND') >= 0) bed = true;
            if (tags.some(x => /^[2-4] MATES$/.test(x))) mates = true;
            if (tags.indexOf('ROOM SET') >= 0) set = true;
            if (M.stage(w, p) === 3) TR.mark('grown', p.sp);
          });
          if (all === POTS_PER_ROOM && set) perfect++;
        });
        const open = M.roomsOpen(st), hands = drips >= rooms && st.up.basket >= M.CAPS.length - 1 && st.up.gather >= M.GATHER.length - 1;
        const now = [rooted, bed, mates, perfect, open, drips, hands].join();
        if (now !== sig) { sig = now; TR.emit('rack', { rooted: rooted, bed: bed, mates: mates, perfect: perfect, rooms: open, drips: drips, hands: hands }); }
        if ((st.blessedN || 0) > blessedSeen) { blessedSeen = st.blessedN; TR.emit('blessed', {}); }
      });
    },
    picked(p, sp, roomId, clockNight) {
      guard(() => TR.emit('pick', { n: p.n, room: roomId, species: sp.id, night: !!(sp.night && clockNight && roomId !== 'cellar') }));
    },
    chain: () => guard(() => TR.emit('chain', {})),
    tended: n => guard(() => TR.emit('tend', { rooms: n })),
    benchBought: () => guard(() => TR.emit('bench-buy', {})),
    caughtUp: (gapMs, gathered) => guard(() => { if (gapMs >= EIGHT_HOURS) TR.emit('catchup', { gapMs: gapMs, gathered: gathered }); }),
    /* a plant poked: its pitch; five in a rising line inside eight seconds is a tune */
    poked(freq, now) {
      guard(() => {
        pokes.push({ f: freq, t: now }); pokes = pokes.filter(x => now - x.t <= 8000).slice(-5);
        if (pokes.length === 5 && pokes.every((x, i) => i === 0 || x.f > pokes[i - 1].f)) { pokes = []; TR.emit('tune', {}); }
      });
    }
  };
}
