/* The parts a lesson's coach and a puzzle's brief are both made of: text with `code` and [KEYS] picked out, buttons that press on mouse-down like every other
   button on the machine, the row of dots that shows where you are, and the banner that says what was just earned. */
export const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

/* `code` in yellow on black, [RUN] as a key cap; everything else as it is */
export function rich(host, text) {
  const re = /`([^`]+)`|\[([A-Z][A-Z0-9 +\/-]*)\]/g;
  let at = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > at) host.appendChild(document.createTextNode(text.slice(at, m.index)));
    host.appendChild(m[1] != null ? el('code', 'hc-code', m[1]) : el('b', 'hc-key', m[2]));
    at = m.index + m[0].length;
  }
  if (at < text.length) host.appendChild(document.createTextNode(text.slice(at)));
  return host;
}
export const para = (text, cls) => rich(el('p', cls || 'hc-p'), text);

export function button(label, cls, fn, snd, title) {
  const b = el('button', 'hc-b ' + (cls || ''), label);
  if (title) b.title = title;
  b.addEventListener('mousedown', ev => { if (ev.button !== 0) return; ev.stopPropagation(); if (b.disabled) return; if (snd) snd.click(); fn(ev, b); });
  b.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (!b.disabled) fn(ev, b); } });
  return b;
}
/* a goal or a test, with its tick box */
export function checkRow(text, state) {
  const row = el('div', 'hc-goal' + (state === true ? ' on' : state === false ? ' bad' : ''));
  row.append(el('span', 'hc-box'), el('span', 'hc-gt', text));
  return row;
}
export const stars = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, 4 - n));
/* a short banner that says what was earned, and goes by itself */
export function banner(host, text, cls, ms) {
  const b = el('div', 'hc-banner ' + (cls || ''), text);
  host.appendChild(b);
  setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 600); }, ms || 3200);
  return b;
}
