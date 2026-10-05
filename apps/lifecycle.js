/* Cleanup for apps that open their own window (an `open()` instead of `mount()`): the
   window manager never calls unmount() for those, so nothing tells them the window is
   gone. `scopedListeners(el)` hands back an `on()` that adds a window/document listener
   and removes every one of them again once `el` (anything inside the app's window) has
   left the page. Closing a window removes its element from #desktop, which is the one
   thing watched, so this costs one observer per open window and nothing per frame. */
export function whenGone(el, fn) {
  const desk = document.getElementById('desktop') || document.body;
  /* an element can be handed over while its window is still being built, so only a
     removal AFTER it has been seen on the page counts */
  let seen = el.isConnected;
  const mo = new MutationObserver(() => {
    if (el.isConnected) { seen = true; return; }
    if (!seen) return;
    mo.disconnect();
    fn();
  });
  mo.observe(desk, { childList: true });
  return () => mo.disconnect();
}

export function scopedListeners(el) {
  const added = [];
  whenGone(el, () => {
    for (const [t, type, fn, opt] of added) t.removeEventListener(type, fn, opt);
    added.length = 0;
  });
  return {
    on(target, type, fn, opt) {
      target.addEventListener(type, fn, opt);
      added.push([target, type, fn, opt]);
    },
  };
}
