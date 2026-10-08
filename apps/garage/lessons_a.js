/* Lessons one to four: the sounds, pitch, the pulse, the five safe notes. */
import { HEX } from './model.js';

const C = i => HEX[i];

export const LESSONS_A = [
  {
    title: 'HEAR THE KIT', inst: ['drums', 'piano', 'bells', 'flute'],
    build(st, X) {
      X.say('Every sound in the Garage is a real recording, played back at the pitch you ask for. Nothing is synthesised.');
      X.say('Hit the pads. Try all four.');
      const used = new Set(), dots = X.dots(4);
      const row = X.row();
      const hit = k => { used.add(k); dots.set(used.size); if (used.size === 4) X.done(); };
      X.pad(row, 'DRUM', C(14), () => { X.S.tap('drums', X.pick(['kick', 'snare', 'lotom', 'clap', 'cowbell'])); hit('d'); }, 'KIT');
      X.pad(row, 'PIANO', C(11), () => { X.tap('piano', X.pick([60, 64, 67, 72])); hit('p'); }, 'GRAND');
      X.pad(row, 'BELL', C(13), () => { X.tap('bells', X.pick([72, 76, 79]), 1.6); hit('b'); }, 'TUBULAR');
      X.pad(row, 'FLUTE', C(10), () => { X.tap('flute', X.pick([72, 76, 79, 84]), 0.9); hit('f'); }, 'AIRY');
      X.say('One of each, then you are through.', 'l-small');
    }
  },
  {
    title: 'PITCH', inst: ['flute', 'cello', 'piano'],
    build(st, X) {
      X.say('Pitch is how high or low a note sits: the faster something vibrates, the higher it sounds.');
      const r1 = X.row();
      X.pad(r1, 'HIGH', C(11), () => X.tap('flute', X.pick([84, 88, 91]), 0.6), 'FLUTE');
      X.pad(r1, 'LOW', C(6), () => X.tap('cello', X.pick([36, 38, 41]), 1.2), 'CELLO');
      X.say('Walk up a scale, one step at a time.');
      const stairs = document.createElement('div');
      stairs.className = 'l-stairs';
      [60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => {
        const b = document.createElement('button');
        b.className = 'l-step';
        b.style.height = (40 + i * 14) + 'px';
        b.style.borderTopColor = C([12, 6, 14, 10, 11, 9, 13, 15][i]);
        b.textContent = X.L.pcName(m);
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); X.tap('piano', m, 0.7); });
        stairs.appendChild(b);
      });
      st.appendChild(stairs);
      X.say('Now test your ear. Which one was higher? Get three in a row.');
      const dots = X.dots(3);
      let won = 0, pair = null;
      const row = X.row();
      X.pad(row, 'LISTEN', C(14), () => {
        const a = 55 + X.rand(20); let b = a + (X.rand(2) ? 1 : -1) * (4 + X.rand(9));
        b = Math.max(48, Math.min(84, b)); pair = [a, b];
        X.tap('piano', a, 0.6); X.later(() => X.tap('piano', b, 0.6), 800);
      }, 'TWO NOTES');
      const answer = which => () => {
        if (!pair) { X.ok('Hit LISTEN first.'); return; }
        const right = pair[0] > pair[1] ? 0 : 1;
        if (which === right) { won++; dots.set(won); X.ok('Right.'); if (won >= 3) X.done(); }
        else { won = 0; dots.set(0); X.ok('Not that time. Listen again.'); }
        pair = null;
      };
      X.pad(row, 'THE FIRST', C(10), answer(0));
      X.pad(row, 'THE SECOND', C(13), answer(1));
    }
  },
  {
    title: 'THE PULSE', inst: ['drums'],
    build(st, X) {
      X.say('Underneath almost everything there is a steady pulse. Its speed is the tempo, counted in beats per minute.');
      const heart = document.createElement('div');
      heart.className = 'l-heart';
      heart.textContent = 'KICK';
      const hr = X.row(); hr.appendChild(heart);
      let bpm = 80, timer = null;
      const start = () => {
        if (timer) X.clear(timer);
        timer = X.every(() => { X.S.tap('drums', 'kick'); heart.classList.add('beat'); X.later(() => heart.classList.remove('beat'), 110); }, 60000 / bpm);
      };
      start();
      const sp = X.row();
      const speeds = X.radio();
      [['SLOW', 60, C(11)], ['MID', 80, C(10)], ['FAST', 120, C(12)]].forEach(([n, v, c]) => {
        const b = X.pad(sp, n, c, () => { bpm = v; taps = []; start(); X.ok(''); speeds.pick(b); }, v + ' BPM');
        speeds.add(b, v === bpm);
      });
      X.say('Now lock onto it. Tap the pad (or the space bar) on every kick.');
      const dots = X.dots(8);
      let taps = [];
      const tap = () => {
        const now = performance.now();
        if (taps.length && now - taps[taps.length - 1] > 60000 / bpm * 2) taps = [];
        taps.push(now);
        X.S.tap('drums', 'cowbell');
        const iv = taps.slice(1).map((t, i) => t - taps[i]), want = 60000 / bpm;
        const good = iv.filter(v => Math.abs(v - want) < want * 0.3).length;
        dots.set(Math.min(8, good + (taps.length > 0 ? 1 : 0)));
        if (iv.length && Math.abs(iv[iv.length - 1] - want) >= want * 0.3) { taps = [now]; dots.set(1); X.ok('Off the pulse. Try to stay on it.'); }
        else X.ok(good >= 3 ? 'Steady.' : '');
        if (good >= 7) X.done();
      };
      const row = X.row();
      const big = X.pad(row, 'TAP', C(14), () => tap(), 'ON EVERY KICK');
      big.style.minWidth = '220px'; big.style.minHeight = '96px';
      const onKey = ev => { if (ev.key === ' ') { ev.preventDefault(); if (!ev.repeat) tap(); } };
      st.closest('.g-lessons').addEventListener('keydown', onKey);
      st.tabIndex = 0; st.focus();
    }
  },
  {
    title: 'FIVE SAFE NOTES', inst: ['piano', 'flute', 'marimba', 'strings', 'upright'],
    build(st, X) {
      X.say('A scale is a set of notes that belong together. The pentatonic scale has five, and none of them clash: play them in any order over the backing and it holds up.');
      const L = X.L;
      const back = L.buildSong({ bpm: 84, key: 'C', scale: 'major', bars: 4, tracks: [] });
      L.accompany(back, 'lullaby', 'pop').filter(t => t.name !== 'CHORDS').forEach(t => back.tracks.push(t));
      back.tracks.push(L.newTrack({ name: 'PAD', inst: 'strings', notes: L.chordLine(L.progression('C', 'major', 'pop', 4), 4, 'pad', 55), vol: 0.5, reverb: 0.4 }));
      X.play(back, { loop: true });
      let inst = 'piano';
      const ir = X.row();
      const voices = X.radio();
      [['PIANO', 'piano', C(11)], ['FLUTE', 'flute', C(10)], ['MARIMBA', 'marimba', C(14)]].forEach(([n, id, c]) => {
        const b = X.pad(ir, n, c, () => { inst = id; X.tap(inst, 72, 0.6); voices.pick(b); }, 'USE');
        voices.add(b, id === inst);
      });
      const notes = [[72, 'C', 12], [74, 'D', 14], [76, 'E', 10], [79, 'G', 11], [81, 'A', 13]];
      const mine = [];
      const dots = X.dots(12), tuneEl = document.createElement('div');
      tuneEl.className = 'l-dots';
      const row = X.row();
      notes.forEach(([m, n, c]) => X.pad(row, n, C(c), () => {
        X.tap(inst, m, inst === 'flute' ? 0.9 : 0.7);
        mine.push([m, c]);
        const d = document.createElement('div'); d.className = 'l-dot on'; d.style.background = C(c); tuneEl.appendChild(d);
        if (tuneEl.children.length > 24) tuneEl.firstChild.remove();
        dots.set(Math.min(12, mine.length));
        if (mine.length >= 12) X.done();
      }, 'NOTE'));
      X.say('What you have played:', 'l-small');
      st.appendChild(tuneEl);
      const rr = X.row();
      X.pad(rr, 'PLAY IT BACK', C(13), () => { mine.slice(-12).forEach(([m], i) => X.later(() => X.tap(inst, m, 0.5), i * 380)); }, 'LAST 12 NOTES');
      X.say('This is what MAGIC NOTES does in the roll: it hides every note outside the key, so you cannot hit a wrong one.', 'l-small');
    }
  }
];
