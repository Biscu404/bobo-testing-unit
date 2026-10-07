/* DRAW.EXE — the sheets over the sheet.
 *
 * Layer 0 is the drawing as it always was: paper and everything on it. The four above it (Dave sells them one at a time) are clear
 * sheets of the same size; you draw on whichever is picked, hide it, clear it, or fold it down into the one below. The window shows
 * `display`, which is all of them put together, and `redraw()` puts them together again after anything is drawn.
 * Saving, exporting and setting the background all read `display`, so they get the picture as it looks. */
export const MAX_LAYERS = 5;

export function createLayers(W, H, display) {
  const stack = Array.from({ length: MAX_LAYERS }, () => {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    return { cv, g: cv.getContext('2d', { willReadFrequently: true }), vis: true };
  });
  let active = 0;
  return {
    get active() { return active; },
    ctx: () => stack[active].g,
    ctxOf: i => stack[i].g,
    setActive(i) { active = Math.max(0, Math.min(MAX_LAYERS - 1, i)); return stack[active].g; },
    visible: i => stack[i].vis,
    toggle(i) { if (i > 0) stack[i].vis = !stack[i].vis; return stack[i].vis; },
    clear(i) { if (i > 0) stack[i].g.clearRect(0, 0, W, H); },
    /* a layer folded into the one beneath it; the paper cannot be folded into anything */
    mergeDown(i) {
      if (i < 1) return false;
      stack[i - 1].g.drawImage(stack[i].cv, 0, 0);
      stack[i].g.clearRect(0, 0, W, H);
      return true;
    },
    /* a new sheet: everything above the paper goes, and the paper is the one being drawn on */
    reset() { for (let i = 1; i < MAX_LAYERS; i++) { stack[i].g.clearRect(0, 0, W, H); stack[i].vis = true; } active = 0; },
    redraw() {
      display.clearRect(0, 0, W, H);
      for (let i = 0; i < MAX_LAYERS; i++) if (stack[i].vis) display.drawImage(stack[i].cv, 0, 0);
    }
  };
}
