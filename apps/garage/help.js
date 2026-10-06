/* The cheat sheet (F1 or the ? button): every key, and the few ideas that make the rest obvious. */
import { el, btn, modal } from './ui.js';

const SECTIONS = [
  ['PLAYING', [['SPACE', 'PLAY / STOP, FROM THE YELLOW CURSOR'], ['HOME', 'BACK TO THE START'], ['CTRL+L', 'LOOP ON/OFF (THE PICKED STRETCH, OR THE WHOLE SONG)'], ['M', 'CLICK TRACK ON/OFF'],
    ['A S D F G H J K L', 'THE WHITE KEYS (W E T Y U O P ARE THE BLACK ONES)'], ['Z  X', 'OCTAVE DOWN / UP']]],
  ['TOOLS', [['1  2  3', 'DRAW, SELECT, ERASE'], ['RIGHT BUTTON', 'ERASE, IN ANY TOOL'], ['SHIFT + CLICK', 'ADD TO / TAKE FROM THE SELECTION'], ['CTRL + DRAG A NOTE', 'COPY IT WHILE YOU MOVE IT'],
    ['DRAG A NOTE\'S RIGHT END', 'MAKE IT LONGER OR SHORTER']]],
  ['EDITING', [['CTRL+Z / CTRL+Y', 'UNDO / REDO (EIGHTY STEPS)'], ['CTRL+C / X / V', 'COPY / CUT / PASTE AT THE CURSOR'], ['CTRL+D', 'DUPLICATE: COPY IT STRAIGHT AFTER ITSELF'], ['CTRL+A', 'SELECT EVERY NOTE IN THE TRACK'],
    ['DELETE', 'DELETE (SHIFT: AND CLOSE THE GAP, FOR A PICKED STRETCH)'], ['ARROWS', 'LEFT/RIGHT NUDGE BY ONE GRID STEP; UP/DOWN A SEMITONE (SHIFT: AN OCTAVE)'],
    ['[  ]', 'SHORTER / LONGER BY ONE GRID STEP'], ['Q', 'QUANTIZE: SNAP TO THE GRID'], ['ESC', 'LET GO OF THE SELECTION']]],
  ['THE SONG', [['DRAG ON THE RULER', 'PICK A STRETCH OF TIME, ACROSS EVERY TRACK'], ['CLICK THE RULER', 'PUT THE YELLOW CURSOR THERE: PLAY AND PASTE START FROM IT'], ['DOUBLE-CLICK THE RULER', 'PICK THAT WHOLE BAR'],
    ['DRAG ITS EDGES', 'RESIZE THE PICKED STRETCH'], ['CTRL+WHEEL', 'ZOOM IN TIME (SHIFT TOO: THE HEIGHT OF THE ROWS)'], ['SHIFT+WHEEL', 'SCROLL SIDEWAYS'], ['TAB', 'KEYS / MIXER'], ['CTRL+S', 'SAVE']]]
];

export function openHelp(root) {
  const m = modal(root, 'KEYS AND TIPS', 'g-help');
  SECTIONS.forEach(([h, rows]) => {
    m.body.appendChild(el('div', 'g-famhead', h));
    const t = el('div', 'g-keytable');
    rows.forEach(([k, d]) => { t.append(el('b', '', k), el('span', '', d)); });
    m.body.appendChild(t);
  });
  m.body.appendChild(el('div', 'g-p g-dim', 'NOTHING HERE IS PERMANENT UNTIL YOU SAVE, AND EVERYTHING BEFORE THAT CAN BE UNDONE. THE GARAGE ALSO KEEPS A DRAFT OF YOUR LAST SONG BY ITSELF.'));
  const foot = el('div', 'g-boxfoot');
  foot.appendChild(btn('GOT IT', 'g-go', () => m.close()));
  m.body.appendChild(foot);
}
