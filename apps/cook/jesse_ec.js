/* Jesse, the way he looks at the end of El Camino (the shed tab the owner's blueprint opens uses him; the bench uses the one in jesse.js, in the yellow suit).
   Clean-shaven, the hair grown back to something short and his own, a white knit sweater under a black jacket with the collar up, tired round the eyes and looking like he has
   somewhere to be. Like the other Jesse, this is a face, so it is one of the places the machine's sixteen colours are knowingly bent (CLAUDE.md: the portrait exceptions). Flat rects only,
   nothing blended or smoothed.

   drawJesseEC(g, x, y, s, mood, talk): `s` is the size of one cell on a 16 x 20 grid; mood is 'flat' | 'shock' | 'smirk' | 'wince' | 'grin'. */
const C = {
  hair: '#4a3321', hairHi: '#6a4a30', hairLo: '#33231a', skin: '#f0c7a4', skinSh: '#d4a283', blush: '#e8a590', bag: '#c99480',
  brow: '#35241a', eyeW: '#f4f1ea', iris: '#5a88ae', pupil: '#12161c', mouth: '#8a3a36', teeth: '#f4f1ea', lip: '#cf8a78',
  knit: '#efe9dc', knitSh: '#d4ccb8', knitRib: '#e1d9c6', jacket: '#1d1e24', jacketHi: '#383b45', jacketSh: '#0e0f13', zip: '#8a8f96', outline: '#2a1c12'
};

export function drawJesseEC(g, x, y, s, mood, talk) {
  const R = (cx, cy, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x + cx * s), Math.round(y + cy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
  };
  /* the jacket: shoulders, the collar turned up behind the neck, the lapels open on the sweater */
  R(0, 14, 16, 6, C.jacket); R(0, 14, 16, 1, C.jacketHi); R(0, 19, 16, 1, C.jacketSh);
  R(0, 14, 2, 6, C.jacketSh); R(14, 14, 2, 6, C.jacketSh);
  R(3, 12, 2, 3, C.jacket); R(11, 12, 2, 3, C.jacket); R(3, 12, 1, 3, C.jacketHi); R(12, 12, 1, 3, C.jacketSh);
  /* the sweater between the lapels: knit, a crew neck, a rib every other column */
  R(5, 14, 6, 6, C.knit);
  R(5, 14, 1, 6, C.knitSh); R(10, 14, 1, 6, C.knitSh);
  for (let k = 0; k < 3; k++) R(6.5 + k * 1.5, 15, 0.5, 5, C.knitRib);
  R(5, 14, 6, 1, C.knitSh);
  R(4, 14, 1, 6, C.jacketSh); R(11, 14, 1, 6, C.jacketSh);
  R(2.5, 17, 1, 3, C.zip);
  /* neck */
  R(6, 12, 4, 3, C.skinSh); R(6, 12, 4, 1, C.skin);
  /* ears */
  R(2, 6, 1, 3, C.skinSh); R(13, 6, 1, 3, C.skinSh);
  /* the head */
  R(3, 3, 10, 9, C.skin); R(4, 12, 8, 0.5, C.skin);
  R(3, 9, 1, 2, C.skinSh); R(12, 9, 1, 2, C.skinSh);
  R(4, 11, 8, 1, C.skin);
  R(3, 8, 2, 1, C.blush); R(11, 8, 2, 1, C.blush);
  /* the hair, which has grown back: a short crop with a little length on top, pushed to one side, the sideburns short */
  R(3, 1, 10, 3, C.hair); R(4, 0, 8, 1, C.hair); R(2, 3, 2, 3, C.hair); R(12, 3, 2, 3, C.hair);
  R(5, 0, 3, 1, C.hairHi); R(9, 1, 3, 1, C.hairHi); R(4, 2, 2, 1, C.hairHi);
  R(4, 3, 8, 1, C.hair); R(3, 4, 1, 1, C.hair); R(12, 4, 1, 1, C.hair);
  R(10, 0, 2, 1, C.hairLo); R(11, 2, 2, 1, C.hairLo);
  /* brows: a worried one, a flat one, or a shocked one, by mood */
  const up = mood === 'shock' ? -1 : 0;
  if (mood === 'wince' || mood === 'flat') {
    R(4, 5 + up, 3, 1, C.brow); R(9, 5 + up, 3, 1, C.brow);
    if (mood === 'wince') { R(6, 4, 1, 1, C.brow); R(9, 4, 1, 1, C.brow); }
  } else R(4, 4.6 + up, 3, 1, C.brow), R(9, 4.6 + up, 3, 1, C.brow);
  /* eyes: a little heavy, because he has not slept since Alaska */
  const eh = mood === 'shock' ? 3 : 2;
  R(4, 6, 3, eh, C.eyeW); R(9, 6, 3, eh, C.eyeW);
  R(5, 6, 2, eh, C.iris); R(10, 6, 2, eh, C.iris);
  R(6, 6.5, 1, eh - 1, C.pupil); R(11, 6.5, 1, eh - 1, C.pupil);
  R(4, 6, 3, 0.5, C.skinSh); R(9, 6, 3, 0.5, C.skinSh);
  if (mood === 'wince') { R(4, 6, 3, 1, C.skinSh); R(9, 6, 3, 1, C.skinSh); }
  R(4, 8, 3, 0.5, C.bag); R(9, 8, 3, 0.5, C.bag);
  /* the nose */
  R(7, 8, 2, 2, C.skinSh); R(7, 9.5, 2, 0.5, C.blush);
  /* no stubble: the cheeks and the chin are only skin, a shade darker under the lip */
  R(6, 11, 4, 0.5, C.skinSh);
  /* the mouth */
  if (mood === 'shock') { R(6, 10, 4, 2, C.mouth); R(7, 10, 2, 1, C.teeth); }
  else if (mood === 'grin') { R(5, 10, 6, 2, C.mouth); R(5, 10, 6, 1, C.teeth); R(4.5, 9.5, 1, 1, C.skinSh); R(11, 9.5, 1, 1, C.skinSh); }
  else if (talk) { R(6, 10, 4, 2, C.mouth); R(6, 10, 4, 1, C.teeth); }
  else if (mood === 'smirk') { R(6, 10, 4, 1, C.lip); R(10, 9, 1, 1, C.lip); }
  else R(6, 10.5, 4, 1, C.lip);
}

/* what he looks like for each kind of thing he says in the shed */
export function moodForShed(tag) {
  if (/^(seen|taxed|cornered|stuck)/.test(tag)) return 'wince';
  if (/^(win|part|deliver|bought|sold|coin|radio|keys|grin)/.test(tag)) return 'grin';
  if (/^(push|plant|blueprint|help)/.test(tag)) return 'smirk';
  if (/^(first|shock|intro_9|intro_10)/.test(tag)) return 'shock';
  return 'flat';
}
