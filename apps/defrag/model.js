/* DEFRAG's disk, as plain data (pure: Node runs it in defrag_check.js).
   A disk is N clusters. Each cell is null (free), { bad: true } (a bad block: it stays where it is) or { f, k }: the k-th cluster of file f.
   `scatter` lays real files down in pieces, the way a used disk looks; `plan` is the list of swaps that puts every file back in one piece, in file
   order, from the first good cluster; `fragmented` counts the files that are in more than one piece. */
export const unitOf = (files, N) => {
  const bytes = files.reduce((a, f) => a + Math.max(1, f.bytes), 0);
  return Math.max(64, Math.ceil(bytes / (N * 0.55)));
};

/* files: [{ name, bytes }] -> [{ name, clusters }] with at least one cluster each and never more than `cap` */
export function clustersOf(files, N, cap) {
  const unit = unitOf(files, N);
  return files.map(f => ({ name: f.name, clusters: Math.max(1, Math.min(cap || 24, Math.ceil(Math.max(1, f.bytes) / unit))) }));
}

export function scatter(files, N, rnd) {
  const cells = new Array(N).fill(null);
  for (let b = 0, want = Math.max(2, Math.round(N * 0.02)); b < want; b++) cells[Math.floor(rnd() * N)] = { bad: true };
  const free = i => cells[i] === null;
  const order = files.map((f, i) => i).sort(() => rnd() - 0.5);
  for (const fi of order) {
    const left = files[fi].clusters;
    const pieces = Math.min(left, 1 + Math.floor(rnd() * Math.min(4, left)));
    const sizes = []; let rest = left;
    for (let p = 0; p < pieces; p++) { const s = p === pieces - 1 ? rest : Math.max(1, Math.floor(rest / (pieces - p) * (0.5 + rnd()))); sizes.push(Math.min(s, rest - (pieces - p - 1))); rest -= sizes[p]; }
    let k = 0;
    for (const size of sizes) {
      let at = -1;
      for (let t = 0; t < 60 && at < 0; t++) {                           /* a gap this piece fits in, found by guessing */
        const s = Math.floor(rnd() * (N - size + 1)); let ok = true;
        for (let j = 0; j < size; j++) if (!free(s + j)) { ok = false; break; }
        if (ok) at = s;
      }
      for (let j = 0; j < size; j++) {
        let i = at >= 0 ? at + j : -1;
        if (i < 0) { i = cells.findIndex(c => c === null); if (i < 0) return cells; }       /* a full disk: wherever there is room */
        cells[i] = { f: fi, k: k++ };
      }
    }
  }
  return cells;
}

/* the order the clusters should end up in: file by file, each in its own order */
export const wanted = files => { const o = []; files.forEach((f, fi) => { for (let k = 0; k < f.clusters; k++) o.push({ f: fi, k }); }); return o; };
const same = (a, b) => !!a && !!b && a.f === b.f && a.k === b.k;

export function plan(cells, files) {
  const c = cells.slice(), want = wanted(files), good = [];
  c.forEach((x, i) => { if (!x || !x.bad) good.push(i); });
  const swaps = [];
  for (let u = 0; u < want.length && u < good.length; u++) {
    const t = good[u];
    if (same(c[t], want[u])) continue;
    const from = c.findIndex(x => same(x, want[u]));
    if (from < 0) continue;                                              /* a cluster that did not fit on the disk */
    swaps.push([from, t]);
    const tmp = c[from]; c[from] = c[t]; c[t] = tmp;
  }
  return swaps;
}

/* files in more than one piece: a file is whole if its clusters sit side by side, in order, with nothing between them but bad blocks */
export function fragmented(cells, files) {
  const at = files.map(() => []);
  cells.forEach((x, i) => { if (x && !x.bad) at[x.f][x.k] = i; });
  let n = 0;
  at.forEach((p, fi) => {
    if (p.length < 2) return;
    for (let k = 1; k < p.length; k++) {
      if (p[k] === undefined || p[k - 1] === undefined) { n++; return; }
      let gap = p[k] - p[k - 1] - 1, ok = gap === 0;
      if (!ok && gap > 0) { ok = true; for (let i = p[k - 1] + 1; i < p[k]; i++) if (!(cells[i] && cells[i].bad)) { ok = false; break; } }
      if (!ok) { n++; return; }
    }
  });
  return n;
}

export const swapCells = (cells, a, b) => { const t = cells[a]; cells[a] = cells[b]; cells[b] = t; };
