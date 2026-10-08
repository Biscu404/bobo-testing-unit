/* The first time the ledger loads: what a person already did, found in the saves they already have, awarded silently and in one go (no SUN, because the SUN those games paid at the time
   was paid; no fanfare), with one card: THE MACHINE REMEMBERED N THINGS YOU ALREADY DID. Every reader is wrapped, so a save in a shape it does not expect costs nothing. Each app's own
   reader lives in its apps/<id>/trophies.js as `backfill(read)`, handed a function that returns a parsed localStorage key (or null). */
import { BACKFILL } from './trophies_defs.js';

export const BACKFILL_VERSION = 1;
const read = key => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };

export function backfill(T) {
  if ((T.st.seen.backfilled || 0) >= BACKFILL_VERSION) return 0;
  const ids = [];
  BACKFILL.forEach(f => { try { (f(read, T) || []).forEach(id => ids.push(id)); } catch (e) { /* somebody else's save */ } });
  const seeds = ids.filter(id => String(id).indexOf('stat:') === 0), n = T.backfill(ids.filter(id => String(id).indexOf('stat:') !== 0));
  seeds.forEach(sd => { const p = sd.split(':'); T.seed(p[1], p[2], +p[3]); });
  T.st.seen.backfilled = BACKFILL_VERSION; T.save();
  return n;
}
