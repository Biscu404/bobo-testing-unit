/* Bekkedal — the fishing gauge.
 *
 * Split out of `menus.js` for the same 300-line reason `menus_talk.js` and
 * `menus_chrome.js` already are — this one panel grew a second bar. `panel()`
 * itself is untouched: the fishing gauge stays the machine's own chrome, on
 * purpose, same as the HUD and the tooltip.
 *
 * The reel zone is the subtle one, worth reading before touching `drawFish`:
 * both it and the needle are `FISH_TRACK_W` times the same `z0`/`z1`/`pos`
 * figures `tickFish` (index.js) tests against, both edges rounded the same
 * way, or the drawn zone drifts a pixel off the real one — `layout_check.js`
 * asserts they agree. Full doctrine for the hold-to-reel mechanic itself is
 * under "Fishing" in `.claude/rules/bekkedal-content.md`.
 *
 * Same two conventions as `menus.js`: `GG()` rather than a captured context,
 * and `A`'s accessors (`S`, `fish`) read per call because the mode objects
 * beside `S` are replaced wholesale when a menu opens or closes.
 */
import { BEK_ITEMS } from './data.js';
import { CHOP_ZONE, CHOP_HEART } from './chop.js';
import { FONT_SM } from './font.js';
import { PAD_SM,
         FISH_TRACK_W, FISH_TRACK_H, FISH_W, FISH_H, FISH_X, FISH_Y,
         FISH_TRACK_X, FISH_TRACK_Y, FISH_PROG_Y, FISH_PROG_H,
         FISH_NEEDLE_W, FISH_NEEDLE_OVER } from './layout.js';

export function createFish(A, GG, C) {
  const { TX, panel, text } = A;

  function drawFish() {
    const fish = A.fish();
    const item = fish.sp && BEK_ITEMS[fish.sp];
    /* tier 2 legendary, 1 rare, 0 common, read everywhere below */
    const tier = item && item.legend ? 2 : item && item.rare ? 1 : 0;
    const tierCol = tier === 2 ? 3 : tier === 1 ? 11 : 14;
    panel(FISH_X, FISH_Y, FISH_W, FISH_H, tierCol);
    const tx = FISH_TRACK_X, ty = FISH_Y + PAD_SM;
    if (fish.phase === 'reel') {
      GG().fillStyle = C(8); GG().fillRect(tx, FISH_TRACK_Y, FISH_TRACK_W, FISH_TRACK_H);
      /* both edges round the same way the needle does, so the zone the
         player sees spans exactly what tickFish tests against — see the
         header above and layout_check.js's own assertion of it */
      const z0 = Math.round(FISH_TRACK_W * fish.z0);
      const zw = Math.max(FISH_NEEDLE_W, Math.round(FISH_TRACK_W * fish.z1) - z0);
      GG().fillStyle = C(tier === 2 ? 3 : tier === 1 ? 11 : 10); GG().fillRect(tx + z0, FISH_TRACK_Y, zw, FISH_TRACK_H);
      /* the needle warns the instant tension leaves the zone, not only once
         the grace timer runs out — a colour, not a countdown */
      const needleCol = fish.pos > fish.z1 ? 12 : fish.pos < fish.z0 ? 9 : 15;
      GG().fillStyle = C(needleCol);
      GG().fillRect(tx + Math.round(FISH_TRACK_W * fish.pos) - FISH_NEEDLE_W / 2,
                 FISH_TRACK_Y - FISH_NEEDLE_OVER, FISH_NEEDLE_W, FISH_TRACK_H + FISH_NEEDLE_OVER * 2);
      GG().fillStyle = C(8); GG().fillRect(tx, FISH_PROG_Y, FISH_TRACK_W, FISH_PROG_H);   /* how much is landed */
      GG().fillStyle = C(tierCol);
      GG().fillRect(tx, FISH_PROG_Y, Math.round(FISH_TRACK_W * Math.min(1, fish.prog)), FISH_PROG_H);
      const label = fish.pos > fish.z1 ? TX('SLIPP!', 'EASE OFF!') : fish.pos < fish.z0 ? TX('DRA INN!', 'REEL IN!') : TX('HOLD.', 'HOLD.');
      text(label, tx, ty, needleCol, FONT_SM);
    } else if (fish.phase === 'bite') {
      text(tier === 2 ? TX('LEGENDARISK! NÅ!', 'LEGENDARY! NOW!') : tier === 1 ? TX('SJELDEN! NÅ!', 'RARE! NOW!') : TX('NÅ! SPACE', 'NOW! SPACE'),
           tx, ty, tierCol, FONT_SM);
    } else text(TX('VENTER...', 'WAITING...'), tx, ty, 7, FONT_SM);
  }

  /* The felling bar (chop.js): the same panel as the gauge, a track with the pale stretch the blow bites in, its heart, and
     the mark sweeping across it, and one pip a point of cutting still to go. Both edges of the stretch are rounded the same
     way the mark is, so what is drawn is what `chopStrike` tests. */
  function drawChop() {
    const chop = A.chop();
    panel(FISH_X, FISH_Y, FISH_W, FISH_H, 10);
    const tx = FISH_TRACK_X, ty = FISH_Y + PAD_SM;
    GG().fillStyle = C(8); GG().fillRect(tx, FISH_TRACK_Y, FISH_TRACK_W, FISH_TRACK_H);
    const z0 = Math.round(FISH_TRACK_W * (chop.centre - CHOP_ZONE)), z1 = Math.round(FISH_TRACK_W * (chop.centre + CHOP_ZONE));
    GG().fillStyle = C(7); GG().fillRect(tx + z0, FISH_TRACK_Y, Math.max(FISH_NEEDLE_W, z1 - z0), FISH_TRACK_H);
    const h0 = Math.round(FISH_TRACK_W * (chop.centre - CHOP_HEART)), h1 = Math.round(FISH_TRACK_W * (chop.centre + CHOP_HEART));
    GG().fillStyle = C(15); GG().fillRect(tx + h0, FISH_TRACK_Y, Math.max(FISH_NEEDLE_W, h1 - h0), FISH_TRACK_H);
    const lock = chop.lock > 0;
    GG().fillStyle = C(lock ? 12 : 14);
    GG().fillRect(tx + Math.round(FISH_TRACK_W * chop.pos) - FISH_NEEDLE_W / 2,
                  FISH_TRACK_Y - FISH_NEEDLE_OVER, FISH_NEEDLE_W, FISH_TRACK_H + FISH_NEEDLE_OVER * 2);
    /* the tree, as pips: lit for what is cut, dark for what is left */
    const pw = Math.floor((FISH_TRACK_W - (chop.need - 1) * FISH_NEEDLE_W) / chop.need);
    for (let i = 0; i < chop.need; i++) {
      GG().fillStyle = C(i < chop.got ? 10 : 8);
      GG().fillRect(tx + i * (pw + FISH_NEEDLE_W), FISH_PROG_Y, pw, FISH_PROG_H);
    }
    text(lock ? TX('GLIPPET AV', 'GLANCED OFF') : TX('SLÅ NÅ', 'STRIKE'), tx, ty, lock ? 12 : 10, FONT_SM);
  }

  return { drawFish: drawFish, drawChop: drawChop };
}
