/* An installed program, as an app: what the workshop's INSTALL put on the desktop opens this. It is only the stage (and what the program printed, under it): no
   editor, no tests. A program that fails to read or run says so, plainly, and EDIT opens it in the workshop to be fixed. */
import { runProgram } from './engine.js';
import { makeStageView } from './stage_view.js';
import { el } from './tutor_ui.js';
import { whenGone } from '../lifecycle.js';

export async function mountPlayer(root, ctx, args, HC, snd) {
  root.classList.add('hc', 'hc-player');
  let src = '', name = args.name || 'PROGRAM';
  try { const rec = await ctx.fs.read(args.from); if (rec && typeof rec.content === 'string') src = rec.content; } catch (e) { /* gone */ }
  if (!src) { root.appendChild(el('div', 'hc-perr', 'THE PROGRAM IS NOT THERE ANY MORE. (IT WAS DELETED, OR THIS ICON IS A COPY OF ONE THAT WAS.)')); return; }
  try { ctx.setTitle(String(name).toUpperCase()); } catch (e) { /* the title stays */ }
  /* an installed program is a small window, not the lab's big one */
  const win = root.closest('.win') || (root.parentElement && root.parentElement.parentElement);
  if (win && win.style) { win.style.width = '560px'; win.style.height = '470px'; }
  const bar = el('div', 'hc-pbar2'), host = el('div', 'hc-phost'), out = el('div', 'hc-pout');
  const edit = el('button', 'hc-b sm', 'EDIT'); edit.title = 'open it in the workshop';
  edit.addEventListener('mousedown', ev => { ev.stopPropagation(); snd.click(); ctx.openWindow('holyc', { edit: src, name: name }).catch(() => {}); });
  const again = el('button', 'hc-b sm', 'RESTART'); again.addEventListener('mousedown', ev => { ev.stopPropagation(); snd.click(); start(); });
  bar.append(el('span', 'hc-chtitle', String(name).toUpperCase()), el('span', 'hc-flex'), again, edit);
  root.append(bar, host, out);
  const sv = makeStageView(host, { board: false, onPress: () => snd.press() });
  let R = null, last = performance.now();
  function start() {
    out.innerHTML = ''; sv.clear();
    R = runProgram(HC, src, { rand: Math.random, sound: snd, onOut: line => { out.appendChild(el('div', 'l-out', line || ' ')); out.scrollTop = out.scrollHeight; } });
    if (R.err) { out.appendChild(el('div', 'l-err', (R.err.line ? 'LINE ' + R.err.line + ': ' : '') + R.err.message)); snd.error(); }
    sv.attach(R.stage);
    out.style.display = out.childElementCount ? '' : 'none';
    R.stage.onChange(() => { out.style.display = out.childElementCount ? '' : 'none'; });
    last = performance.now();
  }
  start();
  const clock = setInterval(() => { const now = performance.now(), dt = now - last; last = now; if (R && !R.err && R.stage.timers.length && root.isConnected && dt < 2000) R.stage.advance(dt); }, 100);
  snd.preload();
  whenGone(root, () => { clearInterval(clock); sv.destroy(); snd.stop(); });
}
