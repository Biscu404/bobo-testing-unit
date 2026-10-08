/* SOLITAIRE'S CARDS: the four lanes (the suits), the ranks, and every picture on a card, drawn onto any 2D context. It used to live inside the window's closure; it is a
   module of its own so that the window paints with it and so does the folder of props a mastered Solitaire leaves on the desktop (apps/solitaire/props.js).
   `makeCards(g, { back, suitMode })` hands back { drawCard, roundRect, laneVis }: `back()` is which of the three card backs (0 to 2), `suitMode()` is 4, 2 or 'distinct'. */
import { BACK_BASE, drawBackArt } from './cosmetics.js';
export const LANES = [
  { id: 0, name: 'MID',     red: true,  c: '#c8283c', c2: '#8b1020', ink: '#ffffff', champ: 'ZED' },
  { id: 1, name: 'BOT',     red: true,  c: '#a83e10', c2: '#6a2406', ink: '#ffffff', champ: 'TALON' },
  { id: 2, name: 'TOP',     red: false, c: '#3f6a9e', c2: '#20364f', ink: '#ffffff', champ: 'LEE SIN' },
  { id: 3, name: 'SUPPORT', red: false, c: '#4a3060', c2: '#241635', ink: '#e0d4f0', champ: 'JAX' }
];
export const RANK_TXT = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const CW = 80, CH = 112;
/* the four lanes are really two teams (LANES[i].red), the way a classic
   deck is two colours -- so a 2-tone mode is just painting each team its
   team colour, and never touches the .red the stacking rules read. The
   distinct mode swaps in four hues spread around the wheel instead of the
   default palette's two warm/two cool pairing, for a board that reads at
   a glance instead of on close inspection. */
export const SUIT_DISTINCT = [
  { c: '#E8383A', c2: '#9c1416', ink: '#ffd6d6' },
  { c: '#E8B23A', c2: '#8a6410', ink: '#fff3d6' },
  { c: '#3A78E8', c2: '#1c3f8a', ink: '#d6e6ff' },
  { c: '#3AA855', c2: '#1f5c30', ink: '#d8ffe0' }
];
export const SUIT_MODES = [4, 2, 'distinct'];
export const SUIT_MODE_LABEL = { 4: 'SUITS: 4-TONE', 2: 'SUITS: 2-TONE', distinct: 'SUITS: DISTINCT' };

