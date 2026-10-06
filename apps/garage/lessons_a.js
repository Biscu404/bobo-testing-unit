/* Lessons one to four: sounds, high and low, the beat, the five magic notes. */
import { HEX } from './model.js';

const C = i => HEX[i];

export const LESSONS_A = [
  {
    title: 'SOUNDS!', inst: ['drums', 'piano', 'bells', 'flute'],
    build(st, X) {
      X.say('MUSIC IS JUST SOUNDS, ONE AFTER ANOTHER.');
      X.say('PRESS THE BIG BUTTONS. EACH ONE IS A REAL INSTRUMENT!');
      const used = new Set(), dots = X.dots(4);
      const row = X.row();
      const hit = k => { used.add(k); dots.set(used.size); if (used.size === 4) X.done(); };
      X.pad(row, 'DRUM', C(14), () => { X.S.tap('drums', X.pick(['kick', 'snare', 'lotom', 'clap', 'cowbell'])); hit('d'); }, 'BOOM!');
      X.pad(row, 'PIANO', C(11), () => { X.tap('piano', X.pick([60, 64, 67, 72])); hit('p'); }, 'PLINK!');
      X.pad(row, 'BELL', C(13), () => { X.tap('bells', X.pick([72, 76, 79]), 1.6); hit('b'); }, 'DING!');
      X.pad(row, 'FLUTE', C(10), () => { X.tap('flute', X.pick([72, 76, 79, 84]), 0.9); hit('f'); }, 'TWEET!');
      X.say('TRY ALL FOUR!', 'l-small');
    }
  },
  {
    title: 'HIGH AND LOW', inst: ['flute', 'cello', 'piano'],
    build(st, X) {
      X.say('SOME SOUNDS ARE HIGH, LIKE A BIRD. SOME ARE LOW, LIKE AN ELEPHANT.');
      const r1 = X.row();
      X.pad(r1, 'BIRD', C(11), () => X.tap('flute', X.pick([84, 88, 91]), 0.6), 'HIGH');
      X.pad(r1, 'ELEPHANT', C(6), () => X.tap('cello', X.pick([36, 38, 41]), 1.2), 'LOW');
      X.say('NOW CLIMB THE STAIRS. PRESS EACH STEP, GOING UP!');
      const stairs = document.createElement('div');
      stairs.className = 'l-stairs';
      [60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => {
        const b = document.createElement('button');
        b.className = 'l-step';
        b.style.height = (40 + i * 14) + 'px';
        b.style.background = C([12, 6, 14, 10, 11, 9, 13, 15][i]);
        b.textContent = X.L.pcName(m);
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); X.tap('piano', m, 0.7); });
        stairs.appendChild(b);
      });
      st.appendChild(stairs);
      X.say('NOW A GAME. WHICH SOUND WAS HIGHER?');
      const dots = X.dots(3);
      let won = 0, pair = null;
      const row = X.row();
      X.pad(row, 'LISTEN', C(14), () => {
        const a = 55 + X.rand(20); let b = a + (X.rand(2) ? 1 : -1) * (4 + X.rand(9));
        b = Math.max(48, Math.min(84, b)); pair = [a, b];
        X.tap('piano', a, 0.6); X.later(() => X.tap('piano', b, 0.6), 800);
      }, 'TWO SOUNDS');
      const answer = which => () => {
        if (!pair) { X.ok('PRESS LISTEN FIRST!'); return; }
        const right = pair[0] > pair[1] ? 0 : 1;
        if (which === right) { won++; dots.set(won); X.ok('YES! ♪'); if (won >= 3) X.done(); }
        else { won = 0; dots.set(0); X.ok('NOT QUITE. LISTEN AGAIN!'); }
        pair = null;
      };
      X.pad(row, 'THE FIRST', C(10), answer(0));
      X.pad(row, 'THE SECOND', C(13), answer(1));
    }
  },
  {
    title: 'THE BEAT', inst: ['drums'],
    build(st, X) {
      X.say('MUSIC HAS A HEARTBEAT. IT GOES BOOM, BOOM, BOOM. STEADY, LIKE WALKING.');
      const heart = document.createElement('div');
      heart.className = 'l-heart';
      heart.textContent = 'BOOM';
      const hr = X.row(); hr.appendChild(heart);
      let bpm = 80, timer = null;
      const start = () => {
        if (timer) X.clear(timer);
        timer = X.every(() => { X.S.tap('drums', 'kick'); heart.classList.add('beat'); X.later(() => heart.classList.remove('beat'), 110); }, 60000 / bpm);
      };
      start();
      const sp = X.row();
      [['SLOW', 60, C(11)], ['WALKING', 80, C(10)], ['FAST', 120, C(12)]].forEach(([n, v, c]) => X.pad(sp, n, c, () => { bpm = v; taps = []; start(); X.ok(''); }, v + ' BEATS A MINUTE'));
      X.say('NOW TAP ALONG WITH THE HEART! PRESS THE BIG BUTTON (OR THE SPACE BAR) ON EVERY BOOM.');
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
        if (iv.length && Math.abs(iv[iv.length - 1] - want) >= want * 0.3) { taps = [now]; dots.set(1); X.ok('OOPS, TRY TO MATCH THE HEART!'); }
        else X.ok(good >= 3 ? 'STEADY!' : '');
        if (good >= 7) X.done();
      };
      const row = X.row();
      const big = X.pad(row, 'TAP!', C(14), () => tap(), 'ON EVERY BOOM');
      big.style.minWidth = '260px'; big.style.minHeight = '130px';
      const onKey = ev => { if (ev.key === ' ') { ev.preventDefault(); if (!ev.repeat) tap(); } };
      st.closest('.g-lessons').addEventListener('keydown', onKey);
      st.tabIndex = 0; st.focus();
    }
  },
  {
    title: 'FIVE MAGIC NOTES', inst: ['piano', 'flute', 'marimba', 'strings', 'upright'],
    build(st, X) {
      X.say('A SCALE IS A STAIRCASE OF SOUNDS. THESE FIVE STEPS ARE MAGIC: PRESS THEM IN ANY ORDER AND IT ALWAYS SOUNDS NICE!');
      const L = X.L;
      const back = L.buildSong({ bpm: 84, key: 'C', scale: 'major', bars: 4, tracks: [] });
      L.accompany(back, 'lullaby', 'pop').filter(t => t.name !== 'CHORDS').forEach(t => back.tracks.push(t));
      back.tracks.push(L.newTrack({ name: 'PAD', inst: 'strings', notes: L.chordLine(L.progression('C', 'major', 'pop', 4), 4, 'pad', 55), vol: 0.5, reverb: 0.4 }));
      X.play(back, { loop: true });
      let inst = 'piano';
      const ir = X.row();
      [['PIANO', 'piano', C(11)], ['FLUTE', 'flute', C(10)], ['MARIMBA', 'marimba', C(14)]].forEach(([n, id, c]) => X.pad(ir, n, c, () => { inst = id; X.tap(inst, 72, 0.6); }, 'USE THIS'));
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
      }, 'STEP'));
      X.say('YOUR TUNE:', 'l-small');
      st.appendChild(tuneEl);
      const rr = X.row();
      X.pad(rr, 'PLAY MY TUNE', C(13), () => { mine.slice(-12).forEach(([m], i) => X.later(() => X.tap(inst, m, 0.5), i * 380)); }, 'AGAIN!');
      X.say('NO WRONG NOTES. THAT IS THE TRICK. SONGS ARE MADE OF NOTES LIKE THESE.', 'l-small');
    }
  }
];
