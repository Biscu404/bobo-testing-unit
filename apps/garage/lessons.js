/* LEARN: eight tiny lessons, each one a toy. Short sentences, big buttons, real
   instruments; every lesson ends in a star, and the last one ends in a song.
   A lesson is { title, inst: [instruments to have ready], build(stage, X) }; X is
   the little toolbox below. */
import { el, btn } from './ui.js';
import { LESSONS_A } from './lessons_a.js';
import { LESSONS_B } from './lessons_b.js';

const LESSONS = LESSONS_A.concat(LESSONS_B);

export function openLessons(root, api, hooks) {
  const S = api.studio, L = api.lang, ctx = api.ctx;
  const wrap = el('div', 'g-lessons');
  root.appendChild(wrap);
  const head = el('div', 'l-head');
  const close = () => { cleanup(); wrap.remove(); };
  head.append(el('span', '', 'LEARN MUSIC'), el('span', 'g-flex'), btn('BACK TO THE GARAGE', 'g-go', close));
  const body = el('div', 'l-body'), list = el('div', 'l-list'), stage = el('div', 'l-stage');
  body.append(list, stage);
  wrap.append(head, body);
  let stars = [], cur = -1, player = null, timers = [], stageDone = false;

  function cleanup() {
    if (player) { player.stop(); player = null; }
    timers.forEach(t => { clearInterval(t); clearTimeout(t); });
    timers = [];
  }
  const save = () => ctx.save('stars', stars).catch(() => {});

  function drawList() {
    list.replaceChildren();
    LESSONS.forEach((l, i) => {
      const it = el('div', 'l-item' + (i === cur ? ' sel' : '') + (stars[i] ? ' done' : ''));
      it.append(el('span', 'l-n', String(i + 1)), el('span', '', l.title), el('span', 'l-star', stars[i] ? '★' : '☆'));
      it.addEventListener('mousedown', ev => { if (ev.button === 0) open(i); });
      list.appendChild(it);
    });
  }

  function open(i) {
    cleanup();
    cur = i; stageDone = false;
    stage.replaceChildren();
    drawList();
    const lesson = LESSONS[i];
    (lesson.inst || []).forEach(id => S.ins.load(id).catch(() => {}));
    const okEl = el('div', 'l-ok');
    const X = {
      api, S, L, hooks,
      say: (t, cls) => { const d = el('div', cls || 'l-say', t); stage.appendChild(d); return d; },
      row: () => { const r = el('div', 'l-row'); stage.appendChild(r); return r; },
      pad(parent, label, color, fn, sub) {
        const b = el('button', 'l-pad', label);
        b.style.background = color;
        if (sub) b.appendChild(el('small', '', sub));
        const press = ev => { ev.preventDefault(); b.classList.add('down'); if (window.Snd && window.Snd.press) window.Snd.press(); fn(b, ev); };
        b.addEventListener('pointerdown', press);
        ['pointerup', 'pointerleave'].forEach(t => b.addEventListener(t, () => b.classList.remove('down')));
        parent.appendChild(b);
        return b;
      },
      dots(n) {
        const d = el('div', 'l-dots');
        const cells = [];
        for (let k = 0; k < n; k++) { const c = el('div', 'l-dot'); cells.push(c); d.appendChild(c); }
        stage.appendChild(d);
        return { set(k) { cells.forEach((c, j) => c.classList.toggle('on', j < k)); } };
      },
      tap: (inst, midi, sec) => S.tap(inst, midi, sec || 0.8, 0.9),
      play(song, o) { if (player) player.stop(); S.preload(song).then(() => { player = S.play(song, o); }); },
      stop() { if (player) { player.stop(); player = null; } },
      every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; },
      later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; },
      clear(t) { clearInterval(t); clearTimeout(t); },
      ok(t) { okEl.textContent = t; },
      done() {
        if (stageDone) return;
        stageDone = true; stars[i] = 1; save(); drawList();
        okEl.textContent = '★ WELL DONE! ★';
        if (window.Snd && window.Snd.bell) window.Snd.bell();
        nextB.disabled = false;
        if (i === LESSONS.length - 1) nextB.textContent = 'ALL DONE!';
      },
      rand: n => Math.floor(Math.random() * n),
      pick: a => a[Math.floor(Math.random() * a.length)]
    };
    stage.appendChild(el('div', 'l-title', (i + 1) + '. ' + lesson.title));
    if (S.knob() === 0) {
      const hint = el('div', 'l-row');
      hint.append(el('span', 'l-small', 'NO SOUND? THE MUS KNOB IS AT ZERO.'), btn('TURN IT UP FOR ME', 'g-go', () => { S.turnUp(6); hint.remove(); }));
      stage.appendChild(hint);
    }
    const nextB = btn(i === LESSONS.length - 1 ? 'FINISH' : 'NEXT LESSON ▶', 'g-go l-next', () => { if (i < LESSONS.length - 1) open(i + 1); else close(); });
    nextB.disabled = !!stars[i];
    if (stars[i]) okEl.textContent = '★ YOU HAVE DONE THIS ONE ★';
    lesson.build(stage, X);
    stage.appendChild(okEl);
    stage.appendChild(nextB);
  }

  ctx.load('stars').then(s => {
    stars = Array.isArray(s) ? s : [];
    const first = stars.findIndex(x => !x);
    open(first < 0 ? 0 : first);
  }).catch(() => open(0));
  drawList();
  wrap.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } });
  return { close };
}
