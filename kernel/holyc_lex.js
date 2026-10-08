/* HolyC, the tokeniser. Pure: no window, no sound, so a check can run it in Node (node apps/holyc/holyc_check.js).
   A number token knows if it was written with a point (`float`), because HolyC divides integers as integers and the evaluator has to know. */
export function HolyCError(msg, line) {
  this.message = msg;
  this.line = line;
  this.holyc = true;
}

export function hcLex(src) {
  const t = [];
  let i = 0, line = 1;
  const isD = c => c >= '0' && c <= '9';
  const isA = c => /[A-Za-z_]/.test(c);
  while (i < src.length) {
    const c = src.charAt(i);
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src.charAt(i + 1) === '/') { while (i < src.length && src.charAt(i) !== '\n') i++; continue; }
    if (c === '/' && src.charAt(i + 1) === '*') {
      i += 2;
      while (i < src.length && !(src.charAt(i) === '*' && src.charAt(i + 1) === '/')) { if (src.charAt(i) === '\n') line++; i++; }
      i += 2; continue;
    }
    if (c === '"') {
      let s = '', j = i + 1, closed = false;
      while (j < src.length) {
        const ch = src.charAt(j);
        if (ch === '"') { closed = true; break; }
        if (ch === '\\') {
          const n = src.charAt(j + 1);
          s += n === 'n' ? '\n' : n === 't' ? '\t' : n === '\\' ? '\\' : n === '"' ? '"' : n;
          j += 2;
        } else { if (ch === '\n') line++; s += ch; j++; }
      }
      if (!closed) throw new HolyCError('this string never ends: it needs a closing "', line);
      t.push({ k: 'str', v: s, line: line });
      i = j + 1; continue;
    }
    /* 'A' is the number of the letter, as in C */
    if (c === "'" && src.charAt(i + 2) === "'") { t.push({ k: 'num', v: src.charCodeAt(i + 1), line: line }); i += 3; continue; }
    if (isD(c)) {
      let j = i;
      while (j < src.length && /[0-9.xXa-fA-F]/.test(src.charAt(j))) j++;
      const text = src.slice(i, j);
      t.push({ k: 'num', v: Number(text), float: text.indexOf('.') >= 0, line: line });
      i = j; continue;
    }
    if (isA(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src.charAt(j))) j++;
      t.push({ k: 'id', v: src.slice(i, j), line: line });
      i = j; continue;
    }
    const two = src.substr(i, 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%='].indexOf(two) >= 0) {
      t.push({ k: 'op', v: two, line: line }); i += 2; continue;
    }
    t.push({ k: 'op', v: c, line: line });
    i++;
  }
  t.push({ k: 'eof', v: '', line: line });
  return t;
}
