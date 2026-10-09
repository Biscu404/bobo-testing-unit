/* THE BIBEL: the book, with a cover, a table of contents that ticks what has been read, and pages that turn. The words are text.js; the pages are pager.js;
   what is kept (the place, the size, the chapters read) goes through ctx.save. */
import { PARTS, CHAPTERS } from './text.js';
import { createPager, SIZES } from './pager.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const KEY = 'bibel.v1';
const EMBLEM = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
  '<rect x="1" y="3" width="14" height="11" fill="#000000"/><rect x="2" y="4" width="6" height="9" fill="#AAAAAA"/><rect x="8" y="4" width="6" height="9" fill="#FFFFFF"/>' +
  '<rect x="3" y="6" width="4" height="1" fill="#555555"/><rect x="3" y="8" width="4" height="1" fill="#555555"/><rect x="3" y="10" width="4" height="1" fill="#555555"/>' +
  '<rect x="9" y="6" width="4" height="1" fill="#AAAAAA"/><rect x="9" y="8" width="4" height="1" fill="#AAAAAA"/><rect x="9" y="10" width="4" height="1" fill="#AAAAAA"/>' +
  '<rect x="7" y="3" width="2" height="11" fill="#AA5500"/><rect x="7" y="0" width="2" height="4" fill="#FFFF55"/><rect x="6" y="1" width="4" height="1" fill="#FFFF55"/></svg>';

function buildFlow() {
  const frag = document.createDocumentFragment();
  let idx = 0;
  for (const part of PARTS) {
    if (part.name) {
      const [a, b] = part.name.split(': ');
      const d = el('div', 'bb-part'); d.append(el('span', '', a), document.createTextNode(b || '')); frag.appendChild(d);
    }
    for (const c of part.chapters) {
      const wrap = el('section', c.no ? '' : 'bb-pre');
      const h = el('h2'); h.dataset.ch = String(idx++);
      if (c.no) h.appendChild(el('small', '', c.no));
      h.appendChild(document.createTextNode(c.title)); wrap.appendChild(h);
      if (c.note) wrap.appendChild(el('div', 'bb-note', c.note));
      c.verses.forEach((v, i) => {
        const p = el('p', i === 0 ? 'first' : '');
        if (i === 0) { p.appendChild(el('span', 'dc', v[0])); p.appendChild(document.createTextNode(v.slice(1))); }
        else { if (c.no) p.appendChild(el('sup', '', String(i + 1))); p.appendChild(document.createTextNode(v)); }
        wrap.appendChild(p);
      });
      wrap.appendChild(el('div', 'bb-fin', '* * *'));
      const end = el('i'); end.dataset.end = '1'; wrap.appendChild(end);
      frag.appendChild(wrap);
    }
  }
  return frag;
}

let stop = null;

