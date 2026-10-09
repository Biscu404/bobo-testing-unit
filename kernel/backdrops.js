/* Dave's backdrops that a blackout has shown you. A picture of the blackout (kernel/blackout.js) is on the
   shop's BACKDROPS shelf only once a blackout has dealt it: until then it is not there at all. What has been
   seen is a set of ids with the time each was first seen, in localStorage (kernel/durable.js mirrors it). */
const KEY = 'templeos.backdrops.v1';
let seen = null;

function load() {
  if (seen) return seen;
  try { seen = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { seen = {}; }
  if (!seen || typeof seen !== 'object' || Array.isArray(seen)) seen = {};
  return seen;
}

export const Backdrops = {
  seen(id) { return !!load()[id]; },
  /* the blackout dealt this picture: the first time, it is written down and the shop hears of it */
  mark(id) {
    if (!id || this.seen(id)) return;
    load()[id] = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) { /* no storage: seen for this visit only */ }
    try { window.dispatchEvent(new CustomEvent('backdrop-seen', { detail: { id } })); } catch (e) { /* no window */ }
  },
  count() { return Object.keys(load()).length; }
};
