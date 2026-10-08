/* NOTES' trophies (docs/achievements/toys.md). A vault of pages that point at each other: the trophies are about what somebody built, and the shapes they asked for are pure functions of the
   notes (links.js). Events: write { len }, promise, kept, backlinks { n }, graph-open, shape { web, ring, hub, joined }. */
import { t, rule } from '../trophy_kit.js';
const on = rule.on;

export const TROPHIES = [
  t('nt_first', 'DEAR DIARY', 'B', 'P', 'Write a note.', on('write', p => p.len >= 20)),
  t('nt_promise', 'A PROMISE', 'B', 'E', 'Link to a note that does not exist yet.', on('promise')),
  t('nt_kept', 'PROMISE KEPT', 'B', 'C', 'Write the note that a red link was waiting for.', on('kept')),
  t('nt_back', 'WHO POINTS HERE', 'B', 'E', 'Open a note that three or more others link to, and see its BACKLINKS.', on('backlinks', p => p.n >= 3)),
  t('nt_graph', 'FROM ABOVE', 'B', 'E', 'Open the GRAPH and let it settle.', on('graph-open')),
  t('nt_web', 'A SMALL WEB', 'S', 'P', 'Have ten notes joined by at least fifteen links.', on('shape', p => p.web.notes >= 10 && p.web.links >= 15)),
  t('nt_ring', 'A CLOSED CIRCLE', 'S', 'C', 'Link three notes in a ring: A to B to C and back to A.', on('shape', p => p.ring)),
  t('nt_hub', 'THE HUB', 'S', 'C', 'Have one note that eight others link to.', on('shape', p => p.hub >= 8)),
  t('nt_orphans', 'NO ORPHANS', 'S', 'S', 'Have at least eight notes where every one is linked to or from another.', on('shape', p => p.notes >= 8 && p.joined))
];
export function backfill() { return []; }
