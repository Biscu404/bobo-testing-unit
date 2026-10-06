import { fs } from './vfs.js';
import './vfs_ops.js';
import { registry } from './registry.js';
import { Snd } from './snd.js';
import { lampDip } from './hardware.js';
import { Cos } from './cos.js';
import { attachZoom } from './zoom.js';
import { Studio } from './studio.js';

let zTop = 100;
let cascadeN = 0;
export const openWins = [];
const TITLE_COLORS = {
  folder:   { bar: '#55FFFF', border: '#00AAAA' },
  text:     { bar: '#FFFF55', border: '#AA5500' },
  doc:      { bar: '#55FF55', border: '#00AA00' },
  image:    { bar: '#FF55FF', border: '#AA00AA' },
  video:    { bar: '#FF5555', border: '#AA0000' },
  app:      { bar: '#FF55FF', border: '#AA00AA' },
  panic:    { bar: '#FF5555', border: '#FF5555' },
  terminal: { bar: '#AAAAAA', border: '#FFFFFF' }
};

/* the mixer (and anything else that cares what is running) listens for this
   instead of polling the window list */
export function announceWins() {
  try { window.dispatchEvent(new CustomEvent('wins-changed')); } catch (e) {}
}

let taskSeq = 0;
function nextTaskId() { return ++taskSeq; }

function nextCascade(w, h) {
  const desk = document.getElementById('desktop');
  const maxX = Math.max(10, desk.clientWidth  - w - 10);
  const maxY = Math.max(10, desk.clientHeight - h - 10);
  const x = Math.min(120 + cascadeN * 25, maxX);
  const y = Math.min(30  + cascadeN * 25, maxY);
  cascadeN = (cascadeN + 1) % 9;
  return { x: x, y: y };
}

export function raise(win) {
  zTop++;
  win.style.zIndex = zTop;
  openWins.forEach(o => o.btn.classList.toggle('active', o.win === win));
}

