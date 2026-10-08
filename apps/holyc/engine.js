/* Running a program for the lab, and checking one. Pure: `HC` is the compiler (window.HolyC in the lab, the kernel's pure core in the check), so
   everything that decides whether a puzzle is solved can be run in Node against every model answer and every starting program.
   runProgram: read the source strictly (a missing ; is an error and says the line), run it against a fresh stage, keep what it printed, what
   went wrong (with its line), and, if asked, a trace of every statement for WATCH IT RUN. Dice are seeded so a test is repeatable. */
import { createStage } from './stage.js';

export const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const errOf = e => ({ message: e && e.holyc ? e.message : 'the machine tripped: ' + (e && e.message), line: (e && e.line) || 0, holyc: !!(e && e.holyc) });

export function runProgram(HC, src, o) {
  o = o || {};
  const stage = createStage({ rand: o.rand || seeded(o.seed || 1), sound: o.sound });
  const R = { src: src, out: [], err: null, stage: stage, session: null, ast: null, trace: [], traceCut: false, ok: false };
  try { R.ast = HC.parse(HC.lex(src), { strict: true }); } catch (e) { R.err = errOf(e); return R; }
  const hooks = {
    strict: true, rand: stage.rand, builtins: stage.builtins, maxSteps: o.maxSteps || 200000,
    session: s => { R.session = s; stage.attach(s); }
  };
  if (o.trace) hooks.trace = (line, vars, kind) => { if (R.trace.length < 400) R.trace.push({ line: line, vars: vars(), kind: kind, out: R.out.length }); else R.traceCut = true; };
  try { HC.run(R.ast, line => { R.out.push(line); if (o.onOut) o.onOut(line); }, null, hooks); R.ok = true; }
  catch (e) { R.err = errOf(e); }
  return R;
}

/* what a program is made of, without its comments and without what is inside its strings: for tests that ask "did you use a loop?" */
export function stripped(src) {
  return String(src).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ').replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}
export function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(n => walk(n, fn)); return; }
  if (node.k) fn(node);
  Object.keys(node).forEach(k => { if (k !== 'line' && typeof node[k] === 'object') walk(node[k], fn); });
}
export const uses = (ast, kind) => { let n = 0; walk(ast, x => { if (x.k === kind) n++; }); return n; };
/* every call of a function by name, in order */
export const callsOf = (ast, name) => { let n = 0; walk(ast, x => { if (x.k === 'call' && x.callee.k === 'var' && x.callee.name === name) n++; }); return n; };
