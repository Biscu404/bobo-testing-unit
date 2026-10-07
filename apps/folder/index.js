import { showMenu, spriteFor, expectArrivals } from '../../kernel/desktop.js';
import { iconEl } from '../../kernel/icons_dom.js';
import { Dnd } from '../../kernel/dnd.js';
import { openItem, deletePaths } from '../../kernel/fileops.js';
import { itemMenu, spaceMenu } from '../../kernel/filemenus.js';
import { wireDrop } from '../../kernel/importer.js';
import { joinPath, dirOf, baseName } from '../../kernel/vfs_ops.js';
import { scopedListeners } from '../lifecycle.js';

const byKind = (a, b) => (a.type === 'folder') !== (b.type === 'folder')
  ? (a.type === 'folder' ? -1 : 1) : a.name.toLowerCase().localeCompare(b.name.toLowerCase());

export default {
  id: 'folder',
  title: 'FOLDER',
  width: 480,
  height: 340,
  resizable: true,

  async mount(root, ctx, args) {
    const _style = document.createElement('link');
    _style.rel = 'stylesheet';
    _style.href = 'apps/folder/style.css';
    root.appendChild(_style);

    let path = args?.path || '::';
    const history = [];
    const L = scopedListeners(root);
    root.style.display = 'flex';
    root.style.flexDirection = 'column';

    /* the bar: where you are, and the two ways out of it */
    const bar = document.createElement('div');
    bar.className = 'appbar fbar';
    const mk = (label, title, fn) => {
      const b = document.createElement('button');
      b.className = 'appbtn';
      b.textContent = label;
      b.title = title;
      b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.click(); fn(); });
      bar.appendChild(b);
      return b;
    };
    const bBack = mk('<', 'BACK', () => { if (history.length) go(history.pop(), true); });
    const bUp = mk('UP', 'UP ONE FOLDER (BACKSPACE)', () => up());
    const where = document.createElement('span');
    where.className = 'godword fwhere';
    const count = document.createElement('span');
    count.className = 'fcount';
    bar.appendChild(where);
    bar.appendChild(count);

    const body = document.createElement('div');
    body.className = 'win-folder';
    root.appendChild(bar);
    root.appendChild(body);

    let items = [];                      /* [{ name, type, app, path }] as drawn */
    let anchor = null;                   /* the last icon clicked, for shift-click ranges */
    const iconEls = () => Array.from(body.querySelectorAll('.icon'));
    const selectedEls = () => iconEls().filter(n => n.classList.contains('sel'));
    const itemFor = el => items.find(i => i.name === el.dataset.name);
    const clearSel = () => iconEls().forEach(n => n.classList.remove('sel'));

    const env = {
      get dir() { return path; },
      alive: () => root.isConnected,
      sel: () => selectedEls().map(itemFor).filter(Boolean),
      items: () => selectedEls().map(itemFor).filter(Boolean),
      selectAll: () => iconEls().forEach(n => n.classList.add('sel')),
      open: it => open(it),
      up: () => up()
    };
    const win = root.closest('.win');
    if (win) win._fileEnv = env;
    body.dataset.drop = path;

    function open(it) { if (window.Snd) window.Snd.open(); openItem(path, it); }
    function up() { if (path !== '::') go(dirOf(path)); }
    function go(p, fromBack) {
      if (!fromBack) history.push(path);
      path = p;
      body.dataset.drop = path;
      ctx.setTitle(path);
      render();
    }

    async function render() {
      const keep = new Set(selectedEls().map(n => n.dataset.name));
      const list = (await ctx.fs.list(path)).sort(byKind);
      items = list.map(it => Object.assign({}, it, { path: joinPath(path, it.name) }));
      where.textContent = path;
      count.textContent = items.length + (items.length === 1 ? ' ITEM' : ' ITEMS');
      bBack.disabled = !history.length;
      bUp.disabled = path === '::';
      const els = items.map(item => {
        const el = iconEl(item);
        if (keep.has(item.name)) el.classList.add('sel');
        if (item.type === 'folder') { el.dataset.drop = item.path; wireDrop(el, () => item.path); }
        wireIcon(el, item);
        return el;
      });
      body.replaceChildren(...els);
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'fempty';
        empty.textContent = 'NOTHING HERE YET. RIGHT-CLICK TO ADD SOMETHING, OR DRAG IT IN.';
        body.appendChild(empty);
      }
    }

    function wireIcon(el, item) {
      el.addEventListener('pointerdown', ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();
        if (ev.shiftKey && anchor) {
          const all = iconEls(), a = all.indexOf(anchor), b = all.indexOf(el);
          clearSel();
          all.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(n => n.classList.add('sel'));
        } else if (ev.ctrlKey || ev.metaKey) {
          el.classList.toggle('sel'); anchor = el;
        } else if (!el.classList.contains('sel')) {
          clearSel(); el.classList.add('sel'); anchor = el;
        } else anchor = el;
        if (window.Snd) window.Snd.select();
        const files = env.items();
        Dnd.begin(ev, {
          paths: files.map(f => f.path),
          svg: spriteFor(item.type, item.app), label: item.name,
          /* a folder cannot be dropped on itself, and dropping back on this window is a no-op */
          accept: z => !files.some(f => f.path === z.drop) && z.drop !== path,
          onStart: () => files.forEach(f => body.querySelector('.icon[data-name="' + CSS.escape(f.name) + '"]')?.classList.add('dragging')),
          onDrop: async (zone, e, cancelled) => {
            iconEls().forEach(n => n.classList.remove('dragging'));
            if (cancelled || !zone || zone.drop === path) return;
            if (zone.drop === '@trash') { await deletePaths(files.map(f => f.path)); return; }
            if (zone.drop === '::') expectArrivals(e.clientX, e.clientY, files.length);
            const out = await (e.ctrlKey ? ctx.fs.copyMany : ctx.fs.moveMany)(files.map(f => f.path), zone.drop);
            const n = out.made.length;
            if (out.bad.length) { import('../../kernel/wm.js').then(m => m.toast(out.bad[0])); if (window.Snd) window.Snd.err(); }
            if (n && window.Snd) window.Snd.drop();
            if (n) import('../../kernel/wm.js').then(m => m.toast((e.ctrlKey ? 'COPIED ' : 'MOVED ') + n + ' ITEM' + (n === 1 ? '' : 'S') + ' TO ' + (zone.drop === '::' ? 'THE DESKTOP' : baseName(zone.drop)) + '.'));
          }
        });
      });
      el.addEventListener('dblclick', ev => { ev.stopPropagation(); open(item); });
      el.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (!el.classList.contains('sel')) { clearSel(); el.classList.add('sel'); }
        showMenu(document.getElementById('ctxmenu'), ev.clientX, ev.clientY,
          itemMenu({ dir: path, items: env.items(), selectAll: env.selectAll }));
      });
    }

    /* the empty part of the folder: drop target for files from the user's own
       computer, the right-click menu, and a rubber band */
    wireDrop(body, () => path);
    body.addEventListener('contextmenu', ev => {
      if (ev.target.closest && ev.target.closest('.icon')) return;
      ev.preventDefault();
      ev.stopPropagation();
      clearSel();
      showMenu(document.getElementById('ctxmenu'), ev.clientX, ev.clientY, spaceMenu(env));
    });
    body.addEventListener('pointerdown', ev => {
      if (ev.button !== 0 || (ev.target.closest && ev.target.closest('.icon'))) return;
      if (!(ev.ctrlKey || ev.metaKey || ev.shiftKey)) clearSel();
      const r = body.getBoundingClientRect();
      const ox = ev.clientX - r.left + body.scrollLeft, oy = ev.clientY - r.top + body.scrollTop;
      const box = document.createElement('div');
      box.className = 'fband';
      let live = false, rects = null;
      const move = e => {
        const cx = e.clientX - r.left + body.scrollLeft, cy = e.clientY - r.top + body.scrollTop;
        if (!live && Math.abs(cx - ox) + Math.abs(cy - oy) < 4) return;
        if (!live) { live = true; body.appendChild(box); }
        const x0 = Math.min(ox, cx), x1 = Math.max(ox, cx), y0 = Math.min(oy, cy), y1 = Math.max(oy, cy);
        box.style.cssText = 'left:' + x0 + 'px;top:' + y0 + 'px;width:' + (x1 - x0) + 'px;height:' + (y1 - y0) + 'px';
        /* the icons stay where they are while the band moves: measure them once, then it is arithmetic */
        if (!rects) rects = iconEls().map(n => ({ n, l: n.offsetLeft, t: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight, on: n.classList.contains('sel') }));
        rects.forEach(q => {
          const hit = q.l < x1 && q.l + q.w > x0 && q.t < y1 && q.t + q.h > y0;
          if (hit !== q.on) { q.on = hit; q.n.classList.toggle('sel', hit); }
        });
      };
      const upEv = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upEv); box.remove(); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', upEv);
    });

    /* something changed under this folder (a drop, a paste, a rename, an upload,
       a restore): draw it again. The window's own listener goes when the window does. */
    L.on(window, 'vfs-changed', ev => {
      const dir = ev.detail && ev.detail.dir;
      if (!dir || dir === path || path.indexOf(dir + '/') === 0 || dir.indexOf(path + '/') === 0) render();
    });

    /* a delete reel takes its files out of the view a beat at a time (kernel/fileops.js), and the redraw comes at the end */
    L.on(window, 'vfs-reel', ev => {
      ((ev.detail && ev.detail.paths) || []).forEach(p => {
        if (dirOf(p) !== path) return;
        const n = baseName(p), el = iconEls().find(e => e.dataset.name === n);
        if (el) el.remove();
      });
    });

    ctx.setTitle(path);
    await render();
  },

  unmount() {}
};
