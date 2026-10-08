/* THE BASICS: seven lessons, thirty-odd steps. The lessons are in lessons_a.js and lessons_b.js; this is the one place that joins them. */
import { LESSONS_A } from './lessons_a.js';
import { LESSONS_B } from './lessons_b.js';

export const LESSONS = [].concat(LESSONS_A, LESSONS_B);
export const lessonById = id => LESSONS.find(l => l.id === id) || null;
export const stepCount = () => LESSONS.reduce((n, l) => n + l.steps.length, 0);
/* the code a step begins with: its own `start`, or whatever the step before it ended on */
export function startOf(lesson, i) {
  const st = lesson.steps[i];
  if (st.start !== undefined) return st.start;
  const prev = lesson.steps[i - 1];
  if (!prev) return '';
  return prev.runs ? prev.runs[prev.runs.length - 1].code : prev.model;
}
export const modelOf = st => st.runs ? st.runs[st.runs.length - 1].code : st.model;
