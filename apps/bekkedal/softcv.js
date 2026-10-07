/* Canvases that live in memory, not on the graphics card.
 *
 * Chromium puts every 2D canvas it is asked for on the GPU, however small, unless the context says
 * `willReadFrequently`. That is right for the canvas the player looks at and wrong for every canvas the game only
 * *sources from*: a dither tile, a glyph atlas, the patch a lamp lifts. Used as the image of a pattern, or drawn
 * into one of the terrain caches (which are in memory on purpose, see `makeBuf` in index.js), a GPU-resident canvas
 * has to be read back off the card first, and a readback is a synchronous round trip to the GPU process: the
 * renderer's one main thread (which is the whole desktop, every window, every animation) stands still until it
 * answers. One rebuild of the terrain cache fills about eleven hundred rects with a dither pattern, which was eleven
 * hundred round trips, every rebuild, every second or so at dawn and dusk and every four tiles walked. Measured in
 * the same page with the same pattern fills: 1758 ms against 2.6 ms for the same 600 fills once the tile is a
 * memory canvas (see docs in this app's CLAUDE.md, "Where a canvas lives").
 *
 * So: a canvas that is a *source* is made here. The one the player looks at (`cv` in index.js) is not.
 */
export function softCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  return { cv: c, g };
}
