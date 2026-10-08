/* AutoExec.HC runs at boot. The seeded file has always said "this one really does", and now it does: every time the desktop comes up (the first time, and after a power cycle),
   ::/AutoExec.HC is read and run like any other HolyC. A clean run is a line in the toast and whatever bell it rings; a broken one opens a window that names the error and its line,
   which is the machine telling you where it hurts, and fixing it is a trophy. A file that is not there, or empty, is not an error. */
import { fs as vfs } from './vfs.js';
import { hcLex, hcParse, hcRun } from './holyc.js';
import { createWindow, toast } from './wm.js';
import { sys } from './trophy_hook.js';

export async function runAutoExec() {
  let file = null;
  try { file = await vfs.read('::/AutoExec.HC'); } catch (e) { return; }
  const src = file && typeof file.content === 'string' ? file.content : '';
  if (!src.trim()) return;
  const rows = [];
  let bad = null;
  try {
    const ast = hcParse(hcLex(src));
    hcRun(ast, l => rows.push(l), null, { dirNames: () => [] });
  } catch (e) { bad = e; }
  if (!bad) {
    sys.emit('autoexec', { ok: true });
    toast('AUTOEXEC.HC RAN CLEAN' + (rows.length ? ': ' + rows.slice(0, 2).join('  ') : '.'));
    return;
  }
  sys.mark('flags', 'autoexec-broken'); sys.emit('autoexec', { ok: false, line: bad.line || 0 });
  try { if (window.Snd) window.Snd.err(); } catch (e) { /* no sound */ }
  createWindow({
    kind: 'terminal', title: 'AUTOEXEC.HC', w: 460, h: 200,
    build: body => {
      const t = document.createElement('div'); t.className = 'term';
      const o = document.createElement('div'); o.className = 'termout';
      const put = (txt, cls) => { const d = document.createElement('div'); d.className = cls; d.textContent = txt; o.appendChild(d); };
      put('HOLYC JIT -- ::/AutoExec.HC', 'l-dim');
      rows.forEach(r => put(r, 'l-holyc'));
      put(bad.holyc ? 'HolyC: ' + bad.message + (bad.line ? '  (line ' + bad.line + ')' : '') : 'FAULT: ' + (bad && bad.message), 'l-err');
      put('', 'l-dim'); put('FIX THE FILE (IT IS ON THE DESKTOP) AND RESTART THE MONITOR.', 'l-dim');
      t.appendChild(o); body.appendChild(t);
    }
  });
}
