/* WATCH IT RUN: the program, one statement at a time. engine.js records, for every statement that runs, its line, the variables as they were just before
   and how many lines had been printed; this plays it back: the line lit in the editor, the variables in a row (the ones that just changed in yellow), the
   output building up beside it. Step back, step on, or play it at a speed. It is a replay of a finished run, so it can never change what the program did. */
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

export function makeTrace(host, o) {
  const bar = el('div', 'hc-trace'), head = el('div', 'hc-trh'), vars = el('div', 'hc-trv');
  const btn = (t, f, title) => { const b = el('button', 'hc-tb', t); b.title = title || ''; b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (ev.button === 0) { if (o.snd) o.snd.click(); f(); } }); return b; };
  const pos = el('span', 'hc-trpos'), speed = el('select', 'hc-trs');
  [['SLOW', 900], ['NORMAL', 450], ['FAST', 160]].forEach(s => { const op = el('option', '', s[0]); op.value = s[1]; if (s[0] === 'NORMAL') op.selected = true; speed.appendChild(op); });
  speed.addEventListener('mousedown', ev => ev.stopPropagation());
  speed.addEventListener('change', () => { if (T.timer) { stopPlay(); play(); } });
  const bPlay = btn('PLAY', () => (T.timer ? stopPlay() : play())), bBack = btn('<', () => { stopPlay(); go(T.i - 1); }, 'one statement back'), bNext = btn('>', () => { stopPlay(); go(T.i + 1); }, 'one statement on'), bClose = btn('X', () => T.hide(), 'back to the program');
  head.append(el('span', 'hc-trt', 'WATCHING'), bBack, bPlay, bNext, speed, pos, el('span', 'hc-flex'), bClose);
  bar.append(head, vars);
  host.appendChild(bar);
  const T = { el: bar, R: null, i: 0, timer: 0, prev: {} };

  function show(R) {
    T.R = R; T.i = 0; T.prev = {}; bar.classList.add('on');
    if (!R.trace.length) { vars.textContent = 'NOTHING RAN, SO THERE IS NOTHING TO WATCH.'; pos.textContent = ''; return; }
    go(0);
  }
  function go(i) {
    const R = T.R; if (!R || !R.trace.length) return;
    i = Math.max(0, Math.min(R.trace.length, i));
    T.i = i;
    const e = R.trace[Math.min(i, R.trace.length - 1)], atEnd = i >= R.trace.length;
    const after = atEnd ? R.out.length : (R.trace[i].out);
    o.editor.setMark('cur', atEnd ? 0 : e.line);
    o.console.setLines(R.out.slice(0, after));
    /* the variables: what they are as this statement is about to run, or at the very end what they ended as */
    const v = atEnd ? (R.session ? snapshot(R.session.globals) : e.vars) : e.vars;
    vars.innerHTML = '';
    const names = Object.keys(v);
    if (!names.length) vars.appendChild(el('span', 'hc-trnone', 'NO VARIABLES YET'));
    names.forEach(k => { const c = el('span', 'hc-trvar' + (T.prev[k] !== undefined && T.prev[k] !== v[k] ? ' ch' : '')); c.append(el('b', '', k), document.createTextNode(' = ' + (typeof v[k] === 'string' ? '"' + v[k] + '"' : v[k]))); vars.appendChild(c); });
    T.prev = Object.assign({}, v);
    pos.textContent = atEnd ? 'DONE' : 'LINE ' + e.line + '   STEP ' + (i + 1) + ' OF ' + R.trace.length + (R.traceCut ? '+' : '');
    bPlay.textContent = T.timer ? 'PAUSE' : (atEnd ? 'AGAIN' : 'PLAY');
    if (o.snd && !atEnd) o.snd.key();
  }
  const snapshot = g => { const o2 = {}; Object.keys(g).forEach(k => { if (k.indexOf('__') !== 0 && (typeof g[k] === 'number' || typeof g[k] === 'string')) o2[k] = g[k]; }); return o2; };
  function play() {
    if (!T.R || !T.R.trace.length) return;
    if (T.i >= T.R.trace.length) { T.prev = {}; go(0); }
    T.timer = setInterval(() => { if (T.i >= T.R.trace.length) { stopPlay(); go(T.i); return; } go(T.i + 1); }, +speed.value);
    bPlay.textContent = 'PAUSE';
  }
  function stopPlay() { if (T.timer) { clearInterval(T.timer); T.timer = 0; } bPlay.textContent = T.R && T.i >= T.R.trace.length ? 'AGAIN' : 'PLAY'; }
  T.show = show;
  T.hide = () => { stopPlay(); bar.classList.remove('on'); o.editor.setMark('cur', 0); if (T.R && o.onClose) o.onClose(); T.R = null; };
  T.on = () => bar.classList.contains('on');
  T.destroy = () => stopPlay();
  return T;
}
