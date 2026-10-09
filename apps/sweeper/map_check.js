/* node apps/sweeper/map_check.js -- the map cannot be crashed by its two tabs (pure Node).
   A click on THE DESCENT or on LOCKED used to become the map's selection ("page:1"), which is not a room, so the card under the map
   read `.region` of nothing on every frame from then on and the window stopped drawing. This clicks every tab in every state of the
   save and draws after each click and each key, with a canvas that records nothing. */
import { createMap } from './map.js';
import { NODES, START, FINAL } from './data.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const G = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : (...a) => (k === 'bmp' ? 0 : undefined)), apply: () => undefined });
const snd = new Proxy({}, { get: () => () => {} });
const cleared = ids => { const c = {}; ids.forEach(id => { c[id] = 10; }); return c; };
const real = M => !!M.sel && (M.sel.indexOf('bench:') === 0 || !!NODES[M.sel]);

[['a fresh save', {}], ['the Hollow One down (the Underdeep open)', { cleared: cleared(['cross', 'hollow']) }]].forEach(([label, o]) => {
  const camp = Object.assign(JSON.parse(JSON.stringify(START)), o);
  const opened = [];
  const M = createMap({ camp, snd, openRoom: nd => opened.push(nd.id), openBench: rid => opened.push('bench:' + rid) });
  const drew = (when) => { try { M.draw(G, 1000); ok(real(M), label + ': ' + when + ' leaves the selection on a room or a bench (' + M.sel + ')'); } catch (e) { ok(false, label + ': ' + when + ' made the map throw: ' + e.message); } };
  drew('opening');
  const tab = pg => M.hits.find(h => h.id === 'page:' + pg);
  ['page:1', 'page:2', 'page:1', 'page:1', 'page:2', 'page:2', 'page:1'].forEach(id => {
    const h = M.hits.find(q => q.id === id);
    ok(!!h, label + ': the tab ' + id + ' is on the map');
    if (!h) return;
    M.mouse('move', {}, h.x + 4, h.y + 4); drew('hovering ' + id);
    M.mouse('down', { button: 0 }, h.x + 4, h.y + 4); drew('clicking ' + id);
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'ArrowDown'].forEach(k => { try { M.key({ key: k }); } catch (e) { ok(false, label + ': ' + k + ' after ' + id + ' threw: ' + e.message); } drew(k + ' after ' + id); });
  });
  ok(opened.length === 0, label + ': a tab never opens a room (' + opened + ')');
  /* a room is still a room */
  const room = M.hits.find(q => q.id.indexOf('page:') !== 0 && !q.id.startsWith('bench:') && NODES[q.id] && (NODES[q.id].req || []).every(r => camp.cleared[r] != null));
  if (room) { M.mouse('down', { button: 0 }, room.x + 3, room.y + 3); ok(opened[0] === room.id, label + ': clicking ' + room.id + ' opens it'); }
});
ok(FINAL === 'hollow', 'the Hollow One opens the Underdeep');

console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
