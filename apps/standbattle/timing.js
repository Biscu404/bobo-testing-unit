/* How long the parts of the game that are not a fight take, in seconds (spec 17). The screens use them to run themselves and the budget bot adds them up, so the figure the
   bot reports and the time a screen really takes are the same number. A player who skips a screen takes less; the budget counts the screens whole. */
export const TIMING = {
  VS_SECS: 4,              /* the versus screen between fights (a confirm after 1.5 s skips it) */
  VS_SKIP_SECS: 1.5,
  RESULT_SECS: 3,          /* the match result panel after the last round */
  CONTINUE_SECS: 10,       /* the continue countdown */
  CONTINUE_TAKEN: 2,       /* a player who continues presses it about two seconds in */
  CLEAR_SECS: 12,          /* the ladder-clear screen: score, time, the ending card */
  INITIALS_SECS: 25,       /* three letters on a keyboard */
  MENU_SECS: 6,            /* a pass through the main menu to a mode */
  SELECT_SECS: 14,         /* picking a fighter, once */
  TITLE_SECS: 8            /* the title before START */
};
