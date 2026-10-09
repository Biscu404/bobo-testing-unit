/* The colours of a window's frame, by what the window holds: the bar and the edge, in the machine's sixteen. Pure data, so the scheme check can hold every one of them
   against every scheme (scripts/check-theme.mjs). A scheme re-dresses these two and nothing inside the window (kernel/theme_fx.js). */
export const TITLE_COLORS = {
  folder:   { bar: '#55FFFF', border: '#00AAAA' },
  text:     { bar: '#FFFF55', border: '#AA5500' },
  doc:      { bar: '#55FF55', border: '#00AA00' },
  image:    { bar: '#FF55FF', border: '#AA00AA' },
  video:    { bar: '#FF5555', border: '#AA0000' },
  app:      { bar: '#FF55FF', border: '#AA00AA' },
  panic:    { bar: '#FF5555', border: '#FF5555' },
  terminal: { bar: '#AAAAAA', border: '#FFFFFF' }
};
