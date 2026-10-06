import { fs as vfs } from './vfs.js';
import { openWindow, toast } from './wm.js';
import { SPRITES } from './sprites.js';
import './sprites_extra.js';
import { showMenu, hideMenus } from './menus.js';
import { wireDrop, wirePickers } from './importer.js';
import { applyWallpaper, clearWallpaper, hasWallpaper } from './wallpaper.js';
import { Dnd } from './dnd.js';
import { Active, wireActive, openItem, deletePaths, newFolderPrompt, restoreSystemFiles } from './fileops.js';
import { itemMenu, spaceMenu } from './filemenus.js';
import { wireMenubar } from './menubar.js';
import { joinPath, baseName, TRASH } from './vfs_ops.js';

export { showMenu, hideMenus } from './menus.js';
export { pickUpload, wireDrop } from './importer.js';
export { newFolderPrompt } from './fileops.js';

const ICON_POS_KEY = 'templeos.icons.v1';
const ICON_W = 84, ICON_H = 78;

let iconPos = {};
let lastList = [];                /* the most recent desktop item list, name -> item lookups */
let arrivals = [];                /* where things dragged in from a window should land */

function loadIconPos() {
  try { iconPos = JSON.parse(localStorage.getItem(ICON_POS_KEY)) || {}; }
  catch (e) { iconPos = {}; }
}
function saveIconPos() {
  try { localStorage.setItem(ICON_POS_KEY, JSON.stringify(iconPos)); } catch (e) {}
}

const APP_SPRITES = {
  hifi: 'disc', notes: 'notes', bottle: 'bottle', elephant: 'elephant',
  magen: 'magen', cook: 'flask', garden: 'garden', sweeper: 'sweeper',
  solitaire: 'solitaire', crayon: 'crayon', shop: 'shop', drawings: 'drawings',
  account: 'account', standbattle: 'arena', garage: 'garage'
};

export function spriteFor(type, app) {
  if (type === 'folder')   return SPRITES.folder;
  if (type === 'image')    return SPRITES.image;
  if (type === 'video')    return SPRITES.video;
  if (type === 'terminal') return SPRITES.terminal;
  if (type === 'bin')      return SPRITES.bin;
  if (type === 'binfull')  return SPRITES.binfull;
  if (type === 'song')     return SPRITES.song;
  if (type === 'app')      return SPRITES[APP_SPRITES[app]] || SPRITES.app;
  if (type === 'doc')      return SPRITES.doc;
  if (type === 'code')     return SPRITES.code;
  return SPRITES.text;
}

function iconSlot(i) {
  const desk = document.getElementById('desktop');
  const h = (desk && (desk.clientHeight || desk.offsetHeight)) || 600;
  const rows = Math.max(1, Math.floor((h - 12) / ICON_H));
  return { x: 8 + Math.floor(i / rows) * ICON_W, y: 8 + (i % rows) * ICON_H };
}

/* the grid an icon actually lives on: whole cells from the same (8, 8)
   origin every layout function uses, so nothing can end up between them */
function cellOf(x, y) {
  return { c: Math.round((x - 8) / ICON_W), r: Math.round((y - 8) / ICON_H) };
}
function cellPos(c, r) {
  return { x: 8 + c * ICON_W, y: 8 + r * ICON_H };
}

/* find the nearest free cell to where an icon wants to land, spiralling
   outward until one is clear of every OTHER icon on the desk */
function freeCell(wantX, wantY, excludeNames) {
  const desk = document.getElementById('desktop');
  const dw = (desk && desk.clientWidth) || 640, dh = (desk && desk.clientHeight) || 480;
  const cols = Math.max(1, Math.floor((dw - 8) / ICON_W));
  const rows = Math.max(1, Math.floor((dh - 8) / ICON_H));
  const taken = new Set();
  Object.keys(iconPos).forEach(name => {
    if (excludeNames.has(name)) return;
    const p = iconPos[name];
    const cell = cellOf(p.x, p.y);
    taken.add(cell.c + ',' + cell.r);
  });
  const want = cellOf(wantX, wantY);
  const c0 = Math.max(0, Math.min(cols - 1, want.c));
  const r0 = Math.max(0, Math.min(rows - 1, want.r));
  for (let ring = 0; ring < cols + rows; ring++) {
    for (let dc = -ring; dc <= ring; dc++) {
      for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const c = c0 + dc, r = r0 + dr;
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        if (taken.has(c + ',' + r)) continue;
        return cellPos(c, r);
      }
    }
  }
  return cellPos(c0, r0);
}

