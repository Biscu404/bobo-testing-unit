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
  el.style.left = '0px';
  el.style.top = '0px';
  el.style.left = Math.max(0, Math.min(x, window.innerWidth - el.offsetWidth - 4)) + 'px';
  el.style.top = Math.max(0, Math.min(y, window.innerHeight - el.offsetHeight - 4)) + 'px';
}

export function hideMenus() {
  const fm = document.getElementById('filemenu');
  const cm = document.getElementById('ctxmenu');
  if (fm) fm.style.display = 'none';
  if (cm) cm.style.display = 'none';
}

document.addEventListener('keydown', ev => { if (ev.key === 'Escape') hideMenus(); });
