/* Everything Jesse can say in the shed, in one place: shed_lines.js (the room and the things in it) and shed_lines_play.js (the puzzle). `shedPool(tag)` is what the shed asks, and what
   `node apps/cook/shed_check.js` counts. */
import { HUB } from './shed_lines.js';
import { PLAY } from './shed_lines_play.js';

export const POOLS = Object.assign({}, HUB, PLAY);
export const shedPool = tag => POOLS[tag] || [];
export const SHED_TAGS = () => Object.keys(POOLS);
/* the pools that are read in order, a click at a time, rather than one picked at random */
export const IN_ORDER = ['hub_first', 'all', 'help'];
