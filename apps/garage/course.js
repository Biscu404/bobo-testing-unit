/* THE STUDIO COURSE. A coach that sits on top of the real Garage and teaches it by watching what you do: each step says what a control
   is for, lights the thing to press, and ticks its goals off as the song and the screen change. Part one takes every button apart on a
   practice song (course_tour_a/b/c.js); part two is "write a song in a style you choose", with the style's own advice and a check on
   what you have written (course_write.js, course_genres*.js). Nothing is locked: SKIP, BACK and CONTENTS are always there.
   How it sees: it wraps the Garage's own functions while it is open (and puts them back when it closes) to hear which ones were called,
   listens for button presses and typed keys, and reads the song. It never changes the song except to load or restore the practice song. */
import { CH_A } from './course_tour_a.js';
import { CH_B } from './course_tour_b.js';
import { CH_C } from './course_tour_c.js';
import { GENRES, genreById, genreSteps, chordText, toneText, patternText } from './course_write.js';
import { practiceSong } from './course_practice.js';
import { makeCoach } from './course_ui.js';
import { whenGone } from '../lifecycle.js';

const TOUR = [].concat(CH_A, CH_B, CH_C);
const LOAD = Object.assign({}, CH_A[0].steps[0], { id: 'load' });
const API_FNS = ['toggle', 'toStart', 'record', 'setLoop', 'setMetro', 'setBpm', 'undo', 'redo', 'band', 'save', 'openSongs', 'newSong', 'exportDialog', 'help', 'setDock', 'zoom', 'learn'];
const ACT_FNS = ['selectAll', 'copy', 'cut', 'paste', 'duplicate', 'del', 'transpose', 'quantize', 'humanize', 'legato', 'stretch', 'velocity', 'fade', 'gap', 'repeat', 'loopRange', 'trim'];
const clone = o => JSON.parse(JSON.stringify(o));
const PRAISE = ['Got it.', 'Nice.', 'That is it.', 'Exactly.', 'Good ear.'];

