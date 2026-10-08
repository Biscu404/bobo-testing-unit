/* HolyC, the parser: recursive descent over holyc_lex.js's tokens. Pure.
   What makes it HolyC rather than C: a statement that is only a string prints it, a format string takes its arguments as the rest of
   the statement, and a function name on its own is a call. `opts.strict` is the lab's way of reading it (HOLYC.EXE): a missing ; is an
   error, as it is in the real compiler, and said on the line that lacks it; the terminal reads it leniently, as it always did. Every statement
   carries its `line`, so a run-time error and the lab's "watch it run" can say where. */
import { HolyCError } from './holyc_lex.js';

export const TYPES = { U0: 1, I64: 1, I32: 1, I16: 1, I8: 1, U64: 1, U32: 1, U16: 1, U8: 1, F64: 1, Bool: 1 };
export const INT_TYPES = { I64: 1, I32: 1, I16: 1, I8: 1, U64: 1, U32: 1, U16: 1, U8: 1, Bool: 1 };

export function hcParse(tokens, opts) {
  const strict = !!(opts && opts.strict);
  let p = 0;
  const peek = n => tokens[p + (n || 0)];
  const at = (k, v) => peek().k === k && (v === undefined || peek().v === v);
  const eat = (k, v) => {
    if (!at(k, v)) {
      const t = peek(), want = v || k;
      throw new HolyCError('expected ' + want + ', found ' + (t.k === 'eof' ? 'the end of the program' : '"' + t.v + '"'), t.line);
    }
    return tokens[p++];
  };
  /* the ; that ends a statement. Lenient reading lets it go; strict says which line is missing it. */
  const semi = () => {
    if (at('op', ';')) { p++; return; }
    if (strict) { const prev = tokens[p - 1] || peek(); throw new HolyCError('missing ; after ' + (prev.k === 'str' ? JSON.stringify(prev.v) : '"' + prev.v + '"'), prev.line); }
  };
  const skipStars = () => { while (at('op', '*')) p++; };

  function program() {
    const body = [];
    while (!at('eof')) body.push(stamped(statement));
    return { k: 'block', body: body, line: 1 };
  }
  function stamped(fn) { const ln = peek().line, s = fn(); if (s && !s.line) s.line = ln; return s; }

  function block() {
    const line = eat('op', '{').line;
    const body = [];
    while (!at('op', '}') && !at('eof')) body.push(stamped(statement));
    if (at('eof')) throw new HolyCError('this { is never closed: a } is missing', line);
    eat('op', '}');
    return { k: 'block', body: body, line: line };
  }

  function decls(ty, ptr) {
    const out = [];
    while (at('id')) {
      const name = eat('id').v;
      let init = null;
      if (at('op', '=')) { p++; init = expression(); }
      out.push({ name: name, init: init });
      if (at('op', ',')) { p++; skipStars(); continue; }
      break;
    }
    return { k: 'decl', ty: ty, ptr: ptr, decls: out };
  }

  function statement() {
    if (at('op', '{')) return block();
    if (at('op', ';')) { p++; return { k: 'empty' }; }

    if (at('id') && TYPES[peek().v]) {
      const ty = eat('id').v, ptr = at('op', '*');
      skipStars();
      /* a function definition? */
      if (at('id') && peek(1).k === 'op' && peek(1).v === '(') {
        const name = eat('id').v, line = peek().line;
        eat('op', '(');
        const params = [], ptypes = [];
        while (!at('op', ')') && !at('eof')) {
          let pt = '';
          if (at('id') && TYPES[peek().v]) pt = eat('id').v;
          const pptr = at('op', '*');
          skipStars();
          if (at('id')) { params.push(eat('id').v); ptypes.push(pptr ? '' : pt); }
          if (at('op', ',')) p++;
          else break;
        }
        eat('op', ')');
        if (!at('op', '{')) throw new HolyCError('the function ' + name + ' needs its body: a { after the ( )', peek().line);
        return { k: 'fn', name: name, params: params, ptypes: ptypes, ret: ty, body: block(), line: line };
      }
      const d = decls(ty, ptr);
      semi();
      return d;
    }

    if (at('id', 'if')) {
      p++; eat('op', '('); const c = expression(); eat('op', ')');
      const th = stamped(statement);
      let el = null;
      if (at('id', 'else')) { p++; el = stamped(statement); }
      return { k: 'if', cond: c, then: th, else: el };
    }
    if (at('id', 'while')) {
      p++; eat('op', '('); const c = expression(); eat('op', ')');
      return { k: 'while', cond: c, body: stamped(statement) };
    }
    if (at('id', 'do')) {
      p++; const body = stamped(statement);
      eat('id', 'while'); eat('op', '('); const c = expression(); eat('op', ')'); semi();
      return { k: 'do', cond: c, body: body };
    }
    if (at('id', 'for')) {
      p++; eat('op', '(');
      const init = at('op', ';') ? null : initialiser();
      eat('op', ';');
      const cond = at('op', ';') ? null : expression();
      eat('op', ';');
      const step = at('op', ')') ? null : expression();
      eat('op', ')');
      return { k: 'for', init: init, cond: cond, step: step, body: stamped(statement) };
    }
    if (at('id', 'return')) {
      p++;
      const v = at('op', ';') ? null : expression();
      semi();
      return { k: 'ret', value: v };
    }
    if (at('id', 'break')) { p++; semi(); return { k: 'break' }; }
    if (at('id', 'continue')) { p++; semi(); return { k: 'continue' }; }

    /* the HolyC part: a statement that starts with a string is a print, and everything after the comma is an argument to it */
    if (at('str')) {
      const parts = [{ k: 'str', v: eat('str').v }];
      while (at('op', ',')) { p++; parts.push(expression()); }
      semi();
      return { k: 'print', parts: parts };
    }

    const e = expression();
    semi();
    return { k: 'expr', e: e };
  }

  /* a for-initialiser: a declaration or a bare expression, no semicolon eaten */
  function initialiser() {
    if (at('id') && TYPES[peek().v]) { const ty = eat('id').v, ptr = at('op', '*'); skipStars(); return decls(ty, ptr); }
    return { k: 'expr', e: expression() };
  }

  function expression() { return assign(); }

  function assign() {
    const left = logicOr();
    if (at('op', '=') || at('op', '+=') || at('op', '-=') || at('op', '*=') || at('op', '/=') || at('op', '%=')) {
      const op = eat('op');
      const right = assign();
      return { k: 'assign', op: op.v, target: left, value: right, line: op.line };
    }
    return left;
  }
  function bin(next, ops) {
    return function () {
      let l = next();
      while (at('op') && ops.indexOf(peek().v) >= 0) {
        const t = eat('op');
        l = { k: 'bin', op: t.v, l: l, r: next(), line: t.line };
      }
      return l;
    };
  }
  const cmpEq = bin(() => cmpRel(), ['==', '!=']);
  const logicAnd = bin(() => cmpEq(), ['&&']);
  const logicOr = bin(() => logicAnd(), ['||']);
  function cmpRel() { return bin(() => addsub(), ['<', '>', '<=', '>='])(); }
  function addsub() { return bin(() => muldiv(), ['+', '-'])(); }
  function muldiv() { return bin(() => unary(), ['*', '/', '%'])(); }

  function unary() {
    if (at('op', '-')) { p++; return { k: 'neg', e: unary() }; }
    if (at('op', '!')) { p++; return { k: 'not', e: unary() }; }
    if (at('op', '++') || at('op', '--')) {
      const op = eat('op').v;
      return { k: 'pre', op: op, e: unary() };
    }
    return postfix();
  }

  function postfix() {
    let e = primary();
    for (;;) {
      if (at('op', '(')) {
        const line = eat('op', '(').line;
        const args = [];
        while (!at('op', ')') && !at('eof')) {
          args.push(expression());
          if (at('op', ',')) p++;
          else if (!at('op', ')')) throw new HolyCError('expected , or ) in the arguments, found "' + peek().v + '"', peek().line);
        }
        eat('op', ')');
        e = { k: 'call', callee: e, args: args, line: line };
      } else if (at('op', '++') || at('op', '--')) {
        e = { k: 'post', op: eat('op').v, e: e };
      } else break;
    }
    return e;
  }

  function primary() {
    if (at('num')) { const t = eat('num'); return { k: 'num', v: t.v, float: !!t.float }; }
    if (at('str')) return { k: 'str', v: eat('str').v };
    if (at('id')) { const t = eat('id'); return { k: 'var', name: t.v, line: t.line }; }
    if (at('op', '(')) { p++; const e = expression(); eat('op', ')'); return e; }
    if (at('op', '*') || at('op', '&')) { p++; return primary(); }   /* pointers, waved through */
    const t = peek();
    throw new HolyCError(t.k === 'eof' ? 'the program ends in the middle of a statement' : 'unexpected "' + t.v + '"', t.line);
  }

  return program();
}
