/* THE COACH of a lesson: what to do, the lines to put in, the goals, and the answer if you want it. It watches the runs (and what is done on the stage) and ticks
   a goal off the moment the program meets it, each tick a step higher in pitch; when every goal is ticked the step is done, NEXT lights up, and the last step of a
   lesson pays. Nothing is locked: BACK and SKIP are always there, and SHOW ME types the model answer into the editor, a letter at a time, for anybody who wants to
   see how it is done. The code a step opens on is what the step before it ended on, so a person's own program carries on from lesson step to lesson step. */
import { el, para, button, checkRow, banner, rich } from './tutor_ui.js';
import { startOf, modelOf } from './lessons.js';
import { LESSON_SUN } from './pay.js';

export function makeLessonTutor(host, o) {
  const panel = el('div', 'hc-coach'), snd = o.snd, lab = o.lab, P = o.progress;
  host.appendChild(panel);
  const T = { el: panel, lesson: null, i: 0, latched: [], done: false, hinted: false, shown: false, active: false };

  function head() {
    const L = T.lesson, h = el('div', 'hc-ch2');
    h.append(button('◀ LESSONS', 'sm', () => o.onExit(), snd, 'all the lessons'), el('span', 'hc-chtitle', 'LESSON ' + L.id.slice(1) + '  ' + L.title));
    const dots = el('div', 'hc-dots');
    L.steps.forEach((s, k) => {
      const d = el('span', 'hc-dot' + (P.lesson(L.id).done.indexOf(s.id) >= 0 ? ' done' : P.lesson(L.id).skipped.indexOf(s.id) >= 0 ? ' skip' : '') + (k === T.i ? ' here' : ''));
      d.title = (k + 1) + '. ' + s.title; d.addEventListener('mousedown', ev => { ev.stopPropagation(); if (k !== T.i) { snd.click(); T.open(L, k); } });
      dots.appendChild(d);
    });
    return [h, dots];
  }
  function render() {
    const L = T.lesson, st = L.steps[T.i];
    panel.innerHTML = '';
    head().forEach(n => panel.appendChild(n));
    const body = el('div', 'hc-cbody');
    body.appendChild(el('div', 'hc-stitle', (T.i + 1) + '/' + L.steps.length + '  ' + st.title));
    st.say.forEach(t => body.appendChild(para(t)));
    if (st.code && st.start === undefined) {
      const pre = el('pre', 'hc-snip', st.code); body.appendChild(pre);
      body.appendChild(button('TYPE IT FOR ME', 'go', () => { snd.click(); lab.editor.typeIn(st.code, { tick: () => snd.type(), cps: 60, done: () => lab.editor.focus() }); }, snd, 'type those lines into the editor'));
    }
    const goals = el('div', 'hc-goals'); T.goalsEl = goals; body.appendChild(goals);
    T.hintEl = el('div', 'hc-hint'); body.appendChild(T.hintEl);
    T.okEl = el('div', 'hc-ok'); body.appendChild(T.okEl);
    panel.appendChild(body);
    const foot = el('div', 'hc-cfoot');
    T.bBack = button('◀ BACK', 'sm', () => { if (T.i > 0) T.open(L, T.i - 1); }, snd);
    T.bHint = button('HINT', 'sm', () => showHint(), snd, 'a nudge');
    T.bShow = button('SHOW ME', 'sm', () => showMe(), snd, 'type the answer into the editor');
    T.bSkip = button('SKIP ▶', 'sm', () => skip(), snd, 'go on without doing this one');
    T.bNext = button('NEXT ▶', 'go next', () => next(), snd);
    foot.append(T.bBack, T.bHint, T.bShow, el('span', 'hc-flex'), T.bSkip, T.bNext);
    panel.appendChild(foot);
    renderGoals(); renderState();
  }
  function renderGoals() {
    const st = T.lesson.steps[T.i]; T.goalsEl.innerHTML = '';
    st.goals.forEach((g, k) => T.goalsEl.appendChild(checkRow(g.text, T.latched[k] ? true : null)));
  }
  function renderState() {
    T.bNext.classList.toggle('pulse', T.done); T.bNext.disabled = false;
    T.bBack.disabled = T.i === 0; T.bShow.style.display = T.hinted || T.done ? '' : 'none';
    T.bSkip.style.display = T.done ? 'none' : '';
    const last = T.i === T.lesson.steps.length - 1;
    T.bNext.textContent = last && T.done ? 'FINISH ▶' : 'NEXT ▶';
    T.bNext.style.visibility = T.done ? '' : 'hidden';
    T.hintEl.textContent = ''; if (T.hinted) T.hintEl.appendChild(para(T.lesson.steps[T.i].hint, 'hc-p hc-hp'));
    T.okEl.textContent = ''; if (T.done) rich(T.okEl, T.lesson.steps[T.i].ok);
  }

  T.open = (lesson, i, carry) => {
    const prev = T.lesson, keep = carry && prev === lesson && lesson.steps[i].start === undefined ? lab.get() : null;
    T.lesson = lesson; T.i = i; T.latched = lesson.steps[i].goals.map(() => false); T.done = false; T.hinted = false; T.shown = false; T.active = true;
    P.data.last = { lesson: lesson.id, step: i }; P.setView('lessons');
    lab.setBoard(lesson.id === 'L7');
    if (keep !== null) { lab.load(keep); } else lab.load(startOf(lesson, i));
    lab.editor.stopTyping();
    render();
    if (i === 0 || keep === null) lab.focus();
  };
  T.close = () => { T.active = false; lab.editor.stopTyping(); panel.innerHTML = ''; };

  /* the run (or something done on the stage) is read against the step's goals */
  T.evaluate = R => {
    if (!T.active || T.done || !R) return;
    const st = T.lesson.steps[T.i]; let changed = false;
    for (let k = 0; k < st.goals.length; k++) {
      if (T.latched[k]) continue;
      if (st.seq && k > 0 && !T.latched[k - 1]) break;
      let r; try { r = st.goals[k].t.run(R); } catch (e) { r = { ok: false }; }
      if (r.ok) { T.latched[k] = true; changed = true; snd.goal(T.latched.filter(Boolean).length - 1); } else if (st.seq) break;
    }
    if (changed) renderGoals();
    if (T.latched.every(Boolean)) complete();
  };
  function complete() {
    T.done = true; P.stepDone(T.lesson.id, T.lesson.steps[T.i].id);
    snd.step(); renderState(); render2();
    if (P.lessonComplete(T.lesson) && !P.lesson(T.lesson.id).paid) {
      P.lesson(T.lesson.id).paid = true; P.save(); snd.done();
      o.pay(LESSON_SUN, 'HOLYC: LESSON ' + T.lesson.id.slice(1) + ' ' + T.lesson.title);
      banner(panel, 'LESSON COMPLETE  +' + LESSON_SUN + ' SUN', 'big', 4200);
    }
  }
  const render2 = () => { [...panel.querySelectorAll('.hc-dot')].forEach((d, k) => { const s = T.lesson.steps[k]; d.className = 'hc-dot' + (P.lesson(T.lesson.id).done.indexOf(s.id) >= 0 ? ' done' : P.lesson(T.lesson.id).skipped.indexOf(s.id) >= 0 ? ' skip' : '') + (k === T.i ? ' here' : ''); }); };
  function showHint() { T.hinted = true; renderState(); snd.step(); }
  function showMe() {
    const st = T.lesson.steps[T.i]; T.shown = true; snd.click();
    const code = modelOf(st);
    /* a step that has to be done in two goes (cause an error, then fix it) shows the first go; it is the person's turn for the rest */
    lab.editor.typeIn(st.runs ? st.runs[0].code : code, { replace: true, cps: 140, tick: () => snd.type(), done: () => lab.editor.focus() });
  }
  function skip() { P.stepSkipped(T.lesson.id, T.lesson.steps[T.i].id); goNext(); }
  const next = () => goNext();
  function goNext() {
    const L = T.lesson;
    if (T.i < L.steps.length - 1) { T.open(L, T.i + 1, true); return; }
    o.onFinish(L);
  }
  return T;
}