export default {
  id: 'bibel',
  title: 'THE BIBEL',
  width: 860,
  height: 620,
  resizable: true,
  fluid: true,

  mount(root, ctx) {
    const css = el('link'); css.rel = 'stylesheet'; css.href = 'apps/bibel/style.css'; root.appendChild(css);
    root.classList.add('bb'); root.tabIndex = 0;
    const S = { mode: 'cover', size: 2, read: {}, pos: { ch: 0, off: 0 } };
    let seen = new Set(), ro = null, alive = true;
    const save = () => ctx.save(KEY, { size: S.size, read: S.read, pos: S.pos }).catch(() => {});
    const tick = () => { try { if (window.Snd && window.Snd.click) window.Snd.click(); } catch (e) { /* no sound */ } };

    /* the cover */
    const cover = el('div', 'bb-cover'), board = el('div', 'bb-board');
    board.innerHTML = EMBLEM;
    board.append(el('h1', '', 'THE BIBEL'), el('div', 'sub', 'AN AMALGAMATED SCRIPTURE'), el('div', 'rule'), el('div', 'lead'));
    const btns = el('div', 'btns'), bOpen = el('button', 'appbtn', 'OPEN THE BOOK'), bCont = el('button', 'appbtn', 'CONTINUE'), bToc = el('button', 'appbtn', 'CONTENTS');
    btns.append(bOpen, bCont, bToc); board.appendChild(btns); cover.appendChild(board);

    /* the contents */
    const toc = el('div', 'bb-toc');

    /* the reader */
    const reader = el('div', 'bb-reader');
    const bar = el('div', 'bb-bar'), bC = el('button', 'appbtn', 'CONTENTS'), bP = el('button', 'appbtn', '< PREV'), bN = el('button', 'appbtn', 'NEXT >'),
      bS = el('button', 'appbtn', 'A-'), bL = el('button', 'appbtn', 'A+'), ttl = el('div', 'bb-title'), pg = el('div', 'bb-page');
    bar.append(bC, bP, bN, ttl, bS, bL, pg);
    const main = el('div', 'bb-main'), sheet = el('div', 'bb-sheet'), view = el('div', 'bb-view'), flow = el('div', 'bb-flow');
    flow.appendChild(buildFlow()); view.appendChild(flow); sheet.appendChild(view);
    const tl = el('button', 'bb-turn l'), tr = el('button', 'bb-turn r'); tl.setAttribute('aria-label', 'previous page'); tr.setAttribute('aria-label', 'next page');
    sheet.append(tl, tr); main.appendChild(sheet);
    const foot = el('div', 'bb-foot'), prog = el('div', 'bb-prog'), pb = el('b'), hint = el('div', 'bb-hint', 'ARROWS TURN   C CONTENTS   +/- SIZE');
    prog.appendChild(pb); foot.append(prog, hint);
    reader.append(bar, main, foot);
    root.append(cover, toc, reader);
    const P = createPager(view, flow);

    const readCount = () => CHAPTERS.filter(c => S.read[c.id]).length;
    const resume = () => CHAPTERS[S.pos.ch] || CHAPTERS[0];

    function buildToc() {
      toc.textContent = '';
      toc.appendChild(el('div', 'stat', readCount() + ' OF ' + CHAPTERS.length + ' CHAPTERS READ'));
      let i = 0;
      for (const part of PARTS) {
        if (part.name) toc.appendChild(el('h3', '', part.name));
        else if (part.id === 'back') toc.appendChild(el('h3', '', 'AT THE END'));
        for (const c of part.chapters) {
          const k = i++, row = el('button', 'bb-row' + (k === S.pos.ch ? ' now' : ''));
          const t = el('span'); t.textContent = c.title;
          if (c.note) t.appendChild(el('span', 'nt', c.note));
          row.append(el('span', 'no', c.no || '*'), t, el('span', 'tick', S.read[c.id] ? 'READ' : ''));
          row.onclick = () => { S.pos = { ch: k, off: 0 }; openReader(); };
          toc.appendChild(row);
        }
      }
    }

    function refreshCover() {
      const c = resume();
      const started = S.pos.ch > 0 || S.pos.off > 0 || readCount() > 0;
      bCont.hidden = !started;
      bOpen.textContent = started ? 'FROM THE START' : 'OPEN THE BOOK';
      cover.querySelector('.lead').textContent = started ? 'YOU WERE IN ' + (c.no ? 'CHAPTER ' + c.no : c.title) + '.  ' + readCount() + ' OF ' + CHAPTERS.length + ' READ.' : 'COMPILED FROM EVERY BOOK THAT CLAIMS TO BE THE LAST ONE.';
    }

    function show(mode) {
      S.mode = mode;
      cover.hidden = mode !== 'cover'; toc.hidden = mode !== 'toc'; reader.hidden = mode !== 'read';
      if (mode === 'cover') refreshCover();
      if (mode === 'toc') { buildToc(); const n = toc.querySelector('.now'); if (n) n.scrollIntoView({ block: 'center' }); }
      root.focus({ preventScroll: true });
    }

    function status() {
      const k = P.chapterAt(P.spread), c = CHAPTERS[k];
      ttl.textContent = (c.no ? c.no + '. ' : '') + c.title;
      pg.textContent = (P.spread + 1) + ' / ' + P.spreads;
      pb.style.width = (P.spreads > 1 ? Math.round(P.spread * 100 / (P.spreads - 1)) : 100) + '%';
      bP.disabled = P.spread === 0; bN.disabled = P.spread >= P.spreads - 1;
      S.pos = { ch: k, off: P.offsetIn(P.spread) };
      seen.add(P.spread);
      let changed = false;
      CHAPTERS.forEach((ch, i) => {
        if (S.read[ch.id]) return;
        const a = Math.floor(P.starts[i] / P.cols), b = Math.floor(P.ends[i] / P.cols);
        let all = true; for (let s = a; s <= b; s++) if (!seen.has(s)) { all = false; break; }
        if (all) { S.read[ch.id] = true; changed = true; }
      });
      save();
      if (changed) window.dispatchEvent(new CustomEvent('bibel-read', { detail: { read: readCount(), of: CHAPTERS.length } }));
    }

    function layout() {
      root.style.setProperty('--bb-h', view.clientHeight + 'px');
      seen = new Set();
      P.layout(SIZES[S.size]);
    }

    function openReader() {
      show('read');
      layout();
      P.go(P.spreadOfChapter(S.pos.ch) + S.pos.off);
      status();
    }
    const turn = d => { if (P.go(P.spread + d)) { tick(); status(); } };
    const size = d => {
      const n = Math.max(0, Math.min(SIZES.length - 1, S.size + d)); if (n === S.size) return;
      const keep = { ...S.pos }; S.size = n; layout();
      P.go(P.spreadOfChapter(keep.ch)); status();
    };

    bOpen.onclick = () => { S.pos = { ch: 0, off: 0 }; openReader(); };
    bCont.onclick = openReader;
    bToc.onclick = () => show('toc');
    bC.onclick = () => show('toc');
    bP.onclick = () => turn(-1); bN.onclick = () => turn(1); tl.onclick = () => turn(-1); tr.onclick = () => turn(1);
    bS.onclick = () => size(-1); bL.onclick = () => size(1);
    root.addEventListener('keydown', e => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const k = e.key;
      if (S.mode === 'read') {
        if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') turn(1);
        else if (k === 'ArrowLeft' || k === 'PageUp') turn(-1);
        else if (k === 'Home') { P.go(0); status(); }
        else if (k === 'End') { P.go(P.spreads - 1); status(); }
        else if (k === '+' || k === '=') size(1);
        else if (k === '-') size(-1);
        else if (k === 'c' || k === 'C' || k === 'Escape') show('toc');
        else return;
        e.preventDefault(); e.stopPropagation();
      } else if (S.mode === 'toc' && (k === 'Escape' || k === 'b' || k === 'B')) { show('cover'); e.preventDefault(); e.stopPropagation(); }
    });
    ro = new ResizeObserver(() => { if (alive && S.mode === 'read' && view.clientWidth) { const keep = { ...S.pos }; layout(); P.go(P.spreadOfChapter(keep.ch) + keep.off); status(); } });
    ro.observe(view);

    show('cover');
    ctx.load(KEY).then(d => {
      if (!alive || !d) return;
      if (Number.isInteger(d.size) && d.size >= 0 && d.size < SIZES.length) S.size = d.size;
      if (d.read && typeof d.read === 'object') S.read = d.read;
      if (d.pos && Number.isInteger(d.pos.ch) && CHAPTERS[d.pos.ch]) S.pos = { ch: d.pos.ch, off: Math.max(0, d.pos.off | 0) };
      if (S.mode === 'cover') refreshCover();
    }).catch(() => {});
    stop = () => { alive = false; if (ro) ro.disconnect(); };
  },

  unmount() {
    if (stop) stop();
    stop = null;
  }
};