/* ---- what is selected, as the file commands want it ------------------------- */
const deskIcons = () => Array.prototype.slice.call(document.querySelectorAll('#icons .icon'));
const clearIconSel = () => deskIcons().forEach(n => n.classList.remove('sel'));
const selectedIcons = () => deskIcons().filter(n => n.classList.contains('sel'));
const itemOf = name => {
  const it = lastList.find(x => x.name === name);
  return it ? Object.assign({}, it, it.vfs ? { path: joinPath('::', name) } : {}) : null;
};
const deskEnv = {
  dir: '::',
  sel() { return selectedIcons().map(el => itemOf(el.dataset.name)).filter(Boolean); },
  items() { return this.sel().filter(i => i.path); },
  selectAll() { deskIcons().forEach(n => n.classList.add('sel')); },
  open(it) { openItem('::', it); }
};

export async function initDesktop() {
  const desk = document.getElementById('desktop');
  loadIconPos();
  desk.dataset.drop = '::';
  wireMenubar({ arrange: arrangeIcons, emptyBin });
  wirePickers();
  wireMarquee(desk);
  wireDrop(desk, () => '::');
  wireDeskContextMenu(desk);
  wireActive(deskEnv);
  window.addEventListener('vfs-changed', ev => {
    const dir = ev.detail && ev.detail.dir;
    if (dir === '::' || (dir && dir.indexOf(TRASH) === 0)) refreshIcons();
  });
  applyWallpaper();
  await refreshIcons();
}

/* right-click on bare desktop, not on an icon */
function wireDeskContextMenu(desk) {
  desk.addEventListener('contextmenu', ev => {
    /* a window owns its own right-clicks: if the app did nothing with this
       one, nothing happens, rather than the desktop's menu popping up on top
       of whatever was being clicked */
    if (ev.target.closest && ev.target.closest('.win')) { ev.preventDefault(); return; }
    if (ev.target.closest && ev.target.closest('.icon')) return;
    ev.preventDefault();
    clearIconSel();
    const items = spaceMenu(deskEnv);
    items.push({ sep: true });
    items.push({ label: 'ARRANGE ICONS', run: () => arrangeIcons() });
    if (hasWallpaper()) items.push({ label: 'CLEAR BACKGROUND', run: () => clearWallpaper() });
    items.push({ sep: true });
    items.push({ label: 'RESTORE SYSTEM FILES', run: () => restoreSystemFiles() });
    items.push({ label: 'DISPLAY SETTINGS...', run: () => openWindow('display') });
    items.push({ label: "CRAZY DAVE'S SHOP...", run: () => openWindow('shop') });
    items.push({ label: 'ABOUT THIS MACHINE', run: () => openWindow('about') });
    showMenu(document.getElementById('ctxmenu'), ev.clientX, ev.clientY, items);
  });
}

/* put every icon back on the grid, left edge first, top to bottom */
export function arrangeIcons() {
  iconPos = {};
  deskIcons().forEach((el, i) => {
    const p = iconSlot(i);
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    iconPos[el.dataset.name] = p;
  });
  saveIconPos();
  if (window.Snd) window.Snd.save();
  toast('ICONS ARRANGED.');
}

/* things dragged onto the desktop from a window land where they were dropped */
export function expectArrivals(clientX, clientY, n) {
  const r = document.getElementById('desktop').getBoundingClientRect();
  arrivals = [];
  for (let i = 0; i < n; i++) arrivals.push({ x: clientX - r.left - 40 + i * 6, y: clientY - r.top - 30 + i * 6 });
  setTimeout(() => { arrivals = []; }, 4000);
}

let refreshing = false, again = false;
export async function refreshIcons() {
  if (refreshing) { again = true; return; }
  refreshing = true;
  try { await buildIcons(); } finally {
    refreshing = false;
    if (again) { again = false; refreshIcons(); }
  }
}