export function createWindow(opts) {
  const desk = document.getElementById('desktop');
  const w = Math.min(opts.w || 640, desk.clientWidth  - 20);
  const h = Math.min(opts.h || 480, desk.clientHeight - 20);

  const win = document.createElement('div');
  win.className = 'win';
  win.style.width = w + 'px';
  win.style.height = h + 'px';

  const pos = nextCascade(w, h);
  win.style.left = pos.x + 'px';
  win.style.top  = pos.y + 'px';

  if (opts.kind === 'panic') win.classList.add('panic');

  const skin = TITLE_COLORS[opts.kind] || TITLE_COLORS.text;
  win.style.borderColor = skin.border;

  const bar = document.createElement('div');
  bar.className = 'titlebar';
  bar.style.background = skin.bar;

  const t = document.createElement('span');
  t.className = 't';
  t.textContent = opts.title;

  const mbtn = document.createElement('span');
  mbtn.className = 'm';
  mbtn.textContent = '[_]';

  const fbtn = document.createElement('span');
  fbtn.className = 'f';
  fbtn.textContent = '[\u25A1]';
  fbtn.title = 'FULLSCREEN. Fill the desktop. F11 or double-click the title bar also works.';

  const x = document.createElement('span');
  x.className = 'x';
  x.textContent = '[X]';

  bar.appendChild(t);

  let winScheme = null;
  if (opts.appId) {
    const th = document.createElement('span');
    th.className = 'th';
    th.textContent = '[T]';
    th.title = 'WINDOW THEME. Pick a colour scheme for just this window.';
    th.addEventListener('mousedown', async ev => {
      ev.stopPropagation();
      if (window.Snd) window.Snd.click();
      const { showMenu } = await import('./desktop.js');
      const schemes = Cos.owned('scheme');
      const items = [{ label: winScheme ? 'SYSTEM DEFAULT' : '> SYSTEM DEFAULT', run: () => {
        winScheme = null;
        Cos.applyWinScheme(win, null);
      } }, { sep: true }];
      schemes.forEach(id => {
        const s = Cos.find('scheme', id);
        if (!s) return;
        items.push({ label: (winScheme === id ? '> ' : '') + s.name, run: () => {
          winScheme = id;
          Cos.applyWinScheme(win, id);
        } });
      });
      const r = th.getBoundingClientRect();
      showMenu(document.getElementById('ctxmenu'), r.left, r.bottom, items);
    });
    bar.appendChild(th);
  }

  bar.appendChild(mbtn);
  bar.appendChild(fbtn);
  bar.appendChild(x);

  const body = document.createElement('div');
  body.className = 'wbody';
  let rec = null;                 /* the window's entry in openWins, below */

  if (opts.build) opts.build(body);

  const grip = document.createElement('div');
  grip.className = 'grip';
  if (opts.resizable === false) grip.style.display = 'none';

  win.appendChild(bar);
  win.appendChild(body);
  win.appendChild(grip);
  desk.appendChild(win);

  const btn = document.createElement('div');
  btn.className = 'tbtn';
  btn.textContent = opts.title;
  document.getElementById('tasks').appendChild(btn);

  function minimize() {
    win.classList.add('hidden');
    btn.classList.add('min');
    btn.classList.remove('active');
    Snd.min();
  }

  function unminimize() {
    win.classList.remove('hidden');
    btn.classList.remove('min');
    raise(win);
    Snd.open();
  }

  /* ---- fullscreen -------------------------------------------------------
     Every window can fill the desktop. A window whose app lays itself out
     off its own size (flagged data-fluid, or any plain DOM layout) is simply
     given the room. A canvas game that draws at a fixed size is instead kept
     at the size it was built for and scaled to fit, so a 960x540 field is
     never a postage stamp in the middle of a big black pane. */
  let full = false, saved = null, panX = 0.5, panY = 0.5;
  const fitScaled = () => {
    if (!full || !win.classList.contains('scaled')) return;
    const th = bar.offsetHeight;
    const aw = desk.clientWidth - 4, ah = desk.clientHeight - th - 4;
    /* the zoom is a multiplier on the fit; past the screen the picture follows the pointer */
    const k = Math.min(aw / saved.bw, ah / saved.bh) * (zoom ? zoom.get() : 1);
    const gx = aw - saved.bw * k, gy = ah - saved.bh * k;
    body.style.width = saved.bw + 'px';
    body.style.height = saved.bh + 'px';
    body.style.transform = 'translate(' + (gx >= 0 ? gx / 2 : gx * panX) + 'px,' +
      (gy >= 0 ? gy / 2 : gy * panY) + 'px) scale(' + k + ')';
  };
  const follow = ev => {
    if (!full || !win.classList.contains('scaled')) return;
    const r = body.parentNode.getBoundingClientRect(), th = bar.offsetHeight;
    panX = Math.max(0, Math.min(1, (ev.clientX - r.left) / Math.max(1, r.width)));
    panY = Math.max(0, Math.min(1, (ev.clientY - r.top - th) / Math.max(1, r.height - th)));
    if (zoom && zoom.get() > 1) fitScaled();
  };
  win.addEventListener('pointermove', follow, true);
  function setFull(on) {
    if (on === full) return;
    if (win.classList.contains('hidden')) return;
    if (on) {
      const fluid = body.dataset.fluid === '1';
      const fixedCanvas = !fluid && !!body.querySelector('canvas');
      /* the browser's zoom comes off first, so the size measured is the window's own */
      if (fixedCanvas && zoom) zoom.scaled(true);
      saved = { l: win.style.left, t: win.style.top, w: win.style.width, h: win.style.height,
                bw: body.clientWidth, bh: body.clientHeight };
      win.classList.add('full');
      if (fixedCanvas) win.classList.add('scaled');
      fbtn.textContent = '[\u25A3]';
      full = true;
      panX = panY = 0.5;
      fitScaled();
    } else {
      win.classList.remove('full', 'scaled');
      body.style.width = body.style.height = body.style.transform = '';
      win.style.left = saved.l; win.style.top = saved.t;
      win.style.width = saved.w; win.style.height = saved.h;
      fbtn.textContent = '[\u25A1]';
      full = false;
      if (zoom) zoom.scaled(false);
    }
    raise(win);
    Snd.open();
    /* anything that sizes itself off the window gets to hear about it */
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  const toggleFull = () => setFull(!full);
  fbtn.addEventListener('mousedown', ev => { ev.stopPropagation(); toggleFull(); });
  bar.addEventListener('dblclick', ev => {
    if (ev.target === x || ev.target === mbtn || ev.target === fbtn || ev.target.className === 'th' || ev.target.className === 'z') return;
    toggleFull();
  });
  window.addEventListener('resize', fitScaled);
  const zoom = opts.zoomable === false ? null : attachZoom({
    win, body, bar, before: bar.querySelector('.th') || mbtn,
    key: () => (rec && rec.appId) || opts.appId || null,
    isActive: () => btn.classList.contains('active') && !win.classList.contains('hidden')
  });
  const onKey = ev => {
    if (ev.key !== 'F11' || !btn.classList.contains('active') || win.classList.contains('hidden')) return;
    ev.preventDefault();
    toggleFull();
  };
  document.addEventListener('keydown', onKey);

  mbtn.addEventListener('mousedown', ev => { ev.stopPropagation(); minimize(); });
  btn.addEventListener('mousedown', () => {
    if (win.classList.contains('hidden')) unminimize();
    else if (btn.classList.contains('active')) minimize();
    else { raise(win); Snd.select(); }
  });

  rec = { win: win, btn: btn, title: opts.title, kind: opts.kind || 'text',
          appId: opts.appId || null, id: nextTaskId(), born: Date.now(), close: null,
          setFull: setFull, toggleFull: toggleFull, rightClick: !!opts.rightClick };
  openWins.push(rec);
  announceWins();

  win.addEventListener('mousedown', () => raise(win));
  /* An app that does nothing with a right-click must not be clicked by one:
     the right button never reaches it (the window still comes forward).
     Apps that use it say so with `rightClick: true`. The contextmenu event
     itself is left alone, so an app can still make its own menu. */
  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'auxclick'].forEach(type =>
    win.addEventListener(type, ev => {
      if (ev.button !== 2 || rec.rightClick) return;
      ev.stopPropagation();
      if (type === 'mousedown') raise(win);
    }, true));

  function closeWin() {
    win.remove();
    btn.remove();
    const i = openWins.indexOf(rec);
    if (i >= 0) openWins.splice(i, 1);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', fitScaled);
    if (zoom) zoom.dispose();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    Snd.close();
    announceWins();
  }
  rec.close = closeWin;

  x.addEventListener('mousedown', ev => { ev.stopPropagation(); closeWin(); });

  let dragging = false, offX = 0, offY = 0;
  bar.addEventListener('mousedown', ev => {
    if (ev.target === x || ev.target === mbtn || ev.target === fbtn || full) return;
    const r = desk.getBoundingClientRect();
    dragging = true;
    offX = ev.clientX - r.left - win.offsetLeft;
    offY = ev.clientY - r.top  - win.offsetTop;
    Snd.grab();
    ev.preventDefault();
  });

  let sizing = false, sx = 0, sy = 0, sw = 0, sh = 0;
  grip.addEventListener('mousedown', ev => {
    if (full) return;
    ev.stopPropagation();
    ev.preventDefault();
    sizing = true;
    sx = ev.clientX; sy = ev.clientY;
    sw = win.offsetWidth; sh = win.offsetHeight;
    raise(win);
    Snd.grab();
  });

  const onMove = ev => {
    if (dragging) {
      const r = desk.getBoundingClientRect();
      const maxX = desk.clientWidth  - 40;
      const maxY = desk.clientHeight - 24;
      const nx = Math.max(-(win.offsetWidth - 60), Math.min(ev.clientX - r.left - offX, maxX));
      const ny = Math.max(0, Math.min(ev.clientY - r.top - offY, maxY));
      win.style.left = nx + 'px';
      win.style.top  = ny + 'px';
    } else if (sizing) {
      const nw = Math.max(180, Math.min(sw + ev.clientX - sx, desk.clientWidth  - win.offsetLeft));
      const nh = Math.max(90,  Math.min(sh + ev.clientY - sy, desk.clientHeight - win.offsetTop));
      win.style.width  = nw + 'px';
      win.style.height = nh + 'px';
    }
  };
  const onUp = () => {
    if (dragging || sizing) Snd.drop();
    dragging = false;
    sizing = false;
  };
  /* these two used to be added for every window and never taken off again */
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  raise(win);
  Snd.open();

  return { win: win, body: body, title: t, btn: btn, close: closeWin };
}

