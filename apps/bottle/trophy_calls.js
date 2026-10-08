/* Where the bottle tells the trophies what happened (the list is trophies.js). The app says a measure was poured and drunk; the journey itself (how drunk, for how long, whether it ever
   went over) belongs to kernel/drunk.js, which keeps a stage watch and feeds it every frame of its own loop, so a limit that is reached and then drained away is seen even if the
   window is closed in between. None of it can throw into the game. */
import { trophies } from '../trophy_scope.js';

const TR = trophies('bottle');
const guard = f => { try { return f(); } catch (e) { return undefined; } };
export const GLOW_SECS = 300, GLOW_DRINKS = 3;

export const poured = () => guard(() => TR.emit('pour', {}));
export const drank = (drinkId, units) => guard(() => { TR.mark('tasted', drinkId); if (drinkId === 'cordial') TR.add('cordial'); TR.emit('drink', { drink: drinkId, units: units }); });
export const scene = id => guard(() => TR.mark('scenes', id));
export const blackedOut = () => guard(() => TR.emit('blackout', {}));

/* the journey, watched: `step` is called once a frame with the stage the drunk is at and whether the lights are out; `measure` once for every measure with something in it */
export function createStageWatch(emit) {
  emit = emit || ((n, p) => TR.emit(n, p));
  let glowSecs = 0, glowDrinks = 0, peaked = false, glowTold = false;
  return {
    measure() { glowDrinks++; },
    step(dt, stage, out) {
      guard(() => {
        if (out) return;
        if (stage === 'WARM' || stage === 'TIPSY') glowSecs += dt;
        else if (stage !== 'SOBER') { glowSecs = 0; glowDrinks = 0; glowTold = false; }       /* gone past a glow: the five minutes begin again */
        if (!glowTold && glowSecs >= GLOW_SECS && glowDrinks >= GLOW_DRINKS) { glowTold = true; emit('glow', {}); }
        if (stage === 'ABOUT TO GO') peaked = true;
        else if (stage === 'SOBER' && peaked) { peaked = false; emit('limit', {}); }
      });
    },
    /* the lights went out: whatever was being built is gone */
    out() { peaked = false; glowSecs = 0; glowDrinks = 0; glowTold = false; }
  };
}
