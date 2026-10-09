import { defragDone } from '../tools/trophy_calls.js';
import { fs as vfs } from '../../kernel/vfs.js';
import { clustersOf, scatter, plan, fragmented, swapCells } from './model.js';

/* DEFRAG ::  The disk it shows is the machine's own: every file on the VFS is laid down in clusters in proportion to its size, scattered in pieces the way a used
   disk is (apps/defrag/model.js), and DEFRAG puts each file back in one piece by swapping clusters, one read and one write at a time. RESET reads the disk again
   and scatters it afresh, so a file you saved a minute ago is in it. The bad blocks do not move. */
const COLS = 40, ROWS = 14, N = COLS * ROWS;
const INK = ['#AAAAAA', '#00AAAA', '#AA00AA', '#AA5500', '#55FFFF', '#FF55FF', '#5555FF', '#FFFFFF'];
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const sizeOf = v => (v && typeof v.content === 'string' ? v.content.length : v && typeof v.src === 'string' ? v.src.length : 64) + 48;
let stopAll = null;

export default {
  id: 'defrag',
  title: 'Defrag ::',
  icon: '',
  width: 520,
  height: 420,
  resizable: true,

  mount(root) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'apps/defrag/style.css'; root.appendChild(css);
    const pane = document.createElement('div'); pane.className = 'defragpane';
    const grid = document.createElement('div'); grid.className = 'defraggrid';
    const legend = document.createElement('div'); legend.className = 'defraglegend';
    legend.innerHTML = '<span><i class="db free"></i> Unused</span><span><i class="db used"></i> Used (by folder)</span><span><i class="db read"></i> Reading</span><span><i class="db writ"></i> Writing</span><span><i class="db bad"></i> Bad</span>';
    const status = document.createElement('div'); status.className = 'defragstatus';
    const prog = document.createElement('div'); prog.className = 'defragprog'; const fill = document.createElement('i'); prog.appendChild(fill);
    pane.append(grid, legend, prog, status); root.appendChild(pane);
    const bar = document.createElement('div'); bar.className = 'appbar';
    const mk = t => { const b = document.createElement('button'); b.className = 'appbtn'; b.textContent = t; bar.appendChild(b); return b; };
    const bGo = mk('DEFRAGMENT'), bAn = mk('ANALYZE'), bReset = mk('RESET'), bSpeed = mk('SPEED: NORMAL');
    root.appendChild(bar);

    const el = [], groups = {};
    for (let i = 0; i < N; i++) { const d = document.createElement('i'); d.className = 'db free'; grid.appendChild(d); el.push(d); }
    let files = [], cells = [], moves = [], at = 0, timer = null, done = false, moved = 0, startFrag = 0, hot = [], speed = 1, alive = true, loading = false;
    const SPEEDS = [['SLOW', 1, 160], ['NORMAL', 3, 90], ['FAST', 12, 50]];
    const say = t => { status.textContent = t; };
    const paint = i => {
      const c = cells[i], d = el[i];
      d.className = 'db ' + (c ? (c.bad ? 'bad' : 'used') : 'free');
      d.style.background = c && !c.bad ? INK[(groups[files[c.f].name.split('/')[1] || ''] || 0) % INK.length] : '';
      d.title = c && !c.bad ? files[c.f].name + '  (cluster ' + (c.k + 1) + ' of ' + files[c.f].clusters + ')' : c ? 'BAD CLUSTER' : '';
    };
    const paintAll = () => { for (let i = 0; i < N; i++) paint(i); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; bGo.textContent = done ? 'DEFRAGMENT' : (at > 0 ? 'RESUME' : 'DEFRAGMENT'); };
    const pct = () => (moves.length ? Math.round(at / moves.length * 100) : 100);
    const bump = () => { fill.style.width = (done ? 100 : pct()) + '%'; };

    async function load(seed) {
      if (loading) return; loading = true; stop(); say('READING THE DISK...');
      let ents = []; try { ents = await vfs.entries('::'); } catch (e) { ents = []; }
      if (!alive) return;
      let list = ents.filter(([k]) => !/\/\.keep$/.test(k)).map(([k, v]) => ({ name: k, bytes: sizeOf(v) })).sort((a, b) => (a.name < b.name ? -1 : 1));
      if (list.length > 240) { const rest = list.splice(240); list.push({ name: '::/' + rest.length + ' MORE FILES', bytes: rest.reduce((a, f) => a + f.bytes, 0) }); }
      if (!list.length) list = [{ name: '::/(EMPTY)', bytes: 64 }];
      files = clustersOf(list, N, 24);
      Object.keys(groups).forEach(k => delete groups[k]);
      files.forEach(f => { const g = f.name.split('/')[1] || ''; if (!(g in groups)) groups[g] = Object.keys(groups).length; });
      cells = scatter(files, N, seeded(seed));
      moves = plan(cells, files); at = 0; moved = 0; done = false; hot = [];
      startFrag = fragmented(cells, files);
      paintAll(); bump(); loading = false; bGo.textContent = 'DEFRAGMENT';
      say(files.length + ' FILES, ' + files.reduce((a, f) => a + f.clusters, 0) + ' CLUSTERS. ' + startFrag + ' FILES ARE IN PIECES.');
    }

    function finish() {
      done = true; stop(); hot.forEach(paint); hot = []; bump();
      say('DEFRAGMENTATION COMPLETE. 100% — ' + files.length + ' FILES, ' + startFrag + ' WERE IN PIECES, ' + moved + ' CLUSTERS MOVED. THE DISK IS AT PEACE.');
      defragDone();
      if (window.Snd) window.Snd.bell();
    }
    function tick() {
      hot.forEach(paint); hot = [];
      for (let k = 0; k < speed; k++) {
        if (at >= moves.length) { finish(); return; }
        const [a, b] = moves[at++];
        const c = cells[a];
        swapCells(cells, a, b); moved++;
        paint(a); paint(b);
        el[a].className = 'db read'; el[b].className = 'db writ'; hot.push(a, b);
        if (c && !c.bad) say('MOVING  ' + files[c.f].name + '   CLUSTER ' + (c.k + 1) + ' OF ' + files[c.f].clusters + '   ' + pct() + '%');
        if (moved % 9 === 0 && window.Snd) window.Snd.type();
      }
      bump();
      if (at >= moves.length) { hot.forEach(paint); finish(); }
    }
    bGo.addEventListener('click', () => {
      if (loading) return;
      if (timer) { stop(); say('PAUSED AT ' + pct() + '%.'); return; }
      if (!moves.length || done) { done = true; bump(); say('NOTHING TO MOVE. THE DISK WAS ALREADY AT PEACE.'); return; }
      bGo.textContent = 'PAUSE'; timer = setInterval(tick, SPEEDS[speed][2]);
    });
    bAn.addEventListener('click', () => {
      if (loading) return;
      const f = fragmented(cells, files), used = cells.filter(c => c && !c.bad).length, badN = cells.filter(c => c && c.bad).length;
      say('ANALYSIS: ' + files.length + ' FILES, ' + used + ' CLUSTERS USED, ' + badN + ' BAD, ' + f + ' FILES IN PIECES (' + Math.round(f / Math.max(1, files.length) * 100) + '% FRAGMENTED). ' + (moves.length - at) + ' MOVES TO GO.');
    });
    bReset.addEventListener('click', () => { load(Date.now() & 0xffffff); });
    bSpeed.addEventListener('click', () => {
      speed = (speed + 1) % SPEEDS.length; bSpeed.textContent = 'SPEED: ' + SPEEDS[speed][0];
      if (timer) { clearInterval(timer); timer = setInterval(tick, SPEEDS[speed][2]); }
    });

    stopAll = () => { alive = false; if (timer) clearInterval(timer); timer = null; };
    load(1994);
  },

  unmount() { if (stopAll) stopAll(); stopAll = null; }
};