export async function openWindow(appId, args = {}) {
  if (!registry[appId]) throw new Error('App not found');
  const mod = await registry[appId]();
  const app = mod.default;
  if (app.open) {
    /* these make their own window; tag whatever they open with the app's id
       so the mixer knows who is running */
    const before = openWins.slice();
    const res = await app.open(args);
    openWins.forEach(r => { if (before.indexOf(r) < 0 && !r.appId) { r.appId = appId; r.rightClick = r.rightClick || !!app.rightClick; } });
    announceWins();
    return res;
  }
  
  const made = createWindow({
    kind: 'app',
    title: args.path || app.title,
    w: app.width || 640,
    h: app.height || 480,
    resizable: app.resizable,
    appId: appId,
    rightClick: !!app.rightClick
  });
  
  if (app.fluid) made.body.dataset.fluid = '1';
  const ctx = {
    fs,
    save: async (key, val) => {
      localStorage.setItem(`app_${appId}_${key}`, JSON.stringify(val));
    },
    load: async (key) => {
      const v = localStorage.getItem(`app_${appId}_${key}`);
      return v ? JSON.parse(v) : null;
    },
    openWindow,
    studio: Studio,
    toast,
    ask: (title, def, cb) => askName(title, def, cb),
    setTitle: t => { made.title.textContent = t; made.btn.textContent = t; },
    close: () => {
      if (app.unmount) app.unmount();
      made.close();
    }
  };
  
  // Override close behavior to trigger unmount
  const oldClose = made.close;
  made.close = () => {
    if (app.unmount) app.unmount();
    oldClose();
  };
  // Hook the close button again to ensure unmount runs if user clicks X
  made.win.querySelector('.x').addEventListener('mousedown', ev => { 
    ev.stopPropagation(); 
    // We already added closeWin in createWindow, wait it will call the old one.
    // Let's actually patch rec.close, or just intercept x button.
    // simpler: 
  }, { capture: true }); 
  
  // Actually the best way is to monkeypatch the returned close function if we can, but x button uses the internal closeWin.
  // We can just find the 'x' button and replace its event listener.
  const xbtn = made.win.querySelector('.x');
  const xclone = xbtn.cloneNode(true);
  xbtn.replaceWith(xclone);
  xclone.addEventListener('mousedown', ev => { ev.stopPropagation(); made.close(); });
  
  app.mount(made.body, ctx, args);
}

