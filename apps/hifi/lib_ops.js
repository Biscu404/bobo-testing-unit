/* What the library can do to discs, and the little dialogs that ask first: make a folder, move discs into one, sort a pile into genre folders, put a label on one disc or a
   hundred, change what a disc says about itself. `L` is the library (lib_ui.js): its root, its state, the player's API. */
import { el } from './lib_rows.js';
import { dirError, cleanDir, moveToDir, dropDir, renameDir, fold } from './shelf.js';
import { plan } from './genre.js';
import { match, inOrder, isImage, NEEDS } from './labels.js';
import { MODE_NAME } from './art.js';

const TINTS = ['green', 'cyan', 'amber', 'white', 'red'];

/* ---- dialogs ---- */
export function modal(L, title, body, buttons) {
  const m = el('div', 'stl-modal'), d = el('div', 'stl-dlg');
  d.appendChild(el('h3', null, title));
  const bd = el('div', 'bd'); [].concat(body).forEach(x => bd.appendChild(typeof x === 'string' ? el('p', null, x) : x)); d.appendChild(bd);
  const ft = el('div', 'ft'), api = { close: () => { if (m.parentNode) m.parentNode.removeChild(m); L.focus(); }, el: d };
  buttons.forEach(b => { const x = el('button', b.primary ? 'on' : '', b.label); if (b.off) x.disabled = true; x.addEventListener('click', () => { if (b.run && b.run(api) === false) return; if (!b.keep) api.close(); }); ft.appendChild(x); });
  d.appendChild(ft); m.appendChild(d); L.root.appendChild(m);
  m.addEventListener('mousedown', ev => { if (ev.target === m) api.close(); });
  m.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') api.close(); });
  const first = d.querySelector('input,select'); if (first) first.focus(); else { const p = ft.querySelector('button.on'); if (p) p.focus(); }
  return api;
}
export function ask(L, title, label, def, run) {
  const inp = el('input'); inp.type = 'text'; inp.value = def || '';
  const lab = el('label'); lab.appendChild(el('span', null, label)); lab.appendChild(inp);
  const go = m => { const v = inp.value; if (run(v) === false) return false; m.close(); };
  const m = modal(L, title, lab, [{ label: 'CANCEL' }, { label: 'OK', primary: true, run: go, keep: true }]);
  inp.addEventListener('keydown', ev => { if (ev.isComposing || ev.keyCode === 229) return; if (ev.key === 'Enter') { ev.preventDefault(); go(m); } });
  inp.select();
  return m;
}
export function popup(L, ev, items) {
  document.querySelectorAll('.stl-menu').forEach(m => m.remove());
  const m = el('div', 'stl-menu');
  items.forEach(it => { if (it === '-') { m.appendChild(el('hr')); return; } const d = el('div', it.off ? 'off' : '', it.label); if (!it.off) d.addEventListener('click', () => { m.remove(); it.run(); }); m.appendChild(d); });
  L.root.appendChild(m);
  const r = L.root.getBoundingClientRect();
  m.style.left = Math.max(0, Math.min(ev.clientX - r.left, r.width - 200)) + 'px'; m.style.top = Math.max(0, Math.min(ev.clientY - r.top, r.height - m.offsetHeight - 4)) + 'px';
  const gone = e => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', gone, true); } };
  setTimeout(() => document.addEventListener('mousedown', gone, true), 0);
  return m;
}

