/* Where the Cook tells the trophies what happened (the list is trophies.js). A bench is held (no card in the middle of a pour) from the moment it starts to the moment it is won; the
   kid's first words are marked as he says them; the Cook's own ledger is mirrored as it is earned. None of it can throw into the game. */
import { trophies } from '../trophy_scope.js';
import { KID_TOUR } from './trophies.js';

const TR = trophies('cook');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export function createCalls() {
  let holding = false, heated = false, cooled = false;
  const free = () => { if (holding) { holding = false; TR.release(); } };
  return {
    /* a bench begins (or begins again): nothing has been heated or cooled in it yet */
    begin() { guard(() => { heated = false; cooled = false; if (!holding) { holding = true; TR.hold(); } }); },
    /* the Cook's own ledger earned something: its mirror is lit, quietly (the banner in the game is the announcement) */
    mirrored: id => guard(() => TR.award('ck_' + id, true)),
    said(tag) { guard(() => { if (KID_TOUR.indexOf(tag) >= 0) TR.mark('said', tag); if (tag === 'idle') TR.emit('idle', {}); }); },
    op(which) { guard(() => { if (which === 'heat') heated = true; else cooled = true; if (heated && cooled) { heated = false; cooled = false; TR.emit('thermo', {}); } }); },
    wall: () => guard(() => TR.emit('wall', {})),
    ruined: why => guard(() => TR.mark('ruinCauses', why === 'caught' ? 'sweep' : 'tile')),
    won(L, steps, resets, undos, ruins, nudged) {
      guard(() => {
        if (undos === 0 && steps <= L.par) TR.mark('noUndo', L.id);
        TR.emit('win', { lv: L.id, steps: steps, par: L.par, resets: resets, undos: undos, ruins: ruins, nudged: !!nudged });
      });
      free();
    },
    stop: free
  };
}