let toastTimer = null;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  Snd.blip();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

export function sysDialog(title, msg, opts) {
  opts = opts || {};
  const h = {};
  const made = createWindow({
    kind: opts.kind || 'terminal', title: title,
    w: opts.w || 400, h: opts.h || (msg.split('\\n').length * 21 + 74),
    build: body => {
      const p = document.createElement('div');
      p.className = 'sysdlg';
      const m = document.createElement('div');
      m.className = 'msg';
      m.textContent = msg;
      const row = document.createElement('div');
      row.className = 'btns';
      p.appendChild(m);
      p.appendChild(row);
      body.appendChild(p);
      const mk = (label, fn) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.click(); h.close(); if (fn) fn(); });
        row.appendChild(b);
        return b;
      };
      if (opts.confirm) { mk(opts.okLabel || 'OK', opts.onOk); mk('CANCEL', opts.onCancel); }
      else mk(opts.okLabel || 'OK', opts.onOk);
    }
  });
  h.close = made.close;
  if (opts.bad !== false && opts.confirm && window.Snd) window.Snd.err();
  return h;
}

/* a name-entry dialog, in-glass, for anything that used to be a native
   window.prompt() (new folder, save-as, ...) */
export function askName(title, def, cb) {
  const h = {};
  const made = createWindow({
    kind: 'text', title: title, w: 330, h: 136,
    build: body => {
      const p = document.createElement('div');
      p.className = 'dlgpane';
      const lbl = document.createElement('div');
      lbl.textContent = 'NAME:';
      const inp = document.createElement('input');
      inp.value = def;
      inp.spellcheck = false;
      const row = document.createElement('div');
      row.className = 'btns';
      const ok = document.createElement('button');
      ok.textContent = 'OK';
      const no = document.createElement('button');
      no.textContent = 'CANCEL';
      row.appendChild(ok);
      row.appendChild(no);
      p.appendChild(lbl);
      p.appendChild(inp);
      p.appendChild(row);
      body.appendChild(p);

      const accept = () => { if (window.Snd) window.Snd.click(); h.close(); cb(inp.value); };
      ok.addEventListener('mousedown', ev => { ev.stopPropagation(); accept(); });
      no.addEventListener('mousedown', ev => { ev.stopPropagation(); if (window.Snd) window.Snd.close(); h.close(); });
      inp.addEventListener('keydown', ev => {
        ev.stopPropagation();
        if (ev.key === 'Enter')  { accept(); return; }
        if (ev.key === 'Escape') { if (window.Snd) window.Snd.close(); h.close(); return; }
        if (window.Snd && (ev.key.length === 1 || ev.key === 'Backspace')) window.Snd.type();
      });
      setTimeout(() => { inp.focus(); inp.select(); }, 0);
    }
  });
  h.close = made.close;
  return h;
}
// appending to wm.js
