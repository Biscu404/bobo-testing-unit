/* Where the elephant tells the trophies what happened (the list is trophies.js). Some of it is in his window (what he says, where he is), the rest is the desktop elephant
   (kernel/pet.js: out, put back, sleep, woken, picked up, the door), which calls the same few functions. None of it can throw into either. */
import { trophies } from '../trophy_scope.js';
import { GENT, SLOTS } from './trophies.js';

const TR = trophies('elephant');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export const talked = () => guard(() => TR.emit('talk', {}));
export const heard = i => guard(() => TR.mark('heard', i));
export const placed = i => guard(() => TR.mark('places', i));
export const event = name => guard(() => TR.emit(name, {}));
/* what he wears and what is in the wardrobe, looked at whenever either changes (a Pet.onChange, a purchase) */
export function dressed(wear, ownedAll) {
  guard(() => {
    const ids = SLOTS.map(s => wear[s]).filter(Boolean);
    TR.emit('wear', { any: ids.length > 0, gent: GENT.every(id => ids.indexOf(id) >= 0), five: ids.length === SLOTS.length, owned: !!ownedAll });
  });
}
