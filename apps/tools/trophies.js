/* THE SMALL TOOLS' trophies (docs/achievements/toys.md): the oracle (GodWord, GodDoodle, GodSong), DEFRAG, TASKS and CMOS. There is no window called "tools"; these are six small things that
   are worth doing once, each earned by what the tool itself does. Events: word { n }, defrag-done, kill { adam }, cmos-f10. Set oracle (a word, a drawing and a song). */
import { t, secret, rule } from '../trophy_kit.js';
const on = rule.on;

export const TROPHIES = [
  t('tl_oracle', 'THE ORACLE SPEAKS', 'B', 'E', 'Ask God for a word, a drawing and a song, all three.', rule.sets('oracle', 3)),
  t('tl_seven', 'SEVEN WORDS', 'B', 'E', 'Ask for seven words at once: GodWord(7), or GODWORD 7 in the terminal.', on('word', p => p.n === 7)),
  t('tl_defrag', 'EVERYTHING IN ORDER', 'B', 'P', 'Let DEFRAG run to the end.', on('defrag-done')),
  t('tl_kill', 'END TASK', 'B', 'E', 'Kill a window from TASKS.', on('kill', p => !p.adam)),
  secret('tl_adam', 'ADAM CANNOT BE KILLED', 'B', 'J', 'Two tasks at the top of the list were here before anything else.', 'Try to end Adam and Seth.', rule.sets('firstborn', 2)),
  secret('tl_readonly', 'SAVE AND EXIT', 'B', 'J', 'The footer of an old BIOS screen makes a promise about a key.', 'Press F10 in CMOS.', on('cmos-f10'))
];
export function backfill() { return []; }
