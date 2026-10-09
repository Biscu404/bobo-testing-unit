/* window.Gifts: what the four people on the credits screen have given you (kernel/gifts_core.js is the book, this is the machine's side of it). A gift that is a drink is put on
   Dave's shelf as something you own (kernel/cos_gifts.js); every gift is announced (a `gift-given` event and a `gifts-changed` one) so an app that has been waiting for it, the Magen
   star that can be a cookie, the Garden's new flower, the geese, the cheese button, the Cook's shed, hears of it at once. An app asks `window.Gifts.has('goose')` (through
   apps/gifts_scope.js) and never imports this. */
import { createGifts, KEY, GIFTS, SETS } from './gifts_core.js';
import { sys } from './trophy_hook.js';

const io = {
  get: () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
  set: v => { try { localStorage.setItem(KEY, v); } catch (e) { /* kept for this sitting */ } }
};
const tell = (name, detail) => { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) { /* nobody is listening */ } };

const core = createGifts(io, {
  onGive(g) {
    if (g.drink && window.Cos) window.Cos.grant('drink', g.drink);
    tell('gift-given', { id: g.id, from: g.from });
    tell('gifts-changed', { id: g.id });
  }
});

export const Gifts = {
  GIFTS, SETS,
  has: id => core.has(id),
  given: () => core.given(),
  visits: () => core.visits,
  /* the credits screen was opened: counted, and which set is held out (the trophy for looking at them five times is told here) */
  visit() {
    const v = core.visit();
    try { sys.emit('credits', { n: v.n }); } catch (e) { /* never */ }
    tell('gifts-changed', { visit: v.n });
    return v;
  },
  give: id => core.give(id),
  finish: set => core.finish(set),
  missing: set => core.missing(set),
  /* at boot: a drink that was given is on the shelf (the shelf may have been reset since) */
  reset() { core.reset(); tell('gifts-changed', {}); },
  boot() { core.given().forEach(g => { if (g.drink && window.Cos) window.Cos.grant('drink', g.drink); }); }
};
window.Gifts = Gifts;