async function buildIcons() {
  const iconsContainer = document.getElementById('icons');
  if (!iconsContainer) return;
  try {
    const list = (await vfs.list('::')).map(it => Object.assign(it, { vfs: true }));
    const bin = await vfs.list(TRASH);
    // the terminal and the bin are kernel primitives, not VFS nodes
    list.push({ name: 'TERMINAL', type: 'terminal' });
    list.push({ name: 'RecycleBin', type: bin.length ? 'binfull' : 'bin' });
    lastList = list;
    const keepSel = new Set(selectedIcons().map(n => n.dataset.name));

    // forget icons for anything that no longer exists, so their old cells
    // don't stay "taken" forever
    const liveNames = new Set(list.map(it => it.name));
    Object.keys(iconPos).forEach(name => { if (!liveNames.has(name)) delete iconPos[name]; });

    const els = list.map((item, i) => {
      const el = document.createElement('div');
      el.className = 'icon' + (keepSel.has(item.name) ? ' sel' : '');
      el.innerHTML = spriteFor(item.type, item.app);
      el.dataset.name = item.name;
      if (item.type === 'folder') el.dataset.drop = joinPath('::', item.name);
      if (item.type === 'bin' || item.type === 'binfull') el.dataset.drop = '@trash';

      const lbl = document.createElement('div');
      const span = document.createElement('span');
      span.className = 'lbl';
      span.textContent = item.name;
      lbl.appendChild(span);
      el.appendChild(lbl);

      const arrival = !iconPos[item.name] && arrivals.length ? arrivals.shift() : null;
      const want = iconPos[item.name] || arrival || iconSlot(i);
      const pos = freeCell(want.x, want.y, new Set([item.name]));
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      iconPos[item.name] = pos;

      el.addEventListener('dblclick', ev => {
        ev.stopPropagation();
        if (window.Snd) window.Snd.open();
        openItem('::', itemOf(item.name) || item);
      });
      el.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (!el.classList.contains('sel')) { clearIconSel(); el.classList.add('sel'); }
        Active.env = deskEnv;
        openIconContextMenu(ev, item);
      });
      wireDeskIcon(el, item);
      if (item.type === 'folder') wireDrop(el, () => joinPath('::', item.name));
      return el;
    });
    iconsContainer.replaceChildren(...els);
    saveIconPos();
  } catch (e) {
    console.error('Failed to load desktop icons', e);
  }
}

/* drag to move (alone or as part of a multi-selection), click to select,
   ctrl/shift-click to add to the selection. Let go over a folder and the
   things go into it; over the recycle bin and they are deleted. */
function wireDeskIcon(el, item) {
  el.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    const add = ev.ctrlKey || ev.metaKey || ev.shiftKey;
    if (add) {
      el.classList.toggle('sel');
      if (window.Snd) window.Snd.select();
    } else if (!el.classList.contains('sel')) {
      clearIconSel();
      el.classList.add('sel');
      if (window.Snd) window.Snd.select();
    }
    Active.env = deskEnv;

    const desk = document.getElementById('desktop');
    const sx = ev.clientX, sy = ev.clientY;
    const group = selectedIcons().map(n => ({ n, x: n.offsetLeft, y: n.offsetTop }));
    const files = deskEnv.items();

    const snap = () => {
      const groupNames = new Set(group.map(s => s.n.dataset.name));
      group.forEach(s => {
        s.n.classList.remove('dragging');
        const p = freeCell(s.n.offsetLeft, s.n.offsetTop, groupNames);
        s.n.style.left = p.x + 'px';
        s.n.style.top = p.y + 'px';
        iconPos[s.n.dataset.name] = p;
        groupNames.delete(s.n.dataset.name);   /* this one has landed; the rest must avoid it too */
      });
      saveIconPos();
      if (window.Snd) window.Snd.drop();
    };
    const home = () => group.forEach(s => {
      s.n.classList.remove('dragging');
      s.n.style.left = s.x + 'px'; s.n.style.top = s.y + 'px';
    });

    Dnd.begin(ev, {
      paths: files.map(f => f.path), live: true,
      accept: z => z.drop !== '::',
      onStart: () => group.forEach(s => s.n.classList.add('dragging')),
      onMove: e => {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        group.forEach(s => {
          s.n.style.left = Math.max(0, Math.min(s.x + dx, desk.clientWidth - s.n.offsetWidth)) + 'px';
          s.n.style.top = Math.max(0, Math.min(s.y + dy, desk.clientHeight - s.n.offsetHeight)) + 'px';
        });
      },
      onDrop: async (zone, e, cancelled) => {
        if (cancelled) { home(); return; }
        if (!zone || zone.drop === '::' || !files.length) { snap(); return; }
        home();
        if (zone.drop === '@trash') { await deletePaths(files.map(f => f.path)); return; }
        let n = 0;
        for (const f of files) {
          try {
            if (e.ctrlKey) await vfs.copy(f.path, zone.drop); else await vfs.move(f.path, zone.drop);
            n++;
          } catch (err) { toast(err.message); if (window.Snd) window.Snd.err(); }
        }
        if (n) { toast((e.ctrlKey ? 'COPIED ' : 'MOVED ') + n + ' ITEM' + (n === 1 ? '' : 'S') + ' TO ' + baseName(zone.drop) + '.'); if (window.Snd) window.Snd.drop(); }
      }
    });
  });
}