/* ---- folders ---- */
const builtin = L => L.api.builtinDirs();
export function newFolder(L, idxs, then) {
  ask(L, 'NEW FOLDER', 'NAME', '', v => {
    const bad = dirError(v, L.S.userDirs, builtin(L));
    if (bad) { L.api.say(bad); return false; }
    const d = { name: cleanDir(v), tint: TINTS[L.S.userDirs.length % TINTS.length] };
    L.S.userDirs.push(d); L.io.saveDirs();
    if (idxs && idxs.length) moveTo(L, idxs, d); else { L.io.saveLibrary(); L.refresh(); L.api.say('FOLDER ' + d.name + ' MADE.'); }
    if (then) then(d);
  });
}
export function moveTo(L, idxs, dir) {
  const n = moveToDir(L.S.list, idxs, dir);
  if (n) { L.io.saveLibrary(); L.io.saveDirs(); }
  L.refresh();
  L.api.say(n ? (dir ? 'MOVED ' + n + ' TO ' + dir.name : n + ' BACK ON THE SHELF') : (idxs.some(i => L.S.list[i] && L.S.list[i].builtin) ? 'THE PRESSED DISCS STAY IN THEIR GAME\'S FOLDER.' : 'THEY WERE ALREADY THERE.'));
  return n;
}
export function moveMenu(L, ev, idxs) {
  const items = [{ label: 'SHELF (NO FOLDER)', run: () => moveTo(L, idxs, null) }, '-'];
  L.S.userDirs.forEach(d => items.push({ label: d.name, run: () => moveTo(L, idxs, d) }));
  if (L.S.userDirs.length) items.push('-');
  items.push({ label: '+ NEW FOLDER...', run: () => newFolder(L, idxs) });
  popup(L, ev, items);
}
export function renameFolder(L, name) {
  ask(L, 'RENAME FOLDER', 'NAME', name, v => {
    const n = cleanDir(v);
    if (n === name) return true;
    const bad = dirError(v, L.S.userDirs.filter(d => d.name !== name), builtin(L));
    if (bad) { L.api.say(bad); return false; }
    const d = L.S.userDirs.find(x => x.name === name); if (d) d.name = n;
    renameDir(L.S.list, name, n); if (L.st.src === 'dir:' + name) L.st.src = 'dir:' + n;
    L.io.saveDirs(); L.io.saveLibrary(); L.refresh();
  });
}
export function deleteFolder(L, name) {
  const n = L.S.list.filter(t => !t.builtin && t.folder === name).length;
  modal(L, 'REMOVE FOLDER', [name + (n ? ' HAS ' + n + ' DISC' + (n > 1 ? 'S' : '') + ' IN IT. THEY GO BACK ON THE SHELF; NOTHING IS DELETED.' : ' IS EMPTY.')], [{ label: 'CANCEL' }, { label: 'REMOVE FOLDER', primary: true, run: () => {
    dropDir(L.S.list, name); L.S.userDirs = L.S.userDirs.filter(d => d.name !== name); if (L.st.src === 'dir:' + name) L.st.src = 'all';
    L.io.saveDirs(); L.io.saveLibrary(); L.refresh();
  } }]);
}

/* ---- sort a pile into genre folders ---- */
export async function autosort(L, idxs) {
  const list = L.S.list, mine = idxs.filter(i => list[i] && !list[i].builtin);
  if (!mine.length) { L.api.say('PICK SOME OF YOUR DISCS FIRST (THE PRESSED ONES ARE ALREADY SORTED).'); return; }
  const need = mine.filter(i => !list[i].scanned && list[i].vault);
  let busy = null;
  if (need.length) {
    const pg = el('p', null, 'READING WHAT THE FILES SAY ABOUT THEMSELVES...');
    busy = modal(L, 'AUTOSORT', pg, [{ label: 'WAIT', off: true, keep: true }]);
    await L.io.rescanTags(need, (k, n) => { pg.textContent = 'READING THE TAGS: ' + k + ' OF ' + n; });
    busy.close();
  }
  const p = plan(list, mine);
  if (!p.moves.length) { modal(L, 'AUTOSORT', ['NOTHING IN THESE ' + mine.length + ' DISCS SAYS WHAT KIND OF MUSIC IT IS: NO GENRE TAG, AND NO TELLING WORD IN THE TITLES.', 'THEY STAY WHERE THEY ARE. A GENRE CAN BE WRITTEN IN WITH EDIT INFO.'], [{ label: 'OK', primary: true }]); return; }
  const lst = el('div', 'lst');
  p.folders.forEach(f => { const d = el('div'); d.appendChild(el('span', null, f.name + (L.S.userDirs.some(x => x.name === f.name) ? '' : '  (NEW)'))); d.appendChild(el('span', 'ct', String(f.count))); lst.appendChild(d); });
  modal(L, 'AUTOSORT ' + mine.length + ' DISCS', [p.moves.length + ' OF THEM CAN BE PLACED, BY THEIR GENRE TAG OR, WHERE THERE IS NONE, BY WHAT THEIR TITLES SAY:', lst,
    p.left.length ? p.left.length + ' CANNOT BE PLACED AND STAY WHERE THEY ARE.' : 'EVERY ONE HAS A PLACE.'], [{ label: 'CANCEL' }, { label: 'SORT THEM', primary: true, run: () => {
      p.folders.forEach(f => { if (!L.S.userDirs.some(d => d.name === f.name)) L.S.userDirs.push({ name: f.name, tint: f.tint }); });
      let n = 0;
      p.moves.forEach(m => { const d = L.S.userDirs.find(x => x.name === m.name); n += moveToDir(list, [m.i], d); });
      L.io.saveDirs(); L.io.saveLibrary(); L.st.src = 'mine'; L.refresh();
      L.api.say('SORTED ' + n + ' DISCS INTO ' + p.folders.length + ' FOLDER' + (p.folders.length > 1 ? 'S' : '') + (p.left.length ? '; ' + p.left.length + ' LEFT' : '') + '.');
    } }]);
}

