/* HOLYC.EXE's trophies. The lessons and the puzzles are a ladder with an end, so HOLYC.EXE has a seal (MASTER OF HOLYC.EXE) for whoever reaches the top of it; the workshop's are about what
   was made: a program saved, one installed on the desktop as an app, one opened as an app, every starting point tried. (The terminal-side HolyC trophies, HELLO, TEMPLE and A FUNCTION OF YOUR OWN,
   are the machine's own: kernel/trophies_system.js.) Events: run, error, trace, save, install, play. Counters lessons, puzzles, chapters. Sets: own (puzzles solved with no look at the answer), templates,
   installed (programs put on the desktop), clean (puzzles solved first go with no hint). */
import { t, rule, stat, inSet } from '../trophy_kit.js';
import { PUZZLES, CHAPTERS } from './puzzles.js';
import { LESSONS } from './lessons.js';
import { TEMPLATES } from './templates.js';
const on = rule.on;

export const COUNTS = { lessons: LESSONS.length, puzzles: PUZZLES.length, chapters: CHAPTERS.length, templates: TEMPLATES.length };

export const TROPHIES = [
  t('hc_run', 'FIRST RUN', 'B', 'P', 'Run a program in the HOLYC.EXE lab.', on('run')),
  t('hc_lesson1', 'FIRST LESSON', 'B', 'P', 'Finish the first of the seven lessons.', rule.stat('lessons', 1)),
  t('hc_lesson4', 'HALFWAY TO A COMPILER', 'S', 'P', 'Finish four of the HOLYC.EXE lessons.', rule.stat('lessons', 4)),
  t('hc_lesson7', 'THE LESSONS ARE DONE', 'G', 'P', 'Finish all ' + COUNTS.lessons + ' lessons.', rule.stat('lessons', COUNTS.lessons)),
  t('hc_p1', 'FIRST PUZZLE', 'B', 'P', 'Solve a puzzle.', rule.stat('puzzles', 1)),
  t('hc_p10', 'TEN SOLVED', 'B', 'P', 'Solve ten puzzles.', rule.stat('puzzles', 10)),
  t('hc_p25', 'TWENTY-FIVE SOLVED', 'S', 'P', 'Solve twenty-five puzzles.', rule.stat('puzzles', 25)),
  t('hc_pall', 'EVERY PUZZLE', 'G', 'P', 'Solve all ' + COUNTS.puzzles + ' puzzles.', rule.stat('puzzles', COUNTS.puzzles)),
  t('hc_chapter', 'A CHAPTER CLOSED', 'S', 'P', 'Solve every puzzle in one chapter.', rule.stat('chapters', 1)),
  t('hc_chapters', 'EVERY CHAPTER', 'G', 'P', 'Solve every puzzle in all ' + COUNTS.chapters + ' chapters.', rule.stat('chapters', COUNTS.chapters)),
  t('hc_stars3', 'THREE STARS', 'S', 'S', 'Solve a three-star puzzle.', on('solved', p => p.stars >= 3)),
  t('hc_stars4', 'FOUR STARS', 'G', 'S', 'Solve a four-star puzzle.', on('solved', p => p.stars >= 4)),
  t('hc_clean', 'FIRST TRY', 'S', 'S', 'Solve a puzzle on your first run, without a hint.', on('solved', p => p.clean)),
  t('hc_own10', 'ON YOUR OWN', 'S', 'S', 'Solve ten puzzles without ever showing the answer.', rule.sets('own', 10)),
  t('hc_ownall', 'NOT ONCE', 'G', 'S', 'Solve every puzzle without ever showing the answer.', rule.sets('own', COUNTS.puzzles)),
  t('hc_save', 'KEPT', 'B', 'P', 'Save a program in the workshop.', on('save')),
  t('hc_install', 'AN APP OF YOUR OWN', 'B', 'C', 'Install a program on the desktop as an app.', on('install')),
  t('hc_ship3', 'A SMALL CATALOGUE', 'S', 'C', 'Install three different programs on the desktop.', rule.sets('installed', 3)),
  t('hc_play', 'DOUBLE-CLICK', 'B', 'E', 'Open one of your installed apps from its desktop icon.', on('play')),
  t('hc_templates', 'EVERY STARTING POINT', 'S', 'E', 'Start from each of the ' + COUNTS.templates + ' templates in the workshop.', rule.sets('templates', COUNTS.templates)),
  t('hc_trace', 'WATCH IT RUN', 'B', 'E', 'Run a program with WATCH and step through what it did.', on('trace')),
  t('hc_error', 'THE COMPILER SAYS NO', 'B', 'J', 'Run a program that fails and read what the compiler says about it.', on('error'))
];

/* what the lab's own save already holds (this window's key: app_holyc_progress) */
export function backfill(read) {
  const p = read('app_holyc_progress'), ids = [];
  if (!p || typeof p !== 'object') return ids;
  const les = Object.keys(p.lessons || {}).filter(k => (p.lessons[k].paid)).length;
  const solved = Object.keys(p.puzzles || {}).filter(k => p.puzzles[k].solved);
  const own = solved.filter(k => !p.puzzles[k].seen);
  if (les >= 1) ids.push('hc_lesson1'); if (les >= 4) ids.push('hc_lesson4'); if (les >= COUNTS.lessons) ids.push('hc_lesson7');
  if (solved.length >= 1) ids.push('hc_p1'); if (solved.length >= 10) ids.push('hc_p10'); if (solved.length >= 25) ids.push('hc_p25'); if (solved.length >= COUNTS.puzzles) ids.push('hc_pall');
  own.forEach(k => ids.push(inSet('holyc', 'own', k)));
  if (own.length >= 10) ids.push('hc_own10'); if (own.length >= COUNTS.puzzles) ids.push('hc_ownall');
  const chapters = CHAPTERS.filter(c => c.list.every(x => p.puzzles && p.puzzles[x.id] && p.puzzles[x.id].solved)).length;
  if (chapters >= 1) ids.push('hc_chapter'); if (chapters >= COUNTS.chapters) ids.push('hc_chapters');
  ids.push(stat('holyc', 'lessons', les), stat('holyc', 'puzzles', solved.length), stat('holyc', 'chapters', chapters));
  return ids;
}
