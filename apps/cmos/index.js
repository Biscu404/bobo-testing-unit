import { createWindow, raise } from '../../kernel/wm.js';
import { cmosF10 } from '../tools/trophy_calls.js';

const CMOS_ROWS = [
  ['System Time', () => new Date().toTimeString().slice(0, 8)],
  ['Drive ::', () => 'TEMPLE, 640K, CHS 40/2/8'],
  ['Video', () => 'VGA 640x480 16 colour'],
  ['Halt On', () => 'All Errors'],
  ['Ring', () => '0 (only)'],
  ['Memory Hole', () => 'Disabled'],
  ['Quick Boot', () => 'Disabled'],
  ['Network Boot', () => 'Not Installed'],
  ['Typematic Rate', () => '30/sec'],
  ['God', () => 'Present']
];

export default {
  id: 'cmos',
  title: 'CMOS SETUP UTILITY',
  width: 520,
  height: 320,
  resizable: true,
  mount(root, ctx) {
    const p = document.createElement('div');
    p.className = 'cmos';
    const h = document.createElement('div');
    h.className = 'cmoshead';
    h.textContent = 'HOLYTRON BIOS \u2014 STANDARD CMOS SETUP';
    p.appendChild(h);
    const t = document.createElement('div');
    t.className = 'cmosbody';
    CMOS_ROWS.forEach(r => {
      const row = document.createElement('div');
      row.className = 'cmosrow';
      row.innerHTML = '<span class="k">' + r[0] + '</span><span class="v">' + r[1]() + '</span>';
      t.appendChild(row);
    });
    p.appendChild(t);
    const f = document.createElement('div');
    f.className = 'cmosfoot';
    f.textContent = 'ESC: Quit    F10: Save & Exit    \u2191\u2193: Select Item';
    p.appendChild(f);
    root.appendChild(p);

    /* the footer's two promises, kept: F10 says there is nothing to save, Esc leaves */
    p.tabIndex = 0; p.style.outline = 'none';
    p.addEventListener('keydown', ev => {
      if (ev.key === 'F10') { ev.preventDefault(); ev.stopPropagation(); cmosF10(); ctx.toast('NOTHING TO SAVE. GOD IS PRESENT.'); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ctx.close(); }
    });
    p.addEventListener('mousedown', () => setTimeout(() => p.focus(), 0));
    setTimeout(() => p.focus(), 30);
    if (window.Snd && window.Snd.ok) window.Snd.ok();
  }
};
