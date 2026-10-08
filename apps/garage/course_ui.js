/* The Studio Course's face: the coach panel that sits on top of the real Garage, the rings that light the thing to press, and the
   list of chapters and genres. It knows nothing about what a step means: course.js tells it what to show. */
import { el, btn } from './ui.js';
import { GUT, RULER, VELH } from './grid_draw.js';

/* UI words in the text (two or more capitals: PLAY, MAGIC NOTES, CTRL+Z) stand out in yellow */
const KEYWORD = /[A-Z0-9#+\/←-↓-]{2,}(?: [A-Z0-9#+\/-]{2,})*/g;
export function rich(host, text) {
  let at = 0, m;
  KEYWORD.lastIndex = 0;
  while ((m = KEYWORD.exec(text))) {
    if (m.index > at) host.appendChild(document.createTextNode(text.slice(at, m.index)));
    host.appendChild(el('b', 'c-k', m[0])); at = m.index + m[0].length;
  }
  if (at < text.length) host.appendChild(document.createTextNode(text.slice(at)));
  return host;
}

/* what a target spec points at: an element, or a rectangle, in page pixels (or null: it is not on the screen just now) */
export function find(root, panel, spec) {
  const i = spec.indexOf(':'), kind = spec.slice(0, i), v = spec.slice(i + 1);
  const vis = e => e.getClientRects().length > 0 && !panel.contains(e);
  if (kind === 'css') return [...root.querySelectorAll(v)].find(vis) || null;
  if (kind === 'btn') {
    const words = v.toUpperCase().split('|'), bs = [...root.querySelectorAll('button')].filter(vis), txt = b => b.textContent.trim().toUpperCase();
    for (const w of words) { const hit = bs.find(b => txt(b) === w || txt(b).endsWith(' ' + w)) || bs.find(b => txt(b).startsWith(w)); if (hit) return hit; }
    return null;
  }
  if (kind === 'sel') return [...root.querySelectorAll('select')].filter(vis).find(s => (s.title || '').toUpperCase().startsWith(v.toUpperCase())) || null;
  if (kind === 'zone') {
    const cv = root.querySelector('canvas.g-grid'); if (!cv || !vis(cv)) return null;
    const r = cv.getBoundingClientRect(), k = r.width / (cv.width || r.width), H = cv.height;
    const z = { ruler: [GUT, 0, cv.width - GUT, RULER], vel: [GUT, H - VELH - 3, cv.width - GUT, VELH + 3], gutter: [0, RULER, GUT, H - VELH - RULER - 3], roll: [GUT, RULER, cv.width - GUT, H - VELH - RULER - 3] }[v];
    return z ? { left: r.left + z[0] * k, top: r.top + z[1] * k, width: z[2] * k, height: z[3] * k } : null;
  }
  return null;
}
const rectOf = e => (e.getBoundingClientRect ? e.getBoundingClientRect() : e);

export function makeCoach(api, on) {
  const root = api.root;
  const panel = el('div', 'c-coach'), rings = el('div', 'c-rings');
  const head = el('div', 'c-head'), title = el('span', 'c-title', 'STUDIO COURSE'), where = el('span', 'c-where', '');
  const fold = btn('–', 'g-sm c-fold', () => panel.classList.toggle('folded'), 'FOLD THE COACH AWAY (IT STAYS WHERE IT IS)');
  const close = btn('X', 'g-sm c-close', () => on.close(), 'LEAVE THE COURSE (YOUR PLACE IS KEPT)');
  head.append(title, where, el('span', 'g-flex'), fold, close);
  const body = el('div', 'c-body'), foot = el('div', 'c-foot');
  panel.append(head, body, foot);
  root.append(rings, panel);
  let targets = [], userMoved = false, hintText = '', say = [];

  /* the panel can be dragged by its title */
  head.addEventListener('pointerdown', ev => {
    if (ev.target.closest('button')) return;
    const r = panel.getBoundingClientRect(), rr = root.getBoundingClientRect(), z = rr.width / root.offsetWidth || 1, ox = ev.clientX - r.left, oy = ev.clientY - r.top;
    head.setPointerCapture(ev.pointerId); userMoved = true; panel.dataset.pos = 'free';
    const mv = e => { panel.style.left = Math.max(0, Math.min(root.offsetWidth - 80, (e.clientX - ox - rr.left) / z)) + 'px'; panel.style.top = Math.max(0, Math.min(root.offsetHeight - 40, (e.clientY - oy - rr.top) / z)) + 'px'; panel.style.right = panel.style.bottom = 'auto'; };
    const up = () => { head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', up); };
    head.addEventListener('pointermove', mv); head.addEventListener('pointerup', up);
  });
  panel.addEventListener('mousedown', ev => ev.stopPropagation());
  panel.addEventListener('mouseup', () => setTimeout(() => api.focus(), 0));        /* so SPACE and the other keys still go to the Garage */
  panel.addEventListener('keydown', ev => ev.stopPropagation());

  const para = t => { const p = el('div', 'c-say'); if (t[0] === '>') { p.className = 'c-pre'; p.textContent = t.slice(2); } else rich(p, t); return p; };

  /* a step: its words, its goals (with ticks), and the buttons that go with it */
  function showStep(s) {
    body.replaceChildren(); foot.replaceChildren();
    where.textContent = s.where; targets = s.target || []; hintText = s.hint || ''; say = s.say;
    panel.classList.remove('folded', 'ready', 'wide');
    if (s.heading) body.appendChild(el('div', 'c-h', s.heading));
    s.say.forEach(t => body.appendChild(para(t)));
    const gl = el('div', 'c-goals');
    s.goals.forEach(g => { const r = el('div', 'c-goal'); r.append(el('span', 'c-box', ''), rich(el('span', 'c-gt'), g)); gl.appendChild(r); });
    if (s.goals.length) body.appendChild(gl);
    (s.action || []).forEach(([label, fn]) => body.appendChild(btn(label, 'g-go c-act', () => fn())));
    const note = el('div', 'c-hint', hintText); note.style.display = 'none'; body.appendChild(note);
    body.appendChild(el('div', 'c-after', ''));
    const back = btn('◀ BACK', '', () => on.step(-1)), hint = btn('HINT', '', () => { note.style.display = note.style.display === 'none' ? '' : 'none'; }), skip = btn('SKIP', '', () => on.step(1, true));
    hint.disabled = !hintText;
    const next = btn(s.last ? 'FINISH' : 'NEXT ▶', 'g-go c-next', () => on.step(1)), list = btn('CONTENTS', '', () => on.contents());
    next.disabled = !!s.goals.length;
    foot.append(back, hint, skip, el('span', 'g-flex'), list, next);
    foot.dataset.skip = s.goals.length ? '1' : '';
    skip.style.display = s.goals.length ? '' : 'none'; back.disabled = s.first;
    place();
  }
  /* which goals are ticked; `done` when all are */
  function mark(flags, done, after) {
    [...body.querySelectorAll('.c-goal')].forEach((r, i) => r.classList.toggle('on', !!flags[i]));
    const next = foot.querySelector('.c-next'); if (next) { next.disabled = !done && foot.dataset.skip === '1'; next.classList.toggle('pulse', !!done); }
    panel.classList.toggle('ready', !!done);
    const a = body.querySelector('.c-after'); if (a) { a.textContent = done && after ? after : ''; }
  }
  /* the list of chapters, with the way into part two at the bottom */
  function contents(d) {
    body.replaceChildren(); foot.replaceChildren(); targets = []; where.textContent = 'CONTENTS';
    panel.classList.remove('folded', 'ready'); panel.classList.add('wide');
    body.appendChild(rich(el('div', 'c-say'), 'Part one takes the Garage apart, button by button, on a practice song. Part two is where you write a whole song of your own, in a style you choose. Your place is kept.'));
    d.chapters.forEach((c, i) => {
      const r = el('div', 'c-item' + (c.done === c.total ? ' done' : '') + (c.here ? ' here' : ''));
      r.append(el('span', 'c-n', String(i + 1).padStart(2, '0')), el('span', 'c-t', c.title), el('span', 'c-s', c.done + '/' + c.total));
      r.title = c.blurb; r.addEventListener('mousedown', ev => { ev.stopPropagation(); on.chapter(i); });
      body.appendChild(r);
    });
    const w = el('div', 'c-item c-write'); w.append(el('span', 'c-n', String(d.chapters.length + 1).padStart(2, '0')), el('span', 'c-t', 'WRITE A SONG: CHOOSE A STYLE'), el('span', 'c-s', d.written + '/' + d.genres.length));
    w.addEventListener('mousedown', ev => { ev.stopPropagation(); on.chooser(); });
    body.appendChild(w);
    foot.append(btn('RESET MY PLACE', '', () => on.reset()), el('span', 'g-flex'), btn('CONTINUE ▶', 'g-go', () => on.resume()));
    place();
  }
  /* the styles to write in */
  function chooser(d) {
    body.replaceChildren(); foot.replaceChildren(); targets = []; where.textContent = 'WRITE A SONG';
    panel.classList.remove('folded', 'ready'); panel.classList.add('wide');
    body.appendChild(rich(el('div', 'c-say'), 'Choose a style. The course becomes that style\'s recipe: the tempo, the scale, the beat, the bass, the chords, the tune and the mix, each one checked against your song, each with advice that is that style\'s own.'));
    const gl = el('div', 'c-genres');
    d.genres.forEach(g => {
      const c = el('div', 'c-genre' + (g.done === g.total ? ' done' : ''));
      c.append(el('b', '', g.name), el('i', '', g.blurb), el('small', '', g.feel), el('small', 'c-prog', g.done + ' OF ' + g.total + ' STEPS'));
      c.addEventListener('mousedown', ev => { ev.stopPropagation(); on.genre(g.id); });
      gl.appendChild(c);
    });
    body.appendChild(gl);
    foot.append(btn('◀ CONTENTS', '', () => on.contents()), el('span', 'g-flex'));
    place();
  }

  /* where the panel stands: the corner that covers the least of what is lit, and of any box or menu that is open */
  function obstacles() {
    const out = [];
    targets.forEach(s => { const e = typeof s === 'string' ? find(root, panel, s) : null; if (e) out.push(rectOf(e)); });
    root.querySelectorAll('.g-box, .g-menu').forEach(b => { if (!panel.contains(b)) out.push(b.getBoundingClientRect()); });
    return out;
  }
  function place() {
    if (userMoved) return;
    const rr = root.getBoundingClientRect(), z = rr.width / root.offsetWidth || 1, w = panel.offsetWidth * z, h = panel.offsetHeight * z, M = 10 * z, topY = 138 * z;
    const spots = { br: [rr.right - w - M, rr.bottom - h - M], bl: [rr.left + M, rr.bottom - h - M], tr: [rr.right - w - M, rr.top + topY], tl: [rr.left + M, rr.top + topY] };
    const area = (x, y, o) => Math.max(0, Math.min(x + w, o.right) - Math.max(x, o.left)) * Math.max(0, Math.min(y + h, o.bottom) - Math.max(y, o.top));
    const obs = obstacles(), cost = k => obs.reduce((a, o) => a + area(spots[k][0], spots[k][1], o), 0);
    let best = panel.dataset.pos in spots ? panel.dataset.pos : 'br';
    if (cost(best) > 0) best = Object.keys(spots).sort((a, b) => cost(a) - cost(b))[0];
    panel.dataset.pos = best;
    panel.style.left = panel.style.right = panel.style.top = panel.style.bottom = '';
  }
  /* the rings round what to press, kept on it as the layout moves */
  function ring() {
    const rr = root.getBoundingClientRect(), z = rr.width / root.offsetWidth || 1, want = [];
    targets.forEach(s => { const e = typeof s === 'string' ? find(root, panel, s) : null; if (e) want.push(rectOf(e)); });
    while (rings.children.length > want.length) rings.lastChild.remove();
    while (rings.children.length < want.length) rings.appendChild(el('div', 'c-ring'));
    want.forEach((r, i) => { const d = rings.children[i]; d.style.left = ((r.left - rr.left) / z - 4) + 'px'; d.style.top = ((r.top - rr.top) / z - 4) + 'px'; d.style.width = (r.width / z + 8) + 'px'; d.style.height = (r.height / z + 8) + 'px'; });
  }
  return { showStep, mark, contents, chooser, place, ring, panel, remove() { panel.remove(); rings.remove(); }, isTyping: () => false };
}
