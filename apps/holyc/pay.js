/* What HOLYC.EXE pays in SUN, once for each thing, never for a second go (scripts/check-sun.mjs holds it to the budget in docs/sun-economy.md).
   A lesson is paid when its last step is done; a puzzle when its last test passes, by its stars; a puzzle solved after the model answer has been looked at pays a
   quarter, because it was copied, and a chapter finished (every puzzle in it) pays a bonus. Everything here is a one-off: the lessons and puzzles are a ladder
   of about fifty problems and seven lessons, an afternoon and an evening of reading and typing, not a thing to farm. */
export const LESSON_SUN = 70;
export const STAR_SUN = { 1: 90, 2: 160, 3: 270, 4: 460 };
export const SEEN_SHARE = 0.25;
export const CHAPTER_SUN = 250;
export const puzzleSun = (stars, seen) => Math.round((STAR_SUN[stars] || 90) * (seen ? SEEN_SHARE : 1));
