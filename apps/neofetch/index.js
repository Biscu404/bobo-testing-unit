import { createWindow, openWins } from '../../kernel/wm.js';
import { Snd } from '../../kernel/snd.js';
import { Cos } from '../../kernel/cos.js';
import { registry } from '../../kernel/registry.js';
import { fs as vfs } from '../../kernel/vfs.js';
import { whenGone } from '../lifecycle.js';
import { totals } from '../trophies/model.js';

/* NEOFETCH: what the machine says about itself, and it is true: the uptime keeps counting, the tasks are the windows that are open, the colours are the ones on the
   glass now, the disk is counted, the trophies and the SUN are the ledger's. R reads it all again. */
const TEMPLE = [
  '        /\\        ', '       /  \\       ', '      /    \\      ', '     /______\\     ', '    ||||||||||    ',
  '    ||||||||||    ', '    ||||||||||    ', '   /__________\\   ', '  /____________\\  '
];
const VGA = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA', '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
const commas = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dur = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ' hour' + (h > 1 ? 's' : '') + ', ' : '') + (h || m ? m + ' min, ' : '') + (s % 60) + ' s'; };
const name = (cat, none) => { try { const f = Cos.find(cat, Cos.equipped(cat)); return f ? f.name : none; } catch (e) { return none; } };

async function facts() {
  let files = 0;
  try { files = (await vfs.names('::')).size; } catch (e) { files = 0; }
  return { files };
}

function rows(f) {
  const up = Math.max(1, Math.round((Date.now() - (window._bootAt || Date.now())) / 1000)), wins = openWins.length;
  const scr = document.getElementById('screen'), W = scr ? scr.clientWidth : 640, H = scr ? scr.clientHeight : 480;
  const heap = performance && performance.memory ? performance.memory.usedJSHeapSize : 0;
  let tro = '', sun = '';
  try { const t = totals(window.Trophies); tro = t.done + ' of ' + t.total; } catch (e) { tro = '-'; }
  try { sun = commas(window.Economy.balance()) + ' SUN (' + commas(window.Economy.totals().earned) + ' ever)'; } catch (e) { sun = '-'; }
  const crt = window.CRT || {};
  return [
    ['', 'root@temple'], ['', '-----------'],
    ['OS', 'TempleOS V5.03 x86_64'], ['Host', 'HOLYTRON DM-640'], ['Kernel', 'Adam (ring 0, one address space)'],
    ['Uptime', dur(up)], ['Packages', Object.keys(registry).length + ' apps (no package manager)'],
    ['Resolution', W + 'x' + H + ' on the glass, 640x480 in spirit'], ['Colours', name('scheme', 'VGA 16')],
    ['Case', name('frame', 'BEIGE')], ['Pointer', name('cursor', 'ARROW')],
    ['Glass', 'SCAN ' + (crt.scan === 5 ? 'OFF' : crt.scan || 0) + ', P' + [1, 4, 7][crt.phos || 0] + (crt.burn ? ', BURNT IN' : '') + (crt.degauss ? ', DEGAUSSED' : '')],
    ['CPU', (navigator.hardwareConcurrency || 1) + ' threads, anything with a TSC'],
    ['Memory', commas(f.files * 640) + ' / 640,000 bytes' + (heap ? '  (heap ' + Math.round(heap / 1048576) + ' MB)' : '')],
    ['Disk', commas(f.files) + ' things at the top of ::'], ['Tasks', (wins + 2) + ' (Adam, Seth, and ' + wins + ' children)'],
    ['Ledger', sun], ['Trophies', tro], ['Network', 'none, by design']
  ];
}

function paint(o, f) {
  o.textContent = '';
  const r = rows(f), n = Math.max(TEMPLE.length, r.length);
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'l-ok'; d.style.whiteSpace = 'nowrap';
    const a = document.createElement('span'); a.className = 'nf-art'; a.textContent = TEMPLE[i] || ' '.repeat(18);
    const k = document.createElement('span'); k.className = 'nf-k'; k.textContent = r[i] && r[i][0] ? '  ' + r[i][0].padEnd(11) : '  ';
    const v = document.createElement('span'); v.textContent = r[i] ? r[i][1] : '';
    d.append(a, k, v); o.appendChild(d);
  }
  const bar = (from, to) => { const b = document.createElement('div'); b.style.paddingTop = '4px'; b.appendChild(document.createTextNode('  ')); for (let i = from; i < to; i++) { const c = document.createElement('span'); c.style.cssText = 'display:inline-block;width:3ch;height:1.1em;vertical-align:text-bottom;background:' + VGA[i]; c.setAttribute('aria-hidden', 'true'); b.appendChild(c); }       /* a swatch is a block of colour, not text (the contrast check reads text) */ o.appendChild(b); };
  bar(0, 8); bar(8, 16);
  const h = document.createElement('div'); h.className = 'l-dim'; h.style.paddingTop = '6px'; h.textContent = '  R: READ IT AGAIN'; o.appendChild(h);
}

export default {
  async open() {
    let f = await facts(), timer = null;
    createWindow({
      kind: 'terminal', title: 'Neofetch', w: 660, h: 520, appId: 'neofetch',
      build: body => {
        const t = document.createElement('div'); t.className = 'term'; t.tabIndex = 0; t.style.outline = 'none';
        const o = document.createElement('div'); o.className = 'termout';
        t.appendChild(o); body.appendChild(t);
        paint(o, f);
        timer = setInterval(() => { if (!o.isConnected) { clearInterval(timer); return; } paint(o, f); }, 1000);
        t.addEventListener('keydown', async ev => { if (ev.key === 'r' || ev.key === 'R') { f = await facts(); paint(o, f); Snd.ok(); } });
        t.addEventListener('mousedown', () => setTimeout(() => t.focus(), 0));
        setTimeout(() => t.focus(), 30);
        whenGone(t, () => clearInterval(timer));
      }
    });
    Snd.holy();
  }
};
