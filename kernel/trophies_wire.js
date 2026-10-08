/* What the kernel hears for the trophies without a line added to the thing that makes the sound: purchases (`cos-changed`), windows opening (`wins-changed`), the SUN
   counter (`Economy.onChange`), and the hour of the day. Everything else the machine does that earns a trophy calls `sys.emit(...)` (kernel/trophy_hook.js) from where it happens. */
import { openWins } from './wm.js';
import { Cos, COS_CATS } from './cos.js';
import { GAME_APPS } from './trophies_system2.js';
import { sys } from './trophy_hook.js';

const DEFAULTS = { frame: 'beige', logo: 'temple', cursor: 'stock', scheme: 'vga' };

export function wire(T) {
  const S = T.scope('system');
  const shelves = () => {
    let all = true;
    Object.keys(COS_CATS).forEach(cat => {
      const full = COS_CATS[cat].list.every(it => Cos.has(cat, it.id));
      if (full) S.mark('shelves', cat); else all = false;
    });
    if (all) S.mark('bare', 'all');
  };
  const refit = () => {
    try { if (Object.keys(DEFAULTS).every(c => Cos.equipped(c) !== DEFAULTS[c] && Cos.has(c, Cos.equipped(c)))) S.mark('refit', 'all'); } catch (e) { /* no shop yet */ }
  };
  window.addEventListener('cos-changed', ev => { sys.emit('buy', ev.detail || {}); shelves(); refit(); });
  try { Cos.onChange(() => refit()); } catch (e) { /* no shop yet */ }

  const apps = new Set();
  window.addEventListener('wins-changed', () => {
    try { openWins.forEach(w => { if (w.appId && !apps.has(w.appId)) { apps.add(w.appId); if (w.appId !== 'placeholder') S.mark('apps', w.appId); if (GAME_APPS[w.appId]) S.mark('games', w.appId); } }); } catch (e) { /* never into the machine */ }
  });

  const money = () => { try { const tt = window.Economy.totals(); T.setStat('system', 'earned', tt.earned); T.setStat('system', 'spent', tt.spent); } catch (e) { /* no economy */ } };
  if (window.Economy) { window.Economy.onChange(money); money(); }

  let threeDone = false;
  setInterval(() => { if (!threeDone && new Date().getHours() === 3) { threeDone = true; sys.emit('clock', { hour: 3 }); } }, 20000);
}