export function makeCards(g, o) {
  const back = o.back, suitMode = o.suitMode;
  const laneVis = i => {
    const L = LANES[i];
    const mode = suitMode();
    if (mode === 2) {
      return L.red ? { ...L, c: '#d43a4a', c2: '#8b1020', ink: '#ffd8dc' }
                   : { ...L, c: '#1c1c1c', c2: '#000000', ink: '#eaeaea' };
    }
    if (mode === 'distinct') return { ...L, ...SUIT_DISTINCT[i] };
    return L;
  };

  function roundRect(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  function laneIcon(x, y, s, lane, col) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = col;
    if (lane === 0) {                    /* MID: the lane, and a diamond on it */
      g.fillRect(x - 2 * s, y - 9 * s, 4 * s, 18 * s);
      g.beginPath();
      g.moveTo(x, y - 7 * s); g.lineTo(x + 6 * s, y); g.lineTo(x, y + 7 * s); g.lineTo(x - 6 * s, y);
      g.closePath(); g.fill();
    } else if (lane === 1) {             /* BOT: a descending arrow */
      g.fillRect(x - 2 * s, y - 10 * s, 4 * s, 12 * s);
      g.beginPath();
      g.moveTo(x - 8 * s, y); g.lineTo(x + 8 * s, y); g.lineTo(x, y + 10 * s);
      g.closePath(); g.fill();
    } else if (lane === 2) {             /* TOP: a tower */
      g.fillRect(x - 7 * s, y + 4 * s, 14 * s, 6 * s);
      g.fillRect(x - 5 * s, y - 6 * s, 10 * s, 10 * s);
      g.fillRect(x - 7 * s, y - 9 * s, 3 * s, 3 * s);
      g.fillRect(x - 1.5 * s, y - 10 * s, 3 * s, 4 * s);
      g.fillRect(x + 4 * s, y - 9 * s, 3 * s, 3 * s);
    } else {                             /* SUPPORT: a ward */
      g.beginPath();
      g.moveTo(x, y - 10 * s); g.lineTo(x + 8 * s, y - 2 * s); g.lineTo(x, y + 10 * s); g.lineTo(x - 8 * s, y - 2 * s);
      g.closePath(); g.fill();
      g.fillStyle = '#0a0c10';
      g.fillRect(x - 2 * s, y - 4 * s, 4 * s, 6 * s);
    }
  }

  /* Silhouette first: every champion has to read as itself in one colour at
     eighty pixels, so each is a distinct outline before it is any detail. */
  function champArt(x, y, w, h, lane, tier) {
    const L = laneVis(lane);
    const cx = x + w / 2;
    const base = y + h;
    const sc = tier === 0 ? 0.72 : tier === 1 ? 0.88 : 1;
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = L.c2;
    g.fillRect(x, y, w, h);
    /* a halo so the silhouette has something to sit on */
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.beginPath(); g.arc(cx, y + h * 0.42, w * 0.42 * sc, 0, 7); g.fill();
    const S = (dx, dy, dw, dh, c) => { g.fillStyle = c; g.fillRect(Math.round(cx + dx * sc), Math.round(base - dy * sc), Math.round(dw * sc), Math.round(dh * sc)); };

    if (lane === 0) {                                    /* ZED */
      S(-20, 30, 40, 30, '#14171c');                     /* shoulders */
      S(-16, 46, 32, 18, '#1c2129');                     /* hood */
      S(-13, 48, 26, 14, '#2a3038');                     /* mask */
      S(-13, 52, 8, 3, L.c); S(5, 52, 8, 3, L.c);        /* eye slits */
      S(-19, 56, 6, 12, '#2a3038'); S(13, 56, 6, 12, '#2a3038');   /* horns */
      S(-17, 66, 4, 6, L.c); S(13, 66, 4, 6, L.c);
      if (tier > 0) { S(-30, 34, 10, 10, '#2a3038'); S(20, 34, 10, 10, '#2a3038'); }
      if (tier > 1) { S(-34, 12, 68, 6, '#14171c'); S(-28, 4, 56, 8, '#1c2129'); }
    } else if (lane === 1) {                             /* TALON */
      S(-22, 28, 44, 28, '#1a1410');                     /* cloak */
      S(-15, 44, 30, 20, '#241a12');                     /* collar */
      S(-11, 48, 22, 14, '#c9a06a');                     /* face */
      S(-11, 54, 22, 4, '#1a1410');                      /* fringe */
      S(-9, 50, 5, 3, L.c); S(4, 50, 5, 3, L.c);
      if (tier > 0) { S(14, 20, 24, 5, '#b8bcc4'); S(30, 22, 10, 3, '#e8ecf2'); }   /* blade */
      if (tier > 1) { S(-40, 6, 34, 26, '#1a1410'); S(8, 6, 34, 26, '#1a1410'); }   /* the cape spread */
    } else if (lane === 2) {                             /* LEE SIN */
      S(-24, 30, 48, 28, '#3a2a1c');
      S(-14, 46, 28, 18, '#c98a52');                     /* head */
      S(-15, 52, 30, 6, '#e8e2d4');                      /* the blindfold */
      S(15, 52, 12, 4, '#e8e2d4'); S(19, 46, 8, 8, '#e8e2d4');
      S(-20, 34, 8, 14, '#c98a52'); S(12, 34, 8, 14, '#c98a52');
      if (tier > 0) { S(-26, 24, 52, 5, '#7a5a34'); }
      if (tier > 1) { S(-30, 2, 12, 26, L.c); S(18, 2, 12, 26, L.c); }
    } else {                                             /* JAX */
      S(-22, 30, 44, 26, '#241a30');
      S(-26, 54, 52, 6, '#3a2a4a');                      /* the brim */
      S(-13, 46, 26, 12, '#191122');                     /* the dark under it */
      S(-8, 50, 5, 4, '#ffe07a'); S(3, 50, 5, 4, '#ffe07a');
      S(16, 20, 6, 46, '#4a4a52');                       /* the lamppost */
      S(13, 62, 12, 8, '#ffe07a');
      if (tier > 0) { S(-30, 26, 10, 20, '#241a30'); }
      if (tier > 1) { S(-36, 4, 20, 26, '#3a2a4a'); S(-13, 34, 26, 6, '#ffe07a'); }
    }
    g.restore();
  }

  function drawCard(c, x, y, lifted) {
    g.save();
    if (lifted) {
      g.translate(x + CW / 2, y + CH / 2);
      g.rotate(0.035);
      g.translate(-(x + CW / 2), -(y + CH / 2));
      g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 16; g.shadowOffsetY = 8;
    } else {
      g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
    }
    if (!c.up) {
      const bid = o.backId ? o.backId() : ['hex', 'silk', 'rune'][back() % 3], b = bid === 'hex' ? 0 : bid === 'silk' ? 1 : bid === 'rune' ? 2 : -1;
      roundRect(x, y, CW, CH, 5);
      g.fillStyle = BACK_BASE[bid];
      g.fill();
      g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 1;
      g.stroke();
      g.save();
      roundRect(x + 5, y + 5, CW - 10, CH - 10, 3);
      g.clip();
      if (b < 0) {
        drawBackArt(g, bid, x, y, CW, CH);
      } else if (b === 0) {
        g.strokeStyle = '#39a0c8';
        for (let i = -CH; i < CW; i += 9) {
          g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + CH, y + CH); g.stroke();
        }
        g.fillStyle = '#0d1a26';
        g.fillRect(x + 24, y + 40, 32, 32);
        g.fillStyle = '#7fe0ff';
        g.fillRect(x + 36, y + 44, 8, 24); g.fillRect(x + 28, y + 52, 24, 8);
      } else if (b === 1) {
        g.strokeStyle = 'rgba(230,220,240,0.35)';
        for (let i = 0; i < 7; i++) {
          g.beginPath();
          g.arc(x + CW / 2, y + CH / 2, 6 + i * 7, 0, 7);
          g.stroke();
        }
        g.fillStyle = '#e8e2d4';
        g.fillRect(x + CW / 2 - 2, y + CH / 2 - 2, 4, 4);
      } else {
        g.fillStyle = '#3a4a2c';
        for (let yy = 0; yy < CH; yy += 12) {
          for (let xx = 0; xx < CW; xx += 12) {
            g.fillRect(x + xx + ((yy / 12) % 2 ? 6 : 0), y + yy, 6, 6);
          }
        }
        g.fillStyle = '#c8d86a';
        g.fillRect(x + 30, y + 46, 20, 20);
        g.fillStyle = '#20261c';
        g.fillRect(x + 36, y + 50, 8, 12);
      }
      g.restore();
      g.restore();
      return;
    }

    const L = laneVis(c.s);
    roundRect(x, y, CW, CH, 5);
    g.fillStyle = '#f2efe6';
    g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 1;
    g.stroke();

    /* corner index, top left and bottom right */
    g.fillStyle = L.c;
    g.font = 'bold 17px Georgia, serif';
    g.textAlign = 'left';
    g.fillText(RANK_TXT[c.r], x + 5, y + 19);
    laneIcon(x + 11, y + 31, 0.52, c.s, L.c);
    g.save();
    g.translate(x + CW, y + CH);
    g.rotate(Math.PI);
    g.fillStyle = L.c;
    g.fillText(RANK_TXT[c.r], 5, 19);
    laneIcon(11, 31, 0.52, c.s, L.c);
    g.restore();

    if (c.r === 1) {
      laneIcon(x + CW / 2, y + CH / 2, 1.9, c.s, L.c);
    } else if (c.r >= 11) {
      champArt(x + 16, y + 24, CW - 32, CH - 48, c.s, c.r - 11);
      g.strokeStyle = L.c;
      g.lineWidth = 2;
      g.strokeRect(x + 16, y + 24, CW - 32, CH - 48);
      g.fillStyle = L.c;
      g.fillRect(x + 16, y + CH - 26, CW - 32, 10);
      g.fillStyle = L.ink;
      g.font = '11px Georgia, serif';
      g.textAlign = 'center';
      g.fillText(L.champ, x + CW / 2, y + CH - 18);
      g.textAlign = 'left';
    } else {
      /* pips, laid out the way a real deck lays them out */
      const cols = [[0], [0], [0, 0], [0, 0, 0], [-1, 1, -1, 1], [-1, 1, -1, 1, 0],
        [-1, 1, -1, 1, -1, 1], [-1, 1, -1, 1, -1, 1, 0], [-1, 1, -1, 1, -1, 1, -1, 1],
        [-1, 1, -1, 1, -1, 1, -1, 1, 0], [-1, 1, -1, 1, -1, 1, -1, 1, 0, 0]][c.r];
      const rowsFor = {
        2: [[0, -1], [0, 1]], 3: [[0, -1], [0, 0], [0, 1]],
        4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
        5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
        6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
        7: [[-1, -1], [1, -1], [0, -0.5], [-1, 0], [1, 0], [-1, 1], [1, 1]],
        8: [[-1, -1], [1, -1], [0, -0.5], [-1, 0], [1, 0], [0, 0.5], [-1, 1], [1, 1]],
        9: [[-1, -1], [1, -1], [-1, -0.33], [1, -0.33], [0, 0], [-1, 0.33], [1, 0.33], [-1, 1], [1, 1]],
        10: [[-1, -1], [1, -1], [0, -0.66], [-1, -0.33], [1, -0.33], [-1, 0.33], [1, 0.33], [0, 0.66], [-1, 1], [1, 1]]
      };
      const pts = rowsFor[c.r] || [[0, 0]];
      pts.forEach(p => laneIcon(x + CW / 2 + p[0] * 18, y + CH / 2 + p[1] * 30, 0.62, c.s, L.c));
      void cols;
    }
    g.restore();
  }

  return { drawCard, roundRect, laneVis, laneIcon };
}
