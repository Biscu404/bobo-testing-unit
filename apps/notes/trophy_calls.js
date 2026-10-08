/* Where NOTES tells the trophies what happened (the list is trophies.js). The vault is looked at when somebody has written something (the same half-second the page is saved in) and
   only a change in its shape is told. None of it can throw into the app. */
import { trophies } from '../trophy_scope.js';
import { facts } from './links.js';

const TR = trophies('notes');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export function createCalls() {
  let sig = '', graphT = 0, promises = 0;
  return {
    /* a note was typed in. `fromLink` is true for a page made by clicking a red link (it was a promise) */
    written(notes, note) {
      guard(() => {
        const len = String(note.body || '').replace(/\s+/g, ' ').trim().length;
        TR.emit('write', { len: len });
        const f = facts(notes);
        if (f.promises > 0) TR.emit('promise', {});
        if (note.fromLink && len >= 40) TR.emit('kept', {});
        const shape = { web: f.web, ring: f.ring, hub: f.hub, joined: f.joined, notes: f.notes };
        const now = JSON.stringify(shape);
        if (now !== sig) { sig = now; TR.emit('shape', shape); }
        promises = f.promises;
      });
    },
    backlinks: n => guard(() => { if (n >= 3) TR.emit('backlinks', { n: n }); }),
    /* the graph is open: it counts once it has been looked at for a moment */
    graph(on) { guard(() => { clearTimeout(graphT); if (on) graphT = setTimeout(() => TR.emit('graph-open', {}), 3000); }); },
    stop() { clearTimeout(graphT); }
  };
}
