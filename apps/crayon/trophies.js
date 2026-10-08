/* DRAW.EXE's trophies (docs/achievements/toys.md). The Crayon is not keeping score, so these only celebrate what somebody chose to make: no counter of strokes or minutes. A sheet remembers
   which colours, brushes and layers it was drawn with and the trophy looks at them when the sheet is saved; they begin again on NEW SHEET. Events: stroke, save { reopened, colours, wheel,
   brushes, layers }, export-png, set-bg. Counter saved (the most drawings that were ever in MY DRAWINGS at once). */
import { t, rule } from '../trophy_kit.js';
import { CRAYON } from '../../kernel/cos_data.js';
const on = rule.on;

export const SWATCHES = 7;
export const BRUSHES = CRAYON.filter(c => c.kind === 'brush').length;       /* Dave's extra brushes */
export const LAYERS = 5;

export const TROPHIES = [
  t('cr_first', 'FIRST MARK', 'B', 'P', 'Draw a line.', on('stroke')),
  t('cr_keep', 'KEEP IT', 'B', 'P', 'Save a drawing to MY DRAWINGS.', on('save')),
  t('cr_second', 'SECOND DRAFT', 'B', 'C', 'Re-open a saved drawing and save it again.', on('save', p => p.reopened)),
  t('cr_png', 'SHOW IT OFF', 'B', 'P', 'Export a drawing as a PNG.', on('export-png')),
  t('cr_gal3', 'A FEW ON THE WALL', 'B', 'P', 'Have three saved drawings.', rule.stat('saved', 3)),
  t('cr_gal10', 'A SMALL GALLERY', 'S', 'P', 'Have ten saved drawings.', rule.stat('saved', 10)),
  t('cr_box', 'THE WHOLE BOX', 'B', 'C', 'Use all seven colours and one from the wheel on a single sheet, and save it.', on('save', p => p.colours >= SWATCHES && p.wheel), { scope: 'room' }),
  t('cr_layers', 'LAYER CAKE', 'S', 'C', 'Draw on every layer of one sheet, and save it.', on('save', p => p.layers >= LAYERS), { scope: 'room' }),
  t('cr_riot', 'A RIOT OF BRUSHES', 'G', 'C', 'Use all ' + BRUSHES + ' of Dave\'s extra brushes on a single sheet, and save it.', on('save', p => p.brushes >= BRUSHES), { scope: 'room' }),
  t('cr_wall', 'WALLPAPER ARTIST', 'S', 'C', 'Set a drawing of your own as the desktop background.', on('set-bg'))
];

/* the drawer's own count: what is in MY DRAWINGS now */
export function backfill(read) {
  const c = read('templeos.draw'), ids = [];
  const n = c && Array.isArray(c.items) ? c.items.length : 0;
  if (n >= 1) ids.push('cr_keep'); if (n >= 3) ids.push('cr_gal3'); if (n >= 10) ids.push('cr_gal10');
  return ids;
}
