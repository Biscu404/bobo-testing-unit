/* Tiny helpers for building the Garage's screen. */
export const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
/* a chunky pixel button; fn runs on press, not release, like everything else here */
export function btn(label, cls, fn, title) {
  const b = el('button', 'g-btn ' + (cls || ''), label);
  if (title) b.title = title;
  b.addEventListener('mousedown', ev => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    if (b.disabled) return;
    if (window.Snd) window.Snd.click();
    fn(ev, b);
  });
  b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') ev.stopPropagation(); });
  return b;
}
export function slider(min, max, val, step, on) {
  const s = el('input', 'g-slider');
  s.type = 'range'; s.min = String(min); s.max = String(max); s.step = String(step); s.value = String(val);
  s.addEventListener('input', () => on(parseFloat(s.value)));
  s.addEventListener('mousedown', ev => ev.stopPropagation());
  return s;
}
/* a modal panel over the whole window, closed by its X or Escape */
export function modal(root, title, cls) {
  const wrap = el('div', 'g-modal');
  const box = el('div', 'g-box ' + (cls || ''));
  const head = el('div', 'g-boxhead');
  head.appendChild(el('span', 'g-boxtitle', title));
  const x = btn('X', 'g-x', () => close());
  head.appendChild(x);
  box.appendChild(head);
  wrap.appendChild(box);
  const body = el('div', 'g-boxbody');
  box.appendChild(body);
  root.appendChild(wrap);
  const close = () => { wrap.remove(); };
  wrap.addEventListener('mousedown', ev => { if (ev.target === wrap) close(); });
  return { wrap, box, body, close };
}
export const pad2 = n => String(n).padStart(2, '0');

/* a small menu hung from a button: items are [label, fn, hint?] or null for a rule; it goes when anything else is pressed */
export function menu(root, anchor, items) {
  document.querySelectorAll('.g-menu').forEach(m => m.remove());
  const m = el('div', 'g-menu');
  items.forEach(it => {
    if (!it) { m.appendChild(el('div', 'g-menurule')); return; }
    const row = el('div', 'g-mitem' + (it[3] ? ' off' : ''));
    row.append(el('span', '', it[0]), el('i', '', it[2] || ''));
    row.addEventListener('mousedown', ev => { ev.stopPropagation(); if (it[3]) return; close(); if (window.Snd) window.Snd.click(); it[1](); });
    m.appendChild(row);
  });
  root.appendChild(m);
  const r = anchor.getBoundingClientRect(), rr = root.getBoundingClientRect(), z = rr.width / root.offsetWidth || 1;
  m.style.left = Math.max(2, Math.min((r.left - rr.left) / z, root.offsetWidth - m.offsetWidth - 4)) + 'px';
  m.style.top = Math.min((r.bottom - rr.top) / z, root.offsetHeight - m.offsetHeight - 4) + 'px';
  const close = () => { m.remove(); document.removeEventListener('mousedown', away, true); document.removeEventListener('keydown', esc, true); };
  const away = ev => { if (!m.contains(ev.target)) close(); };
  const esc = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } };
  setTimeout(() => { document.addEventListener('mousedown', away, true); document.addEventListener('keydown', esc, true); }, 0);
  return { close };
}
/* a question with up to three answers: [[label, class, fn], ...] */
export function confirmBox(root, title, text, answers) {
  const m = modal(root, title, 'g-small');
  m.body.appendChild(el('div', 'g-p', text));
  const foot = el('div', 'g-boxfoot');
  answers.forEach(([label, cls, fn]) => foot.appendChild(btn(label, cls, () => { m.close(); if (fn) fn(); })));
  m.body.appendChild(foot);
  return m;
}
/* a number you can type or nudge: onChange gets the clamped value */
export function numberBox(value, min, max, step, onChange, cls) {
  const i = el('input', 'g-num2 ' + (cls || ''));
  i.type = 'number'; i.min = String(min); i.max = String(max); i.step = String(step); i.value = String(value);
  i.addEventListener('change', () => { const v = Math.max(min, Math.min(max, parseFloat(i.value) || min)); i.value = String(v); onChange(v); });
  i.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') i.blur(); });
  i.addEventListener('mousedown', ev => ev.stopPropagation());
  return i;
}
export const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + Math.floor((s * 10) % 10); };
export const dB = x => x <= 0.00001 ? -Infinity : 20 * Math.log10(x);
