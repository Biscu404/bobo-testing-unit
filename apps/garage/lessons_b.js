/* Lessons five to eight: major and minor, chords, loops, and a track of your own. */
import { HEX } from './model.js';

const C = i => HEX[i];

export const LESSONS_B = [
  {
    title: 'MAJOR AND MINOR', inst: ['piano', 'strings'],
    build(st, X) {
      X.say('One note decides whether something sounds bright or dark. Hear the same phrase both ways.');
      const L = X.L;
      const tune = minor => L.buildSong({ bpm: 96, bars: 2, key: 'C', scale: minor ? 'minor' : 'major', tracks: [
        { name: 'T', inst: 'piano', reverb: 0.3, notes: minor ? 'C4:q Eb4 G4 C5 | G4 Eb4 C4:h' : 'C4:q E4 G4 C5 | G4 E4 C4:h' },
        { name: 'S', inst: 'strings', vol: 0.5, reverb: 0.4, notes: minor ? 'C3+Eb3+G3:w C3+Eb3+G3:w' : 'C3+E3+G3:w C3+E3+G3:w' }] });
      const r = X.row();
      X.pad(r, 'MAJOR', C(14), () => X.play(tune(false), { loop: false }), 'BRIGHT');
      X.pad(r, 'MINOR', C(9), () => X.play(tune(true), { loop: false }), 'DARK');
      X.say('Strip it back to three notes. Only the middle one moves, a semitone down:');
      const r2 = X.row();
      const chord = ns => ns.forEach(n => X.tap('piano', n, 1.6));
      X.pad(r2, 'C  E  G', C(14), () => chord([60, 64, 67]), 'MAJOR THIRD');
      X.pad(r2, 'C  Eb  G', C(9), () => chord([60, 63, 67]), 'MINOR THIRD');
      X.say('Now call it. Major or minor? Three in a row.');
      const dots = X.dots(3);
      let want = null, won = 0;
      const r3 = X.row();
      X.pad(r3, 'LISTEN', C(10), () => { want = X.rand(2); X.play(tune(!!want), { loop: false }); }, 'ONE PHRASE');
      const ans = w => () => {
        if (want == null) { X.ok('Hit LISTEN first.'); return; }
        if (w === want) { won++; dots.set(won); X.ok('Right.'); if (won >= 3) X.done(); } else { won = 0; dots.set(0); X.ok('Not that time. Listen again.'); }
        want = null;
      };
      X.pad(r3, 'MAJOR', C(14), ans(0));
      X.pad(r3, 'MINOR', C(9), ans(1));
    }
  },
  {
    title: 'CHORDS', inst: ['piano', 'strings'],
    build(st, X) {
      X.say('A chord is notes sounding together. Build the simplest one, C major, from three notes:');
      const stack = new Set();
      const stackEl = X.say('', 'l-stack');
      const r = X.row();
      [['C', 60, 12], ['E', 64, 10], ['G', 67, 11]].forEach(([n, m, c]) => X.pad(r, n, C(c), () => {
        X.tap('piano', m, 0.7); stack.add(n);
        stackEl.textContent = [...stack].join(' + ') + (stack.size === 3 ? '   all at once:' : '');
        if (stack.size === 3) X.later(() => [60, 64, 67].forEach(x => X.tap('piano', x, 1.8)), 900);
      }, 'NOTE'));
      X.say('Now four chords that cover most of pop. C is home; the others pull away from it and back.');
      const heard = new Set(), dots = X.dots(4);
      const r2 = X.row();
      [['C', 'HOME (I)', ['C']], ['F', 'LIFT (IV)', ['F']], ['G', 'TENSION (V)', ['G']], ['Am', 'SHADE (vi)', ['Am']]].forEach(([n, sub, c], i) => X.pad(r2, n, C([14, 11, 13, 9][i]), () => {
        X.L.chordNotes(n, 55).forEach(m => X.tap('strings', m, 1.8));
        X.L.chordNotes(n, 43).slice(0, 1).forEach(m => X.tap('upright', m, 1.4));
        heard.add(n); dots.set(heard.size); if (heard.size >= 4) X.done();
      }, sub));
      X.say('Try C, F, G, C. That last move, tension back to home, is the sound of a phrase finishing.', 'l-small');
    }
  },
  {
    title: 'LOOPS', inst: ['drums'],
    build(st, X) {
      X.say('Most tracks are a short pattern on repeat. Click the cells to build a one-bar drum loop.');
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
      }, '110 BPM');
      X.say('Press play, then change four cells while it goes round.', 'l-small');
    }
  },
  {
    title: 'YOUR FIRST TRACK', inst: ['piano', 'flute', 'marimba', 'nylon', 'drums', 'bass', 'strings', 'musicbox'],
    build(st, X) {
      const L = X.L;
      X.say('Put it together. Pick a lead sound:');
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
      const r1 = X.row(), leads = X.radio();
      [['PIANO', 'piano', 11], ['FLUTE', 'flute', 10], ['MARIMBA', 'marimba', 14], ['GUITAR', 'nylon', 6], ['MUSIC BOX', 'musicbox', 13]].forEach(([n, id, c]) => {
        const b = X.pad(r1, n, C(c), () => {
          inst = id; X.tap(inst, 72, 0.7); if (song) song.tracks[0].inst = id; leads.pick(b);
        }, 'LEAD');
        leads.add(b, id === inst);
      });
      X.say('Pick a backing band (it plays in the key, so it always fits):');
      const r2 = X.row(), bands = X.radio();
      [['POP', 'pop'], ['SOFT', 'lullaby'], ['ROCK', 'rock'], ['DANCE', 'dance']].forEach(([n, k], i) => {
        const b = X.pad(r2, n, C([12, 13, 9, 14][i]), () => { style = k; build(); play(); bands.pick(b); }, 'BAND');
        bands.add(b, k === style);
      });
      X.say('Click the grid to write a melody. Each column is one beat and four columns make a bar, so the grid is the whole four bars. Place at least six, with it playing, and watch the yellow line: it is where the music is.');
      grid.className = 'l-grid';
      grid.style.gridTemplateColumns = '40px repeat(16, 34px)';
      const cols = [];                                        /* the cells of each column, so the line can light the one it is on */
      for (let b = 0; b < 16; b++) cols.push([]);
      NOTES.forEach(([m, n, c]) => {
        const lb = document.createElement('div'); lb.className = 'l-lbl'; lb.textContent = n; grid.appendChild(lb);
        for (let b = 0; b < 16; b++) {
          const cell = document.createElement('div');
          cell.className = 'l-cell'; cell.style.width = '34px'; cell.style.setProperty('--c', C(c));
          cols[b].push(cell);
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
      /* the line that follows the music: a bar of light over the grid at the beat the player is on, the column it is in lit,
         and any note in that column pressed in. It is read off the player's own clock, so it is where you hear it. */
      const gwrap = document.createElement('div'); gwrap.className = 'l-gridwrap';
      const head = document.createElement('div'); head.className = 'l-playhead'; head.style.display = 'none';
      const readout = document.createElement('div'); readout.className = 'l-beatread'; readout.textContent = '';
      gwrap.append(grid, head);
      st.append(gwrap, readout);
      let litCol = -1;
      const light = k => {
        if (k === litCol) return;
        if (litCol >= 0) cols[litCol].forEach(c => c.classList.remove('now', 'strike'));
        litCol = k;
        if (k >= 0) cols[k].forEach(c => { c.classList.add('now'); if (c.classList.contains('on')) c.classList.add('strike'); });
      };
      X.every(() => {
        const beat = X.pos(), len = song ? song.bars * (song.beats || 4) : 16;
        if (beat < 0) { head.style.display = 'none'; readout.textContent = ''; light(-1); return; }
        const b = ((beat % len) + len) % len;
        const a = cols[0][0], z = cols[1][0], pitch = z.offsetLeft - a.offsetLeft;
        head.style.display = '';
        head.style.left = Math.round(a.offsetLeft + b * pitch - 1) + 'px';
        head.style.top = (a.offsetTop - 4) + 'px';
        head.style.height = (cols[0][NOTES.length - 1].offsetTop + cols[0][NOTES.length - 1].offsetHeight - a.offsetTop + 8) + 'px';
        light(Math.min(15, Math.floor(b)));
        readout.textContent = 'BAR ' + (Math.floor(b / 4) + 1) + '  BEAT ' + (Math.floor(b % 4) + 1);
      }, 33);
      const r3 = X.row();
      X.pad(r3, 'PLAY', C(10), () => play(), 'LOOPS');
      X.pad(r3, 'STOP', C(12), () => X.stop(), '');
      X.pad(r3, 'SAVE IT', C(14), () => {
        if (!song) build();
        X.api.ctx.ask('NAME YOUR TRACK', 'MY FIRST SONG', async v => {
          v = (v || '').trim() || 'MY FIRST SONG';
          song.title = v.toUpperCase().slice(0, 24);
          const path = '::/Home/Songs/' + song.title.replace(/[^A-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') + '.SONG';
          await X.api.ctx.fs.write(path, { type: 'song', content: L.serialize(song) });
          window.dispatchEvent(new CustomEvent('vfs-changed', { detail: { dir: '::/Home/Songs' } }));
          X.api.ctx.toast('SAVED: ' + path);
          X.done();
        });
      }, 'HOME/SONGS');
      X.say('When you are ready for the whole studio, the STUDIO COURSE (the pink button next to LEARN) teaches every control of the Garage and then helps you write a song in any style you like.', 'l-small');
      X.pad(r3, 'OPEN IT', C(13), () => { if (!song) build(); X.stop(); X.hooks.load(JSON.parse(JSON.stringify(song))); X.api.ctx.toast('IT IS IN THE GARAGE NOW. KEEP GOING.'); document.querySelector('.g-lessons') && document.querySelector('.g-lessons').remove(); }, 'IN THE GARAGE');
    }
  }
];
