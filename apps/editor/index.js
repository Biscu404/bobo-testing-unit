import { ddRender } from '../../kernel/doldoc.js';
import { restoreSystemFiles } from '../../kernel/fileops.js';
import { runMacro, openPath } from '../../kernel/macro_run.js';
import { runFileHolyC } from '../../kernel/compile.js';

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
    
    /* a link opens what is at its path (a folder as a folder, a picture in the viewer...); a button runs a word the terminal knows, or HolyC, in a window of its own */
    const draw = () => ddRender(ta.value, pane, target => { openPath(target).catch(console.error); }, cmd => { runMacro(cmd).catch(console.error); });

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
          /* a program can be run from where it is read */
          if (/\.HC$/i.test(path)) {
            const run = document.createElement('span');
            run.className = 'm srcbtn';
            run.textContent = '[RUN]';
            run.addEventListener('mousedown', async ev => {
              ev.stopPropagation();
              const f = await ctx.fs.read(path);
              if (f) { f.content = ta.value; await ctx.fs.write(path, f); }
              runFileHolyC(path);
            });
            bar.insertBefore(run, btn);
          }
        }
      }, 0);
    }
  },

  unmount() {}
};
