/* A game's picture fills its window. A canvas that carries `data-fit` is sized by the window manager to the largest size of its own aspect ratio that the
   room around it (the window's body, less the bars beside it and the pane's padding) can hold, and is sized again whenever the window, the fullscreen
   or the zoom changes. `data-fit="int"` keeps the picture at a whole multiple of its pixels while the window is a window (so a pixel is never two
   pixels wide on one row and one on the next); fullscreen, and `data-fit="fit"`, take whatever fits. AfterEgypt drew its 320x200 at 1:1 in a pane
   five times the size and the fullscreen scaled the whole empty pane up with it: a fifth of the window was game.
   A window with such a canvas is laid out off its own size (`fluid`), so fullscreen simply gives it the room instead of scaling the old body like a photo. */
export function attachFit(win, body, isFull) {
  let raf = 0, live = true;
  const run = () => {
    raf = 0;
    if (!live) return;
    const cvs = body.querySelectorAll('canvas[data-fit]');
    if (!cvs.length) return;
    body.dataset.fluid = '1';
    cvs.forEach(cv => {
      const pane = cv.parentElement, cs = getComputedStyle(pane);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      let other = 0;
      if (pane.parentElement === body) [...body.children].forEach(c => { if (c !== pane && c.offsetParent !== null) other += c.offsetHeight; });
      const aw = body.clientWidth - padX, ah = body.clientHeight - other - padY;
      const cw = cv.width, ch = cv.height;
      if (aw <= 0 || ah <= 0 || !cw || !ch) return;
      const k = Math.min(aw / cw, ah / ch), s = k >= 1 && cv.dataset.fit === 'int' && !isFull() ? Math.floor(k) : k;
      cv.style.maxWidth = 'none'; cv.style.maxHeight = 'none';
      cv.style.width = Math.max(1, Math.floor(cw * s)) + 'px';
      cv.style.height = Math.max(1, Math.floor(ch * s)) + 'px';
    });
  };
  const schedule = () => { if (!raf && live) raf = requestAnimationFrame(run); };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  if (ro) ro.observe(body);
  const mo = new MutationObserver(schedule);
  mo.observe(body, { childList: true, subtree: true });
  window.addEventListener('resize', schedule);
  schedule();
  return { refresh: schedule, dispose() { live = false; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', schedule); } };
}
