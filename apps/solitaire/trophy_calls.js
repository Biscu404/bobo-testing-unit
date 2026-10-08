/* Where Solitaire tells the trophies what happened (the list is trophies.js). A tally is one deal: its clock, which lane was finished first, whether the offer of SEND THEM ALL HOME
   was used. index.js calls these; none of them can throw into the game. */
import { trophies } from '../trophy_scope.js';

const TR = trophies('solitaire');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export const newTally = () => ({ t0: Date.now(), firstLane: null, auto: false, ready: false });

/* a deal thrown away, or left when the window closes, is a break in a streak of wins */
export const abandoned = (tally, moves) => guard(() => { if (moves > 0) TR.streak('wins', false); });
export const moved = n => guard(() => TR.emit('move', { n: n }));

/* each frame: the first foundation to reach its king, and the offer to send them all home */
export function watch(tally, found, readyNow) {
  guard(() => {
    if (tally.firstLane == null) for (let f = 0; f < found.length; f++) if (found[f].length >= 13) { tally.firstLane = f; break; }
    if (readyNow && !tally.ready) { tally.ready = true; TR.emit('auto-ready', {}); }
  });
}
export const won = (tally, moves, redeals, back) => guard(() => {
  TR.add('wins');
  TR.mark('backs', back);
  if (tally.firstLane != null) TR.mark('firstLane', tally.firstLane);
  TR.streak('wins', true);
  TR.emit('win', { moves: moves, redeals: redeals, secs: (Date.now() - tally.t0) / 1000, auto: tally.auto, back: back, firstLane: tally.firstLane });
});
export const cascadeEnded = () => guard(() => TR.emit('cascade', {}));
