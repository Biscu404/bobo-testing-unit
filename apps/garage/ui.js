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
