/* THE STAGE: what a HolyC program can put on the screen in HOLYC.EXE. Pure data and functions (no DOM, no sound of its own), so
   `node apps/holyc/holyc_check.js` can run every lesson and every puzzle against it; stage_view.js draws it, sounds.js plays it.
   A program makes things with Label, Button, Field and Bar (each hands back a number, its id), draws on a 16 by 16 board with
   Pixel and Fill (colours are the machine's sixteen, by their TempleOS names: RED, LTBLUE, YELLOW...), plays Note and Rest, and hooks
   a function to a button by writing the function's name in quotes: Button("PRESS", "Hello"). A click, a timer (Every) or a Note later is
   the machine calling the program's own function again, through the session hcRun hands back. Nothing here can reach outside the lab. */
export const GRID = 16;
const str = v => v == null ? '' : typeof v === 'number' && !Number.isInteger(v) ? String(Math.round(v * 1e6) / 1e6) : String(v);
const num = v => Number(v) || 0;
const clip = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const MAX_ITEMS = 24, MAX_TIMERS = 4, MIN_EVERY = 100;

export function createStage(o) {
  o = o || {};
  const S = { items: [], grid: new Array(GRID * GRID).fill(0), notes: [], timers: [], now: 0, cursor: 0, warnings: [], clicks: 0, beeps: 0,
    offBoard: 0, painted: 0, session: null, err: null, rand: o.rand || Math.random, sound: o.sound || {}, listeners: [], errors: [] };
  let nextId = 1, nextTimer = 1;
  const changed = () => { S.listeners.forEach(f => { try { f(); } catch (e) { /* a view that is gone */ } }); };
  S.onChange = f => { S.listeners.push(f); };

  const add = it => {
    if (S.items.length >= MAX_ITEMS) { S.warnings.push('THE STAGE IS FULL: ' + MAX_ITEMS + ' THINGS AT MOST.'); return 0; }
    it.id = nextId++; it.color = it.color == null ? -1 : it.color; S.items.push(it); changed(); return it.id;
  };
  const get = id => S.items.find(i => i.id === Math.trunc(num(id))) || null;
  /* an id, or the words on it: how a test (and a person reading one) says which thing */
  S.find = key => typeof key === 'number' ? get(key) : S.items.find(i => (i.text || i.hint || '').toUpperCase() === String(key).toUpperCase()) || null;

  S.builtins = {
    Label: a => add({ kind: 'label', text: str(a[0]) }),
    Button: a => add({ kind: 'button', text: str(a[0]), fn: str(a[1]) }),
    Field: a => add({ kind: 'field', hint: str(a[0]), value: '' }),
    Bar: a => add({ kind: 'bar', max: Math.max(1, num(a[0]) || 100), value: 0 }),
    SetText: a => { const it = get(a[0]); if (it && it.kind !== 'bar') { if (it.kind === 'field') it.value = str(a[1]); else it.text = str(a[1]); changed(); } return 0; },
    GetText: a => { const it = get(a[0]); return it ? (it.kind === 'field' ? it.value : it.text || '') : ''; },
    GetNum: a => { const it = get(a[0]); return it ? num(it.kind === 'field' ? it.value : it.text) : 0; },
    SetBar: a => { const it = get(a[0]); if (it && it.kind === 'bar') { it.value = clip(num(a[1]), 0, it.max); changed(); } return 0; },
    Color: a => { const it = get(a[0]); if (it) { it.color = clip(Math.trunc(num(a[1])), 0, 15); changed(); } return 0; },
    Pixel: a => {
      const x = Math.trunc(num(a[0])), y = Math.trunc(num(a[1]));
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) { S.offBoard++; return 0; }
      S.grid[y * GRID + x] = Math.trunc(num(a[2])) & 15; S.painted++; changed(); return 0;
    },
    Fill: a => { S.grid.fill(Math.trunc(num(a[0])) & 15); S.painted++; changed(); return 0; },
    Clear: () => { S.grid.fill(0); changed(); return 0; },
    /* Note(60, 300): the middle C of a piano for a third of a second, and the next Note starts when this one ends */
    Note: a => {
      const n = Math.trunc(num(a[0])), ms = clip(Math.trunc(num(a[1])) || 250, 20, 4000);
      S.notes.push({ n: n, ms: ms, t: S.cursor });
      if (S.sound.note) S.sound.note(n, ms, S.cursor / 1000);
      S.cursor += ms; return 0;
    },
    Rest: a => { S.cursor += clip(Math.trunc(num(a[0])), 0, 4000); return 0; },
    Beep: () => { S.beeps++; if (S.sound.beep) S.sound.beep(); return 0; },
    Every: a => {
      if (S.timers.length >= MAX_TIMERS) { S.warnings.push('FOUR TIMERS AT MOST. USE Stop(id) ON ONE FIRST.'); return 0; }
      const t = { id: nextTimer++, ms: Math.max(MIN_EVERY, Math.trunc(num(a[0]))), fn: str(a[1]), due: 0 };
      t.due = S.now + t.ms; S.timers.push(t); return t.id;
    },
    Stop: a => { S.timers = S.timers.filter(t => t.id !== Math.trunc(num(a[0]))); return 0; },
    Rand: () => S.rand(),
    RandU16: () => Math.floor(S.rand() * 65536)
  };

  /* the program has run: from now on its functions are called by the stage */
  S.attach = session => {
    S.session = session;
    S.items.forEach(i => { if (i.kind === 'button' && !session.defined(i.fn)) S.warnings.push('THE BUTTON "' + i.text + '" CALLS ' + (i.fn || '(NOTHING)') + ', AND THERE IS NO FUNCTION OF THAT NAME.'); });
    S.timers.forEach(t => { if (!session.defined(t.fn)) S.warnings.push('Every CALLS ' + t.fn + ', AND THERE IS NO FUNCTION OF THAT NAME.'); });
  };
  const call = (fn, what) => {
    if (!S.session || !S.session.defined(fn)) return { ok: false, msg: 'there is no function named ' + fn };
    S.cursor = 0;
    try { S.session.call(fn, []); changed(); return { ok: true }; }
    catch (e) { const err = { message: e && e.message || String(e), line: e && e.line || 0, where: what || fn }; S.err = err; S.errors.push(err); changed(); return { ok: false, msg: err.message, err: err }; }
  };
  S.click = key => {
    const it = S.find(key);
    if (!it || it.kind !== 'button') return { ok: false, msg: 'no button called ' + key };
    S.clicks++; if (S.sound.press) S.sound.press();
    return call(it.fn, it.text);
  };
  S.type = (key, text) => { const it = S.find(key); if (!it || it.kind !== 'field') return false; it.value = String(text); changed(); return true; };
  /* time passes: every timer that has come due is called, once for each time it came due */
  S.advance = ms => {
    const end = S.now + ms;
    for (let guard = 0; guard < 400; guard++) {
      const due = S.timers.filter(t => t.due <= end).sort((a, b) => a.due - b.due)[0];
      if (!due) break;
      S.now = due.due; due.due += due.ms;
      const r = call(due.fn, 'Every');
      if (!r.ok) { S.timers = S.timers.filter(t => t !== due); }
    }
    S.now = end;
  };
  S.labels = () => S.items.filter(i => i.kind === 'label').map(i => i.text);
  S.reset = () => { S.items = []; S.grid.fill(0); S.notes = []; S.timers = []; S.cursor = 0; S.warnings = []; S.session = null; S.err = null; changed(); };
  return S;
}
