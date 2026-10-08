import { createWindow, raise, openWins } from '../../kernel/wm.js';
import { killed, tried } from '../tools/trophy_calls.js';

export default {
  id: 'tasks',
  title: 'Tasks',
  width: 520,
  height: 300,
  resizable: true,
  mount(root, ctx) {
    let timer = null;
    const t = document.createElement('div');
    t.className = 'term';
    const o = document.createElement('div');
    o.className = 'termout tasklist';
    t.appendChild(o);
    root.appendChild(t);
    const draw = (first) => {
      if (!first && !document.body.contains(o)) { clearInterval(timer); return; }
      o.innerHTML = '';
      const put = (txt, cls, click) => {
        const d = document.createElement('div');
        d.className = cls || 'l-ok';
        d.textContent = txt;
        if (click) {
          d.classList.add('killable');
          d.addEventListener('mousedown', ev => { ev.stopPropagation(); click(); });
        }
        o.appendChild(d);
      };
      put(' TASK  PARENT  RING  STATE     NAME', 'l-dim');
      put(' ' + '-'.repeat(52), 'l-dim');
      /* the first two cannot be ended, and say so: trying is a trophy */
      const firstborn = who => () => { tried(who); ctx.toast(who.toUpperCase() + ' CANNOT BE KILLED.'); if (window.Snd && window.Snd.err) window.Snd.err(); };
      put('    0       -     0  RUNNING   Adam', 'l-holy', firstborn('adam'));
      put('    1       0     0  RUNNING   Seth', 'l-holy', firstborn('seth'));
      
      openWins.forEach(rec => {
        const age = Math.max(0, Math.round((Date.now() - (rec.born || Date.now())) / 1000));
        const state = rec.win.classList.contains('hidden') ? 'WAITING' : 'RUNNING';
        put('  ' + String(rec.id).padStart(3) + '       1     0  ' +
            state.padEnd(9) + ' ' + String(rec.title).slice(0, 22) +
            '   ' + age + 's   [KILL]', 'l-ok', () => {
              killed(); if (rec.close) rec.close();
              draw();
            });
      });
      put('', 'l-dim');
      put(' ' + (openWins.length + 2) + ' TASKS. ADAM CANNOT BE KILLED.', 'l-dim');
      put(' CLICK A ROW TO KILL IT.', 'l-dim');
    };
    draw(true);
    timer = setInterval(draw, 1000);
    this._timer = timer;
  },
  unmount() {
    if (this._timer) clearInterval(this._timer);
  }
};
