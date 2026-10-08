/* Where the small tools tell the trophies what happened (the list is trophies.js): the oracle (kernel/holyc.js and the terminal ask), DEFRAG, TASKS and CMOS. Nothing here can throw into
   the tool. */
import { trophies } from '../trophy_scope.js';

const TR = trophies('tools');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export const word = n => guard(() => { TR.mark('oracle', 'word'); TR.emit('word', { n: n }); });
export const doodle = () => guard(() => TR.mark('oracle', 'doodle'));
export const song = () => guard(() => TR.mark('oracle', 'song'));
export const defragDone = () => guard(() => TR.emit('defrag-done', {}));
export const killed = () => guard(() => TR.emit('kill', { adam: false }));
export const tried = who => guard(() => TR.mark('firstborn', who));
export const cmosF10 = () => guard(() => TR.emit('cmos-f10', {}));