/* rubber-band select on bare desktop */
function wireMarquee(desk) {
  const box = document.getElementById('marquee');
  desk.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    if (ev.target.closest && (ev.target.closest('.icon') || ev.target.closest('.win'))) return;
    const add = ev.ctrlKey || ev.metaKey || ev.shiftKey;
    if (!add) clearIconSel();
    Active.env = deskEnv;

    const r = desk.getBoundingClientRect();
    const ox = ev.clientX - r.left, oy = ev.clientY - r.top;
    let live = false;

    const move = e2 => {
      const cx = e2.clientX - r.left, cy = e2.clientY - r.top;
      if (!live && Math.abs(cx - ox) + Math.abs(cy - oy) < 4) return;
      live = true;
      if (box) {
        box.style.display = 'block';
        box.style.left = Math.min(ox, cx) + 'px';
        box.style.top = Math.min(oy, cy) + 'px';
        box.style.width = Math.abs(cx - ox) + 'px';
        box.style.height = Math.abs(cy - oy) + 'px';
      }
      const mx0 = Math.min(ox, cx), mx1 = Math.max(ox, cx);
      const my0 = Math.min(oy, cy), my1 = Math.max(oy, cy);
      deskIcons().forEach(n => {
        const hit = n.offsetLeft < mx1 && n.offsetLeft + n.offsetWidth > mx0 &&
                    n.offsetTop < my1 && n.offsetTop + n.offsetHeight > my0;
        n.classList.toggle('sel', hit);
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (box) box.style.display = 'none';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

/* ---- right-click on an icon -------------------------------------------------- */
function openIconContextMenu(ev, item) {
  const menu = document.getElementById('ctxmenu');
  const sel = deskEnv.sel();
  if (item.type === 'terminal') {
    showMenu(menu, ev.clientX, ev.clientY, [{ label: 'OPEN', run: () => openItem('::', item) }]);
    return;
  }
  if (item.type === 'bin' || item.type === 'binfull') {
    showMenu(menu, ev.clientX, ev.clientY, [
      { label: 'OPEN', run: () => openItem('::', item) },
      { label: 'EMPTY THE RECYCLE BIN', off: item.type === 'bin', run: () => emptyBin() }
    ]);
    return;
  }
  const files = sel.filter(i => i.path);
  showMenu(menu, ev.clientX, ev.clientY, itemMenu({ dir: '::', items: files.length ? files : [itemOf(item.name)], selectAll: deskEnv.selectAll }));
}

async function emptyBin() {
  const n = (await vfs.trashList()).length;
  await vfs.trashEmpty();
  toast(n ? 'RECYCLE BIN EMPTIED: ' + n + ' ITEM' + (n === 1 ? '' : 'S') + ' GONE FOR GOOD.' : 'THE RECYCLE BIN IS ALREADY EMPTY.');
  if (window.Snd && n) window.Snd.del();
}
export { emptyBin };

export { wireKonami } from './konami.js';
