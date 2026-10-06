/* Right-click policy for the whole machine.

   - The browser's own context menu never appears anywhere on the tube.
   - A text field (the editor, a name box, notes) gets a small menu of its own
     in the machine's style: cut, copy, paste, select all.
   - Everything else is up to the app that was clicked. An app that has
     nothing bound to the right button does nothing at all (wm.js also keeps
     the right button away from such apps' click handlers), and the desktop's
     menu is only for the bare desktop. */
import { showMenu } from './menus.js';
import { toast } from './wm.js';

const textual = f => f.tagName === 'TEXTAREA' ||
  (f.tagName === 'INPUT' && /^(text|search|number|password|email|url|tel|)$/i.test(f.type || ''));

function pasteInto(f) {
  f.focus();
  const put = txt => {
    const a = f.selectionStart, b = f.selectionEnd;
    f.setRangeText(txt, a, b, 'end');
    f.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const viaCommand = () => {
    let ok = false;
    try { ok = document.execCommand('paste'); } catch (e) {}
    if (!ok) toast('PRESS CTRL+V TO PASTE.');
  };
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(put, viaCommand);
  } else viaCommand();
}

function fieldMenu(f) {
  const sel = f.selectionStart !== f.selectionEnd;
  const ro = f.readOnly || f.disabled;
  return [
    { label: 'CUT', key: 'Ctrl+X', off: !sel || ro, run: () => { f.focus(); document.execCommand('cut'); } },
    { label: 'COPY', key: 'Ctrl+C', off: !sel, run: () => { f.focus(); document.execCommand('copy'); } },
    { label: 'PASTE', key: 'Ctrl+V', off: ro, run: () => pasteInto(f) },
    { sep: true },
    { label: 'SELECT ALL', key: 'Ctrl+A', run: () => { f.focus(); f.select(); } }
  ];
}

export function wireCtxGuard() {
  document.addEventListener('contextmenu', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#room')) return;
    ev.preventDefault();
    const f = t.closest('textarea, input');
    if (f && textual(f)) {
      ev.stopPropagation();
      showMenu(document.getElementById('ctxmenu'), ev.clientX, ev.clientY, fieldMenu(f));
    }
  }, true);
}
