/* Jesse, drawn like a person.

   Everything else in this app is VGA16; he is not. A face needs a skin tone,
   and the sixteen colours have none, so his portrait is the one place in the
   machine's base palette rule that was knowingly bent (user-requested, like
   Bekkedal and Stand Battle; see CLAUDE.md). Flat rects only, nothing blended:
   buzzed brown hair, fair skin gone a little pink, stubble, blue eyes, and the
   yellow suit with the respirator hung round his neck.

   drawJesse(g, x, y, s, mood, talk): `s` is the pixel size of one cell on a
   16 x 20 grid; mood is 'flat' | 'shock' | 'smirk' | 'wince'. */
const C = {
  hair: '#5b3d26', hairHi: '#7a563a', skin: '#efbf9a', skinSh: '#cf977a', blush: '#e39a82',
  brow: '#3d2819', eyeW: '#f4f1ea', iris: '#4f86b8', pupil: '#12161c', stub: '#a77b5e',
  mouth: '#7e3030', teeth: '#f4f1ea', suit: '#e7c71e', suitSh: '#b89a12', suitHi: '#f6e266',
  rubber: '#1d1d22', filter: '#8a8f96', strap: '#2d2d34', outline: '#2a1c12'
};

export function drawJesse(g, x, y, s, mood, talk) {
  const R = (cx, cy, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x + cx * s), Math.round(y + cy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
  };
  /* the suit: shoulders, a collar, the zip */
  R(0, 14, 16, 6, C.suit); R(0, 14, 16, 1, C.suitHi); R(0, 19, 16, 1, C.suitSh);
  R(0, 14, 3, 6, C.suitSh); R(13, 14, 3, 6, C.suitSh);
  R(7, 15, 2, 5, C.suitSh);
  /* the respirator, hung under the chin on its strap */
  R(5, 14, 6, 1, C.strap);
  R(4, 15, 8, 4, C.rubber); R(5, 19, 6, 1, C.rubber);
  R(3, 16, 2, 2, C.filter); R(11, 16, 2, 2, C.filter); R(3, 16, 2, 1, C.suitHi);
  R(7, 16, 2, 1, C.filter); R(7, 18, 2, 1, C.filter);
  /* neck */
  R(6, 12, 4, 3, C.skinSh);
  /* ears */
  R(2, 6, 1, 3, C.skinSh); R(13, 6, 1, 3, C.skinSh);
  /* the head */
  R(3, 3, 10, 9, C.skin); R(4, 12, 8, 0.5, C.skin);
  R(3, 9, 1, 2, C.skinSh); R(12, 9, 1, 2, C.skinSh);
  R(4, 11, 8, 1, C.skin);
  R(3, 8, 2, 1, C.blush); R(11, 8, 2, 1, C.blush);
  /* buzzed hair: the cap of it, the hairline, the temples */
  R(3, 1, 10, 3, C.hair); R(4, 0, 8, 1, C.hair); R(2, 3, 2, 3, C.hair); R(12, 3, 2, 3, C.hair);
  R(5, 2, 2, 1, C.hairHi); R(9, 1, 3, 1, C.hairHi);
  R(4, 3, 8, 1, C.hair);
  /* brows: a worried one, a flat one, or a shocked one, by mood */
  const up = mood === 'shock' ? -1 : 0;
  if (mood === 'wince' || mood === 'flat') {
    R(4, 5 + up, 3, 1, C.brow); R(9, 5 + up, 3, 1, C.brow);
    if (mood === 'wince') { R(6, 4, 1, 1, C.brow); R(9, 4, 1, 1, C.brow); }
  } else { R(4, 4.6 + up, 3, 1, C.brow); R(9, 4.6 + up, 3, 1, C.brow); }
  /* eyes */
  const eh = mood === 'shock' ? 3 : 2;
  R(4, 6, 3, eh, C.eyeW); R(9, 6, 3, eh, C.eyeW);
  R(5, 6, 2, eh, C.iris); R(10, 6, 2, eh, C.iris);
  R(6, 6.5, 1, eh - 1, C.pupil); R(11, 6.5, 1, eh - 1, C.pupil);
  if (mood === 'wince') { R(4, 6, 3, 1, C.skinSh); R(9, 6, 3, 1, C.skinSh); }
  /* the nose */
  R(7, 8, 2, 2, C.skinSh); R(7, 9.5, 2, 0.5, C.blush);
  /* stubble, and the little goatee */
  R(4, 10, 8, 2, C.stub); R(5, 10, 6, 0.5, C.skin); R(6, 11, 4, 1, C.stub);
  R(3, 9, 1, 2, C.stub); R(12, 9, 1, 2, C.stub);
  /* the mouth */
  if (mood === 'shock') { R(6, 10, 4, 2, C.mouth); R(7, 10, 2, 1, C.teeth); }
  else if (talk) { R(6, 10, 4, 2, C.mouth); R(6, 10, 4, 1, C.teeth); }
  else if (mood === 'smirk') { R(6, 10, 4, 1, C.mouth); R(10, 9, 1, 1, C.mouth); }
  else R(6, 10.5, 4, 1, C.mouth);
}

/* what he looks like for each kind of thing he says */
export function moodFor(tag) {
  if (/^ruin/.test(tag)) return 'wince';
  if (/^wall|^stuck|^idle|^undo/.test(tag)) return 'flat';
  if (/^win|^reset|first_(mirror|double|solvent|stage)|reveal/.test(tag)) return 'smirk';
  if (/^first_(hot|cold)/.test(tag)) return 'shock';
  /* a new bench: wide-eyed for the ones with something new in them (the blue, the burner, the jar), flat for the rest */
  if (/^intro_(5|6|7|10)$/.test(tag)) return 'shock';
  return 'flat';
}
