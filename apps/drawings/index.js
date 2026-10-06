import { createWindow, raise, sysDialog, toast, openWindow } from '../../kernel/wm.js';
import { Snd } from '../../kernel/snd.js';
import { Cos } from '../../kernel/cos.js';
import { fs as vfs } from '../../kernel/vfs.js';
import { lampDip } from '../../kernel/hardware.js';
import { Vault, VaultURL } from '../../kernel/vault.js';
import { showMenu } from '../../kernel/desktop.js';
import { setWallpaperFromSrc, WALL_MODES } from '../../kernel/wallpaper.js';
import { changed } from '../../kernel/vfs_ops.js';

/* a sheet's pixels as a data URL, whether it is kept inline or in the vault */
async function sheetSrc(rec) {
  let src = rec.data;
  if (!src && rec.vault) {
    const url = await VaultURL.url(rec.vault);
    if (!url) return null;
    const blob = await (await fetch(url)).blob();
    src = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  }
  return src || null;
}

function openCrayon(rec) { openWindow('crayon', rec).catch(() => {}); }

let drawerWin = null;
window.addEventListener('crayon-saved', () => {
  if (drawerWin && drawerWin.refresh) drawerWin.refresh();
});
export default {
  async open() {
  if (!window.Crayon) await import('../crayon/index.js');
  const Crayon = window.Crayon;
  if (drawerWin && document.body.contains(drawerWin.win)) { raise(drawerWin.win); drawerWin.refresh(); return; }
  let pane = null;
  const made = createWindow({
    kind: 'folder', title: 'MY DRAWINGS', w: 520, h: 420, appId: 'drawings',
    build: body => {
      pane = document.createElement('div');
      pane.className = 'thumbwrap';
      body.appendChild(pane);
    }
  });
  drawerWin = made;

  made.refresh = function () {
    if (!pane) return;
    pane.innerHTML = '';
    if (!Crayon.st.items.length) {
      const e = document.createElement('div');
      e.className = 'emptynote';
      e.textContent = 'THE DRAWER IS EMPTY. OPEN DRAW.EXE AND PUT SOMETHING IN IT.';
      pane.appendChild(e);
      return;
    }
    Crayon.st.items.slice().reverse().forEach(rec => {
      const el = document.createElement('div');
      el.className = 'thumb';
      const im = document.createElement('img');
      im.src = rec.thumb || '';
      im.alt = rec.name;
      const lb = document.createElement('span');
      lb.className = 'lbl';
      lb.textContent = rec.name;
      el.appendChild(im);
      el.appendChild(lb);
      el.addEventListener('mousedown', ev => {
        ev.stopPropagation();
        pane.querySelectorAll('.thumb').forEach(n => n.classList.remove('sel'));
        el.classList.add('sel');
        Snd.select();
      });
      el.addEventListener('dblclick', () => { openCrayon(rec); });
      el.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        showMenu(document.getElementById('ctxmenu'), ev.clientX, ev.clientY, [
          { label: 'OPEN', run: () => openCrayon(rec) },
          { label: 'EXPORT PNG', run: async () => {
              let src = rec.data;
              if (!src && rec.vault) src = await VaultURL.url(rec.vault);
              if (!src) { toast('THAT SHEET IS GONE.'); return; }
              const a = document.createElement('a');
              a.download = rec.name + '.png';
              a.href = src;
              a.click();
            } },
          { label: 'SET AS BACKGROUND', run: async () => { const src = await sheetSrc(rec); if (src) setWallpaperFromSrc(src, 'fill'); else toast('THAT SHEET IS GONE.'); } },
          { label: 'BACKGROUND STYLE', sub: WALL_MODES.map(m => ({ label: m.label, run: async () => { const src = await sheetSrc(rec); if (src) setWallpaperFromSrc(src, m.id); } })) },
          { label: 'SAVE AS A FILE (HOME)', run: async () => {
              const src = await sheetSrc(rec);
              if (!src) { toast('THAT SHEET IS GONE.'); return; }
              const name = await vfs.uniqueName('::/Home', rec.name.replace(/\.png$/i, '') + '.PNG');
              await vfs.write('::/Home/' + name, { type: 'image', src });
              changed('::/Home');
              toast('SAVED: ::/Home/' + name);
            } },
          { sep: true },
          { label: 'THROW AWAY', run: () => {
              sysDialog('THROW IT AWAY?', 'DELETE ' + rec.name + ' FOR GOOD?\n\nTHERE IS NO WASTEBASKET ON THIS MACHINE.', {
                confirm: true, okLabel: 'DELETE',
                onOk: () => {
                  const i = Crayon.st.items.indexOf(rec);
                  if (i >= 0) Crayon.st.items.splice(i, 1);
                  if (rec.vault) Vault.del(rec.vault);
                  Crayon.save();
                  Snd.del();
                  made.refresh();
                }
              });
            } }
        ]);
      });
      pane.appendChild(el);
    });
  };
  made.refresh();
  lampDip();
  }
};