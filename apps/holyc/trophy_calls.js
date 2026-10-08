/* Where HOLYC.EXE tells the trophies what happened (the list is trophies.js): a program run, a lesson finished, a puzzle solved, a program saved or installed or opened as an app. The
   progress the lab keeps (progress.js) is the source of every count. None of it can throw into the lab. */
import { trophies } from '../trophy_scope.js';
import { PUZZLES, CHAPTERS } from './puzzles.js';
import { LESSONS } from './lessons.js';

const TR = trophies('holyc');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export const ran = err => guard(() => { TR.emit('run', {}); if (err) TR.emit('error', {}); });
export const traced = () => guard(() => TR.emit('trace', {}));
export const lessonDone = P => guard(() => TR.max('lessons', LESSONS.filter(l => P.lessonComplete(l)).length));
/* a puzzle was solved: `info` is what the tutor knows of this go (the hints shown, the runs it took, whether the answer was looked at) */
export const solved = (P, p, info) => guard(() => {
  TR.max('puzzles', PUZZLES.filter(x => P.solved(x.id)).length);
  TR.max('chapters', CHAPTERS.filter(c => c.list.every(x => P.solved(x.id))).length);
  if (!info.seen) TR.mark('own', p.id);
  TR.emit('solved', { stars: p.stars, clean: info.tries === 1 && info.hints === 0 && !info.seen });
});
export const saved = () => guard(() => TR.emit('save', {}));
export const installed = name => guard(() => { TR.mark('installed', String(name).toLowerCase()); TR.emit('install', {}); });
export const played = () => guard(() => TR.emit('play', {}));
export const template = name => guard(() => TR.mark('templates', name));
