/* The pages of the book. The whole text is one flow set in columns as tall as the viewport; a "page" is a column, a spread is one column
   (narrow window) or two (wide), and turning is a shift of the flow by whole columns. Nothing is cut or measured by guesswork: the browser
   breaks the columns, and we read where each chapter starts and ends from where its markers landed. */
export const SIZES = [18, 20, 22, 26, 30];
const GAP = 56;

export function createPager(view, flow) {
  const P = { cols: 1, colW: 0, step: 0, spreads: 1, spread: 0, starts: [], ends: [] };

  const colOf = el => {
    const x = el.getBoundingClientRect().left - flow.getBoundingClientRect().left;
    return Math.max(0, Math.floor((x + 2) / P.step));
  };

  /* lay the flow out for the viewport and size, then read the chapters' columns. Returns nothing; read P afterwards. */
  P.layout = size => {
    const W = Math.max(240, view.clientWidth), H = Math.max(160, view.clientHeight);
    P.cols = W >= 760 ? 2 : 1;
    P.colW = Math.floor((W - (P.cols - 1) * GAP) / P.cols);
    P.step = P.colW + GAP;
    const s = flow.style;
    s.transform = 'none';
    s.fontSize = size + 'px';
    s.width = (P.cols * P.colW + (P.cols - 1) * GAP) + 'px';
    s.height = H + 'px';
    s.columnCount = String(P.cols);
    s.columnGap = GAP + 'px';
    const heads = flow.querySelectorAll('[data-ch]'), ends = flow.querySelectorAll('[data-end]');
    P.starts = Array.from(heads, colOf);
    P.ends = Array.from(ends, colOf);
    const last = Math.max(0, ...P.ends, colOf(flow.lastElementChild));
    P.spreads = Math.floor(last / P.cols) + 1;
    P.spread = Math.min(P.spread, P.spreads - 1);
    P.show();
  };

  P.show = () => { flow.style.transform = 'translateX(' + (-P.spread * P.cols * P.step) + 'px)'; };
  P.go = n => { const m = Math.max(0, Math.min(P.spreads - 1, n)); const moved = m !== P.spread; P.spread = m; P.show(); return moved; };
  P.spreadOfChapter = i => Math.floor((P.starts[i] || 0) / P.cols);
  /* the chapter a spread belongs to: the last one that has begun on or before its left page */
  P.chapterAt = n => { let k = 0; P.starts.forEach((c, i) => { if (Math.floor(c / P.cols) <= n) k = i; }); return k; };
  /* chapters whose last column is on, or before, this spread */
  P.finishedBy = n => P.ends.map((c, i) => Math.floor(c / P.cols) <= n ? i : -1).filter(i => i >= 0);
  /* where in its chapter the reader is: spreads past the chapter's first, so a different window size can come back to the same place */
  P.offsetIn = n => n - P.spreadOfChapter(P.chapterAt(n));
  return P;
}
