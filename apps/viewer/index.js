import { VaultURL } from '../../kernel/vault.js';
import { showMenu } from '../../kernel/menus.js';
import { wallpaperMenu } from '../../kernel/wallpaper.js';
import { deletePaths } from '../../kernel/fileops.js';
import { dirOf, baseName, joinPath } from '../../kernel/vfs_ops.js';
import { toast } from '../../kernel/wm.js';
import { whenGone } from '../lifecycle.js';
import { playVideo } from './video.js';

export default {
  id: 'viewer',
  title: 'VIEWER',
  icon: '',
  width: 460,
  height: 380,
  resizable: true,

  async mount(root, ctx, args) {
    const _style = document.createElement('link');
    _style.rel = 'stylesheet';
    _style.href = 'apps/viewer/style.css';
    root.appendChild(_style);
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.tabIndex = 0;
    root.style.outline = 'none';

    let path = args?.path || '';
    let stop = null, siblings = [], isVideo = false, actual = false;

    const pane = document.createElement('div');
    pane.className = 'imgpane';
    const bar = document.createElement('div');
    bar.className = 'appbar vbar';
    root.appendChild(pane);
    root.appendChild(bar);
    whenGone(root, () => { if (stop) stop(); stop = null; });

    const mk = (label, title, fn, host) => {
      const b = document.createElement('button');
      b.className = 'appbtn';
      b.textContent = label;
      b.title = title;
      b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.click(); fn(b, ev); });
      (host || bar).appendChild(b);
      return b;
    };
    const info = document.createElement('span');
    info.className = 'godword';

    /* the other pictures in the same folder, so the arrow keys can walk through them */
    async function findSiblings() {
      if (!path) return;
      const list = await ctx.fs.list(dirOf(path));
      siblings = list.filter(i => i.type === 'image' || i.type === 'video')
        .map(i => joinPath(dirOf(path), i.name))
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }
    const step = d => {
      if (siblings.length < 2) return;
      const i = siblings.indexOf(path);
      show(siblings[(i + d + siblings.length) % siblings.length]);
    };

    async function show(p) {
      if (stop) { stop(); stop = null; }
      path = p;
      pane.replaceChildren();
      pane.className = 'imgpane';
      bar.replaceChildren();
      const file = p ? await ctx.fs.read(p) : null;
      if (p) ctx.setTitle(p);
      if (!file) {
        pane.textContent = p ? 'THAT PICTURE IS NOT ON THE DISK ANY MORE.' : 'NO PICTURE. OPEN ONE FROM A FOLDER.';
        return;
      }
      isVideo = file.type === 'video';
      const src = isVideo && file.vault ? (await VaultURL.url(file.vault)) : (file.src || '');
      if (siblings.length > 1) {
        mk('<', 'PREVIOUS PICTURE (LEFT ARROW)', () => step(-1));
        mk('>', 'NEXT PICTURE (RIGHT ARROW)', () => step(1));
      }
      if (isVideo) {
        if (!src) { pane.textContent = 'THAT VIDEO IS NOT ON THE DISK ANY MORE.'; }
        else stop = playVideo(pane, bar, src);
      } else {
        const img = document.createElement('img');
        img.src = src;
        img.alt = p;
        img.title = 'CLICK TO SWITCH BETWEEN FIT AND ACTUAL SIZE';
        img.addEventListener('load', () => { info.textContent = img.naturalWidth + 'x' + img.naturalHeight; });
        img.addEventListener('click', () => { actual = !actual; pane.classList.toggle('actual', actual); });
        pane.classList.toggle('actual', actual);
        pane.appendChild(img);
      }
      mk('BACKGROUND', 'USE THIS AS THE DESKTOP BACKGROUND, IN ONE OF FIVE WAYS', (b) => {
        const r = b.getBoundingClientRect();
        showMenu(document.getElementById('ctxmenu'), r.left, r.top - 130, wallpaperMenu(p, isVideo));
      });
      mk('SAVE A COPY', 'MAKE A COPY NEXT TO THIS ONE', async () => {
        try { toast('SAVED A COPY: ' + baseName(await ctx.fs.copy(p, dirOf(p)))); } catch (e) { toast(e.message); }
      });
      mk('DELETE', 'PUT THIS IN THE RECYCLE BIN', async () => {
        const i = siblings.indexOf(p);
        if (await deletePaths([p])) {
          siblings = siblings.filter(x => x !== p);
          if (siblings.length) show(siblings[Math.min(i, siblings.length - 1)]); else ctx.close();
        }
      });
      bar.appendChild(info);
    }

    root.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); step(-1); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1); }
      else if (ev.key === 'Delete') { ev.preventDefault(); bar.querySelector('button:last-of-type')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }
    });
    root.addEventListener('mousedown', () => root.focus());

    await findSiblings();
    await show(path);
    setTimeout(() => root.focus(), 50);
  },

  unmount() {}
};
