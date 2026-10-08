/* HolyC, the evaluator: a tree walker over holyc_parse.js's tree. Pure (the machine's own builtins come in through `hooks.builtins`).
   What it was not, and is now: a variable lives in the block that declared it (a function's own variables are its own, a loop's counter is the
   loop's), an integer is an integer (`I64 x = 7 / 2` is 3, as it is in the real compiler; a float is made by a point or an F64), a run-time error says
   its line, and a program can be *watched*: `hooks.trace(line, vars)` is told before every statement. `hooks.session(api)` is handed, once the
   program has run, a way to call its functions again later: that is how the lab's buttons call back into what you wrote.
   hooks: strict (undeclared names and divide by zero are errors), maxSteps, builtins, trace, session, rand, dirNames, godDoodle. */
import { HolyCError } from './holyc_lex.js';
import { INT_TYPES } from './holyc_parse.js';
import { hcFormat, CONSTANTS, PURE } from './holyc_lib.js';

const HC_STEPS = 400000, MAX_DEPTH = 150;
const FLOATY = { Sqrt: 1, Sin: 1, Cos: 1, Pow: 1, Rand: 1 };
const TYPES_OF = new WeakMap();                       /* the declared types of a persistent global scope (the terminal keeps one across lines) */

export { hcFormat };
export function hcRun(ast, out, env, hooks) {
  hooks = hooks || {};
  const strict = !!hooks.strict, maxSteps = hooks.maxSteps || HC_STEPS;
  const globals = env || Object.create(null);
  if (!TYPES_OF.has(globals)) TYPES_OF.set(globals, Object.create(null));
  const gscope = { vars: globals, types: TYPES_OF.get(globals), parent: null };
  const fns = Object.create(null);
  let steps = 0, depth = 0, buffer = '';

  const emit = s => {
    buffer += s;
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) { out(buffer.slice(0, nl)); buffer = buffer.slice(nl + 1); }
  };
  const flush = () => { if (buffer) { out(buffer); buffer = ''; } };
  const io = { emit: emit, hooks: hooks };
  const err = (m, line) => new HolyCError(m, line || 0);

  function Ret(v) { this.v = v; }
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };

  const BUILTIN = Object.assign({}, PURE, {
    Exit: () => { throw new Ret(0); },
    Panic: a => { throw err('Panic: ' + (a[0] || 'called by hand')); },
    DebuggerEnter: () => { throw err('DebuggerEnter'); }
  }, hooks.builtins || {});

  /* ---- names ---------------------------------------------------------------------------------------------------------------- */
  const find = (scope, name) => { for (let s = scope; s; s = s.parent) if (name in s.vars) return s; return null; };
  const child = scope => ({ vars: Object.create(null), types: Object.create(null), parent: scope });
  const typeOf = (scope, name) => { const s = find(scope, name); return s ? s.types[name] : undefined; };
  function coerce(s, name, v) {
    const ty = s.types[name];
    if (typeof v === 'number' && ty && !s.types['*' + name]) {
      if (ty === 'Bool') return v ? 1 : 0;
      if (INT_TYPES[ty]) return Math.trunc(v);
    }
    return v;
  }
  /* what a program can see from here: its own variables over the globals, with no functions and nothing that is not a plain value */
  function visible(scope) {
    const o = {};
    const chain = []; for (let s = scope; s; s = s.parent) chain.unshift(s);
    chain.forEach(s => { Object.keys(s.vars).forEach(k => { const v = s.vars[k]; if (k.indexOf('__') !== 0 && (typeof v === 'number' || typeof v === 'string')) o[k] = v; }); });
    return o;
  }
  /* is this expression a float? (a number written with a point, an F64 variable, Sqrt...): then `/` does not truncate */
  function floaty(n, scope) {
    switch (n.k) {
      case 'num': return !!n.float;
      case 'var': return typeOf(scope, n.name) === 'F64';
      case 'call': return n.callee.k === 'var' && !!FLOATY[n.callee.name];
      case 'neg': return floaty(n.e, scope);
      case 'bin': return floaty(n.l, scope) || floaty(n.r, scope);
      default: return false;
    }
  }

  function callFn(name, args, line) {
    const f = fns[name];
    if (f) {
      if (depth >= MAX_DEPTH) throw err(name + ' keeps calling itself and never stops (too deep)', line);
      depth++;
      const sc = child(gscope);
      f.params.forEach((pn, i) => {
        sc.types[pn] = f.ptypes[i] || undefined;                                   /* a typed parameter is that type: an F64 keeps its fraction, an I64 loses it */
        sc.vars[pn] = coerce(sc, pn, i < args.length ? args[i] : 0);
      });
      let r = 0;
      try { execBlock(f.body.body, sc); }
      catch (e) { if (e instanceof Ret) r = e.v; else { depth--; throw e; } }
      depth--;
      return typeof r === 'number' && INT_TYPES[f.ret] ? Math.trunc(r) : r;
    }
    if (name in BUILTIN) return BUILTIN[name](args, io);
    throw err('undefined function "' + name + '"', line);
  }

  function evalNode(n, scope) {
    if (++steps > maxSteps) throw err('ran too long: the loop does not end', n.line);
    switch (n.k) {
      case 'num': case 'str': return n.v;
      case 'var': {
        const s = find(scope, n.name);
        if (s) return s.vars[n.name];
        /* a function name on its own IS a call. This is the HolyC move. */
        if (n.name in fns || n.name in BUILTIN) return callFn(n.name, [], n.line);
        if (n.name in CONSTANTS) return CONSTANTS[n.name];
        throw err('undefined symbol "' + n.name + '"', n.line);
      }
      case 'call': {
        if (n.callee.k !== 'var') throw err('that is not callable', n.line);
        const s = find(scope, n.callee.name);
        if (s) throw err('"' + n.callee.name + '" is a variable, not a function', n.line);
        return callFn(n.callee.name, n.args.map(a => evalNode(a, scope)), n.line);
      }
      case 'neg': return -Number(evalNode(n.e, scope));
      case 'not': return evalNode(n.e, scope) ? 0 : 1;
      case 'bin': {
        if (n.op === '&&') return (evalNode(n.l, scope) && evalNode(n.r, scope)) ? 1 : 0;
        if (n.op === '||') return (evalNode(n.l, scope) || evalNode(n.r, scope)) ? 1 : 0;
        const a = evalNode(n.l, scope), b = evalNode(n.r, scope);
        switch (n.op) {
          case '+': return (typeof a === 'string' || typeof b === 'string') ? String(a) + String(b) : a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/':
            if (b === 0) { if (strict) throw err('divided by zero', n.line); return 0; }
            return Number.isInteger(a) && Number.isInteger(b) && !floaty(n.l, scope) && !floaty(n.r, scope) ? Math.trunc(a / b) : a / b;
          case '%':
            if (b === 0) { if (strict) throw err('divided by zero', n.line); return 0; }
            return a % b;
          case '<': return a < b ? 1 : 0;
          case '>': return a > b ? 1 : 0;
          case '<=': return a <= b ? 1 : 0;
          case '>=': return a >= b ? 1 : 0;
          case '==': return a === b ? 1 : 0;
          case '!=': return a !== b ? 1 : 0;
        }
        return 0;
      }
      case 'assign': {
        if (n.target.k !== 'var') throw err('cannot assign to that', n.line);
        const name = n.target.name;
        let s = find(scope, name);
        if (!s) {
          if (strict) throw err('"' + name + '" is not declared: write its type first, like  I64 ' + name + ';', n.line);
          s = gscope;
        }
        const cur = name in s.vars ? s.vars[name] : 0, v = evalNode(n.value, scope);
        const r = n.op === '=' ? v : n.op === '+=' ? cur + v : n.op === '-=' ? cur - v : n.op === '*=' ? cur * v
                : n.op === '%=' ? (v === 0 ? 0 : cur % v) : (v === 0 ? 0 : (Number.isInteger(cur) && Number.isInteger(v) && !floaty(n.value, scope) && s.types[name] !== 'F64' ? Math.trunc(cur / v) : cur / v));
        return (s.vars[name] = coerce(s, name, r));
      }
      case 'pre': case 'post': {
        const name = n.e.name;
        let s = find(scope, name);
        if (!s) { if (strict) throw err('"' + name + '" is not declared', n.line || n.e.line); s = gscope; }
        const old = s.vars[name] || 0;
        s.vars[name] = coerce(s, name, old + (n.op === '++' ? 1 : -1));
        return n.k === 'pre' ? s.vars[name] : old;
      }
    }
    throw err('cannot evaluate ' + n.k, n.line);
  }

  function execBlock(body, scope) { for (const s of body) run(s, scope); }
  function run(s, scope) {
    if (++steps > maxSteps) throw err('ran too long: the loop does not end', s.line);
    if (hooks.trace && s.line && s.k !== 'block' && s.k !== 'fn' && s.k !== 'empty') hooks.trace(s.line, () => visible(scope), s.k);
    try { exec(s, scope); }
    catch (e) { if (e && e.holyc && !e.line) e.line = s.line; throw e; }
  }
  function loopBody(body, scope) {                    /* true: the loop goes on, false: break */
    try { run(body, scope); } catch (e) { if (e === BREAK) return false; if (e !== CONTINUE) throw e; }
    return true;
  }

  function exec(n, scope) {
    switch (n.k) {
      case 'block': execBlock(n.body, n === ast ? scope : child(scope)); return;
      case 'empty': return;
      case 'fn': fns[n.name] = n; return;
      case 'decl':
        n.decls.forEach(d => {
          if (strict && d.name in scope.vars) throw err('"' + d.name + '" is already declared here', n.line);
          scope.types[d.name] = n.ty; if (n.ptr) scope.types['*' + d.name] = 1;
          const v = d.init ? evalNode(d.init, scope) : 0;
          scope.vars[d.name] = coerce(scope, d.name, v);
        });
        return;
      case 'print': {
        const fmt = n.parts[0].v, args = n.parts.slice(1).map(a => evalNode(a, scope));
        emit(hcFormat(fmt, args));
        return;
      }
      case 'expr': evalNode(n.e, scope); return;
      case 'if':
        if (evalNode(n.cond, scope)) run(n.then, scope);
        else if (n.else) run(n.else, scope);
        return;
      case 'while':
        while (evalNode(n.cond, scope)) { if (!loopBody(n.body, scope)) break; }
        return;
      case 'do':
        do { if (!loopBody(n.body, scope)) break; } while (evalNode(n.cond, scope));
        return;
      case 'for': {
        const sc = child(scope);
        if (n.init) exec(n.init, sc);
        while (n.cond ? evalNode(n.cond, sc) : true) {
          if (!loopBody(n.body, sc)) break;
          if (n.step) evalNode(n.step, sc);
        }
        return;
      }
      case 'ret': throw new Ret(n.value ? evalNode(n.value, scope) : 0);
      case 'break': throw BREAK;
      case 'continue': throw CONTINUE;
    }
    throw err('cannot run ' + n.k, n.line);
  }

  const top = e => {
    if (e instanceof Ret) return;
    if (e === BREAK || e === CONTINUE) { flush(); throw err((e === BREAK ? 'break' : 'continue') + ' is used outside a loop'); }
    flush(); throw e;
  };
  try { exec(ast, gscope); } catch (e) { top(e); }
  flush();
  /* if a Main was defined and never called, call it, the way the JIT would */
  if (fns.Main && !globals.__ranMain) {
    globals.__ranMain = 1;
    try { callFn('Main', [], 0); } catch (e) { top(e); }
    flush();
  }
  if (hooks.session) {
    hooks.session({
      globals: globals,
      has: name => !!fns[name] || name in BUILTIN,
      defined: name => !!fns[name],
      names: () => Object.keys(fns),
      call: (name, args) => { steps = 0; depth = 0; try { return callFn(name, args || [], 0); } catch (e) { flush(); if (e instanceof Ret) return e.v; throw e; } finally { flush(); } }
    });
  }
  return globals;
}
