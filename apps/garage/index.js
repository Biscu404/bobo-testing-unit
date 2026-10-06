import { el, btn, modal } from './ui.js';
import { makeGrid } from './grid.js';
import { makeTracks } from './tracks.js';
import { makeKeys } from './keys.js';
import { openPicker, stopAudition } from './picker.js';
import { demoSongs } from './songs.js';
import { makeHistory, MAX_TRACKS } from './model.js';
import { openLessons } from './lessons.js';
import { whenGone, scopedListeners } from '../lifecycle.js';

const DIR = '::/Home/Songs';

export default {
  id: 'garage',
  title: 'THE GARAGE',
  width: 940,
  height: 640,
  resizable: true,
  fluid: true,

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
    const demos = demoSongs(L);

    const G = { song: null, sel: 0, magic: true, oct: 0, noteLen: 0.5, mixerOpen: false, rec: false, path: null, metro: false };
    const hist = makeHistory();
    let player = null, raf = 0, alive = true, saveT = 0;
    const api = { G, ctx, lang: L, studio: S, player: () => player };
    const nameOf = id => { const i = S.ins.find(id); return i ? i.name : id.toUpperCase(); };
    api.instrumentName = nameOf;

    /* ---- the song ----------------------------------------------------------- */
    const startSong = (song, path) => {
      stop();
      G.song = song; G.path = path || null; G.sel = 0;
      song.tracks.forEach(t => { if (t.lo == null) t.lo = defaultLo(t.inst, t); });
      hist.reset(song);
      S.preload(song);
      renderAll();
      grid.resetScroll();
    };
    function defaultLo(inst, t) {
      if (inst === 'drums') return 36;
      const i = S.ins.find(inst), s = i && i.samples;
      if (!s) return 48;
      const mean = t && t.notes && t.notes.length ? Math.round(t.notes.reduce((a, n) => a + n[2], 0) / t.notes.length) : Math.round((s[0].midi + s[s.length - 1].midi) / 2);
      return Math.max(24, Math.min(84, Math.round((mean - 18) / 12) * 12));
    }
    const fresh = () => {
      const song = L.newSong();
      song.tracks.push(L.newTrack({ name: 'MELODY', inst: 'piano', lo: 48 }));
      return song;
    };

    G.song = fresh();                         /* something to draw until the real one is read */

    /* ---- what changed ------------------------------------------------------- */
    function changed(kind) {
      if (kind === 'edit') { hist.push(G.song); persistSoon(); }
      if (kind === 'mix' || kind === 'edit') persistSoon();
      if (player) player.refresh();
      if (kind === 'edit' || kind === 'select' || kind === 'view') { tracks.render(); keys.render(); updateBar(); }
      if (kind === 'mix') { tracks.render(); }
      grid.redraw();
    }
    api.changed = changed;
    function persistSoon() { clearTimeout(saveT); saveT = setTimeout(() => ctx.save('draft', G.song).catch(() => {}), 600); }

    /* ---- transport ---------------------------------------------------------- */
    function play() {
      if (player) { stop(); return; }
      S.preload(G.song).then(() => {
        if (player || !alive) return;
        player = S.play(G.song, { loop: true, metronome: G.metro });
        bPlay.textContent = '■ STOP';
        bPlay.classList.add('on');
        tick();
      });
      if (S.knob() === 0) knobHint();
    }
    function stop() {
      if (player) { player.stop(); player = null; }
      bPlay.textContent = '▶ PLAY';
      bPlay.classList.remove('on');
      G.rec = false; bRec.classList.remove('on');
      grid.setHead(-1);
    }
    function tick() {
      cancelAnimationFrame(raf);
      const f = () => {
        if (!alive || !player) return;
        const b = player.beat() % (G.song.bars * G.song.beats);
        grid.follow(b); grid.setHead(b);
        raf = requestAnimationFrame(f);
      };
      f();
    }
    function knobHint() {
      const m = modal(root, 'NO SOUND?', 'g-small');
      m.body.append(el('div', 'g-p', 'THE MUS KNOB ON THE PANEL IS AT ZERO, SO THE MACHINE IS KEEPING QUIET.'),
        el('div', 'g-p', 'TURN IT UP YOURSELF (THE LEFT KNOB, BELOW THE SCREEN), OR LET ME.'));
      const foot = el('div', 'g-boxfoot');
      foot.append(btn('TURN IT UP FOR ME', 'g-go', () => { S.turnUp(6); m.close(); }), btn('NO THANKS', '', () => m.close()));
      m.body.appendChild(foot);
    }

    /* ---- the screen --------------------------------------------------------- */
    const top = el('div', 'g-top');
    const bPlay = btn('▶ PLAY', 'g-play', play, 'PLAY THE SONG (SPACE)');
    const bRec = btn('● REC', 'g-rec', () => {
      if (!player) { play(); }
      G.rec = !G.rec; bRec.classList.toggle('on', G.rec);
      ctx.toast(G.rec ? 'RECORDING: PLAY THE KEYS BELOW' : 'RECORDING OFF');
    }, 'PLAY ALONG AND KEEP WHAT YOU PLAY');
    const bpm = el('span', 'g-bpm');
    const bpmNum = el('b', '', String(100));
    bpm.append(el('span', 'g-lbl', 'SPEED'), btn('-', 'g-sm', () => setBpm(G.song.bpm - 4), 'SLOWER'), bpmNum, btn('+', 'g-sm', () => setBpm(G.song.bpm + 4), 'FASTER'));
    const setBpm = v => { G.song.bpm = Math.max(40, Math.min(220, v)); bpmNum.textContent = G.song.bpm; persistSoon(); };
    const keySel = el('select', 'g-sel');
    L.KEYS.forEach(k => keySel.appendChild(new Option(k, k)));
    keySel.addEventListener('change', () => {
      /* the notes already there move with the key, so what was a tune stays a tune */
      const from = L.noteToMidi(G.song.key + '4') % 12, to = L.noteToMidi(keySel.value + '4') % 12;
      let d = to - from; if (d > 6) d -= 12; if (d < -6) d += 12;
      G.song.tracks.forEach(t => { if (t.inst !== 'drums') t.notes.forEach(n => { n[2] += d; }); });
      G.song.key = keySel.value; changed('edit');
    });
    const scaleSel = el('select', 'g-sel');
    Object.keys(L.SCALES).forEach(k => scaleSel.appendChild(new Option(L.SCALES[k].name, k)));
    scaleSel.addEventListener('change', () => { G.song.scale = scaleSel.value; changed('edit'); });
    const bMagic = btn('MAGIC NOTES', 'g-magic', () => { G.magic = !G.magic; updateBar(); keys.render(); grid.redraw(); }, 'ONLY SHOW NOTES THAT FIT THE KEY: NO WRONG NOTES');
    const lenBtns = [['1/4', 0.25], ['1/2', 0.5], ['1', 1], ['2', 2]].map(([lb, v]) => btn(lb, 'g-sm', () => { G.noteLen = v; updateBar(); }, 'HOW LONG A NEW NOTE IS, IN BEATS'));
    const bars = btn('4 BARS', 'g-sm', () => {
      const opts = [2, 4, 8, 12, 16]; G.song.bars = opts[(opts.indexOf(G.song.bars) + 1) % opts.length]; changed('edit');
    }, 'HOW LONG THE SONG IS BEFORE IT REPEATS');
    top.append(bPlay, bRec, bpm,
      el('span', 'g-lbl', 'KEY'), keySel, scaleSel, bMagic, el('span', 'g-lbl', 'NOTE'), ...lenBtns, bars);

    const top2 = el('div', 'g-top g-top2');
    const bBand = btn('BAND IN A BOX', 'g-go', () => bandMenu(), 'ADD DRUMS, BASS AND CHORDS THAT FIT YOUR KEY');
    const bUndo = btn('UNDO', '', () => { const s = hist.pop(); if (s) { G.song = s; G.sel = Math.min(G.sel, s.tracks.length - 1); renderAll(); persistSoon(); } }, 'TAKE BACK THE LAST THING (CTRL+Z)');
    top2.append(bBand, bUndo,
      btn('NEW', '', () => { startSong(fresh()); }, 'START A NEW SONG'),
      btn('OPEN', '', () => openSongs(), 'OPEN A SONG, OR TRY ONE OF THE DEMOS'),
      btn('SAVE', '', () => save(), 'KEEP THIS SONG IN HOME/SONGS'),
      btn('EXPORT .WAV', '', () => exportWav(), 'MAKE AN AUDIO FILE OF THE SONG'),
      btn('METRONOME', 'g-metro', (ev, b) => { G.metro = !G.metro; b.classList.toggle('on', G.metro); if (player) { stop(); play(); } }, 'A TICKING CLICK TO KEEP TIME'),
      el('span', 'g-flex'),
      btn('LEARN', 'g-learn', () => learn(), 'EIGHT TINY LESSONS: MAKE MUSIC EVEN IF YOU NEVER HAVE'));

    const main = el('div', 'g-main');
    const side = el('div', 'g-side');
    const center = el('div', 'g-center');
    const gridHost = el('div', 'g-gridhost');
    const keyHost = el('div', 'g-keyhost');
    center.append(gridHost, keyHost);
    main.append(side, center);
    root.append(top, top2, main);

    const grid = makeGrid(gridHost, api);
    const tracks = makeTracks(side, api);
    const keys = makeKeys(keyHost, api);
    api.pickInstrument = i => openPicker(root, api, G.song.tracks[i].inst, id => {
      const t = G.song.tracks[i];
      t.inst = id; t.lo = defaultLo(id, t);
      if (t.name === 'MELODY' || /^TRACK/.test(t.name)) t.name = nameOf(id).slice(0, 12);
      S.preload(G.song); changed('edit');
    });
    api.addTrack = () => {
      if (G.song.tracks.length >= MAX_TRACKS) return;
      openPicker(root, api, 'piano', id => {
        const t = L.newTrack({ name: nameOf(id).slice(0, 12), inst: id });
        t.lo = defaultLo(id, t); if (id === 'drums') { t.hits = []; }
        G.song.tracks.push(t); G.sel = G.song.tracks.length - 1;
        S.preload(G.song); changed('edit');
      });
    };

    function renderAll() { tracks.render(); keys.render(); updateBar(); grid.redraw(); }
    function updateBar() {
      keySel.value = G.song.key; scaleSel.value = G.song.scale; bpmNum.textContent = G.song.bpm;
      bMagic.classList.toggle('on', G.magic);
      bMagic.textContent = G.magic ? 'MAGIC NOTES: ON' : 'MAGIC NOTES: OFF';
      [0.25, 0.5, 1, 2].forEach((v, i) => lenBtns[i].classList.toggle('on', G.noteLen === v));
      bars.textContent = G.song.bars + ' BARS';
      bUndo.disabled = !hist.can();
    }

    /* ---- the band ------------------------------------------------------------ */
    function bandMenu() {
      const m = modal(root, 'BAND IN A BOX', 'g-small');
      m.body.append(el('div', 'g-p', 'PICK A STYLE. THE BAND PLAYS IN YOUR KEY (' + G.song.key + ') SO IT ALWAYS FITS.'));
      const row = el('div', 'g-bandrow');
      Object.keys(L.STYLES).forEach(k => row.appendChild(btn(L.STYLES[k].name, 'g-big', () => {
        const prog = Object.keys(L.PROGRESSIONS)[0];
        const add = L.accompany(G.song, k, prog);
        /* the old band goes, the melody stays */
        G.song.tracks = G.song.tracks.filter(t => !/^(DRUMS|BASS|CHORDS|PAD)$/.test(t.name));
        add.forEach(t => { t.lo = defaultLo(t.inst, t); if (G.song.tracks.length < MAX_TRACKS) G.song.tracks.push(t); });
        S.preload(G.song).then(() => { if (!player) play(); });
        changed('edit'); m.close();
      })));
      m.body.appendChild(row);
      m.body.appendChild(el('div', 'g-p g-dim', 'TIP: PRESS PLAY, THEN TAP NOTES ON THE GRID.'));
    }

    /* ---- save, open, export ---------------------------------------------------- */
    async function save() {
      ctx.ask('NAME YOUR SONG', G.song.title, async v => {
        v = (v || '').trim();
        if (!v) return;
        G.song.title = v.toUpperCase().slice(0, 24);
        const file = G.song.title.replace(/[^A-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'SONG';
        const path = DIR + '/' + file + '.SONG';
        await ctx.fs.write(path, { type: 'song', content: L.serialize(G.song) });
        G.path = path;
        window.dispatchEvent(new CustomEvent('vfs-changed', { detail: { dir: DIR } }));
        window.dispatchEvent(new CustomEvent('vfs-changed', { detail: { dir: '::/Home' } }));
        ctx.toast('SAVED: ' + path);
      });
    }
    async function openSongs() {
      const m = modal(root, 'OPEN A SONG', 'g-small');
      const mine = (await ctx.fs.list(DIR)).filter(f => /\.SONG$/i.test(f.name));
      m.body.appendChild(el('div', 'g-famhead', 'MY SONGS'));
      if (!mine.length) m.body.appendChild(el('div', 'g-p g-dim', 'NONE YET. PRESS SAVE TO KEEP ONE.'));
      mine.forEach(f => m.body.appendChild(btn(f.name.replace(/\.SONG$/i, ''), 'g-line', async () => {
        const rec = await ctx.fs.read(DIR + '/' + f.name);
        try { startSong(L.deserialize(rec.content), DIR + '/' + f.name); m.close(); } catch (e) { ctx.toast('THAT SONG WOULD NOT OPEN.'); }
      })));
      m.body.appendChild(el('div', 'g-famhead', 'DEMO SONGS'));
      demos.forEach(d => m.body.appendChild(btn(d.title + '   ' + d.bpm + ' BPM', 'g-line', () => { startSong(JSON.parse(JSON.stringify(d))); m.close(); })));
    }
    async function exportWav() {
      ctx.toast('MAKING THE AUDIO FILE...');
      try {
        const buf = await S.render(G.song, { repeat: 2 });
        const a = document.createElement('a');
        a.download = (G.song.title || 'SONG').replace(/\s+/g, '_') + '.wav';
        a.href = URL.createObjectURL(S.wav(buf));
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        ctx.toast('WRITTEN TO YOUR DOWNLOADS.');
      } catch (e) { ctx.toast('THE AUDIO FILE FAILED: ' + e.message); }
    }
    function learn() { stop(); openLessons(root, api, { load: s => startSong(s) }); }

    /* ---- the first time ------------------------------------------------------------ */
    function welcome() {
      const m = modal(root, 'WELCOME TO THE GARAGE', 'g-small g-welcome');
      [['1', 'PICK AN INSTRUMENT', 'THE BUTTON WITH THE ARROW ON THE LEFT.'], ['2', 'TAP THE GRID', 'EVERY SQUARE IS A SOUND. TAP AGAIN TO TAKE IT AWAY.'],
        ['3', 'PRESS PLAY', 'THE WHITE LINE WALKS ACROSS AND PLAYS WHAT YOU MADE.'], ['4', 'PRESS BAND IN A BOX', 'DRUMS, BASS AND CHORDS APPEAR. IT SOUNDS GOOD.']].forEach(([n, a, b]) => {
        const r = el('div', 'g-step');
        r.append(el('b', 'g-num', n), el('span', '', ''));
        r.lastChild.append(el('strong', '', a), el('br'), document.createTextNode(b));
        m.body.appendChild(r);
      });
      const foot = el('div', 'g-boxfoot');
      foot.append(btn('LEARN FIRST (EASY!)', 'g-go', () => { m.close(); learn(); }), btn('LET ME PLAY', '', () => m.close()));
      m.body.appendChild(foot);
      ctx.save('seen', 1).catch(() => {});
    }

    /* ---- keys, and cleaning up ------------------------------------------------------- */
    const L2 = scopedListeners(root);
    root.addEventListener('keydown', ev => {
      if (ev.key === ' ' && !/button|input|select|textarea/i.test(ev.target.tagName)) { ev.preventDefault(); if (!ev.repeat) play(); return; }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); bUndo.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return; }
      if (keys.keydown(ev)) ev.preventDefault();
    });
    root.addEventListener('keyup', ev => keys.keyup(ev));
    root.addEventListener('mousedown', ev => { if (!/input|select|textarea/i.test(ev.target.tagName)) root.focus({ preventScroll: true }); });
    L2.on(window, 'blur', () => keys.releaseAll());
    whenGone(root, () => { alive = false; cancelAnimationFrame(raf); clearTimeout(saveT); if (player) player.stop(); player = null; keys.releaseAll(); grid.dispose(); stopAudition(); });

    /* ---- start ------------------------------------------------------------------------ */
    let first = fresh();
    try {
      if (args && args.path) { const rec = await ctx.fs.read(args.path); if (rec) first = L.deserialize(rec.content); G.path = args.path; }
      else { const d = await ctx.load('draft'); if (d && d.tracks) first = L.deserialize(JSON.stringify(d)); }
    } catch (e) { first = fresh(); }
    first.tracks.forEach(t => { if (t.lo == null) t.lo = defaultLo(t.inst, t); });
    G.song = first;
    hist.reset(first);
    S.preload(first);
    renderAll();
    root.focus({ preventScroll: true });
    if (!(await ctx.load('seen')) && !(args && args.path)) welcome();
    if (window.__garageTest) window.__garageTest = { api, G, play, stop };
  },
  unmount() {}
};
