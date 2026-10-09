/* The four of them give you things. CREDITS.EXE counts how many times it has been opened; the first time, each of the four people on it holds out one thing (set 1: a cookie, a bottle of
   water, a goose, a blueprint); the fifth time they hold out four more (set 2: four drinks). This is the book that keeps the count and what has been handed over: pure, with the storage and
   what a gift does handed in (kernel/gifts.js), so Node can hold the rules (scripts/check-gifts.mjs). */
export const KEY = 'templeos.gifts.v1';
export const VISITS_FOR_SET2 = 5;

/* who gives what; `set` is the visit it comes on, `drink` the Dave's-shelf id it adds to the bottle (the drinks are kernel/cos_gifts.js), `trophy` nothing here (the visit is the trophy's) */
export const GIVERS = ['biscu', 'gheghe', 'thea', 'teiteotei'];
export const GIFTS = [
  { id: 'cookie',    from: 'biscu',     set: 1, name: 'A COOKIE',               line: 'HERE. IT IS FOR THE STAR.',                    where: 'MAGEN: THE STAR CAN BE THE COOKIE. THE GARDEN GROWS COOKIEBLOOM.' },
  { id: 'borsec',    from: 'gheghe',    set: 1, name: 'APA PLATA BORSEC',       line: 'APA PLATA. BORSEC. AND CHEESE FOR THE ELEPHANT.', where: 'THE BOTTLE POURS IT. A CHEESE BUTTON IS ON THE DESKTOP.', drink: 'borsec' },
  { id: 'goose',     from: 'thea',      set: 1, name: 'A GOOSE',                line: 'HONK.',                                        where: 'THE GEESE ARE ON THE WATER, IN THE SKY AND IN THE ODD CORNER.' },
  { id: 'blueprint', from: 'teiteotei', set: 1, name: 'A BLUEPRINT',            line: 'I DREW YOU SOMETHING. IT IS IN THE COOK.',     where: 'THE COOK HAS A SHED NOW.' },
  { id: 'chips',     from: 'thea',      set: 2, name: 'LIQUID CHIPS',           line: 'IT IS CRISPS. BUT LIQUID.',                    where: 'THE BOTTLE', drink: 'chips' },
  { id: 'biscubeer', from: 'biscu',     set: 2, name: 'BISCU\'S BEER',          line: 'THE MAN ON THE LABEL IS A FRIEND.',            where: 'THE BOTTLE', drink: 'biscubeer' },
  { id: 'morgan',    from: 'gheghe',    set: 2, name: 'CAPTAIN MORGAN',         line: 'YO HO HO.',                                    where: 'THE BOTTLE', drink: 'morgan' },
  { id: 'potion',    from: 'teiteotei', set: 2, name: 'THE HOMEMADE POTION',    line: 'I DO NOT KNOW HOW STRONG IT IS EITHER.',       where: 'THE BOTTLE', drink: 'potion' }
];
export const SETS = { 1: GIFTS.filter(g => g.set === 1), 2: GIFTS.filter(g => g.set === 2) };
export const giftOf = id => GIFTS.find(g => g.id === id) || null;

const blank = () => ({ visits: 0, given: {} });

/* io: { get() -> string|null, set(string) }  hooks: { onGive(gift) } */
export function createGifts(io, hooks) {
  hooks = hooks || {};
  let st = blank();
  try { const v = JSON.parse(io.get()); if (v && typeof v === 'object') { st.visits = Math.max(0, Math.floor(+v.visits || 0)); GIFTS.forEach(g => { if (v.given && v.given[g.id]) st.given[g.id] = true; }); } } catch (e) { st = blank(); }
  const save = () => { try { io.set(JSON.stringify({ v: 1, visits: st.visits, given: st.given })); } catch (e) { /* kept for this sitting */ } };
  const has = id => !!st.given[id];
  const missing = set => SETS[set].filter(g => !has(g.id));
  return {
    get visits() { return st.visits; },
    has,
    given: () => GIFTS.filter(g => has(g.id)),
    /* one more look at the credits: counts it, and says which set is held out (0: none) */
    visit() {
      st.visits++;
      /* the first set is held out until every hand of it has given (a window closed in the middle gives the rest at once, but if the store was cut short it is held out again, only what is left),
         the second on the fifth visit or the first one after it */
      const set = missing(1).length ? 1 : (st.visits >= VISITS_FOR_SET2 && missing(2).length) ? 2 : 0;
      save();
      return { n: st.visits, set, items: set ? missing(set) : [] };
    },
    /* a hand puts its thing in yours: true the first time only */
    give(id) {
      const g = giftOf(id);
      if (!g || has(id)) return false;
      st.given[id] = true; save();
      if (hooks.onGive) { try { hooks.onGive(g); } catch (e) { /* a gift must never get in the way of the next one */ } }
      return true;
    },
    /* what is left of a set when the window closes before the hands are done: it is yours all the same */
    finish(set) { return missing(set).map(g => g.id).filter(id => this.give(id)); },
    missing,
    reset() { st = blank(); save(); }
  };
}
