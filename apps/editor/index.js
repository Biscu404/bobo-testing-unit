import { ddRender } from '../../kernel/doldoc.js';
import { createWindow } from '../../kernel/wm.js';
import { hcLex, hcParse, hcRun } from '../../kernel/holyc.js';
import { restoreSystemFiles } from '../../kernel/fileops.js';

/* a macro button in a document has nowhere to print, so it gets a window */
function runHolyCToast(cmd, ctx) {
  const rows = [];
  let ok = true;
  try {
    hcRun(hcParse(hcLex(cmd)), line => rows.push(line), null, {
      godDoodle: () => ctx.openWindow('goddoodle').catch(console.error),
      dirNames: () => []
    });
  } catch (e) {
    ok = false;
    rows.push(e && e.holyc ? 'HolyC: ' + e.message : 'FAULT: ' + (e && e.message));
  }
  if (window.Snd) { if (ok) window.Snd.holy(); else window.Snd.err(); }
  if (!rows.length) return;
  createWindow({
    kind: 'terminal', title: 'HolyC JIT', w: 420, h: 220, appId: 'editor',
    build: body => {
      const t = document.createElement('div');
      t.className = 'term';
      const o = document.createElement('div');
      o.className = 'termout';
      rows.forEach(r => {
        const d = document.createElement('div');
        d.className = ok ? 'l-holyc' : 'l-err';
        d.textContent = r;
        o.appendChild(d);
      });
      t.appendChild(o);
      body.appendChild(t);
    }
  });
}

/* a file that is not there is said out loud, with the two ways to get it back,
   rather than an empty page that looks like an empty file */
function notFound(root, path, ctx) {
  const pane = document.createElement('div');
  pane.className = 'ddpane';
  pane.style.padding = '14px';
  const say = (txt, color) => {
    const d = document.createElement('div');
    d.className = 'ddline';
    d.style.color = color || '#FFFFFF';
    d.textContent = txt;
    pane.appendChild(d);
  };
  say('NOT FOUND', '#FF5555');
  say(path, '#FFFF55');
  say('');
  say('THAT FILE IS NOT ON THE DISK ANY MORE. IT MAY BE IN THE RECYCLE BIN,');
  say('OR, IF IT CAME WITH THE MACHINE, RESTORE SYSTEM FILES BRINGS IT BACK.');
  say('');
  const row = document.createElement('div');
  row.className = 'appbar';
  row.style.position = 'static';
  const mk = (label, fn) => {
    const b = document.createElement('button');
    b.className = 'appbtn';
    b.textContent = label;
    b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.click(); fn(); });
    row.appendChild(b);
  };
  mk('RESTORE SYSTEM FILES', async () => {
    await restoreSystemFiles();
    if (await ctx.fs.stat(path)) { ctx.close(); ctx.openWindow('editor', { path }).catch(console.error); }
  });
  mk('OPEN THE RECYCLE BIN', () => ctx.openWindow('trash').catch(console.error));
  pane.appendChild(row);
  root.appendChild(pane);
}

export default {
  id: 'editor',
  title: 'EDIT',
  icon: '',
  width: 560,
  height: 400,
  resizable: true,

  async mount(root, ctx, args) {
    const _style = document.createElement('link');
    _style.rel = 'stylesheet';
    _style.href = 'apps/editor/style.css';
    root.appendChild(_style);

    const path = args?.path || '';
    let val = '';
    
    if (path) {
      const file = await ctx.fs.read(path);
      if (!file) { notFound(root, path, ctx); return; }
      val = file.content || '';
      window._lastTextPath = path;
    }
    
    const isDoc = path.toUpperCase().endsWith('.DD') || path.toUpperCase().endsWith('.HC') || args?.type === 'doc' || args?.type === 'code';
    let showSource = !isDoc;

    const pane = document.createElement('div');
    pane.className = 'ddpane';
    pane.style.display = showSource ? 'none' : 'block';
    
    const ta = document.createElement('textarea');
    ta.className = 'editor ddsrc';
    ta.spellcheck = false;
    ta.value = val;
    ta.style.display = showSource ? 'block' : 'none';
    
    const draw = () => ddRender(ta.value, pane,
      async (target) => { // onLink
        const targetPath = target.startsWith('::') ? target : `::/${target}`;
        ctx.openWindow('editor', { path: targetPath }).catch(console.error);
        if (window.Snd) window.Snd.open();
      },
      (cmd) => { // onMacro: a button in a document has nowhere to print, so it gets a window
        runHolyCToast(cmd, ctx);
      }
    );

    if (isDoc) draw();
    
    ta.addEventListener('input', async () => {
      if (path) {
        const file = await ctx.fs.read(path) || { type: 'text', content: '' };
        file.content = ta.value;
        await ctx.fs.write(path, file);
      }
    });
    
    ta.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { if(window.Snd) window.Snd.open(); }
      else if (ev.key.length === 1 || ev.key === 'Backspace') { if(window.Snd) window.Snd.type(); }
    });
    
    root.appendChild(pane);
    root.appendChild(ta);

    if (isDoc) {
      setTimeout(() => {
        const win = root.parentElement;
        const bar = win.querySelector('.titlebar');
        if (bar) {
          const btn = document.createElement('span');
          btn.className = 'm srcbtn';
          btn.textContent = '[SRC]';
          btn.addEventListener('mousedown', ev => {
            ev.stopPropagation();
            showSource = !showSource;
            if (window.Snd) window.Snd.click();
            if (showSource) {
              ta.style.display = 'block';
              pane.style.display = 'none';
              btn.textContent = '[DOC]';
            } else {
              ta.style.display = 'none';
              pane.style.display = 'block';
              btn.textContent = '[SRC]';
              draw();
            }
          });
          bar.insertBefore(btn, bar.querySelector('.m'));
        }
      }, 0);
    }
  },

  unmount() {}
};
