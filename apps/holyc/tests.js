/* How a puzzle (or a step of a lesson) knows it is solved. A test is `{ name, run(R) }` and answers `{ ok, got, want, msg }`; `R` is a fresh run of
   the person's program (engine.js), so one test can click a button three times and the next starts from nothing. The helpers below are the
   whole vocabulary: what it printed, what a function gives back, what is on the board, what the stage says after a few clicks, and how the
   program is written (a loop, a function). Every puzzle's tests are held in node by holyc_check.js against its model answer, which has to pass them,
   and against its starting program, which must not. */
import { runProgram, stripped, uses, callsOf, walk } from './engine.js';

const trimEnd = s => String(s).replace(/\s+$/, '');
const norm = lines => lines.map(trimEnd).join('\n').replace(/\n+$/, '');
/* numbers that are the same to a millionth are the same: 98.6 is not 98.60000000000001 to a person */
const same = (g, w) => g === w || (typeof g === 'number' && typeof w === 'number' && Math.abs(g - w) < 1e-6);
const show = v => typeof v === 'string' ? '"' + v + '"' : String(v);
const res = (ok, got, want, msg) => ({ ok: !!ok, got: got, want: want, msg: msg || '' });

export const T = {
  /* the exact lines it prints */
  out: (lines, name) => ({ name: name || 'PRINTS EXACTLY WHAT IS ASKED', run: R => { const g = norm(R.out), w = norm(lines); return res(g === w, g, w); } }),
  outHas: (text, name) => ({ name: name || 'PRINTS ' + show(text), run: R => res(R.out.join('\n').indexOf(text) >= 0, R.out.join('\n'), text, 'it never prints ' + show(text)) }),
  outMatch: (re, name) => ({ name: name, run: R => res(re.test(R.out.join('\n')), R.out.join('\n'), String(re)) }),
  lines: (n, name) => ({ name: name || 'PRINTS ' + n + ' LINE' + (n === 1 ? '' : 'S'), run: R => res(R.out.length === n, R.out.length + ' lines', n + ' lines') }),
  /* a function you wrote, called with these arguments, answers this */
  call: (fn, args, want, name) => ({ name: name || fn + '(' + args.map(show).join(', ') + ') IS ' + show(want), run: R => {
    if (!R.session || !R.session.defined(fn)) return res(false, 'nothing', show(want), 'there is no function named ' + fn);
    let g; try { g = R.session.call(fn, args); } catch (e) { return res(false, 'an error', show(want), e.message); }
    return res(same(g, want), g, want);
  } }),
  /* many cases in one line of the list: [[args, want], ...] */
  cases: (fn, cs, name) => ({ name: name || fn + ' ANSWERS ' + cs.length + ' CASES', run: R => {
    if (!R.session || !R.session.defined(fn)) return res(false, 'nothing', '', 'there is no function named ' + fn);
    for (const c of cs) {
      let g; try { g = R.session.call(fn, c[0]); } catch (e) { return res(false, 'an error', show(c[1]), fn + '(' + c[0].map(show).join(', ') + '): ' + e.message); }
      if (!same(g, c[1])) return res(false, fn + '(' + c[0].map(show).join(', ') + ') = ' + show(g), fn + '(' + c[0].map(show).join(', ') + ') = ' + show(c[1]));
    }
    return res(true);
  } }),
  /* the 16 by 16 board: f(x, y) is the colour that cell should be */
  board: (f, name) => ({ name: name || 'THE BOARD IS RIGHT', run: R => {
    const want = []; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) want.push(f(x, y) & 15);
    const wrong = want.reduce((n, c, i) => n + (R.stage.grid[i] !== c ? 1 : 0), 0);
    const r = res(wrong === 0, R.stage.grid.slice(), want, wrong + ' of 256 squares are the wrong colour'); r.board = true; return r;
  } }),
  /* a person at the stage: steps are ['click', 'CAPTION'], ['type', 'HINT', 'text'], ['wait', ms]; then check(R) says true or what is wrong */
  scenario: (name, steps, check, o) => ({ name: name, scenario: true, o: o || {}, run: R => {
    for (const s of steps) {
      if (s[0] === 'click') { const r = R.stage.click(s[1]); if (!r.ok) return res(false, '', '', r.msg); }
      else if (s[0] === 'type') { if (!R.stage.type(s[1], s[2])) return res(false, '', '', 'there is no field called ' + s[1]); }
      else if (s[0] === 'wait') R.stage.advance(s[1]);
    }
    const c = check(R);
    return c === true ? res(true) : res(false, R.stage.labels().join(' | '), '', c || 'the stage is not what was asked');
  } }),
  /* how it is written */
  source: (re, name, msg) => ({ name: name, run: R => res(re.test(stripped(R.src)), '', '', msg || 'it is not written the way the puzzle asks') }),
  sourceNot: (re, name, msg) => ({ name: name, run: R => res(!re.test(stripped(R.src)), '', '', msg || 'that is not allowed here') }),
  uses: (kind, name, msg) => ({ name: name || 'USES ' + kind.toUpperCase(), run: R => res(R.ast && uses(R.ast, kind) > 0, '', '', msg || 'it does not use ' + kind) }),
  callsAtLeast: (fn, n, name) => ({ name: name || 'CALLS ' + fn + ' ' + n + ' TIMES OR MORE', run: R => res(R.ast && callsOf(R.ast, fn) >= n, R.ast ? callsOf(R.ast, fn) : 0, n) }),
  notes: (list, name) => ({ name: name || 'PLAYS THE RIGHT NOTES', run: R => { const g = R.stage.notes.map(x => x.n), ok = JSON.stringify(g) === JSON.stringify(list); return res(ok, g.join(' '), list.join(' '), 'it plays ' + g.length + ' notes, not ' + list.length); } }),
  /* how many times a function written by the person calls another: Quad has to use Double, not copy it out */
  insideCalls: (outer, inner, n, name) => ({ name: name || outer + ' USES ' + inner + (n > 1 ? ' ' + n + ' TIMES' : ''), run: R => {
    let f = null; if (R.ast) walk(R.ast, x => { if (x.k === 'fn' && x.name === outer) f = x; });
    const c = f ? callsOf(f, inner) : 0;
    return res(c >= n, c, n, f ? outer + ' calls ' + inner + ' ' + c + ' time(s)' : 'there is no function named ' + outer);
  } }),
  has: (fn, name) => ({ name: name, run: R => res(fn(R) === true, '', '', 'not yet') }),
  /* the program has to have run without an error: the one test every puzzle gets for free, and a lesson step may ask for */
  runs: () => ({ name: 'RUNS WITHOUT AN ERROR', run: R => res(!R.err, R.err ? R.err.message : '', '', R.err ? R.err.message : '') })
};

/* run `tests` against `src`; each test gets its own fresh run, and a program that does not even run fails them all with the reason */
export function runTests(HC, src, tests, o) {
  o = o || {};
  const first = runProgram(HC, src, { seed: o.seed || 1, sound: null });
  const results = tests.map((t, i) => {
    const R = i === 0 ? first : runProgram(HC, src, { seed: (o.seed || 1) + i * 7, sound: null });
    if (R.err) return { name: t.name, ok: false, msg: R.err.message, line: R.err.line };
    try { const r = t.run(R); return Object.assign({ name: t.name }, r); }
    catch (e) { return { name: t.name, ok: false, msg: 'the test itself tripped: ' + e.message }; }
  });
  return { ok: !first.err && results.every(r => r.ok), results: results, run: first, passed: results.filter(r => r.ok).length };
}
