/* The first thing a new user sees on the desktop: what the machine has, and a button for each. It opens once (the flag is kept),
   and again from the terminal (`WELCOME`), the Help window's START page and `window.Welcome.open()`. It is a kernel window: it only opens other windows. */
import { createWindow, openWindow } from './wm.js';
import { openHelp } from './help.js';

const KEY = 'templeos.welcome.v1';
const ROWS = [
  ['TERMINAL.EXE', 'Type HELP for every command. A line of HolyC runs as it is: "HELLO, TEMPLE.\\n";  TROPHIES, RESTORE, DEGAUSS, OPEN and DIR work here too.', 'TERMINAL', () => openWindow('terminal')],
  ['HELP', 'The machine\'s own manual: mouse and keys, files, music, HolyC, trophies. It cannot be deleted. Open it any time from the menu bar.', 'OPEN HELP', () => openHelp('start')],
  ['FILES', 'Double-click a folder to open it. Drag icons to move them, Ctrl to copy. Delete never destroys: it goes to the RecycleBin, and Ctrl+Z brings it back.', 'OPEN HOME', () => openWindow('folder', { path: '::/Home' })],
  ['GAMES', 'Magen, the Cook, Bekkedal, Solitaire, Dungeon Sweeper, Stand Battle, AfterEgypt. They pay SUN, the machine\'s money.', 'OPEN MAGEN', () => openWindow('magen')],
  ['CRAZY DAVE\'S', 'Spend SUN on frames, pointers, colour schemes, brushes, instruments, pots, seeds and the odd thing nobody lists.', 'OPEN SHOP', () => openWindow('shop')],
  ['TROPHIES.EXE', 'The ledger: hundreds of things to do. Pin the ones you are after and they follow you in the corner of the screen.', 'OPEN LEDGER', () => openWindow('trophies')],
  ['THE GARAGE', 'A studio with real instruments. LEARN is a short course; nothing is locked.', 'OPEN GARAGE', () => openWindow('garage')],
  ['THE MIXER', 'The note in the taskbar sets how loud each running thing is, and which lobby song plays. The knobs under the screen are the master volume.', null, null]
];

function seen() { try { return !!localStorage.getItem(KEY); } catch (e) { return true; } }
function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
let open = null;

export const Welcome = {
  open() {
    if (open && document.body.contains(open.win)) return open;
    mark();
    open = createWindow({
      kind: 'doc', title: 'WELCOME', w: 640, h: 540, appId: 'welcome',
      build: body => {
        const root = document.createElement('div');
        root.className = 'welcome';
        const h = document.createElement('div');
        h.className = 'wl-head';
        h.textContent = 'THE MACHINE IS AWAKE. HERE IS WHAT IT HAS.';
        root.appendChild(h);
        ROWS.forEach(([name, text, label, fn]) => {
          const row = document.createElement('div');
          row.className = 'wl-row';
          const t = document.createElement('div');
          t.className = 'wl-t';
          t.textContent = name;
          const d = document.createElement('div');
          d.className = 'wl-d';
          d.textContent = text;
          row.appendChild(t); row.appendChild(d);
          if (fn) {
            const b = document.createElement('button');
            b.className = 'appbtn';
            b.textContent = label;
            b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.click(); fn(); });
            row.appendChild(b);
          }
          root.appendChild(row);
        });
        const f = document.createElement('div');
        f.className = 'wl-foot';
        f.textContent = 'TYPE WELCOME IN THE TERMINAL TO SEE THIS AGAIN.';
        root.appendChild(f);
        body.appendChild(root);
      }
    });
    return open;
  },
  /* the first time the desktop is up */
  firstTime() { if (!seen()) setTimeout(() => this.open(), 1200); }
};
window.Welcome = Welcome;
