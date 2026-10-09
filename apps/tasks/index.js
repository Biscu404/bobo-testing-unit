import { raise, openWins } from '../../kernel/wm.js';
import { killed, tried } from '../tools/trophy_calls.js';

/* TASKS: Adam and Seth, and every window as a task. Click a row to pick it, double-click or Enter to bring it forward (a minimised one comes back), the [END] on a row or
   Delete to kill it. NODES is the real size of the window: how many elements it has made. Adam and Seth cannot be ended, and say so. */
const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
const span = s => (s < 90 ? s + 's' : s < 5400 ? Math.round(s / 60) + 'm' : Math.round(s / 3600) + 'h');

export default {
  id: 'tasks',
  title: 'Tasks',
  width: 600,
  height: 340,
  resizable: true,
  mount(root, ctx) {
    const t = document.createElement('div'); t.className = 'term'; t.tabIndex = 0; t.style.outline = 'none';
    const o = document.createElement('div'); o.className = 'termout tasklist';
    t.appendChild(o); root.appendChild(t);
    let timer = null, sel = null, shown = '';
    const put = (txt, cls, on) => {
      const d = document.createElement('div'); d.className = cls || 'l-ok'; if (txt) d.textContent = txt;
      if (on) { d.classList.add('killable'); on(d); }
      o.appendChild(d); return d;
    };
    const bring = rec => { if (rec.win.classList.contains('hidden')) rec.btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); else raise(rec.win); if (window.Snd && window.Snd.select) window.Snd.select(); };
    const end = rec => { killed(); if (rec.close) rec.close(); sel = null; draw(true); };
    const firstborn = who => () => { tried(who); ctx.toast(who.toUpperCase() + ' CANNOT BE KILLED.'); if (window.Snd && window.Snd.err) window.Snd.err(); };
    const rowText = rec => {
      const age = Math.max(0, Math.round((Date.now() - (rec.born || Date.now())) / 1000));
      const state = rec.win.classList.contains('hidden') ? 'WAITING' : 'RUNNING';
      return lpad(rec.id, 5) + '       1     0  ' + pad(state, 8) + lpad(rec.win.querySelectorAll('*').length, 6) + '  ' + pad(span(age), 5) + ' ' + String(rec.title).slice(0, 26);
    };
    function draw(force) {
      if (!document.body.contains(o)) { clearInterval(timer); return; }
      const sig = openWins.map(r => r.id).join(',') + '|' + sel;
      if (!force && sig === shown) {                                  /* the same windows: only the numbers move */
        o.querySelectorAll('[data-task]').forEach(d => { const r = openWins.find(x => String(x.id) === d.dataset.task); if (r) d.firstChild.textContent = rowText(r) + '   '; });
        return;
      }
      shown = sig; o.innerHTML = '';
      put('  TASK  PARENT  RING  STATE    NODES  AGE   NAME', 'l-dim');
      put(' ' + '-'.repeat(60), 'l-dim');
      put('     0       -     0  RUNNING      -   -     Adam', 'l-holy', d => d.addEventListener('mousedown', ev => { ev.stopPropagation(); firstborn('adam')(); }));
      put('     1       0     0  RUNNING      -   -     Seth', 'l-holy', d => d.addEventListener('mousedown', ev => { ev.stopPropagation(); firstborn('seth')(); }));
      openWins.forEach(rec => {
        put('', rec.id === sel ? 'l-holy' : 'l-ok', d => {
          d.dataset.task = rec.id;
          d.appendChild(document.createTextNode(rowText(rec) + '   '));
          const x = document.createElement('span'); x.className = 'tend'; x.textContent = '[END]'; d.appendChild(x);
          x.addEventListener('mousedown', ev => { ev.stopPropagation(); end(rec); });
          d.addEventListener('mousedown', ev => { ev.stopPropagation(); t.focus(); sel = rec.id; draw(true); });
          d.addEventListener('dblclick', () => bring(rec));
        });
      });
      put('', 'l-dim');
      put(' ' + (openWins.length + 2) + ' TASKS. ADAM AND SETH CANNOT BE ENDED.', 'l-dim');
      put(' CLICK A ROW TO PICK IT. DOUBLE-CLICK OR ENTER: BRING IT FORWARD. [END] OR DEL: KILL IT.', 'l-dim');
    }
    t.addEventListener('keydown', ev => {
      const ids = openWins.map(r => r.id); if (!ids.length) return;
      let i = ids.indexOf(sel);
      if (ev.key === 'ArrowDown') i = Math.min(ids.length - 1, i + 1);
      else if (ev.key === 'ArrowUp') i = Math.max(0, i < 0 ? 0 : i - 1);
      else if (ev.key === 'Enter' && sel != null) { bring(openWins[i]); return; }
      else if ((ev.key === 'Delete' || ev.key === 'k' || ev.key === 'K') && sel != null) { ev.preventDefault(); end(openWins[i]); return; }
      else return;
      ev.preventDefault(); sel = ids[i]; draw(true);
    });
    draw(true);
    timer = setInterval(() => draw(false), 1000);
    this._timer = timer;
  },
  unmount() { if (this._timer) clearInterval(this._timer); }
};
