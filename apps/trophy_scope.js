/* An app's handle on the trophies: `const T = trophies('sweeper')`, then `T.emit('win', {...})`, `T.mark('wins', 'e')`, `T.add`, `T.max`, `T.streak`, `T.hold()` and `T.release()`
   around a run, `T.drain()` for the ids earned since it was last asked (an end screen lists them), `T.name(id)`. It talks to window.Trophies if there is one and does nothing,
   quietly, if there is not (a trophy must never get into a game, and a game must run with the ledger gone). */
const live = () => { try { return window.Trophies || null; } catch (e) { return null; } };
const safely = (f, d) => { try { return f(); } catch (e) { return d; } };

export function trophies(app) {
  const via = (name, ...a) => safely(() => { const T = live(); return T ? T.scope(app)[name](...a) : undefined; });
  return {
    emit: (name, p) => via('emit', name, p) || [],
    add: (k, n) => via('add', k, n), max: (k, v) => via('max', k, v), mark: (k, v) => via('mark', k, v), streak: (k, ok) => via('streak', k, ok),
    check: n => via('check', n), award: id => via('award', id),
    stat: k => via('stat', k) || 0, has: (k, v) => !!via('has', k, v),
    hold: () => safely(() => { const T = live(); if (T) T.hold(); }), release: () => safely(() => { const T = live(); if (T) T.release(); }),
    drain: () => via('drain') || [],
    /* the trophy's name and what it pays, for an end screen's "TROPHY: <NAME>" row */
    row: id => safely(() => { const T = live(), d = T && T.get(id); return d ? { id: id, name: T.nameOf ? T.nameOf(d) : String(d.name), pay: d.pay || 0, tier: d.tier } : null; }, null)
  };
}
