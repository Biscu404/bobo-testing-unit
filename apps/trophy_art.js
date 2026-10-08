/* The picture of a trophy: a sixteen-pixel cup, flat rects in the machine's colours (the tier is the colour: bronze is brown, silver light grey, gold yellow, a secret
   light magenta, a mastery or a meta trophy white), as an SVG string. The card, the taskbar's cup and the ledger all draw the same cup, at their own size. Pure. */
export const TIER_COLOUR = { B: '#AA5500', S: '#AAAAAA', G: '#FFFF55', secret: '#FF55FF', meta: '#FFFFFF' };
export const TIER_DARK = { B: '#552B00', S: '#555555', G: '#AA5500', secret: '#AA00AA', meta: '#AAAAAA' };
export const TIER_NAME = { B: 'BRONZE', S: 'SILVER', G: 'GOLD', secret: 'SECRET', meta: 'MASTER' };
const R = (x, y, w, h, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';

/* which colour a trophy wears: its tier, or magenta if it is a secret, or white if it is a seal */
export const wearOf = d => d.mastery || d.kind === 'meta' ? 'meta' : d.secret ? 'secret' : d.tier;

export function cup(wear, locked) {
  const c = locked ? '#555555' : TIER_COLOUR[wear] || '#AAAAAA', k = locked ? '#000000' : TIER_DARK[wear] || '#555555', w = locked ? '#AAAAAA' : '#FFFFFF';
  return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
    R(1, 3, 2, 1, c) + R(0, 4, 1, 3, c) + R(1, 7, 2, 1, c) + R(2, 4, 1, 3, k) +                          /* the left handle */
    R(13, 3, 2, 1, c) + R(15, 4, 1, 3, c) + R(13, 7, 2, 1, c) + R(13, 4, 1, 3, k) +                      /* the right handle */
    R(3, 1, 10, 1, c) + R(3, 2, 10, 5, c) + R(4, 7, 8, 1, c) + R(5, 8, 6, 1, c) + R(11, 2, 2, 6, k) + R(4, 2, 1, 5, w) +   /* the bowl, lit on the left, shaded on the right */
    R(7, 9, 2, 3, c) + R(7, 9, 1, 3, w) + R(5, 12, 6, 1, c) + R(4, 13, 8, 2, k) + R(4, 13, 8, 1, c) +  /* stem and base */
    '</svg>';
}
export const cupUrl = (wear, locked) => 'data:image/svg+xml;utf8,' + encodeURIComponent(cup(wear, locked));