export function openCourse(api) {
  const G = api.G, L = api.lang, ctx = api.ctx, root = api.root;
  if (root.querySelector('.c-coach')) return null;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'apps/garage/course.css'; root.appendChild(css);
  let progress = { done: {}, at: null }, cur = null, latched = [], stepDone = false, alive = true, saveT = 0, viewing = false;
  const calls = {}, presses = [], keys = [];
  const wrapped = [];

  /* ---- what the course can see ------------------------------------------------------------------------------------------ */
  const C = {
    api, G, L, mem: {}, g: null, start: { tracks: [] }, startG: {}, keys,
    get song() { return G.song; },
    track: id => G.song.tracks.find(t => t.id === id) || null,
    was: id => C.start.tracks.find(t => t.id === id) || null,
    pressed: label => presses.filter(p => p === label.toUpperCase() || p.endsWith(' ' + label.toUpperCase())).length,
    used: n => !!(calls[n] && calls[n].length), calls: n => calls[n] || [],
    loadPractice: () => api.guard(() => api.startSong(practiceSong(L)))
  };
  const isPractice = () => G.song.course === 'practice' && !G.path;
  const restorePractice = () => { api.startSong(practiceSong(L)); api.toast('THE PRACTICE SONG IS BACK AS IT WAS.'); };
  const rec = (n, a) => { (calls[n] = calls[n] || []).push(a); setTimeout(evaluate, 0); };
  const wrap = (obj, names) => names.forEach(n => { const f = obj[n]; if (typeof f !== 'function') return; obj[n] = function () { rec(n, [].slice.call(arguments)); return f.apply(this, arguments); }; wrapped.push([obj, n, f]); });
  wrap(api, API_FNS); wrap(api.act, ACT_FNS);
  const onDown = ev => { if (coach.panel.contains(ev.target)) return; const b = ev.target.closest && ev.target.closest('button'); if (b) presses.push(b.textContent.trim().toUpperCase()); };
  const onKey = ev => { if (!coach.panel.contains(ev.target) && ev.key) keys.push(ev.key.toLowerCase()); };
  root.addEventListener('mousedown', onDown, true); root.addEventListener('keydown', onKey, true);

  const stepsOf = ch => ch.steps;
  const doneCount = ids => ids.filter(id => progress.done[id]).length;
  function persist() { clearTimeout(saveT); saveT = setTimeout(() => ctx.save('course', progress).catch(() => {}), 300); }

  /* ---- running a step -------------------------------------------------------------------------------------------------------- */
  function say(st) {
    const out = [];
    (st.say || []).forEach(t => {
      if (typeof t === 'function') t = t(C);
      if (t === '{CHORDS}') out.push(...chordText(L, G.song, C.g));
      else if (t === '{TONES}') out.push(...toneText(L, G.song, C.g));
      else if (t === '{PATTERN}') out.push(...patternText(C.g));
      else out.push(t);
    });
    return out;
  }
  function startStep(i) {
    const st = cur.steps[i]; cur.i = i; viewing = false;
    if (st.fresh && isPractice()) restorePractice();
    C.start = clone(G.song); C.startG = { tool: G.tool, snap: G.snap, zoomX: G.zoomX, zoomY: G.zoomY, noteLen: G.noteLen, sel: G.sel };
    Object.keys(calls).forEach(k => delete calls[k]); presses.length = 0; keys.length = 0; C.mem = {};
    latched = []; stepDone = false;
    progress.at = { kind: cur.kind, ch: cur.chIndex, genre: cur.genre ? cur.genre.id : null, i };
    persist();
    coach.showStep({ where: cur.label + '  ' + (i + 1) + '/' + cur.steps.length, heading: st.title || null, say: say(st), goals: (st.goals || []).map(g => g[0]), target: st.target, hint: st.hint, action: (st.action || []).map(([l, f]) => [l, () => f(C)]), first: i === 0 && cur.kind === 'tour' && cur.chIndex === 0, last: i === cur.steps.length - 1 });
    if (st.manual || !(st.goals || []).length) { stepDone = true; coach.mark([], true, ''); }
    evaluate();
  }
  function evaluate() {
    if (!alive || !cur || stepDone || viewing) return;
    const st = cur.steps[cur.i], gs = st.goals || []; if (!gs.length) return;
    let prev = true, fresh = false;
    gs.forEach((g, i) => {
      if (latched[i]) return;
      if (st.seq && !prev) { prev = false; return; }
      let ok = false; try { ok = !!g[1](C); } catch (e) { ok = false; }
      if (ok) { latched[i] = true; fresh = true; if (g[2] && g[2].on) { try { g[2].on(C); } catch (e) { /* the course must never get in the way */ } } }
      prev = prev && !!latched[i];
    });
    const all = gs.every((_, i) => latched[i]);
    if (fresh) { try { all ? window.Snd.bell() : window.Snd.chirp(); } catch (e) { /* no sound is fine */ } }
    if (all) { stepDone = true; progress.done[st.id] = 1; persist(); }
    coach.mark(latched, all, all ? PRAISE[cur.i % PRAISE.length] : '');
  }
  function begin(kind, chIndex, steps, label, genre) {
    cur = { kind, chIndex, steps, label, genre, i: 0 }; C.g = genre || null;
    startStep(0);
  }
  function startChapter(i) {
    const ch = TOUR[i]; let steps = stepsOf(ch).slice();
    if (ch.needsPractice && !isPractice()) steps = [LOAD].concat(steps);
    else if (ch.fresh) restorePractice();
    begin('tour', i, steps, (i + 1) + '. ' + ch.title);
  }
  function startGenre(id) { const g = genreById(id); begin('genre', 100, genreSteps(g), g.name + ' SONG', g); }

  /* ---- moving about ---------------------------------------------------------------------------------------------------------- */
  const handlers = {
    close() { cleanup(); },
    step(dir, skipped) {
      const st = cur.steps[cur.i];
      if (dir > 0 && !skipped && stepDone) progress.done[st.id] = 1;
      const to = cur.i + dir;
      if (to < 0) return;
      if (to >= cur.steps.length) { cur = null; viewing = true; showContents(); return; }
      startStep(to);
    },
    contents() { viewing = true; showContents(); },
    chooser() { viewing = true; showChooser(); },
    chapter(i) { startChapter(i); },
    genre(id) { startGenre(id); },
    reset() { progress = { done: {}, at: null }; persist(); showContents(); },
    resume() {
      const at = progress.at;
      if (at && at.kind === 'genre' && genreById(at.genre)) { startGenre(at.genre); if (at.i < cur.steps.length) startStep(at.i); }
      else if (at && at.kind === 'tour' && TOUR[at.ch]) { startChapter(at.ch); if (at.i < cur.steps.length) startStep(at.i); }
      else startChapter(0);
    }
  };
  const genreData = () => GENRES.map(g => { const ids = genreSteps(g).map(s => s.id); return { id: g.id, name: g.name, blurb: g.blurb, feel: g.feel, total: ids.length, done: doneCount(ids) }; });
  function showContents() {
    const genres = genreData();
    coach.contents({
      chapters: TOUR.map((c, i) => ({ title: c.title, blurb: c.blurb, total: c.steps.length, done: doneCount(c.steps.map(s => s.id)), here: !!cur && cur.kind === 'tour' && cur.chIndex === i })),
      genres, written: genres.filter(g => g.done === g.total).length
    });
  }
  const showChooser = () => coach.chooser({ genres: genreData() });

  const coach = makeCoach(api, handlers);
  const poll = setInterval(evaluate, 160), look = setInterval(() => coach.ring(), 200), seat = setInterval(() => coach.place(), 700);
  function cleanup() {
    if (!alive) return; alive = false;
    clearInterval(poll); clearInterval(look); clearInterval(seat); clearTimeout(saveT);
    wrapped.reverse().forEach(([o, n, f]) => { o[n] = f; });
    root.removeEventListener('mousedown', onDown, true); root.removeEventListener('keydown', onKey, true);
    ctx.save('course', progress).catch(() => {});
    coach.remove(); css.remove();
    api.focus();
  }
  whenGone(root, () => { alive = false; clearInterval(poll); clearInterval(look); clearInterval(seat); clearTimeout(saveT); });

  ctx.load('course').then(p => { if (p && p.done) progress = p; showContents(); }).catch(() => showContents());
  return { close: cleanup };
}
