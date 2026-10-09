/* THE BOTTLE's bottles: the shapes (pure data and arithmetic, so Node can hold them: shapes_check.js). A bottle is a stack of parts from the base up, each a number of
   pixels tall whose half-width goes from `a` to `b` (along a power, so a shoulder can round or square off); its outline, the inside the liquor fills, the lip it is poured over,
   where the cap sits and where the label goes all come from the stack, so the cap is made for the neck it is on and a new bottle is a few lines here. Art coordinates, as art.js:
   the origin is the middle of the base, up is negative; the whole bottle fits the 80 x 246 sprite (a cap may stand 14 px over the lip). */
export const WALL = 4;                                  /* the glass is four pixels thick */
export const MAX_TOP = 224;                             /* the top of the lip, at the very highest */

const P = (kind, h, a, b, pw) => ({ kind, h, a, b: b == null ? a : b, pw: pw || 1 });
/* a ball of radius R with its lowest `floor` pixels cut off to stand on: its half-width follows the circle */
const sphere = (R, floor) => Object.assign(P('body', 2 * R - floor, 0), { ball: { R, floor } });

/* label: where the paper goes (top is how far the top edge is above the base, w and h its size); band: a foil round the neck; emboss: the maker's name moulded in the glass */
export const SHAPES = {
  /* the Jägermeister the game began with: square shoulders to a long neck */
  jag:   { name: 'JAG', cap: 'screw', parts: [P('base', 2, 36), P('body', 148, 38), P('shoulder', 28, 38, 13, 1.5), P('neck', 40, 13), P('lip', 6, 16)],
           label: { top: 126, w: 60, h: 94 }, band: { top: 199, h: 7 }, emboss: 152 },
  /* a slim spirit bottle: long straight sides and a long neck */
  tall:  { name: 'TALL', cap: 'screw', parts: [P('base', 2, 27), P('body', 136, 29), P('shoulder', 26, 29, 11, 1.2), P('neck', 54, 11), P('lip', 6, 13)],
           label: { top: 112, w: 44, h: 84 }, band: { top: 188, h: 6 }, emboss: 140 },
  /* round shoulders and a short neck: rum, and the bitter black bottles */
  round: { name: 'ROUND', cap: 'screw', parts: [P('base', 2, 34), P('body', 92, 38), P('shoulder', 50, 38, 15, 0.7), P('neck', 26, 15), P('lip', 8, 18)],
           label: { top: 100, w: 62, h: 74 }, band: { top: 154, h: 6 }, emboss: 142 },
  /* squat, wide in the mouth, for a cork */
  squat: { name: 'SQUAT', cap: 'cork', parts: [P('base', 2, 34), P('body', 80, 37), P('shoulder', 24, 37, 17, 1.3), P('neck', 20, 17), P('lip', 6, 20)],
           label: { top: 84, w: 58, h: 62 }, band: null, emboss: 100 },
  /* a long-necked beer bottle under a crown cap */
  beer:  { name: 'BEER', cap: 'crown', parts: [P('base', 2, 23), P('body', 88, 25), P('shoulder', 46, 25, 11, 0.9), P('neck', 60, 11, 10.4), P('lip', 4, 13)],
           label: { top: 88, w: 46, h: 66 }, band: { top: 178, h: 14 }, emboss: 132 },
  /* a water bottle: ribbed and plastic, sloping shoulders, a wide blue cap */
  pet:   { name: 'PET', cap: 'pet', parts: [P('base', 2, 26), P('body', 96, 29), P('shoulder', 46, 29, 13, 1), P('neck', 14, 13), P('lip', 4, 15)],
           label: { top: 90, w: 58, h: 68 }, band: null, emboss: 0 },
  /* a round flask with a long neck and a cork: what a potion comes in */
  flask: { name: 'FLASK', cap: 'cork', parts: [P('base', 2, 18), sphere(38, 4), P('neck', 50, 9), P('lip', 6, 12)],
           label: { top: 60, w: 42, h: 40 }, band: null, emboss: 0 },
  /* a square-shouldered bottle with a collar, a wide cap, and a big label */
  cm:    { name: 'CM', cap: 'screw', parts: [P('base', 2, 34), P('body', 118, 37), P('shoulder', 22, 37, 16, 0.55), P('neck', 22, 16), P('lip', 6, 19)],
           label: { top: 98, w: 62, h: 90 }, band: { top: 160, h: 6 }, emboss: 148 }
};

/* the rows of 2 px, from the base up: { y (the row's lower edge, up from the base), kind, hw (whole pixels) } */
export function rowsOf(shape) {
  const rows = []; let y = 0;
  shape.parts.forEach(p => {
    const n = Math.max(1, Math.round(p.h / 2));
    for (let i = 0; i < n; i++) {
      let hw;
      if (p.ball) { const hc = p.ball.floor + 2 * i + 1; hw = Math.sqrt(Math.max(0, p.ball.R * p.ball.R - Math.pow(hc - p.ball.R, 2))); }
      else hw = p.a + (p.b - p.a) * Math.pow(i / n, p.pw);
      rows.push({ y, kind: p.kind, hw: Math.max(1, Math.round(hw)) });
      y += 2;
    }
  });
  return rows;
}

/* everything the rest of the app needs to know about a shape */
export function geometry(name, capKind) {
  const shape = SHAPES[name] || SHAPES.jag, rows = rowsOf(shape);
  const top = rows[rows.length - 1].y + 2;
  const neck = rows.filter(r => r.kind === 'neck'), lip = rows.filter(r => r.kind === 'lip');
  const neckHW = neck[0].hw, lipHW = lip[0].hw;
  const body = rows.filter(r => r.kind === 'body'), bodyHW = Math.max(...rows.map(r => r.hw));
  /* the inside: the liquor fills what the glass leaves, to the top of the lip's bore (the lip is a flange on the outside only) */
  const inner = rows.filter(r => r.y >= WALL && r.kind !== 'base').map(r => ({ y: r.y, hw: Math.max(1, (r.kind === 'lip' ? neckHW : r.hw) - WALL) }));
  return {
    name, shape, rows, inner, top, neckHW, lipHW, bodyHW, bodyTop: body.length ? body[body.length - 1].y + 2 : top,
    cap: capKind || shape.cap, label: shape.label, band: shape.band, emboss: shape.emboss,
    /* the lower lip is where the liquor goes over when it is tipped; the other side is where the air comes in */
    lip: [neckHW, -top], lipUp: [-neckHW, -top]
  };
}
export const SHAPE_IDS = Object.keys(SHAPES);

/* how many pixels a bottle holds, for the pour's flow (pour.js scales the flow so a measure takes as long from any bottle) */
export const innerArea = g => g.inner.reduce((s, r) => s + 2 * 2 * r.hw, 0);
