/* Lessons five to eight: happy and sad, chords, patterns, and a song of your own. */
import { HEX } from './model.js';

const C = i => HEX[i];

export const LESSONS_B = [
  {
    title: 'HAPPY AND SAD', inst: ['piano', 'strings'],
    build(st, X) {
      X.say('SOME MUSIC SOUNDS LIKE THE SUN. SOME SOUNDS LIKE RAIN. THE SECRET IS ONE NOTE!');
      const L = X.L;
      const tune = minor => L.buildSong({ bpm: 96, bars: 2, key: 'C', scale: minor ? 'minor' : 'major', tracks: [
        { name: 'T', inst: 'piano', reverb: 0.3, notes: minor ? 'C4:q Eb4 G4 C5 | G4 Eb4 C4:h' : 'C4:q E4 G4 C5 | G4 E4 C4:h' },
        { name: 'S', inst: 'strings', vol: 0.5, reverb: 0.4, notes: minor ? 'C3+Eb3+G3:w C3+Eb3+G3:w' : 'C3+E3+G3:w C3+E3+G3:w' }] });
      const r = X.row();
      X.pad(r, 'THE SUN', C(14), () => X.play(tune(false), { loop: false }), 'HAPPY');
      X.pad(r, 'THE RAIN', C(9), () => X.play(tune(true), { loop: false }), 'SAD');
      X.say('LOOK! THREE NOTES. ONLY THE MIDDLE ONE MOVES. PRESS BOTH AND LISTEN:');
      const r2 = X.row();
      const chord = ns => ns.forEach(n => X.tap('piano', n, 1.6));
      X.pad(r2, 'C  E  G', C(14), () => chord([60, 64, 67]), 'MIDDLE UP');
      X.pad(r2, 'C  Eb  G', C(9), () => chord([60, 63, 67]), 'MIDDLE DOWN');
      X.say('NOW YOU GUESS. IS IT THE SUN OR THE RAIN?');
      const dots = X.dots(3);
      let want = null, won = 0;
      const r3 = X.row();
      X.pad(r3, 'LISTEN', C(10), () => { want = X.rand(2); X.play(tune(!!want), { loop: false }); }, 'A MYSTERY');
      const ans = w => () => {
        if (want == null) { X.ok('PRESS LISTEN FIRST!'); return; }
        if (w === want) { won++; dots.set(won); X.ok('YES!'); if (won >= 3) X.done(); } else { won = 0; dots.set(0); X.ok('NOT QUITE. LISTEN AGAIN!'); }
        want = null;
      };
      X.pad(r3, 'SUN', C(14), ans(0));
      X.pad(r3, 'RAIN', C(9), ans(1));
    }
  },
  {
    title: 'CHORDS', inst: ['piano', 'strings'],
    build(st, X) {
      X.say('A CHORD IS NOTES HOLDING HANDS: THEY PLAY AT THE SAME TIME. FIRST, MEET THREE NOTES:');
      const stack = new Set();
      const stackEl = X.say('', 'l-stack');
      const r = X.row();
      [['C', 60, 12], ['E', 64, 10], ['G', 67, 11]].forEach(([n, m, c]) => X.pad(r, n, C(c), () => {
        X.tap('piano', m, 0.7); stack.add(n);
        stackEl.textContent = [...stack].join(' + ') + (stack.size === 3 ? '  ... NOW ALL TOGETHER!' : '');
        if (stack.size === 3) X.later(() => [60, 64, 67].forEach(x => X.tap('piano', x, 1.8)), 900);
      }, 'NOTE'));
      X.say('NOW PLAY SOME REAL CHORDS. "C" IS HOME. THE OTHERS GO FOR A WALK AND COME BACK!');
      const heard = new Set(), dots = X.dots(4);
      const r2 = X.row();
      [['C', 'HOME', ['C']], ['F', 'A WALK', ['F']], ['G', 'FAR AWAY', ['G']], ['Am', 'A BIT SAD', ['Am']]].forEach(([n, sub, c], i) => X.pad(r2, n, C([14, 11, 13, 9][i]), () => {
        X.L.chordNotes(n, 55).forEach(m => X.tap('strings', m, 1.8));
        X.L.chordNotes(n, 43).slice(0, 1).forEach(m => X.tap('upright', m, 1.4));
        heard.add(n); dots.set(heard.size); if (heard.size >= 4) X.done();
      }, sub));
      X.say('TRY C, THEN F, THEN G, THEN C AGAIN. IT SOUNDS LIKE A SONG ENDING!', 'l-small');
    }
  },
  {
    title: 'PATTERNS', inst: ['drums'],
    build(st, X) {
      X.say('A PATTERN IS A BEAT THAT REPEATS AND REPEATS. TAP THE SQUARES TO MAKE YOUR OWN!');
      const rows = [['KICK', 'kick', 12, [0, 4]], ['SNARE', 'snare', 14, [2, 6]], ['HAT', 'hat', 11, [0, 1, 2, 3, 4, 5, 6, 7]]];
      const on = rows.map(r => new Set(r[3]));
      const grid = document.createElement('div');
      grid.className = 'l-grid';
      grid.style.gridTemplateColumns = '90px repeat(8, 44px)';
      const cells = [];
      let changes = 0;
      rows.forEach((r, ri) => {
        const lb = document.createElement('div'); lb.className = 'l-lbl'; lb.textContent = r[0]; grid.appendChild(lb);
        for (let c = 0; c < 8; c++) {
          const cell = document.createElement('div');
          cell.className = 'l-cell' + (on[ri].has(c) ? ' on' : '');
          cell.style.setProperty('--c', C(r[2]));
          cell.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            if (on[ri].has(c)) on[ri].delete(c); else { on[ri].add(c); X.S.tap('drums', r[1]); }
            cell.classList.toggle('on', on[ri].has(c));
            if (++changes >= 4 && playing) X.done();
          });
          cells.push(cell); grid.appendChild(cell);
        }
      });
      st.appendChild(grid);
      let playing = false, step = 0, t = null;
      const r2 = X.row();
      const pb = X.pad(r2, 'PLAY', C(10), () => {
        if (playing) { playing = false; X.clear(t); pb.firstChild.textContent = 'PLAY'; cells.forEach(c => c.classList.remove('now')); return; }
        playing = true; step = 0; pb.firstChild.textContent = 'STOP';
        t = X.every(() => {
          cells.forEach((c, i) => c.classList.toggle('now', i % 8 === step));
          rows.forEach((r, ri) => { if (on[ri].has(step)) X.S.tap('drums', r[1]); });
          step = (step + 1) % 8;
        }, 60000 / 110 / 2);
      }, 'LOOP IT');
      X.say('PRESS PLAY, THEN TAP SOME SQUARES WHILE IT GOES ROUND. CHANGE FOUR!', 'l-small');
    }
  },
  {
    title: 'MAKE A SONG!', inst: ['piano', 'flute', 'marimba', 'nylon', 'drums', 'bass', 'strings', 'musicbox'],
    build(st, X) {
      const L = X.L;
      X.say('NOW YOU KNOW EVERYTHING. LET US MAKE A SONG! FIRST PICK YOUR INSTRUMENT:');
      let inst = 'piano', style = 'pop', song = null, placed = 0, played = false;
      const grid = document.createElement('div');
      const NOTES = [[81, 'A', 13], [79, 'G', 11], [76, 'E', 10], [74, 'D', 14], [72, 'C', 12]];
      const build = () => {
        const old = song && song.tracks[0] ? song.tracks[0].notes : [];
        song = L.buildSong({ title: 'MY FIRST SONG', bpm: 100, key: 'C', scale: 'pentatonic', bars: 4, tracks: [{ name: 'MELODY', inst, notes: [], reverb: 0.25 }] });
        song.tracks[0].notes = old;
        L.accompany(song, style, 'pop').forEach(t => song.tracks.push(t));
      };
      const play = () => {
        X.stop(); build(); played = true;
        X.S.preload(song).then(() => { X.play(song, { loop: true }); });
      };
      const r1 = X.row();
      [['PIANO', 'piano', 11], ['FLUTE', 'flute', 10], ['MARIMBA', 'marimba', 14], ['GUITAR', 'nylon', 6], ['MUSIC BOX', 'musicbox', 13]].forEach(([n, id, c]) => X.pad(r1, n, C(c), () => {
        inst = id; X.tap(inst, 72, 0.7); if (song) song.tracks[0].inst = id;
      }, 'PICK'));
      X.say('NOW PICK A BAND:');
      const r2 = X.row();
      [['POP', 'pop'], ['LULLABY', 'lullaby'], ['ROCK', 'rock'], ['DANCE', 'dance']].forEach(([n, k], i) => X.pad(r2, n, C([12, 13, 9, 14][i]), () => { style = k; build(); play(); }, 'BAND'));
      X.say('NOW TAP THE SQUARES TO PUT NOTES IN. EACH COLUMN IS ONE BEAT. PRESS PLAY TO HEAR IT.');
      grid.className = 'l-grid';
      grid.style.gridTemplateColumns = '40px repeat(16, 34px)';
      NOTES.forEach(([m, n, c]) => {
        const lb = document.createElement('div'); lb.className = 'l-lbl'; lb.textContent = n; grid.appendChild(lb);
        for (let b = 0; b < 16; b++) {
          const cell = document.createElement('div');
          cell.className = 'l-cell'; cell.style.width = '34px'; cell.style.setProperty('--c', C(c));
          cell.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            if (!song) build();
            const nts = song.tracks[0].notes, i = nts.findIndex(x => x[0] === b && x[2] === m);
            if (i >= 0) { nts.splice(i, 1); placed--; } else { nts.push([b, 0.9, m, 0.85]); placed++; X.tap(inst, m, 0.6); }
            cell.classList.toggle('on', i < 0);
            if (placed >= 6 && played) X.done();
          });
          grid.appendChild(cell);
        }
      });
      st.appendChild(grid);
      const r3 = X.row();
      X.pad(r3, 'PLAY', C(10), () => play(), 'LOOP');
      X.pad(r3, 'STOP', C(12), () => X.stop(), '');
      X.pad(r3, 'KEEP MY SONG', C(14), () => {
        if (!song) build();
        X.api.ctx.ask('NAME YOUR SONG', 'MY FIRST SONG', async v => {
          v = (v || '').trim() || 'MY FIRST SONG';
          song.title = v.toUpperCase().slice(0, 24);
          const path = '::/Home/Songs/' + song.title.replace(/[^A-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') + '.SONG';
          await X.api.ctx.fs.write(path, { type: 'song', content: L.serialize(song) });
          window.dispatchEvent(new CustomEvent('vfs-changed', { detail: { dir: '::/Home/Songs' } }));
          X.api.ctx.toast('SAVED: ' + path);
          X.done();
        });
      }, 'SAVE IT');
      X.pad(r3, 'OPEN IN THE GARAGE', C(13), () => { if (!song) build(); X.stop(); X.hooks.load(JSON.parse(JSON.stringify(song))); X.api.ctx.toast('IT IS IN THE GARAGE NOW. KEEP GOING!'); document.querySelector('.g-lessons') && document.querySelector('.g-lessons').remove(); }, 'MAKE IT BIGGER');
    }
  }
];