/* ---- labels ---- */
export function pickImages(L, run) {
  const f = el('input'); f.type = 'file'; f.accept = 'image/*'; f.multiple = true; f.style.display = 'none';
  f.addEventListener('change', () => { const fs = [].slice.call(f.files).filter(isImage); f.remove(); if (fs.length) run(fs); });
  L.root.appendChild(f); f.click();
}
/* one picture for the picked discs; many pictures are matched to albums, folders and discs by their names, and what matches nothing can be placed by hand */
export function setLabels(L, files, idxs) {
  const list = L.S.list;
  if (files.length === 1 && idxs.length) { L.io.setLabel(idxs, files[0]).then(n => { if (n) { L.api.say('LABEL ON ' + n + ' DISC' + (n > 1 ? 'S' : '') + '.'); L.api.afterLabel(); } }); return; }
  const groups = [], seen = new Set();
  list.forEach((t, i) => {
    if (t.builtin) return;
    if (t.album && !seen.has('a:' + fold(t.album))) { seen.add('a:' + fold(t.album)); groups.push({ id: 'a:' + fold(t.album), kind: 'album', name: t.album, test: u => fold(u.album) === fold(t.album) && !u.builtin }); }
    if (t.artist && !seen.has('r:' + fold(t.artist))) { seen.add('r:' + fold(t.artist)); groups.push({ id: 'r:' + fold(t.artist), kind: 'artist', name: t.artist, test: u => fold(u.artist) === fold(t.artist) && !u.builtin }); }
    groups.push({ id: 't:' + i, kind: 'track', name: t.name, test: (u, j) => j === i });
  });
  L.S.userDirs.forEach(d => groups.push({ id: 'f:' + d.name, kind: 'folder', name: d.name, test: u => u.folder === d.name && !u.builtin }));
  const sel = idxs.length ? { id: 'sel', kind: 'sel', name: idxs.length + ' PICKED DISC' + (idxs.length > 1 ? 'S' : ''), test: (u, j) => idxs.indexOf(j) >= 0 } : null;
  const m = match(files.map(f => ({ name: f.name })), groups);
  const rows = el('div', 'lst lbls'), choice = [];
  const label = g => ({ album: 'ALBUM ', artist: 'ARTIST ', track: 'DISC ', folder: 'FOLDER ' }[g.kind] || '') + g.name;
  const urls = files.map(f => URL.createObjectURL(f));
  files.forEach((f, k) => {
    const r = el('div', 'r'), im = el('img'); im.src = urls[k]; r.appendChild(im);
    r.appendChild(el('span', null, f.name));
    const s = el('select'); s.appendChild(new Option('— NOT USED —', ''));
    if (sel) s.appendChild(new Option('THE ' + sel.name, 'sel'));
    groups.filter(g => g.kind !== 'track' || (m[k].group && m[k].group.id === g.id) || (idxs.length && idxs.length < 80 && g.test(list[idxs[0]], idxs[0]))).slice(0, 500).forEach(g => s.appendChild(new Option(label(g), g.id)));
    s.value = m[k].group ? m[k].group.id : (files.length === 1 && sel ? 'sel' : '');
    if (s.value !== (m[k].group ? m[k].group.id : (files.length === 1 && sel ? 'sel' : ''))) s.value = '';
    choice.push(s); r.appendChild(s); rows.appendChild(r);
  });
  const hit = m.filter(x => x.group).length;
  const onEach = idxs.length && idxs.length >= 1 ? inOrder(files.map(f => ({ name: f.name })), idxs) : [];
  const done = () => urls.forEach(u => URL.revokeObjectURL(u));
  const dlg = modal(L, 'LABELS', [hit + ' OF ' + files.length + ' PICTURES MATCH SOMETHING BY THEIR NAMES (' + Math.round(NEEDS * 100) + '% OR BETTER). CHANGE ANY OF THEM:', rows,
    idxs.length ? 'OR GIVE THE ' + idxs.length + ' PICKED DISCS A PICTURE EACH, IN NAME ORDER.' : 'PICK DISCS FIRST TO PUT PICTURES ON THEM ONE EACH.'], [
    { label: 'CANCEL', run: () => { done(); } },
    { label: 'ONE EACH, IN ORDER', off: !idxs.length || files.length < 1, keep: true, run: async d => {
      let n = 0; for (const o of onEach) n += await L.io.setLabel([o.track], files[o.image]);
      done(); d.close(); L.api.say('PUT ' + n + ' PICTURE' + (n === 1 ? '' : 'S') + ' ON ' + idxs.length + ' DISCS, ONE EACH.'); L.api.afterLabel(); return false; } },
    { label: 'APPLY', primary: true, keep: true, run: async d => {
      let n = 0, pics = 0;
      for (let k = 0; k < files.length; k++) {
        const id = choice[k].value; if (!id) continue;
        const g = id === 'sel' ? sel : groups.find(x => x.id === id); if (!g) continue;
        const targets = []; list.forEach((u, j) => { if (!u.builtin && g.test(u, j)) targets.push(j); });
        if (targets.length) { n += await L.io.setLabel(targets, files[k]); pics++; }
      }
      done(); d.close(); L.api.say(n ? 'LABELLED ' + n + ' DISC' + (n > 1 ? 'S' : '') + ' WITH ' + pics + ' PICTURE' + (pics > 1 ? 'S' : '') + '.' : 'NOTHING WAS LABELLED.'); L.api.afterLabel(); return false; } }]);
  return dlg;
}
export function labelMode(L, idxs, mode) {
  let n = 0; idxs.forEach(i => { const t = L.S.list[i]; if (t) { t.artMode = mode; n++; } });
  L.S.labelMode = mode; L.io.saveLibrary(); L.io.saveSettings(); L.refresh(); L.api.afterLabel();
  L.api.say('LABEL: ' + MODE_NAME[mode] + (n > 1 ? ' ON ' + n + ' DISCS' : ''));
}

