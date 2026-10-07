/* The pop-up menus: one routine paints them, wherever they are asked for
   (the desktop, a folder, a title bar, the File menu). A menu item is
   { label, run, key?, off?, on? } or { sep: true }. `key` is the shortcut
   shown on the right; `on` puts a > in front of the choice that is current. */
export function showMenu(el, x, y, items) {
  if (!el) return;
  el.innerHTML = '';
  /* an item with `sub` opens its choices in place of this menu, with a way back */
  const open = (it) => showMenu(el, x, y, it.sub.concat([{ sep: true }, { label: '< BACK', run: () => showMenu(el, x, y, items) }]));
  items.forEach(it => {
    if (it.sep) {
      const s = document.createElement('div');
      s.className = 'sep';
      el.appendChild(s);
      return;
    }
    const d = document.createElement('div');
    d.className = 'mi' + (it.off ? ' off' : '');
    d.textContent = (it.on ? '> ' : '') + it.label;
    if (it.key) {
      const k = document.createElement('span');
      k.className = 'k';
      k.textContent = it.key;
      d.appendChild(k);
    }
    if (it.sub) d.textContent += ' ...';
    if (!it.off) {
      d.addEventListener('mousedown', ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();
        if (window.Snd) window.Snd.click();
        if (it.sub) { open(it); return; }
        hideMenus();
        it.run();
      });
    } else {
      d.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.err(); });
    }
    el.appendChild(d);
  });
  if (window.Snd && window.Snd.menu) window.Snd.menu();
  el.style.display = 'block';
  placeMenu(el, x, y);
}

/* Put a menu where the pointer is, and keep every item of it on the glass. (x, y) are viewport coordinates; the menu is
   positioned inside the shell, which is not at the corner of the viewport, and the viewport is not the picture either:
   below the glass is the chin of the monitor, so a menu clamped to the window's own height slid under the case. The
   box is moved up (and left) just far enough to fit inside the screen, and a menu taller than the screen scrolls. */
export function placeMenu(el, x, y) {
  const pad = 4, host = el.offsetParent, hr = host ? host.getBoundingClientRect() : { left: 0, top: 0, width: 1 };
  const k = host && host.offsetWidth ? hr.width / host.offsetWidth : 1;         /* the picture's own scale, if it has one */
  const sc = document.getElementById('screen');
  const sr = sc ? sc.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
  el.style.maxHeight = Math.max(80, (sr.bottom - sr.top - pad * 2) / k) + 'px';
  el.style.overflowY = 'auto';
  el.style.left = '0px';
  el.style.top = '0px';
  const w = el.offsetWidth * k, h = el.offsetHeight * k;
  const cx = Math.max(sr.left + pad, Math.min(x, sr.right - w - pad));
  const cy = Math.max(sr.top + pad, Math.min(y, sr.bottom - h - pad));
  el.style.left = ((cx - hr.left) / k) + 'px';
  el.style.top = ((cy - hr.top) / k) + 'px';
}

export function hideMenus() {
  const fm = document.getElementById('filemenu');
  const cm = document.getElementById('ctxmenu');
  if (fm) fm.style.display = 'none';
  if (cm) cm.style.display = 'none';
}

document.addEventListener('keydown', ev => { if (ev.key === 'Escape') hideMenus(); });
