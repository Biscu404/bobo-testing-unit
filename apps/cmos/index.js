import { createSetup } from '../../kernel/bios_ui.js';
import { cmosF10 } from '../tools/trophy_calls.js';

/* CMOS SETUP UTILITY: the same screen as the one a held DEL opens at power-up (kernel/bios_ui.js), on the desktop. What it keeps is kept for the next
   power-on (kernel/bios_cfg.js); the footer's promises are all true now: the arrows select, +/- change, F9 loads the defaults, F10 saves and leaves, ESC quits. */
let setup = null;
export default {
  id: 'cmos',
  title: 'CMOS SETUP UTILITY',
  width: 600,
  height: 380,
  resizable: true,
  mount(root, ctx) {
    root.tabIndex = 0; root.style.outline = 'none'; root.style.position = 'relative';
    const set = setup = createSetup(root, {
      windowed: true, snd: window.Snd,
      info: () => ({ away: 0, cold: false }),
      onSave: (cfg, changed) => { cmosF10(); ctx.toast(changed ? 'SAVED. IT TAKES EFFECT AT THE NEXT POWER-ON.' : 'NOTHING TO SAVE. GOD IS PRESENT.'); },
      onExit: () => ctx.close()
    });
    root.addEventListener('keydown', ev => { if (set.key(ev)) { ev.preventDefault(); ev.stopPropagation(); } });
    root.addEventListener('mousedown', () => setTimeout(() => root.focus(), 0));
    setTimeout(() => root.focus(), 30);
    if (window.Snd && window.Snd.ok) window.Snd.ok();
  },
  unmount() { if (setup) setup.destroy(); setup = null; }
};
