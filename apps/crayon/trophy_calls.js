/* Where the Crayon tells the trophies what happened (the list is trophies.js). A sheet is one drawing's colours, brushes and layers: `begin` starts it again (NEW SHEET, or a drawing
   opened from MY DRAWINGS, which is then `reopened`), `mark` notes what a stroke used, and the trophies that ask about a whole sheet are told at SAVE. None of it can throw into the app. */
import { trophies } from '../trophy_scope.js';
import { SWATCHES } from './trophies.js';

const TR = trophies('crayon');
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export function createCalls(palette) {
  let sheet = null, reopened = false;
  const begin = again => { sheet = { colours: new Set(), wheel: false, brushes: new Set(), layers: new Set(), marked: false }; reopened = !!again; };
  begin(false);
  return {
    begin,
    /* a stroke (or a fill) in `tool`, on `layer`, in `hex` */
    mark(tool, layer, hex, extraBrushes) {
      guard(() => {
        sheet.marked = true;
        if (palette.indexOf(hex) >= 0) sheet.colours.add(hex); else sheet.wheel = true;
        if (extraBrushes.indexOf(tool) >= 0) sheet.brushes.add(tool);
        sheet.layers.add(layer);
        TR.emit('stroke', {});
      });
    },
    saved(count) { guard(() => { TR.max('saved', count); TR.emit('save', { reopened: reopened, colours: Math.min(sheet.colours.size, SWATCHES), wheel: sheet.wheel, brushes: sheet.brushes.size, layers: sheet.layers.size }); }); },
    exported: () => guard(() => TR.emit('export-png', {})),
    /* the sheet became the desktop's background: only a drawing that has something on it is one of your own */
    background: () => guard(() => { if (sheet.marked) TR.emit('set-bg', {}); })
  };
}
