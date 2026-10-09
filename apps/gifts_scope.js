/* How an app hears of the credits' gifts without importing the kernel: `gifts()` is window.Gifts, or a stand-in that has been given nothing (the same way trophy_scope.js does nothing,
   quietly, if the ledger is gone). `gifts().has('goose')`; `gifts().onGiven(fn)` runs fn(id) when a hand gives something (and returns what undoes it). */
const NONE = { has: () => false, given: () => [], visits: () => 0 };
export const gifts = () => (typeof window !== 'undefined' && window.Gifts) || NONE;
export function onGiven(fn) {
  if (typeof window === 'undefined') return () => {};
  const h = ev => { try { fn(ev.detail && ev.detail.id); } catch (e) { /* an app that has gone */ } };
  window.addEventListener('gift-given', h);
  return () => window.removeEventListener('gift-given', h);
}
