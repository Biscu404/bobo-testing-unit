/* The code editor: a plain textarea over a coloured copy of itself (highlight.js), with line numbers, auto-indent, Tab, and the two things a lesson needs
   from it: a line that can be marked (the error, or the one a WATCH IT RUN is on) and text that can be typed into it by the lab, a letter at a time,
   with a key sound for each (TYPE IT FOR ME, SHOW ME). Nothing here knows what HolyC means: lab.js does. */
import { toHtml } from './highlight.js';

export function makeEditor(host, o) {
  o = o || {};
  const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
  const wrap = el('div', 'hc-ed'), gut = el('div', 'hc-gut'), hl = el('pre', 'hc-hl'), ta = el('textarea', 'hc-ta'), marks = el('div', 'hc-marks');
  ta.spellcheck = false; ta.autocapitalize = 'off'; ta.setAttribute('autocomplete', 'off'); ta.setAttribute('aria-label', 'HolyC program');
  const body = el('div', 'hc-edbody');
  body.append(marks, hl, ta);
  wrap.append(gut, body);
  host.appendChild(wrap);
  const E = { el: wrap, ta: ta, mark: {}, typing: null };
  const LH = 22;
  let inputFn = null, runFn = null, keyFn = null;

  const lines = () => ta.value.split('\n').length;
  function paint() {
    hl.innerHTML = toHtml(ta.value) + '\n';
    const n = Math.max(lines(), 12);
    if (gut.childElementCount !== n) { gut.innerHTML = ''; for (let i = 1; i <= n; i++) { const d = el('div'); d.textContent = String(i); gut.appendChild(d); } }
    drawMarks();
  }
  function drawMarks() {
    marks.innerHTML = '';
    Object.keys(E.mark).forEach(cls => {
      const ln = E.mark[cls]; if (!ln) return;
      const d = el('div', 'hc-mark ' + cls); d.style.top = ((ln - 1) * LH + 6) + 'px'; marks.appendChild(d);
    });
    [...gut.children].forEach((g, i) => { const on = Object.keys(E.mark).some(c => E.mark[c] === i + 1); if (!on) g.className = ''; else g.className = Object.keys(E.mark).filter(c => E.mark[c] === i + 1).join(' '); });
  }
  const sync = () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; marks.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)'; };
  ta.addEventListener('scroll', sync);
  ta.addEventListener('input', () => { paint(); sync(); if (inputFn) inputFn(ta.value); });

  ta.addEventListener('keydown', ev => {
    ev.stopPropagation();                                       /* the window manager's keys are not for here */
    if (E.typing) { ev.preventDefault(); if (ev.key === 'Escape') E.typing.finish(); return; }
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); if (runFn) runFn(); return; }
    if (keyFn && ev.key.length === 1) keyFn(ev.key);
    if (ev.key === 'Tab') { ev.preventDefault(); insert('  '); return; }
    if (ev.key === 'Enter') {                                   /* the next line starts under this one, and in one more after a { */
      ev.preventDefault();
      const s = ta.selectionStart, before = ta.value.slice(0, s), cur = before.slice(before.lastIndexOf('\n') + 1);
      const ind = /^[ ]*/.exec(cur)[0] + (/\{\s*$/.test(cur) ? '  ' : '');
      insert('\n' + ind); return;
    }
    if (ev.key === '}') {                                       /* a } closes back out to where its { was */
      const s = ta.selectionStart, before = ta.value.slice(0, s), cur = before.slice(before.lastIndexOf('\n') + 1);
      if (/^[ ]{2,}$/.test(cur)) { ev.preventDefault(); ta.setSelectionRange(s - 2, s); insert('}'); }
    }
  });
  function insert(text) {
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.setSelectionRange(s + text.length, s + text.length);
    paint(); sync(); if (inputFn) inputFn(ta.value);
  }

  E.onInput = f => { inputFn = f; };
  E.onRun = f => { runFn = f; };
  E.onKey = f => { keyFn = f; };
  E.focus = () => ta.focus();
  E.get = () => ta.value;
  E.set = (text, silent) => { E.stopTyping(); ta.value = text; ta.scrollTop = 0; paint(); sync(); if (!silent && inputFn) inputFn(ta.value); };
  E.setMark = (cls, line) => { E.mark[cls] = line || 0; drawMarks(); if (line) { const top = (line - 1) * LH; if (top < ta.scrollTop || top > ta.scrollTop + ta.clientHeight - 2 * LH) { ta.scrollTop = Math.max(0, top - 3 * LH); sync(); } } };
  E.clearMarks = () => { E.mark = {}; drawMarks(); };
  E.readOnly = on => { ta.readOnly = !!on; wrap.classList.toggle('ro', !!on); };
  E.append = text => insertAtEnd(text);
  function insertAtEnd(text) { const cur = ta.value; ta.value = cur + (cur && !/\n$/.test(cur) ? '\n' : '') + text; paint(); sync(); ta.scrollTop = ta.scrollHeight; }

  /* typed into the editor, a letter at a time, by the lab. `replace`: the text replaces the program, else it is added at the end. Esc stops it and finishes at once. */
  E.typeIn = (text, opt) => {
    opt = opt || {};
    E.stopTyping();
    if (opt.replace) { ta.value = ''; } else if (ta.value && !/\n$/.test(ta.value)) ta.value += '\n';
    const base = ta.value, cps = opt.cps || 70; let i = 0;
    wrap.classList.add('typing');
    const t = { stop() { clearInterval(t.h); } };
    E.typing = t;
    const finish = () => { clearInterval(t.h); E.typing = null; wrap.classList.remove('typing'); ta.value = base + text; paint(); sync(); if (inputFn) inputFn(ta.value); if (opt.done) opt.done(); };
    t.finish = finish;
    t.h = setInterval(() => {
      const step = Math.max(1, Math.round(cps / 30));
      for (let k = 0; k < step && i < text.length; k++) { i++; if (opt.tick && /\S/.test(text[i - 1])) opt.tick(); }
      ta.value = base + text.slice(0, i); paint(); ta.scrollTop = ta.scrollHeight; sync();
      if (i >= text.length) finish();
    }, 1000 / 30);
    return t;
  };
  E.stopTyping = () => { if (E.typing) { const t = E.typing; E.typing = null; t.stop(); wrap.classList.remove('typing'); } };
  E.destroy = () => { E.stopTyping(); };
  paint();
  return E;
}
