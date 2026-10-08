/* Generic status system — GDD §3.10, tech §2.6. Statuses are data; the engine only ticks them. `entity.statuses` is on every fighter (fighter.js) and is ticked once per sim
   frame by fight.js.

   Schema per status definition:
     { id, name, stackRule, maxStacks, durationFrames, tickRateFrames, tags, onTick(entity, instance), onExpire(entity, instance) }

   Stack rules (tech §2.6): 'stack' adds stacks and refreshes the duration; 'refresh' just resets the duration (stacks clamp to maxStacks); 'independent' keeps every application
   as its own instance. A status instance is `{ id, stacks, timer, tickTimer, hitsTaken }`.

   In the arcade rework two fighters use them (spec 2): Killer Queen's BOMB (a mark that a later command blows up, or that fizzles) and Angelo's DROWNING (a little damage a second). */

import { applyDamage } from './fighter.js';

export const STACK_RULES = { STACK: 'stack', REFRESH: 'refresh', INDEPENDENT: 'independent' };

const NO_EXPIRY = Infinity;

export const STATUS_DEFS = {
  bomb: {
    id: 'bomb', name: 'Bomb', stackRule: STACK_RULES.REFRESH, maxStacks: 1,
    durationFrames: 300,                       /* five seconds to blow it up */
    tickRateFrames: 0, tags: ['bomb', 'mark'],
    onExpire() {}                              /* it fizzles */
  },
  drown: {
    id: 'drown', name: 'Drowning', stackRule: STACK_RULES.STACK, maxStacks: 3,
    durationFrames: 300, tickRateFrames: 60, tags: ['dot'],
    onTick(entity, instance) { applyDot(entity, 2 * instance.stacks); }   /* 2 a second per stack, at most 30 in all */
  }
};

/* Routes through fighter.js's applyDamage, the one HP choke point. A tick that kills is seen by fight.js, which reads HP every frame. */
function applyDot(entity, amount) {
  if (amount <= 0) return;
  applyDamage(entity, amount);
}

/* Applies `stacks` of `statusId` to `entity`, honouring the definition's
   stack rule. Throws on an unknown id -- content_registry.js's validator
   is what should have caught this before any content reached here; a
   throw at apply-time is the last-resort guard. */
export function applyStatus(entity, statusId, stacks) {
  const def = STATUS_DEFS[statusId];
  if (!def) throw new Error(`[status] Unknown status "${statusId}"`);
  const amount = stacks == null ? 1 : stacks;

  if (def.stackRule === STACK_RULES.INDEPENDENT) {
    entity.statuses.push({ id: statusId, stacks: amount, timer: def.durationFrames, tickTimer: def.tickRateFrames, hitsTaken: 0 });
    return;
  }

  let inst = entity.statuses.find(s => s.id === statusId);
  if (!inst) {
    inst = { id: statusId, stacks: 0, timer: def.durationFrames, tickTimer: def.tickRateFrames, hitsTaken: 0 };
    entity.statuses.push(inst);
  }
  if (def.stackRule === STACK_RULES.STACK) {
    inst.stacks = Math.min(def.maxStacks || Infinity, inst.stacks + amount);
  } else { // refresh
    inst.stacks = Math.min(def.maxStacks || Infinity, Math.max(inst.stacks, amount));
  }
  inst.timer = def.durationFrames; // both stack/refresh rules refresh duration on (re)application
}

export function removeStatus(entity, statusId) {
  const i = entity.statuses.findIndex(x => x.id === statusId);
  if (i >= 0) entity.statuses.splice(i, 1);
  return i >= 0;
}

export function hasStatus(entity, statusId) {
  return !!(entity.statuses && entity.statuses.some(s => s.id === statusId));
}

export function statusHasTag(entity, tag) {
  return !!(entity.statuses && entity.statuses.some(s => {
    const def = STATUS_DEFS[s.id];
    return def && def.tags.includes(tag);
  }));
}

/* One sim frame of status bookkeeping for one entity: ticks, then expiry.
   Call once per frame per entity (combat.js, after the player/enemy step). */
export function stepStatuses(entity) {
  if (!entity.statuses || !entity.statuses.length) return;
  for (let i = entity.statuses.length - 1; i >= 0; i--) {
    const inst = entity.statuses[i];
    const def = STATUS_DEFS[inst.id];
    if (!def) { entity.statuses.splice(i, 1); continue; } // defensive: never trust stale data across a hot-reload
    if (def.tickRateFrames > 0) {
      inst.tickTimer -= 1;
      if (inst.tickTimer <= 0) {
        inst.tickTimer = def.tickRateFrames;
        if (def.onTick) def.onTick(entity, inst);
      }
    }
    if (def.durationFrames !== NO_EXPIRY) {
      inst.timer -= 1;
      if (inst.timer <= 0) {
        if (def.onExpire) def.onExpire(entity, inst);
        entity.statuses.splice(i, 1);
      }
    }
  }
}
