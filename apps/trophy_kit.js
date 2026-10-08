/* How a game writes its trophies: one line each. `t(id, name, tier, kind, desc, rule)`, the kind a letter as in the catalogue (P progression, S skill, E explore, C creative,
   M meta, J joke), the tier B, S or G, and `rule` one of the helpers below. A secret is `secret(...)` with a hint (a rumour about where to look, never the answer).
   Bekkedal's names and descriptions are `{ no, en }`, written with `bk(...)`. Pure data: kernel/trophies_defs.js imports every game's list, and `node scripts/check-trophies.mjs`
   holds all of them (ids unique and prefixed with their game, names in capitals and short, descriptions that are the exact condition). */
const KIND = { P: 'progress', S: 'skill', E: 'explore', C: 'creative', M: 'meta', J: 'joke' };

export const rule = {
  on: (event, when) => ({ on: event, when: when }),                 /* an event, and a predicate over what it carried */
  stat: (key, n) => ({ stat: { key: key, n: n } }),                 /* T.add / T.max reached n */
  sets: (key, size) => ({ sets: { key: key, size: size } }),        /* this many different things marked */
  streak: (key, n) => ({ streak: { key: key, n: n } }),             /* this many in a row */
  poll: (name, fn) => ({ poll: { name: name, fn: fn } }),           /* a question the game asks at a checkpoint */
  derive: fn => ({ derive: fn }),                                   /* a rule over the other trophies */
  count: (n, f) => ({ derive: T => T.count(f) >= n, progress: (a, T) => [Math.min(T.count(f), n), n] }),   /* this many trophies (of a kind) */
  award: () => ({ manual: true })                                    /* awarded by name (T.award(id)) */
};
export const t = (id, name, tier, kind, desc, r, o) => Object.assign({ id: id, name: name, tier: tier, kind: KIND[kind] || kind, desc: desc }, r || {}, o || {});
export const secret = (id, name, tier, kind, hint, desc, r, o) => t(id, name, tier, kind, desc, r, Object.assign({ secret: true, hint: hint }, o || {}));
/* a mirror of an achievement a game already awards itself: shown, paid nothing, counted nowhere */
export const mirror = (id, name, tier, desc, o) => t(id, name, tier, 'P', desc, {}, Object.assign({ legacy: true, pay: 0 }, o || {}));
/* a backfill reader may also hand back a counter (`stat`) or a member of a set (`inSet`) it found in a save: the ledger seeds it (silently) after the ids are awarded, so a bar that was 20 of 40 is 20 of 40 */
export const stat = (app, key, v) => 'stat:' + app + ':' + key + ':' + v;
export const inSet = (app, key, v) => 'set:' + app + ':' + key + ':' + v;
/* the text a trophy shows, in the language the ledger is set to ('en', or 'both' for a bilingual one) */
export const words = (v, lang) => v && typeof v === 'object' ? (lang === 'both' && v.no && v.no !== v.en ? v.en + ' / ' + v.no : v.en) : String(v == null ? '' : v);
export const plain = v => v && typeof v === 'object' ? v.en : String(v == null ? '' : v);
