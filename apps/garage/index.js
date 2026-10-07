import { el, btn, modal } from './ui.js';
import { makeGrid } from './grid.js';
import { makeTracks } from './tracks.js';
import { makeKeys } from './keys.js';
import { makeMixer } from './mixer.js';
import { makeToolbar } from './toolbar.js';
import { makeActions, CLIP } from './actions.js';
import { makeFiles } from './files.js';
import { exportDialog } from './export.js';
import { openHelp } from './help.js';
import { openPicker, stopAudition } from './picker.js';
import { makeHistory, MAX_TRACKS, snapBeats, rowsFor } from './model.js';
import * as E from './edit.js';
import { openLessons } from './lessons.js';
import { bandMenu } from './band.js';
import { keyboard } from './hotkeys.js';
import { whenGone, scopedListeners } from '../lifecycle.js';

export default {
  id: 'garage',
  title: 'THE GARAGE',
  width: 1000,
  height: 680,
  resizable: true,
  fluid: true,
  rightClick: true,

  async mount(root, ctx, args) {
    const S = ctx.studio, L = S.lang;
    const _style = document.createElement('link');
    _style.rel = 'stylesheet';
    _style.href = 'apps/garage/style.css';
    root.appendChild(_style);
    root.classList.add('garage');
    root.tabIndex = 0;
    root.style.outline = 'none';
    await S.ins.index();
    const demos = [];                                     /* (the demos are read when OPEN asks for them) */
    void demos;

    const G = { song: null, sel: 0, items: new Set(), range: null, cursor: 0, tool: 'draw', snap: 4, noteLen: 0, magic: true, oct: 0, rec: false, metro: false,
      countIn: false, loop: false, follow: true, zoomX: 40, zoomY: 1, dock: 'keys', path: null, dirty: false, segOnly: false };
    const hist = makeHistory();
    let player = null, raf = 0, alive = true, saveT = 0, statusT = 0;
    const api = { G, ctx, root, lang: L, studio: S, hist, player: () => player, clip: () => CLIP.data };
    const nameOf = id => { const i = S.ins.find(id); return i ? i.name : id.toUpperCase(); };
    api.instrumentName = nameOf;
    api.snapStep = () => snapBeats(G.song, G.snap);
    api.rowsFor = () => rowsFor(L, G.song, 12, 108, G.magic);
    api.trackMix = t => ({ vol: t.vol, pan: t.pan, reverb: t.reverb, echo: t.echo, eq: t.eq, comp: t.comp, drive: t.drive });
    api.audition = (tr, p) => S.tap(tr.inst, tr.inst === 'drums' ? p : p, 0.45, 0.85, api.trackMix(tr));
    api.focus = () => root.focus({ preventScroll: true });

    const defaultLo = (inst, t) => {
      if (inst === 'drums') return 36;
      const i = S.ins.find(inst), s = i && i.samples;
      if (!s) return 48;
      const mean = t && t.notes && t.notes.length ? Math.round(t.notes.reduce((a, n) => a + n[2], 0) / t.notes.length) : Math.round((s[0].midi + s[s.length - 1].midi) / 2);
      return Math.max(24, Math.min(84, Math.round((mean - 18) / 12) * 12));
    };
    api.defaultLo = defaultLo;
    api.fresh = () => { const song = L.newSong(); song.tracks.push(L.newTrack({ name: 'MELODY', inst: 'piano', lo: 48 })); return song; };
    G.song = api.fresh();

    /* ---- the status line ------------------------------------------------------------------------------ */
    const status = el('div', 'g-status', '');
    const HINTS = { draw: 'DRAW: CLICK TO PUT A NOTE DOWN, DRAG IT LONGER. CLICK A NOTE TO SELECT IT, THEN DRAG TO MOVE.   RIGHT-CLICK ERASES.   DRAG THE RULER TO PICK A STRETCH OF SONG.',
      select: 'SELECT: DRAG A BOX. SHIFT ADDS.   ARROWS NUDGE, UP/DOWN TRANSPOSE.   CTRL+C / X / V TO COPY, CUT, PASTE AT THE YELLOW CURSOR.', erase: 'ERASE: DRAG OVER NOTES TO TAKE THEM AWAY.' };
    api.toast = msg => { status.textContent = msg; status.classList.add('say'); clearTimeout(statusT); statusT = setTimeout(() => { status.classList.remove('say'); status.textContent = HINTS[G.tool]; }, 5200); ctx.toast(msg.length > 60 ? msg.slice(0, 58) + '..' : msg); };

    /* ---- what changed --------------------------------------------------------------------------------- */
    const persistSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => ctx.save('draft', G.song).catch(() => {}), 700); };
    const title = () => ctx.setTitle('THE GARAGE - ' + G.song.title + (G.dirty ? ' *' : ''));
    function changed(kind) {
      if (kind === 'edit') { hist.push(G.song); G.dirty = true; persistSoon(); E.ensureBars(G.song, E.lastBeat(G.song)); }
      if (kind === 'mix') { G.dirty = true; persistSoon(); }
      if (player && (kind === 'mix' || kind === 'edit' || kind === 'drag')) player.refresh();
      if (kind === 'edit') { tracks.render(); mixer.render(); keys.render(); }
      if (kind === 'mix') { tracks.render(); mixer.render(); }
      if (kind === 'edit' || kind === 'saved') title();
      toolbar.update(); grid.redraw();
      if (kind === 'view' || kind === 'transport') prefsSoon();
    }
    api.changed = changed;
    let prefT = 0;
    const prefsSoon = () => { clearTimeout(prefT); prefT = setTimeout(() => ctx.save('prefs', { tool: G.tool, snap: G.snap, noteLen: G.noteLen, magic: G.magic, follow: G.follow, zoomX: G.zoomX, zoomY: G.zoomY, dock: G.dock, countIn: G.countIn }).catch(() => {}), 500); };

    /* ---- transport -------------------------------------------------------------------------------------- */
    const region = () => G.loop && G.range ? [G.range.a, G.range.b] : [0, null];
    function play() {
      if (player) return;
      S.preload(G.song).then(() => {
        if (player || !alive) return;
        const [a, b] = region();
        let from = G.cursor; if (G.loop && G.range && (from < a || from >= b)) from = a;
        player = S.play(G.song, { loop: G.loop, loopFrom: a, loopTo: b, from, metronome: G.metro, countIn: G.countIn ? G.song.beats : 0, limit: G.song.limit, onEnd: () => stop() });
        if (G.mono) player.mix.setMono(true);
        tick(); toolbar.update();
      });
      if (S.knob() === 0) knobHint();
    }
    function stop() {
      if (player) { player.stop(); player = null; }
      G.rec = false; cancelAnimationFrame(raf);
      grid.setHead(-1); mixer.level(null, 0); tracks.level(null); toolbar.clock(G.cursor, G.cursor * 60 / G.song.bpm); toolbar.update();
    }
    api.toggle = () => player ? stop() : play();
    api.toStart = () => { api.setCursor(0, true); grid.scrollTo(0); };
    api.record = () => { G.rec = !G.rec; if (G.rec && !player) play(); ctx.toast(G.rec ? 'RECORDING ON THE SELECTED TRACK: PLAY THE KEYS BELOW' : 'RECORDING OFF'); toolbar.update(); };
    api.setLoop = on => { G.loop = on; if (player) { const [a, b] = region(); player.setLoop(on, a, b); } changed('transport'); };
    api.setMetro = on => { G.metro = on; if (player) player.setMetronome(on); changed('transport'); };
    api.setBpm = v => { G.song.bpm = Math.max(30, Math.min(300, v)); if (player) player.seek(player.beat()); changed('edit'); };
    api.setRange = (a, b) => {
      if (a == null) G.range = null;
      else { const end = G.song.bars * G.song.beats; a = Math.max(0, Math.min(a, end - 0.25)); G.range = { a, b: Math.max(a + 0.25, Math.min(b, Math.max(end, b))) }; G.cursor = a; if (G.range.b > end) E.ensureBars(G.song, G.range.b); }
      if (player && G.loop) { const [x, y] = region(); player.setLoop(true, x, y); }
      changed('sel');
    };
    api.setCursor = (b, seek) => { G.cursor = Math.max(0, b); if (seek && player) player.seek(G.cursor); if (!player) toolbar.clock(G.cursor, G.cursor * 60 / G.song.bpm); grid.redraw(); };
    api.setTool = id => { G.tool = id; status.textContent = HINTS[id]; changed('transport'); };
    api.zoom = (fx, fy) => { G.zoomX = Math.max(5, Math.min(260, G.zoomX * fx)); G.zoomY = Math.max(0.6, Math.min(2.6, G.zoomY * fy)); changed('view'); };
    api.undo = () => { const s = hist.undo(); if (s) applySong(s, 'UNDONE'); };
    api.redo = () => { const s = hist.redo(); if (s) applySong(s, 'REDONE'); };
    function applySong(s, word) {
      G.song = s; G.items.clear(); G.sel = Math.min(G.sel, s.tracks.length - 1); G.dirty = true;
      if (player) { stop(); play(); }
      persistSoon(); title(); renderAll(); ctx.toast(word + '.');
    }
    function tick() {
      cancelAnimationFrame(raf);
      const f = now => {
        if (!alive || !player) return;
        const beat = player.beat();
        if (G.follow && beat >= 0) grid.follow(beat);
        grid.setHead(beat >= 0 ? beat : -1);
        toolbar.clock(beat, beat * 60 / G.song.bpm);
        const lv = player.levels(); mixer.level(lv, now); tracks.level(lv);
        raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    }
    function knobHint() {
      const m = modal(root, 'NO SOUND?', 'g-small');
      m.body.append(el('div', 'g-p', 'THE MUS KNOB ON THE PANEL IS AT ZERO, SO THE MACHINE IS KEEPING QUIET.'),
        el('div', 'g-p', 'TURN IT UP YOURSELF (THE LEFT KNOB, BELOW THE SCREEN), OR LET ME.'));
      const foot = el('div', 'g-boxfoot');
      foot.append(btn('TURN IT UP FOR ME', 'g-go', () => { S.turnUp(6); m.close(); }), btn('NO THANKS', '', () => m.close()));
      m.body.appendChild(foot);
    }

    /* ---- the screen ------------------------------------------------------------------------------------- */
    const act = makeActions(api);
    api.act = act;
    const toolbar = makeToolbar(root, api);
    const main = el('div', 'g-main'), side = el('div', 'g-side'), center = el('div', 'g-center');
    const ovHost = el('div', 'g-ovhost'), gridHost = el('div', 'g-gridhost');
    const dockTabs = el('div', 'g-docktabs'), dock = el('div', 'g-dock'), keyHost = el('div', 'g-keyhost'), mixHost = el('div', 'g-mixhost');
    const tabKeys = btn('KEYBOARD', 'g-tab', () => setDock('keys')), tabMix = btn('MIXER', 'g-tab', () => setDock('mixer'));
    dockTabs.append(tabKeys, tabMix);
    dock.append(keyHost, mixHost);
    center.append(ovHost, gridHost, status, dockTabs, dock);
    main.append(side, center);
    root.append(...toolbar.bars, main);
    const grid = makeGrid(gridHost, ovHost, api), tracks = makeTracks(side, api), keys = makeKeys(keyHost, api), mixer = makeMixer(mixHost, api);
    const files = makeFiles(api);
    api.save = (asNew) => files.save(asNew); api.openSongs = () => files.openSongs(); api.newSong = () => files.newSong();
    api.exportDialog = () => exportDialog(root, api); api.help = () => openHelp(root);
    api.band = () => bandMenu(root, api, defaultLo);
    function setDock(id) {
      G.dock = id; dock.dataset.dock = id; tabKeys.classList.toggle('on', id === 'keys'); tabMix.classList.toggle('on', id === 'mixer');
      if (id === 'mixer') mixer.render();
      grid.redraw(); prefsSoon();
    }
    api.setDock = setDock;
    api.openShop = tab => ctx.openWindow('shop', { tab }).catch(() => {});
    api.selectTrack = (i, force) => { if (!force && G.sel === i) return; G.sel = i; G.items.clear(); tracks.render(); keys.render(); mixer.render(); grid.centreOn(); changed('sel'); };
    api.clearSel = () => { G.items.clear(); changed('sel'); };
    api.pickInstrument = i => openPicker(root, api, G.song.tracks[i].inst, id => {
      const t = G.song.tracks[i];
      t.inst = id; t.lo = defaultLo(id, t);
      if (t.name === 'MELODY' || /^TRACK/.test(t.name)) t.name = nameOf(id).slice(0, 12);
      S.preload(G.song); G.items.clear(); changed('edit'); grid.centreOn();
    });
    api.addTrack = () => {
      if (G.song.tracks.length >= MAX_TRACKS) return;
      openPicker(root, api, 'piano', id => {
        const t = L.newTrack({ name: nameOf(id).slice(0, 12), inst: id });
        t.lo = defaultLo(id, t); if (id === 'drums') t.hits = [];
        G.song.tracks.push(t); S.preload(G.song); api.selectTrack(G.song.tracks.length - 1, true); changed('edit');
      });
    };
    api.learn = () => { stop(); openLessons(root, api, { load: s => api.startSong(s) }); };
    function renderAll() { tracks.render(); keys.render(); mixer.render(); toolbar.update(); grid.redraw(); }
    api.startSong = (song, path) => {
      stop();
      G.song = song; G.path = path || null; G.sel = 0; G.items.clear(); G.range = null; G.cursor = 0; G.dirty = false;
      song.tracks.forEach(t => { if (t.lo == null) t.lo = defaultLo(t.inst, t); });
      hist.reset(song); S.preload(song); renderAll(); grid.resetScroll(); title();
    };

    /* ---- keys, and cleaning up --------------------------------------------------------------------------- */
    const L2 = scopedListeners(root);
    keyboard(root, api, keys);
    root.addEventListener('keyup', ev => keys.keyup(ev));
    root.addEventListener('mousedown', ev => { if (!/input|select|textarea/i.test(ev.target.tagName)) api.focus(); });
    L2.on(window, 'blur', () => keys.releaseAll());
    whenGone(root, () => { alive = false; cancelAnimationFrame(raf); clearTimeout(saveT); clearTimeout(prefT); clearTimeout(statusT); if (player) player.stop(); player = null; keys.releaseAll(); grid.dispose(); stopAudition(); });

    /* ---- start ---------------------------------------------------------------------------------------------- */
    let first = api.fresh();
    try {
      const prefs = await ctx.load('prefs');
      if (prefs) Object.keys(prefs).forEach(k => { if (k in G && prefs[k] != null) G[k] = prefs[k]; });
      if (args && args.path) { const rec = await ctx.fs.read(args.path); if (rec) first = L.deserialize(rec.content); G.path = args.path; }
      else { const d = await ctx.load('draft'); if (d && d.tracks) first = L.deserialize(JSON.stringify(d)); }
    } catch (e) { first = api.fresh(); }
    first.tracks.forEach(t => { if (t.lo == null) t.lo = defaultLo(t.inst, t); });
    G.song = first; hist.reset(first); S.preload(first);
    status.textContent = HINTS[G.tool];
    setDock(G.dock); renderAll(); grid.resetScroll(); title(); toolbar.clock(0, 0);
    api.focus();
    if (!(await ctx.load('seen')) && !(args && args.path)) { openHelp(root); ctx.save('seen', 2).catch(() => {}); }
    if (window.__garageTest) window.__garageTest = { api, G, play, stop, grid };
  },
  unmount() {}
};
