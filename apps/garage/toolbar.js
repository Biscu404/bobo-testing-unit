/* The three bars across the top: transport, file and song, and the edit tools; and the
   strip that appears when a stretch of song is picked. Every button says what it does
   when you hold the pointer on it, and the ones that cannot do anything right now are
   greyed, so there is nothing to press by mistake. */
import { el, btn, numberBox, menu, fmtTime } from './ui.js';
import { SNAPS } from './model.js';

const NOTE_LENS = [['SNAP', 0], ['1/16', 0.25], ['1/8', 0.5], ['1/4', 1], ['1/2', 2], ['1', 4]];

export function makeToolbar(root, api) {
  const G = api.G, L = api.lang, A = api.act;
  const sel = (cls, opts, title, on) => {
    const s = el('select', 'g-sel ' + (cls || ''));
    opts.forEach(([lb, v]) => s.appendChild(new Option(lb, String(v))));
    if (title) s.title = title;
    s.addEventListener('change', () => on(s.value));
    s.addEventListener('mousedown', ev => ev.stopPropagation());
    s.addEventListener('keydown', ev => ev.stopPropagation());
    return s;
  };
  const lbl = t => el('span', 'g-lbl', t);

  /* ---- bar one: transport, tempo, key ------------------------------------------------------------ */
  const b1 = el('div', 'g-top');
  const bBack = btn('⏮', 'g-sm', () => api.toStart(), 'BACK TO THE START (HOME)');
  const bPlay = btn('▶ PLAY', 'g-play', () => api.toggle(), 'PLAY OR STOP (SPACE). IT STARTS AT THE YELLOW CURSOR.');
  const bRec = btn('● REC', 'g-rec', () => api.record(), 'PLAY ALONG ON THE KEYS BELOW AND KEEP WHAT YOU PLAY, ON THE SELECTED TRACK');
  const bLoop = btn('LOOP', 'g-tog', () => api.setLoop(!G.loop), 'LOOP THE PICKED STRETCH, OR THE WHOLE SONG IF NONE IS PICKED (CTRL+L)');
  const bMetro = btn('CLICK', 'g-tog', () => api.setMetro(!G.metro), 'A METRONOME (M)');
  const bCount = btn('COUNT-IN', 'g-tog', () => { G.countIn = !G.countIn; api.changed('transport'); }, 'ONE BAR OF CLICKS BEFORE IT STARTS');
  const pos = el('span', 'g-pos', '001.1  0:00.0');
  pos.title = 'BAR . BEAT, AND MINUTES : SECONDS';
  const bpmBox = numberBox(120, 30, 300, 1, v => api.setBpm(v), 'g-bpmbox');
  bpmBox.title = 'TEMPO IN BEATS PER MINUTE. TYPE IT, OR USE THE ARROWS.';
  const tap = [];
  const bTap = btn('TAP', 'g-sm', () => {
    const now = performance.now();
    if (tap.length && now - tap[tap.length - 1] > 2000) tap.length = 0;
    tap.push(now);
    if (tap.length >= 3) { const iv = tap.slice(1).map((t, i) => t - tap[i]); api.setBpm(Math.round(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length))); }
  }, 'TAP THIS FOUR TIMES TO THE BEAT TO SET THE TEMPO');
  const beatsSel = sel('', [2, 3, 4, 5, 6, 7].map(n => [n + ' BEATS', n]), 'BEATS IN A BAR', v => { G.song.beats = +v; api.changed('edit'); });
  const keySel = sel('', L.KEYS.map(k => [k, k]), 'THE KEY OF THE SONG. IT SETS WHICH NOTES ARE HIGHLIGHTED (AND WHICH ARE LEFT WHEN MAGIC NOTES IS ON). IT DOES NOT MOVE YOUR NOTES: USE THE TRANSPOSE BUTTONS FOR THAT.', v => { G.song.key = v; api.changed('edit'); });
  const scaleSel = sel('', Object.keys(L.SCALES).map(k => [L.SCALES[k].name, k]), 'THE SCALE', v => { G.song.scale = v; api.changed('edit'); });
  const bMagic = btn('MAGIC NOTES', 'g-tog', () => { G.magic = !G.magic; api.changed('view'); }, 'ONLY SHOW THE NOTES THAT FIT THE KEY: NO WRONG NOTES. SWITCH IT OFF FOR EVERY NOTE.');
  const swingSel = sel('', [['NO SWING', 0], ['SWING 25%', 0.25], ['SWING 50%', 0.5], ['SWING 75%', 0.75]], 'THE OFF-BEAT EIGHTH NOTES LEAN LATE', v => { G.song.swing = +v; api.changed('edit'); });
  b1.append(bBack, bPlay, bRec, bLoop, bMetro, bCount, pos, lbl('BPM'), bpmBox, bTap, beatsSel, lbl('KEY'), keySel, scaleSel, bMagic, swingSel);

  /* ---- bar two: the song as a file, and its length ---------------------------------------------------- */
  const b2 = el('div', 'g-top g-top2');
  const bBand = btn('BAND IN A BOX', 'g-go', () => api.band(), 'ADD DRUMS, BASS AND CHORDS THAT FIT YOUR KEY');
  const barsBox = numberBox(8, 1, 256, 1, v => { G.song.bars = v; api.changed('edit'); }, 'g-barbox');
  barsBox.title = 'HOW MANY BARS LONG THE SONG IS. IT ALSO GROWS BY ITSELF WHEN YOU PUT NOTES PAST THE END.';
  b2.append(bBand, btn('NEW', '', () => api.newSong(), 'START A NEW SONG'), btn('OPEN', '', () => api.openSongs(), 'OPEN A SONG, IMPORT A MIDI FILE, OR TRY A DEMO (CTRL+O)'),
    btn('SAVE', 'g-save', () => api.save(false), 'KEEP THIS SONG IN HOME/SONGS (CTRL+S)'), btn('SAVE AS', '', () => api.save(true), 'KEEP IT UNDER A NEW NAME'),
    btn('EXPORT', '', () => api.exportDialog(), 'MAKE A WAV, A MIDI FILE, OR A WAV FOR EVERY TRACK'),
    lbl('BARS'), barsBox, btn('TRIM', 'g-sm', () => A.trim(), 'CUT THE SONG OFF WHERE THE LAST NOTE ENDS'),
    el('span', 'g-flex'), btn('LEARN', 'g-learn', () => api.learn(), 'THE BASICS, IN EIGHT SHORT LESSONS'), btn('?', 'g-sm', () => api.help(), 'KEYS AND TIPS (F1)'));

  /* ---- bar three: the tools --------------------------------------------------------------------------- */
  const b3 = el('div', 'g-top g-top3');
  const tools = [['DRAW', 'draw', '1', 'CLICK TO PUT A NOTE DOWN, DRAG IT LONGER. CLICK A NOTE YOU HAVE TO SELECT AND MOVE IT. ON THE DRUMS, CLICK A CELL TO SWITCH IT ON OR OFF.'],
    ['SELECT', 'select', '2', 'DRAG A BOX TO SELECT. SHIFT ADDS TO WHAT IS SELECTED.'], ['ERASE', 'erase', '3', 'DRAG OVER NOTES TO TAKE THEM AWAY. THE RIGHT MOUSE BUTTON DOES THIS IN ANY TOOL.']];
  const toolBtns = tools.map(([lb, id, k, tip]) => btn(lb, 'g-tool', () => api.setTool(id), tip + '  (' + k + ')'));
  const snapSel = sel('', SNAPS.map(([lb], i) => [lb, i]), 'THE GRID NOTES SNAP TO', v => { G.snap = +v; api.changed('view'); });
  const lenSel = sel('', NOTE_LENS.map(([lb, v]) => [lb, v]), 'HOW LONG A NEW NOTE IS (BEATS). SNAP: AS LONG AS ONE GRID STEP.', v => { G.noteLen = +v; api.changed('view'); });
  const bUndo = btn('UNDO', '', () => api.undo(), 'TAKE BACK THE LAST THING (CTRL+Z)');
  const bRedo = btn('REDO', '', () => api.redo(), 'PUT BACK WHAT YOU TOOK BACK (CTRL+Y)');
  const bCut = btn('CUT', 'g-sm', () => A.cut(), 'CUT (CTRL+X)'), bCopy = btn('COPY', 'g-sm', () => A.copy(), 'COPY THE SELECTED NOTES, OR THE PICKED STRETCH (CTRL+C)'),
    bPaste = btn('PASTE', 'g-sm', () => A.paste(false), 'PUT IT DOWN AT THE YELLOW CURSOR (CTRL+V)'), bDup = btn('DUP', 'g-sm', () => A.duplicate(), 'COPY IT STRAIGHT AFTER ITSELF (CTRL+D)'),
    bDel = btn('DEL', 'g-sm', () => A.del(false), 'DELETE (DELETE KEY)'), bAll = btn('ALL', 'g-sm', () => A.selectAll(), 'SELECT EVERY NOTE IN THIS TRACK (CTRL+A)');
  const bQ = btn('QUANTIZE', '', (ev, b) => menu(root, b, [['FULL', () => A.quantize(1, false), 'Q'], ['HALF WAY', () => A.quantize(0.5, false)], ['FULL, LENGTHS TOO', () => A.quantize(1, true)]]),
    'SNAP THE TIMING TO THE GRID: TO THE SELECTED NOTES, THE PICKED STRETCH, OR THE WHOLE TRACK');
  const bMore = btn('MORE ▼', '', (ev, b) => menu(root, b, [
    ['HUMANIZE', () => A.humanize()], ['LEGATO', () => A.legato()], null,
    ['TRANSPOSE UP A SEMITONE', () => A.transpose(1), 'UP'], ['TRANSPOSE DOWN A SEMITONE', () => A.transpose(-1), 'DOWN'],
    ['TRANSPOSE UP AN OCTAVE', () => A.transpose(12), 'SHIFT+UP'], ['TRANSPOSE DOWN AN OCTAVE', () => A.transpose(-12), 'SHIFT+DOWN'], null,
    ['HARDER (VELOCITY UP)', () => A.velocity(1.2)], ['SOFTER (VELOCITY DOWN)', () => A.velocity(0.8)],
    ['VELOCITY RAMP UP', () => A.fade(0.3, 1)], ['VELOCITY RAMP DOWN', () => A.fade(1, 0.3)], null,
    ['LONGER (BY ONE STEP)', () => A.stretch(1), ']'], ['SHORTER (BY ONE STEP)', () => A.stretch(-1), '[']]), 'MORE THINGS TO DO TO NOTES');
  const bZoom = [btn('−', 'g-sm', () => api.zoom(0.8, 1), 'ZOOM OUT IN TIME (CTRL+WHEEL)'), btn('+', 'g-sm', () => api.zoom(1.25, 1), 'ZOOM IN IN TIME (CTRL+WHEEL)'),
    btn('↕−', 'g-sm', () => api.zoom(1, 0.85), 'SHORTER ROWS (CTRL+SHIFT+WHEEL)'), btn('↕+', 'g-sm', () => api.zoom(1, 1.18), 'TALLER ROWS')];
  const bFollow = btn('FOLLOW', 'g-tog', () => { G.follow = !G.follow; api.changed('view'); }, 'KEEP THE PLAYHEAD IN VIEW WHILE IT PLAYS');
  const info = el('span', 'g-info', '');
  b3.append(...toolBtns, lbl('SNAP'), snapSel, lbl('LEN'), lenSel, bUndo, bRedo, bCut, bCopy, bPaste, bDup, bDel, bAll, bQ, bMore, ...bZoom, bFollow, info);

  /* ---- the strip for a picked stretch of song ---------------------------------------------------------- */
  const b4 = el('div', 'g-top g-seg');
  const segInfo = el('span', 'g-seginfo', '');
  const onlyBox = el('label', 'g-onlybox'), onlyCk = el('input'); onlyCk.type = 'checkbox';
  onlyCk.addEventListener('change', () => { G.segOnly = onlyCk.checked; api.changed('sel'); });
  onlyBox.append(onlyCk, document.createTextNode(' THIS TRACK ONLY'));
  onlyBox.title = 'ACT ON THE SELECTED TRACK ONLY, NOT EVERY TRACK';
  b4.append(segInfo, onlyBox,
    btn('LOOP IT', '', () => A.loopRange(), 'PLAY ROUND AND ROUND THIS STRETCH'), btn('COPY', '', () => A.copy(), 'COPY THE STRETCH (CTRL+C), THEN CLICK THE RULER WHERE IT SHOULD GO AND PASTE'),
    btn('CUT', '', () => A.cut(), 'COPY IT AND CLEAR IT'), btn('PASTE', '', () => A.paste(false), 'LAY WHAT YOU COPIED OVER THE SONG AT THE YELLOW CURSOR'),
    btn('PASTE+PUSH', '', () => A.paste(true), 'PASTE AT THE CURSOR, MOVING EVERYTHING AFTER IT LATER TO MAKE ROOM'),
    btn('DUPLICATE', '', () => A.duplicate(), 'COPY THE STRETCH STRAIGHT AFTER ITSELF, THE REST OF THE SONG MOVING UP (CTRL+D)'),
    btn('x4', 'g-sm', () => A.repeat(3), 'REPEAT THE STRETCH FOUR TIMES IN ALL'),
    btn('CLEAR', '', () => A.del(false), 'EMPTY THE STRETCH, LEAVING THE SILENCE (DELETE)'), btn('REMOVE', '', () => A.del(true), 'TAKE THE STRETCH OUT AND CLOSE THE GAP (SHIFT+DELETE)'),
    btn('ADD GAP', '', () => A.gap(), 'INSERT AS MUCH SILENCE AS THE STRETCH IS LONG, PUSHING THE REST LATER'),
    btn('✕', 'g-sm', () => api.setRange(null), 'DROP THE PICK (ESC)'));

  const bars = [b1, b2, b3, b4];

  /* ---- keeping it true ----------------------------------------------------------------------------- */
  function update() {
    const s = G.song, t = s.tracks[G.sel];
    bpmBox.value = String(s.bpm); barsBox.value = String(s.bars);
    beatsSel.value = String(s.beats); keySel.value = s.key; scaleSel.value = s.scale; swingSel.value = String(s.swing || 0);
    snapSel.value = String(G.snap); lenSel.value = String(G.noteLen);
    bMagic.classList.toggle('on', G.magic); bLoop.classList.toggle('on', G.loop); bMetro.classList.toggle('on', G.metro);
    bCount.classList.toggle('on', G.countIn); bFollow.classList.toggle('on', G.follow); bRec.classList.toggle('on', G.rec);
    bPlay.textContent = api.player() ? '■ STOP' : '▶ PLAY'; bPlay.classList.toggle('on', !!api.player());
    tools.forEach(([, id], i) => toolBtns[i].classList.toggle('on', G.tool === id));
    bUndo.disabled = !api.hist.can(); bRedo.disabled = !api.hist.canRedo();
    const some = G.items.size > 0 || !!G.range;
    [bCut, bCopy, bDup, bDel].forEach(b => { b.disabled = !some; });
    bPaste.disabled = !api.clip(); bAll.disabled = !t;
    b4.style.display = G.range ? 'flex' : 'none';
    if (G.range) {
      const bp = s.beats, a = Math.floor(G.range.a / bp) + 1, z = Math.ceil(G.range.b / bp - 1e-6), n = (G.range.b - G.range.a) / bp;
      segInfo.textContent = 'STRETCH: ' + (a === z ? 'BAR ' + a : 'BARS ' + a + '-' + z) + '  (' + (Math.round(n * 100) / 100) + ' BAR' + (n === 1 ? '' : 'S') + ')';
      onlyCk.checked = !!G.segOnly;
    }
    const n = G.items.size;
    info.textContent = n ? n + ' SELECTED' : G.range ? '' : (t && t.inst === 'drums' ? 'DRUMS: CLICK A CELL TO SWITCH IT ON' : '');
  }
  /* the time, once a frame */
  function clock(beat, secs) {
    const s = G.song, b = Math.max(0, beat), bar = Math.floor(b / s.beats) + 1, bt = Math.floor(b % s.beats) + 1;
    pos.textContent = String(bar).padStart(3, '0') + '.' + bt + '  ' + fmtTime(secs);
  }
  return { bars, update, clock };
}
