/* Bekkedal — what SPACE would do right now.
 *
 * Most of what this game lets you do is behind one key and a direction you are facing: SPACE at a person talks, at a door
 * opens it, at a plot works it with whatever is in your hand, at a bed sleeps. Nothing said so. A player found out by
 * pressing it at things, and some things (holding a gift out from the bag, then pressing SPACE at somebody) were not
 * findable at all: the bag showed a list and a cursor, SPACE did something invisible to it, and the only sign that anything
 * had happened was a line that went by at the bottom of the screen.
 *
 * So the HUD says. `hintFor(c)` is pure, in the way `schedule.js` is: it is handed what the frame already knows about the
 * square in front of you and answers with the one line that tells you what SPACE will do there, or null if the answer is
 * "nothing". It is the rules of act() in index.js read as questions, never as actions, and it stays beside them on purpose:
 * `hint_check.js` walks the same cases and fails if a thing act() answers has no line here.
 *
 *   c = { tile, map, tool, who: { id, n, bear, gift } | null, giftSel, giftName, animal, placed, ready,
 *         soil: { till, seed, ready, wet } | null, hasSeed, canGive, water, door, furn }
 */

/* the two lines that tell you the other half of a gift: the bag picks it, the person takes it */
export const GIFT_HELP = {
  open: { no: 'SPACE: HOLD UT SOM GAVE   PILER: VELG   ESC: LUKK', en: 'SPACE: HOLD IT OUT AS A GIFT   ARROWS: PICK   ESC: CLOSE' },
  place: { no: 'SPACE: SETT DEN UT   PILER: VELG   ESC: LUKK', en: 'SPACE: PLACE IT   ARROWS: PICK   ESC: CLOSE' },
  holding: { no: 'DU HOLDER DEN FRAM. SPACE: LEGG DEN BORT. LUKK SEKKEN OG SNU DEG MOT NOEN.', en: 'HELD OUT. SPACE: PUT IT AWAY. THEN CLOSE THE BAG AND FACE SOMEONE.' }
};

const L = (no, en) => ({ no, en });

export function hintFor(c) {
  if (!c) return null;
  const who = c.who;
  if (who) {
    if (who.bear) return L('SPACE: HILS PÅ BJØRNEN', 'SPACE: SAY HELLO TO THE BEAR');
    if (c.giftSel && who.gift) return L('SPACE: GI ' + c.giftName.no + ' TIL ' + who.n, 'SPACE: GIVE ' + c.giftName.en + ' TO ' + who.n);
    return L('SPACE: SNAKK MED ' + who.n + (c.canGive ? '   (I: HOLD FRAM EN GAVE)' : ''), 'SPACE: TALK TO ' + who.n + (c.canGive ? '   (I: HOLD OUT A GIFT)' : ''));
  }
  if (c.animal) return L('SPACE: STELL DYRET', 'SPACE: TEND THE ANIMAL');
  /* a thing in a house that answers (furniture_act.js's FURN): the line it names for itself */
  if (c.furn) return c.furn;
  const t = c.tile;
  if (t === 'b') return L('SPACE: SOV', 'SPACE: SLEEP');
  if (t === 'J') return L('SPACE: SETT DEG', 'SPACE: SIT DOWN');
  if (t === 'D') return c.door ? L('SPACE: GÅ INN', 'SPACE: GO IN') : L('SPACE: DØREN ER LÅST', 'SPACE: THE DOOR IS LOCKED');
  if (t === 'S') return c.map === 'lake' ? L('SPACE: SE PÅ TOMTEN', 'SPACE: LOOK AT THE LOT') : L('SPACE: LES OPPSLAGET (Q)', 'SPACE: READ THE NOTICE (Q)');
  if (t === 'K') return c.map === 'loftet' ? L('SPACE: ÅPNE LOFTET (L)', 'SPACE: OPEN THE LOFT (L)') : L('SPACE: ÅPNE VERKSTEDET', 'SPACE: OPEN THE WORKSHOP');
  if (t === 'v') return L('SPACE: RAK ASKEN', 'SPACE: RAKE THE ASH');
  if (c.placed) return L('SPACE: PLUKK OPP', 'SPACE: PICK IT UP');
  if (t === 'o' || t === 'W' || t === '~') {
    if (c.tool === 'stang' && t === 'W') return L('SPACE: KAST UT', 'SPACE: CAST THE LINE');
    return L('SPACE: FYLL KANNEN', 'SPACE: FILL THE CAN');
  }
  if (t === 'p' && c.ready) return L('SPACE: PLUKK BLOMSTEN', 'SPACE: PICK THE FLOWER');
  /* a tool only has a line where it has a use: anywhere else the squares below still get their say (F sows with whatever is in the hand) */
  if (c.tool === 'stang' && t === 'W') return L('SPACE: KAST UT', 'SPACE: CAST THE LINE');
  if (c.tool === 'oks' && (t === 'Y' || t === 'G')) return L('SPACE: FELL TREET', 'SPACE: FELL THE TREE');
  if (c.tool === 'hakke' && (t === 'O' || t === 'Q')) return L('SPACE: HUGG UT MALMEN', 'SPACE: MINE THE ORE');
  if (t === 'f') {
    const s = c.soil;
    if (s && s.ready) return L('SPACE: HØST', 'SPACE: HARVEST');
    if (c.tool === 'spade') return s && s.till ? null : L('SPACE: SPADD JORDEN', 'SPACE: DIG THE SOIL');
    if (c.tool === 'kanne') return s && s.till ? (s.wet ? null : L('SPACE: VANN JORDEN', 'SPACE: WATER THE SOIL')) : L('SPACE: SPADD FØRST', 'SPACE: DIG IT FIRST');
    if (s && s.till && !s.seed && c.hasSeed) return L('F: SÅ FRØ', 'F: SOW A SEED');
  }
  return null;
}

/* whatever is held out in the hand, as the line the HUD keeps up for as long as it is: the thing you did and cannot see */
export function holdingLine(giftName) {
  return { no: 'HOLDER FRAM ' + giftName.no + ' — SNU DEG MOT NOEN OG TRYKK SPACE', en: 'HOLDING OUT ' + giftName.en + ' — FACE SOMEONE AND PRESS SPACE' };
}
