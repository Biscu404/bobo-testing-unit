/* THE GARAGE — which instruments are Dave's. The first thirty (and the kit) have always been here; the packs he sells
   (kernel/cos_data.js GARAGE) add more, and the picker lists every instrument but only lets you put a bought one on a track.
   A song that already uses one it has no pack for still plays: owning is about picking, not about listening. */
import { GARAGE } from '../../kernel/cos_data.js';

export const packOf = id => GARAGE.find(p => p.inst.indexOf(id) >= 0) || null;
export const owns = id => { const p = packOf(id); return !p || !window.Cos || window.Cos.has('garage', p.id); };
