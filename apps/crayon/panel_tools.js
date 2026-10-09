/* The TOOLS panel: the six tools, what Dave sells beside them (dim until it is bought, then a tool like the others), and the size of the nib.
   Its own window (panels.js): it knows the sheet only through the session (session.js) and what the main window hands it (`env`). */
import { scopedListeners, whenGone } from '../lifecycle.js';
import { SIZE_NAMES } from './session.js';

const BASIC = [['crayon', 'CRAYON'], ['marker', 'MARKER'], ['pencil', 'PENCIL'], ['spray', 'SPRAY'], ['eraser', 'ERASER'], ['fill', 'FILL']];

export function buildTools(body, sess, env) {
  const wl = scopedListeners(body);
  const box = document.createElement('div');
  box.className = 'drawtools drawpanel';
  body.appendChild(box);
  const hd = t => { const d = document.createElement('div'); d.className = 'hd'; d.textContent = t; box.appendChild(d); };
  const grid = cls => { const d = document.createElement('div'); d.className = 'drawcols' + (cls ? ' ' + cls : ''); box.appendChild(d); return d; };
  const toolBtns = [], locks = [], sizeBtns = [];

  hd('TOOL');
  const tg = grid();
  BASIC.forEach(([id, name]) => {
    const b = document.createElement('button');
    b.className = 'tl'; b.textContent = name; b.dataset.tool = id;
    b.addEventListener('mousedown', ev => { ev.stopPropagation(); sess.setTool(id); env.click(); });
    toolBtns.push(b); tg.appendChild(b);
  });
  /* what Dave sells: shown for everybody, so it can be found */
  env.brushes.forEach(c => {
    const b = document.createElement('button');
    b.className = 'tl'; b.textContent = c.name; b.dataset.tool = c.id; b.title = c.blurb;
    b.addEventListener('mousedown', ev => {
      ev.stopPropagation();
      if (!env.owns(c.id)) { env.toDave('THE ' + c.name + ' FOR ' + c.price + ' SUN'); return; }
      sess.setTool(c.id); env.click();
    });
    toolBtns.push(b); locks.push([b, c]); tg.appendChild(b);
  });

  hd('SIZE');
  const sg = grid('three');
  SIZE_NAMES.forEach((n, i) => {
    const b = document.createElement('button');
    b.className = 'tl'; b.textContent = n;
    b.addEventListener('mousedown', ev => { ev.stopPropagation(); sess.setSize(i); env.click(); });
    sizeBtns.push(b); sg.appendChild(b);
  });

  const show = () => {
    toolBtns.forEach(b => b.classList.toggle('on', b.dataset.tool === sess.tool));
    sizeBtns.forEach((b, i) => b.classList.toggle('on', i === sess.size));
  };
  const locked = () => locks.forEach(([b, c]) => { const have = env.owns(c.id); b.classList.toggle('locked', !have); b.title = have ? c.blurb : c.blurb + '  --  ' + c.price + ' SUN AT DAVE\'S'; });
  const off = sess.on(what => { if (what === 'tool' || what === 'size') show(); });
  whenGone(box, off);
  wl.on(window, 'cos-changed', () => { if (box.isConnected) locked(); });
  show(); locked();
}
