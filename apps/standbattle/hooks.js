/* The hook bus (spec 2). The fight announces what happens in it by name and anything may listen: the sound, the effects, the juice, the training display and the trophy
   ledger all hear a fight this way and none of them can change it (they get the payload and nothing to write to). A hook name is declared here and nowhere else;
   `fire` and `on` throw at once on a name that is not in the table, so a typo in a listener fails when it is wired and not when the thing it was waiting for happens.

   The hooks of the old belt-scroller that rewrote numbers (effects that mutated a context, queries that reduced a value) are gone with the Fragments and Relics that used
   them: in the arcade fighter a number is what the move's row says (moves.js), and nothing in a fight is rewritten by anything else. */

export const EVENT_HOOKS = [
  'onSwing', 'onHit', 'onBlock', 'onWhiff', 'onSidestep', 'onSidestepDodge', 'onThrow', 'onThrowBreak', 'onLaunch', 'onBounce',
  'onWallSplat', 'onKnockdown', 'onWake', 'onCombo', 'onSpecial', 'onProjectile', 'onDetonate',
  'onRoundStart', 'onFight', 'onKO', 'onRoundEnd', 'onMatchEnd'
];

const KNOWN = {};
EVENT_HOOKS.forEach(h => { KNOWN[h] = true; });

export const hasHook = name => !!KNOWN[name];

export function createDispatcher() {
  const listeners = {};
  const check = (name, api) => { if (!KNOWN[name]) throw new Error('[hooks] Unknown hook "' + name + '" referenced via bus.' + api + '() — declare it in hooks.js first.'); };
  return {
    hasHook,
    on(name, fn) { check(name, 'on'); (listeners[name] || (listeners[name] = [])).push(fn); },
    off(name, fn) {
      const arr = listeners[name], i = arr ? arr.indexOf(fn) : -1;
      if (i >= 0) arr.splice(i, 1);
    },
    fire(name, payload) { check(name, 'fire'); const arr = listeners[name]; if (arr) for (let k = 0; k < arr.length; k++) arr[k](payload); }
  };
}