/* ---- what a disc says about itself ---- */
export function editInfo(L, idxs) {
  const list = L.S.list, tr = idxs.map(i => list[i]).filter(t => t && !t.builtin);
  if (!tr.length) { L.api.say('THE PRESSED DISCS SAY WHAT THEY SAY.'); return; }
  const one = tr.length === 1, f = {};
  const field = (k, label, num) => { const inp = el('input'); inp.type = 'text'; if (num) inp.inputMode = 'numeric'; const same = tr.every(t => String(t[k] == null ? '' : t[k]) === String(tr[0][k] == null ? '' : tr[0][k])); inp.value = same ? (tr[0][k] == null ? '' : tr[0][k]) : ''; if (!same) inp.placeholder = '(VARIES)'; f[k] = inp; const l = el('label'); l.appendChild(el('span', null, label)); l.appendChild(inp); return l; };
  const rows = [one ? field('name', 'TITLE') : el('p', null, 'CHANGING ' + tr.length + ' DISCS: A BLANK BOX LEAVES THAT ONE ALONE.'), field('artist', 'ARTIST'), field('album', 'ALBUM'), field('genre', 'GENRE'), field('year', 'YEAR', true)];
  if (one) rows.push(field('no', 'TRACK', true));
  modal(L, one ? 'EDIT INFO' : 'EDIT ' + tr.length + ' DISCS', rows, [{ label: 'CANCEL' }, { label: 'SAVE', primary: true, run: () => {
    Object.keys(f).forEach(k => {
      let v = f[k].value.trim(); if (!v && !one) return;
      tr.forEach(t => { if (k === 'year' || k === 'no') t[k] = parseInt(v, 10) || null; else if (k === 'genre') t[k] = v; else t[k] = v.toUpperCase(); });
    });
    L.io.saveLibrary(); L.refresh(); L.api.say('SAVED.');
  } }]);
}
