#!/usr/bin/env node
/* Compare two builds' screenshot folders, allowing for the machine's own
   run-to-run variation (animated water, smoke, the clock digit...):

     node scripts/pngdiff.mjs <A> <B> --noiseA=<A2> --noiseB=<B2> [--slack=N] [--skip-top=N] [--new-colours=N] [--exact]

   A and A2 are two runs of the trusted reference (e.g. a known-good build), B and B2 two
   runs of the build under test. Per file:
     noise = diff(A,A2)                                    (how much the reference target varies on its own)
     cross = the smallest of the four A/A2 x B/B2 diffs     (how close the targets get)
   A file fails only if cross > 1.5 x noise + slack, i.e. the targets differ by more than
   a target differs from itself. Prints the failures; VERBOSE=1 prints every file.

   The unit compared is an 8x8 BLOCK whose mean colour moved by more than 12 on
   any channel - not a pixel. The machine's dusk/night/fog shading is dithered and
   the dither's phase depends on frame timing, so two runs of the SAME target
   differ in up to every pixel while looking identical; averaging over a block
   cancels a one-pixel phase shift but still catches a changed colour, a moved
   sprite, a missing tile or a different font. --exact compares raw pixels.
   Block means are blind to blur (it preserves the mean), so a second test covers
   smoothing/antialiasing: a screenshot may not contain colours the reference
   target never produced in either of its runs (the machine draws with fillRect and
   snaps to whole pixels, so a resampled canvas invents blended colours at once).

   Defaults: new-colours slack 150 (a clean run invents at most ~50 from animation tints; blur ~600),
   slack 16 blocks (animation phase: a swing frame, water, smoke), top 22px (HUD clock) skipped.
   Without --noise flags it is a plain comparison of A and B. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';

const flag = (n) => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=')[1];
const [A, B] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const A2 = flag('noiseA'), B2 = flag('noiseB'), slack = Number(flag('slack') || (process.argv.includes('--exact') ? 0 : 16));
const load = (d, f) => PNG.sync.read(readFileSync(join(d, f)));
const EXACT = process.argv.includes('--exact'), BLK = 8, TOL = 12;
/* the HUD strip carries the in-game clock, which reads 08:01 in one run and 08:02
   in the next depending on frame timing; a scaling/smoothing regression would show
   across the whole canvas, not only there */
const SKIP_TOP = Number(flag('skip-top') ?? 22);
function diff(a, b) {
  if (a.width !== b.width || a.height !== b.height) return Infinity;
  const w = a.width, h = a.height;
  if (EXACT) {
    let n = 0;
    for (let i = 0; i < a.data.length; i += 4)
      if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) n++;
    return n;
  }
  let n = 0;
  for (let by = SKIP_TOP; by < h; by += BLK) for (let bx = 0; bx < w; bx += BLK) {
    const s = [0, 0, 0, 0, 0, 0]; let c = 0;
    for (let y = by; y < Math.min(by + BLK, h); y++) for (let x = bx; x < Math.min(bx + BLK, w); x++) {
      const i = (y * w + x) * 4; c++;
      for (let k = 0; k < 3; k++) { s[k] += a.data[i + k]; s[3 + k] += b.data[i + k]; }
    }
    if ([0, 1, 2].some(k => Math.abs(s[k] - s[3 + k]) / c > TOL)) n++;
  }
  return n;
}
const colours = (im) => { const set = new Set(); for (let i = 0; i < im.data.length; i += 4) set.add((im.data[i] << 16) | (im.data[i + 1] << 8) | im.data[i + 2]); return set; };
const NEW_COLOUR_SLACK = Number(flag('new-colours') || 150);
const files = readdirSync(A).filter(f => f.endsWith('.png'));
let bad = 0, exact = 0, within = 0;
for (const f of files) {
  const dirs = [A, B, A2, B2];
  if (dirs.some(d => d && !existsSync(join(d, f)))) { console.log(`MISSING ${f}`); bad++; continue; }
  const a = load(A, f), b = load(B, f);
  let noise = 0, cross = diff(a, b);
  if (A2 && B2) {
    const a2 = load(A2, f), b2 = load(B2, f);
    noise = diff(a, a2);   /* only the reference's own variation: a defect in B must not count as noise */
    cross = Math.min(cross, diff(a, b2), diff(a2, b), diff(a2, b2));
  }
  let fresh = 0;
  if (A2) {
    const ref = colours(a); for (const c of colours(load(A2, f))) ref.add(c);
    for (const im of [b, B2 ? load(B2, f) : b]) { let n = 0; for (const c of colours(im)) if (!ref.has(c)) n++; fresh = Math.max(fresh, n); }
  }
  const fail = cross > noise * 1.5 + slack || fresh > NEW_COLOUR_SLACK;
  if (cross === 0) exact++; else if (!fail) within++;
  if (fail) bad++;
  if (fail || process.env.VERBOSE) console.log(`${fail ? 'FAIL' : 'ok  '} ${f}  cross ${cross}${EXACT ? 'px' : ' blocks'}  noise ${noise}${EXACT ? 'px' : ' blocks'}  new colours ${fresh}`);
}
console.log(`${files.length} files: ${exact} identical, ${within} different but within run-to-run noise, ${bad} beyond it`);
process.exit(bad ? 1 : 0);
